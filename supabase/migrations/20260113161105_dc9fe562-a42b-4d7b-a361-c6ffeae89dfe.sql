-- Fix the foreign key constraint on monitor_pbdk table to use ON DELETE SET NULL
-- This prevents errors when deleting employees that are referenced in monitor_pbdk

-- First drop the existing constraint
ALTER TABLE public.monitor_pbdk DROP CONSTRAINT IF EXISTS monitor_pbdk_employee_id_fkey;

-- Re-add the constraint with SET NULL on delete
ALTER TABLE public.monitor_pbdk 
ADD CONSTRAINT monitor_pbdk_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES public.employees(id) 
ON DELETE SET NULL;