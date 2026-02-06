'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAuditFindings(auditId: string) {
    const supabase = await createClient()

    const { data: findings, error } = await supabase
        .from('findings')
        .select('*')
        .eq('audit_id', auditId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching findings:', error)
        return []
    }

    return findings
}

export async function updateFindingStatus(findingId: string, status: 'open' | 'closed' | 'approved' | 'rejected') {
    const supabase = await createClient()

    // Check permissions (Lead Auditor only for 'approved'/'rejected')
    // For MVP, valid authenticated user can update for now, or check role if easy.
    // Assuming simple auth check.

    const { error } = await supabase
        .from('findings')
        .update({
            status: status,
            updated_at: new Date().toISOString()
        })
        .eq('id', findingId)

    if (error) return { success: false, error: error.message }

    // Need to revalidate the specific audit page, but we don't have audit_id here easily without fetching.
    // Or we can just revalidate all audits paths roughly or pass audit_id.
    // Let's fetch audit_id first to be precise.
    const { data } = await supabase.from('findings').select('audit_id').eq('id', findingId).single()
    if (data) {
        revalidatePath(`/audits/${data.audit_id}/findings`)
        revalidatePath(`/audits/${data.audit_id}/report/findings`)
    }

    return { success: true }
}

export async function updateFindingDetails(findingId: string, details: { description?: string, type?: string, clause?: string }) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('findings')
        .update({
            ...details,
            updated_at: new Date().toISOString()
        })
        .eq('id', findingId)

    if (error) return { success: false, error: error.message }

    const { data } = await supabase.from('findings').select('audit_id').eq('id', findingId).single()
    if (data) {
        revalidatePath(`/audits/${data.audit_id}/findings`)
    }

    return { success: true }
}

export async function deleteFinding(findingId: string) {
    const supabase = await createClient()

    // Get audit_id before delete
    const { data } = await supabase.from('findings').select('audit_id').eq('id', findingId).single()

    const { error } = await supabase
        .from('findings')
        .delete()
        .eq('id', findingId)

    if (error) return { success: false, error: error.message }

    if (data) {
        revalidatePath(`/audits/${data.audit_id}/findings`)
    }

    return { success: true }
}
