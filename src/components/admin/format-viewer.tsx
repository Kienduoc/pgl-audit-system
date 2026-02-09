export function FormatViewer({ content }: { content: any }) {
    if (!content) return <div className="text-muted-foreground p-4">No content available</div>

    return (
        <div className="space-y-8">
            <section>
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Company Information</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <dt className="text-muted-foreground">Vietnamese Name</dt>
                        <dd className="font-medium">{content.companyInfo?.nameVi || "-"}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">English Name</dt>
                        <dd className="font-medium">{content.companyInfo?.nameEn || "-"}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Tax ID</dt>
                        <dd className="font-medium">{content.companyInfo?.taxId || "-"}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Address</dt>
                        <dd className="font-medium">{content.companyInfo?.addressVi || "-"}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Representative</dt>
                        <dd className="font-medium">{content.companyInfo?.representative || "-"}</dd>
                    </div>
                </dl>
            </section>

            <section>
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Product Information</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <dt className="text-muted-foreground">Product Name</dt>
                        <dd className="font-medium">{content.productInfo?.name || "-"}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Intended Use</dt>
                        <dd className="font-medium">{content.productInfo?.intendedUse || "-"}</dd>
                    </div>
                </dl>
            </section>

            <section>
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Raw Data (Debug)</h3>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                    {JSON.stringify(content, null, 2)}
                </pre>
            </section>
        </div>
    )
}
