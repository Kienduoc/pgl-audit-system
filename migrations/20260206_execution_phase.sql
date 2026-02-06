-- BM06: Document Review Records
CREATE TABLE IF NOT EXISTS audit_document_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
    dossier_item_id UUID REFERENCES audit_dossier(id) ON DELETE CASCADE, -- Link to specific uploaded file/item
    reviewer_id UUID REFERENCES profiles(id),
    evaluation_result TEXT CHECK (evaluation_result IN ('pass', 'fail', 'pending', 'info_needed')),
    comments TEXT,
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Reviews
ALTER TABLE audit_document_reviews ENABLE ROW LEVEL SECURITY;

-- Staff View/Edit
CREATE POLICY "Staff can manage reviews" ON audit_document_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'lead_auditor', 'auditor')
        )
    );

-- Client View Only
CREATE POLICY "Clients can view reviews of their audits" ON audit_document_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM audits
            JOIN client_organizations ON audits.client_org_id = client_organizations.id
            WHERE audits.id = audit_document_reviews.audit_id
            AND client_organizations.profile_id = auth.uid()
        )
    );


-- BM08: Audit Checklist (Questions & Responses)
CREATE TABLE IF NOT EXISTS audit_checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard TEXT NOT NULL, -- e.g., 'ISO 17065', 'ISO 9001'
    section TEXT,
    clause TEXT,
    question TEXT NOT NULL,
    guidance TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_checklist_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
    template_id UUID REFERENCES audit_checklist_templates(id), -- Optional link to template
    question_text TEXT NOT NULL, -- Snapshot of question
    auditor_id UUID REFERENCES profiles(id),
    
    -- BM08 Fields
    clause_reference TEXT,
    evidence_observation TEXT, -- "Ghi nhận thực tế"
    conclusion TEXT CHECK (conclusion IN ('pass', 'fail', 'observation')),
    
    finding_id UUID REFERENCES findings(id), -- Auto-link if Fail
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_checklist_responses ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for speed)
CREATE POLICY "Staff read templates" ON audit_checklist_templates FOR SELECT USING (true);
CREATE POLICY "Staff manage responses" ON audit_checklist_responses 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'lead_auditor', 'auditor')
        )
    );
