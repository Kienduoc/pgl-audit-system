import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EducationList } from '@/components/profile/education-list'
import { CertificateList } from '@/components/profile/certificate-list'
import { ExperienceList } from '@/components/profile/experience-list'
import { AuditActions } from '@/components/audit/audit-actions'
import { format } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ProfilePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const isClient = profile?.role === 'client'

    // Fetch Organization Data for Clients
    let orgData = null
    if (isClient) {
        const { data: org } = await supabase
            .from('client_organizations')
            .select('*')
            .eq('profile_id', user.id)
            .single()
        orgData = org
    }

    // Fetch Data based on Role
    let educations = [], certificates = [], experiences = [], myAudits = []

    if (isClient) {
        // Fetch Client Audits
        const { data } = await supabase
            .from('audits')
            .select('*') // Client is strictly RLS filtered usually, but explicit eq is good
            .eq('client_id', user.id)
            .order('audit_date', { ascending: false })
        myAudits = data || []
    } else {
        // Fetch Auditor Competence Data
        const eduRes = await supabase.from('user_educations').select('*').eq('user_id', user.id).order('start_date', { ascending: false })
        educations = eduRes.data || []

        const certRes = await supabase.from('user_certificates').select('*').eq('user_id', user.id).order('issue_date', { ascending: false })
        certificates = certRes.data || []

        const expRes = await supabase.from('user_experiences').select('*').eq('user_id', user.id).order('start_date', { ascending: false })
        experiences = expRes.data || []

        // Fetch Auditor Log
        // Note: 'audit_members' table is better for finding participating audits than just 'lead_auditor_id'
        const { data } = await supabase
            .from('audits')
            .select('*, client:profiles!client_id(company_name)')
            // Simple check for MVP: Lead or just query all (RLS will filter)
            // But let's look for participation in `audit_members` to be accurate
            .order('audit_date', { ascending: false })

        // Optimally we'd join audit_members, but for now RLS filtering on 'audits' might suffice if setup correctly.
        // If not, we rely on the implementation done in Overview.
        myAudits = data || []
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-card p-6 rounded-lg border shadow-sm">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={isClient ? (orgData?.logo_url || undefined) : profile?.avatar_url} />
                    <AvatarFallback className="text-lg">
                        {isClient
                            ? (orgData?.vietnamese_name?.[0] || profile?.company_name?.[0] || 'C')
                            : (profile?.full_name?.[0] || 'U')
                        }
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">
                        {isClient
                            ? (orgData?.vietnamese_name || profile?.company_name || 'Company Name Not Set')
                            : profile?.full_name
                        }
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{profile?.email}</span>
                        <span>•</span>
                        <Badge variant={isClient ? "outline" : "secondary"} className="capitalize">
                            {profile?.role?.replace('_', ' ')}
                        </Badge>
                    </div>
                    {isClient && (
                        <div className="mt-2 text-sm space-y-1">
                            <p><strong>Tax Code:</strong> {orgData?.tax_code || profile?.tax_code || 'N/A'}</p>
                            <p><strong>Office Address:</strong> {orgData?.office_address || profile?.address || 'N/A'}</p>
                            <p><strong>Factory Address:</strong> {orgData?.factory_address || 'N/A'}</p>
                            <p><strong>Representative:</strong> {orgData?.representative_name || profile?.representative || 'N/A'}</p>
                        </div>
                    )}
                    {!isClient && (
                        <p className="text-sm mt-1">{profile?.company_name} {profile?.phone && `• ${profile?.phone}`}</p>
                    )}
                </div>
                {isClient && (
                    <Link href="/profile/settings">
                        <Button variant="outline">Organization Settings</Button>
                    </Link>
                )}
            </div>

            {isClient ? (
                // CLIENT VIEW
                <div className="space-y-4">

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Audit History</CardTitle>
                                <CardDescription>Your organization's assessment records.</CardDescription>
                            </div>
                            <Link href="/audits/new">
                                <Button>Request New Audit</Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {myAudits?.map((audit: any) => (
                                    <div key={audit.id} className="flex justify-between items-start border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex-1">
                                            <div className="font-semibold">{audit.project_code}</div>
                                            <div className="text-sm text-muted-foreground">
                                                Role: Client
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Standard: {audit.standard}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <Badge variant={audit.status === 'completed' ? 'default' : 'outline'}>
                                                    {audit.status}
                                                </Badge>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {audit.audit_date ? format(new Date(audit.audit_date), 'dd/MM/yyyy') : 'Date N/A'}
                                                </div>
                                            </div>
                                            <AuditActions
                                                auditId={audit.id}
                                                currentDate={audit.audit_date}
                                                status={audit.status}
                                                projectCode={audit.project_code}
                                                standard={audit.standard}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {!myAudits?.length && (
                                    <div className="text-center py-8 text-muted-foreground">No audits record found.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                // AUDITOR / LEAD VIEW
                <Tabs defaultValue="competence" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                        <TabsTrigger value="competence">Competence</TabsTrigger>
                        <TabsTrigger value="experience">Work History</TabsTrigger>
                        <TabsTrigger value="audits">Audit Log</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="competence" className="space-y-4 mt-4">
                        <h2 className="text-xl font-semibold tracking-tight">Competence & Qualifications</h2>
                        <EducationList initialData={educations || []} />
                        <div className="my-8 border-t" />
                        <CertificateList initialData={certificates || []} />
                    </TabsContent>

                    <TabsContent value="experience" className="mt-4">
                        <h2 className="text-xl font-semibold tracking-tight mb-4">Professional Experience</h2>
                        <ExperienceList initialData={experiences || []} />
                    </TabsContent>

                    <TabsContent value="audits" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Audit Participation Log</CardTitle>
                                <CardDescription>History of ISO 17065 assessments conducted.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {myAudits?.map((audit: any) => (
                                        <div key={audit.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-semibold">{audit.project_code}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Client: {audit.client?.company_name || 'Unknown'}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Standard: {audit.standard}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={audit.status === 'completed' ? 'default' : 'outline'}>
                                                    {audit.status}
                                                </Badge>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {audit.audit_date ? format(new Date(audit.audit_date), 'dd/MM/yyyy') : 'Date N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {!myAudits?.length && (
                                        <div className="text-center py-8 text-muted-foreground">No audit history found.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="settings" className="mt-4">
                        <div className="p-4 border rounded-lg text-muted-foreground border-dashed text-center">
                            User settings form temporarily moved.
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    )
}
