-- Create Tim UPK table
CREATE TABLE IF NOT EXISTS public.tim_upk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  assignment_count integer NOT NULL DEFAULT 0,
  last_assigned_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tim_upk ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read Tim UPK data
CREATE POLICY "Allow authenticated users to read tim_upk"
ON public.tim_upk
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage Tim UPK
CREATE POLICY "Only admins can manage tim_upk"
ON public.tim_upk
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add Tim UPK assignment columns to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS assigned_upk_id uuid REFERENCES public.tim_upk(id),
ADD COLUMN IF NOT EXISTS assigned_upk_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS assigned_upk_manually boolean DEFAULT false;

-- Insert Tim UPK members from the Excel file
INSERT INTO public.tim_upk (name, email) VALUES
  ('Bella Atria', 'bella.atria@kemenkeu.go.id'),
  ('Duana Jerry Pahlawan', 'duana.pahlawan@kemenkeu.go.id'),
  ('Fakhrunnisa', 'fakhrunnisa@kemenkeu.go.id'),
  ('Izdhihar Rayhanah', 'izdhihar.rayhanah@kemenkeu.go.id'),
  ('Kiflan Aria Yudha', 'kiflan.aria@kemenkeu.go.id'),
  ('Kresnawan Dwi Aprianto', 'kresnawan.aprianto@kemenkeu.go.id'),
  ('Muhammad Rizal Arfan Afiat', 'rizal.afiat@kemenkeu.go.id'),
  ('Prima Ageng Nugraha', 'prima.ageng@kemenkeu.go.id'),
  ('Ahmad Saifuddin Zuhri', 'ahmad.saifuddin@kemenkeu.go.id')
ON CONFLICT (email) DO NOTHING;

-- Create function to get next Tim UPK member using FIFO
CREATE OR REPLACE FUNCTION public.get_next_tim_upk()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_upk_id uuid;
BEGIN
  -- Get Tim UPK with lowest assignment count, and if tied, the one assigned longest ago
  SELECT id INTO next_upk_id
  FROM public.tim_upk
  ORDER BY 
    assignment_count ASC,
    COALESCE(last_assigned_at, '1970-01-01'::timestamp) ASC
  LIMIT 1;
  
  -- Update the assignment count and last assigned time
  UPDATE public.tim_upk
  SET 
    assignment_count = assignment_count + 1,
    last_assigned_at = now(),
    updated_at = now()
  WHERE id = next_upk_id;
  
  RETURN next_upk_id;
END;
$$;

-- Create trigger to update tim_upk updated_at
CREATE TRIGGER update_tim_upk_updated_at
BEFORE UPDATE ON public.tim_upk
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.tim_upk IS 'Tim UPK members who help process Surat Tugas documents';
COMMENT ON FUNCTION public.get_next_tim_upk() IS 'Returns next Tim UPK member ID using FIFO with equal distribution';