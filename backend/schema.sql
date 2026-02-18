
-- B.Laban EMS Master Schema (DEV MODE - PUBLIC ACCESS)
-- Run this in Supabase SQL Editor to reset schema with permissive policies.

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'TECHNICIAN');
    CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_PARTS', 'RESOLVED', 'CLOSED');
    CREATE TYPE ticket_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    CREATE TYPE asset_status AS ENUM ('ACTIVE', 'BROKEN', 'MAINTENANCE', 'SCRAPPED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES DEFINITIONS
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    full_name TEXT,
    role user_role DEFAULT 'TECHNICIAN',
    phone TEXT,
    avatar_url TEXT,
    branch_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location_lat FLOAT,
    location_lng FLOAT,
    manager_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    serial_number TEXT,
    category TEXT,
    status asset_status DEFAULT 'ACTIVE',
    purchase_date DATE,
    warranty_expiry DATE,
    supplier TEXT,
    supplier_contact TEXT,
    initial_value NUMERIC(10, 2),
    location TEXT,
    health_score INTEGER DEFAULT 100,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spare_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT,
    current_stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    price NUMERIC(10, 2) DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    description TEXT,
    asset_id UUID REFERENCES maintenance_assets(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    technician_id UUID REFERENCES profiles(id),
    status ticket_status DEFAULT 'OPEN',
    priority ticket_priority DEFAULT 'MEDIUM',
    location_lat FLOAT,
    location_lng FLOAT,
    diagnosis TEXT,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id UUID REFERENCES spare_parts(id) ON DELETE CASCADE,
    quantity_change INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    ticket_id UUID REFERENCES tickets(id),
    performed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_form_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    form_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ui_schemas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_key TEXT UNIQUE NOT NULL,
    schema_definition JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role user_role NOT NULL,
    permission_key TEXT NOT NULL,
    is_allowed BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (role, permission_key)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    target_resource TEXT,
    target_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_audience TEXT DEFAULT 'ALL',
    priority TEXT DEFAULT 'NORMAL',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PERMISSIVE POLICIES (THE FIX)
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_form_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid "policy already exists" errors
DROP POLICY IF EXISTS "Allow All Access" ON profiles;
DROP POLICY IF EXISTS "Allow All Access" ON brands;
DROP POLICY IF EXISTS "Allow All Access" ON sectors;
DROP POLICY IF EXISTS "Allow All Access" ON areas;
DROP POLICY IF EXISTS "Allow All Access" ON branches;
DROP POLICY IF EXISTS "Allow All Access" ON maintenance_assets;
DROP POLICY IF EXISTS "Allow All Access" ON spare_parts;
DROP POLICY IF EXISTS "Allow All Access" ON inventory_transactions;
DROP POLICY IF EXISTS "Allow All Access" ON tickets;
DROP POLICY IF EXISTS "Allow All Access" ON ticket_form_data;
DROP POLICY IF EXISTS "Allow All Access" ON ticket_media;
DROP POLICY IF EXISTS "Allow All Access" ON system_config;
DROP POLICY IF EXISTS "Allow All Access" ON ui_schemas;
DROP POLICY IF EXISTS "Allow All Access" ON role_permissions;
DROP POLICY IF EXISTS "Allow All Access" ON audit_logs;
DROP POLICY IF EXISTS "Allow All Access" ON announcements;

-- Create Universal Permissive Policies
CREATE POLICY "Allow All Access" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON sectors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON areas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON maintenance_assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON spare_parts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON inventory_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON ticket_form_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON ticket_media FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON system_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON ui_schemas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON role_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON announcements FOR ALL USING (true) WITH CHECK (true);

-- 4. TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist before creating them
DROP TRIGGER IF EXISTS update_profiles_modtime ON profiles;
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_assets_modtime ON maintenance_assets;
CREATE TRIGGER update_assets_modtime BEFORE UPDATE ON maintenance_assets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_modtime ON tickets;
CREATE TRIGGER update_tickets_modtime BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Seed Permissions
INSERT INTO role_permissions (role, permission_key, is_allowed) VALUES
('ADMIN', 'ticket.delete', true),
('ADMIN', 'ticket.view_cost', true),
('ADMIN', 'inventory.manage', true),
('ADMIN', 'users.manage', true),
('MANAGER', 'ticket.delete', false),
('MANAGER', 'ticket.view_cost', true),
('TECHNICIAN', 'ticket.delete', false),
('TECHNICIAN', 'ticket.view_cost', false)
ON CONFLICT DO NOTHING;
