"use server"

import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/role-utils"

export interface AdminApplicationFilter {
    status?: string
    page?: number
    limit?: number
    search?: string
}

export async function getAdminApplications(filter?: AdminApplicationFilter) {
    const supabase = await createClient()
    const role = await getUserRole()

    // Strict Role Check
    if (role !== 'admin') {
        return {
            data: [],
            error: "Unauthorized access",
            count: 0
        }
    }

    const page = filter?.page || 1
    const limit = filter?.limit || 10
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Status color mapping for utility usage later
    // Could move this to a shared constant

    let query = supabase
        .from('audit_applications')
        .select(`
            *,
            profiles:user_id (
                company_name,
                full_name,
                email
            )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

    if (filter?.status) {
        query = query.eq('status', filter.status)
    }

    // Search logic (optional - complex on JSONB/Foreign tables without extensions)
    // For MVP, we might skip search or do simpler client-side filtering if data volume is low.
    // Or filter by text search on JSONB content if indexed.

    const { data, count, error } = await query

    if (error) {
        console.error("Error fetching admin applications:", error)
        return { data: [], error: error.message, count: 0 }
    }

    return { data, count, error: null }
}

export async function getAdminDashboardStats() {
    const supabase = await createClient()
    const role = await getUserRole()

    if (role !== 'admin') return null

    // Parallel fetch for stats
    const [
        { count: pendingCount },
        { count: totalUsers },
        { count: activeAudits } // Mocking active audits count from applications for now if 'audits' table isn't fully robust yet
    ] = await Promise.all([
        supabase.from('audit_applications').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('audits').select('id', { count: 'exact', head: true }).eq('status', 'in_progress').maybeSingle().then(res => res.error ? { count: 0 } : res)
        // Note: handling potential missing table or data for audits gracefully
    ])

    // Get Recent 5 Applications
    const { data: recentApps } = await supabase
        .from('audit_applications')
        .select(`
             *,
            profiles:user_id (
                company_name
            )
        `)
        .order('created_at', { ascending: false })
        .limit(5)

    return {
        stats: {
            pendingApplications: pendingCount || 0,
            totalUsers: totalUsers || 0,
            activeAudits: activeAudits || 0, // Fallback
            issues: 0 // Placeholder
        },
        recentApplications: recentApps || []
    }
}
