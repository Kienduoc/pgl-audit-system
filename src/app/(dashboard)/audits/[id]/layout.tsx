import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuditWorkflowStepper, AuditPhase } from '@/components/audit/audit-workflow-stepper'
import { AuditTabs } from '@/components/audit/audit-tabs'

// Helper to map DB status to Workflow Phase
const mapStatusToPhase = (status: string): AuditPhase => {
  switch (status) {
    case 'planned': return 'planning'
    case 'ongoing': return 'evaluation'
    case 'reviewing': return 'reporting'
    case 'certified': return 'certification'
    case 'completed': return 'reporting' // Fallback
    default: return 'application' // Default start
  }
}

export default async function AuditLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch current audit status
  const { data: audit, error } = await supabase
    .from('audits')
    .select('project_code, status')
    .eq('id', id)
    .single()

  if (error || !audit) {
    // Debug: Show error details
    return (
      <div className="p-8 border border-red-200 bg-red-50 rounded-lg text-red-800">
        <h2 className="text-xl font-bold mb-2">Audit Not Found (Debug Mode)</h2>
        <p><strong>Audit ID:</strong> {id}</p>
        <p><strong>Error Message:</strong> {error?.message || "No data returned (likely RLS or ID mismatch)"}</p>
        <p><strong>Error Details:</strong> {JSON.stringify(error, null, 2)}</p>
        <p><strong>Hint:</strong> Check if you are logged in and have RLS permissions.</p>
      </div>
    )
    // notFound()
  }

  const currentPhase = mapStatusToPhase(audit.status)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole = 'client'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role || 'client'
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Audit: {audit.project_code}</h1>
          <div className="text-sm text-muted-foreground capitalize">Status: {audit.status}</div>
        </div>

        {/* Workflow Stepper */}
        <AuditWorkflowStepper currentPhase={currentPhase} className="max-w-4xl mx-auto" />
      </div>

      {/* Tabs (Client Component) */}
      <AuditTabs auditId={id} role={userRole} />

      {children}
    </div>
  )
}
