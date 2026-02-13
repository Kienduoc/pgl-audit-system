
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials')
    process.exit(1)
}

async function main() {
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Checking audits table data...')

    // Check if column exists by selecting it
    const { error: colError } = await supabase
        .from('audits')
        .select('audit_code')
        .limit(1)

    if (colError) {
        console.log('Column audit_code MISSING')
        return
    }

    // Check count of audits with audit_code
    const { count, error } = await supabase
        .from('audits')
        .select('*', { count: 'exact', head: true })
        .not('audit_code', 'is', null)

    if (error) {
        console.error('Error counting:', error.message)
    } else {
        console.log(`Found ${count} audits with audit_code populated.`)

        if (count && count > 0) {
            // Fetch one to show
            const { data } = await supabase
                .from('audits')
                .select('audit_code, project_code')
                .not('audit_code', 'is', null)
                .limit(1)
                .single()
            console.log('Sample:', data)
        }
    }
}

main()
