-- B.Laban EMS Migration Script
-- Enable PostGIS for geolocation features
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Profiles & Hierarchy
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'TECHNICIAN');

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location GEOGRAPHY(POINT) NOT NULL,
    brand_id UUID REFERENCES brands(id)
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    role user_role DEFAULT 'TECHNICIAN',
    branch_id UUID REFERENCES branches(id),
    avatar_url TEXT
);

-- 2. Assets
CREATE TYPE asset_status AS ENUM ('ACTIVE', 'BROKEN', 'MAINTENANCE', 'SCRAPPED');

CREATE TABLE maintenance_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    name TEXT NOT NULL,
    serial_number TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    purchase_date DATE,
    warranty_expiry DATE,
    initial_value NUMERIC(10, 2),
    status asset_status DEFAULT 'ACTIVE',
    health_score INTEGER CHECK (health_score BETWEEN 0 AND 100) DEFAULT 100,
    image_url TEXT
);

-- 3. Inventory
CREATE TABLE spare_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    current_stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    price NUMERIC(10, 2)
);

-- 4. Dynamic Engine (Admin Sovereign)
CREATE TABLE system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- Insert default config
INSERT INTO system_config (key, value) VALUES 
('geofence_radius', '200'), 
('sla_high_priority_hours', '4');

CREATE TABLE ui_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_key TEXT UNIQUE NOT NULL, -- e.g. 'new_ticket'
    schema_definition JSONB NOT NULL -- Stores the array of fields
);

-- 5. Tickets
CREATE TYPE ticket_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_PARTS', 'RESOLVED', 'CLOSED');

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    asset_id UUID REFERENCES maintenance_assets(id),
    technician_id UUID REFERENCES profiles(id),
    status ticket_status DEFAULT 'OPEN',
    priority ticket_priority DEFAULT 'MEDIUM',
    title TEXT NOT NULL,
    description TEXT,
    diagnosis TEXT,
    location GEOGRAPHY(POINT),
    form_data JSONB, -- Stores dynamic field values
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 6. Row Level Security (RLS)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Technicians can only see tickets assigned to them or within their visibility range (implemented via function usually, simplified here)
CREATE POLICY "Technicians view assigned or local tickets" ON tickets
    FOR SELECT
    USING (
        auth.uid() = technician_id 
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('ADMIN', 'MANAGER')
        )
    );

-- Admins can do everything
CREATE POLICY "Admins full access" ON tickets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
        )
    );
