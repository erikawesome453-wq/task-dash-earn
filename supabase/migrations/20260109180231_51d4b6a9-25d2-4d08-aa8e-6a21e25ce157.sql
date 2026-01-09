-- Fix overly permissive RLS policy on referrals table
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;

-- Create a more restrictive policy - only allow inserting referrals where:
-- 1. The referred_id is the current authenticated user (for self-referral prevention handled in app)
-- OR the insert is done by an admin
CREATE POLICY "Users can be referred" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = referred_id OR is_admin(auth.uid())
  );

-- Create a database function to update referrer stats
CREATE OR REPLACE FUNCTION public.update_referrer_stats(referrer_user_id uuid, bonus_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    total_referrals = total_referrals + 1,
    referral_earnings = referral_earnings + bonus_amount,
    wallet_balance = wallet_balance + bonus_amount,
    updated_at = now()
  WHERE user_id = referrer_user_id;
  
  -- Log the referral bonus transaction
  INSERT INTO public.wallet_transactions (
    user_id,
    transaction_type,
    amount,
    description,
    status
  ) VALUES (
    referrer_user_id,
    'referral_bonus',
    bonus_amount,
    'Referral bonus for new user signup',
    'completed'
  );
END;
$$;