'use client'

import { useState } from 'react'
import { Check, UserPlus, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { assignAuditTeam, AuditCandidate } from '@/lib/actions/audit-team'
import { toast } from 'sonner' // Assuming sonner is installed, based on list_dir. If not, use standard alert or logging.

interface TeamAssignmentDialogProps {
    auditId: string
    candidates: AuditCandidate[]
    currentLeadId?: string | null
    currentMembers?: string[]
}

export function TeamAssignmentDialog({
    auditId,
    candidates,
    currentLeadId,
    currentMembers = []
}: TeamAssignmentDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // State
    const [leadId, setLeadId] = useState<string>(currentLeadId || '')
    const [selectedMembers, setSelectedMembers] = useState<string[]>(currentMembers)

    const leads = candidates.filter(c => c.role === 'lead_auditor' || c.role === 'admin')
    const auditors = candidates // All candidates can be auditors? Usually lead can also be a member role, but let's allow all.

    const handleToggleMember = (userId: string) => {
        setSelectedMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleSave = async () => {
        if (!leadId) {
            alert("Please select a Lead Auditor") // Simple fallback
            return
        }

        setLoading(true)
        try {
            const result = await assignAuditTeam(auditId, leadId, selectedMembers)
            if (result.error) {
                alert(result.error)
            } else {
                setOpen(false)
                // Toast success?
            }
        } catch (error) {
            console.error(error)
            alert("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" /> Manage Team
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Assign Audit Team</DialogTitle>
                    <DialogDescription>
                        Designate a Lead Auditor and select team members for this project.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Lead Auditor Selection */}
                    <div className="grid gap-2">
                        <Label htmlFor="lead-auditor">Lead Auditor</Label>
                        <Select value={leadId} onValueChange={setLeadId}>
                            <SelectTrigger id="lead-auditor">
                                <SelectValue placeholder="Select Lead Auditor" />
                            </SelectTrigger>
                            <SelectContent>
                                {leads.map(lead => (
                                    <SelectItem key={lead.id} value={lead.id}>
                                        {lead.full_name} ({lead.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Team Members Selection */}
                    <div className="grid gap-2">
                        <Label>Audit Members</Label>
                        <div className="border rounded-md p-4">
                            <ScrollArea className="h-[200px]">
                                <div className="space-y-4">
                                    {candidates.map(candidate => (
                                        <div key={candidate.id} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`member-${candidate.id}`}
                                                checked={selectedMembers.includes(candidate.id)}
                                                onCheckedChange={() => handleToggleMember(candidate.id)}
                                            />
                                            <div className="flex items-center gap-3 flex-1">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{candidate.full_name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="grid gap-0.5 leading-none">
                                                    <label
                                                        htmlFor={`member-${candidate.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {candidate.full_name}
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {candidate.role} • {candidate.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Selected: {selectedMembers.length} members
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Assignments
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
