'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function searchClients(query: string) {
    const supabase = await createClient()

    // If empty query, return recent clients
    if (!query) {
        const { data, error } = await supabase
            .from('client_organizations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5)
        return { data, error }
    }

    const { data, error } = await supabase
        .from('client_organizations')
        .select('*')
        .or(`english_name.ilike.%${query}%,vietnamese_name.ilike.%${query}%,tax_code.ilike.%${query}%`)
        .limit(10)

    return { data, error }
}

export async function getClientApplications(clientId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('audit_applications')
        .select('*')
        .eq('client_org_id', clientId)
        .order('created_at', { ascending: false })

    return { data, error }
}

export async function createQuickApplication(formData: any) {
    const supabase = await createClient()

    // 1. If new Client, create Client Org first
    let clientId = formData.client_org_id

    if (!clientId && formData.new_client_name) {
        const { data: newClient, error: clientError } = await supabase
            .from('client_organizations')
            .insert({
                english_name: formData.new_client_name,
                tax_code: formData.new_client_tax_code,
                office_address: formData.new_client_address,
                // Assign to current user as placeholder if no profile_id passed, 
                // or handle client user creation separately.
                // For Admin manual entry, often we don't have a user account yet.
            })
            .select()
            .single()

        if (clientError) return { error: clientError.message }
        clientId = newClient.id
    }

    // 2. Create Application
    const { data, error } = await supabase
        .from('audit_applications')
        .insert({
            client_org_id: clientId,
            product_name: formData.product_name,
            model_type: formData.model_type,
            manufacturer_name: formData.manufacturer_name,
            factory_location: formData.factory_location,
            applied_standard: formData.applied_standard,
            certification_type: formData.certification_type,
            status: 'submitted', // Auto-submit for Admin entry
            created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

    if (error) return { error: error.message }
    return { data } // Returns the new Application
}

export async function createAuditFromApplication(applicationId: string, auditConfig: any) {
    const supabase = await createClient()

    // 1. Get Application Details
    const { data: app, error: appError } = await supabase
        .from('audit_applications')
        .select('*, client_organizations(*)')
        .eq('id', applicationId)
        .single()

    if (appError) return { error: "Application not found" }

    // 2. Create Audit
    // Generate Audit Code (Simple logic for now, unique timestamp-based)
    const auditCode = `AUD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`

    const { data: audit, error: auditError } = await supabase
        .from('audits')
        .insert({
            audit_code: auditCode,
            application_id: app.id,
            client_org_id: app.client_org_id,
            client_name: app.client_organizations?.english_name,
            audit_type: auditConfig.audit_type || app.certification_type, // Prefer config, fallback to app
            audit_date: auditConfig.audit_date,
            lead_auditor_id: auditConfig.lead_auditor_id,
            status: 'planned',
            applicable_standards: [app.applied_standard],
            scope_of_recognition: app.product_name // Simple mapping
        })
        .select()
        .single()

    if (auditError) return { error: auditError.message }

    // 3. Update Application Status
    await supabase
        .from('audit_applications')
        .update({ status: 'converted' })
        .eq('id', applicationId)

    revalidatePath('/audits')
    return { data: audit, redirect: `/audits/${audit.id}/overview` }
}
