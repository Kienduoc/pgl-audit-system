import { Suspense } from "react"
import { getUserProfile } from "@/lib/actions/audit-application"
import { ApplicationForm } from "@/components/audit/application-form"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default async function CreateAuditProgramPage() {
    const profile = await getUserProfile()

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6 pb-16">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Create Audit Program</h2>
                <p className="text-muted-foreground">
                    Submit a request for a new product certification scope.
                </p>
            </div>
            <Separator />

            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Instructions</AlertTitle>
                <AlertDescription>
                    Please fill in the product details carefully. You can add multiple products to a single application.
                    Company information is pre-filled from your profile but can be edited if necessary for this specific application.
                </AlertDescription>
            </Alert>

            <Suspense fallback={<div className="p-8 text-center">Loading profile...</div>}>
                <ApplicationForm companyProfile={profile} />
            </Suspense>
        </div>
    )
}
