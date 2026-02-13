
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const LOG_FILE = 'bulk_log.txt'
const log = (msg: string) => fs.appendFileSync(LOG_FILE, msg + '\n')

async function main() {
    fs.writeFileSync(LOG_FILE, 'Check Report Schema Strict\n')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Check client_organizations
    const { data: d1, error: e1 } = await supabase.from('client_organizations').select('*').limit(1)
    if (e1) log(`client_organizations ERR: ${e1.message}`)
    else log(`client_organizations OK: ${JSON.stringify(d1)}`)

    // Check audit_members
    const { data: d2, error: e2 } = await supabase.from('audit_members').select('*').limit(1)
    if (e2) log(`audit_members ERR: ${e2.message}`)
    else log(`audit_members OK: ${JSON.stringify(d2)}`)

    // Check audits foreign key to client_organizations
    const { data: d3, error: e3 } = await supabase.from('audits').select('client:client_org_id(id)').limit(1)
    if (e3) log(`audits -> client_org_id ERR: ${e3.message}`)
    else log(`audits -> client_org_id OK: ${JSON.stringify(d3)}`)

    // Check audits foreign key to client_organizations (just 'client' name)
    const { data: d4, error: e4 } = await supabase.from('audits').select('client:client_id(id)').limit(1)
    if (e4) log(`audits -> client_id ERR: ${e4.message}`)
    else log(`audits -> client_id OK: ${JSON.stringify(d4)}`)
}
main()
