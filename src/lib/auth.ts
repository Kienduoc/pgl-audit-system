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
        .select('active_role')
        .eq('id', userId)
        .single()

    return profile?.active_role as UserRole || null
}

export async function getUserRoles(userId: string): Promise<UserRole[]> {
    const supabase = await createClient()
    const { data: profile } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', userId)
        .single()

    return profile?.roles || []
}

export async function switchRole(userId: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // Verify user has this role
    const roles = await getUserRoles(userId)
    if (!roles.includes(newRole)) {
        return { success: false, error: 'User does not have this role' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ active_role: newRole })
        .eq('id', userId)

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

export function getDefaultRole(roles: UserRole[]): UserRole {
    const priority: UserRole[] = ['admin', 'lead_auditor', 'auditor', 'client']
    for (const role of priority) {
        if (roles.includes(role)) return role
    }
    return 'client'
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
