-- Add column for manual PIC names (for names not in employee database)
ALTER TABLE public.rundown_items 
ADD COLUMN IF NOT EXISTS pic_manual text[] DEFAULT '{}';