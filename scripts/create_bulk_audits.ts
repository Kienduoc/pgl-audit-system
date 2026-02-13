
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Use ADMIN key to operate freely (if I actually had it, but logging in as Admin works usually)
// Wait, I can't easily sign up new users with Admin privileges on ANON key without rate limits.
// So I will authenticate as Admin first.

async function main() {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Login as Admin
    console.log('Logging in as Admin...')
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@system.com', // Assuming this exists
        password: 'password123'
    })

    if (loginError) {
        console.error('Admin login failed:', loginError.message)
        return
    }

    const adminId = session?.user.id
    if (!adminId) {
        console.error('No admin ID found')
        return
    }

    // 2. Fetch or Create Client User/Org
    // I need a client org ID. I'll pick an existing one or create one owned by Admin for test purposes.
    // Or just fetch the first one.
    const { data: orgs } = await supabase.from('client_organizations').select('id, english_name').limit(1)

    let orgId = orgs?.[0]?.id
    let orgName = orgs?.[0]?.english_name

    if (!orgId) {
        console.log('No org found, creating one for Admin...')
        const { data: newOrg, error: orgErr } = await supabase
            .from('client_organizations')
            .insert({
                english_name: 'PGE Bulk Test Org',
                profile_id: adminId, // Admin as owner for test
                office_address: '123 Bulk St'
            })
            .select()
            .single()

        if (orgErr) {
            console.error('Org creation failed:', orgErr.message)
            return
        }
        orgId = newOrg.id
        orgName = newOrg.english_name
    }

    console.log(`Using Org: ${orgName} (${orgId})`)

    // 3. Create 3 Applications & Accept Them
    for (let i = 1; i <= 3; i++) {
        const auditCode = `BULK-AUTO-${i}`
        const productName = `Product Auto ${i}`
        console.log(`Creating Audit ${i}: ${auditCode}`)

        // Create Application
        const { data: app, error: appErr } = await supabase
            .from('audit_applications')
            .insert({
                user_id: adminId, // Usually client user, but using Admin ID for simplicity in seeding
                client_org_id: orgId,
                product_name: productName,
                model_type: `Model-${i}00`,
                manufacturer_name: 'PGE Mfg',
                factory_location: 'Location A',
                applied_standard: 'ISO 17065',
                certification_type: 'Product',
                status: 'Under Review', // Start at Under Review to accept immediately
                created_by: adminId
            })
            .select()
            .single()

        if (appErr) {
            console.error(`App ${i} creation failed:`, appErr.message)
            continue
        }

        // Accept Application (Insert into Audits)
        const { error: auditErr } = await supabase
            .from('audits')
            .insert({
                audit_code: auditCode,
                project_code: auditCode,
                application_id: app.id,
                client_org_id: orgId,
                client_id: adminId, // Required field based on dashboard query!
                client_name: orgName,
                audit_type: 'Product',
                status: 'planned',
                applicable_standards: ['ISO 17065'], // audit-allocation.ts uses array
                standard: 'ISO 17065',    // Backup field based on dashboard view
                scope: productName,
                scope_of_recognition: productName,
                audit_date: new Date().toISOString(), // SET DATE SO IT SHOWS UP IN SORTED LIST
                created_at: new Date().toISOString()
            })

        if (auditErr) {
            console.error(`Audit ${i} creation failed:`, auditErr.message)
        } else {
            // Update app status
            await supabase
                .from('audit_applications')
                .update({ status: 'Accepted', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
                .eq('id', app.id)

            console.log(`Audit ${i} CREATED successfully!`)
        }
    }
}

main()
