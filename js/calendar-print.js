/* =========================================================
   SUMATIF PLANNER - PRINT LAYOUT
   F4 portrait, ONE PAGE.
   Left: 6 semester months.
   Right: Sumatif 1-3, compact rows with full-width material.
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
    function fmtDate(value) {
        const d = new Date(String(value).slice(0,10) + "T00:00:00");
        return new Intl.DateTimeFormat("id-ID", {day:"numeric",month:"short"}).format(d);
    }
    function fmtTime(value) { return value ? String(value).slice(0,5) : ""; }
    function semesterLabel(semester) { return Number(semester) === 2 ? "Genap" : "Ganjil"; }
    function semesterMonths(semester) { return Number(semester) === 2 ? [0,1,2,3,4,5] : [6,7,8,9,10,11]; }
    function getState() { return typeof calendarPlannerState !== "undefined" ? calendarPlannerState : {}; }
    function getAcademicYearName() {
        const state = getState();
        return state.years?.find(x => String(x.id) === String(state.yearId))?.name || "";
    }
    function getClassName() {
        const state = getState();
        return state.classes?.find(x => String(x.id) === String(state.classId))?.name || "";
    }

    function buildMonth(month, year, schedules) {
        const first = new Date(year, month, 1);
        const days = new Date(year, month + 1, 0).getDate();
        const start = (first.getDay() + 6) % 7;
        const prevDays = new Date(year, month, 0).getDate();
        const monthName = new Intl.DateTimeFormat("id-ID", {month:"long", year:"numeric"}).format(first);
        const key = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const scheduledDates = new Set((schedules || []).map(x => String(x.date).slice(0,10)));
        const cells = [];
        const heads = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];
        heads.forEach((h,i) => cells.push(`<div class="sp-week ${i===5?"sp-sat-head":i===6?"sp-sun-head":""}">${h}</div>`));
        for (let i=0; i<start; i++) cells.push(`<div class="sp-day sp-muted"><span>${prevDays-start+i+1}</span></div>`);
        for (let d=1; d<=days; d++) {
            const dateKey = key(year,month,d);
            const dow = (new Date(year,month,d).getDay()+6)%7;
            const saturday = dow===5, sunday = dow===6, scheduled = scheduledDates.has(dateKey);
            cells.push(`<div class="sp-day ${saturday?"sp-saturday":sunday?"sp-sunday":""} ${scheduled?"sp-scheduled":""}"><span>${d}</span></div>`);
        }
        while (cells.length < 49) cells.push(`<div class="sp-day sp-muted"></div>`);
        return `<section class="sp-month"><div class="sp-month-title">${esc(monthName.charAt(0).toUpperCase()+monthName.slice(1))}</div><div class="sp-month-grid">${cells.join("")}</div></section>`;
    }

    function buildScheduleSection(number, schedules) {
        const items = (schedules || [])
            .filter(x => Number(x.sumatif_number) === number)
            .sort((a,b) => `${a.date}${a.start_time||""}`.localeCompare(`${b.date}${b.start_time||""}`));
        const rows = items.map(item => {
            const practical = item.assessment_type === "practical";
            const type = practical ? "Praktik" : "Tertulis";
            const time = item.start_time && item.end_time ? `${fmtTime(item.start_time)}–${fmtTime(item.end_time)}` : "";
            return `<div class="sp-assessment"><div class="sp-assessment-head"><span class="sp-date">${esc(fmtDate(item.date))}</span><strong>${esc(subjectName(item.subject_id))}</strong><span class="sp-type ${practical?"sp-practical":"sp-written"}">${type}</span></div><div class="sp-material">${esc(item.material||"-")}</div>${time?`<div class="sp-time">${esc(time)}</div>`:""}</div>`;
        }).join("");
        return `<section class="sp-sumatif"><div class="sp-sumatif-title">Sumatif ${number}</div><div>${rows||`<div class="sp-empty">Belum ada jadwal.</div>`}</div></section>`;
    }

    function buildPrintDocument() {
        const state = getState();
        const schedules = (state.schedules || []).filter(x => x.status !== "cancelled");
        const semester = Number(state.semester || 1);
        const academicYear = getAcademicYearName();
        const className = getClassName();
        const months = semesterMonths(semester);
        const firstYear = Number((academicYear.match(/(\d{4})/) || [new Date().getFullYear()])[1]);
        const calendarYear = semester === 2 ? firstYear + 1 : firstYear;
        const total = schedules.length;
        const written = schedules.filter(x => x.assessment_type === "written").length;
        const practical = schedules.filter(x => x.assessment_type === "practical").length;
        const monthsHtml = months.map(m => buildMonth(m, calendarYear, schedules)).join("");
        const scheduleHtml = [1,2,3].map(n => buildScheduleSection(n, schedules)).join("");
        const wrapper = document.createElement("div");
        wrapper.id = "calendarPrintDocument";
        wrapper.innerHTML = `
        <div class="sp-sheet">
            <header class="sp-header">
                <div class="sp-school">SD ISLAM DARUL MU'MININ</div>
                <h1>KALENDER SUMATIF</h1>
                <div class="sp-semester">SEMESTER ${esc(semesterLabel(semester).toUpperCase())}</div>
                <div class="sp-year">TAHUN PELAJARAN ${esc(academicYear || "-")}</div>
                <div class="sp-class">KELAS ${esc(className || "-")}</div>
            </header>
            <div class="sp-main-grid">
                <div class="sp-calendar-side">
                    <div class="sp-calendar-layout">${monthsHtml}</div>
                    <div class="sp-legend"><span><i class="sp-legend-written"></i>Tes Tertulis</span><span><i class="sp-legend-practical"></i>Tes Praktik</span><span><i class="sp-legend-saturday"></i>Sabtu</span><span><i class="sp-legend-sunday"></i>Minggu</span></div>
                </div>
                <div class="sp-schedule-side">
                    <div class="sp-schedule-summary"><span>Total ${total}</span><span>Tertulis ${written}</span><span>Praktik ${practical}</span></div>
                    <div class="sp-schedule-columns">${scheduleHtml}</div>
                    <div class="sp-sts-sas"><div><strong>STS :</strong><span></span></div><div><strong>SAS :</strong><span></span></div></div>
                </div>
            </div>
            <div class="sp-bottom">
                <div class="sp-signatures"><div>Mengetahui,<br>Kepala Sekolah<br><br>(____________________)</div><div>Tangerang, __________________ 20____<br>Wali Kelas ${esc(className || "")}<br><br>(____________________)</div></div>
                <footer class="sp-footer">Berilmu&nbsp;&nbsp;•&nbsp;&nbsp;Berakhlak&nbsp;&nbsp;•&nbsp;&nbsp;Berprestasi</footer>
            </div>
        </div>`;
        return wrapper;
    }

    function installStyles() {
        const old = document.getElementById("calendarPrintStyles");
        if (old) old.remove();
        const style = document.createElement("style");
        style.id = "calendarPrintStyles";
        style.textContent = `
@page{size:215mm 330mm;margin:0}
#calendarPrintDocument{display:none}
@media print{
html,body{margin:0!important;padding:0!important;background:#fff!important}
body>*{display:none!important}
#calendarPrintDocument,#calendarPrintDocument *{visibility:visible!important}
#calendarPrintDocument{display:block!important;width:215mm;font-family:Arial,Helvetica,sans-serif;color:#172b4d;background:#fff}
.sp-sheet{width:215mm;height:330mm;box-sizing:border-box;position:relative;overflow:hidden;padding:5mm 6mm 4mm;background:#fff}
.sp-header{text-align:center;margin-bottom:3mm}.sp-school{font-size:8.5pt;font-weight:700;letter-spacing:.25px;margin-bottom:.5mm}.sp-header h1{font-size:18pt;letter-spacing:.6px;margin:0;font-weight:800}.sp-semester{font-size:9.5pt;font-weight:700;margin-top:.5mm}.sp-year{font-size:8pt;margin-top:.4mm}.sp-class{display:inline-block;margin-top:1mm;padding:.8mm 10mm;border-radius:5mm;background:#2f80bd;color:#fff;font-size:9pt;font-weight:800}
.sp-main-grid{display:grid;grid-template-columns:56% 44%;gap:3.5mm;align-items:start}.sp-calendar-layout{display:grid;grid-template-columns:1fr 1fr;gap:1.8mm}.sp-month{border:1px solid #8dc4ea;border-radius:1.5mm;overflow:hidden}.sp-month-title{text-align:center;background:#3185bd;color:#fff;font-size:7.2pt;font-weight:800;padding:.8mm}.sp-month-grid{display:grid;grid-template-columns:repeat(7,1fr)}.sp-week{text-align:center;font-size:4.6pt;font-weight:700;padding:.45mm 0;background:#eaf5fc;border-bottom:1px solid #c9ddea}.sp-sat-head{background:#f8dddd;color:#b42318}.sp-sun-head{background:#f2f4f7;color:#667085}.sp-day{height:4.7mm;box-sizing:border-box;padding:.4mm;font-size:4.8pt;text-align:center;border-right:1px solid #d7e3ec;border-bottom:1px solid #d7e3ec}.sp-day:nth-child(7n){border-right:0}.sp-muted{color:#aeb8c2;background:#fafbfc}.sp-saturday{background:#fff0f0;color:#b42318;font-weight:600}.sp-sunday{background:#f5f5f5;color:#7b8794}.sp-scheduled{box-shadow:inset 0 0 0 .65mm #cfe8f8;font-weight:800}.sp-legend{display:flex;justify-content:center;gap:2mm;flex-wrap:wrap;margin-top:1.8mm;font-size:5pt}.sp-legend span{display:flex;align-items:center;gap:.7mm}.sp-legend i{display:inline-block;width:4mm;height:2mm;border-radius:.5mm;background:#b9dcf5}.sp-legend-practical{background:#c8efd0!important}.sp-legend-saturday{background:#fff0f0!important;border:1px solid #e6a8a8}.sp-legend-sunday{background:#f5f5f5!important;border:1px solid #d0d5dd}
.sp-schedule-summary{display:flex;justify-content:center;gap:1mm;margin-bottom:1.2mm}.sp-schedule-summary span{border:1px solid #b7d8ed;border-radius:1mm;padding:.45mm 1.5mm;font-size:4.8pt;font-weight:700;white-space:nowrap}.sp-schedule-columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.2mm;align-items:start}.sp-sumatif{border:1px solid #8dc4ea;border-radius:1.2mm;overflow:hidden;min-width:0}.sp-sumatif-title{background:#3185bd;color:#fff;font-size:7pt;font-weight:800;padding:.8mm;text-align:center}.sp-assessment{border-bottom:1px solid #d7e3ec;break-inside:avoid}.sp-assessment:last-child{border-bottom:0}.sp-assessment-head{display:grid;grid-template-columns:9.5mm minmax(0,1fr);gap:.35mm;padding:.55mm .55mm .25mm;background:#edf7fd;font-size:4pt;line-height:1.05}.sp-assessment-head strong{font-size:4.1pt;overflow-wrap:anywhere}.sp-date{font-weight:700;white-space:nowrap}.sp-type{grid-column:2;font-size:3.5pt;justify-self:start;border-radius:1.3mm;padding:.2mm .6mm;white-space:nowrap;background:#c9e5f8}.sp-practical{background:#ccefd3}.sp-material{display:block;width:100%;box-sizing:border-box;min-height:4mm;padding:.6mm .7mm;font-size:4.7pt;line-height:1.05;background:#fff;overflow-wrap:anywhere;white-space:normal;border-top:1px solid #e1edf4}.sp-time{text-align:right;padding:0 .7mm .45mm;font-size:3.5pt;color:#667085}.sp-empty{padding:2.5mm 1mm;text-align:center;font-size:4.7pt;color:#98a2b3}.sp-sts-sas{display:grid;grid-template-columns:1fr 1fr;gap:1mm;margin-top:1.8mm;border:1px solid #8dc4ea;border-radius:1.2mm;padding:1.2mm}.sp-sts-sas>div{display:flex;align-items:center;gap:.8mm;font-size:5.2pt}.sp-sts-sas>div+div{border-left:1px solid #8dc4ea;padding-left:1.2mm}.sp-sts-sas span{height:2.7mm;border-bottom:1px dotted #667085;flex:1}.sp-bottom{position:absolute;left:6mm;right:6mm;bottom:4mm}.sp-signatures{display:grid;grid-template-columns:1fr 1fr;text-align:center;font-size:6.2pt;line-height:1.2}.sp-footer{text-align:center;font-size:5.2pt;font-style:italic;font-weight:700;margin-top:1.5mm}
}
`;
        document.head.appendChild(style);
    }

    function printCalendar() {
        const state = getState();
        if (!state.yearId || !state.classId) {
            if (typeof showAppDialog === "function") showAppDialog("Pilih Tahun Pelajaran dan Kelas terlebih dahulu.", "warning", "Kalender Sumatif");
            return;
        }
        installStyles();
        const old = document.getElementById("calendarPrintDocument");
        if (old) old.remove();
        document.body.appendChild(buildPrintDocument());
        setTimeout(() => window.print(), 100);
    }

    document.addEventListener("click", event => {
        const button = event.target.closest("#calendarPlannerPrint");
        if (!button) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        printCalendar();
    }, true);
})();
