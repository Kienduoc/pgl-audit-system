import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Activity, Users, AlertCircle } from "lucide-react"
import { getAdminDashboardStats } from "@/lib/actions/admin-applications"
import { AdminRecentApplications } from "@/components/admin/admin-recent-apps"

async function AdminDashboardContent() {
    const data = await getAdminDashboardStats()

    if (!data) {
        return <div className="p-4 text-red-500">Access Denied</div>
    }

    const { stats, recentApplications } = data

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    {/* Date range picker or other controls could go here */}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
                        <FileText className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingApplications}</div>
                        <p className="text-xs text-muted-foreground">
                            Waiting for review
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Audits</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeAudits}</div>
                        <p className="text-xs text-muted-foreground">
                            In progress
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered accounts
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.issues}</div>
                        <p className="text-xs text-muted-foreground">
                            Requires attention
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 transition-all hover:shadow-md h-[450px]">
                    <CardHeader>
                        <CardTitle>Recent Applications</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[360px] p-0">
                        <AdminRecentApplications applications={recentApplications} />
                    </CardContent>
                </Card>
                <Card className="col-span-3 transition-all hover:shadow-md h-[450px]">
                    <CardHeader>
                        <CardTitle>Audit Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-[320px] items-center justify-center text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                            <p>Pipeline Chart (Coming Soon)</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading dashboard...</div>}>
            <AdminDashboardContent />
        </Suspense>
    )
}
