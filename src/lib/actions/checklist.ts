'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAuditChecklist(auditId: string) {
    const supabase = await createClient()

    // 1. Get Templates
    const { data: templates, error: tempError } = await supabase
        .from('audit_checklist_templates')
        .select('*')
        .order('section', { ascending: true })
        .order('clause', { ascending: true })

    if (tempError) throw new Error(tempError.message)

    // 2. Get Existing Responses
    const { data: responses, error: respError } = await supabase
        .from('audit_checklist_responses')
        .select('*')
        .eq('audit_id', auditId)

    if (respError) throw new Error(respError.message)

    // 3. Get Findings manually to avoid relationship errors
    // We only need findings that are linked to these responses.
    const findingIds = responses?.filter(r => r.finding_id).map(r => r.finding_id) || []

    let findingsMap: Record<string, any> = {}

    if (findingIds.length > 0) {
        const { data: findings, error: findError } = await supabase
            .from('findings')
            .select('*')
            .in('id', findingIds)

        if (findError) {
            console.error('Error fetching linked findings:', findError)
            // validation shouldn't block main flow, but good to know
        } else {
            findings?.forEach(f => {
                findingsMap[f.id] = f
            })
        }
    }

    // Merge finding into response object
    const mergedResponses = responses?.map(r => ({
        ...r,
        finding: r.finding_id ? findingsMap[r.finding_id] : null
    })) || []

    return { templates, responses: mergedResponses }
}

export async function saveChecklistResponse(data: {
    audit_id: string
    template_id: string
    question_text: string
    clause_reference: string
    evidence_observation: string
    conclusion: 'pass' | 'fail' | 'observation'
    create_finding?: boolean
    finding_type?: string
    finding_description?: string
}) {
    const supabase = await createClient()
    const user = await supabase.auth.getUser()
    const userId = user.data.user?.id

    // 1. Handle Response (Manual Upsert due to missing unique constraint reliability)
    let responseId: string | null = null
    let currentFindingId: string | null = null

    // Check existing
    const { data: existingResponse, error: fetchError } = await supabase
        .from('audit_checklist_responses')
        .select('id, finding_id')
        .match({ audit_id: data.audit_id, template_id: data.template_id })
        .single()

    const payload = {
        audit_id: data.audit_id,
        template_id: data.template_id,
        question_text: data.question_text,
        clause_reference: data.clause_reference,
        evidence_observation: data.evidence_observation,
        conclusion: data.conclusion,
        auditor_id: userId,
        updated_at: new Date().toISOString()
    }

    if (existingResponse) {
        responseId = existingResponse.id
        currentFindingId = existingResponse.finding_id
        const { error: updateError } = await supabase
            .from('audit_checklist_responses')
            .update(payload)
            .eq('id', responseId)

        if (updateError) return { success: false, error: updateError.message }
    } else {
        const { data: newResponse, error: insertError } = await supabase
            .from('audit_checklist_responses')
            .insert(payload)
            .select('id')
            .single()

        if (insertError) return { success: false, error: insertError.message }
        responseId = newResponse.id
    }

    // 2. Handle Finding
    // If Fail, we need a finding
    if (data.conclusion === 'fail') {
        const findingPayload = {
            audit_id: data.audit_id,
            // We do NOT set checklist_response_id because the column doesn't exist on findings
            description: data.finding_description || data.evidence_observation,
            clause_reference: data.clause_reference,
            finding_type: 'non-conformity',
            severity: data.finding_type === '1' ? 'major' : (data.finding_type === '2' ? 'minor' : 'n/a'),
            created_by: userId,
            status: 'open',
            updated_at: new Date().toISOString()
        }

        if (currentFindingId) {
            // Update existing finding
            const { error: fError } = await supabase
                .from('findings')
                .update(findingPayload)
                .eq('id', currentFindingId)

            if (fError) {
                console.error('Error updating finding:', fError)
                return { success: false, error: 'Failed to update finding' }
            }
        } else {
            // Create new finding
            const { data: newFinding, error: fError } = await supabase
                .from('findings')
                .insert(findingPayload)
                .select('id')
                .single()

            if (fError) {
                console.error('Error creating finding:', fError)
                return { success: false, error: 'Failed to create finding' }
            }

            // Link finding back to response
            const { error: linkError } = await supabase
                .from('audit_checklist_responses')
                .update({ finding_id: newFinding.id })
                .eq('id', responseId)

            if (linkError) {
                console.error('Error linking finding:', linkError)
                // Critical error? Maybe not blocking but bad for data integrity
            }
        }
    } else {
        // If Pass/Observation, remove linked finding if exists?
        // Logic: If user toggles from Fail to Pass, we should probably delete the finding
        if (currentFindingId) {
            // Unlink first (optional but cleaner)
            await supabase
                .from('audit_checklist_responses')
                .update({ finding_id: null })
                .eq('id', responseId)

            // Delete finding
            await supabase
                .from('findings')
                .delete()
                .eq('id', currentFindingId)
        }
    }

    revalidatePath(`/audits/${data.audit_id}/checklist`)
    revalidatePath(`/audits/${data.audit_id}/findings`)
    return { success: true }
}
