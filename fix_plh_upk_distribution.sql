-- Fix get_next_tim_upk_for_plh to properly update assignment count for FIFO distribution
-- This ensures Tim UPK assignments are distributed evenly across all team members
-- instead of always going to the same person

CREATE OR REPLACE FUNCTION get_next_tim_upk_for_plh()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_upk_id uuid;
BEGIN
  -- Get the Tim UPK member with the least assignments or oldest last assignment
  -- This ensures fair FIFO (First In First Out) distribution
  SELECT id INTO next_upk_id
  FROM tim_upk
  ORDER BY 
    assignment_count ASC,
    COALESCE(last_assigned_at, '1970-01-01'::timestamp with time zone) ASC
  LIMIT 1;
  
  -- Update the assignment count and last assigned time
  -- This is critical for FIFO distribution to work properly
  UPDATE tim_upk
  SET 
    assignment_count = assignment_count + 1,
    last_assigned_at = NOW()
  WHERE id = next_upk_id;
  
  RETURN next_upk_id;
END;
$$;

COMMENT ON FUNCTION get_next_tim_upk_for_plh() IS 'Returns next Tim UPK member ID for PLH/PLT assignments using FIFO with equal distribution';
