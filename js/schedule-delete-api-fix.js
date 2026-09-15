/* =========================================================
   SUMATIF PLANNER - DELETE API FIX
   Isolasi soft-delete agar request PATCH selalu membawa
   apikey + Authorization. Tidak mengubah alur fitur lain.
   ========================================================= */
(function () {
    if (window.__scheduleDeleteApiFixInstalled) return;
    window.__scheduleDeleteApiFixInstalled = true;

    window.performScheduleDeleteApi = async function (id) {
        const item = typeof findScheduleById === "function" ? findScheduleById(id) : null;
        if (!item) throw new Error("Jadwal tidak ditemukan.");

        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;

        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/sumatif_schedules?id=eq.${encodeURIComponent(item.id)}`,
            {
                method: "PATCH",
                headers: {
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                body: JSON.stringify({ status: "cancelled" })
            }
        );

        if (!response.ok) {
            const raw = await response.text();
            let message = raw || `HTTP ${response.status}`;
            try {
                const parsed = JSON.parse(raw);
                message = parsed.message || parsed.error_description || parsed.hint || message;
            } catch (_) {}
            throw new Error(message);
        }

        return response.json().catch(() => []);
    };

    console.log("[Schedule] Delete API fix aktif.");
})();
