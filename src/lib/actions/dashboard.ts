"use server"

import { createClient } from "@/lib/supabase/server"
import { unstable_cache as cache } from "next/cache"

export async function getClientDashboardStats(userId: string) {
    const supabase = await createClient()

    // Run queries in parallel for performance
    const [
        { count: totalApplications },
        { count: activeAudits },
        { count: certifiedProducts },
        { data: applicationsList },
        { data: activeAuditsList },
        { data: certifiedProductsList },
        { data: pendingApps }
    ] = await Promise.all([
        // 1. Total Applications (Draft + Submitted)
        supabase.from('audit_applications').select('*', { count: 'exact', head: true }).eq('user_id', userId),

        // 2. Count Active Audits
        supabase.from('audits').select('*', { count: 'exact', head: true }).eq('client_id', userId).neq('status', 'completed'),

        // 3. Certified Products (Completed audits as proxy)
        supabase.from('audits').select('*', { count: 'exact', head: true }).eq('client_id', userId).eq('status', 'completed'),

        // 4. Applications List (Fetch more for the list view)
        supabase
            .from('audit_applications')
            .select('id, status, created_at, content, product_name, review_notes, revision_count')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20),

        // 5. Active Audits List
        supabase
            .from('audits')
            .select('*')
            .eq('client_id', userId)
            .neq('status', 'completed')
            .order('audit_date', { ascending: true }),

        // 6. Certified Products List (Completed Audits)
        supabase
            .from('audits')
            .select('*')
            .eq('client_id', userId)
            .eq('status', 'completed')
            .order('audit_date', { ascending: false }),

        // 7. Pending Actions (Draft applications)
        supabase
            .from('audit_applications')
            .select('id, status, created_at, content')
            .eq('user_id', userId)
            .eq('status', 'draft')
            .order('created_at', { ascending: false })
    ])

    // Combine Pending Actions sources if needed (e.g., drafts + audits requiring action)
    const pendingActionsList = pendingApps || []
    const pendingActionsCount = pendingActionsList.length

    return {
        stats: {
            totalApplications: totalApplications || 0,
            activeAudits: activeAudits || 0,
            certifiedProducts: certifiedProducts || 0,
            pendingActions: pendingActionsCount
        },
        lists: {
            applications: applicationsList || [],
            activeAudits: activeAuditsList || [],
            certifiedProducts: certifiedProductsList || [],
            pendingActions: pendingActionsList
        }
    }
}
