/* =========================================================
   SUMATIF PLANNER - PRINT LAYOUT
   F4 portrait, 2 pages, designed for up to 15 subjects.
   Page 1: calendar semester.
   Page 2: Sumatif 1-3 with full-width material rows.
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
        return new Intl.DateTimeFormat("id-ID", {day:"numeric",month:"short",year:"numeric"}).format(d);
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
        const first = new Date(year,month,1);
        const days = new Date(year,month+1,0).getDate();
        const start = (first.getDay()+6)%7;
        const prevDays = new Date(year,month,0).getDate();
        const monthName = new Intl.DateTimeFormat("id-ID",{month:"long",year:"numeric"}).format(first);
        const key = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const scheduledDates = new Set((schedules||[]).map(x=>String(x.date).slice(0,10)));
        const cells=[];
        const heads=["Sen","Sel","Rab","Kam","Jum","Sab","Min"];
        heads.forEach((h,i)=>cells.push(`<div class="sp-week ${i===5?"sp-sat-head":i===6?"sp-sun-head":""}">${h}</div>`));
        for(let i=0;i<start;i++) cells.push(`<div class="sp-day sp-muted"><span>${prevDays-start+i+1}</span></div>`);
        for(let d=1;d<=days;d++) {
            const dateKey=key(year,month,d);
            const dow=(new Date(year,month,d).getDay()+6)%7;
            const saturday=dow===5, sunday=dow===6, scheduled=scheduledDates.has(dateKey);
            cells.push(`<div class="sp-day ${saturday?"sp-saturday":sunday?"sp-sunday":""} ${scheduled?"sp-scheduled":""}"><span>${d}</span></div>`);
        }
        while(cells.length<49) cells.push(`<div class="sp-day sp-muted"></div>`);
        return `<section class="sp-month"><div class="sp-month-title">${esc(monthName.charAt(0).toUpperCase()+monthName.slice(1))}</div><div class="sp-month-grid">${cells.join("")}</div></section>`;
    }

    function buildScheduleSection(number,schedules) {
        const items=(schedules||[]).filter(x=>Number(x.sumatif_number)===number).sort((a,b)=>`${a.date}${a.start_time||""}`.localeCompare(`${b.date}${b.start_time||""}`));
        const rows=items.map(item=>{
            const practical=item.assessment_type==="practical";
            const type=practical?"Praktik":"Tertulis";
            const time=item.start_time&&item.end_time?`${fmtTime(item.start_time)}–${fmtTime(item.end_time)}`:"";
            return `<div class="sp-assessment"><div class="sp-assessment-head"><span class="sp-date">${esc(fmtDate(item.date))}</span><strong>${esc(subjectName(item.subject_id))}</strong><span class="sp-type ${practical?"sp-practical":"sp-written"}">${type}</span></div><div class="sp-material">${esc(item.material||"-")}</div>${time?`<div class="sp-time">${esc(time)}</div>`:""}</div>`;
        }).join("");
        return `<section class="sp-sumatif"><div class="sp-sumatif-title">Sumatif ${number}</div><div>${rows||`<div class="sp-empty">Belum ada jadwal.</div>`}</div></section>`;
    }

    function buildPrintDocument() {
        const state=getState();
        const schedules=(state.schedules||[]).filter(x=>x.status!=="cancelled");
        const semester=Number(state.semester||1);
        const academicYear=getAcademicYearName();
        const className=getClassName();
        const months=semesterMonths(semester);
        const firstYear=Number((academicYear.match(/(\d{4})/)||[new Date().getFullYear()])[1]);
        const calendarYear=semester===2?firstYear+1:firstYear;
        const total=schedules.length;
        const written=schedules.filter(x=>x.assessment_type==="written").length;
        const practical=schedules.filter(x=>x.assessment_type==="practical").length;
        const monthsHtml=months.map(m=>buildMonth(m,calendarYear,schedules)).join("");
        const scheduleHtml=[1,2,3].map(n=>buildScheduleSection(n,schedules)).join("");
        const wrapper=document.createElement("div");
        wrapper.id="calendarPrintDocument";
        wrapper.innerHTML=`
        <div class="sp-page sp-page-calendar">
            <header class="sp-header"><div class="sp-school">SD ISLAM DARUL MU'MININ</div><h1>KALENDER SUMATIF</h1><div class="sp-semester">SEMESTER ${esc(semesterLabel(semester).toUpperCase())}</div><div class="sp-year">TAHUN PELAJARAN ${esc(academicYear||"-")}</div><div class="sp-class">KELAS ${esc(className||"-")}</div></header>
            <div class="sp-calendar-layout">${monthsHtml}</div>
            <div class="sp-legend"><span><i class="sp-legend-written"></i>Tes Tertulis</span><span><i class="sp-legend-practical"></i>Tes Praktik</span><span><i class="sp-legend-saturday"></i>Sabtu (Hari Libur)</span><span><i class="sp-legend-sunday"></i>Minggu</span></div>
            <div class="sp-note">Tanggal yang memiliki jadwal sumatif diberi tanda.</div>
        </div>
        <div class="sp-page sp-page-schedules">
            <header class="sp-header sp-header-compact"><div class="sp-school">SD ISLAM DARUL MU'MININ</div><h1>KALENDER SUMATIF</h1><div>SEMESTER ${esc(semesterLabel(semester).toUpperCase())} · TAHUN PELAJARAN ${esc(academicYear||"-")} · KELAS ${esc(className||"-")}</div></header>
            <div class="sp-summary"><span>Total ${total}</span><span>Tertulis ${written}</span><span>Praktik ${practical}</span></div>
            <div class="sp-schedule-columns">${scheduleHtml}</div>
            <div class="sp-sts-sas"><div><strong>STS :</strong><span></span></div><div><strong>SAS :</strong><span></span></div></div>
            <div class="sp-signatures"><div>Mengetahui,<br>Kepala Sekolah<br><br>(____________________)</div><div>Tangerang, __________________ 20____<br>Wali Kelas ${esc(className||"")}<br><br>(____________________)</div></div>
            <footer class="sp-footer">Berilmu&nbsp;&nbsp;•&nbsp;&nbsp;Berakhlak&nbsp;&nbsp;•&nbsp;&nbsp;Berprestasi</footer>
        </div>`;
        return wrapper;
    }

    function installStyles() {
        const old=document.getElementById("calendarPrintStyles"); if(old) old.remove();
        const style=document.createElement("style"); style.id="calendarPrintStyles";
        style.textContent=`
@page{size:215mm 330mm;margin:0}
#calendarPrintDocument{display:none}
@media print{
html,body{margin:0!important;padding:0!important}
body>*{display:none!important}
#calendarPrintDocument,#calendarPrintDocument *{visibility:visible!important}
#calendarPrintDocument{display:block!important;width:215mm;font-family:Arial,Helvetica,sans-serif;color:#172b4d;background:#fff}
.sp-page{width:215mm;height:330mm;box-sizing:border-box;position:relative;page-break-after:always;overflow:hidden;padding:6mm 7mm 5mm;background:#fff}
.sp-page:last-child{page-break-after:auto}
.sp-header{text-align:center;margin-bottom:3mm}.sp-school{font-size:9pt;font-weight:700;letter-spacing:.3px;margin-bottom:.7mm}.sp-header h1{font-size:20pt;letter-spacing:.7px;margin:0;font-weight:800}.sp-semester{font-size:11pt;font-weight:700;margin-top:.7mm}.sp-year{font-size:9.5pt;margin-top:.5mm}.sp-class{display:inline-block;margin-top:1.2mm;padding:1mm 12mm;border-radius:6mm;background:#2f80bd;color:#fff;font-size:10pt;font-weight:800}
.sp-calendar-layout{display:grid;grid-template-columns:1fr 1fr;gap:2.5mm}.sp-month{border:1px solid #8dc4ea;border-radius:1.8mm;overflow:hidden}.sp-month-title{text-align:center;background:#3185bd;color:#fff;font-size:8.5pt;font-weight:800;padding:1.1mm}.sp-month-grid{display:grid;grid-template-columns:repeat(7,1fr)}.sp-week{text-align:center;font-size:5.5pt;font-weight:700;padding:.65mm 0;background:#eaf5fc;border-bottom:1px solid #c9ddea}.sp-sat-head{background:#f8dddd;color:#b42318}.sp-sun-head{background:#f2f4f7;color:#667085}.sp-day{height:5.6mm;box-sizing:border-box;padding:.55mm;font-size:5.8pt;text-align:center;border-right:1px solid #d7e3ec;border-bottom:1px solid #d7e3ec}.sp-day:nth-child(7n){border-right:0}.sp-muted{color:#aeb8c2;background:#fafbfc}.sp-saturday{background:#fff0f0;color:#b42318;font-weight:600}.sp-sunday{background:#f5f5f5;color:#7b8794}.sp-scheduled{box-shadow:inset 0 0 0 .8mm #cfe8f8;font-weight:800}.sp-legend{display:flex;justify-content:center;gap:4mm;flex-wrap:wrap;margin-top:2.5mm;font-size:6.2pt}.sp-legend span{display:flex;align-items:center;gap:1mm}.sp-legend i{display:inline-block;width:5.5mm;height:2.8mm;border-radius:.6mm;background:#b9dcf5}.sp-legend-practical{background:#c8efd0!important}.sp-legend-saturday{background:#fff0f0!important;border:1px solid #e6a8a8}.sp-legend-sunday{background:#f5f5f5!important;border:1px solid #d0d5dd}.sp-note{text-align:center;font-size:6pt;color:#667085;margin-top:1mm}
.sp-header-compact{margin-bottom:2mm}.sp-header-compact h1{font-size:17pt}.sp-header-compact>div:last-child{font-size:7.5pt;margin-top:.8mm}.sp-summary{display:flex;justify-content:center;gap:3mm;margin-bottom:2mm}.sp-summary span{border:1px solid #b7d8ed;border-radius:1.2mm;padding:.8mm 3.5mm;font-size:6.5pt;font-weight:700}
.sp-schedule-columns{display:grid;grid-template-columns:repeat(3,1fr);gap:2.5mm;align-items:start}.sp-sumatif{border:1px solid #8dc4ea;border-radius:1.8mm;overflow:hidden;min-width:0}.sp-sumatif-title{background:#3185bd;color:#fff;font-size:9.5pt;font-weight:800;padding:1.4mm;text-align:center}.sp-assessment{border-bottom:1px solid #d7e3ec;break-inside:avoid}.sp-assessment:last-child{border-bottom:0}.sp-assessment-head{display:grid;grid-template-columns:17mm minmax(0,1fr) auto;gap:.8mm;align-items:center;padding:.9mm 1.1mm;background:#edf7fd;font-size:5.7pt}.sp-assessment-head strong{font-size:5.9pt;overflow-wrap:anywhere;line-height:1.05}.sp-date{font-weight:700;white-space:nowrap}.sp-type{font-size:5pt;border-radius:2.2mm;padding:.4mm 1mm;white-space:nowrap;background:#c9e5f8}.sp-practical{background:#ccefd3}.sp-material{display:block;width:100%;box-sizing:border-box;min-height:5.2mm;padding:.9mm 1.2mm;font-size:6.2pt;line-height:1.15;background:#fff;overflow-wrap:anywhere;white-space:normal;border-top:1px solid #e1edf4}.sp-time{text-align:right;padding:0 1.2mm .8mm;font-size:5pt;color:#667085}.sp-empty{padding:4mm 2mm;text-align:center;font-size:6pt;color:#98a2b3}
.sp-sts-sas{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin-top:2.5mm;border:1px solid #8dc4ea;border-radius:1.8mm;padding:2mm}.sp-sts-sas>div{display:flex;align-items:center;gap:2mm;font-size:7pt}.sp-sts-sas>div+div{border-left:1px solid #8dc4ea;padding-left:3mm}.sp-sts-sas span{height:4mm;border-bottom:1px dotted #667085;flex:1}.sp-signatures{display:grid;grid-template-columns:1fr 1fr;text-align:center;margin-top:5mm;font-size:7pt;line-height:1.35}.sp-footer{position:absolute;bottom:2.5mm;left:0;right:0;text-align:center;font-size:6.5pt;font-style:italic;font-weight:700}
}`;
        document.head.appendChild(style);
    }

    function printCalendar(){
        const state=getState();
        if(!state.yearId||!state.classId){if(typeof showAppDialog==="function")showAppDialog("Pilih Tahun Pelajaran dan Kelas terlebih dahulu.","warning","Kalender Sumatif");return;}
        installStyles();
        const old=document.getElementById("calendarPrintDocument"); if(old) old.remove();
        document.body.appendChild(buildPrintDocument());
        setTimeout(()=>window.print(),100);
    }
    document.addEventListener("click",event=>{
        const button=event.target.closest("#calendarPlannerPrint");
        if(!button)return;
        event.preventDefault();event.stopImmediatePropagation();printCalendar();
    },true);
})();
