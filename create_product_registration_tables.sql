-- Migration: Create Product Registration Tables for BM01b Form
-- This creates tables to support dynamic product registration with multiple products per audit

-- ============================================================================
-- 1. REFERENCE TABLES
-- ============================================================================

-- Table for Certification Types (Initial, Re-certification, Extension)
CREATE TABLE IF NOT EXISTS certification_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_vi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default certification types
INSERT INTO certification_types (code, name_vi, name_en, description) VALUES
('initial', 'Lần đầu', 'Initial', 'First-time product certification'),
('recertification', 'Đánh giá lại', 'Re-certification', 'Renewal of existing certification'),
('extension', 'Mở rộng', 'Extension', 'Extension of certification scope')
ON CONFLICT (code) DO NOTHING;

-- Table for Applied Standards (ISO, TCVN, QCVN, etc.)
CREATE TABLE IF NOT EXISTS applied_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common ISO/TCVN/QCVN standards
INSERT INTO applied_standards (code, name, description) VALUES
('ISO 17065:2012', 'ISO/IEC 17065:2012', 'Conformity assessment - Requirements for bodies certifying products, processes and services'),
('ISO 9001:2015', 'ISO 9001:2015', 'Quality management systems - Requirements'),
('ISO 14001:2015', 'ISO 14001:2015', 'Environmental management systems - Requirements'),
('ISO 45001:2018', 'ISO 45001:2018', 'Occupational health and safety management systems'),
('TCVN', 'TCVN (Tiêu chuẩn Việt Nam)', 'Vietnamese National Standards'),
('QCVN', 'QCVN (Quy chuẩn Việt Nam)', 'Vietnamese Technical Regulations'),
('Other', 'Tiêu chuẩn khác', 'Other standards not listed')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. MAIN PRODUCT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    
    -- Product Information
    product_name TEXT NOT NULL,
    model_type TEXT, -- Kiểu/Loại (e.g., "Type A, Type B, Type C")
    brand_trademark TEXT, -- Nhãn hiệu
    
    -- Standards & Certification
    applied_standard_id UUID REFERENCES applied_standards(id),
    applied_standard_custom TEXT, -- For custom standards not in reference table
    certification_type_id UUID REFERENCES certification_types(id),
    
    -- Production Info
    annual_production TEXT, -- Sản lượng hàng năm (stored as text for flexibility)
    
    -- Metadata
    notes TEXT,
    display_order INTEGER DEFAULT 0, -- For ordering products in the table
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_products_audit_id ON audit_products(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_products_standard ON audit_products(applied_standard_id);
CREATE INDEX IF NOT EXISTS idx_audit_products_cert_type ON audit_products(certification_type_id);
CREATE INDEX IF NOT EXISTS idx_audit_products_order ON audit_products(audit_id, display_order);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE certification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE applied_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certification_types (Public read)
DROP POLICY IF EXISTS "Public read certification types" ON certification_types;
CREATE POLICY "Public read certification types"
ON certification_types FOR SELECT
TO public
USING (true);

-- RLS Policies for applied_standards (Public read active standards)
DROP POLICY IF EXISTS "Public read active standards" ON applied_standards;
CREATE POLICY "Public read active standards"
ON applied_standards FOR SELECT
TO public
USING (is_active = true);

-- RLS Policies for audit_products
-- Note: Since audits table doesn't have client_id, we'll use a simpler approach
-- Users can view products of audits they have access to

DROP POLICY IF EXISTS "Users can view products of their audits" ON audit_products;
CREATE POLICY "Users can view products of their audits"
ON audit_products FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM audits
        WHERE audits.id = audit_products.audit_id
        AND (
            audits.lead_auditor_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM audit_team
                WHERE audit_team.audit_id = audits.id
                AND audit_team.auditor_id = auth.uid()
            )
        )
    )
);

DROP POLICY IF EXISTS "Authenticated users can insert products" ON audit_products;
CREATE POLICY "Authenticated users can insert products"
ON audit_products FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM audits
        WHERE audits.id = audit_products.audit_id
        AND audits.status = 'planned'
    )
);

DROP POLICY IF EXISTS "Users can update products for planned audits" ON audit_products;
CREATE POLICY "Users can update products for planned audits"
ON audit_products FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM audits
        WHERE audits.id = audit_products.audit_id
        AND audits.status = 'planned'
    )
);

DROP POLICY IF EXISTS "Users can delete products from planned audits" ON audit_products;
CREATE POLICY "Users can delete products from planned audits"
ON audit_products FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM audits
        WHERE audits.id = audit_products.audit_id
        AND audits.status = 'planned'
    )
);

-- ============================================================================
-- 5. GRANTS
-- ============================================================================

GRANT SELECT ON certification_types TO authenticated, anon;
GRANT SELECT ON applied_standards TO authenticated, anon;
GRANT ALL ON audit_products TO authenticated;

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE audit_products IS 'Products registered for certification in each audit (BM01b Step 3)';
COMMENT ON TABLE certification_types IS 'Reference table for certification types (Initial, Re-certification, Extension)';
COMMENT ON TABLE applied_standards IS 'Reference table for ISO/TCVN/QCVN standards';

COMMENT ON COLUMN audit_products.product_name IS 'Tên sản phẩm';
COMMENT ON COLUMN audit_products.model_type IS 'Kiểu/Loại (e.g., Type A, Type B)';
COMMENT ON COLUMN audit_products.brand_trademark IS 'Nhãn hiệu';
COMMENT ON COLUMN audit_products.applied_standard_custom IS 'Custom standard if not in reference table';
COMMENT ON COLUMN audit_products.annual_production IS 'Sản lượng hàng năm (flexible text format)';
COMMENT ON COLUMN audit_products.display_order IS 'Order of products in the table';
