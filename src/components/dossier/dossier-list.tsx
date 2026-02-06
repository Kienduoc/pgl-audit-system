'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileIcon, Trash2, Eye, Download } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface DossierFile {
    id: string
    document_type: string
    file_name: string
    file_url: string
    uploaded_at: string
}

interface DossierListProps {
    applicationId: string
    refreshTrigger?: number // Simple prop to trigger re-fetch
}

export function DossierList({ applicationId, refreshTrigger }: DossierListProps) {
    const supabase = createClient()
    const [files, setFiles] = useState<DossierFile[]>([])
    const [loading, setLoading] = useState(true)

    const fetchFiles = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('audit_dossier')
            .select('*')
            .eq('application_id', applicationId)
            .order('uploaded_at', { ascending: false })

        if (error) {
            console.error(error)
            toast.error("Failed to load dossier files")
        } else {
            setFiles(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchFiles()
    }, [applicationId, refreshTrigger])

    const handleDelete = async (id: string, filePath: string) => {
        if (!confirm("Are you sure you want to delete this document?")) return

        try {
            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('dossier')
                .remove([filePath])

            if (storageError) throw storageError

            // 2. Delete from DB
            const { error: dbError } = await supabase
                .from('audit_dossier')
                .delete()
                .eq('id', id)

            if (dbError) throw dbError

            toast.success("Document deleted")
            fetchFiles()

        } catch (error: any) {
            toast.error(error.message || "Failed to delete")
        }
    }

    const handleDownload = async (filePath: string, fileName: string) => {
        try {
            const { data, error } = await supabase.storage
                .from('dossier')
                .download(filePath)

            if (error) throw error

            // Create blob link to download
            const url = window.URL.createObjectURL(data)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()
            link.remove()

        } catch (error: any) {
            toast.error("Download failed")
        }
    }

    if (loading) return <div className="text-center py-4 text-muted-foreground">Loading documents...</div>

    if (files.length === 0) {
        return (
            <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
                <p className="text-muted-foreground">No documents uploaded yet.</p>
            </div>
        )
    }

    return (
        <div className="border rounded-md overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Document Type</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Uploaded At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {files.map((file) => (
                        <TableRow key={file.id}>
                            <TableCell className="font-medium capitalize">
                                {file.document_type.replace('_', ' ')}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <FileIcon className="h-4 w-4 text-blue-500" />
                                    <span className="truncate max-w-[200px]" title={file.file_name}>
                                        {file.file_name}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(file.uploaded_at), 'MMM d, yyyy HH:mm')}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDownload(file.file_url, file.file_name)}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(file.id, file.file_url)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
