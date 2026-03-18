-- ============================================
-- Auto-assign Tim UPK for PLH/PLT entries
-- ============================================

-- Create trigger function to auto-assign Tim UPK for new PLH/PLT entries
CREATE OR REPLACE FUNCTION auto_assign_tim_upk_plh()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_upk_id uuid;
BEGIN
  -- Only auto-assign if not manually assigned and no UPK is assigned yet
  IF NEW.assigned_upk_id IS NULL AND (NEW.assigned_upk_manually IS NULL OR NEW.assigned_upk_manually = false) THEN
    -- Get next Tim UPK using the FIFO distribution function
    next_upk_id := get_next_tim_upk_for_plh();
    
    -- Assign the Tim UPK
    NEW.assigned_upk_id := next_upk_id;
    NEW.assigned_upk_at := NOW();
    NEW.assigned_upk_manually := false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_assign_tim_upk_plh ON plh_kepala;

-- Create trigger for auto-assigning Tim UPK on INSERT
CREATE TRIGGER trigger_auto_assign_tim_upk_plh
BEFORE INSERT ON plh_kepala
FOR EACH ROW
EXECUTE FUNCTION auto_assign_tim_upk_plh();

COMMENT ON FUNCTION auto_assign_tim_upk_plh() IS 'Automatically assigns Tim UPK member to new PLH/PLT entries using FIFO distribution';
COMMENT ON TRIGGER trigger_auto_assign_tim_upk_plh ON plh_kepala IS 'Trigger to auto-assign Tim UPK for new PLH/PLT entries';

-- ============================================
-- Reset agenda number sequence to start from 1
-- ============================================

-- Reset the sequence for plh_kepala agenda numbers
ALTER SEQUENCE IF EXISTS plh_kepala_agenda_number_seq RESTART WITH 1;

COMMENT ON SEQUENCE plh_kepala_agenda_number_seq IS 'Sequence for PLH/PLT agenda numbers, reset to start from 1';