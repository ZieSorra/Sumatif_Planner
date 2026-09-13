/* =========================================================
   SUMATIF PLANNER - SUBJECT BOARD UI
   Kartu Mata Pelajaran -> Kalender -> Form Input Side Panel
   ========================================================= */

let scheduleBoardSubjectId = "";
let scheduleBoardSelectedDate = "";

/* =========================================================
   SUBJECT BOARD
   ========================================================= */

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

/* =========================================================
   CALENDAR MODAL
   ========================================================= */

function openScheduleCalendarModal(subjectId) {
    scheduleBoardSubjectId = subjectId || "";
    scheduleBoardSelectedDate = "";
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
                <button type="button" class="modal-close" id="closeScheduleCalendarButton" aria-label="Tutup">×</button>
            </div>

            <div class="schedule-calendar-modal-body">
                <div class="schedule-calendar-panel calendar-panel">
                    <div class="schedule-calendar-legend">
                        <span><i class="legend available"></i>Tersedia</span>
                        <span><i class="legend schedule"></i>Ada jadwal</span>
                        <span><i class="legend blocked"></i>Tidak tersedia</span>
                    </div>
                    <div class="calendar-grid schedule-date-picker-grid">
                        ${monthKeys.length ? monthKeys.map(renderMonthCalendar).join("") : `<div class="schedule-list-empty">Kalender pendidikan belum tersedia untuk semester ini.</div>`}
                    </div>
                </div>

                <div class="schedule-input-panel" id="scheduleInputPanel">
                    <div class="schedule-input-placeholder">
                        <div class="schedule-input-placeholder-icon">＋</div>
                        <h3>Pilih tanggal terlebih dahulu</h3>
                        <p>Klik tanggal yang tersedia pada kalender untuk mengisi detail jadwal sumatif.</p>
                    </div>
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
    scheduleBoardSelectedDate = "";
}

/* =========================================================
   DATE SELECTION
   ========================================================= */

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

    scheduleBoardSelectedDate = dateString;
    renderScheduleInputPanel(dateString, scheduleBoardSubjectId);
}

/* =========================================================
   FORM INPUT SIDE PANEL
   ========================================================= */

function renderScheduleInputPanel(dateString, subjectId) {
    const panel = document.getElementById("scheduleInputPanel");
    if (!panel) return;

    const subjectName = getSubjectName(subjectId);

    panel.innerHTML = `
        <div class="schedule-input-panel-header">
            <div>
                <div class="modal-date-label">DETAIL JADWAL</div>
                <h3>${escapeHtml(formatDateLong(dateString))}</h3>
                <p>${escapeHtml(subjectName)} · ${escapeHtml(scheduleContext.className)} · Semester ${escapeHtml(getSemesterLabel(scheduleContext.semester))}</p>
            </div>
        </div>

        <form id="scheduleInputForm" class="schedule-input-form">
            <input type="hidden" id="inputScheduleSubject" value="${escapeHtml(subjectId || "")}">

            <div class="form-group">
                <label>Mata Pelajaran</label>
                <div class="schedule-readonly-field">${escapeHtml(subjectName)}</div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label for="inputScheduleNumber">Nomor Sumatif</label>
                    <select id="inputScheduleNumber" required>
                        <option value="">Pilih Nomor</option>
                        <option value="1">Sumatif 1</option>
                        <option value="2">Sumatif 2</option>
                        <option value="3">Sumatif 3</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="inputScheduleType">Jenis Asesmen</label>
                    <select id="inputScheduleType" required>
                        <option value="">Pilih Jenis</option>
                        <option value="written">Tes Tertulis</option>
                        <option value="practical">Tes Praktik</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label for="inputScheduleMaterial">Uraian Materi</label>
                <textarea id="inputScheduleMaterial" rows="3" placeholder="Masukkan materi yang diujikan..."></textarea>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label for="inputScheduleStartTime">Waktu Mulai</label>
                    <input type="time" id="inputScheduleStartTime">
                </div>
                <div class="form-group">
                    <label for="inputScheduleEndTime">Waktu Selesai</label>
                    <input type="time" id="inputScheduleEndTime">
                </div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label for="inputScheduleRoom">Ruang</label>
                    <input type="text" id="inputScheduleRoom" placeholder="Opsional">
                </div>
                <div class="form-group">
                    <label for="inputScheduleNotes">Catatan</label>
                    <input type="text" id="inputScheduleNotes" placeholder="Opsional">
                </div>
            </div>

            <div id="scheduleInputError" class="schedule-form-error" hidden></div>

            <div class="schedule-input-panel-footer">
                <button type="button" class="secondary-button" id="cancelScheduleInputButton">Batal</button>
                <button type="submit" class="primary-button">Simpan Jadwal</button>
            </div>
        </form>
    `;

    const form = document.getElementById("scheduleInputForm");
    form?.addEventListener("submit", event => {
        saveScheduleFromCalendar(event, dateString);
    });

    document.getElementById("cancelScheduleInputButton")?.addEventListener("click", () => {
        renderScheduleInputPanel("");
    });
}

