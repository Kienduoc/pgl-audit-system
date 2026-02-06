import { Suspense } from 'react'
import { ClientDossierChecklist } from '@/components/dossier/client-dossier-checklist'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function DossierManagementPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Assuming id is applicationId. We need auditId for the component.
    // Let's try to find an audit linked to this application.
    const { data: audit } = await supabase
        .from('audits')
        .select('id')
        .eq('application_id', id)
        .maybeSingle()

    // If no audit (e.g. just application phase), we can pass empty string or handle it.
    // The actions use auditId mainly for path revalidation (which we override with pathname) or unused.
    // Ideally we should have an audit if we are in "Dossier Submission" phase which is typically post-contract.
    const auditId = audit?.id || ''

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/profile/applications">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Hồ sơ Đăng ký (Dossier)</h1>
                    <p className="text-muted-foreground">
                        Nộp tài liệu theo yêu cầu (BM01b)
                    </p>
                </div>
            </div>

            <Suspense fallback={<div>Loading checklist...</div>}>
                <ClientDossierChecklist
                    applicationId={id}
                    auditId={auditId}
                />
            </Suspense>
        </div>
    )
}
