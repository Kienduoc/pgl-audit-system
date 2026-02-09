import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const cookieStore = new Map<string, { value: string, options: CookieOptions }>()

        // Helper to parse cookies from request
        const requestCookies = new Map<string, string>()
        request.headers.get('cookie')?.split('; ').forEach(c => {
            const [name, value] = c.split('=')
            if (name) requestCookies.set(name, value)
        })

        const supabaseClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return Array.from(requestCookies.entries()).map(([name, value]) => ({
                            name,
                            value,
                        }))
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, { value, options })
                        })
                    },
                },
            }
        )

        const { error } = await supabaseClient.auth.exchangeCodeForSession(code)

        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'

            let redirectUrl = `${origin}${next}`
            if (!isLocalEnv && forwardedHost) {
                redirectUrl = `https://${forwardedHost}${next}`
            }

            const response = NextResponse.redirect(redirectUrl)

            // Apply the cookies captured in cookieStore to the response
            cookieStore.forEach(({ value, options }, name) => {
                response.cookies.set(name, value, options)
            })

            return response
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
