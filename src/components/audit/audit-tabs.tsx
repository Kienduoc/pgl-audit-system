'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function AuditTabs({ auditId, role }: { auditId: string, role?: string }) {
    const pathname = usePathname()

    // Determine active tab based on pathname
    let selectedTab = 'overview' // Default to overview if we had one, but currently 'checklist' is default default?
    // Fixing default logic:
    if (pathname.includes('/checklist')) selectedTab = 'checklist'
    if (pathname.includes('/findings')) selectedTab = 'findings'
    if (pathname.includes('/report')) selectedTab = 'report'

    // Client shouldn't default to checklist
    if (role === 'client' && selectedTab === 'checklist') {
        // We don't control redirect here (server/layout should), but we control UI Highlight
        // Ideally client default is 'findings' or 'overview'
        selectedTab = 'findings'
    }

    return (
        <Tabs defaultValue={selectedTab} value={selectedTab} className="w-full">
            <TabsList>
                {/* Client Tabs */}
                {role === 'client' ? (
                    <>
                        <Link href={`/audits/${auditId}/dossier`}>
                            <TabsTrigger value="dossier">Hồ sơ (Dossier)</TabsTrigger>
                        </Link>
                        <Link href={`/audits/${auditId}/findings`}>
                            <TabsTrigger value="findings">Sự không phù hợp (NCs)</TabsTrigger>
                        </Link>
                        {/* Placeholder for Result */}
                        <TabsTrigger value="result" disabled>Kết quả</TabsTrigger>
                    </>
                ) : (
                    /* Auditor/Admin Tabs */
                    <>
                        <Link href={`/audits/${auditId}/dossier`}>
                            <TabsTrigger value="dossier">Review Dossier</TabsTrigger>
                        </Link>
                        <Link href={`/audits/${auditId}/checklist`}>
                            <TabsTrigger value="checklist">Checklist (Input)</TabsTrigger>
                        </Link>
                        <Link href={`/audits/${auditId}/findings`}>
                            <TabsTrigger value="findings">Findings (Summary)</TabsTrigger>
                        </Link>
                        <Link href={`/audits/${auditId}/report`}>
                            <TabsTrigger value="report">Report</TabsTrigger>
                        </Link>
                    </>
                )}
            </TabsList>
        </Tabs>
    )
}
