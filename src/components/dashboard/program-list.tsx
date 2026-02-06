'use client'

import { deleteAudit } from '@/lib/actions/audit'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import Link from 'next/link'
import { MoreHorizontal, FileEdit, Trash2, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface ProgramListProps {
    audits: any[]
}

export function ProgramList({ audits }: ProgramListProps) {
    const router = useRouter()

    const handleDelete = async (id: string, projectCode: string) => {
        if (!confirm(`Are you sure you want to delete audit ${projectCode}? This cannot be undone.`)) return

        const res = await deleteAudit(id)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Audit deleted successfully')
            router.refresh()
        }
    }

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Assessment Programs</CardTitle>
                <CardDescription>
                    Detailed list of all PGL Audit programs.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project Code</TableHead>
                            <TableHead>Client / Organization</TableHead>
                            <TableHead className="hidden sm:table-cell">Standard</TableHead>
                            <TableHead className="hidden md:table-cell text-center">Stage</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {audits.map((audit) => (
                            <TableRow key={audit.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{audit.project_code}</span>
                                        <span className="text-xs text-muted-foreground md:hidden">{audit.standard}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-sm">
                                        {audit.client?.company_name || 'N/A'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{audit.client?.email}</div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                    <Badge variant="secondary" className="font-normal">{audit.standard}</Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-center">
                                    {/* Simple Stage Indicator */}
                                    <div className="flex items-center justify-center gap-1">
                                        {['planned', 'ongoing', 'reviewing', 'certified'].map((step, idx) => {
                                            const statusOrder = ['planned', 'ongoing', 'reviewing', 'certified', 'completed']
                                            const currentIdx = statusOrder.indexOf(audit.status)
                                            const stepIdx = statusOrder.indexOf(step)
                                            return (
                                                <div
                                                    key={step}
                                                    className={`h-2 w-8 rounded-full ${stepIdx <= currentIdx ? 'bg-primary' : 'bg-gray-200'}`}
                                                    title={step}
                                                />
                                            )
                                        })}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={audit.status === 'certified' ? 'default' : 'outline'}
                                        className="capitalize"
                                    >
                                        {audit.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/audits/${audit.id}/overview`} className="cursor-pointer">
                                                    <Eye className="mr-2 h-4 w-4" /> View Overview
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/audits/${audit.id}/checklist`} className="cursor-pointer">
                                                    <FileEdit className="mr-2 h-4 w-4" /> Audit Checklist
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-600 cursor-pointer"
                                                onClick={() => handleDelete(audit.id, audit.project_code)}
                                                disabled={audit.status !== 'planned'}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Program
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {audits.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                    No programs found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
