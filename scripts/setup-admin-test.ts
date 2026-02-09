
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) console.error('Missing SUPABASE_SERVICE_ROLE_KEY');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required env vars')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
    // 1. Get the latest user to promote to admin
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError || !users || users.length === 0) {
        console.error("No users found")
        return
    }

    // Pick the first user (usually the dev)
    const targetUser = users[0]
    console.log(`Promoting user ${targetUser.email} (${targetUser.id}) to ADMIN...`)

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            active_role: 'admin',
            roles: ['client', 'admin']
        })
        .eq('id', targetUser.id)

    if (updateError) {
        console.error("Failed to promote user:", updateError)
    } else {
        console.log("User promoted successfully.")
    }

    // 2. Seed Dummy Applications
    console.log("Seeding dummy applications...")
    const dummyApps = [
        {
            user_id: targetUser.id,
            project_code: 'APP-2024-001',
            status: 'submitted',
            content: {
                companyInfo: {
                    nameVi: "Công ty TNHH Thực Phẩm ABC",
                    nameEn: "ABC Food Co., Ltd",
                    taxId: "0101234567",
                    addressVi: "123 Đường Số 1, KCN Tân Bình, TP.HCM",
                    representative: "Nguyễn Văn A"
                },
                productInfo: {
                    name: "Bánh Tráng Trộn",
                    intendedUse: "Ăn liền"
                }
            }
        },
        {
            user_id: targetUser.id,
            project_code: 'APP-2024-002',
            status: 'submitted',
            content: {
                companyInfo: {
                    nameVi: "Công ty Cổ Phần Xây Dựng XYZ",
                    nameEn: "XYZ Construction JSC",
                    taxId: "0309876543",
                    addressVi: "456 Lê Văn Lương, Hà Nội",
                    representative: "Trần Thị B"
                },
                productInfo: {
                    name: "Gạch Không Nung",
                    intendedUse: "Xây dựng dân dụng"
                }
            }
        }
    ]

    for (const app of dummyApps) {
        const { error } = await supabase.from('audit_applications').insert(app)
        if (error) console.error("Error seeding app:", error.message)
        else console.log(`Seeded app ${app.project_code}`)
    }
}

main()
