import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function AuditsPage() {
    const supabase = await createClient()

    // Fetch audits based on Role
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('active_role, role').eq('id', user?.id).single()
    const activeRole = profile?.active_role || profile?.role || 'client'
    const isClient = activeRole === 'client'
    const isAdmin = activeRole === 'admin'
    const isAuditorOrLead = activeRole === 'auditor' || activeRole === 'lead_auditor'

    if (!user) return null; // Should be handled by layout but safe check

    let query;

    if (isClient) {
        query = supabase
            .from('audits')
            .select('*, client:profiles!client_id(company_name)')
            .eq('client_id', user.id)
            .order('audit_date', { ascending: false })
    } else if (isAuditorOrLead) {
        query = supabase
            .from('audits')
            .select('*, client:profiles!client_id(company_name), audit_members!inner(user_id)')
            .eq('audit_members.user_id', user.id)
            .order('audit_date', { ascending: false })
    } else {
        // Admin sees all
        query = supabase
            .from('audits')
            .select('*, client:profiles!client_id(company_name)')
            .order('audit_date', { ascending: false })
    }

    const { data: audits, error } = await query

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Đánh Giá</h1>
                {isAdmin && (
                    <Link href="/audits/new">
                        <Button size="sm" className="h-8 gap-1">
                            <Plus className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Đánh Giá Mới
                            </span>
                        </Button>
                    </Link>
                )}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Đánh Giá Gần Đây</CardTitle>
                    <CardDescription>
                        Quản lý và theo dõi các đánh giá ISO 17065 của bạn.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mã Dự Án</TableHead>
                                <TableHead>Khách Hàng</TableHead>
                                <TableHead className="hidden sm:table-cell">Tiêu Chuẩn</TableHead>
                                <TableHead className="hidden md:table-cell">Ngày</TableHead>
                                <TableHead>Trạng Thái</TableHead>
                                <TableHead>
                                    <span className="sr-only">Hành Động</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {audits?.map((audit) => (
                                <TableRow key={audit.id}>
                                    <TableCell className="font-medium">
                                        {audit.project_code}
                                    </TableCell>
                                    <TableCell>
                                        {/* @ts-ignore - joined data often has typing issues in simple fetch */}
                                        {audit.client?.company_name || 'Unknown'}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        {audit.standard}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {audit.audit_date}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{audit.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/audits/${audit.id}/checklist`}>
                                            <Button size="sm" variant="ghost">Xem</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!audits?.length && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Không tìm thấy đánh giá nào. Tạo mới để bắt đầu.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}
