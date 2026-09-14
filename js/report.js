/* =========================================================
   SUMATIF PLANNER - LAPORAN SUMATIF
   Ringkasan dan daftar jadwal berdasarkan konteks guru.
   ========================================================= */

(function () {
    if (window.__sumatifReportInstalled) return;
    window.__sumatifReportInstalled = true;

    const state = { years: [], classes: [], schedules: [], yearId: "", classId: "", semester: 1 };

    const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
    const subjectName = id => (typeof scheduleSubjects !== "undefined" ? scheduleSubjects : []).find(x => String(x.id) === String(id))?.name || "Mata Pelajaran";
    const fmtDate = value => new Intl.DateTimeFormat("id-ID", {day:"2-digit", month:"short", year:"numeric"}).format(new Date(String(value).slice(0,10) + "T00:00:00"));
    const fmtTime = value => value ? String(value).slice(0,5) : "-";

    function injectMenu() {
        if (document.querySelector('[data-menu="report"]')) return;
        const calendar = document.querySelector('[data-menu="calendar"]');
        if (!calendar) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sidebar-menu";
        button.dataset.menu = "report";
        button.innerHTML = '<span class="sidebar-icon">▥</span><span>Laporan</span>';
        calendar.insertAdjacentElement("afterend", button);
    }

    function ensureStyles() {
        if (document.getElementById("sumatifReportStyles")) return;
        const style = document.createElement("style");
        style.id = "sumatifReportStyles";
        style.textContent = `
            .sumatif-report{padding:22px;max-width:1200px;margin:0 auto}.sumatif-report.hidden{display:none}
            .report-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}.report-head h2{margin:0 0 5px;font-size:22px}.report-head p{margin:0;color:#667085;font-size:13px}.report-actions{display:flex;gap:8px}
            .report-filters{display:grid;grid-template-columns:1.2fr 1fr .8fr;gap:14px;background:#fff;border:1px solid #e4e7ec;border-radius:14px;padding:16px;margin-bottom:18px}.report-filter label{display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:#344054}.report-filter select{width:100%;min-height:40px;border:1px solid #d0d5dd;border-radius:8px;padding:0 10px;background:#fff}
            .report-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}.report-stat{background:#fff;border:1px solid #e4e7ec;border-radius:12px;padding:14px}.report-stat span{display:block;color:#667085;font-size:11px}.report-stat strong{display:block;font-size:20px;margin-top:4px}
            .report-card{background:#fff;border:1px solid #e4e7ec;border-radius:14px;overflow:hidden}.report-card-head{padding:15px 18px;border-bottom:1px solid #eaecf0;font-weight:700}.report-table{width:100%;border-collapse:collapse}.report-table th,.report-table td{padding:10px 12px;border-bottom:1px solid #eaecf0;text-align:left;font-size:12px}.report-table th{background:#f9fafb;color:#475467}.report-table tr:last-child td{border-bottom:0}.report-type{display:inline-block;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:700;background:#eff8ff;color:#175cd3}.report-type.practical{background:#ecfdf3;color:#027a48}.report-empty{text-align:center;padding:35px;color:#667085}
            @media(max-width:700px){.report-filters,.report-summary{grid-template-columns:1fr}.report-head{display:block}.report-actions{margin-top:12px}.report-table{min-width:760px}.report-card{overflow:auto}}
            @media print{.app-header,.app-sidebar,.report-filters,.report-actions{display:none!important}.sumatif-report{display:block!important;padding:8mm;width:100%;max-width:none}.report-summary{grid-template-columns:repeat(3,1fr)}.report-card{border:1px solid #999}}
        `;
        document.head.appendChild(style);
    }

    function ensureWorkspace() {
        let workspace = document.getElementById("sumatifReportWorkspace");
        if (workspace) return workspace;
        const main = document.querySelector(".app-content");
        if (!main) return null;
        workspace = document.createElement("section");
        workspace.id = "sumatifReportWorkspace";
        workspace.className = "sumatif-report hidden";
        workspace.innerHTML = `
            <div class="report-head"><div><h2>Laporan Sumatif</h2><p>Rekap jadwal sumatif berdasarkan tahun pelajaran, kelas, dan semester.</p></div><div class="report-actions"><button type="button" class="secondary-button" id="reportRefresh">Muat Ulang</button><button type="button" class="primary-button" id="reportPrint">Cetak Laporan</button></div></div>
            <div class="report-filters"><div class="report-filter"><label>Tahun Pelajaran</label><select id="reportYear"><option value="">Pilih Tahun Pelajaran</option></select></div><div class="report-filter"><label>Kelas</label><select id="reportClass"><option value="">Pilih Kelas</option></select></div><div class="report-filter"><label>Semester</label><select id="reportSemester"><option value="1">Ganjil</option><option value="2">Genap</option></select></div></div>
            <div class="report-summary"><div class="report-stat"><span>Total Jadwal</span><strong id="reportTotal">0</strong></div><div class="report-stat"><span>Tes Tertulis</span><strong id="reportWritten">0</strong></div><div class="report-stat"><span>Tes Praktik</span><strong id="reportPractical">0</strong></div></div>
            <div class="report-card"><div class="report-card-head">Daftar Jadwal</div><div id="reportTableWrap" class="report-empty">Pilih Tahun Pelajaran dan Kelas.</div></div>`;
        main.appendChild(workspace);
        ensureStyles();
        bindEvents();
        return workspace;
    }

    async function loadContext() {
        const { data: years, error: ye } = await supabaseClient.from("academic_years").select("id,name").order("name", {ascending:false});
        if (ye) throw ye;
        const { data: classes, error: ce } = await supabaseClient.from("classes").select("id,name").order("name", {ascending:true});
        if (ce) throw ce;
        state.years = years || []; state.classes = classes || [];
        const ys = document.getElementById("reportYear"), cs = document.getElementById("reportClass");
        if (!ys || !cs) return;
        ys.innerHTML = '<option value="">Pilih Tahun Pelajaran</option>' + state.years.map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("");
        cs.innerHTML = '<option value="">Pilih Kelas</option>' + state.classes.map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("");
        if (typeof scheduleContext !== "undefined") { state.yearId = scheduleContext.academicYearId || ""; state.classId = scheduleContext.classId || ""; state.semester = Number(scheduleContext.semester || 1); }
        ys.value = state.yearId; cs.value = state.classId; document.getElementById("reportSemester").value = String(state.semester);
    }

    async function loadSchedules() {
        if (!state.yearId || !state.classId) { state.schedules = []; render(); return; }
        const user = await getCurrentUser(); if (!user) return;
        const { data, error } = await supabaseClient.from("sumatif_schedules").select("id,academic_year_id,semester,class_id,subject_id,teacher_id,sumatif_number,date,start_time,end_time,material,assessment_type,room,notes,status").eq("academic_year_id",state.yearId).eq("semester",state.semester).eq("class_id",state.classId).eq("teacher_id",user.id).neq("status","cancelled").order("date",{ascending:true}).order("start_time",{ascending:true});
        if (error) throw error; state.schedules = data || []; render();
    }

    function render() {
        const list = state.schedules || [];
        document.getElementById("reportTotal").textContent = list.length;
        document.getElementById("reportWritten").textContent = list.filter(x => x.assessment_type === "written").length;
        document.getElementById("reportPractical").textContent = list.filter(x => x.assessment_type === "practical").length;
        const wrap = document.getElementById("reportTableWrap");
        if (!list.length) { wrap.className = "report-empty"; wrap.innerHTML = "Belum ada jadwal untuk konteks ini."; return; }
        wrap.className = "";
        wrap.innerHTML = `<table class="report-table"><thead><tr><th>Tanggal</th><th>Sumatif</th><th>Mata Pelajaran</th><th>Materi</th><th>Waktu</th><th>Jenis</th><th>Status</th></tr></thead><tbody>${list.map(item => `<tr><td>${esc(fmtDate(item.date))}</td><td>Sumatif ${item.sumatif_number}</td><td>${esc(subjectName(item.subject_id))}</td><td>${esc(item.material || "-")}</td><td>${esc(fmtTime(item.start_time))}–${esc(fmtTime(item.end_time))}</td><td><span class="report-type ${item.assessment_type === "practical" ? "practical" : ""}">${item.assessment_type === "practical" ? "Tes Praktik" : "Tes Tertulis"}</span></td><td>${esc(item.status || "scheduled")}</td></tr>`).join("")}</tbody></table>`;
    }

    async function refreshReport() {
        const button = document.getElementById("reportRefresh");
        if (!button) return;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = "Memuat...";
        try {
            // Re-read the current context so newly added/edited schedules are reflected.
            const yearSelect = document.getElementById("reportYear");
            const classSelect = document.getElementById("reportClass");
            const semesterSelect = document.getElementById("reportSemester");
            state.yearId = yearSelect?.value || state.yearId;
            state.classId = classSelect?.value || state.classId;
            state.semester = Number(semesterSelect?.value || state.semester || 1);
            await loadSchedules();
            if (typeof showAppDialog === "function") {
                showAppDialog("Data laporan berhasil diperbarui.", "success", "Laporan Diperbarui");
            }
        } catch (error) {
            console.error("[Report] Gagal memuat ulang:", error);
            if (typeof showAppDialog === "function") {
                showAppDialog("Gagal memuat ulang laporan: " + error.message, "error", "Laporan");
            }
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    function bindEvents() {
        document.getElementById("reportYear")?.addEventListener("change", async e => { state.yearId = e.target.value; await loadSchedules(); });
        document.getElementById("reportClass")?.addEventListener("change", async e => { state.classId = e.target.value; await loadSchedules(); });
        document.getElementById("reportSemester")?.addEventListener("change", async e => { state.semester = Number(e.target.value); await loadSchedules(); });
        document.getElementById("reportRefresh")?.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            refreshReport();
        });
        document.getElementById("reportPrint")?.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            window.print();
        });
    }

    async function openReport() {
        const workspace = ensureWorkspace();
        if (!workspace) return;
        document.querySelectorAll(".dashboard-home").forEach(x => x.classList.add("hidden"));
        document.getElementById("scheduleWorkspace")?.classList.add("hidden");
        document.getElementById("calendarPlannerWorkspace")?.classList.add("hidden");
        workspace.classList.remove("hidden");
        document.querySelectorAll(".sidebar-menu").forEach(btn => btn.classList.toggle("active", btn.dataset.menu === "report"));
        if (!state.years.length) await loadContext();
        await loadSchedules();
    }

    function closeReport() { document.getElementById("sumatifReportWorkspace")?.classList.add("hidden"); }

    document.addEventListener("click", event => {
        const menu = event.target.closest("[data-menu]");
        if (!menu) return;
        const target = menu.dataset.menu;
        if (target === "report") openReport().catch(error => { console.error("[Report]", error); if (typeof showAppDialog === "function") showAppDialog("Gagal memuat laporan: " + error.message, "error", "Laporan"); });
        if (target === "dashboard") closeReport();
        if (target === "schedule") closeReport();
        if (target === "calendar") closeReport();
    });

    function boot() { injectMenu(); ensureWorkspace(); }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true}); else boot();
})();