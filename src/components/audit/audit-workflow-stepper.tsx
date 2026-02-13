'use client'

import { Check, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AuditPhase = 'application' | 'planning' | 'evaluation' | 'reporting' | 'certification'

interface AuditWorkflowStepperProps {
    currentPhase: AuditPhase
    className?: string
}

const steps: { id: AuditPhase; label: string }[] = [
    { id: 'application', label: 'Xem Xét Đơn' },
    { id: 'planning', label: 'Lập Kế Hoạch' },
    { id: 'evaluation', label: 'Đánh Giá' },
    { id: 'reporting', label: 'Báo Cáo' },
    { id: 'certification', label: 'Chứng Nhận' },
]

export function AuditWorkflowStepper({ currentPhase, className }: AuditWorkflowStepperProps) {
    const currentStepIndex = steps.findIndex((s) => s.id === currentPhase)

    return (
        <div className={cn("w-full py-4", className)}>
            <div className="relative flex items-center justify-between w-full">
                {/* Progress Bar Background */}
                <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded-full" />

                {/* Active Progress Bar */}
                <div
                    className="absolute left-0 top-1/2 h-1 bg-primary -z-10 -translate-y-1/2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index < currentStepIndex
                    const isCurrent = index === currentStepIndex
                    const isUpcoming = index > currentStepIndex

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                            <div
                                className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                                    isCompleted && "border-primary bg-primary text-primary-foreground",
                                    isCurrent && "border-primary bg-background text-primary ring-4 ring-primary/20",
                                    isUpcoming && "border-gray-300 bg-background text-gray-300"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-4 w-4" />
                                ) : isCurrent ? (
                                    <Circle className="h-4 w-4 fill-current" />
                                ) : (
                                    <span className="text-xs font-medium">{index + 1}</span>
                                )}
                            </div>
                            <span
                                className={cn(
                                    "text-xs font-medium whitespace-nowrap transition-colors duration-300",
                                    isCompleted && "text-primary",
                                    isCurrent && "text-primary font-bold",
                                    isUpcoming && "text-muted-foreground"
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
