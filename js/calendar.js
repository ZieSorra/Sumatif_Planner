/* =========================================================
   SUMATIF PLANNER - KALENDER SUMATIF
   Resume jadwal sumatif guru per tahun, kelas, semester.
   ========================================================= */

let calendarPlannerState = {
    years: [],
    classes: [],
    subjects: [],
    schedules: [],
    yearId: "",
    classId: "",
    semester: 1,
    month: new Date().getMonth(),
    year: new Date().getFullYear()
};

function calendarPlannerEscape(value) {
    if (typeof escapeHtml === "function") return escapeHtml(String(value ?? ""));
    return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char]));
}

function calendarPlannerEnsureStyles() {
    if (document.getElementById("calendarPlannerStyles")) return;
    const style = document.createElement("style");
    style.id = "calendarPlannerStyles";
    style.textContent = `
        .calendar-planner{padding:22px;max-width:1200px;margin:0 auto}
        .calendar-planner-header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}
        .calendar-planner-header h2{margin:0 0 5px;font-size:22px}
        .calendar-planner-header p{margin:0;color:#667085;font-size:13px}
        .calendar-planner-actions{display:flex;gap:8px;flex-wrap:wrap}
        .calendar-planner-filters{display:grid;grid-template-columns:1.2fr 1fr .8fr;gap:14px;background:#fff;border:1px solid #e4e7ec;border-radius:14px;padding:16px;margin-bottom:18px}
        .calendar-planner-filter label{display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:#344054}
        .calendar-planner-filter select{width:100%;min-height:40px;border:1px solid #d0d5dd;border-radius:8px;padding:0 10px;background:#fff}
        .calendar-planner-card{background:#fff;border:1px solid #e4e7ec;border-radius:14px;overflow:hidden}
        .calendar-planner-toolbar{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid #eaecf0}
        .calendar-planner-toolbar h3{margin:0;font-size:18px}
        .calendar-planner-nav{display:flex;gap:6px}
        .calendar-planner-nav button{width:34px;height:34px;border:1px solid #d0d5dd;border-radius:8px;background:#fff;cursor:pointer}
        .calendar-planner-grid{display:grid;grid-template-columns:repeat(7,1fr)}
        .calendar-planner-weekday{padding:10px 8px;text-align:center;font-size:11px;font-weight:700;color:#667085;background:#f9fafb;border-bottom:1px solid #eaecf0}
        .calendar-planner-day{min-height:105px;border-right:1px solid #eaecf0;border-bottom:1px solid #eaecf0;padding:8px;background:#fff}
        .calendar-planner-day:nth-child(7n){border-right:0}
        .calendar-planner-day.muted{background:#f9fafb;color:#98a2b3}
        .calendar-planner-day.today{box-shadow:inset 0 3px 0 #175cd3}
        .calendar-planner-day-number{font-size:12px;font-weight:700;margin-bottom:6px}
        .calendar-planner-event{display:block;border-radius:6px;padding:5px 6px;margin-bottom:4px;background:#eff8ff;border-left:3px solid #175cd3;font-size:10px;line-height:1.35;overflow:hidden}
        .calendar-planner-event.practical{background:#ecfdf3;border-left-color:#039855}
        .calendar-planner-event strong{display:block;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .calendar-planner-event span{display:block;color:#475467;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .calendar-planner-empty{text-align:center;padding:45px 20px;color:#667085}
        .calendar-planner-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}
        .calendar-planner-stat{border:1px solid #e4e7ec;border-radius:12px;padding:14px;background:#fff}
        .calendar-planner-stat span{display:block;color:#667085;font-size:11px}.calendar-planner-stat strong{display:block;font-size:20px;margin-top:4px}
        @media(max-width:700px){.calendar-planner{padding:14px}.calendar-planner-header{display:block}.calendar-planner-actions{margin-top:12px}.calendar-planner-filters{grid-template-columns:1fr}.calendar-planner-day{min-height:80px;padding:5px}.calendar-planner-event{padding:4px}.calendar-planner-summary{grid-template-columns:1fr}.calendar-planner-event span{display:none}}
        @media print{body *{visibility:hidden!important}.calendar-planner,.calendar-planner *{visibility:visible!important}.calendar-planner{position:absolute;left:0;top:0;width:100%;max-width:none}.calendar-planner-actions,.calendar-planner-filters,.calendar-planner-nav{display:none!important}.calendar-planner-card{border:0}.calendar-planner-day{min-height:95px}}
    `;
    document.head.appendChild(style);
}

