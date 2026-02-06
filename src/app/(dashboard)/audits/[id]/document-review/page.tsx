import { Suspense } from 'react'
import { getAuditDossierWithReviews } from '@/lib/actions/review'
import AuditDocumentReviewBoard from '@/components/audit/document-review-board'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AuditDocumentReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { audit, dossier, reviews } = await getAuditDossierWithReviews(id)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/audits/${id}`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Thẩm xét Hồ sơ (BM06)</h1>
                    <p className="text-muted-foreground">
                        Đánh giá sự phù hợp của tài liệu đăng ký
                    </p>
                </div>
            </div>

            <Suspense fallback={<div>Loading review board...</div>}>
                <AuditDocumentReviewBoard
                    auditId={id}
                    dossier={dossier}
                    reviews={reviews}
                />
            </Suspense>
        </div>
    )
}
