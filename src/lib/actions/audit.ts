'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createAudit(formData: FormData) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized. Please login.' }
    }

    const project_code = formData.get('project_code') as string
    const standard = formData.get('standard') as string
    const audit_date = formData.get('audit_date') as string || null
    const client_mode = formData.get('client_mode') as string
    const scope = formData.get('scope') as string || null

    let client_id: string

    // Determine if this is Client self-registration or Admin creating for client
    if (!client_mode) {
        // CLIENT SELF-REGISTRATION (from BM01b wizard)
        // Use current logged-in user as the client
        client_id = user.id

        // Optionally update client profile with company info from form
        const company_name = formData.get('company_name') as string
        const tax_code = formData.get('tax_code') as string
        const representative = formData.get('representative') as string
        const address = formData.get('address') as string
        const phone = formData.get('phone') as string

        if (company_name || tax_code || representative || address || phone) {
            await supabase
                .from('profiles')
                .update({
                    company_name,
                    tax_code,
                    representative_name: representative,
                    address,
                    phone
                })
                .eq('id', user.id)
        }
    } else {
        // ADMIN MODE (existing logic)
        if (client_mode === 'new') {
            return { error: "Development limitation: Cannot create new Auth User via Client. Please create user in Supabase Auth first, then select 'Existing Client'." }
        }

        client_id = formData.get('client_id') as string

        if (!client_id && client_mode === 'existing') {
            return { error: "Please select a client." }
        }

        if (client_mode === 'existing' && !audit_date) {
            return { error: "Audit Date is required for existing clients." }
        }
    }

    // 2. Create Audit
    const { data: audit, error: auditError } = await supabase
        .from('audits')
        .insert({
            project_code,
            client_id,
            audit_date,
            status: 'planned',
            standard,
            scope
        })
        .select()
        .single()

    if (auditError) {
        if (auditError.code === '23505') {
            return { error: `Project Code "${project_code}" already exists. Please use a different code.` }
        }
        return { error: 'Failed to create audit: ' + auditError.message }
    }

    // 3. Checklist Templates (Same as before)
    const { data: templates } = await supabase.from('checklist_templates').select('*').eq('is_active', true)
    if (templates && templates.length > 0) {
        const checklistItems = templates.map(t => ({
            audit_id: audit.id,
            section: t.section,
            requirement: t.requirement,
            status: 'pending'
        }))
        await supabase.from('audit_checklist_items').insert(checklistItems)
    }

    revalidatePath('/audits')
    redirect(`/audits/${audit.id}/overview`)
}

export async function deleteAudit(auditId: string) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify ownership and status
    const { data: audit } = await supabase
        .from('audits')
        .select('client_id, status')
        .eq('id', auditId)
        .single()

    if (!audit) return { error: 'Audit not found' }
    if (audit.client_id !== user.id) return { error: 'Unauthorized' }
    if (audit.status !== 'planned') return { error: 'Can only delete planned audits' }

    // Delete audit (cascade will handle related records)
    const { error } = await supabase
        .from('audits')
        .delete()
        .eq('id', auditId)

    if (error) return { error: error.message }

    revalidatePath('/profile')
    revalidatePath('/audits')
    return { success: true }
}

export async function updateAuditDate(auditId: string, newDate: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify ownership and status
    const { data: audit } = await supabase
        .from('audits')
        .select('client_id, status')
        .eq('id', auditId)
        .single()

    if (!audit) return { error: 'Audit not found' }
    if (audit.client_id !== user.id) return { error: 'Unauthorized' }
    if (audit.status !== 'planned') return { error: 'Can only edit planned audits' }

    // Update date
    const { error } = await supabase
        .from('audits')
        .update({ audit_date: newDate })
        .eq('id', auditId)

    if (error) return { error: error.message }

    revalidatePath('/profile')
    revalidatePath('/audits')
    return { success: true }
}
