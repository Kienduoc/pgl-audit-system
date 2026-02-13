
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

async function main() {
    const supabase = createClient(supabaseUrl, supabaseKey)

    const email = `client_${Date.now()}@test.com`
    const password = 'password123'

    console.log(`Creating user: ${email}`)

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password
    })

    let user = signupData.user
    let session = signupData.session

    if (signupError) {
        console.error('Signup Error:', signupError.message)
    }

    if (!session) {
        console.log('No session from signup, trying login...')
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (loginError) {
            console.error('Login Error:', loginError.message)
            return
        }
        session = loginData.session
        user = loginData.user
    }

    if (!session || !user) {
        console.error('Failed to authenticate.')
        return
    }

    console.log('Authenticated as:', user.id)

    // Create Org
    console.log('Creating organization...')
    const { data: org, error: orgError } = await supabase
        .from('client_organizations')
        .insert({
            english_name: `Client Corp ${Date.now()}`,
            profile_id: user.id,
            office_address: '123 Seed St'
        })
        .select()
        .single()

    if (orgError) {
        console.error('Org Creation Error:', orgError.message)
        // Check if profiles table exists and user is in it. 
        // Trigger might handle profile creation on auth.users insert.
        return
    }

    console.log('Organization created:', org.id)

    // Create Application
    console.log('Creating application...')
    const { data: app, error: appError } = await supabase
        .from('audit_applications')
        .insert({
            client_org_id: org.id,
            user_id: user.id,
            product_name: 'Seed Electric Kettle',
            model_type: 'SEK-SEED',
            manufacturer_name: 'Seed Factory',
            factory_location: 'Seed City',
            applied_standard: 'ISO 17065',
            certification_type: 'initial',
            status: 'Submitted',
            created_at: new Date().toISOString()
        })
        .select()
        .single()

    if (appError) {
        console.error('Application Creation Error:', appError.message)
    } else {
        console.log('SUCCESS: Application created.')
        console.log('App ID:', app.id)
        console.log('Comp Name:', `Client Corp ${Date.now()}`) // Approximate
    }
}

main()
