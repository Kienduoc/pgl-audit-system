"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    ShieldCheck,
    LogOut,
    Menu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarRail,
} from "@/components/ui/sidebar"

// Admin navigation items
const adminNavItems = [
    {
        title: "Tổng Quan",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Đơn Đăng Ký",
        href: "/admin/applications",
        icon: FileText,
    },
    {
        title: "Dự Án",
        href: "/admin/projects",
        icon: ShieldCheck,
    },
    {
        title: "Người Dùng",
        href: "/admin/users",
        icon: Users,
    },
    {
        title: "Cài Đặt",
        href: "/admin/settings",
        icon: Settings,
    },
]

export function AdminSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar className="border-r border-border/40 bg-card">
            <SidebarHeader className="border-b border-border/40 p-4">
                <Link href="/admin" className="flex items-center gap-2 px-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                        <span className="font-semibold text-base">PGL Admin</span>
                        <span className="text-xs text-muted-foreground">Control Center</span>
                    </div>
                </Link>
            </SidebarHeader>
            <SidebarContent className="p-2">
                <SidebarMenu>
                    {adminNavItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                                tooltip={item.title}
                                className="h-10 transition-all duration-200"
                            >
                                <Link href={item.href} className="flex items-center gap-3">
                                    <item.icon className="h-4 w-4" />
                                    <span className="font-medium">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="border-t border-border/40 p-4">
                {/* User info or logout can go here */}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
