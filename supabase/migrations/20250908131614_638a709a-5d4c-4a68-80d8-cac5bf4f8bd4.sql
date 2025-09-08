-- Update VIP level calculation with new thresholds
CREATE OR REPLACE FUNCTION public.calculate_vip_level(total_deposits numeric, total_earnings numeric)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    total_amount numeric;
BEGIN
    total_amount := total_deposits + total_earnings;
    
    -- New VIP level thresholds
    IF total_amount >= 3000 THEN
        RETURN 5; -- Super VVIP
    ELSIF total_amount >= 500.5 THEN
        RETURN 4; -- Super VIP  
    ELSIF total_amount >= 200.5 THEN
        RETURN 3; -- VVIP
    ELSIF total_amount >= 100.05 THEN
        RETURN 2; -- VIP
    ELSIF total_amount >= 40.5 THEN
        RETURN 1; -- Level 1
    ELSE
        RETURN 0; -- Standard
    END IF;
END;
$$;

-- Create function to generate dynamic task rewards based on VIP level
CREATE OR REPLACE FUNCTION public.generate_task_reward(user_vip_level integer)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    reward_amount numeric;
    random_val float;
BEGIN
    random_val := random();
    
    CASE user_vip_level
        WHEN 5 THEN -- Super VVIP (3000+): $50-$200+ (high probability $50-200)
            IF random_val < 0.7 THEN
                reward_amount := 50 + (random() * 150); -- $50-200
            ELSE
                reward_amount := 200 + (random() * 100); -- $200-300
            END IF;
            
        WHEN 4 THEN -- Super VIP (500.5-3000): $10-40 (high probability $10-20)
            IF random_val < 0.7 THEN
                reward_amount := 10 + (random() * 10); -- $10-20
            ELSE
                reward_amount := 20 + (random() * 20); -- $20-40
            END IF;
            
        WHEN 3 THEN -- VVIP (200.5-500): $4-20 (high probability $4-10)
            IF random_val < 0.7 THEN
                reward_amount := 4 + (random() * 6); -- $4-10
            ELSE
                reward_amount := 10 + (random() * 10); -- $10-20
            END IF;
            
        WHEN 2 THEN -- VIP (100.05-200): $1-2.20 randomly
            reward_amount := 1 + (random() * 1.20); -- $1-2.20
            
        WHEN 1 THEN -- Level 1 (40.5-100): Same as Standard
            IF random_val < 0.7 THEN
                reward_amount := 0.10 + (random() * 0.40); -- $0.10-0.50 (high probability)
            ELSE
                reward_amount := 0.50 + (random() * 0.70); -- $0.50-1.20
            END IF;
            
        ELSE -- Standard (0-40): $0.10-1.20 (high probability $0.10-0.50)
            IF random_val < 0.7 THEN
                reward_amount := 0.10 + (random() * 0.40); -- $0.10-0.50 (high probability)
            ELSE
                reward_amount := 0.50 + (random() * 0.70); -- $0.50-1.20
            END IF;
    END CASE;
    
    -- Round to 2 decimal places
    RETURN ROUND(reward_amount, 2);
END;
$$;