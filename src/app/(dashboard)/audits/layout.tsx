import { authorize } from '@/lib/auth'

export default async function AuditsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Only allow 'auditor', 'lead_auditor', or 'admin' roles to access /audits
    await authorize(['auditor', 'lead_auditor', 'admin', 'client'])

    return (
        <div className="w-full">
            {children}
        </div>
    )
}
