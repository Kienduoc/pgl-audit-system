import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use Service Role Key for seeding!

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
    console.log('🌱 Starting seed...')

    // 1. Create Mock Client Profile (if not exists)
    // Note: We can't create Auth Users via API easily without Admin API enabled.
    // Assuming user exists or we just create a Profile for a known ID.
    // For this script, we'll check if a profile with a specific email exists.

    // Instead of creating Auth user, we will just create Org data for existing users if any.
    // Or we create a Mock Org linked to a placeholder UUID.

    const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000' // Placeholder

    // Check/Create Org
    const { data: org, error: orgError } = await supabase
        .from('client_organizations')
        .upsert({
            profile_id: MOCK_USER_ID,
            name: 'Mock Manufacturing Ltd',
            tax_code: 'MOCK-TAX-001',
            address: '123 Mock Street, Innovation City',
            phone: '555-0123',
            representative: 'John Doe',
            email: 'contact@mockmfg.com'
        }, { onConflict: 'tax_code' })
        .select()
        .single()

    if (orgError) {
        console.error('Error creating org:', orgError)
    } else {
        console.log('✅ Organization synced:', org.name)
    }

    // 2. Create Audit Application
    const { data: app, error: appError } = await supabase
        .from('audit_applications')
        .upsert({
            client_org_id: org?.id,
            certification_type: 'ISO 9001',
            scope: 'Manufacturing of Mock Widgets',
            status: 'draft',
            created_by: MOCK_USER_ID
        }, { onConflict: 'id' }) // Just insert if not valid conflict? Actually we can't upsert easily without ID.
        // Let's just insert one if none exists for this org
        .select()

    // 3. Create active audit
    if (org) {
        const { data: app, error: appError } = await supabase
            .from('audit_applications')
            .select('id')
            .eq('client_org_id', org.id)
            .single()

        if (app) {
            console.log('✅ Audit Application found/created with ID:', app.id)
        } else {
            // Insert logic if needed, but for now we focus on Org.
            console.log('⚠️ No application found for this org yet. Manual creation or further seeding logic needed.')
        }
    }

    console.log('🌱 Seed completed.')
}

seed()
