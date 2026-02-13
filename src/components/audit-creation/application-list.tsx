'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, ArrowRight, FileIcon } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface ApplicationListProps {
    applications: any[]
    onSelect: (app: any) => void
    onCreateNew: () => void
}

export function ApplicationList({ applications, onSelect, onCreateNew }: ApplicationListProps) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Đơn Đăng Ký Hiện Có</h3>
                <Button variant="secondary" size="sm" onClick={onCreateNew}>
                    + Tạo Đơn Mới
                </Button>
            </div>

            {applications.length === 0 ? (
                <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground">
                    <p>Không tìm thấy đơn đăng ký nào cho khách hàng này.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {applications.map(app => (
                        <Card key={app.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onSelect(app)}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">{app.product_name}</h4>
                                        <div className="text-xs text-muted-foreground flex gap-2">
                                            <span>{app.model_type}</span>
                                            <span>•</span>
                                            <span>{app.applied_standard}</span>
                                            <span>•</span>
                                            <span>{format(new Date(app.created_at), 'dd/MM/yyyy')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Link href={`/profile/applications/${app.id}/dossier`}>
                                        <Button variant="outline" size="sm" className="h-8">
                                            <FileIcon className="h-3 w-3 mr-2" /> Hồ Sơ
                                        </Button>
                                    </Link>
                                    <Badge variant="outline">{app.certification_type}</Badge>
                                    <Badge className={app.status === 'submitted' ? 'bg-blue-500' : 'bg-gray-500'}>
                                        {app.status}
                                    </Badge>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
