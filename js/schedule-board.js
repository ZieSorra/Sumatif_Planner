/* =========================================================
   SUMATIF PLANNER - SUBJECT BOARD UI
   Kartu Mata Pelajaran -> Kalender Modal -> Form Input
   ========================================================= */

const scheduleLegacyOpenScheduleInputModal =
    window.openScheduleInputModal;

let scheduleBoardSubjectId = "";

function renderScheduleList() {
    const section = document.getElementById("scheduleListSection");
    const list = document.getElementById("scheduleList");
    const calendarSection = document.getElementById("educationCalendarSection");
    const empty = document.getElementById("calendarEmpty");

    if (!section || !list) return;

    if (!scheduleContext.academicYearId || !scheduleContext.classId || !scheduleContext.semester) {
        section.classList.add("hidden");
        calendarSection?.classList.add("hidden");
        empty?.classList.remove("hidden");
        return;
    }

    calendarSection?.classList.add("hidden");
    empty?.classList.add("hidden");
    section.classList.remove("hidden");

    const header = section.querySelector(".schedule-list-header");
    if (header) {
        header.innerHTML = `
            <div>
                <h3>Jadwal Sumatif</h3>
                <p>${escapeHtml(scheduleContext.academicYearName)} · ${escapeHtml(scheduleContext.className)} · Semester ${escapeHtml(getSemesterLabel(scheduleContext.semester))}</p>
            </div>
        `;
    }

    const subjects = [...scheduleSubjects].sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""), "id-ID")
    );

    if (!subjects.length) {
        list.innerHTML = `<div class="schedule-list-empty">Mata pelajaran belum tersedia.</div>`;
        return;
    }

    list.className = "schedule-subject-board";

    list.innerHTML = subjects.map(subject => {
        const schedules = scheduleSchedules
            .filter(item =>
                String(item.subject_id) === String(subject.id) &&
                String(item.status || "").toLowerCase() !== "cancelled"
            )
            .sort((a, b) => {
                const numberDiff = Number(a.sumatif_number || 0) - Number(b.sumatif_number || 0);
                if (numberDiff !== 0) return numberDiff;
                return String(a.date || "").localeCompare(String(b.date || ""));
            });

        const rows = schedules.length
            ? schedules.map(item => `
                <div class="schedule-subject-row">
                    <div class="schedule-subject-row-main">
                        <strong>
                            Sumatif ${escapeHtml(item.sumatif_number)}
                            <span class="schedule-row-date">${escapeHtml(formatDateLong(item.date))}</span>
                        </strong>
                        <span class="schedule-row-material">${escapeHtml(item.material || "Tanpa uraian materi")}</span>
                    </div>
                    <div class="schedule-subject-row-meta">
                        <span class="schedule-type-badge ${String(item.assessment_type || "").toLowerCase() === "practical" ? "practical" : "written"}">${escapeHtml(formatAssessmentType(item.assessment_type))}</span>
                        ${item.start_time && item.end_time ? `<span>${escapeHtml(String(item.start_time).slice(0, 5))}–${escapeHtml(String(item.end_time).slice(0, 5))}</span>` : ""}
                    </div>
                </div>
            `).join("")
            : `<div class="schedule-subject-empty">Belum ada jadwal sumatif.</div>`;

        return `
            <article class="schedule-subject-card">
                <div class="schedule-subject-card-header">
                    <div>
                        <h4>${escapeHtml(subject.name)}</h4>
                        ${subject.short_name ? `<span>${escapeHtml(subject.short_name)}</span>` : ""}
                    </div>
                    <span class="schedule-subject-count">${schedules.length} jadwal</span>
                </div>
                <div class="schedule-subject-rows">${rows}</div>
                <div class="schedule-subject-card-footer">
                    <button type="button" class="schedule-add-button" data-add-subject="${escapeHtml(subject.id)}">
                        <span aria-hidden="true">+</span> Tambah Jadwal
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

document.addEventListener("click", event => {
    const button = event.target.closest("[data-add-subject]");
    if (!button) return;
    event.preventDefault();
    openScheduleCalendarModal(button.dataset.addSubject || "");
});

function openScheduleCalendarModal(subjectId) {
    scheduleBoardSubjectId = subjectId || "";
    closeScheduleCalendarModal();

    const modal = document.createElement("div");
    modal.id = "scheduleCalendarModal";
    modal.className = "modal-overlay";

    const monthKeys = getCalendarMonthKeys();
    const subjectName = getSubjectName(scheduleBoardSubjectId);

    modal.innerHTML = `
        <div class="schedule-calendar-modal-card">
            <div class="schedule-calendar-modal-header">
                <div>
                    <div class="modal-date-label">TAMBAH JADWAL SUMATIF</div>
                    <h2>Pilih Tanggal</h2>
                    <p>${escapeHtml(subjectName)} · ${escapeHtml(scheduleContext.className)} · Semester ${escapeHtml(getSemesterLabel(scheduleContext.semester))}</p>
                </div>
                <button type="button" class="modal-close" id="closeScheduleCalendarButton" aria-label="Tutup kalender">×</button>
            </div>
            <div class="schedule-calendar-modal-body">
                <div class="schedule-calendar-legend">
                    <span><i class="legend available"></i>Tersedia</span>
                    <span><i class="legend schedule"></i>Ada jadwal</span>
                    <span><i class="legend blocked"></i>Tidak tersedia</span>
                </div>
                <div class="calendar-grid schedule-date-picker-grid">
                    ${monthKeys.length ? monthKeys.map(renderMonthCalendar).join("") : `<div class="schedule-list-empty">Kalender pendidikan belum tersedia untuk semester ini.</div>`}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("show"));

    document.getElementById("closeScheduleCalendarButton")?.addEventListener("click", closeScheduleCalendarModal);
    modal.addEventListener("click", event => {
        if (event.target === modal) closeScheduleCalendarModal();
    });
}

