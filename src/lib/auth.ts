import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserRole = 'client' | 'auditor' | 'lead_auditor' | 'admin'

export async function getCurrentUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return user
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
    const supabase = await createClient()
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

    return profile?.role as UserRole || null
}

export async function authorize(allowedRoles: UserRole[]) {
    const user = await getCurrentUser()
    if (!user) {
        redirect('/login')
    }

    const role = await getUserRole(user.id)
    if (!role || !allowedRoles.includes(role)) {
        // Redirect to their appropriate home based on role, or 403 page
        // For now, redirect to dashboard root which might show a restricted view or a 403
        throw new Error('Unauthorized access')
    }

    return { user, role }
}

export async function protectRoute(allowedRoles: UserRole[]) {
    try {
        await authorize(allowedRoles)
    } catch (error) {
        redirect('/unauthorized') // We might need to create this page
    }
}
