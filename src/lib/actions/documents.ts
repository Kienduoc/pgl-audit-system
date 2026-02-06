'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadAuditDocument(auditId: string, name: string, path: string, type: string) {
    const supabase = await createClient()

    // Get current user (uploader)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Insert into DB
    const { error } = await supabase
        .from('audit_documents')
        .insert({
            audit_id: auditId,
            uploader_id: user.id,
            name,
            file_url: path,
            file_type: type,
            status: 'pending',
            assigned_auditors: []
        })

    if (error) return { error: error.message }
    revalidatePath(`/audits/${auditId}`)
    return { success: true }
}

export async function deleteAuditDocument(auditId: string, docId: string) {
    const supabase = await createClient()

    // RLS will handle permission checks (e.g. only uploader or Lead can delete)
    const { error } = await supabase
        .from('audit_documents')
        .delete()
        .eq('id', docId)

    if (error) return { error: error.message }
    revalidatePath(`/audits/${auditId}`)
    return { success: true }
}

export async function assignAuditorToDocument(auditId: string, docId: string, auditorId: string) {
    const supabase = await createClient()

    // Call the helper function we defined in SQL
    const { error } = await supabase.rpc('append_auditor_access', {
        doc_id: docId,
        auditor_id: auditorId
    })

    if (error) return { error: error.message }
    revalidatePath(`/audits/${auditId}`)
    return { success: true }
}
