const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env checks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Required environment variables missing.');
    console.error('Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node seeds/users.js');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedUsers() {
    const csvPath = path.join(process.cwd(), 'profiles_seed.csv');

    if (!fs.existsSync(csvPath)) {
        console.error(`File not found: ${csvPath}`);
        process.exit(1);
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    // Simple CSV parser (assuming no commas in fields for simplicity, or handle basic quotes)
    const rows = content.trim().split('\n');
    const headers = rows[0].split(',').map(h => h.trim());

    console.log(`Found ${rows.length - 1} users to process...`);

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].split(',').map(c => c.trim());
        if (row.length < headers.length) continue;

        const userData = {};
        headers.forEach((header, index) => {
            userData[header] = row[index];
        });

        try {
            console.log(`Processing: ${userData.email}`);

            // 1. Create Auth User (or get existing)
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                email: userData.email,
                password: 'password123', // Default temporary password
                email_confirm: true,
                user_metadata: { full_name: userData.full_name }
            });

            let userId = authUser?.user?.id;

            if (authError) {
                if (authError.message.includes('already been registered')) {
                    console.log(`  -> User exists, fetching ID...`);
                    // Try to look up profile to get ID, or assume we can update if we knew ID. 
                    // Admin API listUsers is expensive, better to just error or skip.
                    // For now, let's try to update profile by email ?? No, profile PK is ID.
                    // We can't easily get ID from email efficiently without listUsers.
                    // Allow manual "Invite" flow fallback or skip.
                    console.warn(`  -> Skipped Auth creation: ${authError.message}`);
                    // Attempt to fetch ID from RPC or just skip profile update for now if we can't get ID
                    continue;
                } else {
                    console.error(`  -> Auth Error: ${authError.message}`);
                    continue;
                }
            }

            if (userId) {
                // 2. Update Profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        role: userData.role,
                        company_name: userData.company_name,
                        phone: userData.phone,
                        full_name: userData.full_name
                    })
                    .eq('id', userId); // Profiles are auto-created by trigger usually? 
                // If explicit Insert is needed:
                // .upsert({ id: userId, ... })

                // Note: If you don't have a trigger `on auth.users insert -> insert public.profiles`, 
                // you MUST do an insert here.
                // Let's assume we do UPSERT to be safe.
                const { error: upsertError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        email: userData.email,
                        role: userData.role,
                        company_name: userData.company_name,
                        phone: userData.phone,
                        full_name: userData.full_name,
                        updated_at: new Date()
                    });

                if (upsertError) {
                    console.error(`  -> Profile Error: ${upsertError.message}`);
                } else {
                    console.log(`  -> Success! Role: ${userData.role}`);
                }
            }

        } catch (err) {
            console.error(`  -> Unexpected error: ${err.message}`);
        }
    }
}

seedUsers();
