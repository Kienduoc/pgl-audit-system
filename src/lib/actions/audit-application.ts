'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { applicationSchema, AuditApplicationFormValues } from "@/lib/validations/audit-application"

export async function createApplication(data: AuditApplicationFormValues) {
    const supabase = await createClient()

    // 1. Validate data
    const validatedFields = applicationSchema.safeParse(data)

    if (!validatedFields.success) {
        return { error: "Invalid fields", details: validatedFields.error.flatten() }
    }

    // 2. Get User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Unauthorized" }
    }

    // 3. Insert into DB
    const mainProduct = data.products?.[0] || { name: 'Unknown', standard: 'Unknown' }

    const { data: application, error } = await supabase
        .from('audit_applications')
        .insert({
            user_id: user.id,
            product_name: mainProduct.name,
            standard_applied: mainProduct.standard,
            status: data.status,
            content: validatedFields.data,
        })
        .select()
        .single()

    if (error) {
        console.error("Database Error:", error)
        return { error: `Failed to create application: ${error.message} (${error.code})` }
    }

    // 4. Sync Profile Data (Async, non-blocking desirable but await for now to ensure consistency)
    await updateProfileFromApplication(user.id, data)

    // 5. Revalidate and Redirect
    revalidatePath('/audit-programs')
    return { success: true, id: application.id }
}

export async function updateApplication(id: string, data: AuditApplicationFormValues) {
    const supabase = await createClient()

    // 1. Validate data
    const validatedFields = applicationSchema.safeParse(data)
    if (!validatedFields.success) {
        return { error: "Invalid fields" }
    }

    // 2. Get User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    // 3. Update DB
    const mainProduct = data.products?.[0] || { name: 'Unknown', standard: 'Unknown' }

    const { error } = await supabase
        .from('audit_applications')
        .update({
            product_name: mainProduct.name,
            standard_applied: mainProduct.standard,
            status: data.status,
            content: validatedFields.data,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id) // Ensure ownership

    if (error) {
        return { error: "Failed to update application" }
    }

    // 4. Sync Profile Data
    await updateProfileFromApplication(user.id, data)

    revalidatePath('/audit-programs')
    revalidatePath(`/audit-programs/${id}`)
    return { success: true }
}

export async function deleteApplication(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { error } = await supabase
        .from('audit_applications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        return { error: "Failed to delete application" }
    }

    revalidatePath('/audit-programs')
    return { success: true }
}



export async function getApplication(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('audit_applications')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return null
    return data
}

export async function listApplications() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Fetch user's active role to determine what to show
    const { data: profile } = await supabase
        .from('profiles')
        .select('active_role')
        .eq('id', user.id)
        .single()

    const activeRole = profile?.active_role || 'client'

    let query = supabase
        .from('audit_applications')
        .select(`
            id, 
            status, 
            created_at, 
            updated_at,
            content,
            profiles (full_name, email)
        `)
        .order('updated_at', { ascending: false })

    // If client, only show own applications
    if (activeRole === 'client') {
        query = query.eq('user_id', user.id)
    }

    const { data, error } = await query

    if (error) {
        console.error("Fetch Error:", error)
        return []
    }

    return data
}

export async function getUserProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch basic profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) return null

    // Fetch detailed client organization info (Enterprise Dashboard data)
    const { data: org } = await supabase
        .from('client_organizations')
        .select('*')
        .eq('profile_id', user.id)
        .single()

    // Merge logic: Prioritize client_organizations data if it exists
    if (org) {
        return {
            ...profile,
            // Map client_organizations fields to the keys expected by ApplicationForm
            company_name: org.vietnamese_name || profile.company_name,
            company_name_en: org.english_name || profile.company_name_en,
            founding_year: org.year_established || profile.founding_year,
            tax_id: org.tax_code || profile.tax_id,
            tax_code: org.tax_code || profile.tax_code,
            address: org.office_address || profile.address,
            address_factory: org.factory_address || profile.address_factory,

            // Representative & Contact Info
            representative_name: org.representative_name || profile.representative_name,
            contact_person_name: org.contact_person_name || profile.contact_person_name,
            contact_person_phone: org.contact_phone || profile.contact_person_phone,

            // Pass the raw org data too if needed later, but the above keys cover the default form values
        }
    }

    return profile
}

// --- Internal Helper: Sync Profile Data ---
async function updateProfileFromApplication(userId: string, data: AuditApplicationFormValues) {
    const supabase = await createClient()
    const company = data.companyInfo

    try {
        // 1. Update Profiles (Legacy / Basic Info)
        const profileUpdate = {
            company_name: company.nameVn,
            company_name_en: company.nameEn,
            founding_year: company.foundingYear,
            tax_code: company.taxId,
            tax_id: company.taxId,
            address: company.address,
            address_factory: company.factoryAddress,
            representative_name: company.repName,
            representative_position: company.repPosition,
            representative_phone: company.repPhone,
            representative_email: company.repEmail,
            contact_person_name: company.contactName,
            contact_person_position: company.contactPosition,
            contact_person_phone: company.contactPhone,
            contact_person_email: company.contactEmail,
            updated_at: new Date().toISOString()
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', userId)

        if (profileError) {
            console.error("Profile Sync Error:", profileError)
        }

        // 2. Update Client Organizations (Enterprise Dashboard Source of Truth)
        // Check if org exists first (or we could use upsert if schema allows, but let's be safe with select-checking or direct update)
        // Given RLS 'Clients manage their own org info', we can try to update directly by profile_id

        const orgUpdate = {
            vietnamese_name: company.nameVn,
            english_name: company.nameEn,
            year_established: parseInt(company.foundingYear?.toString() || "0") || null,
            tax_code: company.taxId,
            office_address: company.address,
            factory_address: company.factoryAddress,
            representative_name: company.repName,
            contact_person_name: company.contactName,
            contact_phone: company.contactPhone,

            // Map other fields if available in schema and form
            // org_type: ... (form uses array strings, schema uses text. might need mapping or leaving alone for now)
            main_market: company.mainMarket,
            staff_total: company.totalPersonnel,
            staff_management: company.managementCount,
            staff_production: company.productionCount,
            // shifts: company.shifts (schema has integer 'shifts'? or breakdown? Schema says 'shifts integer'. Form has object. Only mapping if matches.)

            updated_at: new Date().toISOString()
        }

        // We check if an org record exists for this profile
        const { data: existingOrg } = await supabase
            .from('client_organizations')
            .select('id')
            .eq('profile_id', userId)
            .single()

        if (existingOrg) {
            const { error: orgError } = await supabase
                .from('client_organizations')
                .update(orgUpdate)
                .eq('id', existingOrg.id) // safer to update by ID

            if (orgError) console.error("Org Sync Error:", orgError)
        } else {
            // Optional: Create if not exists? 
            // The constraint is profile_id. 
            // For now, let's assume if it doesn't exist, we might want to create it so dashboard starts working?
            // yes, that's better UX.
            const { error: createError } = await supabase
                .from('client_organizations')
                .insert({
                    profile_id: userId,
                    ...orgUpdate
                })

            if (createError) console.error("Org Create Error:", createError)
        }

    } catch (err) {
        console.error("Profile Sync Exception:", err)
    }
}
