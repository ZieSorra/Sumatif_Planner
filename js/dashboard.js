// ==========================================
// SUMATIF PLANNER — DASHBOARD
// Data bersumber dari Supabase; tidak memakai data contoh.
// ==========================================

async function getDashboardSchedules() {
    const user = await getCurrentUser();
    if (!user) throw new Error("User belum login.");

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
            academic_years ( name ),
            classes ( name, level ),
            subjects ( name, short_name )
        `)
        .eq("teacher_id", user.id)
        .neq("status", "cancelled")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

    if (error) {
        console.error("[Dashboard] Gagal mengambil jadwal:", error);
        throw error;
    }
    return data || [];
}

async function loadDashboard() {
    const list = document.getElementById("latestScheduleList");
    if (list) list.innerHTML = '<div class="latest-loading">Memuat jadwal...</div>';

    try {
        const schedules = await getDashboardSchedules();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthName = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

        setDashboardValue("dashboardToday", now.toLocaleDateString("id-ID", {
            weekday: "long", day: "numeric", month: "short", year: "numeric"
        }));
        setDashboardValue("dashboardMonthLabel", monthName);
        setDashboardValue("totalSchedule", schedules.length);

        const monthly = schedules.filter(item => {
            if (!item.date) return false;
            const d = parseDashboardDate(item.date);
            return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;

        const written = schedules.filter(item => item.assessment_type === "written").length;
        const practical = schedules.filter(item => item.assessment_type === "practical").length;

        setDashboardValue("monthlySchedule", monthly);
        setDashboardValue("writtenSchedule", written);
        setDashboardValue("practicalSchedule", practical);
        setDashboardValue("assessmentChartTotal", schedules.length);
        setDashboardValue("writtenCount", written);
        setDashboardValue("practicalCount", practical);
        setDashboardValue("writtenPercent", percentOf(written, schedules.length) + "% dari jadwal");
        setDashboardValue("practicalPercent", percentOf(practical, schedules.length) + "% dari jadwal");

        const writtenPercent = schedules.length ? (written / schedules.length) * 100 : 0;
        const practicalPercent = schedules.length ? (practical / schedules.length) * 100 : 0;
        const chart = document.getElementById("assessmentChart");
        if (chart) {
            chart.style.background = schedules.length
                ? `conic-gradient(#4f46e5 0% ${writtenPercent}%, #f59e0b ${writtenPercent}% 100%)`
                : "conic-gradient(#e8edf7 0% 100%)";
            chart.setAttribute("aria-label", `Jadwal tertulis ${written}, jadwal praktik ${practical}`);
        }

        setDashboardValue("distributionNote",
            schedules.length
                ? "Ringkasan berdasarkan " + schedules.length + " jadwal aktif."
                : "Belum ada jadwal aktif untuk ditampilkan."
        );

        renderLatestSchedules(schedules, today);
        console.log("[Dashboard] Berhasil dimuat:", schedules.length, "jadwal");
    } catch (error) {
        console.error("[Dashboard] Gagal memuat:", error);
        if (list) list.innerHTML = '<div class="latest-empty">Data dashboard belum dapat dimuat. Periksa koneksi, lalu coba muat ulang.</div>';
    }
}

function setDashboardValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function parseDashboardDate(value) {
    if (!value) return null;
    const parts = String(value).slice(0, 10).split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function percentOf(value, total) {
    return total ? Math.round((value / total) * 100) : 0;
}

function renderLatestSchedules(schedules, today = new Date()) {
    const container = document.getElementById("latestScheduleList");
    if (!container) return;

    const upcoming = schedules
        .filter(item => {
            const date = parseDashboardDate(item.date);
            return date && date >= today;
        })
        .sort((a, b) => {
            const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
            return dateCompare || String(a.start_time || "").localeCompare(String(b.start_time || ""));
        })
        .slice(0, 3);

    if (!upcoming.length) {
        container.innerHTML = '<div class="latest-empty">Belum ada jadwal sumatif mendatang.</div>';
        return;
    }

    container.innerHTML = upcoming.map(item => {
        const date = parseDashboardDate(item.date);
        const day = date.toLocaleDateString("id-ID", { day: "2-digit" });
        const month = date.toLocaleDateString("id-ID", { month: "short" });
        const subject = item.subjects?.name || "Mata pelajaran";
        const className = item.classes?.name || "Kelas belum tersedia";
        const time = item.start_time
            ? `${String(item.start_time).slice(0,5)}${item.end_time ? "–" + String(item.end_time).slice(0,5) : ""}`
            : "Waktu belum diatur";
        const type = item.assessment_type === "practical" ? "Praktik" : item.assessment_type === "written" ? "Tertulis" : "Jenis belum ditentukan";
        const status = item.status === "scheduled" ? "Terjadwal" : (item.status || "Aktif");
        return `
            <article class="latest-schedule-item">
                <div class="latest-date-box"><strong>${day}</strong><span>${month}</span></div>
                <div class="latest-subject">
                    <div class="latest-title-line"><strong>${escapeDashboardHtml(subject)}</strong><span class="latest-number">Sumatif ${escapeDashboardHtml(item.sumatif_number ?? "-")}</span><span class="latest-type-badge ${item.assessment_type === "practical" ? "is-practical" : ""}">${type}</span></div>
                    <div class="latest-meta"><span>▣ ${escapeDashboardHtml(className)}</span><span>◷ ${escapeDashboardHtml(time)}</span>${item.room ? `<span>⌂ ${escapeDashboardHtml(item.room)}</span>` : ""}</div>
                    ${item.material ? `<small>${escapeDashboardHtml(item.material)}</small>` : ""}
                </div>
                <span class="latest-status">${escapeDashboardHtml(status)}</span>
            </article>
        `;
    }).join("");
}

function escapeDashboardHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.getElementById("dashboardRefreshBtn")?.addEventListener("click", async () => {
    const button = document.getElementById("dashboardRefreshBtn");
    if (button) {
        button.disabled = true;
        button.classList.add("is-loading");
    }
    try {
        await loadDashboard();
    } finally {
        if (button) {
            button.disabled = false;
            button.classList.remove("is-loading");
        }
    }
});
