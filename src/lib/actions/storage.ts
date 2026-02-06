'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSignedDocumentUrl(path: string) {
    const supabase = await createClient()

    // Create a signed URL valid for 1 hour (3600 seconds)
    const { data, error } = await supabase
        .storage
        .from('competence-docs')
        .createSignedUrl(path, 3600)

    if (error) {
        console.error('Error creating signed url:', error)
        return { error: error.message }
    }

    return { signedUrl: data.signedUrl }
}
