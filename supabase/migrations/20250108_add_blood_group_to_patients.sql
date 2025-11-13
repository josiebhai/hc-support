-- Add blood_group column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''));

-- Add comment to the column
COMMENT ON COLUMN patients.blood_group IS 'Patient blood group (optional)';
