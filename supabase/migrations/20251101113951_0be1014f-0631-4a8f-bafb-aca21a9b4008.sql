-- Fix search_path for the get_next_tim_upk_for_plh function
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
  SELECT id INTO next_upk_id
  FROM tim_upk
  ORDER BY 
    assignment_count ASC,
    COALESCE(last_assigned_at, '1970-01-01'::timestamp with time zone) ASC
  LIMIT 1;
  
  RETURN next_upk_id;
END;
$$;