import { createClient } from '@supabase/supabase-js'

const url = 'https://vqrtdkbwmwjgcnwadtrv.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcnRka2J3bXdqZ2Nud2FkdHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjA2MjMsImV4cCI6MjA4NTc5NjYyM30.zkUB7O63vEUbgJ7D6labWYlDeKEEnWBQ2p--8401wU4'

const supabase = createClient(url, key)

async function check() {
    console.log('--- START PROBE ---')

    console.log('1. Checking audit_findings...')
    const res1 = await supabase.from('audit_findings').select('*', { count: 'exact', head: true })
    console.log('audit_findings:', JSON.stringify(res1))

    console.log('2. Checking findings...')
    const res2 = await supabase.from('findings').select('*', { count: 'exact', head: true })
    console.log('findings:', JSON.stringify(res2))

    console.log('3. Checking audit_checklist_responses...')
    const res3 = await supabase.from('audit_checklist_responses').select('*', { count: 'exact', head: true })
    console.log('audit_checklist_responses:', JSON.stringify(res3))

    console.log('--- END PROBE ---')
}

check()
