/* =========================================================
   SUMATIF PLANNER - SCHEDULE ACTIONS
   Edit + Hapus (soft delete)
   ========================================================= */

let scheduleActionEditingId = "";
let scheduleActionOriginalCalendarClick = null;

function scheduleActionSubjectSchedules(subjectId) {
    return (scheduleSchedules || [])
        .filter(item =>
            String(item.subject_id) === String(subjectId) &&
            String(item.status || "").toLowerCase() !== "cancelled"
        )
        .sort((a, b) => {
            const numberDiff = Number(a.sumatif_number || 0) - Number(b.sumatif_number || 0);
            if (numberDiff !== 0) return numberDiff;
            return String(a.date || "").localeCompare(String(b.date || ""));
        });
}

function decorateScheduleRows() {
    const list = document.getElementById("scheduleList");
    if (!list) return;

    list.querySelectorAll(".schedule-subject-card").forEach(card => {
        const subjectName = card.querySelector("h4")?.textContent?.trim() || "";
        const subject = (scheduleSubjects || []).find(item => String(item.name || "").trim() === subjectName);
        if (!subject) return;

        const schedules = scheduleActionSubjectSchedules(subject.id);
        const rows = card.querySelectorAll(".schedule-subject-row");

        rows.forEach((row, index) => {
            const item = schedules[index];
            if (!item || row.querySelector(".schedule-row-actions")) return;

            const actions = document.createElement("div");
            actions.className = "schedule-row-actions";
            actions.innerHTML = `
                <button type="button" class="schedule-action-btn edit" data-edit-schedule="${item.id}" title="Edit jadwal" aria-label="Edit jadwal">✎</button>
                <button type="button" class="schedule-action-btn delete" data-delete-schedule="${item.id}" title="Hapus jadwal" aria-label="Hapus jadwal">🗑</button>
            `;

            const meta = row.querySelector(".schedule-subject-row-meta");
            if (meta) meta.appendChild(actions);
            else row.appendChild(actions);
        });
    });
}

function findScheduleById(id) {
    return (scheduleSchedules || []).find(item => String(item.id) === String(id));
}

function openEditSchedule(id) {
    const item = findScheduleById(id);
    if (!item) {
        showAppDialog("Jadwal tidak ditemukan.", "error", "Gagal Membuka Jadwal");
        return;
    }

    scheduleActionEditingId = item.id;
    scheduleBoardSubjectId = item.subject_id;
    scheduleBoardSelectedDate = item.date;

    openScheduleCalendarModal(item.subject_id);
    renderEditScheduleForm(item.date, item);
}

function renderEditScheduleForm(dateString, item) {
    const panel = document.getElementById("scheduleInputPanel");
    if (!panel) return;

    const subjectName = getSubjectName(item.subject_id);

    panel.innerHTML = `
        <div class="schedule-input-panel-header">
            <div>
                <div class="modal-date-label">EDIT JADWAL</div>
                <h3>${escapeHtml(formatDateLong(dateString))}</h3>
                <p>${escapeHtml(subjectName)} · ${escapeHtml(scheduleContext.className)} · Semester ${escapeHtml(getSemesterLabel(scheduleContext.semester))}</p>
            </div>
        </div>

        <form id="scheduleEditForm" class="schedule-input-form">
            <div class="form-group">
                <label>Mata Pelajaran</label>
                <div class="schedule-readonly-field">${escapeHtml(subjectName)}</div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label for="editScheduleNumber">Nomor Sumatif</label>
                    <select id="editScheduleNumber" required>
                        <option value="1">Sumatif 1</option>
                        <option value="2">Sumatif 2</option>
                        <option value="3">Sumatif 3</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editScheduleType">Jenis Asesmen</label>
                    <select id="editScheduleType" required>
                        <option value="written">Tes Tertulis</option>
                        <option value="practical">Tes Praktik</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label for="editScheduleMaterial">Uraian Materi</label>
                <textarea id="editScheduleMaterial" rows="3">${escapeHtml(item.material || "")}</textarea>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label for="editScheduleStartTime">Waktu Mulai</label>
                    <input type="time" id="editScheduleStartTime" value="${escapeHtml(String(item.start_time || "").slice(0,5))}">
                </div>
                <div class="form-group">
                    <label for="editScheduleEndTime">Waktu Selesai</label>
                    <input type="time" id="editScheduleEndTime" value="${escapeHtml(String(item.end_time || "").slice(0,5))}">
                </div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label for="editScheduleRoom">Ruang</label>
                    <input type="text" id="editScheduleRoom" value="${escapeHtml(item.room || "")}" placeholder="Opsional">
                </div>
                <div class="form-group">
                    <label for="editScheduleNotes">Catatan</label>
                    <input type="text" id="editScheduleNotes" value="${escapeHtml(item.notes || "")}" placeholder="Opsional">
                </div>
            </div>

            <div class="form-group">
                <label for="editScheduleDate">Tanggal</label>
                <input type="date" id="editScheduleDate" value="${escapeHtml(dateString)}" required>
                <small class="schedule-edit-hint">Tanggal harus merupakan hari yang tersedia pada Kalender Pendidikan.</small>
            </div>

            <div id="scheduleEditError" class="schedule-form-error" hidden></div>

            <div class="schedule-input-panel-footer">
                <button type="button" class="secondary-button" id="cancelScheduleEditButton">Batal</button>
                <button type="submit" class="primary-button">Simpan Perubahan</button>
            </div>
        </form>
    `;

    document.getElementById("editScheduleNumber").value = String(item.sumatif_number);
    document.getElementById("editScheduleType").value = String(item.assessment_type || "written");

    document.getElementById("scheduleEditForm")?.addEventListener("submit", event => {
        updateScheduleFromBoard(event, item);
    });

    document.getElementById("cancelScheduleEditButton")?.addEventListener("click", () => {
        scheduleActionEditingId = "";
        closeScheduleCalendarModal();
    });
}

