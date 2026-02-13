import Link from "next/link"
import { Suspense } from "react"
import { Plus, FileText, Calendar, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { listApplications } from "@/lib/actions/audit-application"

function StatusBadge({ status }: { status: string }) {
    const variant =
        status === 'approved' ? 'default' :
            status === 'submitted' ? 'secondary' :
                status === 'draft' ? 'outline' : 'destructive'

    return <Badge variant={variant} className="capitalize">{status}</Badge>
}

async function ApplicationList() {
    const applications = await listApplications()

    if (applications.length === 0) {
        return (
            <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Không tìm thấy chương trình nào</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        Bạn chưa nộp đơn đăng ký chương trình đánh giá nào.
                    </p>
                    <Button asChild>
                        <Link href="/audit-programs/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo Hồ Sơ Mới
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Công Ty</TableHead>
                        <TableHead>Sản Phẩm</TableHead>
                        <TableHead>Trạng Thái</TableHead>
                        <TableHead>Ngày Nộp</TableHead>
                        <TableHead className="text-right">Hành Động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {applications.map((app: any) => (
                        <TableRow key={app.id}>
                            <TableCell className="font-medium">
                                {app.content?.companyInfo?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                                {app.content?.products?.length || 0} Products
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={app.status} />
                            </TableCell>
                            <TableCell>
                                {new Date(app.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/audit-programs/${app.id}`}>Xem</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    )
}

export default function AuditProgramsPage() {
    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Chương Trình Đánh Giá</h2>
                    <p className="text-muted-foreground">
                        Quản lý các đơn đăng ký chứng nhận và phạm vi đánh giá.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button asChild>
                        <Link href="/audit-programs/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo Đơn Mới
                        </Link>
                    </Button>
                </div>
            </div>
            <Separator />

            <Suspense fallback={<div>Đang tải dữ liệu...</div>}>
                <ApplicationList />
            </Suspense>
        </div>
    )
}
