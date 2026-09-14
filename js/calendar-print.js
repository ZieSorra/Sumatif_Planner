/* =========================================================
   SUMATIF PLANNER - PRINT LAYOUT
   F4 portrait, 2 pages, optimized for up to 15 subjects.
   ========================================================= */

(function bootCalendarPrint() {
    if (window.__calendarPrintInstalled) return;
    window.__calendarPrintInstalled = true;

    function esc(value) {
        if (typeof calendarPlannerEscape === "function") return calendarPlannerEscape(value);
        return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
    }

    function subjectName(id) {
        const list = typeof scheduleSubjects !== "undefined" ? scheduleSubjects : [];
        return list.find(x => String(x.id) === String(id))?.name || "Mata Pelajaran";
    }

    function subjectCode(id) {
        const list = typeof scheduleSubjects !== "undefined" ? scheduleSubjects : [];
        const item = list.find(x => String(x.id) === String(id));
        return item?.code || "";
    }

    function fmtDate(value) {
        const d = new Date(String(value).slice(0, 10) + "T00:00:00");
        return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(d);
    }

    function fmtTime(value) {
        return value ? String(value).slice(0, 5) : "";
    }

    function semesterLabel(semester) {
        return Number(semester) === 2 ? "Genap" : "Ganjil";
    }

    function semesterMonths(semester) {
        return Number(semester) === 2
            ? [0, 1, 2, 3, 4, 5]
            : [6, 7, 8, 9, 10, 11];
    }

    function getAcademicYearName() {
        const state = typeof calendarPlannerState !== "undefined" ? calendarPlannerState : {};
        return state.years?.find(x => String(x.id) === String(state.yearId))?.name || "";
    }

    function getClassName() {
        const state = typeof calendarPlannerState !== "undefined" ? calendarPlannerState : {};
        return state.classes?.find(x => String(x.id) === String(state.classId))?.name || "";
    }

    function buildMonth(month, calendarYear, schedules) {
        const first = new Date(calendarYear, month, 1);
        const days = new Date(calendarYear, month + 1, 0).getDate();
        const start = (first.getDay() + 6) % 7;
        const prevDays = new Date(calendarYear, month, 0).getDate();
        const monthName = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(first);
        const key = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const scheduleKeys = new Set((schedules || []).map(x => String(x.date).slice(0, 10)));
        const cells = [];
        const heads = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

        heads.forEach((h, i) => cells.push(`<div class="print-week ${i === 5 ? "print-saturday-head" : i === 6 ? "print-sunday-head" : ""}">${h}</div>`));
        for (let i = 0; i < start; i++) {
            const day = prevDays - start + i + 1;
            cells.push(`<div class="print-day print-muted"><span>${day}</span></div>`);
        }
        for (let d = 1; d <= days; d++) {
            const dateKey = key(calendarYear, month, d);
            const dow = (new Date(calendarYear, month, d).getDay() + 6) % 7;
            const saturday = dow === 5;
            const sunday = dow === 6;
            const scheduled = scheduleKeys.has(dateKey);
            cells.push(`<div class="print-day ${saturday ? "print-saturday" : sunday ? "print-sunday" : ""} ${scheduled ? "print-scheduled" : ""}"><span>${d}</span></div>`);
        }
        while (cells.length < 49) cells.push(`<div class="print-day print-muted"></div>`);
        return `<section class="print-month"><div class="print-month-title">${esc(monthName.charAt(0).toUpperCase() + monthName.slice(1))}</div><div class="print-month-grid">${cells.join("")}</div></section>`;
    }

    function buildScheduleSection(number, schedules) {
        const items = (schedules || []).filter(x => Number(x.sumatif_number) === number).sort((a,b) => `${a.date}${a.start_time || ""}`.localeCompare(`${b.date}${b.start_time || ""}`));
        const rows = items.map(item => {
            const practical = item.assessment_type === "practical";
            const type = practical ? "Tes Praktik" : "Tes Tertulis";
            const time = item.start_time && item.end_time ? `${fmtTime(item.start_time)}–${fmtTime(item.end_time)}` : "";
            return `<div class="print-assessment"><div class="print-assessment-head"><span class="print-date">${esc(fmtDate(item.date))}</span><strong>${esc(subjectName(item.subject_id))}</strong><span class="print-type ${practical ? "practical" : "written"}">${type}</span></div><div class="print-material">${esc(item.material || "-")}</div>${time ? `<div class="print-time">${esc(time)}</div>` : ""}</div>`;
        }).join("");
        return `<section class="print-sumatif"><div class="print-sumatif-title">Sumatif ${number}</div><div class="print-sumatif-table">${rows || `<div class="print-empty">Belum ada jadwal.</div>`}</div></section>`;
    }

    function buildPrintDocument() {
        const state = typeof calendarPlannerState !== "undefined" ? calendarPlannerState : {};
        const schedules = (state.schedules || []).filter(x => x.status !== "cancelled");
        const semester = Number(state.semester || 1);
        const academicYear = getAcademicYearName();
        const className = getClassName();
        const months = semesterMonths(semester);
        const calendarYear = semester === 2
            ? Number((academicYear.match(/(\d{4})/) || [new Date().getFullYear()])[1]) + 1
            : Number((academicYear.match(/(\d{4})/) || [new Date().getFullYear()])[1]);
        const total = schedules.length;
        const written = schedules.filter(x => x.assessment_type === "written").length;
        const practical = schedules.filter(x => x.assessment_type === "practical").length;

        const monthsHtml = months.map(m => buildMonth(m, calendarYear, schedules)).join("");
        const scheduleHtml = [1, 2, 3].map(n => buildScheduleSection(n, schedules)).join("");

        const wrapper = document.createElement("div");
        wrapper.id = "calendarPrintDocument";
        wrapper.innerHTML = `
            <div class="print-page print-page-calendar">
                <header class="print-header">
                    <div class="print-school">SD ISLAM DARUL MU'MININ</div>
                    <h1>KALENDER SUMATIF</h1>
                    <div class="print-semester">SEMESTER ${esc(semesterLabel(semester).toUpperCase())}</div>
                    <div class="print-year">TAHUN PELAJARAN ${esc(academicYear || "-")}</div>
                    <div class="print-class">KELAS ${esc(className || "-")}</div>
                </header>
                <div class="print-calendar-layout">${monthsHtml}</div>
                <div class="print-legend"><span><i class="written"></i> Tes Tertulis</span><span><i class="practical"></i> Tes Praktik</span><span><i class="saturday"></i> Sabtu (Hari Libur)</span><span><i class="sunday"></i> Minggu</span></div>
                <div class="print-note">Kalender menunjukkan seluruh bulan pada semester berjalan. Tanggal yang memiliki jadwal diberi tanda.</div>
            </div>
            <div class="print-page print-page-schedules">
                <header class="print-header print-header-compact">
                    <h1>KALENDER SUMATIF</h1>
                    <div>Semester ${esc(semesterLabel(semester))} · Tahun Pelajaran ${esc(academicYear || "-")} · Kelas ${esc(className || "-")}</div>
                </header>
                <div class="print-summary"><span>Total ${total}</span><span>Tertulis ${written}</span><span>Praktik ${practical}</span></div>
                <div class="print-schedule-columns">${scheduleHtml}</div>
                <div class="print-sts-sas"><div><strong>STS :</strong><span></span></div><div><strong>SAS :</strong><span></span></div></div>
                <div class="print-signatures"><div>Mengetahui,<br>Kepala Sekolah<br><br>(____________________)</div><div>Tangerang, __________________ 20____<br>Wali Kelas ${esc(className || "") }<br><br>(____________________)</div></div>
                <footer class="print-footer">Berilmu&nbsp;&nbsp;•&nbsp;&nbsp;Berakhlak&nbsp;&nbsp;•&nbsp;&nbsp;Berprestasi</footer>
            </div>`;
        return wrapper;
    }

    function installStyles() {
        if (document.getElementById("calendarPrintStyles")) return;
        const style = document.createElement("style");
        style.id = "calendarPrintStyles";
        style.textContent = `
@page{size:215mm 330mm portrait;margin:0}
#calendarPrintDocument{display:none}
@media print{
 body>*{display:none!important}
 #calendarPrintDocument,#calendarPrintDocument *{visibility:visible!important}
 #calendarPrintDocument{display:block!important;font-family:Arial,Helvetica,sans-serif;color:#172b4d;background:#fff}
 .print-page{width:199mm;min-height:314mm;margin:0 auto;box-sizing:border-box;position:relative;page-break-after:always;padding:7mm 7mm 6mm}
 .print-page:last-child{page-break-after:auto}
 .print-header{text-align:center;margin-bottom:5mm}.print-school{font-size:11pt;font-weight:700;letter-spacing:.4px;margin-bottom:1mm}.print-header h1{font-size:23pt;letter-spacing:1px;margin:0;font-weight:800}.print-semester{font-size:13pt;font-weight:700;margin-top:1mm}.print-year{font-size:11pt;margin-top:1mm}.print-class{display:inline-block;margin-top:2mm;padding:1.5mm 16mm;border-radius:8mm;background:#2f80bd;color:#fff;font-size:13pt;font-weight:800}
 .print-calendar-layout{display:grid;grid-template-columns:1fr 1fr;gap:3.5mm}.print-month{border:1px solid #8dc4ea;border-radius:2.5mm;overflow:hidden}.print-month-title{text-align:center;background:#3185bd;color:#fff;font-size:11pt;font-weight:800;padding:2mm}.print-month-grid{display:grid;grid-template-columns:repeat(7,1fr)}.print-week{text-align:center;font-size:7pt;font-weight:700;padding:1.2mm 0;background:#eaf5fc;border-bottom:1px solid #c9ddea}.print-saturday-head{background:#f8dddd;color:#b42318}.print-sunday-head{background:#f2f4f7;color:#667085}.print-day{height:9.5mm;border-right:1px solid #d7e3ec;border-bottom:1px solid #d7e3ec;box-sizing:border-box;padding:1.2mm;font-size:7.5pt;text-align:center}.print-day:nth-child(7n){border-right:0}.print-muted{color:#aeb8c2;background:#fafbfc}.print-saturday{background:#fff0f0;color:#b42318;font-weight:600}.print-sunday{background:#f5f5f5;color:#7b8794}.print-scheduled{box-shadow:inset 0 0 0 1.2mm #cfe8f8;font-weight:800}.print-legend{display:flex;justify-content:center;gap:6mm;margin-top:4mm;font-size:7.5pt;flex-wrap:wrap}.print-legend span{display:flex;align-items:center;gap:2mm}.print-legend i{display:inline-block;width:8mm;height:4mm;border-radius:1mm;background:#b9dcf5}.print-legend i.practical{background:#c8efd0}.print-legend i.saturday{background:#fff0f0;border:1px solid #e6a8a8}.print-legend i.sunday{background:#f5f5f5;border:1px solid #d0d5dd}.print-note{text-align:center;font-size:7pt;color:#667085;margin-top:2mm}
 .print-header-compact{margin-bottom:3mm}.print-header-compact h1{font-size:18pt}.print-header-compact>div{font-size:9pt;margin-top:1mm}.print-summary{display:flex;justify-content:center;gap:5mm;margin-bottom:3mm}.print-summary span{border:1px solid #b7d8ed;border-radius:2mm;padding:1.5mm 5mm;font-size:8pt;font-weight:700}.print-schedule-columns{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}.print-sumatif{border:1px solid #8dc4ea;border-radius:2mm;overflow:hidden;min-width:0}.print-sumatif-title{background:#3185bd;color:#fff;font-size:11pt;font-weight:800;padding:2mm 2.5mm}.print-assessment{border-bottom:1px solid #d7e3ec;break-inside:avoid}.print-assessment:last-child{border-bottom:0}.print-assessment-head{display:grid;grid-template-columns:21mm 1fr auto;gap:1mm;align-items:center;padding:1.2mm 1.5mm;background:#edf7fd;font-size:6.5pt}.print-assessment-head strong{font-size:6.8pt;overflow-wrap:anywhere}.print-date{font-weight:700;white-space:nowrap}.print-type{font-size:5.8pt;border-radius:3mm;padding:.7mm 1.5mm;white-space:nowrap;background:#c9e5f8}.print-type.practical{background:#ccefd3}.print-material{display:block;width:100%;box-sizing:border-box;min-height:7mm;padding:1.5mm 2mm;font-size:7pt;line-height:1.25;border-top:1px solid #e1edf4;background:#fff;overflow-wrap:anywhere;white-space:normal}.print-time{text-align:right;padding:0 2mm 1mm;font-size:5.8pt;color:#667085}.print-empty{padding:5mm 2mm;text-align:center;font-size:7pt;color:#98a2b3}.print-sts-sas{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:4mm;border:1px solid #8dc4ea;border-radius:2mm;padding:3mm}.print-sts-sas>div{display:flex;align-items:center;gap:3mm;font-size:8pt}.print-sts-sas>div+div{border-left:1px solid #8dc4ea;padding-left:5mm}.print-sts-sas span{height:6mm;border-bottom:1px dotted #667085;flex:1}.print-signatures{display:grid;grid-template-columns:1fr 1fr;text-align:center;margin-top:9mm;font-size:8pt;line-height:1.5}.print-footer{position:absolute;bottom:4mm;left:0;right:0;text-align:center;font-size:8pt;font-style:italic;font-weight:700}
}
`;
        document.head.appendChild(style);
    }

    function printCalendar() {
        if (typeof calendarPlannerState === "undefined" || !calendarPlannerState.yearId || !calendarPlannerState.classId) {
            if (typeof showAppDialog === "function") showAppDialog("Pilih Tahun Pelajaran dan Kelas terlebih dahulu.", "warning", "Kalender Sumatif");
            return;
        }
        installStyles();
        const old = document.getElementById("calendarPrintDocument");
        if (old) old.remove();
        document.body.appendChild(buildPrintDocument());
        setTimeout(() => {
            window.print();
        }, 50);
    }

    document.addEventListener("click", event => {
        const button = event.target.closest("#calendarPlannerPrint");
        if (!button) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        printCalendar();
    }, true);
})();
