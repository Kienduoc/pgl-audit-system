export function FormatViewer({ content }: { content: any }) {
    if (!content) return <div className="text-muted-foreground p-4">Không có nội dung</div>

    return (
        <div className="space-y-8">
            <section>
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Thông Tin Doanh Nghiệp</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <dt className="text-muted-foreground">Tên Tiếng Việt</dt>
                        <dd className="font-medium">{content.companyInfo?.nameVi || "-"}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Tên Tiếng Anh</dt>
                        <dd className="font-medium">{content.companyInfo?.nameEn || "-"}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Mã Số Thuế</dt>
                        <dd className="font-medium">{content.companyInfo?.taxId || "-"}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Địa Chỉ</dt>
                        <dd className="font-medium">{content.companyInfo?.addressVi || "-"}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Người Đại Diện</dt>
                        <dd className="font-medium">{content.companyInfo?.representative || "-"}</dd>
                    </div>
                </dl>
            </section>

            <section>
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Thông Tin Sản Phẩm</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <dt className="text-muted-foreground">Tên Sản Phẩm</dt>
                        <dd className="font-medium">{content.productInfo?.name || "-"}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Mục Đích Sử Dụng</dt>
                        <dd className="font-medium">{content.productInfo?.intendedUse || "-"}</dd>
                    </div>
                </dl>
            </section>

            <section>
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Dữ Liệu Thô (Debug)</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                    {JSON.stringify(content, null, 2)}
                </pre>
            </section>
        </div>
    )
}
