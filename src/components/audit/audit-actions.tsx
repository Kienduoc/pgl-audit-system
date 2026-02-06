'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteAudit, updateAuditDate } from '@/lib/actions/audit'
import { toast } from 'sonner'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface AuditActionsProps {
    auditId: string
    currentDate: string | null
    status: string
    projectCode?: string
    standard?: string
}

export function AuditActions({ auditId, currentDate, status, projectCode, standard }: AuditActionsProps) {
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        audit_date: currentDate || '',
        product_name: '',
        model_type: '',
        brand_name: '',
    })

    // Only show actions for planned audits
    if (status !== 'planned') return null

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleEdit = async () => {
        setLoading(true)
        const result = await updateAuditDate(auditId, formData.audit_date)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Audit request updated successfully')
            setIsEditOpen(false)
        }
    }

    const handleDelete = async () => {
        setLoading(true)
        const result = await deleteAudit(auditId)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Audit request deleted')
            setIsDeleteOpen(false)
        }
    }

    // Format date to dd/MM/yyyy for display
    const formatDateDisplay = (dateStr: string | null) => {
        if (!dateStr) return 'N/A'
        try {
            return format(new Date(dateStr), 'dd/MM/yyyy')
        } catch {
            return dateStr
        }
    }

    return (
        <>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditOpen(true)}
                >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteOpen(true)}
                >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                </Button>
            </div>

            {/* Edit Dialog - Full Form */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Audit Request</DialogTitle>
                        <DialogDescription>
                            Update your audit request details. Only requests that haven't been verified can be edited.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs">Project Code (Read-only)</Label>
                            <Input value={projectCode} disabled />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs">Standard (Read-only)</Label>
                            <Input value={standard} disabled />
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="font-semibold mb-4">Product Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Product Name</Label>
                                    <Input
                                        name="product_name"
                                        value={formData.product_name}
                                        onChange={handleChange}
                                        placeholder="e.g. Steel Pipe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Model/Type</Label>
                                    <Input
                                        name="model_type"
                                        value={formData.model_type}
                                        onChange={handleChange}
                                        placeholder="e.g. DN100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Brand Name</Label>
                                    <Input
                                        name="brand_name"
                                        value={formData.brand_name}
                                        onChange={handleChange}
                                        placeholder="e.g. ABC Brand"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="font-semibold mb-4">Schedule</h3>
                            <div className="space-y-2">
                                <Label>Expected Audit Date <span className="text-red-500">*</span></Label>
                                <Input
                                    type="date"
                                    name="audit_date"
                                    value={formData.audit_date}
                                    onChange={handleChange}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Current: {formatDateDisplay(currentDate)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} disabled={loading || !formData.audit_date}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Audit Request</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this audit request? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
