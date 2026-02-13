
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function main() {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Login as Admin
    console.log('Logging in as Admin...')
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@system.com',
        password: 'password123'
    })

    if (loginError || !session) {
        console.error('Admin login failed:', loginError?.message)
        // Fallback: Try a known client if admin fails, just to see something
        // But Admin is crucial for "All Projects"
        return
    }

    console.log('Admin logged in:', session.user.id)

    console.log('--- Database Counts (Authenticated) ---')

    // 1. Audit Applications
    const { count: appCount, error: appError } = await supabase
        .from('audit_applications')
        .select('*', { count: 'exact', head: true })

    if (appError) console.error('Error counting applications:', appError.message)
    else console.log(`Total Audit Applications: ${appCount}`)

    // 2. Audits
    const { count: auditCount, error: auditError } = await supabase
        .from('audits')
        .select('*', { count: 'exact', head: true })

    if (auditError) console.error('Error counting audits:', auditError.message)
    else console.log(`Total Audits (Projects): ${auditCount}`)

    // 3. List Audits
    const { data: audits } = await supabase
        .from('audits')
        .select('id, audit_code, project_code, status')

    if (audits) {
        console.table(audits)
    }
}

main()
