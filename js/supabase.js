// ==========================================
// SUPABASE CLIENT
// ==========================================

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

console.log("Supabase client berhasil dibuat.");
