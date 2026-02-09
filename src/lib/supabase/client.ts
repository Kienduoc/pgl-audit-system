import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // DEBUG: Check if env vars are correct in production
    if (typeof window !== 'undefined') {
        console.log('[DEBUG-CLIENT] SB URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        console.log('[DEBUG-CLIENT] SB KEY (first 10 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10))
    }
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
