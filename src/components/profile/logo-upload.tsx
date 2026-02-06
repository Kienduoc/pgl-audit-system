'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Upload, Loader2, X } from 'lucide-react'

interface LogoUploadProps {
    currentLogoUrl?: string | null
    organizationId?: string
    companyName?: string
}

export function LogoUpload({ currentLogoUrl, organizationId, companyName }: LogoUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [logoUrl, setLogoUrl] = useState(currentLogoUrl)
    const supabase = createClient()

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file')
            return
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image size must be less than 2MB')
            return
        }

        setUploading(true)

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Create unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const filePath = `logos/${fileName}`

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('company-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('company-assets')
                .getPublicUrl(filePath)

            // Update client_organizations table
            const { error: updateError } = await supabase
                .from('client_organizations')
                .update({ logo_url: publicUrl })
                .eq('profile_id', user.id)

            if (updateError) throw updateError

            setLogoUrl(publicUrl)
            toast.success('Logo uploaded successfully')
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Failed to upload logo')
        } finally {
            setUploading(false)
        }
    }

    const handleRemove = async () => {
        if (!logoUrl) return

        setUploading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Remove from database
            const { error } = await supabase
                .from('client_organizations')
                .update({ logo_url: null })
                .eq('profile_id', user.id)

            if (error) throw error

            // Note: We don't delete from storage to keep file history
            // You can add storage deletion if needed

            setLogoUrl(null)
            toast.success('Logo removed')
        } catch (error: any) {
            toast.error(error.message || 'Failed to remove logo')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-4">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={logoUrl || undefined} />
                    <AvatarFallback className="text-lg">
                        {companyName?.[0] || 'C'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploading}
                            onClick={() => document.getElementById('logo-upload')?.click()}
                        >
                            {uploading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4 mr-2" />
                            )}
                            {logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                        {logoUrl && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={uploading}
                                onClick={handleRemove}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Remove
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Recommended: Square image, max 2MB (JPG, PNG, SVG)
                    </p>
                </div>
            </div>
            <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
            />
        </div>
    )
}
