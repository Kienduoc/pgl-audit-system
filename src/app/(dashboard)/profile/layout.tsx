import { authorize } from '@/lib/auth'

export default async function ProfileLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Only allow 'client' role to access /profile
    await authorize(['client'])

    return (
        <div className="w-full">
            {children}
        </div>
    )
}
