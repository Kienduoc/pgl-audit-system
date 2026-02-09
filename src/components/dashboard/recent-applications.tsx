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

interface Application {
    id: string
    status: string
    created_at: string
    content: any
}

export function RecentApplications({ applications, title = "Recent Applications" }: { applications: Application[], title?: string }) {
    if (applications.length === 0) {
        return (
            <div className="text-center py-10 bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">No applications found.</p>
                <Link href="/audit-programs/create">
                    <Button variant="outline" className="mt-4">Start New Application</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-base text-muted-foreground uppercase tracking-wider">{title}</h3>
                <Link href="/audit-programs" className="text-sm text-blue-600 hover:underline">
                    View All
                </Link>
            </div>
            <div className="space-y-3 flex-1 overflow-auto">
                {applications.map((app) => (
                    <div key={app.id} className="border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-base line-clamp-1" title={app.content?.companyInfo?.nameEn}>
                                {app.content?.companyInfo?.nameEn || "Upcoming Audit Program"}
                            </div>
                            <Badge variant={app.status === 'submitted' ? 'default' : 'secondary'} className="text-xs h-6 px-2">
                                {app.status}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>{format(new Date(app.created_at), "MMM d, yyyy")}</span>
                            <Link href={`/audit-programs/${app.id}`}>
                                <Button size="sm" variant="ghost" className="h-8 text-sm px-3">View</Button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
