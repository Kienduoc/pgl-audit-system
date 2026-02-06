import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-6">
                <ShieldAlert className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">403</h1>
            <h2 className="text-2xl font-semibold tracking-tight mb-4">Access Denied</h2>
            <p className="text-muted-foreground max-w-md mb-8">
                You do not have permission to access this resource. Please contact your administrator if you believe this is a mistake.
            </p>
            <div className="flex gap-4">
                <Button asChild variant="default">
                    <Link href="/">Return Home</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/login">Switch Account</Link>
                </Button>
            </div>
        </div>
    )
}
