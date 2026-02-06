-- 1. Create Audit Dossier Table
CREATE TABLE IF NOT EXISTS audit_dossier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES audit_applications(id) NOT NULL,
    document_type TEXT CHECK (document_type IN ('legal', 'technical', 'qa_manual', 'other')),
    file_name TEXT,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    uploaded_by UUID REFERENCES profiles(id)
);

-- Enable RLS for dossier
ALTER TABLE audit_dossier ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients manage own dossier" ON audit_dossier;
CREATE POLICY "Clients manage own dossier" ON audit_dossier
    USING (uploaded_by = auth.uid())
    WITH CHECK (uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Admins view all dossier" ON audit_dossier;
CREATE POLICY "Admins view all dossier" ON audit_dossier
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'auditor'))
    );

-- 2. Create CAPA Table (Corrective Actions)
CREATE TABLE IF NOT EXISTS audit_findings_capa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID REFERENCES audit_findings(id) UNIQUE, -- One CAPA per Finding
    root_cause TEXT,
    correction_action TEXT,
    evidence_url TEXT, -- Link to uploaded evidence
    submitted_at TIMESTAMPTZ DEFAULT now(),
    status TEXT CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected')) DEFAULT 'draft',
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id)
);

-- Enable RLS for CAPA
ALTER TABLE audit_findings_capa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients manage own CAPA" ON audit_findings_capa;
-- This requires a slightly more complex join policy usually, but for simplicity assuming findings link to audits link to client_org link to profile
-- For MVP, we can link CAPA via finding -> audit -> client_org_id = user's org.
-- Simplified:
CREATE POLICY "Clients manage own CAPA" ON audit_findings_capa
    USING (
        EXISTS (
            SELECT 1 FROM audit_findings f
            JOIN audits a ON a.id = f.audit_id
            JOIN client_organizations co ON co.id = a.client_org_id
            WHERE f.id = audit_findings_capa.finding_id
            AND co.profile_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM audit_findings f
            JOIN audits a ON a.id = f.audit_id
            JOIN client_organizations co ON co.id = a.client_org_id
            WHERE f.id = audit_findings_capa.finding_id
            AND co.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins manage all CAPA" ON audit_findings_capa;
CREATE POLICY "Admins manage all CAPA" ON audit_findings_capa
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lead_auditor'))
    );
