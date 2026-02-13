
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const LOG_FILE = 'bulk_log.txt'
const log = (msg: string) => fs.appendFileSync(LOG_FILE, msg + '\n')

async function main() {
    fs.writeFileSync(LOG_FILE, 'List Apps Status\n')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Login as admin to bypass RLS
    const { data: { session }, error: loginErr } = await supabase.auth.signInWithPassword({
        email: 'admin@system.com',
        password: 'password123'
    })

    const { data, error } = await supabase.from('audit_applications').select('id, status, product_name, user_id').order('created_at', { ascending: false })

    if (error) { log(`ERR: ${error.message}`); return }

    if (data && data.length > 0) {
        data.forEach((app, i) => {
            log(`App ${i + 1}: ID=${app.id}, Status='${app.status}', Product='${app.product_name}', User=${app.user_id}`)
        })
    } else {
        log('No apps found.')
    }
}
main()
