import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, CheckCircle, AlertCircle, Award } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardStats {
    totalApplications: number
    activeAudits: number
    certifiedProducts: number
    pendingActions: number
}

interface StatsGridProps {
    stats: DashboardStats
    activeTab: string
    onTabChange: (tab: string) => void
}

export function StatsGrid({ stats, activeTab, onTabChange }: StatsGridProps) {
    const cards = [
        {
            id: 'applications',
            title: 'Total Applications',
            value: stats.totalApplications,
            subtext: '+1 this month',
            icon: FileText,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            id: 'active_audits',
            title: 'Active Audits',
            value: stats.activeAudits,
            subtext: 'In progress',
            icon: AlertCircle,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        },
        {
            id: 'certificates',
            title: 'Certified Products',
            value: stats.certifiedProducts,
            subtext: 'Valid certificates',
            icon: Award,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        },
        {
            id: 'pending_actions',
            title: 'Pending Actions',
            value: stats.pendingActions,
            subtext: 'Requires attention',
            icon: CheckCircle,
            color: 'text-red-500',
            bg: 'bg-red-500/10'
        }
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <Card
                    key={card.id}
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md border-2",
                        activeTab === card.id ? "border-primary bg-primary/5" : "border-transparent"
                    )}
                    onClick={() => onTabChange(card.id)}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-medium">
                            {card.title}
                        </CardTitle>
                        <card.icon className={cn("h-6 w-6", card.color)} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{card.value}</div>
                        <p className="text-base text-muted-foreground mt-1">
                            {card.subtext}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
