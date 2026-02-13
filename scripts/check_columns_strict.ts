
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const LOG_FILE = 'bulk_log.txt'
const log = (msg: string) => fs.appendFileSync(LOG_FILE, msg + '\n')

async function main() {
    fs.writeFileSync(LOG_FILE, 'Check Columns Strict\n')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Check client_org_id explicitly
    const { data: d1, error: e1 } = await supabase.from('audit_applications').select('client_org_id').limit(1)
    if (e1) log(`client_org_id ERR: ${e1.message}`)
    else log(`client_org_id OK: ${JSON.stringify(d1)}`)

    // Check user_id explicitly
    const { data: d2, error: e2 } = await supabase.from('audit_applications').select('user_id').limit(1)
    if (e2) log(`user_id ERR: ${e2.message}`)
    else log(`user_id OK: ${JSON.stringify(d2)}`)

    // Check content explicitly
    const { data: d3, error: e3 } = await supabase.from('audit_applications').select('content').limit(1)
    if (e3) log(`content ERR: ${e3.message}`)
    else log(`content OK: ${JSON.stringify(d3)}`)

    // Check org_id (just in case)
    const { data: d4, error: e4 } = await supabase.from('audit_applications').select('org_id').limit(1)
    if (e4) log(`org_id ERR: ${e4.message}`)
    else log(`org_id OK: ${JSON.stringify(d4)}`)
}
main()
