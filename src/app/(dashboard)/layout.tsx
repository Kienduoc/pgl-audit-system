import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    FileCheck,
    Settings,
    LogOut,
    Menu
} from 'lucide-react'
import { getUserRoles } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationBell } from "@/components/layout/notification-bell"
import { RoleSwitcher } from "@/components/role-switcher"
// import { LanguageSwitcher } from "@/components/language-switcher" // TODO: Simple client-side version

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch profile with roles
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Get user's available roles
    const availableRoles = await getUserRoles(user.id)
    const activeRole = profile?.active_role || 'client'

    const handleSignOut = async () => {
        'use server'
        const sb = await createClient()
        await sb.auth.signOut()
        redirect('/login')
    }

    const NavContent = () => (
        <div className="flex flex-col h-full gap-4 py-4">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <FileCheck className="h-6 w-6" />
                    <span className="">Hệ Thống Đánh Giá PGL</span>
                </Link>
            </div>
            <div className="flex-1">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    {/* Dashboard - Only for Lead Auditor and Admin */}
                    {(activeRole === 'lead_auditor' || activeRole === 'admin') && (
                        <Link
                            href="/"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Tổng Quan
                        </Link>
                    )}
                    {/* Audit Programs - Only for Admin & Client (Create) & Lead (Review) */}
                    {(activeRole === 'client' || activeRole === 'lead_auditor' || activeRole === 'admin') && (
                        <Link
                            href="/audit-programs"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <FileCheck className="h-4 w-4" />
                            Chương Trình Đánh Giá
                        </Link>
                    )}
                </nav>
            </div>
        </div >
    )

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-muted/40 md:block">
                <NavContent />
            </div>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col">
                            <NavContent />
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1">
                        {/* Breadcrumb or Search could go here */}
                    </div>
                    {/* Notifications */}
                    <NotificationBell />
                    {/* Language Switcher */}
                    {/* <LanguageSwitcher /> */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full">
                                <Avatar>
                                    <AvatarImage src={profile?.avatar_url} />
                                    <AvatarFallback>{profile?.full_name?.[0] || user.email?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Tài Khoản</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/profile/settings">Cài Đặt Tổ Chức</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>Hỗ Trợ</DropdownMenuItem>
                            <RoleSwitcher currentRole={activeRole} availableRoles={availableRoles} />
                            <DropdownMenuSeparator />
                            <form action={handleSignOut}>
                                <button type="submit" className="w-full text-left">
                                    <DropdownMenuItem>Đăng Xuất</DropdownMenuItem>
                                </button>
                            </form>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
