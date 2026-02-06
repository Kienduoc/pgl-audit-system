import { getAuditDossierWithReviews } from '@/lib/actions/review'
import PrintButton from '@/components/common/print-button'
import { DOSSIER_CHECKLIST } from '@/config/dossier-checklist'

export default async function DocumentReviewReportPage({ params }: { params: { id: string } }) {
    const { audit, dossier, reviews } = await getAuditDossierWithReviews(params.id)

    // Helper
    const getReview = (itemId: string) => {
        return reviews.find((r: any) => r.item_id === itemId)
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
            <div className="max-w-[210mm] mx-auto mb-6 flex justify-end print:hidden">
                <PrintButton />
            </div>

            <div className="max-w-[210mm] mx-auto bg-white shadow-lg p-[10mm] min-h-[297mm] print:shadow-none print:w-full print:max-w-none">
                {/* Header */}
                <div className="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 className="text-2xl font-bold uppercase mb-2">BÁO CÁO ĐÁNH GIÁ HỆ THỐNG TÀI LIỆU (BM06)</h1>
                </div>

                {/* Info */}
                <div className="mb-6">
                    <p><strong>Khách hàng:</strong> {audit.client?.english_name}</p>
                    <p><strong>Địa chỉ:</strong> {audit.client?.factory_address}</p>
                    <p><strong>Tiêu chuẩn:</strong> {audit.applicable_standards?.join(', ')}</p>
                </div>

                {/* Content Table */}
                <table className="w-full border-collapse border border-black text-sm mb-8">
                    <thead className="bg-gray-100 font-bold text-center">
                        <tr>
                            <th className="border border-black p-2 w-10">TT</th>
                            <th className="border border-black p-2">Nội dung / Tài liệu yêu cầu</th>
                            <th className="border border-black p-2 w-32">Kết quả</th>
                            <th className="border border-black p-2">Nhận xét / Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DOSSIER_CHECKLIST.flatMap((cat, catIdx) =>
                            cat.items.map((item, itemIdx) => {
                                const review = getReview(item.id)
                                return (
                                    <tr key={item.id}>
                                        <td className="border border-black p-2 text-center">{catIdx + 1}.{itemIdx + 1}</td>
                                        <td className="border border-black p-2">
                                            <div className="font-semibold">{item.label}</div>
                                            <div className="text-xs text-gray-500 italic uppercase">({cat.category})</div>
                                        </td>
                                        <td className="border border-black p-2 text-center">
                                            {review?.status === 'ok' ? 'Đạt' :
                                                review?.status === 'minor' ? 'NC (Nhỏ)' :
                                                    review?.status === 'major' ? 'NC (Lớn)' :
                                                        review?.status === 'critical' ? 'Nghiêm trọng' : '-'}
                                        </td>
                                        <td className="border border-black p-2">
                                            {review?.auditor_notes || ''}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>

                {/* Conclusion */}
                <div className="mb-8 border border-black p-4">
                    <h3 className="font-bold underline mb-2">Kết luận của đoàn đánh giá:</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border border-black"></div>
                            <span>Hệ thống tài liệu ĐẠT yêu cầu để tiến hành đánh giá tại chỗ.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border border-black"></div>
                            <span>Cần bổ sung/sửa đổi các mục nêu trên trước khi đánh giá.</span>
                        </div>
                    </div>
                </div>

                <div className="text-right mt-16">
                    <p className="font-bold uppercase mr-16">TRƯỞNG ĐOÀN ĐÁNH GIÁ</p>
                    {/* Sig */}
                </div>
            </div>
        </div>
    )
}
