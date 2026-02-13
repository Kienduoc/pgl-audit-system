import { Suspense } from "react"
import { getUserProfile } from "@/lib/actions/audit-application"
import { ApplicationForm } from "@/components/audit/application-form"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default async function CreateAuditProgramPage() {
    const profile = await getUserProfile()

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6 pb-16">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Tạo Chương Trình Đánh Giá</h2>
                <p className="text-muted-foreground">
                    Nộp đơn đăng ký mở rộng phạm vi chứng nhận sản phẩm.
                </p>
            </div>
            <Separator />

            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Hướng Dẫn</AlertTitle>
                <AlertDescription>
                    Vui lòng điền chi tiết sản phẩm cẩn thận. Bạn có thể thêm nhiều sản phẩm vào cùng một đơn đăng ký.
                    Thông tin công ty được điền sẵn từ hồ sơ của bạn nhưng có thể chỉnh sửa nếu cần thiết cho đơn đăng ký này.
                </AlertDescription>
            </Alert>

            <Suspense fallback={<div className="p-8 text-center">Đang tải hồ sơ...</div>}>
                <ApplicationForm companyProfile={profile} />
            </Suspense>
        </div>
    )
}
