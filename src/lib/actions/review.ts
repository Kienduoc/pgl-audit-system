'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'

export async function getAuditDossierWithReviews(auditId: string) {
    const supabase = await createClient()

    // 1. Get Audit Details to find Application ID
    const { data: audit, error: auditError } = await supabase
        .from('audits')
        .select(`
            *,
            client:profiles!client_id (*),
            application:audit_applications!application_id (*)
        `)
        .eq('id', auditId)
        .single()

    if (auditError || !audit) {
        console.error('Error fetching audit:', auditError)
        return { audit: null, dossier: [], reviews: [] }
    }

    const applicationId = audit.application_id

    // 2. Get Dossier Items (Client Uploads) linked to Application
    const { data: dossier, error: docError } = await supabase
        .from('audit_dossier')
        .select('*')
        .eq('application_id', applicationId)

    if (docError) {
        console.error('Error fetching dossier:', docError)
        return { audit, dossier: [], reviews: [] }
    }

    // 3. Get Existing Reviews (Auditor Decisions) linked to Audit
    const { data: reviews, error: revError } = await supabase
        .from('audit_document_reviews')
        .select('*')
        .eq('audit_id', auditId)

    if (revError) {
        console.error('Error fetching reviews:', revError)
        return { audit, dossier: dossier || [], reviews: [] }
    }

    return {
        audit,
        dossier: dossier || [],
        reviews: reviews || []
    }
}

export async function saveDocumentReview(data: {
    audit_id: string
    item_id: string
    section_id: string
    status: 'pending' | 'ok' | 'minor' | 'major' | 'critical'
    auditor_notes?: string
}) {
    const supabase = await createClient()
    const user = await supabase.auth.getUser()

    if (!user.data.user) return { success: false, error: 'Unauthorized' }

    // Upsert review
    const { error } = await supabase
        .from('audit_document_reviews')
        .upsert({
            audit_id: data.audit_id,
            section_id: data.section_id,
            item_id: data.item_id,
            status: data.status,
            auditor_notes: data.auditor_notes,
            auditor_id: user.data.user.id,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'audit_id, item_id'
        })

    if (error) return { success: false, error: error.message }

    revalidatePath(`/audits/${data.audit_id}/document-review`)
    return { success: true }
}

export async function completeDocumentReview(auditId: string) {
    const supabase = await createClient()
    const user = await supabase.auth.getUser()

    if (!user.data.user) return { success: false, error: 'Unauthorized' }

    // 1. Verify all critical items are reviewed (Optional, for now just force complete)
    // 2. Update Audit Status
    const { data: audit, error: updateError } = await supabase
        .from('audits')
        .update({ status: 'ongoing' }) // Move to next stage (On-site / Ongoing)
        .eq('id', auditId)
        .select()
        .single()

    if (updateError) return { success: false, error: updateError.message }

    // 3. Notify Client
    if (audit && audit.client_id) {
        await createNotification({
            user_id: audit.client_id,
            audit_id: auditId,
            type: 'info',
            title: 'Document Review Completed',
            message: `The document review for project ${audit.project_code} has been completed. You can now proceed to the next stage.`,
            link: `/audits/${auditId}/overview`
        })
    }

    revalidatePath(`/audits/${auditId}`)
    return { success: true }
}
