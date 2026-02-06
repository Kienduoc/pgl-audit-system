'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export type UserRole = 'client' | 'auditor' | 'lead_auditor' | 'admin'

interface UseRoleReturn {
    role: UserRole | null
    loading: boolean
    error: Error | null
    isAdmin: boolean
    isAuditor: boolean
    isClient: boolean
    isLeadAuditor: boolean
}

export function useRole(): UseRoleReturn {
    const [role, setRole] = useState<UserRole | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        async function fetchRole() {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    setRole(null)
                    setLoading(false)
                    return
                }

                // Check profile
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (error) throw error

                setRole(profile?.role as UserRole)
            } catch (err) {
                console.error('Error fetching role:', err)
                setError(err as Error)
            } finally {
                setLoading(false)
            }
        }

        fetchRole()
    }, [])

    return {
        role,
        loading,
        error,
        isAdmin: role === 'admin',
        isAuditor: role === 'auditor' || role === 'lead_auditor', // Auditors include Lead Auditors usually in broad checks
        isClient: role === 'client',
        isLeadAuditor: role === 'lead_auditor'
    }
}
