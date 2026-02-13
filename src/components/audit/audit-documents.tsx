'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadAuditDocument, deleteAuditDocument, assignAuditorToDocument } from '@/lib/actions/documents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Upload, Trash2, UserPlus, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface AuditDocument {
    id: string
    name: string
    file_type: string
    created_at: string
    assigned_auditors: string[] | null
    uploader_id: string
}

interface Auditor {
    user_id: string
    user: { full_name: string }
    role: string
}

interface Props {
    auditId: string
    documents: AuditDocument[]
    auditors: Auditor[] // For Lead to assign
    currentUserRole: string // 'client', 'lead_auditor', 'auditor'
}

export function AuditDocuments({ auditId, documents, auditors, currentUserRole }: Props) {
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [docType, setDocType] = useState('application')

    const isClient = currentUserRole === 'client'
    const isLead = currentUserRole === 'lead_auditor' || currentUserRole === 'admin'

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        const supabase = createClient()
        const fileExt = file.name.split('.').pop()
        const filePath = `${auditId}/${Math.random().toString(36).substring(7)}.${fileExt}`

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('audit-docs')
            .upload(filePath, file)

        if (uploadError) {
            toast.error('Tải lên thất bại: ' + uploadError.message)
            setUploading(false)
            return
        }

        // 2. Save metadata
        const result = await uploadAuditDocument(auditId, file.name, filePath, docType)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Đã tải lên tài liệu')
            setFile(null)
        }
        setUploading(false)
    }

    const handleAssign = async (docId: string, auditorId: string) => {
        const result = await assignAuditorToDocument(auditId, docId, auditorId)
        if (result.error) toast.error(result.error)
        else toast.success('Đã phân công quyền truy cập')
    }

    const handleDelete = async (docId: string) => {
        if (!confirm('Bạn có chắc chắn không?')) return
        const result = await deleteAuditDocument(auditId, docId)
        if (result.error) toast.error(result.error)
        else toast.success('Đã xóa tài liệu')
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Tài Liệu Đánh Giá</CardTitle>
                    <CardDescription>
                        {isClient ? "Tải lên tài liệu hồ sơ của bạn tại đây." : "Quản lý và xem xét bằng chứng đánh giá."}
                    </CardDescription>
                </div>
                {/* Upload Dialog (Available to Client & Lead) */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Upload className="mr-2 h-4 w-4" /> Tải Lên Tài Liệu
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tải Lên Tài Liệu</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Loại Tài Liệu</Label>
                                <Select value={docType} onValueChange={setDocType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="application">Đơn Đăng Ký / Hồ Sơ</SelectItem>
                                        <SelectItem value="manual">Sổ Tay Chất Lượng</SelectItem>
                                        <SelectItem value="procedure">Quy Trình</SelectItem>
                                        <SelectItem value="record">Hồ Sơ / Bằng Chứng</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tệp Tin</Label>
                                <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
                            </div>
                            <Button onClick={handleUpload} disabled={uploading || !file} className="w-full">
                                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Tải Lên
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên</TableHead>
                            <TableHead>Loại</TableHead>
                            <TableHead>Ngày</TableHead>
                            {isLead && <TableHead>Truy Cập</TableHead>}
                            <TableHead className="text-right">Hành Động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.map((doc) => (
                            <TableRow key={doc.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        {doc.name}
                                    </div>
                                </TableCell>
                                <TableCell><Badge variant="outline" className="capitalize">{doc.file_type}</Badge></TableCell>
                                <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>

                                {isLead && (
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1 mb-1">
                                            {doc.assigned_auditors?.map(uid => {
                                                const auditor = auditors.find(a => a.user_id === uid)
                                                return auditor ? <Badge key={uid} variant="secondary" className="text-xs">{auditor.user.full_name}</Badge> : null
                                            })}
                                        </div>
                                        <Select onValueChange={(val) => handleAssign(doc.id, val)}>
                                            <SelectTrigger className="h-7 text-xs w-[130px]">
                                                <SelectValue placeholder="+ Phân Công" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {auditors.map(a => (
                                                    <SelectItem key={a.user_id} value={a.user_id}>{a.user.full_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                )}

                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => toast.info('View logic similar to Education (Signed URL)')}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    {(isLead || isClient) && (
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {documents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={isLead ? 5 : 4} className="text-center text-muted-foreground py-8">
                                    Chưa có tài liệu nào được tải lên.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
