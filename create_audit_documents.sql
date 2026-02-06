-- Create Audit Documents table
CREATE TABLE IF NOT EXISTS audit_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES profiles(id),
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    description TEXT,
    file_type TEXT DEFAULT 'general', -- 'application', 'manual', 'procedure'
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    assigned_auditors UUID[], -- Array of user_ids
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to append to array (helper for assigning auditors)
CREATE OR REPLACE FUNCTION append_auditor_access(doc_id UUID, auditor_id UUID)
RETURNS VOID AS $$
UPDATE audit_documents
SET assigned_auditors = array_append(assigned_auditors, auditor_id)
WHERE id = doc_id AND NOT (assigned_auditors @> ARRAY[auditor_id]);
$$ LANGUAGE sql;

-- RLS Policies
ALTER TABLE audit_documents ENABLE ROW LEVEL SECURITY;

-- 1. View Policies
-- Lead Auditors & Admins view ALL
CREATE POLICY "Lead Auditors view all docs" ON audit_documents FOR SELECT
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('lead_auditor', 'admin'))
);

-- Clients view their OWN uploads OR docs in their audit (if needed?)
-- Usually clients view what they uploaded.
CREATE POLICY "Clients view own audit docs" ON audit_documents FOR SELECT
USING (
    EXISTS (SELECT 1 FROM audits WHERE id = audit_documents.audit_id AND client_id = auth.uid())
);

-- Auditors view if assigned in array OR if they are in the audit team (depending on strictness)
-- User said: "Lead phân công đánh giá cho Auditor (phân công loại tài liệu nào được truy cập)"
-- So strict check on `assigned_auditors` column OR if they are explicitly allowed.
CREATE POLICY "Auditors view assigned docs" ON audit_documents FOR SELECT
USING (
    auth.uid() = ANY(assigned_auditors)
);

-- 2. Insert Policies
-- Clients can upload to their audits
CREATE POLICY "Clients upload docs" ON audit_documents FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM audits WHERE id = audit_documents.audit_id AND client_id = auth.uid())
);

-- Lead Auditors can upload (if needed)
CREATE POLICY "Leads upload docs" ON audit_documents FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('lead_auditor', 'admin'))
);

-- 3. Update Policies
-- Lead Auditors can update status and assignment
CREATE POLICY "Leads update docs" ON audit_documents FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('lead_auditor', 'admin'))
);

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('audit-docs', 'audit-docs', false) ON CONFLICT DO NOTHING;

-- Storage Policies
CREATE POLICY "Give authenticated users access to audit-docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'audit-docs');
CREATE POLICY "Give authenticated users read access to audit-docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'audit-docs');
