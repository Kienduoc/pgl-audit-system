
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

    if (loginError) console.error('Error logging in:', loginError.message)
    const { data: users } = await supabase.from('profiles').select('id, full_name').neq('role', 'admin').limit(1)
    const { data: orgs } = await supabase.from('client_organizations').select('id, english_name').limit(1)

    console.log('Valid User:', users?.[0])
    console.log('Valid Org:', orgs?.[0])
}
main()
