-- Reset agenda number sequence to start from 1 if empty
DO $$
BEGIN
  -- Check if there are any records
  IF NOT EXISTS (SELECT 1 FROM plh_kepala) THEN
    -- Reset sequence to start from 1
    ALTER SEQUENCE plh_kepala_agenda_number_seq RESTART WITH 1;
  END IF;
END $$;