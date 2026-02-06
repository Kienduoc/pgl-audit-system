import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuditCreationWizard } from '@/components/audit-creation/audit-creation-wizard'
import { ClientAuditRequestForm } from '@/components/audit-creation/client-audit-request-form'

export default async function NewAuditPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Role check to ensure only Admin/Auditor can access
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isClient = profile?.role === 'client'
    let clientOrgId = ''

    if (isClient) {
        const { data: org } = await supabase.from('client_organizations').select('id').eq('profile_id', user.id).single()
        clientOrgId = org?.id
    }

    return (
        <div className="container max-w-4xl py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Create Audit Program</h1>
                <p className="text-muted-foreground">
                    {isClient
                        ? 'Submit a request for a new audit scope or application.'
                        : 'Initialize a new certification audit by selecting a client and application context.'
                    }
                </p>
            </div>

            {isClient ? (
                <ClientAuditRequestForm clientOrgId={clientOrgId} />
            ) : (
                <AuditCreationWizard />
            )}
        </div>
    )
}
