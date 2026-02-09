'use client'

import { DOSSIER_CHECKLIST } from '@/config/dossier-checklist'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, CheckCircle, XCircle, AlertCircle, Edit } from 'lucide-react'
import { useState } from 'react'
import { saveDocumentReview } from '@/lib/actions/review'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface ReviewListProps {
    auditId: string
    dossier: any[]
    reviews: any[]
}

export default function ReviewList({ auditId, dossier, reviews }: ReviewListProps) {
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [evalStatus, setEvalStatus] = useState<string>('ok')
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [localReviews, setLocalReviews] = useState(reviews)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Helper to find review
    const getReview = (itemId: string) => localReviews.find((r: any) => r.dossier_item_id === itemId)

    // Helper to find file (only first one of type for now, simplified)
    const getFile = (typeId: string) => dossier.find((d: any) => d.document_type === typeId)

    const handleEdit = (typeId: string, currentReview: any) => {
        // We technically need the actual FILE ID (dossier_item_id) to link.
        // If there are multiple files for one requirement, we might need a better UI.
        // For now, let's link to the *first* file of that type found.
        const file = getFile(typeId)
        if (!file) {
            toast.error('Chưa có tài liệu để đánh giá')
            return
        }

        setSelectedItem({ typeId, fileId: file.id, label: DOSSIER_CHECKLIST.find(c => c.items.find(i => i.id === typeId))?.items.find(i => i.id === typeId)?.label })
        setEvalStatus(currentReview?.status || 'ok')
        setComment(currentReview?.auditor_notes || '')
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!selectedItem) return
        setIsSubmitting(true)

        try {
            const result = await saveDocumentReview({
                audit_id: auditId,
                item_id: selectedItem.fileId,
                section_id: selectedItem.typeId,
                status: evalStatus as 'ok' | 'minor' | 'major' | 'critical' | 'pending',
                auditor_notes: comment
            })

            if (result.success) {
                toast.success('Đã lưu đánh giá')
                setLocalReviews(prev => {
                    // Update local state to reflect changes immediately
                    // Note: Ideally we should strictly use what's returned or revalidate, but for optimistic UI:
                    // We need to match the structure of 'reviews' passed in props or fetched.
                    const existingIdx = prev.findIndex(r => r.item_id === selectedItem.fileId || r.dossier_item_id === selectedItem.fileId)

                    const newReview = {
                        audit_id: auditId,
                        dossier_item_id: selectedItem.fileId, // maintaining compatibility with existing prop structure if needed
                        item_id: selectedItem.fileId,
                        status: evalStatus,
                        evaluation_result: evalStatus, // for compatibility
                        auditor_notes: comment,
                        comments: comment, // for compatibility
                        id: existingIdx >= 0 ? prev[existingIdx].id : 'temp-' + Date.now()
                    }

                    if (existingIdx >= 0) {
                        const newArr = [...prev]
                        newArr[existingIdx] = { ...prev[existingIdx], ...newReview }
                        return newArr
                    }
                    return [...prev, newReview]
                })
                setIsDialogOpen(false)
            } else {
                toast.error(result.error)
            }
        } catch (e) {
            toast.error('Lỗi lưu')
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ok':
            case 'pass':
                return <Badge className="bg-green-500">Đạt yêu cầu</Badge>
            case 'major':
            case 'fail':
                return <Badge variant="destructive">Không đạt (Major)</Badge>
            case 'minor':
                return <Badge className="bg-orange-500">Không đạt (Minor)</Badge>
            case 'critical':
                return <Badge variant="destructive" className="animate-pulse">Nghiêm trọng</Badge>
            case 'info_needed':
                return <Badge variant="secondary">Cần bổ sung</Badge>
            default: return null
        }
    }

    return (
        <div className="space-y-6">
            {DOSSIER_CHECKLIST.map((category) => (
                <Card key={category.category}>
                    <CardHeader className="bg-gray-50 py-3">
                        <CardTitle className="text-base font-semibold">{category.category}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="text-left p-3 font-medium">Yêu cầu</th>
                                    <th className="text-left p-3 font-medium">Tài liệu</th>
                                    <th className="text-left p-3 font-medium">Đánh giá</th>
                                    <th className="text-right p-3 font-medium">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {category.items.map((item) => {
                                    const file = getFile(item.id)
                                    // Check both likely field names for ID match due to potential schema mismatch/migration
                                    const review = file ? localReviews.find((r: any) => r.dossier_item_id === file.id || r.item_id === file.id) : null

                                    return (
                                        <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50/50">
                                            <td className="p-3 w-1/3 align-top">
                                                <div className="font-medium">{item.label}</div>
                                                {item.required && <span className="text-xs text-red-500">* Bắt buộc</span>}
                                            </td>
                                            <td className="p-3 w-1/3 align-top">
                                                {file ? (
                                                    <a
                                                        href={file.file_url}
                                                        target="_blank"
                                                        className="flex items-center gap-2 text-blue-600 hover:underline"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                        {file.file_name}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400 italic">Chưa nộp</span>
                                                )}
                                            </td>
                                            <td className="p-3 align-top">
                                                {review ? (
                                                    <div className="space-y-1">
                                                        {getStatusBadge(review.status || review.evaluation_result)}
                                                        {(review.auditor_notes || review.comments) && (
                                                            <p className="text-xs text-gray-600 italic mt-1">"{review.auditor_notes || review.comments}"</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    file && <span className="text-gray-400 text-xs">Chưa đánh giá</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right align-top">
                                                {file && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(item.id, review)}
                                                    >
                                                        <Edit className="h-4 w-4 text-gray-600" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            ))}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Đánh giá tài liệu</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="font-medium">{selectedItem?.label}</div>

                        <div className="grid gap-2">
                            <Label>Kết quả</Label>
                            <Select value={evalStatus} onValueChange={setEvalStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ok">Đạt yêu cầu (OK)</SelectItem>
                                    <SelectItem value="minor">Không đạt (Minor)</SelectItem>
                                    <SelectItem value="major">Không đạt (Major)</SelectItem>
                                    <SelectItem value="critical">Nghiêm trọng (Critical)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Nhận xét / Ghi chú</Label>
                            <Textarea
                                placeholder="Ghi chú chi tiết về sự phù hợp hoặc điểm cần bổ sung..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>Lưu đánh giá</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
