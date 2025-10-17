-- Create enum for application roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table to store user roles
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update is_admin function to use has_role
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(user_uuid, 'admin');
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update handle_new_user function to assign roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    referrer_user_id uuid;
    ref_code text;
    is_admin_email boolean;
BEGIN
    -- Determine if this is the admin account
    is_admin_email := lower(NEW.email) = 'admin@admin.com';

    -- Generate referral code
    ref_code := generate_referral_code();
    
    -- Get referral code from metadata if exists
    IF NEW.raw_user_meta_data ? 'referral_code' THEN
        SELECT user_id INTO referrer_user_id 
        FROM public.profiles 
        WHERE referral_code = (NEW.raw_user_meta_data->>'referral_code');
    END IF;
    
    -- Insert profile with $5 bonus if referred
    INSERT INTO public.profiles (
        user_id, 
        username, 
        email,
        referral_code,
        referred_by_code,
        wallet_balance,
        role
    )
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.email,
        ref_code,
        NEW.raw_user_meta_data->>'referral_code',
        CASE WHEN referrer_user_id IS NOT NULL THEN 5.00 ELSE 0.00 END,
        CASE WHEN is_admin_email THEN 'admin' ELSE 'user' END
    );

    -- Assign roles in user_roles table
    IF is_admin_email THEN
        -- Admin gets both admin and user roles
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
    ELSE
        -- Regular users get user role
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
    END IF;
    
    -- Process referral if referrer exists
    IF referrer_user_id IS NOT NULL THEN
        INSERT INTO public.referrals (referrer_id, referred_id, bonus_earned)
        VALUES (referrer_user_id, NEW.id, 10.00);
        
        UPDATE public.profiles 
        SET 
            total_referrals = total_referrals + 1,
            referral_earnings = referral_earnings + 10.00,
            wallet_balance = wallet_balance + 10.00
        WHERE user_id = referrer_user_id;
        
        INSERT INTO public.wallet_transactions (
            user_id, 
            transaction_type, 
            amount, 
            description
        )
        VALUES (
            referrer_user_id, 
            'referral_bonus', 
            10.00, 
            'Referral bonus for new user signup ($10)'
        );
        
        INSERT INTO public.wallet_transactions (
            user_id, 
            transaction_type, 
            amount, 
            description
        )
        VALUES (
            NEW.id, 
            'signup_bonus', 
            5.00, 
            'Welcome bonus for joining via referral ($5)'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Migrate existing admin user to new system
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'admin@admin.com'
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Add admin role if not exists
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Add user role if not exists
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'user')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;