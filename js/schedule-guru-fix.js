/* =========================================================
   SUMATIF PLANNER - GURU INPUT FIX
   Fix:
   1. Guru insert tanpa .select() agar tidak gagal karena SELECT/RLS.
   2. Error database tampil jelas di panel form.
   3. Tombol Batal benar-benar kembali ke placeholder.
   4. Tanggal tanpa event education_calendar dianggap tersedia.
   5. Tanggal yang secara eksplisit is_selectable=false tetap terkunci.
   ========================================================= */
(function () {
    if (window.__scheduleGuruFixInstalled) return;
    window.__scheduleGuruFixInstalled = true;

    function errorMessage(error, fallback) {
        if (!error) return fallback;
        const parts = [error.message, error.details, error.hint]
            .filter(Boolean)
            .map(String);
        if (parts.length) return parts.join(" — ");
        if (error.code) return `Kode ${error.code}: ${fallback}`;
        return fallback;
    }

    const originalRenderInput = window.renderScheduleInputPanel;
    if (typeof originalRenderInput === "function") {
        window.renderScheduleInputPanel = function (dateString, subjectId) {
            if (!dateString) {
                const panel = document.getElementById("scheduleInputPanel");
                if (!panel) return;
                if (typeof scheduleBoardSelectedDate !== "undefined") scheduleBoardSelectedDate = "";
                panel.innerHTML = `
                    <div class="schedule-input-placeholder">
                        <div class="schedule-input-placeholder-icon">＋</div>
                        <h3>Pilih tanggal terlebih dahulu</h3>
                        <p>Klik tanggal yang tersedia pada kalender untuk mengisi detail jadwal sumatif.</p>
                    </div>
                `;
                return;
            }
            return originalRenderInput(dateString, subjectId);
        };
    }

    window.handleCalendarDateClick = function (dateString) {
        const calendarDay = typeof getCalendarDay === "function" ? getCalendarDay(dateString) : null;

        if (calendarDay && calendarDay.is_selectable !== true) {
            if (typeof showUnavailableDate === "function") showUnavailableDate(dateString, calendarDay);
            return;
        }

        if (typeof scheduleBoardSelectedDate !== "undefined") scheduleBoardSelectedDate = dateString;
        if (typeof renderScheduleInputPanel === "function") {
            renderScheduleInputPanel(dateString, scheduleBoardSubjectId);
        }
    };

    const originalOpenCalendar = window.openScheduleCalendarModal;
    if (typeof originalOpenCalendar === "function") {
        window.openScheduleCalendarModal = function (subjectId) {
            const result = originalOpenCalendar(subjectId);
            const normalize = () => {
                const modal = document.getElementById("scheduleCalendarModal");
                if (!modal) return;
                modal.querySelectorAll("[data-calendar-date]").forEach(button => {
                    const date = button.dataset.calendarDate;
                    const day = typeof getCalendarDay === "function" ? getCalendarDay(date) : null;
                    if (!day) {
                        button.classList.remove("blocked");
                        button.classList.add("available");
                        button.title = "Tersedia";
                    }
                });
            };
            requestAnimationFrame(normalize);
            setTimeout(normalize, 50);
            return result;
        };
    }

    window.saveScheduleFromCalendar = async function (event, dateString) {
        event.preventDefault();

        const errorElement = document.getElementById("scheduleInputError");
        if (errorElement) {
            errorElement.textContent = "";
            errorElement.hidden = true;
        }

        const setError = message => {
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.hidden = false;
                errorElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
            console.error("[Schedule] Gagal menyimpan:", message);
        };

        try {
            const subjectId = document.getElementById("inputScheduleSubject")?.value || "";
            const sumatifNumber = Number(document.getElementById("inputScheduleNumber")?.value || 0);
            const assessmentType = document.getElementById("inputScheduleType")?.value || "";
            const material = document.getElementById("inputScheduleMaterial")?.value?.trim() || "";
            const startTime = document.getElementById("inputScheduleStartTime")?.value || null;
            const endTime = document.getElementById("inputScheduleEndTime")?.value || null;
            const room = document.getElementById("inputScheduleRoom")?.value?.trim() || null;
            const notes = document.getElementById("inputScheduleNotes")?.value?.trim() || null;

            if (!dateString) throw new Error("Tanggal wajib dipilih.");
            if (!scheduleContext.academicYearId || !scheduleContext.classId || !scheduleContext.semester) {
                throw new Error("Konteks tahun pelajaran, kelas, dan semester belum lengkap.");
            }
            if (!subjectId) throw new Error("Mata pelajaran belum dipilih.");
            if (!sumatifNumber) throw new Error("Nomor sumatif wajib dipilih.");
            if (!assessmentType) throw new Error("Jenis asesmen wajib dipilih.");
            if (startTime && endTime && startTime >= endTime) {
                throw new Error("Waktu selesai harus lebih besar dari waktu mulai.");
            }

            const calendarDay = typeof getCalendarDay === "function" ? getCalendarDay(dateString) : null;
            if (calendarDay && calendarDay.is_selectable !== true) {
                throw new Error("Tanggal tersebut tidak tersedia pada Kalender Pendidikan.");
            }

            if (typeof validateScheduleRules === "function") {
                await validateScheduleRules(dateString, assessmentType, startTime, endTime);
            }

            const user = await getCurrentUser();
            if (!user?.id) throw new Error("Sesi pengguna tidak ditemukan. Silakan login kembali.");

            const payload = {
                academic_year_id: scheduleContext.academicYearId,
                semester: Number(scheduleContext.semester),
                class_id: scheduleContext.classId,
                subject_id: subjectId,
                teacher_id: user.id,
                sumatif_number: sumatifNumber,
                date: dateString,
                start_time: startTime,
                end_time: endTime,
                material: material || null,
                assessment_type: assessmentType,
                room,
                notes,
                status: "scheduled"
            };

            console.log("[Schedule] INSERT payload:", payload);

            const { error } = await supabaseClient
                .from("sumatif_schedules")
                .insert(payload);

            if (error) throw error;

            closeScheduleCalendarModal();
            await loadScheduleData();
            renderEducationCalendar();
            renderScheduleList();

            if (typeof decorateScheduleRows === "function") decorateScheduleRows();

            showAppDialog(
                "Jadwal sumatif berhasil disimpan.",
                "success",
                "Jadwal Berhasil Disimpan"
            );
        } catch (error) {
            setError(errorMessage(error, "Jadwal gagal disimpan."));
        }
    };

    console.log("[Schedule Guru Fix] Aktif.");
})();
