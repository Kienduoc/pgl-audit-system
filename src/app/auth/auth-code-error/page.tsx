'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { AlertTriangle } from 'lucide-react'

// Separate component for Client-side usage of searchParams
function ErrorDetails() {
    const searchParams = useSearchParams()
    // Extract query parameters that might indicate the error
    // e.g., error=access_denied&error_code=... or similar from OAuth callback.
    // In our case, the callback route redirects WITHOUT query params (currently),
    // but we might want to pass error info later.
    const errorCode = searchParams.get('error_code')
    const errorDescription = searchParams.get('error_description') || "We couldn't verify your sign-in request."

    return (
        <CardDescription className="text-center">
            {errorDescription}
            {errorCode && <span className="block text-xs mt-2 text-muted-foreground">Error Code: {errorCode}</span>}
        </CardDescription>
    )
}

export default function AuthCodeError() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-red-100">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-red-50 p-3 rounded-full mb-3 w-fit">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">Authentication Failed</CardTitle>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<p className="text-center text-sm text-muted-foreground">Loading error details...</p>}>
                        <ErrorDetails />
                    </Suspense>
                    <p className="mt-4 text-sm text-muted-foreground text-center">
                        This usually happens if the sign-in link has expired or was already used. Please try signing in again.
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center pt-2">
                    <Button asChild className="w-full bg-red-600 hover:bg-red-700">
                        <Link href="/login">Return to Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
