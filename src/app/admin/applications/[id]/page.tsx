import { Suspense } from "react"
import { getApplicationDetails } from "@/lib/actions/admin-review"
import { notFound } from "next/navigation"
import { FormatViewer } from "@/components/admin/format-viewer"
import { ReviewPanel } from "@/components/admin/review-panel"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PageProps {
    params: { id: string }
}

async function ReviewContent({ id }: { id: string }) {
    const { data: application, error } = await getApplicationDetails(id)

    if (error || !application) {
        if (error === "Unauthorized") return <div>Unauthorized</div>
        return notFound()
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="mb-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/admin/applications">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">{application.profiles?.company_name}</h1>
                        <p className="text-sm text-muted-foreground">
                            {application.project_code} • {application.content?.productInfo?.name}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* Left: Form Content (Scrollable) */}
                <div className="col-span-8 bg-card border rounded-lg overflow-y-auto p-6 shadow-sm">
                    <FormatViewer content={application.content} />
                </div>

                {/* Right: Review Actions (Sticky/Fixed) */}
                <div className="col-span-4 flex flex-col gap-4 h-full overflow-hidden">
                    <ReviewPanel application={application} />
                </div>
            </div>
        </div>
    )
}

export default function ReviewPage({ params }: PageProps) {
    return (
        <Suspense fallback={<div>Loading application...</div>}>
            <ReviewContent id={params.id} />
        </Suspense>
    )
}
