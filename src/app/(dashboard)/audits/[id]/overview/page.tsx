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
        client:profiles!client_id(full_name, email, company_name),
        team:audit_members(
            user_id,
            role,
            user:profiles(full_name, email)
        )
    `)
        .eq('id', id)
        .single()

    if (error || !audit) {
        console.error("Audit fetch error:", error)
        return <div>Không tìm thấy đánh giá hoặc không có quyền truy cập.</div>
    }

    // Fetch Documents
    const { data: documents } = await supabase
        .from('audit_documents')
        .select('*')
        .eq('audit_id', id)
        .order('created_at', { ascending: false })

    // Determine Current User Role Context
    // Determine Current User Role Context
    let userRole = 'viewer'
    if (user) {
        // Fetch User Profile Active Role
        const { data: profile } = await supabase.from('profiles').select('active_role, role').eq('id', user.id).single()
        const activeRole = profile?.active_role || profile?.role || 'client'

        if (activeRole === 'admin') {
            userRole = 'admin'
        } else if (activeRole === 'lead_auditor' || audit.lead_auditor_id === user.id) {
            userRole = 'lead_auditor' // Admins also act as leads if needed, but explicit role is better
        } else if (activeRole === 'client' || audit.client_id === user.id) {
            userRole = 'client'
        } else if (activeRole === 'auditor' || audit.team?.some((m: any) => m.user_id === user.id)) {
            userRole = 'auditor'
        }
    }

    // Lifecycle Logic
    const phases = [
        { id: 'planned', label: 'Lập Kế Hoạch', next: 'ongoing', actionLabel: 'Bắt Đầu Đánh Giá', icon: Calendar },
        { id: 'ongoing', label: 'Đánh Giá', next: 'reviewing', actionLabel: 'Hoàn Thành Đánh Giá', icon: ClipboardCheck },
        { id: 'reviewing', label: 'Báo Cáo', next: 'certified', actionLabel: 'Hoàn Tất & Chứng Nhận', icon: FileCheck },
        { id: 'certified', label: 'Chứng Nhận', next: null, actionLabel: 'Đánh Giá Hoàn Tất', icon: CheckCircle2 },
        { id: 'completed', label: 'Hoàn Thành', next: null, actionLabel: 'Đã Lưu Trữ', icon: CheckCircle2 },
    ]

    const currentPhaseIdx = phases.findIndex(p => p.id === audit.status)
    const currentPhase = phases[currentPhaseIdx] || phases[0]
    const nextPhase = phases[currentPhaseIdx + 1]


    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Audit Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Chi Tiết Đánh Giá</CardTitle>
                        <CardDescription>Thông tin chung và phạm vi</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-muted-foreground">Mã Dự Án:</span>
                            <span className="font-medium">{audit.project_code}</span>

                            <span className="text-muted-foreground">Tiêu Chuẩn:</span>
                            <span className="font-medium">{audit.standard}</span>

                            <span className="text-muted-foreground">Ngày:</span>
                            <span className="font-medium">{audit.audit_date ? format(new Date(audit.audit_date), 'dd/MM/yyyy') : 'N/A'}</span>

                            <span className="text-muted-foreground">Khách Hàng:</span>
                            <span className="font-medium">{audit.client?.full_name}</span>
                        </div>
                        <Separator />
                        <div>
                            <span className="text-sm text-muted-foreground block mb-1">Phạm Vi:</span>
                            <p className="text-sm">{audit.scope || 'Chưa xác định phạm vi.'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Lifecycle Manager Card */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>Vòng Đời Đánh Giá</CardTitle>
                        <CardDescription>Trạng Thái Hiện Tại: <Badge variant="outline" className="capitalize ml-1">{audit.status}</Badge></CardDescription>
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
                                <h3 className="font-bold text-lg">Giai Đoạn {currentPhase.label}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {audit.status === 'planned' && "Thiết lập đội ngũ và lịch trình. Sẵn sàng bắt đầu?"}
                                    {audit.status === 'ongoing' && "Chuyên gia đang tiến hành đánh giá."}
                                    {audit.status === 'reviewing' && "Xem xét các phát hiện và chuẩn bị báo cáo."}
                                    {audit.status === 'certified' && "Đánh giá đã hoàn tất và được chứng nhận."}
                                </p>
                            </div>

                            {nextPhase && (
                                <form action={async () => {
                                    'use server'
                                    await updateAuditStatus(id, nextPhase.id)
                                }} className="w-full">
                                    <Button className="w-full" size="lg">
                                        {currentPhase.actionLabel} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </form>
                            )}
                            {!nextPhase && (
                                <Button disabled variant="outline" className="w-full text-green-600 border-green-200 bg-green-50">
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Quy Trình Hoàn Tất
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
                        <CardTitle>Đoàn Đánh Giá</CardTitle>
                        <CardDescription>Các chuyên gia được phân công cho dự án này</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                        <Users className="mr-2 h-4 w-4" /> Quản Lý Đội Ngũ
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

                                    <Badge variant="secondary" className="capitalize">
                                        {member.role === 'Lead Auditor' ? 'Trưởng Đoàn' :
                                            member.role === 'Auditor' ? 'Đánh Giá Viên' :
                                                member.role === 'Technical Expert' ? 'Chuyên Gia KT' : member.role}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-muted-foreground">Chưa có thành viên nào được phân công.</div>
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
        </div >
    )
}
