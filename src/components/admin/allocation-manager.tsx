'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import {
    FileSearch, Users, Activity,
    Eye, Package, Clock, Building
} from 'lucide-react'
import { AuditAllocationDialog } from '@/components/admin/audit-allocation-dialog'
import Link from 'next/link'

interface AllocationManagerProps {
    pendingReview: any[]
    accepted: any[]
    inProgress: any[]
    availableAuditors: any[]
}

export function AllocationManager({ pendingReview, accepted, inProgress, availableAuditors }: AllocationManagerProps) {
    const getProductCount = (app: any) => {
        const products = app?.content?.products || []
        return Array.isArray(products) ? products.length : 0
    }

    const getClientName = (app: any) => {
        const company = app?.content?.companyInfo
        return company?.nameVn || company?.nameEn || app.product_name || 'N/A'
    }

    return (
        <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
                <TabsTrigger value="pending" className="gap-2">
                    <FileSearch className="h-4 w-4" />
                    Chờ Xem Xét
                    {pendingReview.length > 0 && (
                        <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 rounded-full text-[10px] flex items-center justify-center">
                            {pendingReview.length}
                        </Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="assign" className="gap-2">
                    <Users className="h-4 w-4" />
                    Phân Công
                    {accepted.length > 0 && (
                        <Badge className="ml-1 h-5 w-5 p-0 rounded-full text-[10px] flex items-center justify-center bg-green-500">
                            {accepted.length}
                        </Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="progress" className="gap-2">
                    <Activity className="h-4 w-4" />
                    Đang Tiến Hành
                    {inProgress.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 rounded-full text-[10px] flex items-center justify-center">
                            {inProgress.length}
                        </Badge>
                    )}
                </TabsTrigger>
            </TabsList>

            {/* TAB 1: Pending Review */}
            <TabsContent value="pending" className="mt-4">
                {pendingReview.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <FileSearch className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground">Không có hồ sơ nào chờ xem xét</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {pendingReview.map(app => (
                            <Card key={app.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="py-4 px-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                                                    {getClientName(app).charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-semibold text-sm">{getClientName(app)}</h3>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                    <span className="flex items-center gap-1">
                                                        <Package className="h-3 w-3" />
                                                        {getProductCount(app)} sản phẩm
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(app.created_at), 'dd/MM/yyyy')}
                                                    </span>
                                                    {app.revision_count > 0 && (
                                                        <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px]">
                                                            Lần gửi thứ {app.revision_count + 1}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Link href={`/review/${app.id}`}>
                                            <Button variant="default" size="sm" className="gap-1.5">
                                                <Eye className="h-4 w-4" />
                                                Xem Xét
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>

            {/* TAB 2: Team Assignment */}
            <TabsContent value="assign" className="mt-4">
                {accepted.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground">Không có hồ sơ nào cần phân công</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {accepted.map(app => (
                            <Card key={app.id} className="hover:shadow-md transition-shadow border-green-100">
                                <CardContent className="py-4 px-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-sm">
                                                    {getClientName(app).charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-semibold text-sm">{getClientName(app)}</h3>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                    <span className="flex items-center gap-1">
                                                        <Package className="h-3 w-3" />
                                                        {getProductCount(app)} sản phẩm
                                                    </span>
                                                    <Badge variant="outline" className="text-green-600 border-green-200 text-[10px]">
                                                        ✓ Đã chấp nhận
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <AuditAllocationDialog
                                            application={app}
                                            auditors={availableAuditors}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>

            {/* TAB 3: In Progress */}
            <TabsContent value="progress" className="mt-4">
                {inProgress.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Activity className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground">Không có cuộc đánh giá nào đang tiến hành</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {inProgress.map(app => (
                            <Card key={app.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="py-4 px-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold text-sm">
                                                    {getClientName(app).charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-semibold text-sm">{getClientName(app)}</h3>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                    <span className="flex items-center gap-1">
                                                        <Package className="h-3 w-3" />
                                                        {getProductCount(app)} sản phẩm
                                                    </span>
                                                    <StatusBadge status={app.status} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <AuditAllocationDialog
                                                application={app}
                                                auditors={availableAuditors}
                                            />
                                            <Link href={`/review/${app.id}`}>
                                                <Button variant="outline" size="sm">
                                                    Chi tiết
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>
        </Tabs>
    )
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        'Team Assigned': 'bg-indigo-100 text-indigo-800 border-indigo-200',
        'Audit In Progress': 'bg-purple-100 text-purple-800 border-purple-200',
        'Report Review': 'bg-teal-100 text-teal-800 border-teal-200',
        'Allocating': 'bg-orange-100 text-orange-800 border-orange-200',
    }
    const labelMap: Record<string, string> = {
        'Team Assigned': 'Đã Phân Công',
        'Audit In Progress': 'Đang Đánh Giá',
        'Report Review': 'Xem Xét Báo Cáo',
        'Allocating': 'Đang Phân Bổ',
    }
    return (
        <Badge variant="outline" className={`text-[10px] ${map[status] || ''}`}>
            {labelMap[status] || status}
        </Badge>
    )
}
