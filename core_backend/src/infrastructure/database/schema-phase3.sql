-- Add Users table for Emergency Contacts

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    emergency_name VARCHAR(255),
    emergency_phone VARCHAR(50),
    emergency_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Note: We will insert a dummy user to simulate an authenticated user session
INSERT INTO users (id, full_name, email, emergency_name, emergency_phone, emergency_email)
VALUES (
    'aa5f877d-7718-47f2-8c11-1402db39df91',
    'John Doe',
    'john@example.com',
    'Jane Doe',
    '+1234567890',
    'jane@example.com'
) ON CONFLICT (email) DO NOTHING;
