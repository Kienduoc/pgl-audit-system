'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { updateFindingStatus, updateFindingDetails, deleteFinding } from '@/lib/actions/findings'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Finding {
    id: string
    grade: string // major, minor, observation
    description: string
    clause_reference: string
    status: string // open, closed, approved, rejected
    evidence?: string
    checklist_item?: {
        section: string
        requirement: string
    }
}

interface Props {
    initialFindings: Finding[]
    userRole?: string
}

export default function AuditFindingsManager({ initialFindings, userRole }: Props) {
    const [findings, setFindings] = useState(initialFindings)
    const [editingFinding, setEditingFinding] = useState<Finding | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Helper to refresh data (client-side opt update + server revalidate done in action)
    // Actually next.js actions revalidate path, so we expect server render update if it was page. 
    // But since this is client component, we rely on router refresh or local state.
    // Let's rely on revalidatePath refreshing the page data prop if parent re-renders? 
    // Usually standard is: Action -> Revalidate -> Router.refresh()

    // For MVP, simplistic state update + toast.

    const handleStatusChange = async (id: string, newStatus: any) => {
        try {
            const res = await updateFindingStatus(id, newStatus)
            if (res.success) {
                toast.success(`Status updated to ${newStatus}`)
                // Optimistic update
                setFindings(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f))
            } else {
                toast.error(res.error)
            }
        } catch (e) {
            toast.error('Failed to update status')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this finding?')) return

        try {
            const res = await deleteFinding(id)
            if (res.success) {
                toast.success('Finding deleted')
                setFindings(prev => prev.filter(f => f.id !== id))
            } else {
                toast.error(res.error)
            }
        } catch (e) {
            toast.error('Delete failed')
        }
    }

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingFinding) return
        setIsSubmitting(true)

        try {
            const form = e.target as HTMLFormElement
            const formData = new FormData(form)

            const details = {
                description: formData.get('description') as string,
                type: formData.get('grade') as string,
                clause: formData.get('clause') as string
            }

            const res = await updateFindingDetails(editingFinding.id, details)
            if (res.success) {
                toast.success('Details updated')
                setFindings(prev => prev.map(f => f.id === editingFinding.id ? { ...f, ...details, grade: details.type || f.grade } : f))
                setEditingFinding(null)
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error('Failed to save')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Non-Conformities & Findings</CardTitle>
                        <CardDescription>Review, approve, and manage audit findings.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-base font-bold text-slate-900">Grade</TableHead>
                            <TableHead className="text-base font-bold text-slate-900">Clause / Requirement</TableHead>
                            <TableHead className="text-base font-bold text-slate-900">Description</TableHead>
                            <TableHead className="text-base font-bold text-slate-900">Status</TableHead>
                            <TableHead className="text-right text-base font-bold text-slate-900">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {findings.map((f) => (
                            <TableRow key={f.id} className={f.status === 'rejected' ? 'opacity-50 bg-gray-50' : ''}>
                                <TableCell className="text-base">
                                    <Badge variant={
                                        f.grade === 'major' ? 'destructive' :
                                            f.grade === 'minor' ? 'default' : 'secondary'
                                    } className={cn(f.grade === 'minor' && "bg-orange-500 hover:bg-orange-600")}>
                                        {f.grade}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-base">
                                    <div className="font-semibold text-base">{f.clause_reference}</div>
                                    <div className="text-sm text-slate-600 w-64 truncate">
                                        {f.checklist_item?.section || f.checklist_item?.requirement || 'Manual Entry'}
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-md text-base">
                                    <p className="line-clamp-2">{f.description}</p>
                                </TableCell>
                                <TableCell className="text-base">
                                    <Badge variant="outline" className={cn(
                                        f.status === 'open' && "border-blue-500 text-blue-700 bg-blue-50",
                                        f.status === 'approved' && "border-green-500 text-green-700 bg-green-50",
                                        f.status === 'closed' && "border-gray-500 text-gray-700 bg-gray-50",
                                        f.status === 'rejected' && "border-red-200 text-red-700 bg-red-50 line-through"
                                    )}>
                                        {f.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setEditingFinding(f)}>
                                            <Pencil className="h-4 w-4 text-gray-500" />
                                        </Button>

                                        {/* Status Actions */}
                                        {userRole !== 'client' && (
                                            <>
                                                {f.status !== 'approved' && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleStatusChange(f.id, 'approved')} title="Approve">
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                )}
                                                {f.status !== 'rejected' && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleStatusChange(f.id, 'rejected')} title="Reject">
                                                        <XCircle className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </>
                                        )}

                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(f.id)}>
                                            <Trash2 className="h-4 w-4 text-rose-400" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            {/* Edit Modal */}
            <Dialog open={!!editingFinding} onOpenChange={() => setEditingFinding(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Finding</DialogTitle>
                    </DialogHeader>
                    {editingFinding && (
                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Clause Reference</Label>
                                    <Input name="clause" defaultValue={editingFinding.clause_reference} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Grade</Label>
                                    <Select name="grade" defaultValue={editingFinding.grade}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="major">Major NC</SelectItem>
                                            <SelectItem value="minor">Minor NC</SelectItem>
                                            <SelectItem value="observation">Observation</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea name="description" defaultValue={editingFinding.description} rows={5} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditingFinding(null)}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    )
}
