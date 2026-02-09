"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { Eye, ArrowRight } from "lucide-react"

interface AdminRecentAppsProps {
    applications: any[]
}

export function AdminRecentApplications({ applications }: AdminRecentAppsProps) {
    if (!applications || applications.length === 0) {
        return (
            <div className="flex h-[300px] flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-md">
                <p>No recent applications found.</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border h-full overflow-hidden flex flex-col">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applications.map((app) => (
                        <TableRow key={app.id}>
                            <TableCell className="font-medium">
                                {app.profiles?.company_name || app.content?.companyInfo?.nameVi || "N/A"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {app.content?.productInfo?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={app.status === 'submitted' ? 'default' : 'secondary'}
                                    className="capitalize"
                                >
                                    {app.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(app.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                                <Link href={`/admin/applications/${app.id}`}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">View</span>
                                    </Button>
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="p-4 mt-auto border-t bg-muted/20">
                <Link href="/admin/applications" className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                        View All Applications <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
