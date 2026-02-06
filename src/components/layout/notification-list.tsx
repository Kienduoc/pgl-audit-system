'use client'

import { useState, useEffect } from 'react'
import { getNotifications, markAsRead, markAllAsRead, type Notification } from '@/lib/actions/notifications'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export function NotificationList() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadNotifications()
    }, [])

    const loadNotifications = async () => {
        const data = await getNotifications()
        setNotifications(data)
        setLoading(false)
    }

    const handleMarkAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        await markAsRead(id)
    }

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        await markAllAsRead()
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />
            default: return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    if (loading) return <div className="p-4 text-center text-sm text-muted-foreground">Loading notifications...</div>

    if (notifications.length === 0) {
        return <div className="p-8 text-center text-sm text-muted-foreground">No updates yet</div>
    }

    return (
        <div className="flex flex-col gap-2 w-[350px]">
            <div className="flex items-center justify-between px-4 py-2 border-b">
                <span className="font-semibold text-sm">Notifications</span>
                <Button variant="ghost" size="xs" onClick={handleMarkAllRead} className="h-auto px-2 py-1 text-xs">
                    Mark all read
                </Button>
            </div>
            <ScrollArea className="h-[300px]">
                <div className="flex flex-col p-2 gap-1">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={cn(
                                "relative flex gap-3 p-3 rounded-md transition-colors hover:bg-muted/50 group",
                                !n.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                            )}
                        >
                            <div className="mt-1 shrink-0">
                                {getIcon(n.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {n.link ? (
                                        <Link href={n.link} className="hover:underline decoration-primary">
                                            {n.title}
                                        </Link>
                                    ) : n.title}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {n.message}
                                </p>
                                <p className="text-[10px] text-muted-foreground/60">
                                    {new Date(n.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            {!n.is_read && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 absolute top-2 right-2"
                                    onClick={() => handleMarkAsRead(n.id)}
                                    title="Mark as read"
                                >
                                    <Check className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
