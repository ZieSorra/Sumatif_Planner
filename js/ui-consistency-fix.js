/* =========================================================
   SUMATIF PLANNER - UI CONSISTENCY FIX
   - Dashboard latest schedules
   - Context filters start empty
   - Class filter follows selected academic year
   - Semester calendar spans the full semester
   - Hide injected Data Master outside its workspace
   ========================================================= */

(function () {
    const loaded = () => window.__uiConsistencyFixLoaded === true;

    if (loaded()) return;
    window.__uiConsistencyFixLoaded = true;

    function esc(value) {
        if (typeof escapeHtml === "function") return escapeHtml(value);
        return String(value ?? "").replace(/[&<>'"]/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
        }[c]));
    }

    function resetSelect(id) {
        const select = document.getElementById(id);
        if (select) select.value = "";
    }

    function resetScheduleFilters() {
        resetSelect("scheduleYearFilter");
        resetSelect("scheduleClassFilter");
        resetSelect("scheduleSemesterFilter");
    }

    function resetCalendarFilters() {
        resetSelect("calendarPlannerYear");
        resetSelect("calendarPlannerClass");
        resetSelect("calendarPlannerSemester");
        const grid = document.getElementById("calendarPlannerGrid");
        if (grid) grid.innerHTML = `<div class="calendar-planner-empty">Pilih Tahun Pelajaran, Kelas, dan Semester.</div>`;
        const title = document.getElementById("calendarPlannerMonthTitle");
        if (title) title.textContent = "-";
    }

    function resetReportFilters() {
        resetSelect("reportYear");
        resetSelect("reportClass");
        resetSelect("reportSemester");
        const wrap = document.getElementById("reportTableWrap");
        if (wrap) {
            wrap.className = "report-empty";
            wrap.textContent = "Pilih Tahun Pelajaran, Kelas, dan Semester.";
        }
        ["reportTotal", "reportWritten", "reportPractical"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = "0";
        });
    }

    async function loadClassesForYear(selectId, yearId) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = `<option value="">Pilih Kelas</option>`;
        if (!yearId) return;

        const { data, error } = await supabaseClient
            .from("classes")
            .select("id,name,level")
            .eq("academic_year_id", yearId)
            .eq("is_active", true)
            .order("level", { ascending: true })
            .order("name", { ascending: true });

        if (error) {
            console.error("[UI Fix] Gagal memuat kelas:", error);
            return;
        }

        (data || []).forEach(item => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.name;
            select.appendChild(option);
        });
    }

    function semesterMonthKeys(academicYearName, semester) {
        const match = String(academicYearName || "").match(/(20\d{2})\s*\/\s*(20\d{2})/);
        if (!match) return [];

        const startYear = Number(match[1]);
        const endYear = Number(match[2]);
        const keys = [];

        if (Number(semester) === 1) {
            for (let month = 5; month <= 11; month++) {
                keys.push(`${startYear}-${String(month + 1).padStart(2, "0")}`);
            }
        } else if (Number(semester) === 2) {
            for (let month = 0; month <= 5; month++) {
                keys.push(`${endYear}-${String(month + 1).padStart(2, "0")}`);
            }
        }

        return keys;
    }

    // Ganti helper kalender jadwal agar seluruh bulan semester selalu tampil.
    window.getCalendarMonthKeys = function () {
        const keys = semesterMonthKeys(scheduleContext?.academicYearName, scheduleContext?.semester);
        if (keys.length) return keys;

        const fallback = new Set();
        (scheduleCalendarDays || []).forEach(item => {
            const date = String(item.date || "").slice(0, 7);
            if (date.length === 7) fallback.add(date);
        });
        (scheduleSchedules || []).forEach(item => {
            const date = String(item.date || "").slice(0, 7);
            if (date.length === 7) fallback.add(date);
        });
        return [...fallback].sort();
    };

    // Dashboard: gunakan container HTML yang benar (#latestScheduleList).
    window.renderLatestSchedules = function (schedules) {
        const container = document.getElementById("latestScheduleContainer") || document.getElementById("latestScheduleList");
        if (!container) return;

        const list = Array.isArray(schedules) ? schedules : [];
        const todayKey = new Date().toISOString().slice(0, 10);
        const upcoming = list.filter(item => String(item.date || "").slice(0, 10) >= todayKey);
        const display = (upcoming.length ? upcoming : list).slice(0, 5);

        if (!display.length) {
            container.innerHTML = `<div class="dashboard-empty-state"><strong>Belum ada jadwal sumatif</strong><span>Jadwal yang Anda buat akan muncul di sini.</span></div>`;
            return;
        }

        const fallbackNote = upcoming.length ? "" : `<div class="dashboard-empty-note">Tidak ada jadwal mendatang. Berikut jadwal terbaru.</div>`;
        container.innerHTML = fallbackNote + display.map(item => `
            <div class="dashboard-schedule-item">
                <div class="dashboard-schedule-date">
                    <strong>${esc(new Date(String(item.date).slice(0,10) + "T00:00:00").getDate())}</strong>
                    <span>${esc(new Intl.DateTimeFormat("id-ID", {month:"short"}).format(new Date(String(item.date).slice(0,10) + "T00:00:00")))}</span>
                </div>
                <div class="dashboard-schedule-main">
                    <strong>${esc(item.subjects?.name || "Mata Pelajaran")}</strong>
                    <span>Sumatif ${esc(item.sumatif_number)} · ${esc(formatAssessmentType(item.assessment_type))}</span>
                    <small>${esc(item.material || "Tanpa uraian materi")}</small>
                </div>
                <div class="dashboard-schedule-time">${item.start_time && item.end_time ? `${esc(String(item.start_time).slice(0,5))}–${esc(String(item.end_time).slice(0,5))}` : "-"}</div>
            </div>
        `).join("");
    };

    function injectDashboardStyles() {
        if (document.getElementById("uiConsistencyDashboardStyles")) return;
        const style = document.createElement("style");
        style.id = "uiConsistencyDashboardStyles";
        style.textContent = `
            .dashboard-summary{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px!important}
            .summary-card{position:relative;overflow:hidden;min-height:105px;display:flex;flex-direction:column;justify-content:center;padding:18px 20px!important;border-radius:14px!important}
            .summary-card:after{content:"";position:absolute;right:-22px;bottom:-30px;width:80px;height:80px;border-radius:50%;background:rgba(23,92,211,.06)}
            .summary-value{font-size:28px!important;margin-top:7px}
            .latest-schedule-list{display:flex;flex-direction:column;gap:0;background:#fff;border:1px solid #e4e7ec;border-radius:14px;overflow:hidden}
            .dashboard-schedule-item{display:grid;grid-template-columns:62px minmax(0,1fr) auto;align-items:center;gap:14px;padding:14px 16px;border-bottom:1px solid #eef0f3}
            .dashboard-schedule-item:last-child{border-bottom:0}
            .dashboard-schedule-date{width:48px;height:48px;border-radius:12px;background:#eff6ff;color:#175cd3;display:flex;flex-direction:column;align-items:center;justify-content:center}
            .dashboard-schedule-date strong{font-size:18px;line-height:1}.dashboard-schedule-date span{font-size:10px;margin-top:2px;text-transform:uppercase}
            .dashboard-schedule-main{min-width:0}.dashboard-schedule-main strong{display:block;font-size:13px;color:#172033}.dashboard-schedule-main span{display:block;margin-top:3px;font-size:11px;color:#475467}.dashboard-schedule-main small{display:block;margin-top:4px;color:#667085;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
            .dashboard-schedule-time{font-size:11px;font-weight:700;color:#475467;white-space:nowrap}
            .dashboard-empty-note{padding:10px 16px;background:#fffaeb;color:#b54708;font-size:11px;border-bottom:1px solid #f2ead0}
            .dashboard-empty-state{padding:28px 18px;text-align:center;color:#667085}.dashboard-empty-state strong{display:block;color:#344054}.dashboard-empty-state span{display:block;margin-top:5px;font-size:12px}
            @media(max-width:900px){.dashboard-summary{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
            @media(max-width:560px){.dashboard-summary{grid-template-columns:1fr!important}.dashboard-schedule-item{grid-template-columns:52px minmax(0,1fr)}.dashboard-schedule-time{grid-column:2}.dashboard-schedule-date{width:42px;height:42px}}
        `;
        document.head.appendChild(style);
    }

    function hideMasterWhenLeaving() {
        document.addEventListener("click", event => {
            const menu = event.target.closest("[data-menu]");
            if (!menu) return;
            if (menu.dataset.menu !== "master") {
                document.getElementById("masterWorkspace")?.classList.add("hidden");
            }
        }, true);
    }

    function installScheduleYearFilter() {
        const select = document.getElementById("scheduleYearFilter");
        if (!select || select.dataset.uiFixBound) return;
        select.dataset.uiFixBound = "1";
        select.addEventListener("change", () => {
            const classSelect = document.getElementById("scheduleClassFilter");
            if (classSelect) classSelect.value = "";
            loadClassesForYear("scheduleClassFilter", select.value);
        }, true);
    }

    function installCalendarFilters() {
        const year = document.getElementById("calendarPlannerYear");
        if (year && !year.dataset.uiFixBound) {
            year.dataset.uiFixBound = "1";
            year.addEventListener("change", () => {
                const cls = document.getElementById("calendarPlannerClass");
                if (cls) cls.value = "";
                loadClassesForYear("calendarPlannerClass", year.value);
            }, true);
        }
    }

    function installReportFilters() {
        const year = document.getElementById("reportYear");
        if (year && !year.dataset.uiFixBound) {
            year.dataset.uiFixBound = "1";
            year.addEventListener("change", () => {
                const cls = document.getElementById("reportClass");
                if (cls) cls.value = "";
                loadClassesForYear("reportClass", year.value);
            }, true);
        }
    }

    function installNavigationResets() {
        document.addEventListener("click", event => {
            const menu = event.target.closest("[data-menu]");
            if (!menu) return;
            const target = menu.dataset.menu;
            if (target === "schedule") {
                setTimeout(() => {
                    resetScheduleFilters();
                    installScheduleYearFilter();
                }, 0);
            }
            if (target === "calendar") {
                setTimeout(() => {
                    resetCalendarFilters();
                    installCalendarFilters();
                }, 0);
            }
            if (target === "report") {
                setTimeout(() => {
                    resetReportFilters();
                    installReportFilters();
                }, 0);
            }
        }, true);
    }

    function patchCalendarOpen() {
        if (typeof window.openCalendarPlanner !== "function" || window.__calendarOpenUiFix) return;
        const original = window.openCalendarPlanner;
        window.openCalendarPlanner = async function () {
            const result = await original.apply(this, arguments);
            resetCalendarFilters();
            installCalendarFilters();
            return result;
        };
        window.__calendarOpenUiFix = true;
    }

    function boot() {
        injectDashboardStyles();
        hideMasterWhenLeaving();
        installNavigationResets();
        installScheduleYearFilter();
        installCalendarFilters();
        installReportFilters();
        patchCalendarOpen();

        // Pastikan dashboard yang sudah lebih dulu dirender memakai renderer baru.
        if (typeof loadDashboard === "function" && document.querySelector(".dashboard-home:not(.hidden)")) {
            loadDashboard().catch(error => console.error("[UI Fix] Dashboard refresh gagal:", error));
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
