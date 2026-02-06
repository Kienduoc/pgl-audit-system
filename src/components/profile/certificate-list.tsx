'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Award, Pencil, X, Loader2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { getSignedDocumentUrl } from '@/lib/actions/storage'

interface Certificate {
    id: string
    name: string
    issuing_org: string
    issue_date: string
    expiry_date: string
    credential_id: string
    document_url?: string
}

export function CertificateList({ initialData }: { initialData: Certificate[] }) {
    const [certs, setCerts] = useState<Certificate[]>(initialData)
    const [isAdding, setIsAdding] = useState(false)
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [formData, setFormData] = useState<Partial<Certificate>>({})
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const resetForm = () => {
        setFormData({})
        setIsAdding(false)
        setIsEditing(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const startEdit = (cert: Certificate) => {
        setFormData(cert)
        setIsEditing(cert.id)
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

        // Handle File Upload
        let documentUrl = isEditing ? certs.find(c => c.id === isEditing)?.document_url : undefined
        const file = fileInputRef.current?.files?.[0]

        if (file) {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}_cert.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('competence-docs')
                .upload(fileName, file)

            if (uploadError) {
                toast.error('Upload failed: ' + uploadError.message)
                setIsUploading(false)
                return
            }
            documentUrl = fileName
        }

        const payload = {
            user_id: user.id,
            name: form.get('name') as string,
            issuing_org: form.get('issuing_org') as string,
            issue_date: form.get('issue_date') as string || null,
            expiry_date: form.get('expiry_date') as string || null,
            credential_id: form.get('credential_id') as string,
            document_url: documentUrl
        }

        let error
        let data

        if (isEditing) {
            const res = await supabase
                .from('user_certificates')
                .update(payload)
                .eq('id', isEditing)
                .select()
                .single()
            error = res.error
            data = res.data
        } else {
            const res = await supabase
                .from('user_certificates')
                .insert(payload)
                .select()
                .single()
            error = res.error
            data = res.data
        }

        setIsUploading(false)

        if (error) {
            toast.error('Failed to save')
            return
        }

        if (isEditing) {
            setCerts(certs.map(c => c.id === isEditing ? data : c))
            toast.success('Certificate updated')
        } else {
            setCerts([data, ...certs])
            toast.success('Certificate added')
        }
        resetForm()
        router.refresh()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return
        const supabase = createClient()
        const { error } = await supabase.from('user_certificates').delete().eq('id', id)

        if (error) {
            toast.error('Failed to delete')
            return
        }
        setCerts(certs.filter(c => c.id !== id))
        toast.success('Deleted')
        router.refresh()
    }

    const handleViewProof = async (path: string) => {
        const { signedUrl, error } = await getSignedDocumentUrl(path)
        if (error) {
            toast.error("Could not generate link")
            return
        }
        if (signedUrl) {
            window.open(signedUrl, '_blank')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Certificates & Licenses</h3>
                {!isAdding && (
                    <Button size="sm" onClick={() => { setIsAdding(true); setFormData({}) }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Certificate
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base">{isEditing ? 'Edit Certificate' : 'New Certificate'}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-4 mt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input name="name" defaultValue={formData.name} required placeholder="ISO 17065 Lead Auditor" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Issuing Organization</Label>
                                    <Input name="issuing_org" defaultValue={formData.issuing_org} placeholder="IRCA / Exemplar Global" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label>Issue Date</Label>
                                        <Input type="date" name="issue_date" defaultValue={formData.issue_date} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Expiry Date</Label>
                                        <Input type="date" name="expiry_date" defaultValue={formData.expiry_date} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Credential ID</Label>
                                    <Input name="credential_id" defaultValue={formData.credential_id} placeholder="Optional" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Proof Document (PDF/Image)</Label>
                                <div className="flex gap-2 items-center">
                                    <Input type="file" ref={fileInputRef} accept=".pdf,image/*" className="bg-background" />
                                </div>
                                {formData.document_url && (
                                    <p className="text-xs text-muted-foreground">Current file attached. Upload new to replace.</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
                                <Button type="submit" disabled={isUploading}>
                                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {certs.map(cert => (
                    <Card key={cert.id} className="group hover:border-primary/50 transition-colors">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                        <Award className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{cert.name}</h4>
                                        <p className="text-sm text-muted-foreground">{cert.issuing_org}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Issued: {cert.issue_date || 'N/A'} {cert.expiry_date && `• Expires: ${cert.expiry_date}`}
                                        </p>
                                        {cert.credential_id && <p className="text-xs text-muted-foreground mt-1">ID: {cert.credential_id}</p>}

                                        {cert.document_url && (
                                            <div className="mt-2">
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto p-0 text-blue-600 font-semibold"
                                                    onClick={() => handleViewProof(cert.document_url!)}
                                                >
                                                    <FileText className="h-3 w-3 mr-1" /> View Proof
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => startEdit(cert)}>
                                        <Pencil className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cert.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {!certs.length && !isAdding && (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                        No certificates found.
                    </div>
                )}
            </div>
        </div>
    )
}
