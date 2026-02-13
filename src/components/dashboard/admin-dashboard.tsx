'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Activity, CheckCircle, Clock, FileStack,
    Eye, FileEdit, MoreHorizontal, Trash2, ArrowRight, Plus
} from 'lucide-react'
import {
    PieChart, Pie as RechartsPie, Cell, ResponsiveContainer, Tooltip, Legend, Sector
} from 'recharts'

// Cast Pie to bypass incomplete type definitions (activeIndex, onMouseLeave not in PieProps)
const Pie = RechartsPie as any
import { deleteAudit } from '@/lib/actions/audit'
import { toast } from 'sonner'

// ===== TYPES =====
type CardType = 'total' | 'active' | 'action' | 'certified'

interface AdminDashboardProps {
    audits: any[]
    pendingApplications: any[]
    firstName: string
}

// ===== STAT CARD CONFIG =====
const CARD_CONFIG: Record<CardType, {
    title: string
    subtitle: string
    icon: React.ElementType
    iconColor: string
    valueColor: string
    ringColor: string
    bgHover: string
}> = {
    total: {
        title: 'Tổng Dự Án',
        subtitle: 'Tất cả hồ sơ & dự án',
        icon: FileStack,
        iconColor: 'text-muted-foreground',
        valueColor: '',
        ringColor: 'ring-primary/40',
        bgHover: 'hover:border-primary/30',
    },
    action: { // Pending Deployment
        title: 'Chờ Triển Khai',
        subtitle: 'Chờ Assign hoặc Duyệt',
        icon: Clock,
        iconColor: 'text-orange-500',
        valueColor: 'text-orange-600',
        ringColor: 'ring-orange-400/40',
        bgHover: 'hover:border-orange-300',
    },
    active: { // Under Assessment
        title: 'Đang Đánh Giá',
        subtitle: 'Đang thực hiện Audit',
        icon: Activity,
        iconColor: 'text-blue-500',
        valueColor: 'text-blue-600',
        ringColor: 'ring-blue-400/40',
        bgHover: 'hover:border-blue-300',
    },
    certified: {
        title: 'Đã Chứng Nhận',
        subtitle: 'Đã hoàn thành cấp chứng chỉ',
        icon: CheckCircle,
        iconColor: 'text-green-500',
        valueColor: 'text-green-600',
        ringColor: 'ring-green-400/40',
        bgHover: 'hover:border-green-300',
    },
}

// ===== PIE CHART COLORS =====
const STATUS_COLORS: Record<string, string> = {
    // Legacy/Lower
    planned: '#94a3b8',
    ongoing: '#3b82f6',
    evaluation: '#8b5cf6',
    reviewing: '#f97316',
    certified: '#22c55e',
    completed: '#10b981',
    // DB Proper (Title Case)
    'Draft': '#94a3b8',
    'Submitted': '#f97316',
    'Under Review': '#3b82f6',
    'Needs Revision': '#eab308',
    'Accepted': '#10b981', // Ready for Assignment
    'Team Assigned': '#6366f1',
    'Audit In Progress': '#3b82f6',
    'Report Review': '#8b5cf6',
    'Certified': '#22c55e',
    'Rejected': '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
    planned: 'Đang lên kế hoạch',
    ongoing: 'Đang đánh giá',
    evaluation: 'Đang đánh giá',
    reviewing: 'Đang xem xét',
    certified: 'Đã chứng nhận',
    completed: 'Hoàn thành',
    // DB Proper
    'Draft': 'Nháp',
    'Submitted': 'Mới Nộp',
    'Under Review': 'Đang Xem Xét',
    'Needs Revision': 'Cần Bổ Sung',
    'Accepted': 'Đã Duyệt (Chờ Phân Công)',
    'Team Assigned': 'Đã Phân Công',
    'Audit In Progress': 'Đang Đánh Giá',
    'Report Review': 'Xem Xét Báo Cáo',
    'Certified': 'Đã Chứng Nhận',
    'Rejected': 'Từ Chối',
}

