-- Enable RLS on key tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_team ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
-- Users can see their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins/Auditors can view all profiles (to assign teams, etc.)
-- Assuming 'admin', 'lead_auditor', 'auditor' roles can view profiles
CREATE POLICY "Staff can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'lead_auditor', 'auditor')
        )
    );

-- 2. Client Organizations Policies
-- Owner (Client) can view/edit their organizations
CREATE POLICY "Clients can view own orgs" ON client_organizations
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Clients can update own orgs" ON client_organizations
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Clients can insert own orgs" ON client_organizations
    FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Staff can view all orgs (for audit creation)
CREATE POLICY "Staff can view all orgs" ON client_organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'lead_auditor', 'auditor')
        )
    );

-- 3. Audits Policies
-- Clients can view audits for their organization
CREATE POLICY "Clients can view own audits" ON audits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM client_organizations
            WHERE client_organizations.id = audits.client_org_id
            AND client_organizations.profile_id = auth.uid()
        )
    );

-- Staff can view all audits (Simplification: Staff usually need broader access)
-- Or strictly: Lead Auditor assigned, or Member of Team
CREATE POLICY "Staff can view all audits" ON audits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'lead_auditor', 'auditor')
        )
    );

-- Only Admin or assigned Lead Auditor can update audit details
CREATE POLICY "Lead Auditor/Admin can update audits" ON audits
    FOR UPDATE USING (
        (auth.uid() = lead_auditor_id) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admin/Lead Auditor can insert audits
CREATE POLICY "Staff can insert audits" ON audits
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'lead_auditor')
        )
    );
