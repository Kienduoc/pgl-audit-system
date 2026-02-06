'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { FileText, Upload, X, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DossierUploadProps {
    applicationId: string
    onUploadComplete?: () => void
}

type DocumentType = 'legal' | 'technical' | 'qa_manual' | 'other'

const DOC_TYPES: { type: DocumentType; label: string; description: string }[] = [
    { type: 'legal', label: 'Legal Documents', description: 'Business License, Tax Registration, etc.' },
    { type: 'technical', label: 'Technical Specifications', description: 'Product drawings, schematics, technical data.' },
    { type: 'qa_manual', label: 'QA Manual', description: 'Quality Assurance Manual, Procedures.' },
    { type: 'other', label: 'Other Support Docs', description: 'Any additional supporting information.' },
]

export function DossierUpload({ applicationId, onUploadComplete }: DossierUploadProps) {
    const supabase = createClient()
    const [uploading, setUploading] = useState<string | null>(null) // Stores the doc type currently uploading

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, docType: DocumentType) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error("File too large. Max 10MB allowed.")
            return
        }

        setUploading(docType)

        try {
            // 1. Upload file to Storage Bucket 'dossier'
            const fileExt = file.name.split('.').pop()
            const fileName = `${applicationId}/${docType}_${Date.now()}.${fileExt}`
            const bucketName = 'dossier' // Ensure this bucket exists in Supabase

            const { error: uploadError, data: uploadData } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Get Public URL (or signed URL if private - assuming public for MVP demo, but better private)
            // Ideally we store the path and generate signed URLs on view. 
            // For now, let's store the full path or public URL.
            // Let's store the RELATIVE path for security flexibility.

            const filePath = uploadData.path

            // 2. Create Record in DB
            const { error: dbError } = await supabase
                .from('audit_dossier')
                .insert({
                    application_id: applicationId,
                    document_type: docType,
                    file_name: file.name,
                    file_url: filePath, // Storing the path in bucket
                })

            if (dbError) throw dbError

            toast.success(`Uploaded ${DOC_TYPES.find(d => d.type === docType)?.label}`)
            if (onUploadComplete) onUploadComplete()

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Upload failed")
        } finally {
            setUploading(null)
            // Reset input
            event.target.value = ''
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {DOC_TYPES.map((doc) => (
                <Card key={doc.type} className="border-dashed hover:bg-muted/10 transition-colors">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            {doc.label}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 h-10">
                            {doc.description}
                        </p>

                        <div className="flex items-center gap-2">
                            <InputFile
                                id={`file-${doc.type}`}
                                onChange={(e) => handleFileUpload(e, doc.type)}
                                disabled={!!uploading}
                            />
                            <Label
                                htmlFor={`file-${doc.type}`}
                                className={`
                                    flex items-center justify-center w-full h-10 px-4 py-2 
                                    border rounded-md cursor-pointer 
                                    text-sm font-medium transition-colors
                                    ${uploading === doc.type
                                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90'}
                                `}
                            >
                                {uploading === doc.type ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" /> Select File
                                    </>
                                )}
                            </Label>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

// Hidden Input Helper
function InputFile({ id, onChange, disabled }: { id: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled: boolean }) {
    return (
        <input
            type="file"
            id={id}
            className="hidden"
            onChange={onChange}
            disabled={disabled}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
        />
    )
}
