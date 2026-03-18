-- Create digital_footprint_tasks table for storing user tasks
CREATE TABLE IF NOT EXISTS public.digital_footprint_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  user_name TEXT,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_digital_footprint_tasks_user_id ON public.digital_footprint_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_footprint_tasks_created_at ON public.digital_footprint_tasks(created_at DESC);

-- Enable RLS
ALTER TABLE public.digital_footprint_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all tasks" ON public.digital_footprint_tasks
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own tasks" ON public.digital_footprint_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON public.digital_footprint_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON public.digital_footprint_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.digital_footprint_tasks TO authenticated;
GRANT ALL ON public.digital_footprint_tasks TO service_role;

COMMENT ON TABLE public.digital_footprint_tasks IS 'Stores user task checklists for digital footprint tracking';
