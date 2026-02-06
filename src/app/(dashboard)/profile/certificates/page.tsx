import { getClientCertificates } from '@/lib/actions/certificates'
import { ClientCertificateList } from '@/components/profile/client-certificate-list'
import { Award } from 'lucide-react'

export default async function CertificatesPage() {
    const certificates = await getClientCertificates()

    return (
        <div className="container py-8 max-w-6xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Award className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
                    <p className="text-muted-foreground">
                        Manage and download your valid ISO/IEC 17065 certificates.
                    </p>
                </div>
            </div>

            <ClientCertificateList certificates={certificates} />
        </div>
    )
}
