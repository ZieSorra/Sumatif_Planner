/* =========================================================
   SUMATIF PLANNER - PRINT LAYOUT
   F4 portrait, ONE PAGE.
   Left: 6 semester months + school events.
   Right: Sumatif 1-3 STACKED vertically.
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
    function fmtEventDate(value) {
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

    async function loadEducationEvents() {
        const state = getState();
        if (!state.yearId || !window.supabaseClient) return [];
        const { data, error } = await supabaseClient
            .from("education_calendar")
            .select("date,day_type,title,description,is_selectable")
            .eq("academic_year_id", state.yearId)
            .eq("semester", Number(state.semester || 1))
            .order("date", { ascending: true });
        if (error) {
            console.warn("[Calendar Print] Gagal memuat event sekolah:", error);
            return [];
        }
        return data || [];
    }

    function buildMonth(month, year, schedules, educationEvents) {
        const first = new Date(year, month, 1);
        const days = new Date(year, month + 1, 0).getDate();
        const start = (first.getDay() + 6) % 7;
        const prevDays = new Date(year, month, 0).getDate();
        const monthName = new Intl.DateTimeFormat("id-ID", {month:"long", year:"numeric"}).format(first);
        const key = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const scheduledDates = new Set((schedules || []).map(x => String(x.date).slice(0,10)));
        const eventMap = new Map();
        (educationEvents || []).forEach(event => {
            const eventKey = String(event.date).slice(0,10);
            if (!eventMap.has(eventKey)) eventMap.set(eventKey, []);
            eventMap.get(eventKey).push(event);
        });
        const cells = [];
        const heads = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];
        heads.forEach((h,i) => cells.push(`<div class="sp-week ${i===5?"sp-sat-head":i===6?"sp-sun-head":""}">${h}</div>`));
        for (let i=0; i<start; i++) cells.push(`<div class="sp-day sp-muted"><span>${prevDays-start+i+1}</span></div>`);
        for (let d=1; d<=days; d++) {
            const dateKey = key(year,month,d);
            const dow = (new Date(year,month,d).getDay()+6)%7;
            const saturday = dow===5, sunday = dow===6, scheduled = scheduledDates.has(dateKey);
            const hasEvent = eventMap.has(dateKey);
            cells.push(`<div class="sp-day ${saturday?"sp-saturday":sunday?"sp-sunday":""} ${scheduled?"sp-scheduled":""} ${hasEvent?"sp-event-day":""}"><span>${d}</span></div>`);
        }
        while (cells.length < 49) cells.push(`<div class="sp-day sp-muted"></div>`);
        const monthEvents = (educationEvents || []).filter(event => {
            const d = new Date(String(event.date).slice(0,10) + "T00:00:00");
            return d.getFullYear() === year && d.getMonth() === month;
        });
        const uniqueEvents = monthEvents.filter((event, index, arr) => arr.findIndex(x => String(x.date).slice(0,10) === String(event.date).slice(0,10) && x.title === event.title) === index);
        const eventsHtml = uniqueEvents.length
            ? `<div class="sp-month-events"><strong>Event Sekolah</strong>${uniqueEvents.slice(0,4).map(event => `<div><b>${esc(fmtEventDate(event.date))}</b> · ${esc(event.title || event.day_type || "Kegiatan")}</div>`).join("")}${uniqueEvents.length>4?`<div class="sp-more-event">+ ${uniqueEvents.length-4} event lainnya</div>`:""}</div>`
            : "";
        return `<section class="sp-month"><div class="sp-month-title">${esc(monthName.charAt(0).toUpperCase()+monthName.slice(1))}</div><div class="sp-month-grid">${cells.join("")}</div>${eventsHtml}</section>`;
    }

    function buildScheduleSection(number, schedules) {
        const items = (schedules || [])
            .filter(x => Number(x.sumatif_number) === number)
            .sort((a,b) => `${a.date}${a.start_time||""}`.localeCompare(`${b.date}${b.start_time||""}`));
        const rows = items.map(item => {
            const practical = item.assessment_type === "practical";
            const type = practical ? "Praktik" : "Tertulis";
            const time = item.start_time && item.end_time ? `${fmtTime(item.start_time)}–${fmtTime(item.end_time)}` : "";
            return `<div class="sp-assessment"><div class="sp-assessment-head"><span class="sp-date">${esc(fmtDate(item.date))}</span><strong>${esc(subjectName(item.subject_id))}</strong><span class="sp-type ${practical?"sp-practical":"sp-written"}">${type}</span>${time?`<span class="sp-time-head">${esc(time)}</span>`:""}</div><div class="sp-material">${esc(item.material||"-")}</div></div>`;
        }).join("");
        return `<section class="sp-sumatif"><div class="sp-sumatif-title">Sumatif ${number}</div><div>${rows||`<div class="sp-empty">Belum ada jadwal.</div>`}</div></section>`;
    }

    async function buildPrintDocument() {
        const state = getState();
        const schedules = (state.schedules || []).filter(x => x.status !== "cancelled");
        const educationEvents = await loadEducationEvents();
        const semester = Number(state.semester || 1);
        const academicYear = getAcademicYearName();
        const className = getClassName();
        const months = semesterMonths(semester);
        const firstYear = Number((academicYear.match(/(\d{4})/) || [new Date().getFullYear()])[1]);
        const calendarYear = semester === 2 ? firstYear + 1 : firstYear;
        const total = schedules.length;
        const written = schedules.filter(x => x.assessment_type === "written").length;
        const practical = schedules.filter(x => x.assessment_type === "practical").length;
        const monthsHtml = months.map(m => buildMonth(m, calendarYear, schedules, educationEvents)).join("");
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
                    <div class="sp-legend"><span><i class="sp-legend-written"></i>Tes Tertulis</span><span><i class="sp-legend-practical"></i>Tes Praktik</span><span><i class="sp-legend-saturday"></i>Sabtu</span><span><i class="sp-legend-sunday"></i>Minggu</span><span><i class="sp-legend-event"></i>Event Sekolah</span></div>
                </div>
                <div class="sp-schedule-side">
                    <div class="sp-schedule-summary"><span>Total ${total}</span><span>Tertulis ${written}</span><span>Praktik ${practical}</span></div>
                    <div class="sp-schedule-stack">${scheduleHtml}</div>
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
.sp-sheet{width:215mm;height:330mm;box-sizing:border-box;position:relative;overflow:hidden;padding:4.5mm 5mm 3.5mm;background:#fff}
.sp-header{text-align:center;margin-bottom:2.2mm}.sp-school{font-size:7.2pt;font-weight:700;letter-spacing:.2px;margin-bottom:.3mm}.sp-header h1{font-size:16pt;letter-spacing:.5px;margin:0;font-weight:800}.sp-semester{font-size:8.2pt;font-weight:700;margin-top:.35mm}.sp-year{font-size:7pt;margin-top:.25mm}.sp-class{display:inline-block;margin-top:.7mm;padding:.55mm 8mm;border-radius:4mm;background:#2f80bd;color:#fff;font-size:7.5pt;font-weight:800}
.sp-main-grid{display:grid;grid-template-columns:57% 43%;gap:2.5mm;align-items:start}.sp-calendar-layout{display:grid;grid-template-columns:1fr 1fr;gap:1.35mm}.sp-month{border:1px solid #8dc4ea;border-radius:1.2mm;overflow:hidden}.sp-month-title{text-align:center;background:#3185bd;color:#fff;font-size:6.5pt;font-weight:800;padding:.6mm}.sp-month-grid{display:grid;grid-template-columns:repeat(7,1fr)}.sp-week{text-align:center;font-size:4pt;font-weight:700;padding:.32mm 0;background:#eaf5fc;border-bottom:1px solid #c9ddea}.sp-sat-head{background:#f8dddd;color:#b42318}.sp-sun-head{background:#f2f4f7;color:#667085}.sp-day{height:4.05mm;box-sizing:border-box;padding:.28mm;font-size:4.1pt;text-align:center;border-right:1px solid #d7e3ec;border-bottom:1px solid #d7e3ec}.sp-day:nth-child(7n){border-right:0}.sp-muted{color:#aeb8c2;background:#fafbfc}.sp-saturday{background:#fff0f0;color:#b42318;font-weight:600}.sp-sunday{background:#f5f5f5;color:#7b8794}.sp-scheduled{box-shadow:inset 0 0 0 .55mm #cfe8f8;font-weight:800}.sp-event-day{outline:inset 0 0 0 .55mm #f4c542;font-weight:800}.sp-month-events{padding:.75mm 1mm;background:#f5faff;border-top:1px solid #b7d8ed;font-size:4.2pt;line-height:1.15}.sp-month-events strong{display:block;font-size:4.5pt;margin-bottom:.35mm}.sp-month-events div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sp-month-events b{font-weight:800}.sp-more-event{color:#667085;font-style:italic;margin-top:.2mm}.sp-legend{display:flex;justify-content:center;gap:1.5mm;flex-wrap:wrap;margin-top:1.2mm;font-size:4.2pt}.sp-legend span{display:flex;align-items:center;gap:.5mm}.sp-legend i{display:inline-block;width:3.2mm;height:1.6mm;border-radius:.4mm;background:#b9dcf5}.sp-legend-practical{background:#c8efd0!important}.sp-legend-saturday{background:#fff0f0!important;border:1px solid #e6a8a8}.sp-legend-sunday{background:#f5f5f5!important;border:1px solid #d0d5dd}.sp-legend-event{background:#fff2bf!important;border:1px solid #e5b93c}
.sp-schedule-summary{display:flex;justify-content:center;gap:.7mm;margin-bottom:1mm}.sp-schedule-summary span{border:1px solid #b7d8ed;border-radius:.8mm;padding:.3mm 1.2mm;font-size:4pt;font-weight:700;white-space:nowrap}.sp-schedule-stack{display:flex;flex-direction:column;gap:1.1mm}.sp-sumatif{border:1px solid #8dc4ea;border-radius:1.1mm;overflow:hidden;min-width:0}.sp-sumatif-title{background:#3185bd;color:#fff;font-size:6.5pt;font-weight:800;padding:.65mm;text-align:center}.sp-assessment{border-bottom:1px solid #d7e3ec;break-inside:avoid}.sp-assessment:last-child{border-bottom:0}.sp-assessment-head{display:grid;grid-template-columns:11mm minmax(0,1fr) auto;gap:.4mm;align-items:center;padding:.45mm .6mm .2mm;background:#edf7fd;font-size:3.7pt;line-height:1.05}.sp-assessment-head strong{font-size:3.9pt;overflow-wrap:anywhere}.sp-date{font-weight:700;white-space:nowrap}.sp-type{font-size:3.3pt;border-radius:1.1mm;padding:.15mm .5mm;white-space:nowrap;background:#c9e5f8}.sp-practical{background:#ccefd3}.sp-time-head{grid-column:2 / 4;font-size:3.3pt;color:#667085;text-align:right;padding-bottom:.15mm}.sp-material{display:block;width:100%;box-sizing:border-box;min-height:3.7mm;padding:.48mm .65mm;font-size:4.2pt;line-height:1.05;background:#fff;overflow-wrap:anywhere;white-space:normal;border-top:1px solid #e1edf4}.sp-empty{padding:2mm 1mm;text-align:center;font-size:4.2pt;color:#98a2b3}.sp-sts-sas{display:grid;grid-template-columns:1fr 1fr;gap:.8mm;margin-top:1.4mm;border:1px solid #8dc4ea;border-radius:1mm;padding:.9mm}.sp-sts-sas>div{display:flex;align-items:center;gap:.6mm;font-size:4.5pt}.sp-sts-sas>div+div{border-left:1px solid #8dc4ea;padding-left:1mm}.sp-sts-sas span{height:2.2mm;border-bottom:1px dotted #667085;flex:1}.sp-bottom{position:absolute;left:5mm;right:5mm;bottom:3.5mm}.sp-signatures{display:grid;grid-template-columns:1fr 1fr;text-align:center;font-size:5.5pt;line-height:1.15}.sp-footer{text-align:center;font-size:4.8pt;font-style:italic;font-weight:700;margin-top:1mm}
}
`;
        document.head.appendChild(style);
    }

    async function printCalendar() {
        const state = getState();
        if (!state.yearId || !state.classId) {
            if (typeof showAppDialog === "function") showAppDialog("Pilih Tahun Pelajaran dan Kelas terlebih dahulu.", "warning", "Kalender Sumatif");
            return;
        }
        installStyles();
        const old = document.getElementById("calendarPrintDocument");
        if (old) old.remove();
        const wrapper = await buildPrintDocument();
        document.body.appendChild(wrapper);
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
