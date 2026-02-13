
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function main() {
    console.log('--- Logging in ---')
    const { data: { session }, error: loginErr } = await supabase.auth.signInWithPassword({
        email: 'admin@system.com',
        password: 'password123'
    })

    if (loginErr) { fs.writeFileSync('debug_output.txt', `Login Err: ${loginErr.message}`); return }
    const adminId = session?.user.id
    console.log(`Admin ID: ${adminId}`)

    // Check if profile exists
    const { data: profile, error: profErr } = await supabase.from('profiles').select('*').eq('id', adminId).single()
    if (profErr) { fs.writeFileSync('debug_output.txt', `Profile Err: ${profErr.message}`); return }

    console.log(`Profile: ${profile?.full_name}`)
    // ... proceed to bulk if OK
}
main()
