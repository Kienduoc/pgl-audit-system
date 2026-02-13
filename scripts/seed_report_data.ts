
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const LOG_FILE = 'bulk_log.txt'
const log = (msg: string) => fs.appendFileSync(LOG_FILE, msg + '\n')

async function main() {
    fs.writeFileSync(LOG_FILE, 'Seed Report Data\n')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Sign In to bypass RLS
    const { data: { session }, error: loginErr } = await supabase.auth.signInWithPassword({
        email: 'admin@system.com',
        password: 'password123'
    })
    if (loginErr || !session) {
        log(`ERR: Login failed: ${loginErr?.message}`)
        return
    }

    // 1. Get an existing Audit
    const { data: audits, error: auditErr } = await supabase
        .from('audits')
        .select('id, client_id')
        .order('id', { ascending: false })
        .limit(1)

    if (auditErr || !audits || audits.length === 0) {
        log(`ERR: Could not find any audit. Please create one. ${auditErr?.message}`)
        return
    }
    const audit = audits[0]
    log(`Using Audit ID: ${audit.id}`)

    // 2. Get a valid user (admin or any profile) for team member
    const { data: profiles, error: userErr } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)

    if (userErr || !profiles || profiles.length === 0) {
        log(`ERR: Could not find any user/profile. ${userErr?.message}`)
        return
    }
    const user = profiles[0]
    log(`Using User ID: ${user.id}`)

    // 3. Insert Audit Team Member (if table exists)
    // First, clear existing members for this audit
    await supabase.from('audit_members').delete().eq('audit_id', audit.id)

    const { error: teamErr } = await supabase.from('audit_members').insert({
        audit_id: audit.id,
        user_id: user.id, // Current profile
        role: 'Lead Auditor',
    })

    if (teamErr) log(`Team Insert ERR: ${teamErr.message}`)
    else log('Team Insert OK')

    // 4. Insert Findings (3 items: Major, Minor, Obs)
    // First, clear existing findings
    await supabase.from('findings').delete().eq('audit_id', audit.id)

    const findingsData = [
        {
            audit_id: audit.id,
            severity: 'Major',
            description: 'Major non-conformity in document control.',
            status: 'open',
            created_at: new Date().toISOString()
        },
        {
            audit_id: audit.id,
            severity: 'Minor',
            description: 'Minor non-conformity in record keeping.',
            status: 'open',
            created_at: new Date().toISOString()
        },
        {
            audit_id: audit.id,
            severity: 'Observation',
            description: 'Observation regarding potential risk.',
            status: 'open',
            created_at: new Date().toISOString()
        }
    ]

    const { error: findErr } = await supabase.from('findings').insert(findingsData)

    if (findErr) log(`Findings Insert ERR: ${findErr.message}`)
    else log('Findings Insert OK')

    // Log the link
    log(`REPORT URL: http://localhost:3000/audits/${audit.id}/report`)
}
main()
