/* =========================================================
   SUMATIF PLANNER - SUBJECT BOARD UI
   Tampilan baru Jadwal Sumatif:
   Kartu Mata Pelajaran -> + Tambah Jadwal -> Kalender Modal -> Form
   ========================================================= */

const scheduleLegacyOpenScheduleInputModal =
    window.openScheduleInputModal;

let scheduleBoardSubjectId = "";


/* =========================================================
   RENDER SUBJECT BOARD
   ========================================================= */

function renderScheduleList() {

    const section = document.getElementById("scheduleListSection");
    const list = document.getElementById("scheduleList");
    const calendarSection = document.getElementById("educationCalendarSection");
    const empty = document.getElementById("calendarEmpty");

    if (!section || !list) {
        return;
    }

    if (
        !scheduleContext.academicYearId ||
        !scheduleContext.classId ||
        !scheduleContext.semester
    ) {
        section.classList.add("hidden");
        if (calendarSection) calendarSection.classList.add("hidden");
        if (empty) empty.classList.remove("hidden");
        return;
    }

    if (calendarSection) {
        calendarSection.classList.add("hidden");
    }

    if (empty) {
        empty.classList.add("hidden");
    }

    section.classList.remove("hidden");

    const header = section.querySelector(".schedule-list-header");
    if (header) {
        header.innerHTML = `
            <div>
                <h3>Jadwal Sumatif</h3>
                <p>
                    ${escapeHtml(scheduleContext.academicYearName)} ·
                    ${escapeHtml(scheduleContext.className)} ·
                    Semester ${escapeHtml(getSemesterLabel(scheduleContext.semester))}
                </p>
            </div>
        `;
    }

    const subjects = [...scheduleSubjects].sort((a, b) =>
        String(a.name || "").localeCompare(
            String(b.name || ""),
            "id-ID"
        )
    );

    if (!subjects.length) {
        list.innerHTML = `
            <div class="schedule-list-empty">
                Mata pelajaran belum tersedia.
            </div>
        `;
        return;
    }

    list.className = "schedule-subject-board";

    list.innerHTML = subjects.map(subject => {

        const subjectSchedules = scheduleSchedules
            .filter(item =>
                String(item.subject_id) === String(subject.id) &&
                String(item.status || "").toLowerCase() !== "cancelled"
            )
            .sort((a, b) => {
                const numberDiff =
                    Number(a.sumatif_number || 0) -
                    Number(b.sumatif_number || 0);

                if (numberDiff !== 0) return numberDiff;

                return String(a.date || "").localeCompare(String(b.date || ""));
            });

        const scheduleRows = subjectSchedules.length
            ? subjectSchedules.map(item => `
                <div class="schedule-subject-row">
                    <div class="schedule-subject-row-main">
                        <strong>
                            Sumatif ${escapeHtml(item.sumatif_number)}
                            <span class="schedule-row-date">
                                ${escapeHtml(formatDateLong(item.date))}
                            </span>
                        </strong>
                        <span class="schedule-row-material">
                            ${escapeHtml(item.material || "Tanpa uraian materi")}
                        </span>
                    </div>
                    <div class="schedule-subject-row-meta">
                        <span class="schedule-type-badge ${
                            String(item.assessment_type || "").toLowerCase() === "practical"
                                ? "practical"
                                : "written"
                        }">
                            ${escapeHtml(formatAssessmentType(item.assessment_type))}
                        </span>
                        ${
                            item.start_time && item.end_time
                                ? `<span>${escapeHtml(String(item.start_time).slice(0, 5))}–${escapeHtml(String(item.end_time).slice(0, 5))}</span>`
                                : ""
                        }
                    </div>
                </div>
            `).join("")
            : `
                <div class="schedule-subject-empty">
                    Belum ada jadwal sumatif.
                </div>
            `;

        return `
            <article class="schedule-subject-card">
                <div class="schedule-subject-card-header">
                    <div>
                        <h4>${escapeHtml(subject.name)}</h4>
                        ${subject.short_name ? `<span>${escapeHtml(subject.short_name)}</span>` : ""}
                    </div>
                    <span class="schedule-subject-count">
                        ${subjectSchedules.length} jadwal
                    </span>
                </div>

                <div class="schedule-subject-rows">
                    ${scheduleRows}
                </div>

                <div class="schedule-subject-card-footer">
                    <button
                        type="button"
                        class="schedule-add-button"
                        data-add-subject="${escapeHtml(subject.id)}"
                    >
                        <span aria-hidden="true">+</span>
                        Tambah Jadwal
                    </button>
                </div>
            </article>
        `;
    }).join("");
}


