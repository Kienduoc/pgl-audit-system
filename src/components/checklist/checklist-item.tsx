'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, AlertCircle, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LocalChecklistItem } from '@/lib/db'

interface ChecklistItemProps {
    item: LocalChecklistItem
    onUpdate: (id: string, status: LocalChecklistItem['status']) => void
}

export function ChecklistItem({ item, onUpdate }: ChecklistItemProps) {
    return (
        <div className="flex flex-col gap-3 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                    <div className="font-semibold text-sm text-muted-foreground">{item.section}</div>
                    <p className="text-sm font-medium">{item.requirement}</p>
                </div>
                <StatusBadge status={item.status} />
            </div>

            <div className="flex gap-2 justify-end mt-2">
                <Button
                    variant={item.status === 'pass' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onUpdate(item.id, 'pass')}
                    className="h-8 w-8 p-0"
                >
                    <Check className="h-4 w-4" />
                </Button>
                <Button
                    variant={item.status === 'fail' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => onUpdate(item.id, 'fail')}
                    className="h-8 w-8 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
                <Button
                    variant={item.status === 'observation' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => onUpdate(item.id, 'observation')}
                    className="h-8 w-8 p-0 border-yellow-500 text-yellow-600 bg-yellow-50 hover:bg-yellow-100"
                >
                    <AlertCircle className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
        pass: 'default',
        fail: 'destructive',
        observation: 'secondary',
        pending: 'outline',
        na: 'outline'
    }

    return (
        <Badge variant={variants[status] || 'outline'}>
            {status.toUpperCase()}
        </Badge>
    )
}
