'use client'

import { useState, useEffect } from 'react'
import { DOSSIER_CHECKLIST } from '@/config/dossier-checklist'
import { getDossierItems, uploadDossierItem, deleteDossierItem, submitDossier } from '@/lib/actions/dossier'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { File, Trash2, Upload, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter, usePathname } from 'next/navigation'

interface ClientDossierChecklistProps {
    applicationId: string
    auditId: string
    isReadOnly?: boolean
}

type DossierItem = {
    id: string
    document_type: string
    file_name: string
    file_url: string
}

export function ClientDossierChecklist({ applicationId, auditId, isReadOnly = false }: ClientDossierChecklistProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [dossierFiles, setDossierFiles] = useState<DossierItem[]>([])
    const [loading, setLoading] = useState(true)
    const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({})

    useEffect(() => {
        const fetchDossier = async () => {
            const { data, error } = await getDossierItems(applicationId)
            if (error) {
                toast.error('Không thể tải hồ sơ')
            } else {
                setDossierFiles(data || [])
            }
            setLoading(false)
        }
        fetchDossier()
    }, [applicationId])

    const handleUpload = async (documentType: string, file: File) => {
        setUploadingState(prev => ({ ...prev, [documentType]: true }))

        const formData = new FormData()
        formData.append('file', file)
        formData.append('documentType', documentType)
        formData.append('applicationId', applicationId)
        formData.append('auditId', auditId)
        formData.append('path', pathname)

        const result = await uploadDossierItem(formData)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Tải lên thành công')
            // Refresh local state (or refetch)
            const { data } = await getDossierItems(applicationId)
            setDossierFiles(data || [])
        }

        setUploadingState(prev => ({ ...prev, [documentType]: false }))
    }

    const handleDelete = async (fileId: string, filePath: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa tệp này?')) return

        const result = await deleteDossierItem(auditId, fileId, filePath, pathname)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Đã xóa tệp')
            setDossierFiles(prev => prev.filter(f => f.id !== fileId))
        }
    }

    const handleSubmitDossier = async () => {
        if (!confirm('Xác nhận gửi? Bạn có thể không chỉnh sửa được sau thao tác này.')) return

        const result = await submitDossier(applicationId, auditId, pathname)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Gửi hồ sơ thành công!')
            router.refresh()
        }
    }

    if (loading) return <div>Đang tải hồ sơ...</div>

    return (
        <div className="space-y-8">
            {DOSSIER_CHECKLIST.map((section) => (
                <div key={section.category} className="space-y-4">
                    <h3 className="text-lg font-semibold">{section.category}</h3>
                    <div className="grid gap-4">
                        {section.items.map((item) => {
                            const files = dossierFiles.filter(f => f.document_type === item.id)
                            const isUploading = uploadingState[item.id]

                            return (
                                <Card key={item.id}>
                                    <div className="flex items-center justify-between p-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{item.label}</span>
                                                {item.required && <Badge variant="secondary">Bắt Buộc</Badge>}
                                                {files.length > 0 && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                            </div>
                                            {files.length > 0 && (
                                                <div className="text-sm text-gray-500">
                                                    {files.length} tệp đã tải lên
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                type="file"
                                                id={`file-${item.id}`}
                                                className="hidden"
                                                disabled={isReadOnly || isUploading}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) handleUpload(item.id, file)
                                                }}
                                            />
                                            <label htmlFor={`file-${item.id}`}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    disabled={isReadOnly || isUploading}
                                                    className="cursor-pointer"
                                                >
                                                    <span>
                                                        {isUploading ? 'Đang tải...' : 'Tải Lên'}
                                                        <Upload className="w-4 h-4 ml-2" />
                                                    </span>
                                                </Button>
                                            </label>
                                        </div>
                                    </div>
                                    {files.length > 0 && (
                                        <div className="bg-muted/50 p-4 border-t space-y-2">
                                            {files.map(file => (
                                                <div key={file.id} className="flex items-center justify-between text-sm bg-background p-2 rounded border">
                                                    <div className="flex items-center gap-2">
                                                        <File className="w-4 h-4 text-blue-500" />
                                                        <span className="truncate max-w-[300px]">{file.file_name}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(file.id, file.file_url)}
                                                        disabled={isReadOnly}
                                                        className="h-8 w-8 text-destructive hover:text-destructive/90"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            )
                        })}
                    </div>
                </div>
            ))}

            <div className="flex justify-end pt-6 border-t">
                <Button size="lg" onClick={handleSubmitDossier} disabled={isReadOnly}>
                    Gửi Hồ sơ Nghiệm Thu
                </Button>
            </div>
        </div>
    )
}