// ===== MAIN COMPONENT =====
export function AdminDashboard({ audits, pendingApplications, firstName }: AdminDashboardProps) {
    const router = useRouter()
    const [selectedCard, setSelectedCard] = useState<CardType>('total')
    const [selectedSlice, setSelectedSlice] = useState<string | null>(null)
    const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

    // Calculate stats
    const stats = useMemo(() => {
        const total = audits.length + pendingApplications.length

        // Active: Audit In Progress, Report Review, Team Assigned
        const activeStatuses = ['Team Assigned', 'Audit In Progress', 'Report Review', 'ongoing', 'evaluation']
        const active = audits.filter(a => activeStatuses.includes(a.status)).length

        // Action: Pending Apps (Submitted/UnderReview) + Accepted (Waiting Assignment)
        const actionStatuses = ['Accepted', 'planned']
        const actionRequired = pendingApplications.length + audits.filter(a => actionStatuses.includes(a.status)).length

        // Certified
        const certifiedStatuses = ['Certified', 'certified', 'completed']
        const certified = audits.filter(a => certifiedStatuses.includes(a.status)).length

        return { total, active, action: actionRequired, certified }
    }, [audits, pendingApplications])

    // Chart data
    const chartData = useMemo(() => {
        // Merge audits and pending for the chart
        const allItems = [...audits, ...pendingApplications]
        const statusCounts = allItems.reduce((acc: Record<string, number>, curr) => {
            const s = curr.status || 'Unknown'
            acc[s] = (acc[s] || 0) + 1
            return acc
        }, {})
        return Object.entries(statusCounts)
            .map(([status, count]) => ({
                name: STATUS_LABELS[status] || status,
                status,
                value: count as number,
                color: STATUS_COLORS[status] || '#cbd5e1',
            }))
            .filter(d => d.value > 0)
    }, [audits, pendingApplications])

    // Filtered audits/items based on selection
    const filteredAudits = useMemo(() => {
        const allItems = selectedCard === 'total' ? [...audits, ...pendingApplications] : audits
        // For 'action', we might want to show pendingApplications too if selected

        if (selectedCard === 'total') {
            if (selectedSlice) return allItems.filter(a => a.status === selectedSlice)
            return allItems
        }
        if (selectedCard === 'active') {
            return audits.filter(a => ['Team Assigned', 'Audit In Progress', 'Report Review', 'ongoing', 'evaluation'].includes(a.status))
        }
        if (selectedCard === 'certified') {
            return audits.filter(a => ['Certified', 'certified', 'completed'].includes(a.status))
        }
        if (selectedCard === 'action') {
            // Action card usually shows separate tables, but if we filter strictly:
            return [...pendingApplications, ...audits.filter(a => ['Accepted', 'planned'].includes(a.status))]
        }
        return audits
    }, [audits, pendingApplications, selectedCard, selectedSlice])

    const handleDelete = async (id: string, projectCode: string) => {
        if (!confirm(`Xóa đánh giá ${projectCode}? Hành động này không thể hoàn tác.`)) return
        const res = await deleteAudit(id)
        if (res.error) toast.error(res.error)
        else { toast.success('Đã xóa đánh giá'); router.refresh() }
    }

    const handleSliceClick = (data: any) => {
        setSelectedSlice(prev => prev === data.status ? null : data.status)
    }

    const handleCardClick = (card: CardType) => {
        setSelectedCard(card)
        setSelectedSlice(null)
        setActiveIndex(undefined)
    }

    // Custom active shape for pie chart
    const renderActiveShape = (props: any) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props
        return (
            <g>
                <text x={cx} y={cy - 8} textAnchor="middle" fill="currentColor" className="text-sm font-bold">
                    {value}
                </text>
                <text x={cx} y={cy + 12} textAnchor="middle" fill="#999" className="text-xs">
                    {payload.name}
                </text>
                <Sector
                    cx={cx} cy={cy}
                    innerRadius={innerRadius - 4}
                    outerRadius={outerRadius + 6}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', cursor: 'pointer' }}
                />
            </g>
        )
    }

    return (
        <div className="flex flex-col space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Xin chào, {firstName}. Tổng quan hệ thống PGL Audit.
                    </p>
                </div>
                <Link href="/audits/new">
                    <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" /> Xem Xét & Phân Công
                    </Button>
                </Link>
            </div>

            {/* ===== STAT CARDS ROW ===== */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Order: Total -> Action (Chờ Triển Khai) -> Active (Đang Đánh Giá) -> Certified */}
                {['total', 'action', 'active', 'certified'].map((key) => {
                    const k = key as CardType
                    const config = CARD_CONFIG[k]
                    const Icon = config.icon
                    const isSelected = selectedCard === k
                    const value = stats[k]

                    return (
                        <Card
                            key={k}
                            className={`cursor-pointer transition-all duration-200 ${config.bgHover} ${isSelected
                                ? `ring-2 ${config.ringColor} border-transparent shadow-md scale-[1.02]`
                                : 'hover:shadow-sm'
                                }`}
                            onClick={() => handleCardClick(k)}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
                                <Icon className={`h-4 w-4 ${config.iconColor}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${config.valueColor}`}>{value}</div>
                                <p className="text-xs text-muted-foreground">{config.subtitle}</p>
                                {isSelected && (
                                    <div className={`mt-2 h-0.5 rounded-full bg-current opacity-30`} />
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* ===== DYNAMIC CONTENT PANEL ===== */}
            <div className="animate-in fade-in slide-in-from-top-2 duration-300" key={selectedCard}>
                {selectedCard === 'total' && (
                    <TotalProgramsPanel
                        chartData={chartData}
                        filteredAudits={selectedSlice ? filteredAudits : audits}
                        selectedSlice={selectedSlice}
                        activeIndex={activeIndex}
                        onSliceClick={handleSliceClick}
                        onMouseEnter={setActiveIndex}
                        onMouseLeave={() => setActiveIndex(undefined)}
                        onDelete={handleDelete}
                        renderActiveShape={renderActiveShape}
                    />
                )}

                {selectedCard === 'active' && (
                    <ActivePanel
                        audits={filteredAudits}
                        onDelete={handleDelete}
                    />
                )}

                {selectedCard === 'action' && (
                    <ActionRequiredPanel
                        audits={filteredAudits}
                        pendingApplications={pendingApplications}
                        onDelete={handleDelete}
                    />
                )}

                {selectedCard === 'certified' && (
                    <CertifiedPanel
                        audits={filteredAudits}
                        onDelete={handleDelete}
                    />
                )}
            </div>
        </div>
    )
}

// ===== TOTAL PROGRAMS PANEL =====
function TotalProgramsPanel({
    chartData, filteredAudits, selectedSlice, activeIndex,
    onSliceClick, onMouseEnter, onMouseLeave, onDelete, renderActiveShape
}: any) {
    return (
        <div className="grid gap-6 lg:grid-cols-5">
            {/* Pie Chart */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-base">Phân Bố Trạng Thái</CardTitle>
                    <CardDescription>Nhấn vào biểu đồ để lọc danh sách</CardDescription>
                </CardHeader>
                <CardContent>
                    {chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                            Chưa có dữ liệu đánh giá
                        </div>
                    ) : (
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                        activeIndex={activeIndex}
                                        activeShape={renderActiveShape}
                                        onMouseEnter={(_: any, index: number) => onMouseEnter(index)}
                                        onMouseLeave={() => onMouseLeave()}
                                        onClick={(data: any) => onSliceClick(data)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {chartData.map((entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                stroke={selectedSlice === entry.status ? entry.color : 'transparent'}
                                                strokeWidth={selectedSlice === entry.status ? 3 : 0}
                                                opacity={selectedSlice && selectedSlice !== entry.status ? 0.3 : 1}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: 'none',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            fontSize: '13px'
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        wrapperStyle={{ fontSize: '12px', cursor: 'pointer' }}
                                        onClick={(data) => onSliceClick({ status: chartData.find((d: any) => d.name === data.value)?.status })}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Filtered List */}
            <Card className="lg:col-span-3">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base">
                            {selectedSlice ? `${STATUS_LABELS[selectedSlice] || selectedSlice}` : 'Tất Cả Dự Án'}
                        </CardTitle>
                        <CardDescription>
                            {filteredAudits.length} dự án
                            {selectedSlice && (
                                <button
                                    onClick={() => onSliceClick({ status: selectedSlice })}
                                    className="ml-2 text-primary underline text-xs"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <AuditTable audits={filteredAudits} onDelete={onDelete} compact />
                </CardContent>
            </Card>
        </div>
    )
}

// ===== ACTIVE PANEL =====
function ActivePanel({ audits, onDelete }: any) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Đang Đánh Giá & Thực Hiện
                </CardTitle>
                <CardDescription>
                    {audits.length} dự án đang trong quá trình đánh giá
                </CardDescription>
            </CardHeader>
            <CardContent>
                {audits.length === 0 ? (
                    <EmptyState message="Không có dự án nào đang chạy." />
                ) : (
                    <AuditTable audits={audits} onDelete={onDelete} showProgress />
                )}
            </CardContent>
        </Card>
    )
}

// ===== ACTION REQUIRED PANEL =====
function ActionRequiredPanel({ audits, pendingApplications, onDelete }: any) {
    return (
        <div className="space-y-6">
            {/* Pending Applications */}
            {pendingApplications.length > 0 && (
                <Card className="border-orange-200">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4 text-orange-500" />
                                Hồ Sơ Chờ Triển Khai
                            </CardTitle>
                            <CardDescription>
                                {pendingApplications.length} hồ sơ đang chờ xem xét hoặc phê duyệt
                            </CardDescription>
                        </div>
                        <Link href="/audits/new">
                            <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                                Xem Tất Cả <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sản Phẩm</TableHead>
                                    <TableHead>Khách Hàng</TableHead>
                                    <TableHead>Trạng Thái</TableHead>
                                    <TableHead>Ngày Nộp</TableHead>
                                    <TableHead className="text-right">Hành Động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingApplications.map((app: any) => (
                                    <TableRow key={app.id}>
                                        <TableCell className="font-medium">{app.product_name || 'N/A'}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {app.content?.companyInfo?.nameVn || app.content?.companyInfo?.nameEn || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                                                {STATUS_LABELS[app.status] || app.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {app.created_at ? new Date(app.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/review/${app.id}`}>
                                                <Button size="sm" variant="ghost" className="text-orange-600 h-7 text-xs">
                                                    Xem Xét <ArrowRight className="ml-1 h-3 w-3" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Audits needing action (if any) */}
            {audits.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Dự Án Cần Chú Ý</CardTitle>
                        <CardDescription>
                            {audits.length} dự án đang trong giai đoạn lập kế hoạch
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AuditTable audits={audits} onDelete={onDelete} showProgress />
                    </CardContent>
                </Card>
            )}

            {pendingApplications.length === 0 && audits.length === 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <EmptyState message="Không có hồ sơ nào cần xử lý." icon="✓" />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

// ===== CERTIFIED PANEL =====
function CertifiedPanel({ audits, onDelete }: any) {
    return (
        <Card className="border-green-200">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Dự Án Đã Chứng Nhận
                </CardTitle>
                <CardDescription>
                    {audits.length} dự án đã hoàn thành cấp chứng chỉ và đóng hồ sơ
                </CardDescription>
            </CardHeader>
            <CardContent>
                {audits.length === 0 ? (
                    <EmptyState message="Chưa có dự án nào nhận chứng chỉ." icon="🏆" />
                ) : (
                    <AuditTable audits={audits} onDelete={onDelete} />
                )}
            </CardContent>
        </Card>
    )
}

// ===== SHARED AUDIT TABLE =====
function AuditTable({ audits, onDelete, compact, showProgress }: {
    audits: any[], onDelete: (id: string, code: string) => void,
    compact?: boolean, showProgress?: boolean
}) {
    if (audits.length === 0) {
        return <EmptyState message="Không tìm thấy chương trình nào." />
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Mã Dự Án</TableHead>
                    <TableHead>Khách Hàng</TableHead>
                    {!compact && <TableHead className="hidden sm:table-cell">Tiêu Chuẩn</TableHead>}
                    {showProgress && <TableHead className="hidden md:table-cell text-center">Giai Đoạn</TableHead>}
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead className="text-right">Hành Động</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {audits.map((audit) => (
                    <TableRow key={audit.id} className="group hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                            <Link href={`/audits/${audit.id}/overview`} className="hover:text-primary transition-colors">
                                {audit.project_code}
                            </Link>
                        </TableCell>
                        <TableCell>
                            <div className="text-sm">{audit.client?.company_name || 'N/A'}</div>
                        </TableCell>
                        {!compact && (
                            <TableCell className="hidden sm:table-cell">
                                <Badge variant="secondary" className="font-normal text-xs">{audit.standard}</Badge>
                            </TableCell>
                        )}
                        {showProgress && (
                            <TableCell className="hidden md:table-cell text-center">
                                <div className="flex items-center justify-center gap-1">
                                    {['planned', 'ongoing', 'reviewing', 'certified'].map((step) => {
                                        const statusOrder = ['planned', 'ongoing', 'reviewing', 'certified', 'completed']
                                        const currentIdx = statusOrder.indexOf(audit.status)
                                        const stepIdx = statusOrder.indexOf(step)
                                        return (
                                            <div
                                                key={step}
                                                className={`h-1.5 w-6 rounded-full transition-colors ${stepIdx <= currentIdx ? 'bg-primary' : 'bg-gray-200'
                                                    }`}
                                                title={step}
                                            />
                                        )
                                    })}
                                </div>
                            </TableCell>
                        )}
                        <TableCell>
                            <Badge
                                variant={['certified', 'Certified'].includes(audit.status) ? 'default' : 'outline'}
                                className="capitalize text-xs"
                            >
                                {STATUS_LABELS[audit.status] || audit.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Hành Động</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/audits/${audit.id}/overview`} className="cursor-pointer">
                                            <Eye className="mr-2 h-4 w-4" /> Xem Tổng Quan
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/audits/${audit.id}/checklist`} className="cursor-pointer">
                                            <FileEdit className="mr-2 h-4 w-4" /> Checklist Đánh Giá
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-red-600 cursor-pointer"
                                        onClick={() => onDelete(audit.id, audit.project_code)}
                                        disabled={audit.status !== 'planned'}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Xóa Dự Án
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

// ===== EMPTY STATE =====
function EmptyState({ message, icon }: { message: string; icon?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            {icon && <span className="text-3xl mb-2">{icon}</span>}
            <p className="text-sm">{message}</p>
        </div>
    )
}
