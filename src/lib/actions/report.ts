'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAuditReportData(auditId: string) {
    const supabase = await createClient()

    // 1. Fetch Audit Details & Client Info
    const { data: audit, error: auditError } = await supabase
        .from('audits')
        .select(`
            *,
            client:client_organizations(*)
        `)
        .eq('id', auditId)
        .single()

    if (auditError) throw new Error(`Audit fetch error: ${auditError.message}`)

    const { data: team, error: teamError } = await supabase
        .from('audit_members')
        .select(`
            *,
            profile:profiles(full_name)
        `)
        .eq('audit_id', auditId)

    if (teamError) throw new Error(`Team fetch error: ${teamError.message}`)

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
