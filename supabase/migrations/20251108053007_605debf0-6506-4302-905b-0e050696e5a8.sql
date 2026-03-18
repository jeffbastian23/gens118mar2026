-- Function to create notification for tracking status changes
CREATE OR REPLACE FUNCTION public.create_tracking_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment assignments%ROWTYPE;
  v_upk_user_id uuid;
  v_creator_user_id uuid;
  v_notification_title text;
  v_notification_message text;
BEGIN
  -- Get the full assignment record
  SELECT * INTO v_assignment FROM assignments WHERE id = NEW.id;
  
  -- Case 1: When status changes to "Proses ND" (proses_nd_at is set)
  IF NEW.proses_nd_at IS NOT NULL AND (OLD.proses_nd_at IS NULL OR OLD.proses_nd_at IS DISTINCT FROM NEW.proses_nd_at) THEN
    -- Get the assigned UPK user ID from tim_upk table
    IF v_assignment.assigned_upk_id IS NOT NULL THEN
      SELECT user_id INTO v_upk_user_id 
      FROM profiles 
      WHERE email = (SELECT email FROM tim_upk WHERE id = v_assignment.assigned_upk_id);
      
      IF v_upk_user_id IS NOT NULL THEN
        v_notification_title := 'Proses ND - Agenda #' || v_assignment.agenda_number;
        v_notification_message := 'Penugasan dengan perihal "' || v_assignment.perihal || '" telah masuk ke tahap Proses ND.';
        
        -- Create notification for UPK admin
        INSERT INTO notifications (user_id, title, message, assignment_id, is_read)
        VALUES (v_upk_user_id, v_notification_title, v_notification_message, NEW.id, false);
      END IF;
    END IF;
  END IF;
  
  -- Case 2: When status changes to "Selesai" (selesai_at is set) 
  -- Notify the creator of the assignment
  IF NEW.selesai_at IS NOT NULL AND (OLD.selesai_at IS NULL OR OLD.selesai_at IS DISTINCT FROM NEW.selesai_at) THEN
    -- Get the creator user ID from profiles table using email
    IF v_assignment.created_by_email IS NOT NULL THEN
      SELECT user_id INTO v_creator_user_id 
      FROM profiles 
      WHERE email = v_assignment.created_by_email;
      
      IF v_creator_user_id IS NOT NULL THEN
        v_notification_title := 'Penugasan Selesai - Agenda #' || v_assignment.agenda_number;
        v_notification_message := 'Penugasan dengan perihal "' || v_assignment.perihal || '" telah selesai diproses.';
        
        -- Create notification for creator
        INSERT INTO notifications (user_id, title, message, assignment_id, is_read)
        VALUES (v_creator_user_id, v_notification_title, v_notification_message, NEW.id, false);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_tracking_notification ON assignments;

-- Create trigger for tracking status changes
CREATE TRIGGER trigger_tracking_notification
AFTER INSERT OR UPDATE OF proses_nd_at, selesai_at ON assignments
FOR EACH ROW
EXECUTE FUNCTION public.create_tracking_notification();