-- Update the referral bonus system: $5 for new user, $10 for referrer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    
    -- Insert profile with $5 bonus if referred
    INSERT INTO public.profiles (
        user_id, 
        username, 
        email,
        referral_code,
        referred_by_code,
        wallet_balance
    )
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.email,
        ref_code,
        NEW.raw_user_meta_data->>'referral_code',
        CASE WHEN referrer_user_id IS NOT NULL THEN 5.00 ELSE 0.00 END
    );
    
    -- Process referral if referrer exists
    IF referrer_user_id IS NOT NULL THEN
        -- Insert referral record with $10 bonus for referrer
        INSERT INTO public.referrals (referrer_id, referred_id, bonus_earned)
        VALUES (referrer_user_id, NEW.id, 10.00);
        
        -- Update referrer stats and add $10 bonus
        UPDATE public.profiles 
        SET 
            total_referrals = total_referrals + 1,
            referral_earnings = referral_earnings + 10.00,
            wallet_balance = wallet_balance + 10.00
        WHERE user_id = referrer_user_id;
        
        -- Log referral transaction for referrer
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
        
        -- Log signup bonus transaction for new user
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
$function$;