'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createQuickApplication } from '@/lib/actions/audit-applications'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ClientAuditRequestFormProps {
    clientOrgId: string
}

export function ClientAuditRequestForm({ clientOrgId }: ClientAuditRequestFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({
        product_name: '',
        model_type: '',
        manufacturer_name: '',
        factory_location: '',
        applied_standard: '',
        certification_type: 'initial'
    })

    const handleSubmit = async () => {
        if (!data.product_name || !data.applied_standard) {
            toast.error("Please fill in all required fields marked with *")
            return
        }

        setLoading(true)
        const payload = {
            ...data,
            client_org_id: clientOrgId
        }

        const res = await createQuickApplication(payload)

        if (res?.error) {
            toast.error(res.error)
            setLoading(false)
        } else {
            toast.success("Audit request submitted successfully!")
            router.push('/profile')
            router.refresh()
        }
    }

    return (
        <div className="bg-card border rounded-lg p-6 space-y-6">
            <div>
                <h3 className="font-semibold text-lg">New Product Certification Application</h3>
                <p className="text-sm text-muted-foreground">Submit a request for a new audit scope or product.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Product Name</Label>
                    <Input
                        value={data.product_name}
                        onChange={e => setData({ ...data, product_name: e.target.value })}
                        placeholder="e.g. Electric Kettle"
                    />
                </div>
                <div>
                    <Label>Model / Type</Label>
                    <Input
                        value={data.model_type}
                        onChange={e => setData({ ...data, model_type: e.target.value })}
                        placeholder="e.g. EK-2024 Series"
                    />
                </div>
                <div>
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Certification Type</Label>
                    <Select
                        value={data.certification_type}
                        onValueChange={v => setData({ ...data, certification_type: v })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="initial">Initial Certification</SelectItem>
                            <SelectItem value="surveillance">Surveillance</SelectItem>
                            <SelectItem value="recertification">Re-certification</SelectItem>
                            <SelectItem value="extension">Scope Extension</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Manufacturer Name</Label>
                    <Input
                        value={data.manufacturer_name}
                        onChange={e => setData({ ...data, manufacturer_name: e.target.value })}
                        placeholder="If different from applicant"
                    />
                </div>
                <div>
                    <Label>Factory Location</Label>
                    <Input
                        value={data.factory_location}
                        onChange={e => setData({ ...data, factory_location: e.target.value })}
                        placeholder="Factory address"
                    />
                </div>
                <div className="col-span-2">
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Applied Standard</Label>
                    <Input
                        value={data.applied_standard}
                        onChange={e => setData({ ...data, applied_standard: e.target.value })}
                        placeholder="e.g. IEC 60335-1:2020"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                </Button>
            </div>
        </div>
    )
}