/* =========================================================
   INJECT STYLES
   ========================================================= */

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
        .schedule-add-button{width:100%;display:flex;align-items:center;justify-content:center;gap:7px;padding:10px 12px;background:#fff;color:#175cd3;border:1px dashed #98a2b3;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer}
        .schedule-add-button:hover{background:#f5f9ff;border-color:#175cd3}.schedule-add-button>span{font-size:18px;line-height:1}

        #scheduleCalendarModal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;overflow:hidden}
        #scheduleCalendarModal .schedule-calendar-modal-card{width:min(1220px,100%);max-height:calc(100vh - 40px);background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 24px 70px rgba(16,24,40,.22);display:flex;flex-direction:column}
        .schedule-calendar-modal-header{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding:22px 24px 18px;border-bottom:1px solid #eaecf0;flex-shrink:0}
        .schedule-calendar-modal-header h2{margin:4px 0 5px;font-size:21px;color:#172033}.schedule-calendar-modal-header p{margin:0;color:#667085;font-size:13px}
        .schedule-calendar-modal-body{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(390px,.85fr);gap:0;min-height:0;overflow:hidden}
        .schedule-calendar-panel{padding:18px 22px 22px;overflow:auto;min-height:0;border-right:1px solid #eaecf0}
        .schedule-calendar-legend{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:16px;color:#667085;font-size:12px}.schedule-calendar-legend span{display:inline-flex;align-items:center;gap:6px}.schedule-calendar-legend .legend{width:9px;height:9px;border-radius:50%;display:inline-block}
        .schedule-date-picker-grid{display:grid;grid-template-columns:1fr;gap:18px}.schedule-date-picker-grid .month-card{margin:0}

        .schedule-input-panel{padding:20px 22px 22px;overflow:auto;min-height:0;background:#fcfcfd}
        .schedule-input-placeholder{height:100%;min-height:420px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#667085;padding:20px;box-sizing:border-box}
        .schedule-input-placeholder-icon{width:48px;height:48px;border-radius:12px;background:#eef4ff;color:#175cd3;display:flex;align-items:center;justify-content:center;font-size:25px;margin-bottom:14px}
        .schedule-input-placeholder h3{margin:0 0 7px;color:#344054;font-size:16px}.schedule-input-placeholder p{margin:0;max-width:280px;font-size:12px;line-height:1.6}
        .schedule-input-panel-header{padding-bottom:15px;margin-bottom:17px;border-bottom:1px solid #e4e7ec}.schedule-input-panel-header h3{margin:4px 0 5px;font-size:18px;color:#172033}.schedule-input-panel-header p{margin:0;color:#667085;font-size:12px}
        .schedule-input-form{display:flex;flex-direction:column;gap:0}.schedule-input-form .form-group{margin-bottom:13px}.schedule-input-form label{display:block;margin-bottom:6px;font-size:12px;font-weight:600;color:#344054}.schedule-input-form input,.schedule-input-form select,.schedule-input-form textarea{width:100%;box-sizing:border-box;border:1px solid #d0d5dd;border-radius:8px;background:#fff;padding:9px 10px;font:inherit;font-size:12px;color:#344054;outline:none}.schedule-input-form textarea{resize:vertical;min-height:70px}.schedule-input-form input:focus,.schedule-input-form select:focus,.schedule-input-form textarea:focus{border-color:#84a9ff;box-shadow:0 0 0 3px rgba(23,92,211,.08)}
        .schedule-input-form .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.schedule-readonly-field{min-height:37px;box-sizing:border-box;display:flex;align-items:center;padding:9px 10px;border:1px solid #e4e7ec;border-radius:8px;background:#f2f4f7;color:#475467;font-size:12px}
        .schedule-form-error{margin:3px 0 13px;padding:9px 10px;border-radius:8px;background:#fef3f2;color:#b42318;font-size:11px;line-height:1.45}.schedule-form-error[hidden]{display:none}
        .schedule-input-panel-footer{display:flex;justify-content:flex-end;gap:8px;padding-top:5px}.schedule-input-panel-footer button{cursor:pointer}

        @media(max-width:1000px){.schedule-calendar-modal-body{grid-template-columns:1fr}.schedule-calendar-panel{border-right:0;border-bottom:1px solid #eaecf0;max-height:48vh}.schedule-input-panel{max-height:52vh}.schedule-input-placeholder{min-height:220px}.schedule-date-picker-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:600px){.schedule-subject-board{grid-template-columns:1fr}.schedule-subject-card-header,.schedule-subject-row{padding-left:15px;padding-right:15px}#scheduleCalendarModal{padding:9px}#scheduleCalendarModal .schedule-calendar-modal-card{width:100%;max-height:calc(100vh - 18px)}.schedule-calendar-modal-header,.schedule-calendar-panel,.schedule-input-panel{padding-left:15px;padding-right:15px}.schedule-date-picker-grid{grid-template-columns:1fr}.schedule-input-form .form-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
})();
