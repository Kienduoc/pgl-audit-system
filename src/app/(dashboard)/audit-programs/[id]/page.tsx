
import { notFound } from "next/navigation"
import { getApplication } from "@/lib/actions/audit-application"
import { ApplicationForm } from "@/components/audit/application-form"
import { createClient } from "@/lib/supabase/server"

interface EditApplicationPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditApplicationPage(props: EditApplicationPageProps) {
    const params = await props.params
    const application = await getApplication(params.id)

    if (!application) {
        notFound()
    }

    // Fetch user profile for backup info
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let userProfile = null
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        userProfile = profile
    }

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Edit Audit Program</h2>
                    <p className="text-muted-foreground">
                        Update your application details.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full">
                <ApplicationForm
                    initialData={application}
                    companyProfile={userProfile}
                />
            </div>
        </div>
    )
}
