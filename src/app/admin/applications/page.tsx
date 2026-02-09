import { Suspense } from "react"
import { getAdminApplications } from "@/lib/actions/admin-applications"
import { AdminApplicationsTable } from "@/components/admin/admin-applications-table"

async function ApplicationsContent() {
    // Basic fetch for now, will add search params handling for filtering later
    const response = await getAdminApplications({ limit: 50 })

    if (response.error) {
        return <div className="text-red-500">Error loading applications: {response.error}</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
            </div>
            <AdminApplicationsTable initialData={response.data || []} />
        </div>
    )
}

export default function ApplicationsPage() {
    return (
        <Suspense fallback={<div>Loading applications...</div>}>
            <ApplicationsContent />
        </Suspense>
    )
}
