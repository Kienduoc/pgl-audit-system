import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { getUserRole } from "@/lib/auth/role-utils"
import { redirect } from "next/navigation"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Role check (Double check for security)
    const role = await getUserRole()
    if (role !== 'admin') {
        redirect('/profile') // Redirect non-admins out
    }

    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset className="bg-background">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <div className="w-px h-6 bg-border mx-2" />
                    {/* Breadcrumbs or Page Title could go here */}
                    <span className="font-medium text-sm text-muted-foreground">Administration</span>
                </header>
                <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
