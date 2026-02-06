import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { redirect } from "next/navigation"

interface RecentActivityProps {
    recentAudits: any[]
}

export function RecentActivity({ recentAudits }: RecentActivityProps) {
    return (
        <Card className="col-span-4 lg:col-span-2">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                    Newest programs created or updated.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {recentAudits.slice(0, 5).map((audit) => (
                        <div key={audit.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {audit.project_code.substring(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{audit.project_code}</p>
                                <p className="text-sm text-muted-foreground">
                                    {audit.client?.company_name || 'Unknown Client'}
                                </p>
                            </div>
                            <div className="ml-auto font-medium text-xs text-muted-foreground">
                                {new Date(audit.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                    {recentAudits.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
