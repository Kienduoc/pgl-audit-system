-- 1. Client Organizations
CREATE TABLE IF NOT EXISTS client_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id), -- Owner/Rep
    english_name TEXT,
    vietnamese_name TEXT,
    tax_code TEXT UNIQUE,
    office_address TEXT,
    factory_address TEXT,
    contact_person_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    representative_name TEXT,
    year_established INTEGER,
    total_employees INTEGER,
    main_market TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for client_organizations
ALTER TABLE client_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own org" ON client_organizations
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins view all orgs" ON client_organizations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'auditor'))
    );

-- 2. Audit Applications (BM01b Snapshot)
CREATE TABLE IF NOT EXISTS audit_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_org_id UUID REFERENCES client_organizations(id),
    status TEXT CHECK (status IN ('draft', 'submitted', 'reviewing', 'accepted', 'rejected', 'converted')) DEFAULT 'draft',
    
    -- Application Details (BM01b)
    product_name TEXT,
    model_type TEXT,
    manufacturer_name TEXT,
    factory_location TEXT,
    
    applied_standard TEXT, -- or UUID if linking strictly
    certification_type TEXT CHECK (certification_type IN ('initial', 'surveillance', 'recertification', 'extension')),
    
    submitted_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for audit_applications
ALTER TABLE audit_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own applications" ON audit_applications
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins manage all applications" ON audit_applications
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'auditor'))
    );

-- 3. Link Audits to Application
ALTER TABLE audits 
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES audit_applications(id),
ADD COLUMN IF NOT EXISTS client_org_id UUID REFERENCES client_organizations(id);

-- 4. Audit Type Enum (if not exists)
DO $$ BEGIN
    CREATE TYPE audit_type_enum AS ENUM ('initial', 'surveillance', 'reassessment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE audits 
ADD COLUMN IF NOT EXISTS audit_type audit_type_enum DEFAULT 'initial';
