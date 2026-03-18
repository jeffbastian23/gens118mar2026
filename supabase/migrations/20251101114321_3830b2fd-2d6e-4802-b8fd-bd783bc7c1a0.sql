-- Make employee_ids nullable and change default
ALTER TABLE plh_kepala ALTER COLUMN employee_ids DROP NOT NULL;
ALTER TABLE plh_kepala ALTER COLUMN employee_ids SET DEFAULT '{}';

-- For new records, we'll use employee_id instead of employee_ids
-- employee_ids will be kept for backward compatibility but can be null/empty