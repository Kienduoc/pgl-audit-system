import { Suspense } from 'react'
import { getAuditChecklist } from '@/lib/actions/checklist'
import AuditChecklistManager from '@/components/audits/checklist-manager'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AuditChecklistPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { templates, responses } = await getAuditChecklist(id)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/audits/${id}`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ghi chép Đánh giá (BM08)</h1>
                    <p className="text-muted-foreground">
                        Checklist hiện trường & Ghi nhận phát hiện
                    </p>
                </div>
            </div>

            <Suspense fallback={<div>Loading checklist...</div>}>
                <AuditChecklistManager
                    auditId={id}
                    templates={templates}
                    initialResponses={responses}
                />
            </Suspense>
        </div>
    )
}
