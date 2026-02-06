import { createClient } from '@supabase/supabase-js'

const url = 'https://vqrtdkbwmwjgcnwadtrv.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcnRka2J3bXdqZ2Nud2FkdHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjA2MjMsImV4cCI6MjA4NTc5NjYyM30.zkUB7O63vEUbgJ7D6labWYlDeKEEnWBQ2p--8401wU4'

const supabase = createClient(url, key)

async function check() {
    const { count, error } = await supabase.from('audit_findings').select('*', { count: 'exact', head: true })
    if (error) {
        console.log(`AUDIT_FINDINGS_ERROR: ${error.message}`)
    } else {
        console.log(`AUDIT_FINDINGS_OK: ${count}`)
    }

    const { count: c2, error: e2 } = await supabase.from('findings').select('*', { count: 'exact', head: true })
    if (e2) {
        console.log(`FINDINGS_ERROR: ${e2.message}`)
    } else {
        console.log(`FINDINGS_OK: ${c2}`)
    }
}

check()
