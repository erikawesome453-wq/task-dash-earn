-- Update referral bonus from $1 to $5
UPDATE public.profiles 
SET 
    referral_earnings = referral_earnings + 4.00,
    wallet_balance = wallet_balance + 4.00
WHERE user_id IN (
    SELECT referrer_id FROM public.referrals
);

-- Update existing referral transactions to reflect $5 bonus
UPDATE public.wallet_transactions 
SET 
    amount = 5.00,
    description = 'Referral bonus for new user signup ($5)'
WHERE transaction_type = 'referral_bonus' AND amount = 1.00;

-- Update handle_new_user function with $5 referral bonus
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
        
        -- Update referrer stats and add $5 bonus
        UPDATE public.profiles 
        SET 
            total_referrals = total_referrals + 1,
            referral_earnings = referral_earnings + 5.00,
            wallet_balance = wallet_balance + 5.00
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
            5.00, 
            'Referral bonus for new user signup ($5)'
        );
    END IF;
    
    RETURN NEW;
END;
$$;