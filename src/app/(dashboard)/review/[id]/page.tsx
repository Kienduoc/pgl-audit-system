import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getApplicationDetail, getReviewHistory } from '@/lib/actions/audit-allocation'
import { ApplicationReviewPage } from '@/components/admin/application-review-page'

export default async function ReviewDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Check role
    const { data: profile } = await supabase
        .from('profiles')
        .select('active_role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'lead_auditor'].includes(profile.active_role)) {
        redirect('/')
    }

    const application = await getApplicationDetail(id)
    if (!application) {
        redirect('/audits/new')
    }

    const reviewHistory = await getReviewHistory(id)

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <ApplicationReviewPage
                application={application}
                reviewHistory={reviewHistory}
            />
        </div>
    )
}
