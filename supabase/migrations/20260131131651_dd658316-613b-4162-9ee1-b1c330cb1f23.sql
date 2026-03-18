-- Add manual_employees column to store manually entered employee data as JSON
ALTER TABLE public.assignments
ADD COLUMN manual_employees JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.assignments.manual_employees IS 'Stores manually entered employee data as JSON array: [{nama, pangkat, jabatan}]';