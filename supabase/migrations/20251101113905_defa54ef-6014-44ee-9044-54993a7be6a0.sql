-- Add agenda_number and UPK assignment fields to plh_kepala table
ALTER TABLE plh_kepala ADD COLUMN IF NOT EXISTS agenda_number SERIAL;
ALTER TABLE plh_kepala ADD COLUMN IF NOT EXISTS assigned_upk_id uuid REFERENCES tim_upk(id);
ALTER TABLE plh_kepala ADD COLUMN IF NOT EXISTS assigned_upk_at timestamp with time zone;
ALTER TABLE plh_kepala ADD COLUMN IF NOT EXISTS assigned_upk_manually boolean DEFAULT false;

-- Change employee_ids from array to single uuid (for single selection)
-- First, we need to handle existing data
ALTER TABLE plh_kepala ADD COLUMN IF NOT EXISTS employee_id uuid;

-- Create function to get next Tim UPK for PLH if it doesn't exist
CREATE OR REPLACE FUNCTION get_next_tim_upk_for_plh()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_upk_id uuid;
BEGIN
  -- Get the Tim UPK member with the least assignments or oldest last assignment
  SELECT id INTO next_upk_id
  FROM tim_upk
  ORDER BY 
    assignment_count ASC,
    COALESCE(last_assigned_at, '1970-01-01'::timestamp with time zone) ASC
  LIMIT 1;
  
  RETURN next_upk_id;
END;
$$;