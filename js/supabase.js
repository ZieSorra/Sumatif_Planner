// ==========================================
// SUPABASE CLIENT
// ==========================================

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            // Keep the authenticated session across page refreshes.
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

console.log("Supabase client berhasil dibuat.");
