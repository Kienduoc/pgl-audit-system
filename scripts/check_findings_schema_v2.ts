
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const LOG_FILE = 'bulk_log.txt'
const log = (msg: string) => fs.appendFileSync(LOG_FILE, msg + '\n')

async function main() {
    fs.writeFileSync(LOG_FILE, 'Check Findings Columns V2\n')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Sign In
    await supabase.auth.signInWithPassword({
        email: 'admin@system.com',
        password: 'password123'
    })

    const columns = ['type', 'nc_type', 'severity', 'clause', 'standard_clause', 'description', 'status', 'audit_id']
    for (const col of columns) {
        const { error } = await supabase.from('findings').select(col).limit(1)
        if (error) log(`${col}: ERR (${error.message})`)
        else log(`${col}: OK`)
    }
}
main()
