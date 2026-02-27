-- Database Schema for Smart Medicine Reminder (IoT-Ready Production)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop old schema tables to enforce clean slate
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;
DROP TABLE IF EXISTS compartments CASCADE;

-- Drop new schema tables to allow clean re-runs
DROP TABLE IF EXISTS iot_devices CASCADE;
DROP TABLE IF EXISTS user_locations CASCADE;
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS dispense_history CASCADE;
DROP TABLE IF EXISTS medication_schedules CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS schedule_status CASCADE;
DROP TYPE IF EXISTS dispense_status CASCADE;
DROP TYPE IF EXISTS device_status CASCADE;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. Medications Table
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100),
    total_count INT NOT NULL DEFAULT 0,
    remaining_count INT NOT NULL DEFAULT 0,
    start_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);

-- 3. Medication Schedules Table
CREATE TABLE IF NOT EXISTS medication_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    scheduled_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_medication_id ON medication_schedules(medication_id);

-- Enum for Dispense Status
DO $$ BEGIN
    CREATE TYPE dispense_status AS ENUM ('taken', 'missed', 'late', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Dispense History Table
CREATE TABLE IF NOT EXISTS dispense_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    scheduled_time TIME NOT NULL,
    dispensed_at TIMESTAMP WITH TIME ZONE,
    status dispense_status NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_dispense_history_medication_id ON dispense_history(medication_id);
CREATE INDEX IF NOT EXISTS idx_dispense_history_status ON dispense_history(status);

-- 5. Emergency Contacts Table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    relationship VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);

-- 6. User Locations Table
CREATE TABLE IF NOT EXISTS user_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_recorded_at ON user_locations(recorded_at);

-- Enum for IoT Device Status
DO $$ BEGIN
    CREATE TYPE device_status AS ENUM ('active', 'offline', 'maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 7. IoT Devices Table (Future-Ready)
CREATE TABLE IF NOT EXISTS iot_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(255) NOT NULL,
    device_token VARCHAR(255) UNIQUE NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE,
    status device_status DEFAULT 'offline',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_iot_devices_user_id ON iot_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_token ON iot_devices(device_token);

-- Mock User Data strictly for immediate Dev Testing
INSERT INTO users (id, name, email, password_hash)
VALUES ('aa5f877d-7718-47f2-8c11-1402db39df91', 'Test User', 'test@example.com', 'dummyhash')
ON CONFLICT (email) DO NOTHING;
