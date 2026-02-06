'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { NotificationList } from '@/components/layout/notification-list'
import { getUnreadCount } from '@/lib/actions/notifications'
import { cn } from '@/lib/utils'

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        // Initial fetch
        fetchCount()

        // Poll every 30s to keep it somewhat fresh without realtime overhead
        const interval = setInterval(fetchCount, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchCount = async () => {
        const count = await getUnreadCount()
        setUnreadCount(count)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-600 border-2 border-background flex items-center justify-center">
                            <span className="sr-only">{unreadCount} unread notifications</span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <NotificationList />
            </PopoverContent>
        </Popover>
    )
}
