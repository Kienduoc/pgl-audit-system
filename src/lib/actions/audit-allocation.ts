'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ----- Types -----
export interface AuditApplication {
    id: string
    product_name: string
    status: string
    created_at: string
    reviewed_by: string | null
    reviewed_at: string | null
    review_notes: string | null
    revision_count: number
    content: any
    user_id: string
}

export interface AuditorProfile {
    id: string
    full_name: string
    role: string
    email: string
    organization: string | null
    position: string | null
}

export interface ReviewHistoryEntry {
    id: string
    application_id: string
    action: string
    performed_by: string
    notes: string | null
    previous_status: string | null
    new_status: string | null
    created_at: string
    performer?: {
        full_name: string
        email: string
    }
}

// ============================================================
//  FETCH ACTIONS
// ============================================================

/**
 * Fetches all applications pending review
 * Grouped by client (user_id) since one client can have multiple products
 */
export async function getAppsPendingReview() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('audit_applications')
        .select('id, product_name, status, created_at, content, user_id, review_notes, revision_count')
        .in('status', ['Submitted', 'submitted', 'Pending Review', 'Under Review'])
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching pending review apps:', error)
        return []
    }

    return (data || []) as unknown as AuditApplication[]
}

/**
 * Fetches all applications that have been accepted and are awaiting team assignment
 */
export async function getAppsAccepted() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('audit_applications')
        .select('id, product_name, status, created_at, content, user_id, reviewed_by, reviewed_at')
        .eq('status', 'Accepted')
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching accepted apps:', error)
        return []
    }

    return (data || []) as unknown as AuditApplication[]
}

/**
 * Fetches all applications that are in progress (Team Assigned or Audit In Progress)
 */
export async function getAppsInProgress() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('audit_applications')
        .select('id, product_name, status, created_at, content, user_id')
        .in('status', ['Team Assigned', 'Audit In Progress', 'Report Review', 'Allocating'])
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching in-progress apps:', error)
        return []
    }

    return (data || []) as unknown as AuditApplication[]
}

/**
 * Fetches a single application with full content for review
 */
export async function getApplicationDetail(applicationId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('audit_applications')
        .select('*')
        .eq('id', applicationId)
        .single()

    if (error) {
        console.error('Error fetching application detail:', error)
        return null
    }

    return data as unknown as AuditApplication
}

/**
 * Fetches profiles eligible to be auditors
 */
export async function getAvailableAuditors() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, email, organization, position')
        .in('role', ['admin', 'lead_auditor', 'auditor'])
        .order('full_name', { ascending: true })

    if (error) {
        console.error('Error fetching auditors:', error)
        return []
    }

    return (data || []) as unknown as AuditorProfile[]
}

/**
 * Fetches review history for an application
 */
export async function getReviewHistory(applicationId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('application_review_history')
        .select('*, performer:profiles!performed_by(full_name, email)')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching review history:', error)
        return []
    }

    return (data || []) as unknown as ReviewHistoryEntry[]
}

/**
 * Gets team members for an application 
 */
export async function getTeamForApplication(applicationId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('audit_teams')
        .select('*, member:profiles!user_id(full_name, email, organization, position)')
        .eq('audit_application_id', applicationId)

    if (error) {
        console.error('Error fetching team:', error)
        return []
    }

    return data || []
}

// ============================================================
//  MUTATION ACTIONS
// ============================================================

/**
 * Helper to add review history entry
 */
async function addReviewHistory(
    supabase: any,
    applicationId: string,
    action: string,
    performedBy: string,
    notes: string | null,
    previousStatus: string,
    newStatus: string
) {
    await supabase.from('application_review_history').insert({
        application_id: applicationId,
        action,
        performed_by: performedBy,
        notes,
        previous_status: previousStatus,
        new_status: newStatus,
    })
}

/**
 * Admin starts reviewing an application
 * Status: Submitted → Under Review
 */
