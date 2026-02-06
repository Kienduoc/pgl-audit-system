-- 1. User Educations
CREATE TABLE user_educations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    degree TEXT,
    field_of_study TEXT,
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Certificates / Qualifications
CREATE TABLE user_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuing_org TEXT,
    issue_date DATE,
    expiry_date DATE,
    credential_id TEXT,
    credential_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Work Experiences
CREATE TABLE user_experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    start_date DATE,
    end_date DATE, -- NULL means "Present"
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE user_educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experiences ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Users manage their own records, Admins/Leads can view)
-- Definitions for "View"
CREATE POLICY "Users view own educations" ON user_educations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Leads view all educations" ON user_educations FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('lead_auditor', 'admin'))
);

CREATE POLICY "Users view own certificates" ON user_certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Leads view all certificates" ON user_certificates FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('lead_auditor', 'admin'))
);

CREATE POLICY "Users view own experiences" ON user_experiences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Leads view all experiences" ON user_experiences FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('lead_auditor', 'admin'))
);

-- Definitions for "Modify" (Insert/Update/Delete) - Owner Only
CREATE POLICY "Users modify own educations" ON user_educations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users modify own certificates" ON user_certificates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users modify own experiences" ON user_experiences FOR ALL USING (auth.uid() = user_id);
