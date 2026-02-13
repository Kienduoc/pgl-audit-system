import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientAuditRequestForm } from '@/components/audit-creation/client-audit-request-form'
import { AllocationManager } from '@/components/admin/allocation-manager'
import {
    getAppsPendingReview,
    getAppsAccepted,
    getAppsInProgress,
    getAvailableAuditors
} from '@/lib/actions/audit-allocation'

export default async function NewAuditPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Role check — support both legacy `role` and new `active_role`
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, active_role')
        .eq('id', user.id)
        .single()

    const activeRole = profile?.active_role || profile?.role
    const isClient = activeRole === 'client'
    let clientOrgId = ''

    if (isClient) {
        const { data: org } = await supabase
            .from('client_organizations')
            .select('id')
            .eq('profile_id', user.id)
            .single()
        clientOrgId = org?.id
    }

    // For Admin/Lead Auditor: fetch applications by status category
    let pendingReview: any[] = []
    let accepted: any[] = []
    let inProgress: any[] = []
    let availableAuditors: any[] = []

    if (!isClient) {
        const [pr, acc, ip, aud] = await Promise.all([
            getAppsPendingReview(),
            getAppsAccepted(),
            getAppsInProgress(),
            getAvailableAuditors()
        ])
        pendingReview = pr
        accepted = acc
        inProgress = ip
        availableAuditors = aud
    }

    return (
        <div className="container max-w-5xl py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    {isClient ? 'Nộp Đơn Đăng Ký Đánh Giá' : 'Xem Xét & Phân Công'}
                </h1>
                <p className="text-muted-foreground">
                    {isClient
                        ? 'Nộp đơn đăng ký chứng nhận sản phẩm theo ISO/IEC 17065.'
                        : 'Xem xét hồ sơ đăng ký và phân công đoàn đánh giá.'
                    }
                </p>
            </div>

            {isClient ? (
                <ClientAuditRequestForm clientOrgId={clientOrgId} />
            ) : (
                <AllocationManager
                    pendingReview={pendingReview}
                    accepted={accepted}
                    inProgress={inProgress}
                    availableAuditors={availableAuditors}
                />
            )}
        </div>
    )
}
