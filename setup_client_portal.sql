-- Consolidated Setup Script for Client Portal
-- Run this in Supabase SQL Editor

-- 1. Create Tables (if not exist)
CREATE TABLE IF NOT EXISTS client_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    english_name TEXT,
    vietnamese_name TEXT,
    office_address TEXT,
    factory_address TEXT,
    tax_code TEXT UNIQUE,
    representative_name TEXT,
    contact_person_name TEXT,
    contact_phone TEXT,
    year_established INTEGER,
    org_type TEXT, 
    staff_total INTEGER,
    staff_management INTEGER,
    staff_production INTEGER,
    shifts INTEGER,
    main_market TEXT,
    outsourced_processes JSONB DEFAULT '[]'::jsonb,
    existing_certifications JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_profile FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS audit_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES audits(id) ON DELETE SET NULL, 
    client_org_id UUID REFERENCES client_organizations(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    model_type TEXT,
    brand_name TEXT,
    standard_applied TEXT NOT NULL,
    annual_output TEXT,
    registration_type TEXT CHECK (registration_type IN ('B_Initial', 'L_Recertification', 'M_Extension')),
    application_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Accepted', 'Rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_org_id UUID REFERENCES client_organizations(id) ON DELETE CASCADE,
    certificate_number TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    scope TEXT NOT NULL, 
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Withdrawn', 'Expiring')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE client_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_certificates ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Clients manage their own org info" ON client_organizations;
DROP POLICY IF EXISTS "Admins view all org info" ON client_organizations;
DROP POLICY IF EXISTS "Clients manage their own applications" ON audit_applications;
DROP POLICY IF EXISTS "Admins manage all applications" ON audit_applications;
DROP POLICY IF EXISTS "Clients view their own certificates" ON client_certificates;
DROP POLICY IF EXISTS "Admins manage all certificates" ON client_certificates;
-- Also fix Audits table RLS from previous issue
DROP POLICY IF EXISTS "Clients can insert their own audits" ON audits;
DROP POLICY IF EXISTS "Clients can view their own audits" ON audits;

-- 4. Re-create Policies

-- client_organizations
CREATE POLICY "Clients manage their own org info" 
ON client_organizations FOR ALL 
USING (auth.uid() = profile_id);

CREATE POLICY "Admins view all org info" 
ON client_organizations FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'auditor', 'lead_auditor'))
);

-- audit_applications
CREATE POLICY "Clients manage their own applications" 
ON audit_applications FOR ALL 
USING (
    EXISTS (SELECT 1 FROM client_organizations WHERE id = audit_applications.client_org_id AND profile_id = auth.uid())
);

CREATE POLICY "Admins manage all applications" 
ON audit_applications FOR ALL 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'auditor', 'lead_auditor'))
);

-- client_certificates
CREATE POLICY "Clients view their own certificates" 
ON client_certificates FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM client_organizations WHERE id = client_certificates.client_org_id AND profile_id = auth.uid())
);

CREATE POLICY "Admins manage all certificates" 
ON client_certificates FOR ALL 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'auditor', 'lead_auditor'))
);

-- FIX for Audits Table RLS (Crucial for Wizard)
CREATE POLICY "Clients can insert their own audits"
ON audits
FOR INSERT
WITH CHECK (
    auth.uid() = client_id
);

CREATE POLICY "Clients can view their own audits"
ON audits
FOR SELECT
USING (
    auth.uid() = client_id
);

-- 5. Grant Permissions
GRANT ALL ON client_organizations TO authenticated;
GRANT ALL ON audit_applications TO authenticated;
GRANT ALL ON client_certificates TO authenticated;
