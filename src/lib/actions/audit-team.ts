'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type AuditCandidate = {
    id: string
    full_name: string
    email: string
    role: string
}

export async function getAuditCandidates() {
    const supabase = await createClient()

    // Fetch profiles with role 'auditor' or 'lead_auditor'
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['auditor', 'lead_auditor'])
        .order('full_name')

    if (error) {
        console.error('Error fetching candidates:', error)
        return { error: 'Failed to fetch candidates' }
    }

    return { data: data as AuditCandidate[] }
}

export async function assignAuditTeam(
    auditId: string,
    leadAuditorId: string,
    auditorIds: string[]
) {
    const supabase = await createClient()

    // check current user role (must be admin or possibly lead auditor?)
    // For now assuming RLS or middleware handles page access, but good to check here too.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Update Audit Lead
    const { error: updateError } = await supabase
        .from('audits')
        .update({
            lead_auditor_id: leadAuditorId,
            status: 'ongoing' // Automatically move to ongoing? Or keep planned? Let's assume start.
        })
        .eq('id', auditId)

    if (updateError) {
        return { error: 'Failed to update Lead Auditor' }
    }

    // 2. Clear existing members (simple strategy: delete all for this audit and re-insert)
    // Be careful if we want to preserve history/roles. 
    // Ideally we diff, but reset is safer for MVP "Assignments".
    await supabase.from('audit_members').delete().eq('audit_id', auditId)

    // 3. Insert new members
    // Add Lead Auditor to members as well? Usually Lead is strictly in audits table, 
    // but sometimes helpful to have in members for unified queries. 
    // Document/Role.md says "Establish Audit Team". 
    // Let's insert selected auditors.
    if (auditorIds.length > 0) {
        const membersPayload = auditorIds.map(uid => ({
            audit_id: auditId,
            user_id: uid,
            role: 'auditor'
        }))

        const { error: insertError } = await supabase
            .from('audit_members')
            .insert(membersPayload)

        if (insertError) {
            console.error(insertError)
            return { error: 'Failed to assign auditors' }
        }
    }

    revalidatePath(`/audits/${auditId}`)
    return { success: true }
}
