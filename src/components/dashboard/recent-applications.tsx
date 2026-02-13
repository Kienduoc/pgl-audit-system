'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { AlertTriangle, XCircle, RotateCcw } from "lucide-react"
import { resubmitApplication } from "@/lib/actions/audit-allocation"
import { toast } from "sonner"
import { useState } from "react"

interface Application {
    id: string
    status: string
    created_at: string
    content: any
    product_name?: string
    review_notes?: string
    revision_count?: number
}

export function RecentApplications({ applications, title = "Đơn Đăng Ký" }: { applications: Application[], title?: string }) {
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleResubmit = async (appId: string) => {
        setLoadingId(appId)
        try {
            const res = await resubmitApplication(appId)
            if (res.success) {
                toast.success('Đã gửi lại hồ sơ')
            } else {
                toast.error('Lỗi', { description: res.error })
            }
        } finally {
            setLoadingId(null)
        }
    }

    if (applications.length === 0) {
        return (
            <div className="text-center py-10 bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">Chưa có đơn đăng ký nào.</p>
                <Link href="/audits/new">
                    <Button variant="outline" className="mt-4">Nộp Đơn Mới</Button>
                </Link>
            </div>
        )
    }

    const getStatusBadge = (status: string) => {
        const map: Record<string, { className: string; label: string }> = {
            'Draft': { className: 'bg-gray-100 text-gray-700', label: 'Bản nháp' },
            'draft': { className: 'bg-gray-100 text-gray-700', label: 'Bản nháp' },
            'Submitted': { className: 'bg-blue-100 text-blue-700', label: 'Đã nộp' },
            'submitted': { className: 'bg-blue-100 text-blue-700', label: 'Đã nộp' },
            'Under Review': { className: 'bg-blue-100 text-blue-700', label: 'Đang xem xét' },
            'Needs Revision': { className: 'bg-amber-100 text-amber-700', label: '⚠ Cần bổ sung' },
            'Accepted': { className: 'bg-green-100 text-green-700', label: '✓ Chấp nhận' },
            'Rejected': { className: 'bg-red-100 text-red-700', label: '✗ Từ chối' },
            'Team Assigned': { className: 'bg-indigo-100 text-indigo-700', label: 'Đã phân công' },
            'Audit In Progress': { className: 'bg-purple-100 text-purple-700', label: 'Đang đánh giá' },
            'Report Review': { className: 'bg-teal-100 text-teal-700', label: 'Xem xét BC' },
            'Certified': { className: 'bg-emerald-100 text-emerald-700', label: '✓ Đã chứng nhận' },
        }
        const s = map[status] || { className: '', label: status }
        return <Badge variant="outline" className={`${s.className} border-none text-xs`}>{s.label}</Badge>
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-base text-muted-foreground uppercase tracking-wider">{title}</h3>
                <Link href="/audits/new" className="text-sm text-blue-600 hover:underline">
                    Tất cả
                </Link>
            </div>
            <div className="space-y-3 flex-1 overflow-auto">
                {applications.map((app) => {
                    const clientName = app.content?.companyInfo?.nameVn || app.content?.companyInfo?.nameEn || app.product_name || "Đơn đăng ký"
                    const needsRevision = app.status === 'Needs Revision'
                    const isRejected = app.status === 'Rejected'

                    return (
                        <div
                            key={app.id}
                            className={`border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors ${needsRevision ? 'border-amber-200 bg-amber-50/30' :
                                    isRejected ? 'border-red-200 bg-red-50/30' : ''
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-medium text-base line-clamp-1" title={clientName}>
                                    {clientName}
                                </div>
                                {getStatusBadge(app.status)}
                            </div>

                            {/* Revision/Rejection feedback */}
                            {needsRevision && app.review_notes && (
                                <div className="mt-2 p-2.5 bg-amber-100/50 border border-amber-200 rounded text-xs">
                                    <div className="flex items-start gap-1.5">
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                                        <span className="text-amber-800 line-clamp-2">{app.review_notes}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="mt-2 h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                                        onClick={() => handleResubmit(app.id)}
                                        disabled={loadingId === app.id}
                                    >
                                        <RotateCcw className="h-3 w-3 mr-1" />
                                        {loadingId === app.id ? 'Đang gửi...' : 'Gửi lại'}
                                    </Button>
                                </div>
                            )}

                            {isRejected && app.review_notes && (
                                <div className="mt-2 p-2.5 bg-red-100/50 border border-red-200 rounded text-xs">
                                    <div className="flex items-start gap-1.5">
                                        <XCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 shrink-0" />
                                        <span className="text-red-800 line-clamp-2">{app.review_notes}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
                                <span>{format(new Date(app.created_at), "dd/MM/yyyy")}</span>
                                <Link href={`/audit-programs/${app.id}`}>
                                    <Button size="sm" variant="ghost" className="h-8 text-sm px-3">Chi tiết</Button>
                                </Link>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
