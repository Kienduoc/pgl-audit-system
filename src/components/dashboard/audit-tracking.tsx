import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle } from "lucide-react"
import { format } from "date-fns"

interface Audit {
    id: string
    project_code: string
    standard: string
    status: string
    audit_date: string | null
}

export function AuditTracking({ audits }: { audits: Audit[] }) {
    if (!audits || audits.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-lg">Đánh Giá Đang Thực Hiện</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                        <CheckCircle className="h-8 w-8 mb-2 opacity-20" />
                        <p>Không có đánh giá nào đang thực hiện.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Helper to determine step index based on status
    const getStep = (status: string) => {
        switch (status.toLowerCase()) {
            case 'planned': return 1;
            case 'document_review': return 2;
            case 'on_site': return 3;
            case 'reporting': return 4;
            case 'completed': return 4;
            default: return 1;
        }
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-base text-muted-foreground uppercase tracking-wider">Đánh Giá Đang Thực Hiện</h3>
            </div>
            <div className="space-y-3 flex-1 overflow-auto">
                {audits.map((audit) => (
                    <div key={audit.id} className="border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <div className="font-medium text-base">{audit.project_code}</div>
                                <div className="text-sm text-muted-foreground">{audit.standard}</div>
                            </div>
                            <Badge variant="outline" className="text-xs h-6 px-2 capitalize bg-white">
                                {audit.status.replace('_', ' ')}
                            </Badge>
                        </div>

                        {/* Simple Progress Bar */}
                        <div className="space-y-1 mt-3">
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${(getStep(audit.status) / 4) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                                <span>Kế Hoạch</span>
                                <span>Hồ Sơ</span>
                                <span>Hiện Trường</span>
                                <span>Báo Cáo</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
