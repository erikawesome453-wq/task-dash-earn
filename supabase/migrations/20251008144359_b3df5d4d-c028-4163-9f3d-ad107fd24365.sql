-- Create trigger to auto-create profiles on new auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger to update wallet and log transaction when a task is completed
DROP TRIGGER IF EXISTS on_user_task_insert ON public.user_tasks;
CREATE TRIGGER on_user_task_insert
AFTER INSERT ON public.user_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_wallet_on_task_completion();

-- Ensure one profile per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_unique'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;