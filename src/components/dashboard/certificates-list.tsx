import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Calendar } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"

export function CertificatesList({ certificates }: { certificates: any[] }) {
    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-base text-muted-foreground uppercase tracking-wider">Sản Phẩm Đã Chứng Nhận</h3>
            </div>
            <div className="space-y-3 flex-1 overflow-auto">
                {certificates.map((cert) => (
                    <div key={cert.id} className="border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                                <Award className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-base truncate" title={cert.project_code}>{cert.project_code}</p>
                                <p className="text-sm text-muted-foreground truncate">{cert.standard}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="sr-only">Xem</span>
                        </Button>
                    </div>
                ))}
                {certificates.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-xs">Không tìm thấy sản phẩm nào được chứng nhận.</div>
                )}
            </div>
        </div>
    )
}
