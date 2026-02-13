'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createQuickApplication } from '@/lib/actions/audit-applications'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ClientAuditRequestFormProps {
    clientOrgId: string
}

export function ClientAuditRequestForm({ clientOrgId }: ClientAuditRequestFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({
        product_name: '',
        model_type: '',
        manufacturer_name: '',
        factory_location: '',
        applied_standard: '',
        certification_type: 'initial'
    })

    const handleSubmit = async () => {
        if (!data.product_name || !data.applied_standard) {
            toast.error("Vui lòng điền đầy đủ các trường bắt buộc (*)")
            return
        }

        setLoading(true)
        const payload = {
            ...data,
            client_org_id: clientOrgId
        }

        const res = await createQuickApplication(payload)

        if (res?.error) {
            toast.error(res.error)
            setLoading(false)
        } else {
            toast.success("Đã nộp đơn đăng ký đánh giá thành công!")
            router.push('/profile')
            router.refresh()
        }
    }

    return (
        <div className="bg-card border rounded-lg p-6 space-y-6">
            <div>
                <h3 className="font-semibold text-lg">Đơn Đăng Ký Chứng Nhận Sản Phẩm Mới</h3>
                <p className="text-sm text-muted-foreground">Nộp đơn đăng ký cho phạm vi hoặc sản phẩm mới.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Tên Sản Phẩm</Label>
                    <Input
                        value={data.product_name}
                        onChange={e => setData({ ...data, product_name: e.target.value })}
                        placeholder="Ví dụ: Ấm đun nước siêu tốc"
                    />
                </div>
                <div>
                    <Label>Kiểu Loại / Model</Label>
                    <Input
                        value={data.model_type}
                        onChange={e => setData({ ...data, model_type: e.target.value })}
                        placeholder="Ví dụ: Series EK-2024"
                    />
                </div>
                <div>
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Loại Hình Chứng Nhận</Label>
                    <Select
                        value={data.certification_type}
                        onValueChange={v => setData({ ...data, certification_type: v })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="initial">Chứng nhận lần đầu</SelectItem>
                            <SelectItem value="surveillance">Giám sát định kỳ</SelectItem>
                            <SelectItem value="recertification">Tái chứng nhận</SelectItem>
                            <SelectItem value="extension">Mở rộng phạm vi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Tên Nhà Sản Xuất</Label>
                    <Input
                        value={data.manufacturer_name}
                        onChange={e => setData({ ...data, manufacturer_name: e.target.value })}
                        placeholder="Nếu khác với người nộp đơn"
                    />
                </div>
                <div>
                    <Label>Địa Điểm Nhà Máy</Label>
                    <Input
                        value={data.factory_location}
                        onChange={e => setData({ ...data, factory_location: e.target.value })}
                        placeholder="Địa chỉ nhà máy sản xuất"
                    />
                </div>
                <div className="col-span-2">
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Tiêu Chuẩn Áp Dụng</Label>
                    <Input
                        value={data.applied_standard}
                        onChange={e => setData({ ...data, applied_standard: e.target.value })}
                        placeholder="Ví dụ: TCVN 5699-1:2010 / IEC 60335-1:2010"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => router.back()} disabled={loading}>Hủy</Button>
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Nộp Đơn Đăng Ký
                </Button>
            </div>
        </div>
    )
}