async function updateScheduleFromBoard(event, originalItem) {
    event.preventDefault();
    const errorElement = document.getElementById("scheduleEditError");
    if (errorElement) { errorElement.hidden = true; errorElement.textContent = ""; }

    try {
        const date = document.getElementById("editScheduleDate")?.value || "";
        const sumatifNumber = Number(document.getElementById("editScheduleNumber")?.value || 0);
        const assessmentType = document.getElementById("editScheduleType")?.value || "";
        const material = document.getElementById("editScheduleMaterial")?.value?.trim() || "";
        const startTime = document.getElementById("editScheduleStartTime")?.value || null;
        const endTime = document.getElementById("editScheduleEndTime")?.value || null;
        const room = document.getElementById("editScheduleRoom")?.value?.trim() || null;
        const notes = document.getElementById("editScheduleNotes")?.value?.trim() || null;

        if (!date) throw new Error("Tanggal wajib dipilih.");
        if (!sumatifNumber) throw new Error("Nomor sumatif wajib dipilih.");
        if (!assessmentType) throw new Error("Jenis asesmen wajib dipilih.");
        if (startTime && endTime && startTime >= endTime) throw new Error("Waktu selesai harus lebih besar dari waktu mulai.");

        const calendarDay = getCalendarDay(date);
        if (!calendarDay || calendarDay.is_selectable !== true) {
            throw new Error("Tanggal tersebut tidak tersedia pada Kalender Pendidikan.");
        }

        const duplicate = (scheduleSchedules || []).some(item =>
            String(item.id) !== String(originalItem.id) &&
            String(item.subject_id) === String(originalItem.subject_id) &&
            Number(item.sumatif_number) === sumatifNumber &&
            String(item.status || "").toLowerCase() !== "cancelled"
        );
        if (duplicate) throw new Error("Nomor sumatif tersebut sudah digunakan untuk mata pelajaran ini.");

        if (typeof validateScheduleRules === "function") {
            const originalSchedules = scheduleSchedules;
            scheduleSchedules = originalSchedules.filter(item => String(item.id) !== String(originalItem.id));
            try {
                validateScheduleRules(date, assessmentType, startTime, endTime);
            } finally {
                scheduleSchedules = originalSchedules;
            }
        }

        const { data, error } = await supabaseClient
            .from("sumatif_schedules")
            .update({
                date,
                sumatif_number: sumatifNumber,
                assessment_type: assessmentType,
                material: material || null,
                start_time: startTime,
                end_time: endTime,
                room,
                notes,
                updated_at: new Date().toISOString()
            })
            .eq("id", originalItem.id)
            .select()
            .single();

        if (error) throw error;

        console.log("[Schedule] Berhasil diperbarui:", data);
        scheduleActionEditingId = "";
        closeScheduleCalendarModal();
        await loadScheduleData();
        renderEducationCalendar();
        renderScheduleList();
        decorateScheduleRows();
        showAppDialog("Jadwal sumatif berhasil diperbarui.", "success", "Jadwal Berhasil Diperbarui");
    } catch (error) {
        console.error("[Schedule] Gagal memperbarui:", error);
        if (errorElement) {
            errorElement.textContent = error.message || "Jadwal gagal diperbarui.";
            errorElement.hidden = false;
        }
    }
}

