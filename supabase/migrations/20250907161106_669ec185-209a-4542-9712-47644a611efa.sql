-- Fix search path security issues for functions
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.calculate_vip_level(total_deposits numeric, total_earnings numeric)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.get_daily_task_limit(vip_level integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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