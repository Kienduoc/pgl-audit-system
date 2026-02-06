'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadDossierItem(formData: FormData) {
    const supabase = await createClient()

    const file = formData.get('file') as File
    const applicationId = formData.get('applicationId') as string
    const auditId = formData.get('auditId') as string
    const documentType = formData.get('documentType') as string
    const path = formData.get('path') as string

    if (!file || !applicationId || !documentType) {
        return { error: 'Missing required fields' }
    }

    // 1. Upload to Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${applicationId}/${documentType}/${Date.now()}_${file.name}`.replace(/\s+/g, '_')

    const { data: storageData, error: storageError } = await supabase
        .storage
        .from('audit-documents')
        .upload(fileName, file)

    if (storageError) {
        return { error: `Storage error: ${storageError.message}` }
    }

    const filePath = storageData.path

    // 2. Insert into DB
    const { error: dbError } = await supabase
        .from('audit_dossier')
        .insert({
            application_id: applicationId,
            document_type: documentType,
            file_name: file.name,
            file_url: filePath,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id
        })

    if (dbError) {
        await supabase.storage.from('audit-documents').remove([filePath])
        return { error: `Database error: ${dbError.message}` }
    }

    if (path) {
        revalidatePath(path)
    } else if (auditId) {
        revalidatePath(`/audits/${auditId}/dossier`)
    }
    return { success: true }
}

export async function deleteDossierItem(auditId: string, fileId: string, filePath: string, path?: string) {
    const supabase = await createClient()

    const { error: dbError } = await supabase
        .from('audit_dossier')
        .delete()
        .eq('id', fileId)

    if (dbError) {
        return { error: `Database error: ${dbError.message}` }
    }

    const { error: storageError } = await supabase
        .storage
        .from('audit-documents')
        .remove([filePath])

    if (storageError) {
        console.error('Failed to delete file from storage:', storageError)
    }

    if (path) {
        revalidatePath(path)
    } else if (auditId) {
        revalidatePath(`/audits/${auditId}/dossier`)
    }
    return { success: true }
}

export async function getDossierItems(applicationId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('audit_dossier')
        .select('*')
        .eq('application_id', applicationId)

    if (error) {
        console.error('Error fetching dossier:', error)
        return { error: error.message }
    }

    return { data }
}

export async function submitDossier(applicationId: string, auditId: string, path?: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('audit_applications')
        .update({ status: 'dossier_submitted', updated_at: new Date().toISOString() })
        .eq('id', applicationId)

    if (error) {
        return { error: error.message }
    }

    if (path) {
        revalidatePath(path)
    } else if (auditId) {
        revalidatePath(`/audits/${auditId}/dossier`)
    }
    return { success: true }
}