async function deleteScheduleFromBoard(id) {
    const item = findScheduleById(id);
    if (!item) {
        showAppDialog("Jadwal tidak ditemukan.", "error", "Gagal Menghapus Jadwal");
        return;
    }

    const subjectName = getSubjectName(item.subject_id);
    const confirmed = window.confirm(
        `Hapus jadwal ${subjectName} - Sumatif ${item.sumatif_number} pada ${formatDateLong(item.date)}?\n\nJadwal akan dinonaktifkan, bukan dihapus permanen.`
    );
    if (!confirmed) return;

    try {
        const { error } = await supabaseClient
            .from("sumatif_schedules")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("id", item.id);

        if (error) throw error;

        console.log("[Schedule] Berhasil dibatalkan:", item.id);
        await loadScheduleData();
        renderEducationCalendar();
        renderScheduleList();
        decorateScheduleRows();
        showAppDialog("Jadwal sumatif berhasil dihapus.", "success", "Jadwal Dihapus");
    } catch (error) {
        console.error("[Schedule] Gagal menghapus:", error);
        showAppDialog(error.message || "Jadwal gagal dihapus.", "error", "Gagal Menghapus Jadwal");
    }
}

/* =========================================================
   EVENT DELEGATION
   ========================================================= */

document.addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-schedule]");
    if (editButton) {
        event.preventDefault();
        openEditSchedule(editButton.dataset.editSchedule);
        return;
    }

    const deleteButton = event.target.closest("[data-delete-schedule]");
    if (deleteButton) {
        event.preventDefault();
        deleteScheduleFromBoard(deleteButton.dataset.deleteSchedule);
    }
});

/* =========================================================
   EDIT CALENDAR DATE SUPPORT
   ========================================================= */

(function installEditDateSupport() {
    if (window.__scheduleEditDateSupportInstalled) return;
    window.__scheduleEditDateSupportInstalled = true;

    scheduleActionOriginalCalendarClick = window.handleCalendarDateClick;

    window.handleCalendarDateClick = function(dateString) {
        if (!scheduleActionEditingId) {
            if (typeof scheduleActionOriginalCalendarClick === "function") {
                return scheduleActionOriginalCalendarClick(dateString);
            }
            return;
        }

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
        const item = findScheduleById(scheduleActionEditingId);
        if (item) renderEditScheduleForm(dateString, item);
    };
})();

/* =========================================================
   DECORATE AFTER RENDER
   ========================================================= */

const scheduleActionObserver = new MutationObserver(() => {
    if (document.getElementById("scheduleList")) decorateScheduleRows();
});

function initScheduleActions() {
    const list = document.getElementById("scheduleList");
    if (!list) return;
    scheduleActionObserver.observe(list, { childList: true, subtree: true });
    decorateScheduleRows();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScheduleActions);
} else {
    initScheduleActions();
}

(function injectScheduleActionStyles() {
    if (document.getElementById("scheduleActionStyles")) return;
    const style = document.createElement("style");
    style.id = "scheduleActionStyles";
    style.textContent = `
        .schedule-subject-row{position:relative}
        .schedule-subject-row-meta{min-width:150px}
        .schedule-row-actions{display:flex;align-items:center;gap:5px;margin-top:2px}
        .schedule-action-btn{width:27px;height:27px;border:1px solid #d0d5dd;border-radius:7px;background:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;line-height:1}
        .schedule-action-btn:hover{background:#f2f4f7}
        .schedule-action-btn.delete{color:#b42318}
        .schedule-action-btn.edit{color:#175cd3}
        .schedule-edit-hint{display:block;margin-top:5px;color:#667085;font-size:11px}
        @media(max-width:600px){.schedule-subject-row-meta{min-width:100px}.schedule-row-actions{justify-content:flex-end}}
    `;
    document.head.appendChild(style);
})();
