
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const LOG_FILE = 'bulk_log.txt'
const log = (msg: string) => fs.appendFileSync(LOG_FILE, msg + '\n')

async function main() {
    fs.writeFileSync(LOG_FILE, 'Start Bulk V4 - Direct Audits\n')

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const { data: { session }, error: loginErr } = await supabase.auth.signInWithPassword({
        email: 'admin@system.com',
        password: 'password123'
    })

    if (loginErr || !session) { log(`Login Err: ${loginErr?.message}`); return }
    const adminId = session.user.id
    log(`Admin: ${adminId}`)

    // Create 3 Audits
    for (let i = 1; i <= 3; i++) {
        const ts = Date.now()
        const code = `BULK-DIRECT-${ts}-${i}`

        const { error: insertErr } = await supabase.from('audits').insert({
            audit_code: code,
            project_code: code,
            client_id: adminId, // Using Admin as Client for test
            scope: `Scope ${ts} ${i}`,
            standard: 'ISO 17065',
            status: 'planned',
            audit_date: new Date().toISOString(),
            created_at: new Date().toISOString()
            // application_id OMITTED
            // client_org_id OMITTED
        })

        if (insertErr) log(`Audit ${i} Err: ${insertErr.message}`)
        else log(`Audit ${i} SUCCESS`)
    }
}
main()
