
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function main() {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@system.com',
        password: 'password123'
    })

    if (loginError) console.error('Admin login err:', loginError.message)
    const { count: c1 } = await supabase.from('audit_applications').select('*', { count: 'exact', head: true })
    const { count: c2 } = await supabase.from('audits').select('*', { count: 'exact', head: true })
    console.log(`__APPS_COUNT__:${c1}`)
    console.log(`__AUDITS_COUNT__:${c2}`)
}
main()
