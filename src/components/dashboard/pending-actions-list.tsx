import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"

export function PendingActionsList({ actions }: { actions: any[] }) {
    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-base text-muted-foreground uppercase tracking-wider">Hành Động Cần Thiết</h3>
            </div>
            <div className="space-y-3 flex-1 overflow-auto">
                {actions.map((action) => (
                    <div key={action.id} className="border rounded-lg p-3 bg-orange-50/40 border-orange-100 hover:bg-orange-50/80 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-orange-600" />
                                <span className="font-medium text-base text-orange-900">Hồ Sơ Nháp</span>
                            </div>
                            <Badge variant="outline" className="text-xs h-6 px-2 bg-white text-orange-700 border-orange-200">{action.status}</Badge>
                        </div>

                        <p className="text-sm text-orange-800/70 mb-3 ml-6 line-clamp-2">
                            Tạo ngày: {format(new Date(action.created_at), 'dd/MM/yyyy')}
                        </p>

                        <div className="flex justify-end">
                            <Link href={action.status === 'draft' ? `/audit-programs/${action.id}/updated` : `/audit-programs/${action.id}`} className="w-full">
                                <Button size="sm" className="w-full h-9 text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 shadow-none">
                                    Tiếp Tục <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                ))}
                {actions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                        <CheckCircle className="h-8 w-8 mb-2 text-green-500/50" />
                        <p className="text-xs">Bạn đã hoàn thành tất cả!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
