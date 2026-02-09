'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { UserRole, getUserRoles } from '@/lib/auth'

export async function switchUserRole(newRole: UserRole) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: 'Not authenticated' }
    }

    // Verify user has this role
    const { data: profile } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', user.id)
        .single()

    if (!profile?.roles?.includes(newRole)) {
        return { success: false, error: 'Unauthorized role' }
    }

    // Update active role
    const { error } = await supabase
        .from('profiles')
        .update({ active_role: newRole })
        .eq('id', user.id)

    if (error) {
        return { success: false, error: error.message }
    }

    // Revalidate all pages to reflect new role
    revalidatePath('/', 'layout')

    return { success: true }
}
