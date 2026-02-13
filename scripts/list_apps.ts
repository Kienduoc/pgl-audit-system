
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
    const { data: apps } = await supabase.from('audit_applications').select('id, product_name, status, created_at')

    console.table(apps)
}
main()
