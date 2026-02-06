import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { StatusChart } from '@/components/dashboard/status-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { ProgramList } from '@/components/dashboard/program-list'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Role Check - Redirect Clients to their Profile/Hub
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role === 'client') {
        redirect('/profile')
    }

    // Fetch All Audits
    // In a real large app, we might use count queries or specialized RPCs for stats
    // For MVP, fetching all is fine (< 1000 rows usually for this scale)
    const { data: audits, error } = await supabase
        .from('audits')
        .select('*, client:profiles!client_id(company_name, email)')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Dashboard fetch error:", error)
        return <div>Error loading dashboard data.</div>
    }

    const allAudits = audits || []

    // Calculate Stats
    const total = allAudits.length
    const active = allAudits.filter(a => ['ongoing', 'evaluation'].includes(a.status)).length
    const actionRequired = allAudits.filter(a => ['reviewing', 'planned'].includes(a.status)).length // Simplified logic
    const completed = allAudits.filter(a => ['certified', 'completed'].includes(a.status)).length

    // Calculate Chart Data
    const statusCounts = allAudits.reduce((acc: any, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1
        return acc
    }, {})

    // Map DB status to nice labels and colors
    // Colors: Tailwind-ish hex codes
    const chartData = [
        { name: 'Planned', value: statusCounts['planned'] || 0, color: '#94a3b8' }, // Slate 400
        { name: 'Ongoing', value: statusCounts['ongoing'] || 0, color: '#3b82f6' }, // Blue 500
        { name: 'Reviewing', value: statusCounts['reviewing'] || 0, color: '#f97316' }, // Orange 500
        { name: 'Certified', value: statusCounts['certified'] || 0, color: '#22c55e' }, // Green 500
    ].filter(item => item.value > 0)

    const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'Admin'

    return (
        <div className="flex flex-col space-y-8 p-8 pt-6">

            {/* Header */}
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Welcome back, {firstName}. Here's what's happening with your certification programs.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/audits/new">
                        <Button className="bg-primary hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" /> Create New Program
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Row */}
            <StatsCards
                total={total}
                active={active}
                actionRequired={actionRequired}
                completed={completed}
            />

            {/* Visual Insights Row */}


            {/* Correcting Layout for Chart/Activity */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
                <StatusChart data={chartData} />
                <RecentActivity recentAudits={allAudits} />
            </div>

            {/* Detailed List */}
            <ProgramList audits={allAudits} />
        </div>
    )
}
