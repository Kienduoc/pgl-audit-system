-- 1. Update audit_applications status
ALTER TABLE audit_applications DROP CONSTRAINT IF EXISTS audit_applications_status_check;
ALTER TABLE audit_applications ADD CONSTRAINT audit_applications_status_check 
    CHECK (status IN ('Draft', 'Submitted', 'Pending Review', 'Allocating', 'Audit Planned', 'Accepted', 'Rejected', 'Completed'));

-- 2. Create Audit Teams Table (Linking Users to Audits with Roles)
CREATE TABLE IF NOT EXISTS audit_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_application_id UUID REFERENCES audit_applications(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('Lead Auditor', 'Auditor', 'Technical Expert')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(audit_application_id, user_id) -- Prevent duplicate assignment
);

-- 3. RLS for Audit Teams
ALTER TABLE audit_teams ENABLE ROW LEVEL SECURITY;

-- Admins can manage teams
CREATE POLICY "Admins manage audit teams" ON audit_teams
    FOR ALL
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Auditors can view teams they belong to or if they are admins/leaders
CREATE POLICY "Auditors view their teams" ON audit_teams
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lead_auditor'))
    );
