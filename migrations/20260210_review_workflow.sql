-- Migration: Review Workflow Enhancement
-- Created: 2026-02-10
-- Description: Expands status lifecycle, adds review history, organization info

-- ========================
-- 1. Update status constraint
-- ========================
ALTER TABLE audit_applications DROP CONSTRAINT IF EXISTS audit_applications_status_check;
ALTER TABLE audit_applications ADD CONSTRAINT audit_applications_status_check 
    CHECK (status IN (
        'Draft', 'Submitted', 'Under Review', 'Needs Revision',
        'Accepted', 'Rejected', 'Team Assigned',
        'Audit In Progress', 'Report Review', 'Certified'
    ));

-- ========================
-- 2. Add review columns to audit_applications
-- ========================
ALTER TABLE audit_applications 
    ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id),
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS review_notes TEXT,
    ADD COLUMN IF NOT EXISTS revision_count INT DEFAULT 0;

-- ========================
-- 3. Create application_review_history table
-- ========================
CREATE TABLE IF NOT EXISTS application_review_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES audit_applications(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL CHECK (action IN (
        'submitted', 'review_started', 'revision_requested',
        'resubmitted', 'accepted', 'rejected'
    )),
    performed_by UUID REFERENCES profiles(id) NOT NULL,
    notes TEXT,
    previous_status TEXT,
    new_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for review history
ALTER TABLE application_review_history ENABLE ROW LEVEL SECURITY;

-- Admins can manage all history
CREATE POLICY "Admins manage review history" ON application_review_history
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND active_role = 'admin')
    );

-- Staff can view history
CREATE POLICY "Staff view review history" ON application_review_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND active_role IN ('admin', 'lead_auditor', 'auditor')
        )
    );

-- Clients can view history of their own applications
CREATE POLICY "Clients view own app history" ON application_review_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM audit_applications
            WHERE audit_applications.id = application_review_history.application_id
            AND audit_applications.user_id = auth.uid()
        )
    );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_review_history_app_id ON application_review_history(application_id);

-- ========================
-- 4. Add organization and position to profiles
-- ========================
ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS organization TEXT,
    ADD COLUMN IF NOT EXISTS position TEXT;

-- ========================
-- 5. Update audit_teams with organization & assigned_by
-- ========================
ALTER TABLE audit_teams 
    ADD COLUMN IF NOT EXISTS organization TEXT,
    ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES profiles(id),
    ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NOW();

-- ========================
-- 6. Update trigger for updated_at on review history changes
-- ========================
CREATE TRIGGER update_audit_applications_review
    BEFORE UPDATE ON audit_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'audit_applications';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'application_review_history';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('organization', 'position');
