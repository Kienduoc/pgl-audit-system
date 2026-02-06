import AuditFindingsManager from '@/components/audit/findings-manager'
import { getAuditFindings } from '@/lib/actions/findings'
import { authorize } from '@/lib/auth'

export default async function AuditFindingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { role: userRole } = await authorize(['client', 'auditor', 'lead_auditor', 'admin'])

  // Fetch findings data
  const findings = await getAuditFindings(id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Findings</h1>
        <p className="text-muted-foreground">
          Record findings using the checklist below. Review summary in the table.
        </p>
      </div>

      {/* Checklist Section - The "Input Mode" */}


      {/* Findings Table Section - The "4-Column Structure" */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-slate-800">2. Findings Summary (NCs)</h2>
        <AuditFindingsManager
          initialFindings={findings || []}
          userRole={userRole}
        />
      </div>
    </div>
  )
}
