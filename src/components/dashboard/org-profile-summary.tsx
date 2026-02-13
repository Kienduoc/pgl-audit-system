import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, MapPin, Phone, Globe, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface OrgProfileSummaryProps {
    profile: any
    org?: any
}

export function OrgProfileSummary({ profile, org }: OrgProfileSummaryProps) {
    return (
        <Card className="w-full shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
                <div className="flex items-center space-x-4">
                    {org?.logo_url && (
                        <Avatar className="h-10 w-10 border">
                            <AvatarImage src={org.logo_url} alt="Logo" />
                            <AvatarFallback>ORG</AvatarFallback>
                        </Avatar>
                    )}
                    <CardTitle className="text-lg font-medium">
                        Hồ Sơ Doanh Nghiệp
                    </CardTitle>
                </div>
                <Link href="/profile/settings">
                    <Button variant="ghost" size="sm" className="h-9 text-sm">
                        Chỉnh Sửa
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="p-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Company Name displayed in main header, removed here for redundancy */}

                    <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-full shrink-0">
                            <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">ĐỊA CHỈ</p>
                            <p className="text-base truncate" title={org?.office_address || org?.factory_address || profile?.address}>
                                {org?.office_address || org?.factory_address || profile?.address || "N/A"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-full shrink-0">
                            <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">LIÊN HỆ</p>
                            <p className="text-sm">{org?.contact_phone || profile?.phone || "N/A"}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-full shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">MÃ SỐ THUẾ</p>
                            <p className="text-sm">{org?.tax_code || "N/A"}</p>
                        </div>
                    </div>

                </div>
            </CardContent>
        </Card>
    )
}
