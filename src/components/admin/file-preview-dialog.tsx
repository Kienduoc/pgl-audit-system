'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, ExternalLink } from 'lucide-react'

interface FilePreviewDialogProps {
    file: {
        url: string
        name: string
        type: string
    }
    onClose: () => void
}

export function FilePreviewDialog({ file, onClose }: FilePreviewDialogProps) {
    const isPDF = file.type === 'pdf'
    const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(file.type)

    const openInNewTab = () => {
        window.open(file.url, '_blank', 'noopener,noreferrer')
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>{file.name}</DialogTitle>
                            <DialogDescription>Xem trước tài liệu</DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={openInNewTab}
                                className="gap-2"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Mở tab mới
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden bg-muted/20">
                    {isPDF && (
                        <iframe
                            src={file.url}
                            className="w-full h-full border-0"
                            title={file.name}
                        />
                    )}

                    {isImage && (
                        <div className="w-full h-full flex items-center justify-center p-4">
                            <img
                                src={file.url}
                                alt={file.name}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                    )}

                    {!isPDF && !isImage && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <p>Không thể xem trước file này.</p>
                            <Button
                                variant="link"
                                onClick={openInNewTab}
                                className="mt-2"
                            >
                                Mở trong tab mới
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
