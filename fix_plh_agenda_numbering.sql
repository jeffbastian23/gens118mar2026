-- ============================================
-- Fix PLH/PLT Agenda Numbering
-- ============================================
-- This script resets the agenda_number sequence for plh_kepala table
-- to ensure numbering starts from 1 and is continuous

-- Step 1: Get the maximum agenda number currently in use
DO $$
DECLARE
  max_agenda_number INTEGER;
BEGIN
  -- Get the maximum agenda number from existing records
  SELECT COALESCE(MAX(agenda_number), 0) INTO max_agenda_number FROM plh_kepala;
  
  -- Reset the sequence to start after the maximum number
  -- If there are no records, it will start from 1
  EXECUTE format('ALTER SEQUENCE plh_kepala_agenda_number_seq RESTART WITH %s', max_agenda_number + 1);
  
  RAISE NOTICE 'Sequence reset to start from %', max_agenda_number + 1;
END $$;

-- Step 2: If you want to renumber all existing records starting from 1
-- UNCOMMENT THE FOLLOWING SECTION ONLY IF YOU WANT TO RENUMBER EXISTING RECORDS
-- WARNING: This will change all agenda numbers!

/*
DO $$
DECLARE
  rec RECORD;
  counter INTEGER := 1;
BEGIN
  -- Temporarily disable the sequence default
  ALTER TABLE plh_kepala ALTER COLUMN agenda_number DROP DEFAULT;
  
  -- Renumber all records in order of creation
  FOR rec IN 
    SELECT id FROM plh_kepala ORDER BY created_at ASC
  LOOP
    UPDATE plh_kepala SET agenda_number = counter WHERE id = rec.id;
    counter := counter + 1;
  END LOOP;
  
  -- Re-enable the sequence default
  ALTER TABLE plh_kepala ALTER COLUMN agenda_number SET DEFAULT nextval('plh_kepala_agenda_number_seq');
  
  -- Reset sequence to continue from the last number
  EXECUTE format('ALTER SEQUENCE plh_kepala_agenda_number_seq RESTART WITH %s', counter);
  
  RAISE NOTICE 'All records renumbered. Sequence will continue from %', counter;
END $$;
*/

-- Step 3: Verify the current sequence value
SELECT 'Current sequence value: ' || last_value as info FROM plh_kepala_agenda_number_seq;
SELECT 'Total records in plh_kepala: ' || COUNT(*) as info FROM plh_kepala;
SELECT 'Max agenda_number: ' || COALESCE(MAX(agenda_number), 0) as info FROM plh_kepala;
