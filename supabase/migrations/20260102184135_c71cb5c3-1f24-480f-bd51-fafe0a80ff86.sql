-- Clean up duplicate roles - keep only the most recent one per user
DELETE FROM public.user_roles
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM public.user_roles
    ORDER BY user_id, id DESC
);

-- Add unique constraint on user_id if not exists
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_roles_user_id_key'
    ) THEN
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
    END IF;
END $$;