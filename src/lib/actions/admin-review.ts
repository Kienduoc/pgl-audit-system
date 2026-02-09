"use server"

import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/role-utils"
import { revalidatePath } from "next/cache"

export async function adminReviewApplication(applicationId: string, decision: 'approved' | 'rejected' | 'info_needed', notes?: string) {
    const role = await getUserRole()
    if (role !== 'admin') {
        return { success: false, error: "Unauthorized" }
    }

    const supabase = await createClient()

    try {
        // 1. Update Application Status
        const { error: updateError } = await supabase
            .from('audit_applications')
            .update({
                status: decision,
                updated_at: new Date().toISOString()
                // notes/reviewed_by might need schema update if not present
            })
            .eq('id', applicationId)

        if (updateError) throw updateError

        revalidatePath('/admin/applications')
        revalidatePath(`/admin/applications/${applicationId}`)

        return { success: true }
    } catch (error: any) {
        console.error("Review Error:", error)
        return { success: false, error: error.message }
    }
}

export async function getApplicationDetails(id: string) {
    const role = await getUserRole()
    if (role !== 'admin') return { error: "Unauthorized" }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('audit_applications')
        .select(`
            *,
            profiles:user_id (
                full_name,
                email,
                company_name,
                phone_number
            )
        `)
        .eq('id', id)
        .single()

    if (error) return { error: error.message }
    return { data }
}
