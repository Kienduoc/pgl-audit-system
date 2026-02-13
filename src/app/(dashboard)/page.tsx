import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Role Check - Redirect Clients to their Profile/Hub
    const { data: profile } = await supabase
        .from('profiles')
        .select('active_role, role')
        .eq('id', user.id)
        .single()

    const activeRole = profile?.active_role || profile?.role || 'client'

    if (activeRole === 'client') {
        redirect('/profile')
    }

    if (activeRole === 'auditor') {
        redirect('/audits') // Auditors don't have a dashboard, go straight to tasks
    }

    // Fetch All Audits (formal audit records)
    const { data: audits, error } = await supabase
        .from('audits')
        .select('*, client:profiles!client_id(company_name, email)')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Dashboard fetch error:", error)
        return <div>Error loading dashboard data.</div>
    }

    // Fetch ALL Applications (not just pending - Admin should see everything)
    const { data: allApplications } = await supabase
        .from('audit_applications')
        .select('id, product_name, status, created_at, content')
        .order('created_at', { ascending: false })

    const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'Admin'

    return (
        <AdminDashboard
            audits={audits || []}
            pendingApplications={allApplications || []}
            firstName={firstName}
        />
    )
}
