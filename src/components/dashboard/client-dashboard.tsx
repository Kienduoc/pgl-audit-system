"use client"

import { useState } from "react"
import { StatsGrid } from "./stats-grid"
import { RecentApplications } from "./recent-applications"
import { AuditTracking } from "./audit-tracking"
import { OrgProfileSummary } from "./org-profile-summary"
import { FileText, Activity, Award, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CertificatesList } from "./certificates-list"
import { PendingActionsList } from "./pending-actions-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ClientDashboardProps {
    stats: any
    lists: {
        applications: any[]
        activeAudits: any[]
        certifiedProducts: any[]
        pendingActions: any[]
    }
    profile: any
    org: any
}

export function ClientDashboard({ stats, lists, profile, org }: ClientDashboardProps) {
    const [activeTab, setActiveTab] = useState('applications')
    const roleName = profile?.role?.replace('_', ' ') || 'Client'

    return (
        <div className="flex flex-col space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Tổng Quan Doanh Nghiệp</h2>
                    <p className="text-lg text-muted-foreground mt-2">
                        Chào mừng trở lại, <span className="font-semibold text-foreground">{org?.vietnamese_name || org?.english_name || profile?.company_name || "Doanh Nghiệp"}</span>
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Actions or additional header items can go here */}
                </div>
            </div>

            <OrgProfileSummary profile={profile} org={org} />

            {/* Dashboard Grid Layout */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 h-[calc(100vh-200px)]">

                {/* Column 1: Applications */}
                <div className="flex flex-col space-y-4 h-full">
                    <Card className="border-t-4 border-t-blue-500 shadow-sm shrink-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <div className="text-sm font-medium text-muted-foreground">Tổng Số Đơn</div>
                                <FileText className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="text-2xl font-bold">{stats.totalApplications}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.totalApplications > 0 ? "Đơn đã nộp" : "Chưa có đơn nào"}
                            </p>
                        </CardContent>
                    </Card>
                    <div className="flex-1 min-h-0 bg-muted/10 rounded-lg border p-4">
                        <RecentApplications applications={lists.applications} title="Đơn Gần Đây" />
                    </div>
                </div>

                {/* Column 2: Active Audits */}
                <div className="flex flex-col space-y-4 h-full">
                    <Card className="border-t-4 border-t-amber-500 shadow-sm shrink-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <div className="text-sm font-medium text-muted-foreground">Đánh Giá Đang Tiến Hành</div>
                                <Activity className="h-4 w-4 text-amber-500" />
                            </div>
                            <div className="text-2xl font-bold">{stats.activeAudits}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.activeAudits > 0 ? "Đang thực hiện" : "Không có đánh giá nào"}
                            </p>
                        </CardContent>
                    </Card>
                    <div className="flex-1 min-h-0 bg-muted/10 rounded-lg border p-4">
                        <AuditTracking audits={lists.activeAudits} />
                    </div>
                </div>

                {/* Column 3: Certified Products */}
                <div className="flex flex-col space-y-4 h-full">
                    <Card className="border-t-4 border-t-green-500 shadow-sm shrink-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <div className="text-sm font-medium text-muted-foreground">Sản Phẩm Đã Chứng Nhận</div>
                                <Award className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="text-2xl font-bold">{stats.certifiedProducts}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.certifiedProducts > 0 ? "Chứng chỉ có hiệu lực" : "Chưa có chứng chỉ nào"}
                            </p>
                        </CardContent>
                    </Card>
                    <div className="flex-1 min-h-0 bg-muted/10 rounded-lg border p-4">
                        <CertificatesList certificates={lists.certifiedProducts} />
                    </div>
                </div>

                {/* Column 4: Pending Actions */}
                <div className="flex flex-col space-y-4 h-full">
                    <Card className="border-t-4 border-t-orange-500 shadow-sm shrink-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <div className="text-sm font-medium text-muted-foreground">Cần Xử Lý</div>
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                            </div>
                            <div className="text-2xl font-bold">{stats.pendingActions}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.pendingActions > 0 ? "Cần chú ý" : "Đã hoàn thành hết"}
                            </p>
                        </CardContent>
                    </Card>
                    <div className="flex-1 min-h-0 bg-muted/10 rounded-lg border p-4">
                        <PendingActionsList actions={lists.pendingActions} />
                    </div>
                </div>

            </div>
        </div>
    )
}
