/* =========================================================
   SUMATIF PLANNER - DATA MASTER SYNC
   Tahap 1: Tahun Pelajaran -> Kelas, dan hanya mapel aktif.
   Tidak mengubah struktur database maupun aturan jadwal.
   ========================================================= */

(function () {
    let installed = false;

    async function loadClassesForYear() {
        const select = document.getElementById("scheduleClassFilter");
        const yearSelect = document.getElementById("scheduleYearFilter");
        if (!select || !yearSelect) return;

        const yearId = yearSelect.value;
        const previousValue = select.value;

        select.disabled = true;
        select.innerHTML = '<option value="">Memuat kelas...</option>';

        if (!yearId) {
            select.innerHTML = '<option value="">Pilih Kelas</option>';
            select.disabled = false;
            return;
        }

        const { data, error } = await supabaseClient
            .from("classes")
            .select("id,name,level")
            .eq("academic_year_id", yearId)
            .eq("is_active", true)
            .order("level", { ascending: true })
            .order("name", { ascending: true });

        if (error) {
            console.error("[Schedule Master] Gagal memuat kelas:", error);
            select.innerHTML = '<option value="">Gagal memuat kelas</option>';
            select.disabled = false;
            return;
        }

        scheduleClasses = data || [];
        select.innerHTML = '<option value="">Pilih Kelas</option>';

        scheduleClasses.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.name;
            select.appendChild(option);
        });

        if (scheduleClasses.some(item => String(item.id) === String(previousValue))) {
            select.value = previousValue;
        }

        select.disabled = false;
        console.log("[Schedule Master] Kelas aktif untuk tahun terpilih:", scheduleClasses);
    }

    async function loadActiveSubjects() {
        const { data, error } = await supabaseClient
            .from("subjects")
            .select("id,name,short_name")
            .eq("is_active", true)
            .order("name", { ascending: true });

        if (error) {
            console.error("[Schedule Master] Gagal memuat mapel aktif:", error);
            return;
        }

        scheduleSubjects = data || [];
        console.log("[Schedule Master] Mapel aktif:", scheduleSubjects);
    }

    async function refreshContext() {
        await loadClassesForYear();
        await loadActiveSubjects();

        const year = document.getElementById("scheduleYearFilter");
        const cls = document.getElementById("scheduleClassFilter");
        const semester = document.getElementById("scheduleSemesterFilter");

        if (year && cls && semester && year.value && cls.value && semester.value && typeof handleScheduleContextChange === "function") {
            await handleScheduleContextChange();
        }
    }

    function install() {
        if (installed) return;
        const year = document.getElementById("scheduleYearFilter");
        const cls = document.getElementById("scheduleClassFilter");
        const semester = document.getElementById("scheduleSemesterFilter");
        if (!year || !cls || !semester || typeof supabaseClient === "undefined") return;

        installed = true;

        year.onchange = async function () {
            await loadClassesForYear();
            await handleScheduleContextChange();
        };

        loadActiveSubjects();
        loadClassesForYear();

        console.log("[Schedule Master] Integrasi Data Master aktif.");
    }

    function boot() {
        install();
        if (!installed) setTimeout(boot, 300);
    }

    boot();
})();
