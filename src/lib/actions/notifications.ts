'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Notification = {
    id: string
    user_id: string
    audit_id?: string
    type: 'info' | 'warning' | 'success' | 'error'
    title: string
    message: string
    link?: string
    is_read: boolean
    created_at: string
}

export async function getNotifications(limit = 10) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

    return (data as Notification[]) || []
}

export async function getUnreadCount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 0

    const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

    return count || 0
}

export async function markAsRead(notificationId: string) {
    const supabase = await createClient()

    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

    revalidatePath('/(dashboard)', 'layout')
}

export async function markAllAsRead() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

    revalidatePath('/(dashboard)', 'layout')
}

// Internal use only - triggers notification creation
export async function createNotification(data: {
    user_id: string
    audit_id?: string
    type?: 'info' | 'warning' | 'success' | 'error'
    title: string
    message: string
    link?: string
}) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: data.user_id,
            audit_id: data.audit_id,
            type: data.type || 'info',
            title: data.title,
            message: data.message,
            link: data.link
        })

    if (error) console.error('Failed to create notification:', error)
}
