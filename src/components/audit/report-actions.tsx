'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export function ReportActions({ auditId }: { auditId: string }) {
    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="flex gap-2">
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> In / Lưu dưới dạng PDF
            </Button>
        </div>
    )
}
