'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, RotateCcw, XCircle, Clock, FileEdit, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { resubmitApplication } from '@/lib/actions/audit-allocation'
import { toast } from 'sonner'

interface ClientApplicationStatusProps {
    applications: any[]
}

export function ClientApplicationStatus({ applications }: ClientApplicationStatusProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleResubmit = async (appId: string) => {
        setLoadingId(appId)
        try {
            const res = await resubmitApplication(appId)
            if (res.success) {
                toast.success('Đã gửi lại hồ sơ', { description: 'Hồ sơ đang chờ xem xét lại.' })
            } else {
                toast.error('Lỗi', { description: res.error })
            }
        } finally {
            setLoadingId(null)
        }
    }

    if (applications.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <FileEdit className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Chưa có đơn đăng ký nào</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {applications.map(app => (
                <ApplicationCard
                    key={app.id}
                    app={app}
                    isLoading={loadingId === app.id}
                    onResubmit={handleResubmit}
                />
            ))}
        </div>
    )
}

function ApplicationCard({ app, isLoading, onResubmit }: { app: any, isLoading: boolean, onResubmit: (id: string) => void }) {
    const clientName = app?.content?.companyInfo?.nameVn || app?.product_name || 'Đơn đăng ký'
    const productCount = Array.isArray(app?.content?.products) ? app.content.products.length : 0

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Draft':
                return { icon: <FileEdit className="h-4 w-4" />, color: 'text-gray-600 bg-gray-100', label: 'Bản nháp' }
            case 'Submitted':
            case 'submitted':
                return { icon: <Clock className="h-4 w-4" />, color: 'text-blue-600 bg-blue-100', label: 'Đã nộp - Chờ xem xét' }
            case 'Under Review':
                return { icon: <RefreshCw className="h-4 w-4" />, color: 'text-blue-600 bg-blue-100', label: 'Đang xem xét' }
            case 'Needs Revision':
                return { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-amber-600 bg-amber-100', label: 'Cần bổ sung' }
            case 'Rejected':
                return { icon: <XCircle className="h-4 w-4" />, color: 'text-red-600 bg-red-100', label: 'Đã bị từ chối' }
            case 'Accepted':
                return { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600 bg-green-100', label: 'Đã chấp nhận' }
            case 'Team Assigned':
                return { icon: <CheckCircle className="h-4 w-4" />, color: 'text-indigo-600 bg-indigo-100', label: 'Đã phân công đoàn' }
            case 'Audit In Progress':
                return { icon: <RefreshCw className="h-4 w-4" />, color: 'text-purple-600 bg-purple-100', label: 'Đang đánh giá' }
            case 'Report Review':
                return { icon: <FileEdit className="h-4 w-4" />, color: 'text-teal-600 bg-teal-100', label: 'Xem xét báo cáo' }
            case 'Certified':
                return { icon: <CheckCircle className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-100', label: '✓ Đã chứng nhận' }
            default:
                return { icon: <Clock className="h-4 w-4" />, color: 'text-gray-600 bg-gray-100', label: status }
        }
    }

    const statusConfig = getStatusConfig(app.status)
    const needsAction = app.status === 'Needs Revision'
    const isRejected = app.status === 'Rejected'

    return (
        <Card className={`
            ${needsAction ? 'border-amber-200 bg-amber-50/30' : ''}
            ${isRejected ? 'border-red-200 bg-red-50/30' : ''}
        `}>
            <CardContent className="py-5 px-6">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="font-semibold">{clientName}</h3>
                        <p className="text-xs text-muted-foreground">
                            {productCount} sản phẩm • Ngày nộp: {format(new Date(app.created_at), 'dd/MM/yyyy')}
                            {app.revision_count > 0 && ` • Lần gửi thứ ${app.revision_count + 1}`}
                        </p>
                    </div>
                    <Badge variant="outline" className={`${statusConfig.color} border-none flex items-center gap-1.5`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                    </Badge>
                </div>

                {/* Revision Notice */}
                {needsAction && app.review_notes && (
                    <div className="mt-3 p-4 bg-amber-100/50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="font-semibold text-amber-800 text-sm mb-1">Yêu cầu bổ sung từ PGL:</h4>
                                <p className="text-sm text-amber-900 whitespace-pre-wrap">{app.review_notes}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <Button
                                onClick={() => onResubmit(app.id)}
                                disabled={isLoading}
                                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                                size="sm"
                            >
                                <RotateCcw className="h-4 w-4" />
                                {isLoading ? 'Đang gửi...' : 'Chỉnh sửa & Gửi lại'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Rejection Notice */}
                {isRejected && app.review_notes && (
                    <div className="mt-3 p-4 bg-red-100/50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="font-semibold text-red-800 text-sm mb-1">Lý do từ chối:</h4>
                                <p className="text-sm text-red-900 whitespace-pre-wrap">{app.review_notes}</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
