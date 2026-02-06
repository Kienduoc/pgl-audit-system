-- PROMOTION SCRIPT: Make a User an ADMIN
-- Update this email to the user you want to be Admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@phucgia.com.vn'; 
-- Change to your actual email if different

-- Verify the change
SELECT id, email, role FROM profiles WHERE role = 'admin';
