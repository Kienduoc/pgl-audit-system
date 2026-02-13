"use client"

import { useState } from "react"
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
import { Eye, Filter, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface AdminApplicationsTableProps {
    initialData: any[]
}

export function AdminApplicationsTable({ initialData }: AdminApplicationsTableProps) {
    const [filter, setFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Client-side filtering for MVP
    const filteredData = initialData ? initialData.filter(app => {
        const matchesSearch =
            (app.profiles?.company_name || '').toLowerCase().includes(filter.toLowerCase()) ||
            (app.project_code || '').toLowerCase().includes(filter.toLowerCase())

        const matchesStatus = statusFilter === 'all' || app.status === statusFilter

        return matchesSearch && matchesStatus
    }) : []

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <Input
                        placeholder="Lọc theo công ty hoặc mã dự án..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="h-9"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] h-9">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Trạng Thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất Cả</SelectItem>
                            <SelectItem value="submitted">Đã Nộp</SelectItem>
                            <SelectItem value="approved">Đã Duyệt</SelectItem>
                            <SelectItem value="rejected">Từ Chối</SelectItem>
                            <SelectItem value="info_needed">Cần Thông Tin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã Dự Án</TableHead>
                            <TableHead>Công Ty</TableHead>
                            <TableHead>Sản Phẩm</TableHead>
                            <TableHead>Ngày Tạo</TableHead>
                            <TableHead>Trạng Thái</TableHead>
                            <TableHead className="text-right">Hành Động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Không tìm thấy hồ sơ nào.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((app) => (
                                <TableRow key={app.id}>
                                    <TableCell className="font-medium text-xs font-mono">
                                        {app.project_code || "N/A"}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {app.profiles?.company_name || "N/A"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {app.content?.productInfo?.name || "N/A"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {format(new Date(app.created_at), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                app.status === 'submitted' ? 'default' :
                                                    app.status === 'approved' ? 'outline' :
                                                        app.status === 'rejected' ? 'destructive' : 'secondary'
                                            }
                                            className={
                                                app.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' : ''
                                            }
                                        >
                                            {app.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/admin/applications/${app.id}`}>
                                            <Button variant="ghost" size="sm">
                                                Xem Xét
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-muted-foreground">
                Hiển thị {filteredData.length} trong số {initialData?.length || 0} bản ghi
            </div>
        </div>
    )
}
