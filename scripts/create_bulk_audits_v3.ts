
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const LOG_FILE = 'bulk_log.txt'
const log = (msg: string) => fs.appendFileSync(LOG_FILE, msg + '\n')

async function main() {
    fs.writeFileSync(LOG_FILE, 'Start Bulk Audits V3\n')

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const { data: { session }, error: loginErr } = await supabase.auth.signInWithPassword({
        email: 'admin@system.com',
        password: 'password123'
    })

    if (loginErr || !session) {
        log(`Login Err: ${loginErr?.message}`)
        return
    }

    const adminId = session.user.id
    log(`Admin: ${adminId}`)

    const { data: orgs } = await supabase.from('client_organizations').select('*').limit(1)
    const orgId = orgs?.[0]?.id

    if (!orgId) {
        log('No org found.')
        return
    }

    const ts = Date.now()

    for (let i = 1; i <= 3; i++) {
        const auditCode = `BULK-V3-${ts}-${i}`
        const productName = `Product V3 ${ts} ${i}`

        // MINIMAL INSERT
        const appPayload = {
            user_id: adminId,
            client_org_id: orgId,
            product_name: productName,
            status: 'Under Review',
            content: {
                model_type: 'Model-X',
                manufacturer_name: 'Mfg',
                factory_location: 'Loc A',
                certification_type: 'Product',
                applied_standard: 'ISO 17065'
            },
            // created_by: adminId // might fail if not in schema
        }

        const { data: app, error: appErr } = await supabase.from('audit_applications').insert(appPayload).select().single()

        if (appErr) { log(`App ${i} Err: ${appErr.message}`); continue }
        log(`App ${i} Created: ${app.id}`)

        // Create Audit
        const { error: auditErr } = await supabase.from('audits').insert({
            audit_code: auditCode, project_code: auditCode,
            application_id: app.id, client_org_id: orgId, client_id: adminId,
            client_name: 'Bulk Org', audit_type: 'Product', status: 'planned',
            applicable_standards: ['ISO 17065'], standard: 'ISO 17065',
            scope: productName, scope_of_recognition: productName,
            audit_date: new Date().toISOString(), created_at: new Date().toISOString()
        })

        if (auditErr) { log(`Audit ${i} Err: ${auditErr.message}`); continue }

        await supabase.from('audit_applications').update({ status: 'Accepted' }).eq('id', app.id)
        log(`Audit ${i} SUCCESS`)
    }
    log('Done V3')
}
main()