function calendarPlannerEnsureWorkspace() {
    let workspace = document.getElementById("calendarPlannerWorkspace");
    if (workspace) return workspace;
    const main = document.querySelector(".app-content");
    if (!main) return null;
    workspace = document.createElement("section");
    workspace.id = "calendarPlannerWorkspace";
    workspace.className = "calendar-planner hidden";
    workspace.innerHTML = `
        <div class="calendar-planner-header">
            <div>
                <h2>Kalender Sumatif</h2>
                <p>Resume jadwal sumatif berdasarkan tahun pelajaran, kelas, dan semester.</p>
            </div>
            <div class="calendar-planner-actions">
                <button type="button" class="secondary-button" id="calendarPlannerToday">Hari Ini</button>
                <button type="button" class="primary-button" id="calendarPlannerPrint">Cetak Kalender</button>
            </div>
        </div>
        <div class="calendar-planner-filters">
            <div class="calendar-planner-filter"><label for="calendarPlannerYear">Tahun Pelajaran</label><select id="calendarPlannerYear"><option value="">Pilih Tahun Pelajaran</option></select></div>
            <div class="calendar-planner-filter"><label for="calendarPlannerClass">Kelas</label><select id="calendarPlannerClass"><option value="">Pilih Kelas</option></select></div>
            <div class="calendar-planner-filter"><label for="calendarPlannerSemester">Semester</label><select id="calendarPlannerSemester"><option value="1">Ganjil</option><option value="2">Genap</option></select></div>
        </div>
        <div class="calendar-planner-card">
            <div class="calendar-planner-toolbar">
                <h3 id="calendarPlannerMonthTitle">-</h3>
                <div class="calendar-planner-nav"><button type="button" id="calendarPlannerPrev" aria-label="Bulan sebelumnya">‹</button><button type="button" id="calendarPlannerNext" aria-label="Bulan berikutnya">›</button></div>
            </div>
            <div id="calendarPlannerGrid"></div>
        </div>
        <div class="calendar-planner-summary">
            <div class="calendar-planner-stat"><span>Total Jadwal</span><strong id="calendarPlannerTotal">0</strong></div>
            <div class="calendar-planner-stat"><span>Tes Tertulis</span><strong id="calendarPlannerWritten">0</strong></div>
            <div class="calendar-planner-stat"><span>Tes Praktik</span><strong id="calendarPlannerPractical">0</strong></div>
        </div>
    `;
    main.appendChild(workspace);
    calendarPlannerEnsureStyles();

    document.getElementById("calendarPlannerYear")?.addEventListener("change", async event => {
        calendarPlannerState.yearId = event.target.value;
        await calendarPlannerLoadSchedules();
    });
    document.getElementById("calendarPlannerClass")?.addEventListener("change", async event => {
        calendarPlannerState.classId = event.target.value;
        await calendarPlannerLoadSchedules();
    });
    document.getElementById("calendarPlannerSemester")?.addEventListener("change", async event => {
        calendarPlannerState.semester = Number(event.target.value);
        await calendarPlannerLoadSchedules();
    });
    document.getElementById("calendarPlannerPrev")?.addEventListener("click", () => calendarPlannerChangeMonth(-1));
    document.getElementById("calendarPlannerNext")?.addEventListener("click", () => calendarPlannerChangeMonth(1));
    document.getElementById("calendarPlannerToday")?.addEventListener("click", () => {
        const today = new Date();
        calendarPlannerState.month = today.getMonth();
        calendarPlannerState.year = today.getFullYear();
        renderCalendarPlanner();
    });
    document.getElementById("calendarPlannerPrint")?.addEventListener("click", () => window.print());
    return workspace;
}

async function calendarPlannerLoadContext() {
    const { data: years, error: yearError } = await supabaseClient.from("academic_years").select("id,name").order("name", { ascending: false });
    if (yearError) throw yearError;
    const { data: classes, error: classError } = await supabaseClient.from("classes").select("id,name").order("name", { ascending: true });
    if (classError) throw classError;
    calendarPlannerState.years = years || [];
    calendarPlannerState.classes = classes || [];

    const yearSelect = document.getElementById("calendarPlannerYear");
    const classSelect = document.getElementById("calendarPlannerClass");
    if (!yearSelect || !classSelect) return;
    yearSelect.innerHTML = `<option value="">Pilih Tahun Pelajaran</option>` + calendarPlannerState.years.map(item => `<option value="${calendarPlannerEscape(item.id)}">${calendarPlannerEscape(item.name)}</option>`).join("");
    classSelect.innerHTML = `<option value="">Pilih Kelas</option>` + calendarPlannerState.classes.map(item => `<option value="${calendarPlannerEscape(item.id)}">${calendarPlannerEscape(item.name)}</option>`).join("");

    if (typeof scheduleContext !== "undefined") {
        if (scheduleContext.academicYearId) calendarPlannerState.yearId = scheduleContext.academicYearId;
        if (scheduleContext.classId) calendarPlannerState.classId = scheduleContext.classId;
        if (scheduleContext.semester) calendarPlannerState.semester = Number(scheduleContext.semester);
    }
    yearSelect.value = calendarPlannerState.yearId || "";
    classSelect.value = calendarPlannerState.classId || "";
    document.getElementById("calendarPlannerSemester").value = String(calendarPlannerState.semester);
}

