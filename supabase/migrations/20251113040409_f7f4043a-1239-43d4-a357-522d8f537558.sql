-- Security Fix: Remove public read access and fix security issues
-- This migration addresses critical security findings

-- ============================================
-- 1. FIX ASSIGNMENTS TABLE - Remove public access
-- ============================================
DROP POLICY IF EXISTS "Allow public read access to assignments" ON public.assignments;

-- ============================================
-- 2. FIX PLH_KEPALA TABLE - Remove public access (if exists)
-- ============================================
DROP POLICY IF EXISTS "Allow public read access to plh_kepala" ON public.plh_kepala;

CREATE POLICY "Authenticated users can view plh_kepala"
ON public.plh_kepala
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 3. FIX PENSIUN TABLE - Remove public access (if exists)
-- ============================================
DROP POLICY IF EXISTS "Allow public read access to pensiun" ON public.pensiun;

CREATE POLICY "Authenticated users can view pensiun"
ON public.pensiun
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 4. FIX PENDIDIKAN TABLE - Remove public access (if exists)
-- ============================================
DROP POLICY IF EXISTS "Allow public read access to pendidikan" ON public.pendidikan;

CREATE POLICY "Authenticated users can view pendidikan"
ON public.pendidikan
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 5. FIX NOTIFICATIONS TABLE - Remove type casting issue
-- ============================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Recreate without type casting (user_id is already UUID)
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. FIX SECURITY DEFINER FUNCTIONS
-- ============================================

-- Fix create_tracking_notification function to include search_path
CREATE OR REPLACE FUNCTION public.create_tracking_notification()
RETURNS trigger
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
  IF NEW.selesai_at IS NOT NULL AND (OLD.selesai_at IS NULL OR OLD.selesai_at IS DISTINCT FROM NEW.selesai_at) THEN
    IF v_assignment.created_by_email IS NOT NULL THEN
      SELECT user_id INTO v_creator_user_id 
      FROM profiles 
      WHERE email = v_assignment.created_by_email;
      
      IF v_creator_user_id IS NOT NULL THEN
        v_notification_title := 'Penugasan Selesai - Agenda #' || v_assignment.agenda_number;
        v_notification_message := 'Penugasan dengan perihal "' || v_assignment.perihal || '" telah selesai diproses.';
        
        INSERT INTO notifications (user_id, title, message, assignment_id, is_read)
        VALUES (v_creator_user_id, v_notification_title, v_notification_message, NEW.id, false);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;