-- Assign roles to existing users
-- Make sure the users have signed up first!

-- Assign Admin role to duana.pahlawan@kemenkeu.go.id
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'duana.pahlawan@kemenkeu.go.id'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign User role to jeffri.subastian@kemenkeu.go.id
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role
FROM auth.users
WHERE email = 'jeffri.subastian@kemenkeu.go.id'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the roles have been assigned
SELECT 
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN ('duana.pahlawan@kemenkeu.go.id', 'jeffri.subastian@kemenkeu.go.id')
ORDER BY u.email;
