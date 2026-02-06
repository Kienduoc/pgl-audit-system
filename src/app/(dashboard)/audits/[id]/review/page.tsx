import { Suspense } from 'react'
import { getAuditDossierWithReviews } from '@/lib/actions/review'
import ReviewList from '@/components/audits/review-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, FileCheck } from 'lucide-react'

export default async function DocumentReviewPage({ params }: { params: { id: string } }) {
    const { audit, dossier, reviews } = await getAuditDossierWithReviews(params.id)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/audits/${params.id}`}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Đánh giá Hồ sơ (BM06)</h1>
                        <p className="text-muted-foreground">
                            Xem xét tài liệu từ khách hàng: <span className="font-semibold">{audit.client?.english_name}</span>
                        </p>
                    </div>
                </div>

                <Button variant="outline" asChild>
                    <Link href={`/audits/${params.id}/report/document-review`}>
                        <FileCheck className="mr-2 h-4 w-4" />
                        Xuất Báo cáo BM06
                    </Link>
                </Button>
            </div>

            <Suspense fallback={<div>Loading reviews...</div>}>
                <ReviewList
                    auditId={params.id}
                    dossier={dossier}
                    reviews={reviews}
                />
            </Suspense>
        </div>
    )
}
