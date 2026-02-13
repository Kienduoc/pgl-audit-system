'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
    CheckCircle, XCircle, RotateCcw, ArrowLeft,
    Building, User, Phone, Mail, MapPin, FileText,
    Clock, History, Package, AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import { ReviewActionDialog } from '@/components/admin/review-action-dialog'
import { FilePreviewDialog } from '@/components/admin/file-preview-dialog'
import { acceptApplication, requestRevision, rejectApplication, startReview } from '@/lib/actions/audit-allocation'
import { toast } from 'sonner'
import Link from 'next/link'

interface ApplicationReviewPageProps {
    application: any
    reviewHistory: any[]
}

export function ApplicationReviewPage({ application, reviewHistory }: ApplicationReviewPageProps) {
    const [actionDialog, setActionDialog] = useState<'reject' | 'revision' | 'accept' | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(application.status)

    const content = application.content || {}
    const companyInfo = content.companyInfo || {}
    const products = content.products || []

    const clientName = companyInfo.nameVn || companyInfo.nameEn || 'N/A'

    // Auto-start review on mount if status is Submitted
    React.useEffect(() => {
        if (['Submitted', 'submitted', 'Pending Review'].includes(currentStatus)) {
            startReview(application.id).then(res => {
                if (res.success) setCurrentStatus('Under Review')
            })
        }
    }, [])

    const handleAccept = () => {
        setActionDialog('accept')
    }

    const onConfirmAction = async (input: string) => {
        setIsProcessing(true)
        try {
            if (actionDialog === 'accept') {
                const res = await acceptApplication(application.id, input) // input is auditCode
                if (res.success) {
                    toast.success('Đã chấp nhận hồ sơ & tạo đánh giá', { description: `Mã dự án: ${input}` })
                    setCurrentStatus('Accepted')
                } else {
                    toast.error('Lỗi', { description: res.error })
                }
            } else if (actionDialog === 'revision') {
                const res = await requestRevision(application.id, input) // input is reason
                if (res.success) {
                    toast.success('Đã gửi yêu cầu bổ sung', { description: 'Client sẽ nhận được thông báo.' })
                    setCurrentStatus('Needs Revision')
                } else {
                    toast.error('Lỗi', { description: res.error })
                }
            } else if (actionDialog === 'reject') {
                const res = await rejectApplication(application.id, input) // input is reason
                if (res.success) {
                    toast.success('Đã từ chối hồ sơ', { description: 'Đơn đã bị từ chối/hủy.' })
                    setCurrentStatus('Rejected')
                } else {
                    toast.error('Lỗi', { description: res.error })
                }
            }
        } finally {
            setIsProcessing(false)
            setActionDialog(null)
        }
    }

    const getStatusBadge = (status: string) => {
        const map: Record<string, { variant: any; className: string }> = {
            'Submitted': { variant: 'secondary', className: '' },
            'Under Review': { variant: 'default', className: 'bg-blue-100 text-blue-800 border-blue-200' },
            'Needs Revision': { variant: 'default', className: 'bg-amber-100 text-amber-800 border-amber-200' },
            'Accepted': { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
            'Rejected': { variant: 'destructive', className: '' },
        }
        const s = map[status] || { variant: 'outline', className: '' }
        return <Badge variant={s.variant} className={s.className}>{status}</Badge>
    }

    const canTakeAction = currentStatus === 'Under Review'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/audits/new">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Xem Xét Hồ Sơ</h1>
                        <p className="text-muted-foreground">{clientName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {getStatusBadge(currentStatus)}
                    {application.revision_count > 0 && (
                        <Badge variant="outline" className="text-amber-600 border-amber-200">
                            Lần gửi thứ {application.revision_count + 1}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="company" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="company">
                        <Building className="h-4 w-4 mr-1" /> Doanh nghiệp
                    </TabsTrigger>
                    <TabsTrigger value="products">
                        <Package className="h-4 w-4 mr-1" /> Sản phẩm ({products.length})
                    </TabsTrigger>
                    <TabsTrigger value="attachments">
                        <FileText className="h-4 w-4 mr-1" /> Tài liệu
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <History className="h-4 w-4 mr-1" /> Lịch sử
                    </TabsTrigger>
                </TabsList>

                {/* Company Info Tab */}
                <TabsContent value="company" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Thông Tin Doanh Nghiệp</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoField label="Tên tiếng Việt" value={companyInfo.nameVn} icon={<Building className="h-4 w-4" />} />
                                <InfoField label="Tên tiếng Anh" value={companyInfo.nameEn} icon={<Building className="h-4 w-4" />} />
                                <InfoField label="Mã số thuế" value={companyInfo.taxId} />
                                <InfoField label="Năm thành lập" value={companyInfo.foundingYear} />
                                <InfoField label="Địa chỉ trụ sở" value={companyInfo.address} icon={<MapPin className="h-4 w-4" />} className="md:col-span-2" />
                                <InfoField label="Địa chỉ nhà máy" value={companyInfo.factoryAddress} icon={<MapPin className="h-4 w-4" />} className="md:col-span-2" />
                            </div>

                            <Separator />

                            {/* Representative */}
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4" /> Người Đại Diện
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField label="Họ tên" value={companyInfo.repName} />
                                    <InfoField label="Chức vụ" value={companyInfo.repPosition} />
                                    <InfoField label="Điện thoại" value={companyInfo.repPhone} icon={<Phone className="h-4 w-4" />} />
                                    <InfoField label="Email" value={companyInfo.repEmail} icon={<Mail className="h-4 w-4" />} />
                                </div>
                            </div>

                            <Separator />

                            {/* Contact Person */}
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Phone className="h-4 w-4" /> Người Liên Hệ
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoField label="Họ tên" value={companyInfo.contactName} />
                                    <InfoField label="Chức vụ" value={companyInfo.contactPosition} />
                                    <InfoField label="Điện thoại" value={companyInfo.contactPhone} icon={<Phone className="h-4 w-4" />} />
                                    <InfoField label="Email" value={companyInfo.contactEmail} icon={<Mail className="h-4 w-4" />} />
                                </div>
                            </div>

                            <Separator />

                            {/* Organization Details */}
                            <div>
                                <h3 className="font-semibold mb-3">Quy Mô Doanh Nghiệp</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <InfoField label="Tổng nhân sự" value={companyInfo.totalPersonnel} />
                                    <InfoField label="Quản lý" value={companyInfo.managementCount} />
                                    <InfoField label="Sản xuất" value={companyInfo.productionCount} />
                                    <InfoField label="Thị trường chính" value={companyInfo.mainMarket} />
                                </div>
                                {companyInfo.shifts && (
                                    <div className="mt-3 grid grid-cols-3 gap-4">
                                        <InfoField label="Ca 1" value={companyInfo.shifts.shift1} />
                                        <InfoField label="Ca 2" value={companyInfo.shifts.shift2} />
                                        <InfoField label="Ca 3" value={companyInfo.shifts.shift3} />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Products Tab */}
                <TabsContent value="products" className="mt-4">
                    <div className="space-y-4">
                        {products.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    Không có thông tin sản phẩm
                                </CardContent>
                            </Card>
                        ) : (
                            products.map((product: any, idx: number) => (
                                <Card key={product.id || idx}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">
                                                <Package className="h-4 w-4 inline mr-2" />
                                                {product.name || `Sản phẩm ${idx + 1}`}
                                            </CardTitle>
                                            <Badge variant="outline">{product.certificationType || 'New'}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <InfoField label="Model / Loại" value={product.model} />
                                            <InfoField label="Tiêu chuẩn áp dụng" value={product.standard} />
                                            <InfoField label="Nhà máy sản xuất" value={product.factoryName} />
                                            <InfoField label="Địa chỉ nhà máy" value={product.factoryAddress} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Attachments Tab */}
                <TabsContent value="attachments" className="mt-4">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Kiểm Tra Tài Liệu</CardTitle>
                                <CardDescription>So sánh danh mục tài liệu yêu cầu và thực tế nộp</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AttachmentsChecklist attachments={content.attachments || []} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Lịch Sử Xem Xét</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {reviewHistory.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Chưa có lịch sử</p>
                            ) : (
                                <div className="space-y-4">
                                    {reviewHistory.map((entry: any) => (
                                        <div key={entry.id} className="flex gap-4 border-l-2 border-muted pl-4 pb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <HistoryActionBadge action={entry.action} />
                                                    <span className="text-xs text-muted-foreground">
                                                        {entry.created_at ? format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm') : ''}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {entry.performer?.full_name || 'System'}
                                                </p>
                                                {entry.notes && (
                                                    <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm">
                                                        {entry.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Action Bar - Fixed at bottom */}
            {canTakeAction && (
                <Card className="border-t-2 border-blue-200 bg-blue-50/30">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                <AlertTriangle className="h-4 w-4 inline mr-1" />
                                Hãy xem xét kỹ hồ sơ trước khi đưa ra quyết định
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setActionDialog('reject')}
                                    disabled={isProcessing}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    <XCircle className="h-4 w-4 mr-1" /> Từ Chối
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setActionDialog('revision')}
                                    disabled={isProcessing}
                                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                >
                                    <RotateCcw className="h-4 w-4 mr-1" /> Yêu Cầu Bổ Sung
                                </Button>
                                <Button
                                    onClick={handleAccept}
                                    disabled={isProcessing}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {isProcessing ? 'Đang xử lý...' : (
                                        <><CheckCircle className="h-4 w-4 mr-1" /> Chấp Nhận</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Already decided */}
            {['Accepted', 'Rejected', 'Needs Revision', 'Team Assigned', 'Audit In Progress', 'Allocating'].includes(currentStatus) && (
                <Card className={`border-t-2 ${currentStatus === 'Accepted' || currentStatus === 'Team Assigned' || currentStatus === 'Audit In Progress' || currentStatus === 'Allocating' ? 'border-green-200 bg-green-50/30' :
                    currentStatus === 'Rejected' ? 'border-red-200 bg-red-50/30' :
                        'border-amber-200 bg-amber-50/30'
                    }`}>
                    <CardContent className="py-4 flex items-center justify-between">
                        <div className="text-sm">
                            {currentStatus === 'Accepted' && '✅ Hồ sơ đã được chấp nhận. Chuyển sang phân công đoàn đánh giá.'}
                            {currentStatus === 'Team Assigned' && '✅ Đã phân công đoàn đánh giá.'}
                            {currentStatus === 'Audit In Progress' && '✅ Đánh giá đang tiến hành.'}
                            {currentStatus === 'Allocating' && '⚠️ Đang phân bổ tài nguyên.'}
                            {currentStatus === 'Rejected' && '❌ Hồ sơ đã bị từ chối. Client đã được thông báo.'}
                            {currentStatus === 'Needs Revision' && '⚠️ Đã yêu cầu bổ sung. Đang chờ Client chỉnh sửa và gửi lại.'}
                        </div>
                        <Link href="/audits/new">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Dialogs */}
            {actionDialog && (
                <ReviewActionDialog
                    open={!!actionDialog}
                    onOpenChange={(open) => !open && setActionDialog(null)}
                    actionType={actionDialog as any}
                    applicationName={clientName}
                    onConfirm={onConfirmAction}
                    isLoading={isProcessing}
                />
            )}
        </div>
    )
}

// Attachments Checklist Component
function AttachmentsChecklist({ attachments }: { attachments: any[] }) {
    const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null)

    const REQUIRED_DOCS = [
        {
            key: 'Legal',
            label: 'Hồ Sơ Pháp Lý (ĐKKD/ĐKĐT)',
            desc: 'Giấy chứng nhận đăng ký kinh doanh hoặc đầu tư',
            required: true
        },
        {
            key: 'Technical',
            label: 'Hồ Sơ Kỹ Thuật Sản Phẩm',
            desc: 'Mô tả kỹ thuật, hình ảnh, catalogue',
            required: true
        },
        {
            key: 'TypeTest',
            label: 'Chứng Chỉ Hợp Quy (Type Test)',
            desc: 'Kết quả thử nghiệm mẫu điển hình (nếu có)',
            required: false
        },
        {
            key: 'Quality',
            label: 'Hệ Thống Quản Lý Chất Lượng',
            desc: 'Sổ tay chất lượng, quy trình ISO (nếu có)',
            required: false
        }
    ]

    const findAttachment = (keyParts: string) => {
        return attachments.find(att => att.type && att.type.includes(keyParts))
    }

    const otherAttachments = attachments.filter(att =>
        !REQUIRED_DOCS.some(doc => att.type && att.type.includes(doc.key))
    )

    const isFileUrl = (url: string) => {
        if (!url) return false
        const ext = url.split('.').pop()?.toLowerCase() || ''
        return ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)
    }

    const handleView = (att: any) => {
        if (!att.fileUrl) return

        // If it's a link (not a file), open in new tab
        if (att.fileUrl.startsWith('http') && !isFileUrl(att.fileUrl)) {
            window.open(att.fileUrl, '_blank', 'noopener,noreferrer')
            return
        }

        // If it's a file, show in preview modal
        const ext = att.fileUrl.split('.').pop()?.toLowerCase() || ''
        setPreviewFile({
            url: att.fileUrl,
            name: att.fileName || att.type,
            type: ext
        })
    }

    return (
        <>
            <div className="space-y-6">
                {/* Required Documents List */}
                <div className="space-y-3">
                    {REQUIRED_DOCS.map((doc, idx) => {
                        const submitted = findAttachment(doc.key)
                        const statusColor = submitted
                            ? 'bg-green-50 border-green-200'
                            : (doc.required ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-dashed border-gray-300')

                        return (
                            <div key={idx} className={`flex items-start justify-between p-4 border rounded-lg transition-colors ${statusColor}`}>
                                <div className="flex gap-3">
                                    <div className={`mt-1 p-1.5 rounded-full ${submitted ? 'bg-green-100 text-green-600' : (doc.required ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400')}`}>
                                        {submitted ? <CheckCircle className="h-5 w-5" /> : (doc.required ? <AlertTriangle className="h-5 w-5" /> : <FileText className="h-5 w-5" />)}
                                    </div>
                                    <div>
                                        <h4 className={`font-semibold text-sm ${submitted ? 'text-green-800' : (doc.required ? 'text-red-800' : 'text-gray-700')}`}>
                                            {doc.label} {doc.required && <span className="text-red-500 ml-1">*</span>}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mb-1">{doc.desc}</p>

                                        {submitted ? (
                                            <div className="mt-2 text-sm font-medium text-blue-700 flex items-center gap-2 bg-white/50 px-2 py-1 rounded w-fit">
                                                <FileText className="h-3 w-3" />
                                                {submitted.fileName}
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-xs font-semibold text-red-600 uppercase tracking-wider">
                                                {doc.required ? 'Chưa Nộp' : 'Không bắt buộc'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {submitted && submitted.fileUrl && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-white hover:bg-green-50 text-green-700 border-green-200"
                                        onClick={() => handleView(submitted)}
                                    >
                                        Xem
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Other Attachments */}
                {otherAttachments.length > 0 && (
                    <>
                        <Separator />
                        <div>
                            <h4 className="font-semibold text-sm mb-3">Tài Liệu Khác</h4>
                            <div className="space-y-2">
                                {otherAttachments.map((att: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm font-medium">{att.type}</span>
                                            <span className="text-xs text-muted-foreground">({att.fileName})</span>
                                        </div>
                                        {att.fileUrl && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => handleView(att)}
                                            >
                                                Xem
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* File Preview Modal */}
            {previewFile && (
                <FilePreviewDialog
                    file={previewFile}
                    onClose={() => setPreviewFile(null)}
                />
            )}
        </>
    )
}

// Helper Component: Info Field
function InfoField({ label, value, icon, className }: { label: string, value: any, icon?: React.ReactNode, className?: string }) {
    return (
        <div className={className}>
            <dt className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                {icon}
                {label}
            </dt>
            <dd className="font-medium text-sm">{value || '—'}</dd>
        </div>
    )
}

// Helper: History Action Badge
function HistoryActionBadge({ action }: { action: string }) {
    const map: Record<string, { label: string; className: string }> = {
        'submitted': { label: 'Đã gửi', className: 'bg-blue-100 text-blue-800' },
        'review_started': { label: 'Bắt đầu xem xét', className: 'bg-blue-100 text-blue-800' },
        'revision_requested': { label: 'Yêu cầu bổ sung', className: 'bg-amber-100 text-amber-800' },
        'resubmitted': { label: 'Gửi lại', className: 'bg-blue-100 text-blue-800' },
        'accepted': { label: 'Chấp nhận', className: 'bg-green-100 text-green-800' },
        'rejected': { label: 'Từ chối', className: 'bg-red-100 text-red-800' },
    }
    const m = map[action] || { label: action, className: '' }
    return <Badge variant="outline" className={m.className}>{m.label}</Badge>
}
