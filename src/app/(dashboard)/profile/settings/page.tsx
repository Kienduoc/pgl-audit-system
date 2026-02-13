'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { LogoUpload } from '@/components/profile/logo-upload'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function ProfileSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [logoUrl, setLogoUrl] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        english_name: '',
        vietnamese_name: '',
        tax_code: '',
        office_address: '',
        factory_address: '',
        representative_name: '',
        contact_person_name: '',
        contact_phone: '',
        year_established: '',
        staff_total: '',
        main_market: '',
    })

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                setUserId(user.id)
                // Role Check
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('active_role, role')
                    .eq('id', user.id)
                    .single()

                const activeRole = profile?.active_role || profile?.role || 'client'

                // Redirect if not Client or Admin
                if (activeRole === 'auditor' || activeRole === 'lead_auditor') {
                    // Since this is client-side, we can use window or just redirect via next/navigation
                    // Ideally this should be a layout or server component check, but for now:
                    window.location.href = '/profile'
                    return
                }

                // Try to fetch existing Organization Info
                const { data: org } = await supabase
                    .from('client_organizations')
                    .select('*')
                    .eq('profile_id', user.id)
                    .single()

                if (org) {
                    setFormData({
                        english_name: org.english_name || '',
                        vietnamese_name: org.vietnamese_name || '',
                        tax_code: org.tax_code || '',
                        office_address: org.office_address || '',
                        factory_address: org.factory_address || '',
                        representative_name: org.representative_name || '',
                        contact_person_name: org.contact_person_name || '',
                        contact_phone: org.contact_phone || '',
                        year_established: org.year_established || '',
                        staff_total: org.staff_total || '',
                        main_market: org.main_market || '',
                    })
                    setLogoUrl(org.logo_url || null)
                } else {
                    // Fallback to Profile data if Org data doesn't exist yet
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single()

                    if (profile) {
                        setFormData(prev => ({
                            ...prev,
                            vietnamese_name: profile.company_name || '',
                            representative_name: profile.full_name || '',
                            contact_phone: profile.phone || '',
                            tax_code: profile.tax_code || '',
                            office_address: profile.address || '',
                        }))
                    }
                }
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const supabase = createClient()

        try {
            // Check if Org record exists
            const { data: existingOrg } = await supabase
                .from('client_organizations')
                .select('id')
                .eq('profile_id', userId)
                .single()

            let error;

            if (existingOrg) {
                // Update
                const { error: updateError } = await supabase
                    .from('client_organizations')
                    .update({
                        ...formData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('profile_id', userId)
                error = updateError
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('client_organizations')
                    .insert({
                        profile_id: userId,
                        ...formData
                    })
                error = insertError
            }

            if (error) throw error
            toast.success("Đã lưu thông tin tổ chức thành công!")
        } catch (error: any) {
            toast.error("Lưu cài đặt thất bại: " + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin" /></div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Cài Đặt Tổ Chức</h1>
                <p className="text-muted-foreground">Quản lý thông tin công ty. Thông tin này sẽ tự động điền vào Yêu Cầu Đánh Giá.</p>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Hồ Sơ Công Ty</CardTitle>
                        <CardDescription>Thông tin chính thức cho tài liệu chứng nhận.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Logo Upload */}
                        <LogoUpload
                            currentLogoUrl={logoUrl}
                            companyName={formData.vietnamese_name}
                        />

                        <Separator />

                        {/* Basic Identity */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm uppercase text-muted-foreground">Thông Tin Chung</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tên Tiếng Việt <span className="text-red-500">*</span></Label>
                                    <Input name="vietnamese_name" value={formData.vietnamese_name} onChange={handleChange} required placeholder="Công ty TNHH..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tên Tiếng Anh</Label>
                                    <Input name="english_name" value={formData.english_name} onChange={handleChange} placeholder="... Co., Ltd" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mã Số Thuế <span className="text-red-500">*</span></Label>
                                    <Input name="tax_code" value={formData.tax_code} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Năm Thành Lập</Label>
                                    <Input name="year_established" type="number" value={formData.year_established} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Location */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm uppercase text-muted-foreground">Địa Điểm</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label>Địa Chỉ Văn Phòng <span className="text-red-500">*</span></Label>
                                    <Input name="office_address" value={formData.office_address} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Địa Chỉ Nhà Máy <span className="text-red-500">*</span></Label>
                                    <Input name="factory_address" value={formData.factory_address} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Contact & Operations */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm uppercase text-muted-foreground">Nhân Sự & Vận Hành</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Người Đại Diện Pháp Luật</Label>
                                    <Input name="representative_name" value={formData.representative_name} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Người Liên Hệ (Phụ Trách Audit)</Label>
                                    <Input name="contact_person_name" value={formData.contact_person_name} onChange={handleChange} placeholder="Họ tên người liên hệ" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Số Điện Thoại Liên Hệ</Label>
                                    <Input name="contact_phone" value={formData.contact_phone} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tổng Số Nhân Viên</Label>
                                    <Input name="staff_total" type="number" value={formData.staff_total} onChange={handleChange} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Thị Trường Chính</Label>
                                    <Input name="main_market" value={formData.main_market} onChange={handleChange} placeholder="VD: Nội địa, EU, USA..." />
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="flex justify-end bg-muted/20 border-t p-6">
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" /> Lưu Thay Đổi
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