/* =========================================================
   ADD BUTTON -> CALENDAR MODAL
   ========================================================= */

document.addEventListener("click", function (event) {

    const button = event.target.closest("[data-add-subject]");

    if (!button) {
        return;
    }

    event.preventDefault();

    const subjectId = button.dataset.addSubject || "";

    openScheduleCalendarModal(subjectId);
});


function openScheduleCalendarModal(subjectId) {

    scheduleBoardSubjectId = subjectId || "";

    closeScheduleCalendarModal();

    const subjectName = getSubjectName(scheduleBoardSubjectId);

    const modal = document.createElement("div");
    modal.id = "scheduleCalendarModal";
    modal.className = "modal-overlay";

    const monthKeys = getCalendarMonthKeys();

    modal.innerHTML = `
        <div class="schedule-calendar-modal-card">
            <div class="schedule-calendar-modal-header">
                <div>
                    <div class="modal-date-label">TAMBAH JADWAL SUMATIF</div>
                    <h2>Pilih Tanggal</h2>
                    <p>
                        ${escapeHtml(subjectName)} ·
                        ${escapeHtml(scheduleContext.className)} ·
                        Semester ${escapeHtml(getSemesterLabel(scheduleContext.semester))}
                    </p>
                </div>

                <button
                    type="button"
                    class="modal-close"
                    id="closeScheduleCalendarButton"
                    aria-label="Tutup kalender"
                >×</button>
            </div>

            <div class="schedule-calendar-modal-body">
                <div class="schedule-calendar-legend">
                    <span><i class="legend available"></i>Tersedia</span>
                    <span><i class="legend schedule"></i>Ada jadwal</span>
                    <span><i class="legend blocked"></i>Tidak tersedia</span>
                </div>

                <div id="scheduleDatePickerGrid" class="calendar-grid schedule-date-picker-grid">
                    ${
                        monthKeys.length
                            ? monthKeys.map(monthKey => renderMonthCalendar(monthKey)).join("")
                            : `<div class="schedule-list-empty">Kalender pendidikan belum tersedia untuk semester ini.</div>`
                    }
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
        modal.classList.add("show");
    });

    document
        .getElementById("closeScheduleCalendarButton")
        ?.addEventListener("click", closeScheduleCalendarModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeScheduleCalendarModal();
        }
    });
}


function closeScheduleCalendarModal() {

    const modal = document.getElementById("scheduleCalendarModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("show");

    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 180);
}


/* =========================================================
   DATE CLICK IN CALENDAR MODAL
   ========================================================= */

function handleCalendarDateClick(dateString) {

    const calendarDay = getCalendarDay(dateString);

    if (!calendarDay) {
        showScheduleMessage(
            "Tanggal tersebut tidak tersedia pada kalender pendidikan."
        );
        return;
    }

    if (calendarDay.is_selectable !== true) {
        showUnavailableDate(dateString, calendarDay);
        return;
    }

    closeScheduleCalendarModal();

    openScheduleInputModal(
        dateString,
        scheduleBoardSubjectId
    );
}


/* =========================================================
   OPEN EXISTING INPUT FORM + PRESELECT SUBJECT
   ========================================================= */

function openScheduleInputModal(dateString, subjectId) {

    if (typeof scheduleLegacyOpenScheduleInputModal !== "function") {
        console.error("[Schedule Board] Modal input lama tidak tersedia.");
        return;
    }

    scheduleLegacyOpenScheduleInputModal(dateString);

    requestAnimationFrame(() => {
        const subjectSelect = document.getElementById("inputScheduleSubject");

        if (subjectSelect && subjectId) {
            subjectSelect.value = subjectId;
        }
    });
}
