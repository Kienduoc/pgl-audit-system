'use client'

import { useState } from 'react'
import { UserRole } from '@/lib/auth'
import { switchUserRole } from '@/lib/actions/role-switch'
import { toast } from 'sonner'
import { Shield, User, Users, Crown, Check } from 'lucide-react'
import {
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

const roleIcons = {
    client: User,
    auditor: Users,
    lead_auditor: Shield,
    admin: Crown
}

const roleLabels = {
    client: 'Client',
    auditor: 'Auditor',
    lead_auditor: 'Lead Auditor',
    admin: 'Admin'
}

const roleColors = {
    client: 'text-blue-600',
    auditor: 'text-green-600',
    lead_auditor: 'text-purple-600',
    admin: 'text-amber-600'
}

export function RoleSwitcher({
    currentRole,
    availableRoles
}: {
    currentRole: UserRole
    availableRoles: UserRole[]
}) {
    const [switching, setSwitching] = useState(false)

    const handleSwitch = async (newRole: UserRole) => {
        if (newRole === currentRole) return

        setSwitching(true)
        const result = await switchUserRole(newRole)

        if (result.success) {
            toast.success(`Switched to ${roleLabels[newRole]}`)
            // Page will auto-refresh due to revalidatePath
        } else {
            toast.error(result.error || 'Failed to switch role')
            setSwitching(false)
        }
    }

    // Don't show switcher if user only has one role
    if (availableRoles.length <= 1) {
        return null
    }

    return (
        <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
                Switch Role
            </DropdownMenuLabel>
            {availableRoles.map(role => {
                const Icon = roleIcons[role]
                const isActive = role === currentRole
                const colorClass = roleColors[role]

                return (
                    <DropdownMenuItem
                        key={role}
                        onClick={() => handleSwitch(role)}
                        disabled={switching || isActive}
                        className={`cursor-pointer ${isActive ? 'bg-accent' : ''}`}
                    >
                        <Icon className={`mr-2 h-4 w-4 ${colorClass}`} />
                        <span className="flex-1">{roleLabels[role]}</span>
                        {isActive && <Check className="ml-auto h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                )
            })}
        </>
    )
}
