'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAuditStatus(auditId: string, newStatus: string) {
    const supabase = await createClient()

    // Check permission (Lead Auditor or Admin) - simplified RLS should handle, but good to check role
    /* 
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    // Role check logic...
    */

    const { error } = await supabase
        .from('audits')
        .update({ status: newStatus })
        .eq('id', auditId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/audits/${auditId}`)
    return { success: true }
}

export async function addAuditMember(auditId: string, userId: string, role: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('audit_members')
        .insert({ audit_id: auditId, user_id: userId, role })

    if (error) return { error: error.message }
    revalidatePath(`/audits/${auditId}`)
    return { success: true }
}
