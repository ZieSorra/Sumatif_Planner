/* =========================================================
   SUMATIF PLANNER - CALENDAR AVAILABILITY FIX
   Rule:
   - Tidak ada record education_calendar = tanggal tersedia.
   - Ada record + is_selectable=true = tersedia.
   - Ada record + is_selectable=false = terkunci.
   ========================================================= */
(function () {
    if (window.__scheduleCalendarAvailabilityFixInstalled) return;
    window.__scheduleCalendarAvailabilityFixInstalled = true;

    window.renderCalendarDay = function (dateString, day) {
        const calendarDay = typeof getCalendarDay === "function"
            ? getCalendarDay(dateString)
            : null;
        const schedules = typeof getSchedulesForDate === "function"
            ? getSchedulesForDate(dateString)
            : [];

        const exists = Boolean(calendarDay);
        const selectable = !exists || calendarDay.is_selectable === true;
        const blocked = !selectable;

        let dateClass = "calendar-day ";
        if (blocked) dateClass += "blocked";
        else if (schedules.length) dateClass += "has-schedule";
        else dateClass += "available";

        const title = calendarDay?.title || (
            exists ? "Tanggal tidak tersedia" : "Tersedia"
        );

        const scheduleHtml = schedules.map(schedule => `
            <div class="calendar-schedule" title="${escapeHtml(schedule.material || "")}">
                ${escapeHtml(getSubjectName(schedule.subject_id))}
            </div>
        `).join("");

        const eventHtml = blocked ? `
            <div class="calendar-event">
                ${escapeHtml(calendarDay.title || "Tidak tersedia")}
            </div>
        ` : "";

        return `
            <button type="button"
                class="${dateClass}"
                data-calendar-date="${dateString}"
                title="${escapeHtml(title)}">
                <div class="calendar-day-number">${day}</div>
                ${blocked ? '<div class="day-status">🔒</div>' : ""}
                ${scheduleHtml}
                ${eventHtml}
            </button>
        `;
    };

    console.log("[Schedule] Tanggal tanpa event kalender = tersedia.");
})();
