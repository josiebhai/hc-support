-- Create patients table for storing patient information
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT NOT NULL UNIQUE, -- Display ID like P001, P002
    full_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth DATE NOT NULL,
    language_preference TEXT NOT NULL,
    marital_status TEXT NOT NULL CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
    aadhar_id TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    village TEXT NOT NULL,
    state TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create index on patient_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);

-- Create index on mobile_number for search functionality
CREATE INDEX IF NOT EXISTS idx_patients_mobile_number ON patients(mobile_number);

-- Create index on full_name for search functionality
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients(full_name);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all patients
CREATE POLICY "Allow authenticated users to read patients"
    ON patients
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow super_admin and receptionist to insert patients
CREATE POLICY "Allow authorized users to insert patients"
    ON patients
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'receptionist')
            AND users.status = 'active'
        )
    );

-- Policy: Allow super_admin and receptionist to update patients
CREATE POLICY "Allow authorized users to update patients"
    ON patients
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'receptionist')
            AND users.status = 'active'
        )
    );

-- Policy: Allow super_admin and receptionist to delete patients
CREATE POLICY "Allow authorized users to delete patients"
    ON patients
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'receptionist')
            AND users.status = 'active'
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_patients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before update
CREATE TRIGGER trigger_update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_patients_updated_at();

-- Add comment to the table
COMMENT ON TABLE patients IS 'Stores patient personal information and demographics';
