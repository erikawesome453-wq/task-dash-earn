-- Ensure function to update wallet is secure and has fixed search_path
CREATE OR REPLACE FUNCTION public.update_wallet_on_task_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Update the user's wallet balance and total earned
  UPDATE public.profiles 
  SET 
    wallet_balance = wallet_balance + NEW.reward_earned,
    total_earned = total_earned + NEW.reward_earned,
    updated_at = now()
  WHERE user_id = NEW.user_id;

  -- Insert transaction record (idempotency not guaranteed, but fine per insert)
  INSERT INTO public.wallet_transactions (
    user_id,
    transaction_type,
    amount,
    description,
    status
  ) VALUES (
    NEW.user_id,
    'earning',
    NEW.reward_earned,
    'Task completion reward',
    'completed'
  );

  RETURN NEW;
END;
$$;

-- Create the trigger on user_tasks (drop first for idempotency)
DROP TRIGGER IF EXISTS trigger_update_wallet_on_task_completion ON public.user_tasks;
CREATE TRIGGER trigger_update_wallet_on_task_completion
AFTER INSERT ON public.user_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_wallet_on_task_completion();

-- Ensure new users get a profile via auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- One-time sync: reconcile wallet balances with historical user_tasks
WITH totals AS (
  SELECT user_id, COALESCE(SUM(reward_earned), 0)::numeric AS total_rewards
  FROM public.user_tasks
  GROUP BY user_id
)
UPDATE public.profiles p
SET wallet_balance = t.total_rewards,
    total_earned   = t.total_rewards,
    updated_at     = now()
FROM totals t
WHERE p.user_id = t.user_id;