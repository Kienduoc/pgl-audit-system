import { getAuditReportData } from '@/lib/actions/report'
import { ReportActions } from '@/components/audit/report-actions'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const dynamic = 'force-dynamic'

export default async function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    let data;
    try {
        data = await getAuditReportData(id)
    } catch (e: any) {
        return (
            <div className="p-8 text-center text-red-500">
                Lỗi tải báo cáo: {e.message}
            </div>
        )
    }

    const { audit, team, findings } = data
    const clientName = audit.client?.company_name || 'N/A'
    const auditDate = audit.audit_date ? format(new Date(audit.audit_date), 'dd/MM/yyyy') : 'Chưa định ngày'

    const majorNCs = findings.filter((f: any) => f.severity === 'Major').length
    const minorNCs = findings.filter((f: any) => f.severity === 'Minor').length
    const observations = findings.filter((f: any) => f.severity === 'Observation').length

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 bg-white min-h-screen">
            {/* Action Bar */}
            <div className="flex justify-between items-center print:hidden mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Báo Cáo Đánh Giá</h1>
                <ReportActions auditId={id} />
            </div>

            {/* Report Header */}
            <div className="text-center space-y-2 mb-8 border-b pb-8">
                <h2 className="text-xl font-bold uppercase tracking-wide">BÁO CÁO ĐÁNH GIÁ CHỨNG NHẬN SẢN PHẨM</h2>
                <p className="text-sm text-gray-500">Mã Dự Án: {audit.audit_code || audit.project_code || 'N/A'}</p>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-2 gap-8 text-sm">
                <div className="space-y-3">
                    <h3 className="font-bold text-gray-900 border-b pb-1 mb-2">1. THÔNG TIN KHÁCH HÀNG</h3>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                        <span className="text-gray-500">Tên công ty:</span>
                        <span className="font-medium">{clientName}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                        <span className="text-gray-500">Địa chỉ:</span>
                        <span>{audit.client?.address || '—'}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                        <span className="text-gray-500">Người đại diện:</span>
                        <span>—</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="font-bold text-gray-900 border-b pb-1 mb-2">2. THÔNG TIN ĐÁNH GIÁ</h3>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                        <span className="text-gray-500">Ngày đánh giá:</span>
                        <span className="font-medium">{auditDate}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                        <span className="text-gray-500">Tiêu chuẩn:</span>
                        <span className="font-medium">{audit.standard || 'ISO 17065'}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                        <span className="text-gray-500">Phạm vi:</span>
                        <span>{audit.scope || '—'}</span>
                    </div>
                </div>
            </div>

            {/* Audit Team */}
            <div className="space-y-3 mt-8">
                <h3 className="font-bold text-gray-900 border-b pb-1 mb-2">3. ĐOÀN ĐÁNH GIÁ</h3>
                {team.length > 0 ? (
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-left">
                                <th className="p-2 border font-medium text-gray-600">Họ và tên</th>
                                <th className="p-2 border font-medium text-gray-600">Vai trò</th>
                                <th className="p-2 border font-medium text-gray-600">Đơn vị</th>
                            </tr>
                        </thead>
                        <tbody>
                            {team.map((member: any) => (
                                <tr key={member.id}>
                                    <td className="p-2 border font-medium">{member.profile?.full_name}</td>
                                    <td className="p-2 border">{member.role}</td>
                                    <td className="p-2 border">{member.profile?.organization || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-gray-500 italic">Chưa cập nhật thông tin đoàn đánh giá.</p>
                )}
            </div>

            {/* Findings Summary */}
            <div className="space-y-3 mt-8">
                <h3 className="font-bold text-gray-900 border-b pb-1 mb-2">4. TÓM TẮT PHÁT HIỆN</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-red-50 rounded border border-red-100">
                        <div className="text-2xl font-bold text-red-600">{majorNCs}</div>
                        <div className="text-xs text-red-800 font-medium uppercase mt-1">Lỗi Nặng (Major)</div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded border border-amber-100">
                        <div className="text-2xl font-bold text-amber-600">{minorNCs}</div>
                        <div className="text-xs text-amber-800 font-medium uppercase mt-1">Lỗi Nhẹ (Minor)</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded border border-blue-100">
                        <div className="text-2xl font-bold text-blue-600">{observations}</div>
                        <div className="text-xs text-blue-800 font-medium uppercase mt-1">Khuyến Nghị (Obs)</div>
                    </div>
                </div>

                {findings.length > 0 && (
                    <div className="mt-4 border rounded overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-left">
                                    <th className="p-2 border-b w-12 text-center text-gray-500">#</th>
                                    <th className="p-2 border-b w-24 text-gray-600">Loại</th>
                                    <th className="p-2 border-b text-gray-600">Mô tả phát hiện</th>
                                </tr>
                            </thead>
                            <tbody>
                                {findings.map((f: any, idx: number) => (
                                    <tr key={f.id}>
                                        <td className="p-2 border-b text-center text-gray-400">{idx + 1}</td>
                                        <td className="p-2 border-b">
                                            <span className={`px-2 py-0.5 rounded textxs font-medium ${f.severity === 'Major' ? 'bg-red-100 text-red-700' :
                                                    f.severity === 'Minor' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>{f.severity}</span>
                                        </td>
                                        <td className="p-2 border-b">{f.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Conclusion */}
            <div className="space-y-3 mt-8 break-inside-avoid">
                <h3 className="font-bold text-gray-900 border-b pb-1 mb-2">5. KẾT LUẬN & KIẾN NGHỊ</h3>
                <div className="p-4 border rounded bg-gray-50 text-sm space-y-2">
                    <p>
                        <span className="font-medium">Kết luận của đoàn đánh giá:</span> {majorNCs > 0 ? 'KHÔNG ĐẠT (Có lỗi nặng)' : minorNCs > 5 ? 'CẦN KHẮC PHỤC (Nhiều lỗi nhẹ)' : 'ĐẠT YÊU CẦU (Chấp nhận)'}
                    </p>
                    <p>
                        <span className="font-medium">Kiến nghị:</span> {audit.status === 'completed' ? 'Cấp chứng nhận' : 'Xem xét kết quả khắc phục'}
                    </p>
                    <p className="italic text-gray-500 mt-2">
                        Ghi chú: Khách hàng cần khắc phục các điểm không phù hợp (nếu có) trong vòng 30 ngày kể từ ngày đánh giá.
                    </p>
                </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-16 mt-16 pt-8 break-inside-avoid">
                <div className="text-center">
                    <p className="font-bold mb-16">ĐẠI DIỆN KHÁCH HÀNG</p>
                    <p className="text-sm text-gray-400">(Ký và ghi rõ họ tên)</p>
                </div>
                <div className="text-center">
                    <p className="font-bold mb-16">TRƯỞNG ĐOÀN ĐÁNH GIÁ</p>
                    <p className="font-medium">{team.find((m: any) => m.role === 'Lead Auditor')?.profile?.full_name || '—'}</p>
                </div>
            </div>
        </div>
    )
}
