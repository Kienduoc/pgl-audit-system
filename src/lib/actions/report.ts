'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAuditReportData(auditId: string) {
    const supabase = await createClient()

    // 1. Fetch Audit Details & Client Info
    const { data: audit, error: auditError } = await supabase
        .from('audits')
        .select(`
            *,
            client:profiles!client_id(*)
        `)
        .eq('id', auditId)
        .single()

    if (auditError) throw new Error(`Audit fetch error: ${auditError.message}`)

    // 2. Fetch Team (from audit_members, fallback to audit_teams if linked by application_id, but audits doesn't have application_id)
    // We will assume audit_members is the correct table for audit execution team
    const { data: team, error: teamError } = await supabase
        .from('audit_members')
        .select(`
            *,
            profile:profiles(full_name, role)
        `)
        .eq('audit_id', auditId)

    if (teamError) {
        // Just log, don't throw blocking error for team
        console.error(`Team fetch error: ${teamError.message}`)
    }

    // 3. Fetch Findings
    const { data: findings, error: findingsError } = await supabase
        .from('findings')
        .select('*')
        .eq('audit_id', auditId)
        .neq('status', 'rejected')
        .order('created_at', { ascending: true })

    if (findingsError) throw new Error(`Findings fetch error: ${findingsError.message}`)

    return {
        audit,
        team: team || [],
        findings: findings || []
    }
}
