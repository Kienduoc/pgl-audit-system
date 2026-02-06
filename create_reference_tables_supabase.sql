-- ============================================================================
-- SUPABASE SQL EDITOR SCRIPT
-- Create Reference Tables for Product Registration
-- Copy and paste this entire script into Supabase SQL Editor and run
-- ============================================================================

-- Step 1: Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS public.audit_products CASCADE;
DROP TABLE IF EXISTS public.certification_types CASCADE;
DROP TABLE IF EXISTS public.applied_standards CASCADE;

-- ============================================================================
-- Step 2: Create certification_types table
-- ============================================================================
CREATE TABLE public.certification_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_vi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default certification types
INSERT INTO public.certification_types (code, name_vi, name_en, description) VALUES
('initial', 'Lần đầu', 'Initial', 'First-time product certification'),
('recertification', 'Đánh giá lại', 'Re-certification', 'Renewal of existing certification'),
('extension', 'Mở rộng', 'Extension', 'Extension of certification scope');

-- ============================================================================
-- Step 3: Create applied_standards table
-- ============================================================================
CREATE TABLE public.applied_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common ISO/TCVN/QCVN standards
INSERT INTO public.applied_standards (code, name, description) VALUES
('ISO 17065:2012', 'ISO/IEC 17065:2012', 'Conformity assessment - Requirements for bodies certifying products, processes and services'),
('ISO 9001:2015', 'ISO 9001:2015', 'Quality management systems - Requirements'),
('ISO 14001:2015', 'ISO 14001:2015', 'Environmental management systems - Requirements'),
('ISO 45001:2018', 'ISO 45001:2018', 'Occupational health and safety management systems'),
('TCVN', 'TCVN (Tiêu chuẩn Việt Nam)', 'Vietnamese National Standards'),
('QCVN', 'QCVN (Quy chuẩn Việt Nam)', 'Vietnamese Technical Regulations'),
('Other', 'Tiêu chuẩn khác', 'Other standards not listed');

-- ============================================================================
-- Step 4: Create audit_products table
-- ============================================================================
CREATE TABLE public.audit_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    
    -- Product Information
    product_name TEXT NOT NULL,
    model_type TEXT,
    brand_trademark TEXT,
    
    -- Standards & Certification
    applied_standard_id UUID REFERENCES public.applied_standards(id),
    applied_standard_custom TEXT,
    certification_type_id UUID REFERENCES public.certification_types(id),
    
    -- Production Info
    annual_production TEXT,
    
    -- Metadata
    notes TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- Step 5: Create indexes
-- ============================================================================
CREATE INDEX idx_audit_products_audit_id ON public.audit_products(audit_id);
CREATE INDEX idx_audit_products_standard ON public.audit_products(applied_standard_id);
CREATE INDEX idx_audit_products_cert_type ON public.audit_products(certification_type_id);
CREATE INDEX idx_audit_products_order ON public.audit_products(audit_id, display_order);

-- ============================================================================
-- Step 6: Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.certification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applied_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_products ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 7: Create RLS Policies
-- ============================================================================

-- Policies for certification_types (Public read)
CREATE POLICY "Anyone can read certification types"
ON public.certification_types FOR SELECT
TO public
USING (true);

-- Policies for applied_standards (Public read active standards)
CREATE POLICY "Anyone can read active standards"
ON public.applied_standards FOR SELECT
TO public
USING (is_active = true);

-- Policies for audit_products
CREATE POLICY "Authenticated users can view products"
ON public.audit_products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert products"
ON public.audit_products FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.audits
        WHERE audits.id = audit_products.audit_id
        AND audits.status = 'planned'
    )
);

CREATE POLICY "Authenticated users can update products"
ON public.audit_products FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.audits
        WHERE audits.id = audit_products.audit_id
        AND audits.status = 'planned'
    )
);

CREATE POLICY "Authenticated users can delete products"
ON public.audit_products FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.audits
        WHERE audits.id = audit_products.audit_id
        AND audits.status = 'planned'
    )
);

-- ============================================================================
-- Step 8: Grant permissions to roles
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.certification_types TO anon, authenticated;
GRANT SELECT ON public.applied_standards TO anon, authenticated;
GRANT ALL ON public.audit_products TO authenticated;

-- ============================================================================
-- Step 9: Add table comments
-- ============================================================================
COMMENT ON TABLE public.audit_products IS 'Products registered for certification in each audit (BM01b Step 3)';
COMMENT ON TABLE public.certification_types IS 'Reference table for certification types (Initial, Re-certification, Extension)';
COMMENT ON TABLE public.applied_standards IS 'Reference table for ISO/TCVN/QCVN standards';

-- ============================================================================
-- Step 10: Verify data
-- ============================================================================
SELECT 'certification_types' as table_name, COUNT(*) as record_count FROM public.certification_types
UNION ALL
SELECT 'applied_standards', COUNT(*) FROM public.applied_standards
UNION ALL
SELECT 'audit_products', COUNT(*) FROM public.audit_products;

-- ============================================================================
-- DONE! You should see:
-- certification_types: 3 records
-- applied_standards: 7 records
-- audit_products: 0 records (empty, will be populated when users submit forms)
-- ============================================================================
