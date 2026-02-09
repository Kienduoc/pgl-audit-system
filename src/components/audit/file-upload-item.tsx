"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, FileText, X, Eye, CheckCircle, AlertCircle, Link as LinkIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export interface Attachment {
    type: string
    fileUrl: string
    fileName: string
    fileSize?: number
    status: "pending" | "approved" | "rejected" | "uploaded"
    uploadedAt?: string
    attachmentType?: "file" | "link" // New field to distinguish
}

interface FileUploadItemProps {
    label: string
    value?: Attachment[]
    onChange: (value: Attachment[]) => void
    disabled?: boolean
}

export function FileUploadItem({ label, value = [], onChange, disabled }: FileUploadItemProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [linkUrl, setLinkUrl] = useState("")
    const supabase = createClient()

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)
        const newAttachments: Attachment[] = []

        try {
            const user = (await supabase.auth.getUser()).data.user
            if (!user) throw new Error("Unauthorized")

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                if (file.size > 10 * 1024 * 1024) {
                    toast.error(`File ${file.name} is too large (>10MB)`)
                    continue
                }

                const fileExt = file.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `${user.id}/${fileName}`

                const { error: uploadError, data } = await supabase.storage
                    .from('audit-attachments')
                    .upload(filePath, file)

                if (uploadError) {
                    console.error("Upload error", uploadError)
                    toast.error(`Failed to upload ${file.name}`)
                    continue
                }

                newAttachments.push({
                    type: label,
                    fileUrl: data.path,
                    fileName: file.name,
                    fileSize: file.size,
                    status: "uploaded",
                    uploadedAt: new Date().toISOString(),
                    attachmentType: "file"
                })
            }

            if (newAttachments.length > 0) {
                onChange([...value, ...newAttachments])
                toast.success(`Uploaded ${newAttachments.length} file(s)`)
            }

        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Failed to upload files")
        } finally {
            setIsUploading(false)
            // Reset input
            e.target.value = ''
        }
    }

    const handleAddLink = () => {
        if (!linkUrl) return

        // Simple URL validation
        let formattedUrl = linkUrl.trim()
        if (!formattedUrl.match(/^https?:\/\//)) {
            formattedUrl = `https://${formattedUrl}`
        }

        const newAttachment: Attachment = {
            type: label,
            fileUrl: formattedUrl,
            fileName: formattedUrl, // Or let user input a name? For now use URL
            fileSize: 0,
            status: "uploaded",
            uploadedAt: new Date().toISOString(),
            attachmentType: "link"
        }

        onChange([...value, newAttachment])
        setLinkUrl("")
        toast.success("Link added")
    }

    const handleRemove = (index: number) => {
        if (confirm("Remove this attachment?")) {
            const newValue = [...value]
            newValue.splice(index, 1)
            onChange(newValue)
        }
    }

    const handleView = async (attachment: Attachment) => {
        if (attachment.attachmentType === "link") {
            window.open(attachment.fileUrl, '_blank')
            return
        }

        // For files, get signed URL
        const { data, error } = await supabase.storage
            .from('audit-attachments')
            .createSignedUrl(attachment.fileUrl, 3600)

        if (error || !data?.signedUrl) {
            toast.error("Could not generate download link")
            return
        }

        window.open(data.signedUrl, '_blank')
    }

    return (
        <div className="p-4 border rounded-lg bg-card space-y-4">
            <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs text-muted-foreground">{value.length} items</span>
            </div>

            {/* List of Attachments */}
            {value.length > 0 && (
                <div className="space-y-2">
                    {value.map((att, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/40 rounded text-sm group">
                            <div className="flex items-center gap-2 overflow-hidden">
                                {att.attachmentType === 'link' ? (
                                    <LinkIcon className="w-4 h-4 text-blue-500 shrink-0" />
                                ) : (
                                    <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                                )}
                                <span className="truncate max-w-[300px]" title={att.fileName}>{att.fileName}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleView(att)}>
                                    <Eye className="w-3 h-3" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(index)}>
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions Area */}
            <div className="flex flex-col gap-3 pt-2 border-t">
                {/* 1. Add Link (Priority) */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9"
                            placeholder="Paste Google Drive / Dropbox link here..."
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddLink()
                                }
                            }}
                        />
                    </div>
                    <Button type="button" size="sm" onClick={handleAddLink} disabled={!linkUrl}>
                        Add Link
                    </Button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or</span>
                    </div>
                </div>

                {/* 2. Upload File */}
                <div className="flex justify-center">
                    <div className="relative">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleUpload}
                            disabled={disabled || isUploading}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.rar"
                            multiple
                        />
                        <Button type="button" variant="outline" size="sm" disabled={disabled || isUploading} className="w-full min-w-[200px]">
                            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                            Upload Files (Max 10MB)
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
