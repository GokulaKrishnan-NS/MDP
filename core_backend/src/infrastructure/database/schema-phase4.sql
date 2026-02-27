-- Add Medicines table and expand Schedules

CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    compartment_id UUID REFERENCES compartments(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Expand schedules to hold the medicine reference directly
ALTER TABLE schedules ADD COLUMN medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE;

-- Insert a default medicine mapping for testing
INSERT INTO medicines (id, user_id, name, dosage, compartment_id, start_date, end_date)
VALUES (
    'a1b2c3d4-e5f6-4a11-8c44-3b1a2b3c4d5e',
    'aa5f877d-7718-47f2-8c11-1402db39df91',
    'Aspirin',
    '81mg',
    'c0a80121-7b8e-4a11-8c44-3b1a2b3c4d5e',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days'
) ON CONFLICT DO NOTHING;

-- Map mock schedules to this new mocked medicine
UPDATE schedules SET medicine_id = 'a1b2c3d4-e5f6-4a11-8c44-3b1a2b3c4d5e' WHERE medicine_id IS NULL;