async function calendarPlannerLoadSchedules() {
    if (!calendarPlannerState.yearId || !calendarPlannerState.classId) {
        calendarPlannerState.schedules = [];
        renderCalendarPlanner();
        return;
    }
    const user = await getCurrentUser();
    if (!user) return;
    const { data, error } = await supabaseClient
        .from("sumatif_schedules")
        .select("id,academic_year_id,semester,class_id,subject_id,teacher_id,sumatif_number,date,start_time,end_time,material,assessment_type,room,notes,status")
        .eq("academic_year_id", calendarPlannerState.yearId)
        .eq("semester", calendarPlannerState.semester)
        .eq("class_id", calendarPlannerState.classId)
        .eq("teacher_id", user.id)
        .neq("status", "cancelled")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });
    if (error) throw error;
    calendarPlannerState.schedules = data || [];
    renderCalendarPlanner();
}

function calendarPlannerChangeMonth(delta) {
    const date = new Date(calendarPlannerState.year, calendarPlannerState.month + delta, 1);
    calendarPlannerState.month = date.getMonth();
    calendarPlannerState.year = date.getFullYear();
    renderCalendarPlanner();
}

function calendarPlannerSubjectName(id) {
    const subject = (typeof scheduleSubjects !== "undefined" ? scheduleSubjects : []).find(item => String(item.id) === String(id));
    return subject?.name || "Mata Pelajaran";
}

function renderCalendarPlanner() {
    const grid = document.getElementById("calendarPlannerGrid");
    const title = document.getElementById("calendarPlannerMonthTitle");
    if (!grid || !title) return;
    const monthName = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(calendarPlannerState.year, calendarPlannerState.month, 1));
    title.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const first = new Date(calendarPlannerState.year, calendarPlannerState.month, 1);
    const daysInMonth = new Date(calendarPlannerState.year, calendarPlannerState.month + 1, 0).getDate();
    const start = (first.getDay() + 6) % 7;
    const prevDays = new Date(calendarPlannerState.year, calendarPlannerState.month, 0).getDate();
    const cells = [];
    const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    weekdays.forEach(day => cells.push(`<div class="calendar-planner-weekday">${day}</div>`));

    const schedules = calendarPlannerState.schedules || [];
    const today = new Date();
    const makeDateKey = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const eventsFor = key => schedules.filter(item => String(item.date).slice(0,10) === key);

    for (let i = 0; i < start; i++) {
        const day = prevDays - start + i + 1;
        cells.push(`<div class="calendar-planner-day muted"><div class="calendar-planner-day-number">${day}</div></div>`);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const key = makeDateKey(calendarPlannerState.year, calendarPlannerState.month, day);
        const isToday = today.getFullYear() === calendarPlannerState.year && today.getMonth() === calendarPlannerState.month && today.getDate() === day;
        const events = eventsFor(key);
        cells.push(`<div class="calendar-planner-day${isToday ? " today" : ""}"><div class="calendar-planner-day-number">${day}</div>${events.map(item => {
            const practical = item.assessment_type === "practical";
            const time = item.start_time && item.end_time ? `${String(item.start_time).slice(0,5)}–${String(item.end_time).slice(0,5)}` : "";
            return `<div class="calendar-planner-event ${practical ? "practical" : ""}" title="${calendarPlannerEscape(`${calendarPlannerSubjectName(item.subject_id)} · Sumatif ${item.sumatif_number}`)}"><strong>${calendarPlannerEscape(calendarPlannerSubjectName(item.subject_id))}</strong><span>S${item.sumatif_number} · ${calendarPlannerEscape(time)}</span></div>`;
        }).join("")}</div>`);
    }
    while (cells.length < 49) cells.push(`<div class="calendar-planner-day muted"></div>`);
    grid.innerHTML = `<div class="calendar-planner-grid">${cells.join("")}</div>`;

    document.getElementById("calendarPlannerTotal").textContent = schedules.length;
    document.getElementById("calendarPlannerWritten").textContent = schedules.filter(item => item.assessment_type === "written").length;
    document.getElementById("calendarPlannerPractical").textContent = schedules.filter(item => item.assessment_type === "practical").length;
}

async function openCalendarPlanner() {
    const workspace = calendarPlannerEnsureWorkspace();
    if (!workspace) return;
    document.querySelectorAll(".dashboard-home").forEach(section => section.classList.add("hidden"));
    document.getElementById("scheduleWorkspace")?.classList.add("hidden");
    workspace.classList.remove("hidden");
    document.querySelectorAll(".sidebar-menu").forEach(button => button.classList.toggle("active", button.dataset.menu === "calendar"));
    if (!calendarPlannerState.years.length) {
        try {
            await calendarPlannerLoadContext();
        } catch (error) {
            console.error("[Calendar] Gagal memuat context:", error);
            showAppDialog(error.message || "Gagal memuat Kalender Sumatif.", "error", "Kalender Sumatif");
            return;
        }
    }
    await calendarPlannerLoadSchedules();
}

function closeCalendarPlanner() {
    document.getElementById("calendarPlannerWorkspace")?.classList.add("hidden");
}

document.addEventListener("click", event => {
    const menu = event.target.closest("[data-menu]");
    if (!menu) return;
    const target = menu.dataset.menu;
    if (target === "calendar") {
        event.preventDefault();
        openCalendarPlanner();
    } else if (target === "dashboard" || target === "schedule") {
        closeCalendarPlanner();
    }
});

calendarPlannerEnsureStyles();