export async function startReview(applicationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Get current status
    const { data: app } = await supabase
        .from('audit_applications')
        .select('status')
        .eq('id', applicationId)
        .single()

    if (!app) return { success: false, error: 'Application not found' }

    const previousStatus = app.status

    // Only transition from Submitted/Pending Review
    if (!['Submitted', 'submitted', 'Pending Review'].includes(previousStatus)) {
        return { success: false, error: `Cannot start review from status: ${previousStatus}` }
    }

    const { error } = await supabase
        .from('audit_applications')
        .update({
            status: 'Under Review',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId)

    if (error) {
        console.error('Error starting review:', error)
        return { success: false, error: error.message }
    }

    await addReviewHistory(supabase, applicationId, 'review_started', user.id, null, previousStatus, 'Under Review')

    revalidatePaths()
    return { success: true }
}

/**
 * Admin requests revision from client
 * Status: Under Review → Needs Revision
 */
export async function requestRevision(applicationId: string, reason: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    if (!reason || reason.trim().length === 0) {
        return { success: false, error: 'Reason is required when requesting revision' }
    }

    const { data: app } = await supabase
        .from('audit_applications')
        .select('status, revision_count')
        .eq('id', applicationId)
        .single()

    if (!app) return { success: false, error: 'Application not found' }

    const { error } = await supabase
        .from('audit_applications')
        .update({
            status: 'Needs Revision',
            review_notes: reason.trim(),
            revision_count: (app.revision_count || 0) + 1,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId)

    if (error) {
        console.error('Error requesting revision:', error)
        return { success: false, error: error.message }
    }

    await addReviewHistory(supabase, applicationId, 'revision_requested', user.id, reason.trim(), app.status, 'Needs Revision')

    revalidatePaths()
    return { success: true }
}

/**
 * Admin rejects an application
 * Status: Under Review → Rejected
 */
export async function rejectApplication(applicationId: string, reason: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    if (!reason || reason.trim().length === 0) {
        return { success: false, error: 'Reason is required when rejecting an application' }
    }

    const { data: app } = await supabase
        .from('audit_applications')
        .select('status')
        .eq('id', applicationId)
        .single()

    if (!app) return { success: false, error: 'Application not found' }

    const { error } = await supabase
        .from('audit_applications')
        .update({
            status: 'Rejected',
            review_notes: reason.trim(),
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId)

    if (error) {
        console.error('Error rejecting application:', error)
        return { success: false, error: error.message }
    }

    await addReviewHistory(supabase, applicationId, 'rejected', user.id, reason.trim(), app.status, 'Rejected')

    revalidatePaths()
    return { success: true }
}

/**
 * Admin accepts an application
 * Status: Under Review → Accepted
 */
export async function acceptApplication(applicationId: string, auditCode: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: app } = await supabase
        .from('audit_applications')
        .select('*')
        .eq('id', applicationId)
        .single()

    if (!app) return { success: false, error: 'Application not found' }

    if (app.status !== 'Under Review') {
        return { success: false, error: `Cannot accept from status: ${app.status}. Must be Under Review.` }
    }

    // 1. Create Audit Record
    const { error: auditError } = await supabase
        .from('audits')
        .insert({
            audit_code: auditCode,
            project_code: auditCode, // Auto-sync with legacy field if exists
            client_id: app.user_id,
            status: 'planned',
            standard: app.content?.products?.[0]?.standard || 'ISO 17065', // Fallback or pick from content
            scope: app.content?.products?.map((p: any) => p.name).join(', ') || app.product_name,
            created_at: new Date().toISOString()
        })

    if (auditError) {
        console.error('Error creating audit:', auditError)
        return { success: false, error: 'Failed to create audit: ' + auditError.message }
    }

    // 2. Update Application Status
    const { error } = await supabase
        .from('audit_applications')
        .update({
            status: 'Accepted',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            review_notes: null, // Clear any previous notes
        })
        .eq('id', applicationId)

    if (error) {
        console.error('Error accepting application:', error)
        return { success: false, error: error.message }
    }

    await addReviewHistory(supabase, applicationId, 'accepted', user.id, `Created Audit: ${auditCode}`, app.status, 'Accepted')

    revalidatePaths()
    return { success: true }
}

/**
 * Client re-submits after revision
 * Status: Needs Revision → Submitted
 */
export async function resubmitApplication(applicationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: app } = await supabase
        .from('audit_applications')
        .select('status, user_id')
        .eq('id', applicationId)
        .single()

    if (!app) return { success: false, error: 'Application not found' }

    // Only the owner can re-submit
    if (app.user_id !== user.id) {
        return { success: false, error: 'You can only resubmit your own applications' }
    }

    if (app.status !== 'Needs Revision') {
        return { success: false, error: `Cannot resubmit from status: ${app.status}` }
    }

    const { error } = await supabase
        .from('audit_applications')
        .update({
            status: 'Submitted',
            review_notes: null, // Clear notes after resubmission
        })
        .eq('id', applicationId)

    if (error) {
        console.error('Error resubmitting:', error)
        return { success: false, error: error.message }
    }

    await addReviewHistory(supabase, applicationId, 'resubmitted', user.id, null, 'Needs Revision', 'Submitted')

    revalidatePaths()
    return { success: true }
}

/**
 * Assigns an audit team to an accepted application
 * Status: Accepted → Team Assigned
 */
export async function allocateAuditTeam(
    applicationId: string,
    teamMembers: { userId: string, role: 'Lead Auditor' | 'Auditor' | 'Technical Expert' }[]
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Validate: Must have a Lead Auditor
    const hasLead = teamMembers.some(m => m.role === 'Lead Auditor')
    if (!hasLead) {
        return { success: false, error: 'A Lead Auditor is required.' }
    }

    // Get auditor profiles for organization info
    const auditorIds = teamMembers.map(m => m.userId)
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, organization')
        .in('id', auditorIds)

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    // Insert team members with organization info
    const rows = teamMembers.map(m => ({
        audit_application_id: applicationId,
        user_id: m.userId,
        role: m.role,
        organization: profileMap.get(m.userId)?.organization || null,
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
    }))

    // Remove existing team (in case of re-assignment)
    await supabase
        .from('audit_teams')
        .delete()
        .eq('audit_application_id', applicationId)

    const { error: teamError } = await supabase
        .from('audit_teams')
        .insert(rows)

    if (teamError) {
        console.error('Error inserting audit team:', teamError)
        return { success: false, error: teamError.message }
    }

    // Update application status
    const { error: statusError } = await supabase
        .from('audit_applications')
        .update({ status: 'Team Assigned' })
        .eq('id', applicationId)

    if (statusError) {
        console.error('Error updating status:', statusError)
        return { success: false, error: 'Team saved but failed to update status.' }
    }

    revalidatePaths()
    return { success: true }
}

// ============================================================
//  HELPER: Revalidate all relevant paths
// ============================================================
function revalidatePaths() {
    revalidatePath('/')
    revalidatePath('/audits/new')
    revalidatePath('/review')
    revalidatePath('/profile')
}
