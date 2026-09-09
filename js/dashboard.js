async function getDashboardSchedules() {

    const user = await getCurrentUser();

    if (!user) {
        throw new Error("User belum login.");
    }

    const { data, error } = await supabaseClient
        .from("sumatif_schedules")
        .select(`
            id,
            sumatif_number,
            date,
            start_time,
            end_time,
            material,
            assessment_type,
            room,
            notes,
            status,
            academic_years (
                name
            ),
            classes (
                name,
                level
            ),
            subjects (
                name,
                short_name
            )
        `)
        .eq("teacher_id", user.id)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

    if (error) {
        console.error("Gagal mengambil jadwal:", error);
        throw error;
    }

    return data || [];
}
