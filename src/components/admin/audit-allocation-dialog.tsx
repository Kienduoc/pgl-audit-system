'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, X, Building, Briefcase, UserCheck, Star, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { allocateAuditTeam, getTeamForApplication } from '@/lib/actions/audit-allocation'

interface TeamMember {
    userId: string
    role: 'Lead Auditor' | 'Auditor' | 'Technical Expert'
}

interface AuditAllocationDialogProps {
    application: any
    auditors: any[]
}

export function AuditAllocationDialog({ application, auditors }: AuditAllocationDialogProps) {
    const [open, setOpen] = useState(false)
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [isLoadingTeam, setIsLoadingTeam] = useState(false)

    React.useEffect(() => {
        if (open) {
            setIsLoadingTeam(true)
            getTeamForApplication(application.id)
                .then((data: any[]) => {
                    if (data && data.length > 0) {
                        // Map DB 'user_id' to TeamMember 'userId'
                        const mapped = data.map(d => ({
                            userId: d.user_id,
                            role: d.role as TeamMember['role']
                        }))
                        setTeamMembers(mapped)
                    }
                })
                .catch(console.error)
                .finally(() => setIsLoadingTeam(false))
        } else {
            // Reset state on close? Or keep it? usually reset if new app
        }
    }, [open, application.id])

    const clientName = application?.content?.companyInfo?.nameVn || application?.product_name || 'N/A'

    const addMember = (userId: string) => {
        if (teamMembers.find(m => m.userId === userId)) return
        setTeamMembers(prev => [...prev, { userId, role: 'Auditor' }])
    }

    const removeMember = (userId: string) => {
        setTeamMembers(prev => prev.filter(m => m.userId !== userId))
    }

    const updateRole = (userId: string, role: TeamMember['role']) => {
        setTeamMembers(prev => prev.map(m => m.userId === userId ? { ...m, role } : m))
    }

    const handleAllocate = async () => {
        if (teamMembers.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 thành viên')
            return
        }

        const hasLead = teamMembers.some(m => m.role === 'Lead Auditor')
        if (!hasLead) {
            toast.error('Phải có ít nhất 1 Trưởng Đoàn Đánh Giá')
            return
        }

        setIsSaving(true)
        try {
            const payload = teamMembers.map(m => ({
                userId: m.userId,
                role: m.role,
            }))
            const res = await allocateAuditTeam(application.id, payload)
            if (res.success) {
                toast.success('Đã phân công đoàn đánh giá', { description: `${teamMembers.length} thành viên được gán.` })
                setOpen(false)
                setTeamMembers([])
            } else {
                toast.error('Lỗi', { description: res.error })
            }
        } catch (e) {
            toast.error('Đã xảy ra lỗi unexpected')
        } finally {
            setIsSaving(false)
        }
    }

    const getRoleIcon = (role: string) => {
        if (role === 'Lead Auditor') return <Star className="h-3.5 w-3.5 text-amber-500" />
        if (role === 'Technical Expert') return <Wrench className="h-3.5 w-3.5 text-blue-500" />
        return <UserCheck className="h-3.5 w-3.5 text-green-500" />
    }

    const getRoleBadgeColor = (role: string) => {
        if (role === 'Lead Auditor') return 'bg-amber-100 text-amber-800 border-amber-200'
        if (role === 'Technical Expert') return 'bg-blue-100 text-blue-800 border-blue-200'
        return 'bg-green-100 text-green-800 border-green-200'
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                    <Users className="h-4 w-4" />
                    Phân Công Đoàn
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Phân Công Đoàn Đánh Giá</DialogTitle>
                    <DialogDescription>
                        Doanh nghiệp: <span className="font-medium text-foreground">{clientName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Auditor Search */}
                    <div>
                        <Label className="mb-2 block text-sm font-medium">Tìm Chuyên Gia Đánh Giá</Label>
                        <Command className="border rounded-lg">
                            <CommandInput placeholder="Tìm theo tên, email, đơn vị..." />
                            <CommandList className="max-h-[200px]">
                                <CommandEmpty>Không tìm thấy</CommandEmpty>
                                <CommandGroup>
                                    {auditors
                                        .filter(a => !teamMembers.find(m => m.userId === a.id))
                                        .map(auditor => (
                                            <CommandItem
                                                key={auditor.id}
                                                value={`${auditor.full_name} ${auditor.email} ${auditor.organization || ''}`}
                                                onSelect={() => addMember(auditor.id)}
                                                className="cursor-pointer py-3"
                                            >
                                                <div className="flex items-center gap-3 w-full">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                                                            {auditor.full_name?.charAt(0) || '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{auditor.full_name}</p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span>{auditor.email}</span>
                                                            {auditor.organization && (
                                                                <span className="flex items-center gap-1">
                                                                    <Building className="h-3 w-3" />
                                                                    {auditor.organization}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </div>

                    {/* Team Members List */}
                    <div>
                        <Label className="mb-2 block text-sm font-medium">
                            Đoàn Đánh Giá ({teamMembers.length} thành viên)
                        </Label>
                        <div className="border rounded-lg bg-muted/20 min-h-[150px] p-3">
                            {teamMembers.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">Chọn chuyên gia đánh giá từ danh sách bên trên</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {teamMembers.map((member) => {
                                        const profile = auditors.find(a => a.id === member.userId)
                                        if (!profile) return null
                                        return (
                                            <div key={member.userId} className="flex items-center gap-3 p-3 bg-background border rounded-lg">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                                                        {profile.full_name?.charAt(0) || '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{profile.full_name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        {profile.organization && (
                                                            <span className="flex items-center gap-1">
                                                                <Building className="h-3 w-3" />
                                                                {profile.organization}
                                                            </span>
                                                        )}
                                                        {profile.position && (
                                                            <span className="flex items-center gap-1">
                                                                <Briefcase className="h-3 w-3" />
                                                                {profile.position}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Select
                                                    value={member.role}
                                                    onValueChange={(v) => updateRole(member.userId, v as TeamMember['role'])}
                                                >
                                                    <SelectTrigger className="w-[180px] h-8">
                                                        <div className="flex items-center gap-1.5">
                                                            {getRoleIcon(member.role)}
                                                            <SelectValue />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Lead Auditor">
                                                            <span className="flex items-center gap-1.5">
                                                                <Star className="h-3 w-3 text-amber-500" />
                                                                Trưởng Đoàn
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value="Auditor">
                                                            <span className="flex items-center gap-1.5">
                                                                <UserCheck className="h-3 w-3 text-green-500" />
                                                                Đánh Giá Viên
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value="Technical Expert">
                                                            <span className="flex items-center gap-1.5">
                                                                <Wrench className="h-3 w-3 text-blue-500" />
                                                                Chuyên Gia Kỹ Thuật
                                                            </span>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                    onClick={() => removeMember(member.userId)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                        {teamMembers.length > 0 && !teamMembers.some(m => m.role === 'Lead Auditor') && (
                            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                ⚠️ Phải có ít nhất 1 Trưởng Đoàn Đánh Giá
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => { setOpen(false); setTeamMembers([]) }}
                        disabled={isSaving}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleAllocate}
                        disabled={teamMembers.length === 0 || isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isSaving ? 'Đang xử lý...' : `Phân Công (${teamMembers.length})`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
