import { createClient } from '@/lib/supabase/server'
import { ClientDossierChecklist } from '@/components/dossier/client-dossier-checklist'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AuditDossierPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch audit to get application_id
    const { data: audit } = await supabase
        .from('audits')
        .select('*, application:audit_applications(*)')
        .eq('id', id)
        .single()

    if (!audit) {
        return <div>Không tìm thấy đánh giá</div>
    }

    const { data: { user } } = await supabase.auth.getUser()
    // const isClient = user?.id === audit.client_id // Can use role check too

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Hồ sơ Đánh giá (Initial Dossier)</CardTitle>
                    <CardDescription>
                        Vui lòng tải lên các tài liệu cần thiết trước khi đoàn đánh giá đến làm việc.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ClientDossierChecklist
                        applicationId={audit.application_id}
                        auditId={audit.id}
                        isReadOnly={false} // TODO: Logic to lock if status is advanced
                    />
                </CardContent>
            </Card>
        </div>
    )
}
