import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Activity, Users, AlertCircle } from "lucide-react"
import { getAdminDashboardStats } from "@/lib/actions/admin-applications"
import { AdminRecentApplications } from "@/components/admin/admin-recent-apps"
import { AllocationManager } from "@/components/admin/allocation-manager"
import {
    getAppsPendingReview,
    getAppsAccepted,
    getAppsInProgress,
    getAvailableAuditors
} from "@/lib/actions/audit-allocation"

async function AdminDashboardContent() {
    // Parallel fetching
    const [statsData, pendingReview, accepted, inProgress, auditors] = await Promise.all([
        getAdminDashboardStats(),
        getAppsPendingReview(),
        getAppsAccepted(),
        getAppsInProgress(),
        getAvailableAuditors(),
    ])

    if (!statsData) {
        return <div className="p-4 text-red-500">Access Denied</div>
    }

    const { stats, recentApplications } = statsData

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chờ Xem Xét</CardTitle>
                        <FileText className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingReview.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Hồ sơ cần xem xét
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cần Phân Công</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{accepted.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Đã chấp nhận, chờ gán đoàn
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Đang Tiến Hành</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inProgress.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Cuộc đánh giá đang diễn ra
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cảnh Báo</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.issues}</div>
                        <p className="text-xs text-muted-foreground">
                            Cần quan tâm
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-1">
                <Card className="transition-all hover:shadow-md">
                    <CardHeader>
                        <CardTitle>Xem Xét & Phân Công</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AllocationManager
                            pendingReview={pendingReview}
                            accepted={accepted}
                            inProgress={inProgress}
                            availableAuditors={auditors}
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card className="transition-all hover:shadow-md h-[400px]">
                    <CardHeader>
                        <CardTitle>Hoạt Động Gần Đây</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[310px] p-0">
                        <AdminRecentApplications applications={recentApplications} />
                    </CardContent>
                </Card>
                <Card className="transition-all hover:shadow-md h-[400px]">
                    <CardHeader>
                        <CardTitle>Phân Tích</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-[280px] items-center justify-center text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                            <p>Biểu đồ phân tích (Sắp ra mắt)</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<div className="p-8">Đang tải dashboard...</div>}>
            <AdminDashboardContent />
        </Suspense>
    )
}
