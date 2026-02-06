-- Fix RLS Policies for Product Registration Tables
-- Remove dependency on non-existent audit_team table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view products of their audits" ON audit_products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON audit_products;
DROP POLICY IF EXISTS "Users can update products for planned audits" ON audit_products;
DROP POLICY IF EXISTS "Users can delete products from planned audits" ON audit_products;

-- Simplified RLS Policies
-- Allow authenticated users to view all products (auditors and clients will see their relevant audits)
CREATE POLICY "Authenticated users can view products"
ON audit_products FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert products for any planned audit
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

-- Allow authenticated users to update products for planned audits
CREATE POLICY "Authenticated users can update products"
ON audit_products FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM audits
        WHERE audits.id = audit_products.audit_id
        AND audits.status = 'planned'
    )
);

-- Allow authenticated users to delete products from planned audits
CREATE POLICY "Authenticated users can delete products"
ON audit_products FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM audits
        WHERE audits.id = audit_products.audit_id
        AND audits.status = 'planned'
    )
);
