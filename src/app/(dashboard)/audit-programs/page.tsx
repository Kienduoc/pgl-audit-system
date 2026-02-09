import Link from "next/link"
import { Suspense } from "react"
import { Plus, FileText, Calendar, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { listApplications } from "@/lib/actions/audit-application"

function StatusBadge({ status }: { status: string }) {
    const variant =
        status === 'approved' ? 'default' :
            status === 'submitted' ? 'secondary' :
                status === 'draft' ? 'outline' : 'destructive'

    return <Badge variant={variant} className="capitalize">{status}</Badge>
}

async function ApplicationList() {
    const applications = await listApplications()

    if (applications.length === 0) {
        return (
            <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No applications found</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        You haven't submitted any audit program applications yet.
                    </p>
                    <Button asChild>
                        <Link href="/audit-programs/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Application
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted On</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applications.map((app: any) => (
                        <TableRow key={app.id}>
                            <TableCell className="font-medium">
                                {app.content?.companyInfo?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                                {app.content?.products?.length || 0} Products
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={app.status} />
                            </TableCell>
                            <TableCell>
                                {new Date(app.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/audit-programs/${app.id}`}>View</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    )
}

export default function AuditProgramsPage() {
    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Audit Programs</h2>
                    <p className="text-muted-foreground">
                        Manage your product certification applications and audit scopes.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button asChild>
                        <Link href="/audit-programs/create">
                            <Plus className="mr-2 h-4 w-4" />
                            New Application
                        </Link>
                    </Button>
                </div>
            </div>
            <Separator />

            <Suspense fallback={<div>Loading applications...</div>}>
                <ApplicationList />
            </Suspense>
        </div>
    )
}
