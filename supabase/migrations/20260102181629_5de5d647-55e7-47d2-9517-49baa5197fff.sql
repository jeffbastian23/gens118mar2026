-- Update existing sapu_jagat roles to super
UPDATE public.user_roles SET role = 'super' WHERE role = 'sapu_jagat';