'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertTriangle, RotateCcw, XCircle, CheckCircle } from 'lucide-react'

interface ReviewActionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    actionType: 'reject' | 'revision' | 'accept'
    applicationName: string
    onConfirm: (reason: string) => Promise<void>
    isLoading?: boolean
}

export function ReviewActionDialog({
    open,
    onOpenChange,
    actionType,
    applicationName,
    onConfirm,
    isLoading = false,
}: ReviewActionDialogProps) {
    const [reason, setReason] = useState('')
    const [auditCode, setAuditCode] = useState('')

    const isReject = actionType === 'reject'
    const isAccept = actionType === 'accept'

    const config = {
        reject: {
            title: 'Từ Chối Đơn Đăng Ký',
            description: `Từ chối đơn đăng ký của ${applicationName}. Client sẽ nhận được lý do từ chối.`,
            icon: <XCircle className="h-5 w-5 text-red-500" />,
            buttonText: 'Xác Nhận Từ Chối',
            buttonColor: 'bg-red-600 hover:bg-red-700 text-white',
            placeholder: 'Ghi rõ lý do từ chối...',
            inputLabel: 'Lý do'
        },
        revision: {
            title: 'Yêu Cầu Bổ Sung',
            description: `Yêu cầu ${applicationName} bổ sung/chỉnh sửa hồ sơ. Client sẽ nhận được thông báo cần bổ sung.`,
            icon: <RotateCcw className="h-5 w-5 text-amber-500" />,
            buttonText: 'Gửi Yêu Cầu Bổ Sung',
            buttonColor: 'bg-amber-600 hover:bg-amber-700 text-white',
            placeholder: 'Liệt kê chi tiết cần bổ sung...',
            inputLabel: 'Chi tiết yêu cầu'
        },
        accept: {
            title: 'Chấp Nhận & Tạo Đánh Giá',
            description: `Chấp nhận đơn của ${applicationName} và tạo chương trình đánh giá mới.`,
            icon: <CheckCircle className="h-5 w-5 text-green-500" />,
            buttonText: 'Tạo Chương Trình Đánh Giá',
            buttonColor: 'bg-green-600 hover:bg-green-700 text-white',
            placeholder: 'PGE-2026.XXX',
            inputLabel: 'Mã Dự Án (Audit Code)'
        }
    }

    const c = config[actionType]

    const handleConfirm = async () => {
        if (isAccept) {
            if (!auditCode.trim()) return
            await onConfirm(auditCode.trim())
        } else {
            if (!reason.trim()) return
            await onConfirm(reason.trim())
        }
        setReason('')
        setAuditCode('')
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        {c.icon}
                        <DialogTitle>{c.title}</DialogTitle>
                    </div>
                    <DialogDescription>{c.description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {isAccept ? (
                        <div className="space-y-2">
                            <Label htmlFor="auditCode" className="font-medium">
                                {c.inputLabel} <span className="text-red-500">*</span>
                            </Label>
                            <input
                                id="auditCode"
                                value={auditCode}
                                onChange={(e) => setAuditCode(e.target.value)}
                                placeholder={c.placeholder}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                autoFocus
                            />
                            <p className="text-xs text-muted-foreground">
                                Mã này sẽ được sử dụng để định danh toàn bộ hồ sơ đánh giá.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="reason" className="font-medium">
                                {c.inputLabel} <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder={c.placeholder}
                                rows={5}
                                className="resize-none"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Hủy
                    </Button>
                    <Button
                        className={c.buttonColor}
                        onClick={handleConfirm}
                        disabled={isLoading || (isAccept ? !auditCode.trim() : !reason.trim())}
                    >
                        {isLoading ? 'Đang xử lý...' : c.buttonText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
