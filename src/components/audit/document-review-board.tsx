'use client'

import { useState } from 'react'
import { DOSSIER_CHECKLIST } from '@/config/dossier-checklist'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle, AlertTriangle, XCircle, MessageSquare } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { saveDocumentReview, completeDocumentReview } from '@/lib/actions/review'
import { useRouter } from 'next/navigation'

interface AuditDocumentReviewBoardProps {
    auditId: string
    dossier: any[]
    reviews: any[]
}

export default function AuditDocumentReviewBoard({ auditId, dossier = [], reviews = [] }: AuditDocumentReviewBoardProps) {
    const [saving, setSaving] = useState<string | null>(null)
    const router = useRouter()

    // Helper to get client upload
    const getClientUpload = (itemId: string) => {
        return dossier.find((d) => d.item_id === itemId)
    }

    // Helper to get existing review
    const getReview = (itemId: string) => {
        return reviews.find((r) => r.item_id === itemId)
    }

    // Handle Save
    const handleSave = async (itemId: string, categoryId: string, status: any, notes?: string) => {
        setSaving(itemId)
        try {
            const result = await saveDocumentReview({
                audit_id: auditId,
                item_id: itemId,
                section_id: categoryId,
                status: status,
                auditor_notes: notes
            })

            if (result.success) {
                toast.success('Review saved')
            } else {
                toast.error('Failed to save', { description: result.error })
            }
        } catch (err: any) {
            toast.error('Error', { description: err.message })
        } finally {
            setSaving(null)
        }
    }


    const handleComplete = async () => {
        // Confirm before completing
        if (!confirm('Are you sure you want to complete the document review? This will notify the client.')) return

        setSaving('complete')
        try {
            const result = await completeDocumentReview(auditId)
            if (result.success) {
                toast.success('Đã hoàn thành xem xét hồ sơ')
                router.refresh()
                router.push(`/audits/${auditId}`)
            } else {
                toast.error('Lỗi khi hoàn thành xem xét', { description: result.error })
            }
        } catch (err: any) {
            toast.error('Error', { description: err.message })
        } finally {
            setSaving(null)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                <div>
                    <h2 className="text-lg font-semibold">Tiến Độ Xem Xét Hồ Sơ</h2>
                    <p className="text-sm text-gray-500">
                        Đã xem xét: {reviews.length} / {DOSSIER_CHECKLIST.reduce((acc, cat) => acc + cat.items.length, 0)} mục
                    </p>
                </div>
                <Button onClick={() => window.open(`/audits/${auditId}/report/document-review`, '_blank')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Tạo Báo Cáo BM06
                </Button>
                <Button variant="default" onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Hoàn Thành Xem Xét
                </Button>
            </div>

            {DOSSIER_CHECKLIST.map((category, catIndex) => (
                <Card key={catIndex}>
                    <CardHeader className="bg-gray-50 pb-4">
                        <CardTitle className="text-lg">{category.category}</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {category.items.map((item) => {
                            const upload = getClientUpload(item.id)
                            const review = getReview(item.id)
                            const currentStatus = review?.status || 'pending'
                            const currentNotes = review?.auditor_notes || ''

                            return (
                                <div key={item.id} className="py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                                    {/* 1. Requirement & Client Status */}
                                    <div className="md:col-span-4 space-y-2">
                                        <div className="font-medium text-sm flex items-center gap-2">
                                            {item.label}
                                            {item.required && <Badge variant="outline" className="text-xs border-red-200 text-red-500">Required</Badge>}
                                        </div>

                                        {upload ? (
                                            <div className="space-y-1">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-2">
                                                    Client Submitted
                                                </Badge>
                                                {upload.file_paths?.map((path: string, idx: number) => (
                                                    <a
                                                        key={idx}
                                                        href="#" // In real app, generate signed URL
                                                        className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                                                    >
                                                        <FileText className="h-3 w-3" />
                                                        <span className="truncate max-w-[200px]">{path.split('/').pop()}</span>
                                                    </a>
                                                ))}
                                                {upload.comments && (
                                                    <p className="text-xs text-muted-foreground italic border-l-2 pl-2 mt-1">
                                                        Client: "{upload.comments}"
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <Badge variant="secondary" className="text-gray-500">
                                                Not Submitted
                                            </Badge>
                                        )}
                                    </div>

                                    {/* 2. Review Controls */}
                                    <div className="md:col-span-8 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Đánh Giá Của Chuyên Gia</label>
                                                {/* Status Indicator */}
                                                {currentStatus === 'ok' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                                {currentStatus === 'minor' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                                                {currentStatus === 'major' && <XCircle className="h-5 w-5 text-orange-500" />}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Select
                                                    defaultValue={currentStatus}
                                                    onValueChange={(val) => handleSave(item.id, category.category, val, currentNotes)}
                                                >
                                                    <SelectTrigger className="bg-white">
                                                        <SelectValue placeholder="Chọn Trạng Thái" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Chờ Xem Xét</SelectItem>
                                                        <SelectItem value="ok">Phù Hợp (OK)</SelectItem>
                                                        <SelectItem value="minor">Lỗi Nhẹ (Minor NC)</SelectItem>
                                                        <SelectItem value="major">Lỗi Nặng (Major NC)</SelectItem>
                                                        <SelectItem value="critical">Lỗi Nghiêm Trọng</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <div className="relative">
                                                    <Textarea
                                                        placeholder="Nhận xét / phát hiện của chuyên gia..."
                                                        className="min-h-[80px] bg-white text-sm"
                                                        defaultValue={currentNotes}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== currentNotes) {
                                                                handleSave(item.id, category.category, currentStatus, e.target.value)
                                                            }
                                                        }}
                                                    />
                                                    <MessageSquare className="absolute top-3 right-3 h-4 w-4 text-gray-300" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
