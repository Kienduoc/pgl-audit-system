"use server"

import { createClient } from "@/lib/supabase/server"
import { getUserRole as fetchUserRole } from "@/lib/auth"

export async function getUserRole() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    return await fetchUserRole(user.id)
}

export async function requireRole(requiredRole: string) {
    const role = await getUserRole()
    if (role !== requiredRole) {
        throw new Error(`Unauthorized: User must be ${requiredRole}`)
    }
    return role
}
