'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, AlertTriangle, CheckCircle, Calendar } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

interface Certificate {
    id: string
    project_code: string
    standard: string
    certificate_number: string
    issue_date: string | null
    expiry_date: string | null
    certification_scope: string
    application: {
        product_name: string
        model_type: string
    }
}

export function ClientCertificateList({ certificates }: { certificates: Certificate[] }) {
    if (certificates.length === 0) {
        return (
            <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                <div className="flex justify-center mb-3">
                    <CheckCircle className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="font-medium text-muted-foreground">Chưa Có Chứng Chỉ Nào</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Sau khi đánh giá được chứng nhận thành công, chứng chỉ sẽ xuất hiện tại đây.
                </p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => {
                const isExpiringSoon = cert.expiry_date
                    ? differenceInDays(new Date(cert.expiry_date), new Date()) < 60
                    : false;

                const isExpired = cert.expiry_date
                    ? differenceInDays(new Date(cert.expiry_date), new Date()) < 0
                    : false;

                return (
                    <Card key={cert.id} className="relative overflow-hidden border-l-4 border-l-green-500">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge variant="outline" className="mb-2 bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                                        {cert.standard}
                                    </Badge>
                                    <CardTitle className="text-lg font-bold">{cert.certificate_number || 'Số Đang Chờ'}</CardTitle>
                                </div>
                                {isExpiringSoon && !isExpired && (
                                    <div className="absolute top-0 right-0 p-2 bg-yellow-100 text-yellow-700 rounded-bl-lg" title="Sắp Hết Hạn">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                )}
                                {isExpired && (
                                    <div className="absolute top-0 right-0 p-2 bg-red-100 text-red-700 rounded-bl-lg" title="Đã Hết Hạn">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Sản Phẩm:</span>
                                    <div className="font-medium">{cert.application?.product_name} ({cert.application?.model_type})</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Phạm Vi:</span>
                                    <div className="line-clamp-2 text-xs mt-0.5 bg-muted p-2 rounded">
                                        {cert.certification_scope || 'N/A'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
                                    <div>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Ngày Cấp
                                        </span>
                                        <div className="font-medium">
                                            {cert.issue_date ? format(new Date(cert.issue_date), 'dd/MM/yyyy') : 'N/A'}
                                        </div>
                                    </div>
                                    <div className={`text-right ${isExpiringSoon ? 'text-yellow-600 font-bold' : ''} ${isExpired ? 'text-red-600 font-bold' : ''}`}>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                            <Calendar className="h-3 w-3" /> Ngày Hết Hạn
                                        </span>
                                        <div className="font-medium">
                                            {cert.expiry_date ? format(new Date(cert.expiry_date), 'dd/MM/yyyy') : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                <Button className="w-full mt-2" variant="outline">
                                    <Download className="mr-2 h-4 w-4" /> Tải PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
