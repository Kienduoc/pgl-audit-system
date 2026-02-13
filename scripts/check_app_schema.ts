
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function main() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const { data: { session }, error: loginErr } = await supabase.auth.signInWithPassword({
        email: 'admin@system.com',
        password: 'password123'
    })

    const { data, error } = await supabase.from('audit_applications').select('*').limit(1)

    if (error) console.error('Err:', error.message)
    else if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]))
        console.log('Data:', data[0])
    } else {
        console.log('No data found, cannot list columns easily this way. Please check schema tool.')
    }
}
main()
