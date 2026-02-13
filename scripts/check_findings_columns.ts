
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const LOG_FILE = 'bulk_log.txt'
const log = (msg: string) => fs.appendFileSync(LOG_FILE, msg + '\n')

async function main() {
    fs.writeFileSync(LOG_FILE, 'Check Findings Columns\n')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Sign In
    const { data: { session }, error: loginErr } = await supabase.auth.signInWithPassword({
        email: 'admin@system.com',
        password: 'password123'
    })

    const { data, error } = await supabase.from('findings').select('*').limit(1)

    if (error) { log(`ERR: ${error.message}`); return }

    if (data && data.length > 0) {
        log(`Findings Columns: ${JSON.stringify(Object.keys(data[0]))}`)
    } else {
        log('No findings found to inspect columns.')
        // Try to inspect via error (select 'foo')
        const { error: e2 } = await supabase.from('findings').select('foo').limit(1)
        if (e2) log(`Cols Error hint: ${e2.message} ${e2.hint}`)
    }
}
main()
