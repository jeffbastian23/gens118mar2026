-- Function to assign role to user by email
CREATE OR REPLACE FUNCTION assign_role_by_email(user_email TEXT, user_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user by email from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User with email % not found', user_email;
    RETURN;
  END IF;
  
  -- Insert or update role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Role % assigned to user %', user_role, user_email;
END;
$$;

-- Assign roles to specific users
-- Make sure these users have signed up first!
SELECT assign_role_by_email('duana.pahlawan@kemenkeu.go.id', 'admin');
SELECT assign_role_by_email('jeffry.subastian@kemenkeu.go.id', 'user');
