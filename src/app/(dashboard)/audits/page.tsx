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
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
    const isClient = profile?.role === 'client'

    let query = supabase
        .from('audits')
        .select('*, client:profiles!client_id(company_name)')
        .order('audit_date', { ascending: false })

    if (isClient) {
        query = query.eq('client_id', user?.id)
    }

    const { data: audits, error } = await query

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Audits</h1>
                {!isClient && (
                    <Link href="/audits/new">
                        <Button size="sm" className="h-8 gap-1">
                            <Plus className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                New Audit
                            </span>
                        </Button>
                    </Link>
                )}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Audits</CardTitle>
                    <CardDescription>
                        Manage and track your ISO 17065 assessments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project Code</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead className="hidden sm:table-cell">Standard</TableHead>
                                <TableHead className="hidden md:table-cell">Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
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
                                            <Button size="sm" variant="ghost">View</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!audits?.length && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No audits found. Create one to get started.
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