function closeScheduleCalendarModal() {
    const modal = document.getElementById("scheduleCalendarModal");
    if (!modal) return;
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 180);
}

function handleCalendarDateClick(dateString) {
    const calendarDay = getCalendarDay(dateString);

    if (!calendarDay) {
        showScheduleMessage("Tanggal tersebut tidak tersedia pada kalender pendidikan.");
        return;
    }

    if (calendarDay.is_selectable !== true) {
        showUnavailableDate(dateString, calendarDay);
        return;
    }

    closeScheduleCalendarModal();
    openBoardScheduleInputModal(dateString, scheduleBoardSubjectId);
}

function openBoardScheduleInputModal(dateString, subjectId) {
    if (typeof scheduleLegacyOpenScheduleInputModal !== "function") {
        console.error("[Schedule Board] Modal input lama tidak tersedia.");
        return;
    }

    scheduleLegacyOpenScheduleInputModal(dateString);

    requestAnimationFrame(() => {
        const subjectSelect = document.getElementById("inputScheduleSubject");
        if (subjectSelect && subjectId) subjectSelect.value = subjectId;
    });
}

(function injectScheduleBoardStyles() {
    if (document.getElementById("scheduleBoardStyles")) return;

    const style = document.createElement("style");
    style.id = "scheduleBoardStyles";
    style.textContent = `
        .schedule-subject-board{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
        .schedule-subject-card{background:#fff;border:1px solid #e4e7ec;border-radius:14px;overflow:hidden;box-shadow:0 3px 12px rgba(16,24,40,.05)}
        .schedule-subject-card-header{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:18px 20px 14px;border-bottom:1px solid #eef0f3}
        .schedule-subject-card-header h4{margin:0;font-size:16px;color:#172033}
        .schedule-subject-card-header>div>span{display:block;margin-top:4px;color:#667085;font-size:12px}
        .schedule-subject-count{white-space:nowrap;padding:5px 9px;border-radius:999px;background:#f2f4f7;color:#475467;font-size:12px;font-weight:600}
        .schedule-subject-row{display:flex;justify-content:space-between;gap:16px;padding:13px 20px;border-bottom:1px solid #f0f2f5}
        .schedule-subject-row-main{min-width:0}.schedule-subject-row-main strong{display:block;font-size:13px;color:#344054}
        .schedule-row-date{margin-left:7px;font-weight:500;color:#667085}.schedule-row-material{display:block;margin-top:5px;color:#667085;font-size:12px;line-height:1.45}
        .schedule-subject-row-meta{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;color:#667085;font-size:11px}
        .schedule-type-badge{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:700;background:#eef2f6;color:#344054}
        .schedule-type-badge.practical{background:#ecfdf3;color:#027a48}.schedule-type-badge.written{background:#eff6ff;color:#175cd3}
        .schedule-subject-empty{padding:18px 20px;color:#98a2b3;font-size:13px}
        .schedule-subject-card-footer{padding:12px 20px;background:#fcfcfd;border-top:1px solid #eef0f3}
        .schedule-add-button{width:100%;display:flex;align-items:center;justify-content:center;gap:7px;padding:10px 12px;background:#fff;color:#175cd3;border:1px dashed #98a2b3;border-radius:9px;font-size:13px;font-weight:700}
        .schedule-add-button:hover{background:#f5f9ff;border-color:#175cd3}.schedule-add-button>span{font-size:18px;line-height:1}
        .schedule-calendar-modal-card{width:min(1120px,calc(100vw - 32px));max-height:calc(100vh - 40px);background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 24px 70px rgba(16,24,40,.22);display:flex;flex-direction:column}
        .schedule-calendar-modal-header{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding:22px 24px 18px;border-bottom:1px solid #eaecf0}
        .schedule-calendar-modal-header h2{margin:4px 0 5px;font-size:21px;color:#172033}.schedule-calendar-modal-header p{margin:0;color:#667085;font-size:13px}
        .schedule-calendar-modal-body{padding:18px 22px 22px;overflow:auto}.schedule-calendar-legend{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:16px;color:#667085;font-size:12px}.schedule-calendar-legend span{display:inline-flex;align-items:center;gap:6px}.schedule-calendar-legend .legend{width:9px;height:9px;border-radius:50%;display:inline-block}
        .schedule-date-picker-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}#scheduleCalendarModal .month-card{margin:0}
        @media(max-width:900px){.schedule-subject-board,.schedule-date-picker-grid{grid-template-columns:1fr}}
        @media(max-width:600px){.schedule-subject-card-header,.schedule-subject-row{padding-left:15px;padding-right:15px}.schedule-calendar-modal-card{width:calc(100vw - 18px);max-height:calc(100vh - 18px)}.schedule-calendar-modal-header,.schedule-calendar-modal-body{padding-left:15px;padding-right:15px}}
    `;
    document.head.appendChild(style);
})();
