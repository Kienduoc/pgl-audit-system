import { getAuditReportData } from '@/lib/actions/report'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { format } from 'date-fns'
import PrintButton from '@/components/common/print-button' // I'll create this simple component or just inline logic

export default async function AuditFindingsReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { audit, team, findings } = await getAuditReportData(id)

    const getTypeLabel = (type: string) => {
        // Map DB finding_type to Report Label (0, 1, 2)
        // Assuming DB stores specific strings or we stick to 0, 1, 2 convention if text
        // Let's assume standard mapping based on user request:
        // User said: Type = 0 (Note), 1 (Major), 2 (Minor)
        if (type === 'Start Point' || type === 'Opportunity for Improvement' || type === 'observation') return '0'
        if (type === 'Major Non-conformity' || type === 'major') return '1'
        if (type === 'Minor Non-conformity' || type === 'minor') return '2'
        return type // Fallback
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
            {/* Toolbar - Hidden on Print */}
            <div className="max-w-[210mm] mx-auto mb-6 flex justify-end print:hidden">
                <PrintButton />
            </div>

            {/* A4 Page Container */}
            <div className="max-w-[210mm] mx-auto bg-white shadow-lg p-[10mm] min-h-[297mm] print:shadow-none print:w-full print:max-w-none">

                {/* 1. Header */}
                <div className="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 className="text-2xl font-bold uppercase mb-2">BÁO CÁO PHÁT HIỆN ĐÁNH GIÁ</h1>
                    <div className="text-sm font-medium">
                        <p>Tiêu chuẩn đánh giá: {audit.applicable_standards?.join(', ') || 'ISO/IEC 17065'}</p>
                        <p>Mã dự án: {audit.audit_code || audit.project_code || '...'}</p>
                    </div>
                </div>

                {/* 2. General Information */}
                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-2 uppercase border-l-4 border-black pl-2">1. Thông tin chung</h3>
                    <table className="w-full border-collapse border border-black text-sm">
                        <tbody>
                            <tr>
                                <td className="border border-black p-2 font-semibold w-1/3">Tên tổ chức</td>
                                <td className="border border-black p-2" colSpan={3}>{audit.client?.english_name || audit.client_legal_name}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-semibold">Địa chỉ</td>
                                <td className="border border-black p-2" colSpan={3}>{audit.client?.factory_address || audit.client_address}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-semibold">Người đại diện</td>
                                <td className="border border-black p-2">{audit.client?.representative_name || audit.client_contact_person}</td>
                                <td className="border border-black p-2 font-semibold w-24">Chức vụ:</td>
                                <td className="border border-black p-2">{audit.client?.position || '...'}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-semibold">Địa điểm đánh giá</td>
                                <td className="border border-black p-2" colSpan={3}>{audit.location || 'Tại nhà máy'}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-semibold">Thời gian đánh giá</td>
                                <td className="border border-black p-2" colSpan={3}>
                                    {audit.audit_date ? format(new Date(audit.audit_date), 'dd/MM/yyyy') : '...'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 3. Audit Team */}
                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-2 uppercase border-l-4 border-black pl-2">2. Đoàn đánh giá (Audit Team)</h3>
                    <table className="w-full border-collapse border border-black text-sm text-center">
                        <thead className="bg-gray-100 font-bold">
                            <tr>
                                <th className="border border-black p-2 w-10">TT</th>
                                <th className="border border-black p-2">Họ và tên</th>
                                <th className="border border-black p-2">Viết tắt</th>
                                <th className="border border-black p-2">Vai trò, vị trí trong đoàn</th>
                            </tr>
                        </thead>
                        <tbody>
                            {team.length > 0 ? team.map((member: any, index: number) => (
                                <tr key={member.id}>
                                    <td className="border border-black p-2">{index + 1}</td>
                                    <td className="border border-black p-2 text-left">{member.profile?.full_name || 'Unknown'}</td>
                                    <td className="border border-black p-2">{member.profile?.expert_code || '...'}</td>
                                    <td className="border border-black p-2">{member.role === 'lead_auditor' ? 'Trưởng đoàn' : 'Chuyên gia'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="border border-black p-2 italic text-left">Chưa có thông tin đoàn đánh giá</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 4. Findings Summary */}
                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-2 uppercase border-l-4 border-black pl-2">3. Tóm tắt phát hiện</h3>
                    <table className="w-full border-collapse border border-black text-sm">
                        <thead className="bg-gray-100 font-bold text-center">
                            <tr>
                                <th className="border border-black p-2 w-10">TT</th>
                                <th className="border border-black p-2 w-32">Chuẩn mực</th>
                                <th className="border border-black p-2">Mô tả các phát hiện</th>
                                <th className="border border-black p-2 w-16">Loại</th>
                                <th className="border border-black p-2 w-20">CGĐG</th>
                            </tr>
                        </thead>
                        <tbody>
                            {findings.length > 0 ? findings.map((f: any, index: number) => (
                                <tr key={f.id}>
                                    <td className="border border-black p-2 text-center">{index + 1}</td>
                                    <td className="border border-black p-2">{f.clause_reference}</td>
                                    <td className="border border-black p-2">{f.description}</td>
                                    <td className="border border-black p-2 text-center">{getTypeLabel(f.finding_type)}</td>
                                    <td className="border border-black p-2 text-center">...</td>
                                    {/* Need actual auditor code here if available, confusing schema earlier */}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="border border-black p-2 italic text-center">Không có phát hiện nào. (No findings recorded)</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Notes Footer */}
                    <div className="mt-2 text-sm italic">
                        <strong>Ghi chú:</strong> Loại = 0 – Lưu ý/Kiến nghị; = 1 – Nặng; = 2 – Nhẹ; Các phát hiện đã được giải thích rõ.
                    </div>
                </div>

                {/* 5. Signatures */}
                <div className="mt-16 grid grid-cols-2 gap-8 text-center break-inside-avoid">
                    <div>
                        <p className="italic mb-16">..., ngày ... tháng ... năm ...</p>
                        <p className="font-bold uppercase">ĐẠI DIỆN TỔ CHỨC ĐƯỢC ĐÁNH GIÁ</p>
                        <p className="font-bold uppercase text-sm mt-1">&lt;CHỨC VỤ&gt;</p>
                    </div>
                    <div>
                        <p className="italic mb-16">..., ngày ... tháng ... năm ...</p>
                        <p className="font-bold uppercase">TRƯỞNG ĐOÀN ĐÁNH GIÁ</p>
                    </div>
                </div>

            </div>
        </div>
    )
}
