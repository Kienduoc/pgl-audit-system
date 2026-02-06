"use client"

import * as React from "react"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

// Simplified Radio Group without Radix (to avoid install steps for now)
// Designed to match Shadcn UI API: <RadioGroup value={} onValueChange={}> <RadioGroupItem /> </RadioGroup>

const RadioGroupContext = React.createContext<{
    value?: string
    onValueChange?: (value: string) => void
    name?: string
} | null>(null)

const RadioGroup = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        value?: string,
        onValueChange?: (value: string) => void,
        defaultValue?: string,
        name?: string
    }
>(({ className, value, onValueChange, defaultValue, name, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || "")

    // Controlled vs Uncontrolled logic
    const actualValue = value !== undefined ? value : internalValue

    const handleChange = (v: string) => {
        setInternalValue(v)
        onValueChange?.(v)
    }

    return (
        <RadioGroupContext.Provider value={{ value: actualValue, onValueChange: handleChange, name }}>
            <div className={cn("grid gap-2", className)} ref={ref} {...props} />
        </RadioGroupContext.Provider>
    )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    const isChecked = context?.value === value

    return (
        <button
            type="button"
            role="radio"
            aria-checked={isChecked}
            data-state={isChecked ? "checked" : "unchecked"}
            value={value}
            className={cn(
                "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            onClick={() => context?.onValueChange?.(value)}
            ref={ref}
            {...props}
        >
            <span className={cn("flex items-center justify-center", isChecked ? "opacity-100" : "opacity-0")}>
                <Circle className="h-2.5 w-2.5 fill-current text-current" />
            </span>
            {/* Hidden input for form submission if name is present */}
            {context?.name && (
                <input
                    type="radio"
                    name={context.name}
                    value={value}
                    checked={isChecked}
                    readOnly
                    className="sr-only"
                    tabIndex={-1}
                />
            )}
        </button>
    )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
