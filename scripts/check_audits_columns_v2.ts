
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const LOG_FILE = 'bulk_log.txt'
const log = (msg: string) => fs.appendFileSync(LOG_FILE, msg + '\n')

async function main() {
    fs.writeFileSync(LOG_FILE, 'Check Audits V2 Strict\n')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Check scope
    const { data: d1, error: e1 } = await supabase.from('audits').select('scope').limit(1)
    if (e1) log(`scope ERR: ${e1.message}`)
    else log(`scope OK: ${JSON.stringify(d1)}`)

    // Check standard
    const { data: d2, error: e2 } = await supabase.from('audits').select('standard').limit(1)
    if (e2) log(`standard ERR: ${e2.message}`)
    else log(`standard OK: ${JSON.stringify(d2)}`)

    // Check status
    const { data: d3, error: e3 } = await supabase.from('audits').select('status').limit(1)
    if (e3) log(`status ERR: ${e3.message}`)
    else log(`status OK: ${JSON.stringify(d3)}`)

    // Check audit_date
    const { data: d4, error: e4 } = await supabase.from('audits').select('audit_date').limit(1)
    if (e4) log(`audit_date ERR: ${e4.message}`)
    else log(`audit_date OK: ${JSON.stringify(d4)}`)
}
main()
