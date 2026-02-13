'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ClientSelector } from './client-selector'
import { ApplicationList } from './application-list'
import { QuickApplicationForm } from './quick-application-form'
import { getClientApplications, createQuickApplication, createAuditFromApplication } from '@/lib/actions/audit-applications'
import { Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAuditCandidates } from '@/lib/actions/audit-team'

export function AuditCreationWizard() {
    const router = useRouter()

    // Steps: 'CLIENT', 'APPLICATION', 'CONFIG'
    const [step, setStep] = useState<'CLIENT' | 'APPLICATION' | 'CONFIG'>('CLIENT')

    const [selectedClient, setSelectedClient] = useState<any>(null)
    const [selectedApplication, setSelectedApplication] = useState<any>(null)
    const [clientApplications, setClientApplications] = useState<any[]>([])

    const [isCreatingApp, setIsCreatingApp] = useState(false)
    const [loading, setLoading] = useState(false)

    // Config State
    const [auditConfig, setAuditConfig] = useState({
        audit_date: '',
        audit_type: 'initial',
        lead_auditor_id: ''
    })
    const [auditors, setAuditors] = useState<any[]>([])

    // Handlers
    const handleClientSelect = async (client: any) => {
        setLoading(true)
        setSelectedClient(client)

        // Fetch apps
        const { data } = await getClientApplications(client.id)
        if (data) setClientApplications(data)

        setStep('APPLICATION')
        setLoading(false)
    }

    const handleNewClient = async (clientData: any) => {
        // We handle new client actually via createQuickApplication usually, 
        // but here we just set it as a "Transient" client to be created along with app.
        // For simplicity, let's treat it as:
        // 1. Pass data to next step
        setSelectedClient({ ...clientData, isNew: true })
        setStep('APPLICATION')
        setIsCreatingApp(true) // Force new app creation since new client has none
    }

    const handleApplicationCreate = async (appData: any) => {
        setLoading(true)

        // If client is new, we need to handle that inside createQuickApplication
        const payload = {
            ...appData,
            client_org_id: selectedClient.isNew ? undefined : selectedClient.id,
            new_client_name: selectedClient.isNew ? selectedClient.english_name : undefined,
            new_client_tax_code: selectedClient.isNew ? selectedClient.tax_code : undefined,
            new_client_address: selectedClient.isNew ? selectedClient.office_address : undefined
        }

        const { data, error } = await createQuickApplication(payload)

        if (error) {
            alert("Error creating application: " + error)
            setLoading(false)
            return
        }

        setSelectedApplication(data)
        // If new client created, update local state
        if (selectedClient.isNew && data.client_org_id) {
            setSelectedClient({ ...selectedClient, id: data.client_org_id, isNew: false })
        }

        setAuditConfig(prev => ({
            ...prev,
            audit_type: data.certification_type // Pre-fill from app
        }))

        // Fetch auditors for next step
        const { data: auditorList } = await getAuditCandidates()
        if (auditorList) setAuditors(auditorList)

        setStep('CONFIG')
        setLoading(false)
    }

    const handleAuditCreate = async () => {
        setLoading(true)
        const res = await createAuditFromApplication(selectedApplication.id, auditConfig)

        if (res?.error) {
            alert(res.error)
            setLoading(false)
        } else if (res?.redirect) {
            router.push(res.redirect)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Progress Header */}
            <div className="flex justify-between items-center mb-8">
                <div className={`text-sm font-medium ${step === 'CLIENT' ? 'text-primary' : 'text-muted-foreground'}`}>1. Khách Hàng</div>
                <Separator className="w-10" />
                <div className={`text-sm font-medium ${step === 'APPLICATION' ? 'text-primary' : 'text-muted-foreground'}`}>2. Đơn Đăng Ký</div>
                <Separator className="w-10" />
                <div className={`text-sm font-medium ${step === 'CONFIG' ? 'text-primary' : 'text-muted-foreground'}`}>3. Cấu Hình</div>
            </div>

            {/* Step 1: Client Selection */}
            {step === 'CLIENT' && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold">Chọn Khách Hàng</h2>
                        <p className="text-muted-foreground">Đánh giá này dành cho ai?</p>
                    </div>
                    <ClientSelector onSelect={handleClientSelect} onNewClient={handleNewClient} />
                </div>
            )}

            {/* Step 2: Application Selection */}
            {step === 'APPLICATION' && (
                <div className="space-y-6">
                    <div className="flex justify-between">
                        <div>
                            <h2 className="text-xl font-bold">Thông Tin Đơn Đăng Ký</h2>
                            <p className="text-muted-foreground">Khách hàng: {selectedClient?.english_name}</p>
                        </div>
                        <Button variant="ghost" onClick={() => setStep('CLIENT')}>Đổi Khách Hàng</Button>
                    </div>

                    {isCreatingApp ? (
                        <QuickApplicationForm
                            onSubmit={handleApplicationCreate}
                            onCancel={() => {
                                if (selectedClient.isNew) setStep('CLIENT') // Cannot cancel if client is new
                                else setIsCreatingApp(false)
                            }}
                        />
                    ) : (
                        <ApplicationList
                            applications={clientApplications}
                            onSelect={async (app) => {
                                setLoading(true)
                                setSelectedApplication(app)
                                setAuditConfig(prev => ({ ...prev, audit_type: app.certification_type }))
                                const { data: auditorList } = await getAuditCandidates() // Fetch auditors
                                if (auditorList) setAuditors(auditorList)
                                setStep('CONFIG')
                                setLoading(false)
                            }}
                            onCreateNew={() => setIsCreatingApp(true)}
                        />
                    )}
                </div>
            )}

            {/* Step 3: Configuration */}
            {step === 'CONFIG' && (
                <div className="space-y-6">
                    <div className="flex justify-between">
                        <div>
                            <h2 className="text-xl font-bold">Cấu Hình Đánh Giá</h2>
                            <p className="text-muted-foreground">Hoàn tất chi tiết đánh giá trước khi tạo.</p>
                        </div>
                        <Button variant="ghost" onClick={() => setStep('APPLICATION')}>Quay Lại</Button>
                    </div>

                    <div className="bg-muted p-4 rounded-lg space-y-2 mb-6 text-sm">
                        <div className="flex justify-between"><span>Khách Hàng:</span> <span className="font-medium">{selectedClient?.english_name}</span></div>
                        <div className="flex justify-between"><span>Sản Phẩm:</span> <span className="font-medium">{selectedApplication?.product_name}</span></div>
                        <div className="flex justify-between"><span>Tiêu Chuẩn:</span> <span className="font-medium">{selectedApplication?.applied_standard}</span></div>
                        <div className="flex justify-between"><span>Loại Đơn:</span> <Badge>{selectedApplication?.certification_type}</Badge></div>
                    </div>

                    <div className="grid gap-4 bg-card border p-6 rounded-lg">
                        <div>
                            <Label>Loại Đánh Giá</Label>
                            <Select
                                value={auditConfig.audit_type}
                                onValueChange={v => setAuditConfig({ ...auditConfig, audit_type: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="initial">Đánh Giá Lần Đầu</SelectItem>
                                    <SelectItem value="surveillance">Đánh Giá Giám Sát</SelectItem>
                                    <SelectItem value="reassessment">Đánh Giá Lại</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Ngày Đánh Giá Dự Kiến</Label>
                            <Input
                                type="date"
                                value={auditConfig.audit_date}
                                onChange={e => setAuditConfig({ ...auditConfig, audit_date: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Trưởng Đoàn Đánh Giá</Label>
                            <Select
                                value={auditConfig.lead_auditor_id}
                                onValueChange={v => setAuditConfig({ ...auditConfig, lead_auditor_id: v })}
                            >
                                <SelectTrigger><SelectValue placeholder="Chọn Trưởng Đoàn" /></SelectTrigger>
                                <SelectContent>
                                    {auditors.map((a: any) => (
                                        <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button className="w-full" size="lg" onClick={handleAuditCreate} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Tạo Chương Trình Đánh Giá
                    </Button>
                </div>
            )}

            {loading && (
                <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
        </div>
    )
}

function Badge({ children, className }: any) {
    return <span className={`px-2 py-0.5 rounded text-xs border bg-background ${className}`}>{children}</span>
}
