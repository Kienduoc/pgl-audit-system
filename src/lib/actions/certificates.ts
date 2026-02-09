'use server'

import { createClient } from '@/lib/supabase/server'

export async function getClientCertificates() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // 1. Get Client Organization
    const { data: org } = await supabase
        .from('client_organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!org) return []

    // 2. Get Audits with Certified status
    const { data: certificates } = await supabase
        .from('audits')
        .select(`
            id,
            project_code,
            standard,
            certificate_number,
            issue_date,
            expiry_date,
            certification_scope,
            status,
            application:audit_applications(product_name, model_type)
        `)
        .eq('client_org_id', org.id)
        .eq('status', 'certified')
        .order('issue_date', { ascending: false })

    return (certificates as any) || []
}
