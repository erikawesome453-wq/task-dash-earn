-- Update the admin user's role
-- First, we need to find the user_id for admin@admin.com from the profiles table
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@admin.com';

-- If the profile doesn't exist yet, this function will help create it with admin role
CREATE OR REPLACE FUNCTION public.ensure_admin_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find user_id from auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@admin.com'
  LIMIT 1;
  
  -- If user exists, update their role
  IF admin_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE user_id = admin_user_id;
  END IF;
END;
$$;

-- Run the function to ensure admin role is set
SELECT public.ensure_admin_role();