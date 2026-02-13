
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const LOG_FILE = 'bulk_log.txt'
const log = (msg: string) => fs.appendFileSync(LOG_FILE, msg + '\n')

async function main() {
    fs.writeFileSync(LOG_FILE, 'Check Audit Teams Strict\n')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Check audit_application_id
    const { data: d1, error: e1 } = await supabase.from('audit_teams').select('audit_application_id').limit(1)
    if (e1) log(`audit_application_id ERR: ${e1.message}`)
    else log(`audit_application_id OK: ${JSON.stringify(d1)}`)

    // Check audit_id - maybe this exists?
    const { data: d2, error: e2 } = await supabase.from('audit_teams').select('audit_id').limit(1)
    if (e2) log(`audit_id ERR: ${e2.message}`)
    else log(`audit_id OK: ${JSON.stringify(d2)}`)

    // Check user_id
    const { data: d3, error: e3 } = await supabase.from('audit_teams').select('user_id').limit(1)
    if (e3) log(`user_id ERR: ${e3.message}`)
    else log(`user_id OK: ${JSON.stringify(d3)}`)

    // Check role
    const { data: d4, error: e4 } = await supabase.from('audit_teams').select('role').limit(1)
    if (e4) log(`role ERR: ${e4.message}`)
    else log(`role OK: ${JSON.stringify(d4)}`)
}
main()
