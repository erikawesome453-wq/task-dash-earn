-- Add VIP level and referral fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN vip_level integer NOT NULL DEFAULT 0,
ADD COLUMN total_deposited numeric NOT NULL DEFAULT 0.00,
ADD COLUMN total_earned numeric NOT NULL DEFAULT 0.00,
ADD COLUMN referral_code text UNIQUE,
ADD COLUMN referred_by_code text,
ADD COLUMN total_referrals integer NOT NULL DEFAULT 0,
ADD COLUMN referral_earnings numeric NOT NULL DEFAULT 0.00,
ADD COLUMN join_date timestamp with time zone NOT NULL DEFAULT now(),
ADD COLUMN email text,
ADD COLUMN phone text,
ADD COLUMN payment_method text DEFAULT 'mobile_money';

-- Create referrals table
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_earned numeric NOT NULL DEFAULT 1.00,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type text NOT NULL, -- 'deposit', 'withdraw', 'task_reward', 'referral_bonus'
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'rejected'
  payment_method text,
  payment_details jsonb,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals as referrer" 
ON public.referrals 
FOR SELECT 
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view their own referrals as referred" 
ON public.referrals 
FOR SELECT 
USING (auth.uid() = referred_id);

CREATE POLICY "System can insert referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all referrals" 
ON public.referrals 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS policies for wallet_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" 
ON public.wallet_transactions 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create function to generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    code text;
BEGIN
    -- Generate a 6-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists, regenerate if needed
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code) LOOP
        code := upper(substring(md5(random()::text) from 1 for 6));
    END LOOP;
    
    RETURN code;
END;
$$;

-- Update handle_new_user function to include referral code and email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    referrer_user_id uuid;
    ref_code text;
BEGIN
    -- Generate referral code
    ref_code := generate_referral_code();
    
    -- Get referral code from metadata if exists
    IF NEW.raw_user_meta_data ? 'referral_code' THEN
        -- Find referrer by code
        SELECT user_id INTO referrer_user_id 
        FROM public.profiles 
        WHERE referral_code = (NEW.raw_user_meta_data->>'referral_code');
    END IF;
    
    -- Insert profile
    INSERT INTO public.profiles (
        user_id, 
        username, 
        email,
        referral_code,
        referred_by_code
    )
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.email,
        ref_code,
        NEW.raw_user_meta_data->>'referral_code'
    );
    
    -- Process referral if referrer exists
    IF referrer_user_id IS NOT NULL THEN
        -- Insert referral record
        INSERT INTO public.referrals (referrer_id, referred_id)
        VALUES (referrer_user_id, NEW.id);
        
        -- Update referrer stats and add bonus
        UPDATE public.profiles 
        SET 
            total_referrals = total_referrals + 1,
            referral_earnings = referral_earnings + 1.00,
            wallet_balance = wallet_balance + 1.00
        WHERE user_id = referrer_user_id;
        
        -- Log referral transaction
        INSERT INTO public.wallet_transactions (
            user_id, 
            transaction_type, 
            amount, 
            description
        )
        VALUES (
            referrer_user_id, 
            'referral_bonus', 
            1.00, 
            'Referral bonus for new user signup'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for wallet transactions updated_at
CREATE TRIGGER update_wallet_transactions_updated_at
BEFORE UPDATE ON public.wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate VIP level based on deposits and earnings
CREATE OR REPLACE FUNCTION public.calculate_vip_level(total_deposits numeric, total_earnings numeric)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
    -- VIP levels based on total deposits + earnings
    IF (total_deposits + total_earnings) >= 500 THEN
        RETURN 5; -- VIP 5
    ELSIF (total_deposits + total_earnings) >= 200 THEN
        RETURN 4; -- VIP 4
    ELSIF (total_deposits + total_earnings) >= 100 THEN
        RETURN 3; -- VIP 3
    ELSIF (total_deposits + total_earnings) >= 50 THEN
        RETURN 2; -- VIP 2
    ELSIF (total_deposits + total_earnings) >= 20 THEN
        RETURN 1; -- VIP 1
    ELSE
        RETURN 0; -- Standard
    END IF;
END;
$$;

-- Function to get daily task limit based on VIP level
CREATE OR REPLACE FUNCTION public.get_daily_task_limit(vip_level integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
    CASE vip_level
        WHEN 5 THEN RETURN 30;
        WHEN 4 THEN RETURN 25;
        WHEN 3 THEN RETURN 20;
        WHEN 2 THEN RETURN 15;
        WHEN 1 THEN RETURN 10;
        ELSE RETURN 5;
    END CASE;
END;
$$;