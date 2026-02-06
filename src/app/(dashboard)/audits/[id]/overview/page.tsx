import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { Calendar, Users, ClipboardCheck, FileCheck, ArrowRight, CheckCircle2 } from 'lucide-react'
import { updateAuditStatus } from '@/lib/actions/audit-lifecycle'
import { redirect } from 'next/navigation'
import { AuditDocuments } from '@/components/audit/audit-documents'

export default async function AuditOverviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch Audit Details with Team and Client
    const { data: audit, error } = await supabase
        .from('audits')
        .select(`
        *,
        client:profiles!client_id(full_name, email),
        team:audit_members(
            user_id,
            role,
            user:profiles(full_name, email)
        )
    `)
        .eq('id', id)
        .single()

    if (error || !audit) {
        return <div>Audit not found</div>
    }

    // Fetch Documents
    const { data: documents } = await supabase
        .from('audit_documents')
        .select('*')
        .eq('audit_id', id)
        .order('created_at', { ascending: false })

    // Determine Current User Role Context
    let userRole = 'viewer'
    if (user) {
        // Check Admin/Lead role from Profile or Audit field?
        // Simple check based on audit relation
        if (audit.lead_auditor_id === user.id) {
            userRole = 'lead_auditor'
        } else if (audit.client_id === user.id) {
            userRole = 'client'
        } else if (audit.team?.some((m: any) => m.user_id === user.id)) {
            userRole = 'auditor'
        } else {
            // Fallback: check profile role for Admin override
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
            if (profile?.role === 'admin' || profile?.role === 'lead_auditor') userRole = 'lead_auditor'
        }
    }

    // Lifecycle Logic
    const phases = [
        { id: 'planned', label: 'Plan', next: 'ongoing', actionLabel: 'Start Evaluation', icon: Calendar },
        { id: 'ongoing', label: 'Evaluation', next: 'reviewing', actionLabel: 'Finish Evaluation', icon: ClipboardCheck },
        { id: 'reviewing', label: 'Reporting', next: 'certified', actionLabel: 'Finalize & Certify', icon: FileCheck },
        { id: 'certified', label: 'Certified', next: null, actionLabel: 'Audit Completed', icon: CheckCircle2 },
        { id: 'completed', label: 'Completed', next: null, actionLabel: 'Archived', icon: CheckCircle2 },
    ]

    const currentPhaseIdx = phases.findIndex(p => p.id === audit.status)
    const currentPhase = phases[currentPhaseIdx] || phases[0]
    const nextPhase = phases[currentPhaseIdx + 1]

    async function advancePhase() {
        'use server'
        if (nextPhase) {
            await updateAuditStatus(id, nextPhase.id)
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Audit Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Audit Details</CardTitle>
                        <CardDescription>General information and scope</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-muted-foreground">Project Code:</span>
                            <span className="font-medium">{audit.project_code}</span>

                            <span className="text-muted-foreground">Standard:</span>
                            <span className="font-medium">{audit.standard}</span>

                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium">{audit.audit_date ? format(new Date(audit.audit_date), 'dd/MM/yyyy') : 'N/A'}</span>

                            <span className="text-muted-foreground">Client:</span>
                            <span className="font-medium">{audit.client?.full_name}</span>
                        </div>
                        <Separator />
                        <div>
                            <span className="text-sm text-muted-foreground block mb-1">Scope:</span>
                            <p className="text-sm">{audit.scope || 'No scope defined.'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Lifecycle Manager Card */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>Audit Lifecycle</CardTitle>
                        <CardDescription>Current Status: <Badge variant="outline" className="capitalize ml-1">{audit.status}</Badge></CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-4 space-y-4">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                {(() => {
                                    const Icon = currentPhase.icon
                                    return <Icon className="h-8 w-8" />
                                })()}
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-lg">{currentPhase.label} Phase</h3>
                                <p className="text-sm text-muted-foreground">
                                    {audit.status === 'planned' && "Setup team and schedule. Ready to start?"}
                                    {audit.status === 'ongoing' && "Auditors are conducting evaluation."}
                                    {audit.status === 'reviewing' && "Reviewing findings and preparing report."}
                                    {audit.status === 'certified' && "Audit completed and certified."}
                                </p>
                            </div>

                            {nextPhase && (
                                <form action={advancePhase} className="w-full">
                                    <Button className="w-full" size="lg">
                                        {currentPhase.actionLabel} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </form>
                            )}
                            {!nextPhase && (
                                <Button disabled variant="outline" className="w-full text-green-600 border-green-200 bg-green-50">
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Process Completed
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Audit Team Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Audit Team</CardTitle>
                        <CardDescription>Assigned auditors for this project</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                        <Users className="mr-2 h-4 w-4" /> Manage Team
                    </Button>
                </CardHeader>
                <CardContent>
                    {audit.team && audit.team.length > 0 ? (
                        <div className="space-y-4">
                            {audit.team.map((member: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                            {member.user?.full_name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{member.user?.full_name}</p>
                                            <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="capitalize">{member.role}</Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-muted-foreground">No team members assigned yet.</div>
                    )}
                </CardContent>
            </Card>

            {/* Documents Section */}
            <div className='md:col-span-2'>
                <AuditDocuments
                    auditId={id}
                    documents={documents || []}
                    auditors={audit.team || []}
                    currentUserRole={userRole}
                />
            </div>
        </div>
    )
}
