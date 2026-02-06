// Test Supabase API endpoints directly
// Run this in browser console on localhost:3001/audits/new

const testSupabaseAPI = async () => {
    const supabase = window.supabase || (await import('@/lib/supabase/client')).createClient()

    console.log('🧪 Testing Supabase API endpoints...')

    // Test 1: Certification Types
    console.log('\n📋 Test 1: Fetching certification_types...')
    const { data: certTypes, error: certError } = await supabase
        .from('certification_types')
        .select('*')
        .order('code')

    if (certError) {
        console.error('❌ Error:', certError)
    } else {
        console.log('✅ Success! Found', certTypes?.length, 'certification types:')
        console.table(certTypes)
    }

    // Test 2: Applied Standards
    console.log('\n📋 Test 2: Fetching applied_standards...')
    const { data: standards, error: stdError } = await supabase
        .from('applied_standards')
        .select('*')
        .eq('is_active', true)
        .order('code')

    if (stdError) {
        console.error('❌ Error:', stdError)
    } else {
        console.log('✅ Success! Found', standards?.length, 'standards:')
        console.table(standards)
    }

    // Test 3: Audit Products
    console.log('\n📋 Test 3: Fetching audit_products...')
    const { data: products, error: prodError } = await supabase
        .from('audit_products')
        .select('*')

    if (prodError) {
        console.error('❌ Error:', prodError)
    } else {
        console.log('✅ Success! Found', products?.length, 'products')
    }

    console.log('\n✨ Test complete!')
}

// Run test
testSupabaseAPI()
