-- Create patient_visits table for storing patient medical visit information
CREATE TABLE IF NOT EXISTS patient_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Treating Doctor
    treating_doctor_name TEXT, -- Name of the treating doctor (optional)
    
    -- Health Information (all optional)
    height_cm DECIMAL(5, 2), -- Height in centimeters
    weight_kg DECIMAL(5, 2), -- Weight in kilograms
    known_allergies TEXT, -- Free text field for allergies
    chronic_conditions TEXT[], -- Array of chronic conditions
    current_medications TEXT, -- Free text field for medications
    immunization_status TEXT, -- Free text field for immunization status
    last_health_checkup_date DATE, -- Last health checkup date
    doctor_notes TEXT, -- Free text field for doctor notes
    
    -- Follow-up and Prescriptions (optional)
    followup_date DATE, -- Date for follow-up appointment
    followup_notes TEXT, -- Follow-up instructions and notes
    prescriptions TEXT, -- Prescribed medications and instructions (free text)
    medicines JSONB, -- Structured list of prescribed medicines with details
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_visits_patient_id ON patient_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_visits_visit_date ON patient_visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_patient_visits_created_at ON patient_visits(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE patient_visits ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all patient visits
CREATE POLICY "Allow authenticated users to read patient visits"
    ON patient_visits
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow doctors, nurses, super_admin to insert patient visits
CREATE POLICY "Allow authorized users to insert patient visits"
    ON patient_visits
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'doctor', 'nurse')
            AND users.status = 'active'
        )
    );

-- Policy: Allow doctors, nurses, super_admin to update patient visits
CREATE POLICY "Allow authorized users to update patient visits"
    ON patient_visits
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'doctor', 'nurse')
            AND users.status = 'active'
        )
    );

-- Policy: Allow super_admin to delete patient visits
CREATE POLICY "Allow super_admin to delete patient visits"
    ON patient_visits
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
            AND users.status = 'active'
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_patient_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before update
CREATE TRIGGER trigger_update_patient_visits_updated_at
    BEFORE UPDATE ON patient_visits
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_visits_updated_at();

-- Add comment to the table
COMMENT ON TABLE patient_visits IS 'Stores patient medical visit information including health metrics and doctor notes';
