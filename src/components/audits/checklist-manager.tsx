'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { CheckCircle, Plus, Search, Save, AlertTriangle } from 'lucide-react'
import { saveChecklistResponse } from '@/lib/actions/checklist'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
    auditId: string
    templates: any[]
    initialResponses: any[]
}

export default function AuditChecklistManager({ auditId, templates, initialResponses }: Props) {
    const [responses, setResponses] = useState(initialResponses)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Filter out templates that already have a response? 
    // Maybe not, auditor might want to edit? 
    // For now, let's just allow searching all.

    const handleSelectTemplate = (template: any) => {
        setSelectedTemplate(template)
        // Reset form or load existing response if any?
        // Ideally we check if there is an existing response
        // const existing = responses.find(r => r.template_id === template.id)
        // setFormState(existing .....)
    }

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedTemplate) return

        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const conclusion = formData.get('conclusion') as string
        const observation = formData.get('observation') as string
        const findingType = formData.get('finding_type') as string
        const findingDesc = formData.get('finding_description') as string

        try {
            const result = await saveChecklistResponse({
                audit_id: auditId,
                template_id: selectedTemplate.id,
                question_text: selectedTemplate.question,
                clause_reference: selectedTemplate.clause,
                evidence_observation: observation,
                conclusion: conclusion as any,
                create_finding: conclusion === 'fail',
                finding_type: findingType,
                finding_description: findingDesc
            })

            if (result.success) {
                toast.success('Ghi nhận thành công')
                setIsDialogOpen(false)
                setSelectedTemplate(null)
                // In a real app we'd append to responses
                window.location.reload()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Lưu thất bại')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center space-y-4">
                <div className="bg-blue-100 p-4 rounded-full">
                    <Search className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Bắt Đầu Đánh Giá</h3>
                    <p className="text-slate-500 max-w-md mx-auto mt-2">
                        Tìm kiếm điều khoản hoặc yêu cầu để đánh giá. Ghi nhận là Đạt hoặc Không Đạt.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="mt-4">
                            <Plus className="mr-2 h-4 w-4" />
                            Đánh Giá Yêu Cầu (+ Phát Hiện)
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Chọn Yêu Cầu Đánh Giá</DialogTitle>
                        </DialogHeader>

                        {!selectedTemplate ? (
                            <Command className="rounded-lg border shadow-md">
                                <CommandInput placeholder="Tìm kiếm điều khoản (vd: 4.1) hoặc từ khóa..." />
                                <CommandList className="max-h-[60vh]">
                                    <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
                                    <CommandGroup heading="Yêu Cầu">
                                        {templates.map((t) => (
                                            <CommandItem
                                                key={t.id}
                                                onSelect={() => handleSelectTemplate(t)}
                                                className="p-4 cursor-pointer hover:bg-slate-50"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-blue-600 text-sm mb-1">
                                                        {t.clause} - {t.section}
                                                    </span>
                                                    <span className="text-sm text-slate-700">
                                                        {t.question}
                                                    </span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-6 pt-4">
                                <div className="bg-slate-50 p-4 rounded-md border text-sm">
                                    <span className="font-semibold block mb-1 text-blue-700">
                                        {selectedTemplate.clause} - {selectedTemplate.section}
                                    </span>
                                    <p className="text-slate-800">{selectedTemplate.question}</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label>Quan Sát / Bằng Chứng</Label>
                                        <Textarea
                                            name="observation"
                                            required
                                            placeholder="Mô tả những gì bạn quan sát được..."
                                            className="mt-1.5 min-h-[100px]"
                                        />
                                    </div>

                                    <div>
                                        <Label className="mb-2 block">Kết Luận</Label>
                                        <RadioGroup name="conclusion" defaultValue="pass" className="flex space-x-4">
                                            <div className="flex items-center space-x-2 border p-3 rounded-md w-full cursor-pointer hover:bg-slate-50 has-[:checked]:border-green-500 has-[:checked]:bg-green-50/50">
                                                <RadioGroupItem value="pass" id="pass" />
                                                <Label htmlFor="pass" className="cursor-pointer font-medium text-green-700 flex items-center">
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Hoàn Toàn Tuân Thủ
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2 border p-3 rounded-md w-full cursor-pointer hover:bg-slate-50 has-[:checked]:border-red-500 has-[:checked]:bg-red-50/50">
                                                <RadioGroupItem value="fail" id="fail" />
                                                <Label htmlFor="fail" className="cursor-pointer font-medium text-red-700 flex items-center">
                                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                                    Không Tuân Thủ
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {/* Conditional Finding Fields - we can use CSS has selector or simple state */}
                                    <div className="hidden has-[:checked]:block animate-in fade-in slide-in-from-top-2 p-4 border border-red-200 bg-red-50/30 rounded-lg space-y-4">
                                        <div className="flex items-center gap-2 text-red-700 font-medium pb-2 border-b border-red-200">
                                            <AlertTriangle className="h-4 w-4" />
                                            Ghi Nhận Chi Tiết Phát Hiện
                                        </div>

                                        <div>
                                            <Label>Loại Phát Hiện</Label>
                                            <Select name="finding_type" defaultValue="minor">
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="major">Lỗi Nặng (Major)</SelectItem>
                                                    <SelectItem value="minor">Lỗi Nhẹ (Minor)</SelectItem>
                                                    <SelectItem value="observation">Lưu Ý (Observation)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Mô Tả Phát Hiện</Label>
                                            <Textarea
                                                name="finding_description"
                                                placeholder="Mô tả chính thức về phát hiện..."
                                                className="mt-1.5 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setSelectedTemplate(null)}
                                    >
                                        Hủy
                                    </Button>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? 'Đang Lưu...' : 'Lưu Đánh Giá'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            {/* List of recorded responses? */}
            {responses.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-4">Đánh Giá Đã Ghi Nhận ({responses.length})</h3>
                    <div className="grid gap-3">
                        {responses.map((res: any, i: number) => (
                            <Card key={i} className="overflow-hidden">
                                <div className={cn(
                                    "p-4 border-l-4 flex justify-between items-start",
                                    res.conclusion === 'pass' ? "border-l-green-500" : "border-l-red-500"
                                )}>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-600 mb-1">
                                            {res.clause}
                                        </div>
                                        <div className="font-medium text-slate-900 mb-2">
                                            {res.question_text || res.template_id}
                                        </div>
                                        <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                                            {res.evidence_observation}
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        {res.conclusion === 'pass' ? (
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">Đạt</span>
                                        ) : (
                                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">Không Đạt</span>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
