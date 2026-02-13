'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, GraduationCap, FileText, Loader2, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { getSignedDocumentUrl } from '@/lib/actions/storage'

interface Education {
    id: string
    institution: string
    degree: string
    field_of_study: string
    start_date: string
    end_date: string
    description: string
    document_url?: string
}

export function EducationList({ initialData }: { initialData: Education[] }) {
    const [educations, setEducations] = useState<Education[]>(initialData)
    const [isAdding, setIsAdding] = useState(false)
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // State for form fields (to handle edit mode pre-fill)
    const [formData, setFormData] = useState<Partial<Education>>({})

    const resetForm = () => {
        setFormData({})
        setIsAdding(false)
        setIsEditing(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const startEdit = (edu: Education) => {
        setFormData(edu)
        setIsEditing(edu.id)
        setIsAdding(true)
    }

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsUploading(true)
        const form = new FormData(e.currentTarget)
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setIsUploading(false)
            return
        }

        // 1. Handle File Upload
        let documentUrl = isEditing ? educations.find(e => e.id === isEditing)?.document_url : undefined
        const file = fileInputRef.current?.files?.[0]

        if (file) {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('competence-docs')
                .upload(fileName, file)

            if (uploadError) {
                toast.error('Tải lên thất bại: ' + uploadError.message)
                setIsUploading(false)
                return
            }
            documentUrl = fileName
        }

        const payload = {
            user_id: user.id,
            institution: form.get('institution') as string,
            degree: form.get('degree') as string,
            field_of_study: form.get('field_of_study') as string,
            start_date: form.get('start_date') as string || null,
            end_date: form.get('end_date') as string || null,
            description: form.get('description') as string,
            document_url: documentUrl
        }

        let error
        let data

        if (isEditing) {
            const res = await supabase
                .from('user_educations')
                .update(payload)
                .eq('id', isEditing)
                .select()
                .single()
            error = res.error
            data = res.data
        } else {
            const res = await supabase
                .from('user_educations')
                .insert(payload)
                .select()
                .single()
            error = res.error
            data = res.data
        }

        setIsUploading(false)

        if (error) {
            toast.error('Lưu thất bại: ' + error.message)
            return
        }

        if (isEditing) {
            setEducations(educations.map(e => e.id === isEditing ? data : e))
            toast.success('Đã cập nhật học vấn')
        } else {
            setEducations([data, ...educations])
            toast.success('Đã thêm học vấn')
        }

        resetForm()
        router.refresh()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa mục này?")) return

        const supabase = createClient()
        const { error } = await supabase.from('user_educations').delete().eq('id', id)

        if (error) {
            toast.error('Xóa thất bại')
            return
        }
        setEducations(educations.filter(e => e.id !== id))
        toast.success('Đã xóa')
        router.refresh()
    }

    const handleViewProof = async (path: string) => {
        const { signedUrl, error } = await getSignedDocumentUrl(path)
        if (error) {
            toast.error("Không thể tạo liên kết")
            return
        }
        if (signedUrl) {
            window.open(signedUrl, '_blank')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Lịch Sử Học Vấn</h3>
                {!isAdding && (
                    <Button size="sm" onClick={() => { setIsAdding(true); setFormData({}) }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm Học Vấn
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-semibold">
                            {isEditing ? 'Chỉnh Sửa Học Vấn' : 'Học Vấn Mới'}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-4 mt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Trường/Cơ Sở Đào Tạo</Label>
                                    <Input name="institution" defaultValue={formData.institution} required placeholder="Tên trường" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Bằng Cấp</Label>
                                    <Input name="degree" defaultValue={formData.degree} placeholder="VD: Cử nhân" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Chuyên Ngành</Label>
                                    <Input name="field_of_study" defaultValue={formData.field_of_study} placeholder="VD: Khoa học máy tính" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label>Ngày Bắt Đầu</Label>
                                        <Input type="date" name="start_date" defaultValue={formData.start_date} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ngày Kết Thúc</Label>
                                        <Input type="date" name="end_date" defaultValue={formData.end_date} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Mô Tả</Label>
                                <Textarea name="description" defaultValue={formData.description} placeholder="Hoạt động và thành tích..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Tài Liệu Minh Chứng (PDF/Ảnh)</Label>
                                <div className="flex gap-2 items-center">
                                    <Input type="file" ref={fileInputRef} accept=".pdf,image/*" className="bg-background" />
                                </div>
                                {formData.document_url && (
                                    <p className="text-xs text-muted-foreground">Đang có tệp đính kèm. Tải lên mới để thay thế.</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={resetForm}>Hủy</Button>
                                <Button type="submit" disabled={isUploading}>
                                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Lưu Hồ Sơ
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {educations.map(edu => (
                    <Card key={edu.id} className="group hover:border-primary/50 transition-colors">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                        <GraduationCap className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{edu.institution}</h4>
                                        <p className="text-sm text-muted-foreground">{edu.degree} - {edu.field_of_study}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {edu.start_date || 'N/A'} - {edu.end_date || 'Hiện Tại'}
                                        </p>
                                        {edu.description && <p className="text-sm mt-2 text-primary/80">{edu.description}</p>}

                                        {edu.document_url && (
                                            <div className="mt-2">
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto p-0 text-blue-600 font-semibold"
                                                    onClick={() => handleViewProof(edu.document_url!)}
                                                >
                                                    <FileText className="h-3 w-3 mr-1" /> Xem Minh Chứng
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => startEdit(edu)}>
                                        <Pencil className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(edu.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {!educations.length && !isAdding && (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                        Không tìm thấy hồ sơ học vấn.
                    </div>
                )}
            </div>
        </div>
    )
}
