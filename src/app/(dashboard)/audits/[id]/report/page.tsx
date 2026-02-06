import { redirect } from 'next/navigation'

export default async function ReportRedirectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    redirect(`/audits/${id}/findings`)
}
