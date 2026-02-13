'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface QuickApplicationFormProps {
    onSubmit: (data: any) => void
    onCancel: () => void
}

export function QuickApplicationForm({ onSubmit, onCancel }: QuickApplicationFormProps) {
    const [data, setData] = useState({
        product_name: '',
        model_type: '',
        manufacturer_name: '',
        factory_location: '',
        applied_standard: '',
        certification_type: 'initial'
    })

    const handleSubmit = () => {
        if (!data.product_name || !data.applied_standard) return
        onSubmit(data)
    }

    return (
        <div className="bg-card border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">Đơn Đăng Ký Sản Phẩm Mới</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Tên Sản Phẩm</Label>
                    <Input
                        value={data.product_name}
                        onChange={e => setData({ ...data, product_name: e.target.value })}
                        placeholder="Ví dụ: Ấm đun nước siêu tốc"
                    />
                </div>
                <div>
                    <Label>Model / Loại</Label>
                    <Input
                        value={data.model_type}
                        onChange={e => setData({ ...data, model_type: e.target.value })}
                        placeholder="Ví dụ: EK-2024 Series"
                    />
                </div>
                <div>
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Loại Chứng Nhận</Label>
                    <Select
                        value={data.certification_type}
                        onValueChange={v => setData({ ...data, certification_type: v })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="initial">Chứng nhận lần đầu</SelectItem>
                            <SelectItem value="surveillance">Giám sát</SelectItem>
                            <SelectItem value="recertification">Chứng nhận lại</SelectItem>
                            <SelectItem value="extension">Mở rộng phạm vi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Tên Nhà Sản Xuất</Label>
                    <Input
                        value={data.manufacturer_name}
                        onChange={e => setData({ ...data, manufacturer_name: e.target.value })}
                    />
                </div>
                <div>
                    <Label>Địa Điểm Nhà Máy</Label>
                    <Input
                        value={data.factory_location}
                        onChange={e => setData({ ...data, factory_location: e.target.value })}
                    />
                </div>
                <div className="col-span-2">
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Tiêu Chuẩn Áp Dụng</Label>
                    <Input
                        value={data.applied_standard}
                        onChange={e => setData({ ...data, applied_standard: e.target.value })}
                        placeholder="Ví dụ: IEC 60335-1:2020"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={onCancel}>Hủy</Button>
                <Button onClick={handleSubmit}>Tạo Đơn Đăng Ký</Button>
            </div>
        </div>
    )
}
