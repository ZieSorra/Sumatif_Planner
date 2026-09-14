/* =========================================================
   FIX / BOOTSTRAP SCHEDULE BOARD
   Memuat fitur aksi setelah Subject Board tersedia.
   ========================================================= */

(function bootScheduleActions() {
    if (window.__scheduleActionsBootstrapInstalled) return;
    window.__scheduleActionsBootstrapInstalled = true;

    function loadDeleteDialog() {
        if (document.querySelector('script[data-schedule-delete-dialog="1"]')) return;

        const script = document.createElement("script");
        script.src = "js/schedule-delete-dialog.js?v=1";
        script.dataset.scheduleDeleteDialog = "1";
        script.onload = () => console.log("[Schedule Board] Dialog Hapus aktif.");
        script.onerror = error => console.error("[Schedule Board] Gagal memuat dialog Hapus:", error);
        document.body.appendChild(script);
    }

    function loadActions() {
        if (typeof window.renderScheduleList !== "function") return false;

        const existing = document.querySelector('script[data-schedule-actions="1"]');
        if (existing) {
            loadDeleteDialog();
            return true;
        }

        const script = document.createElement("script");
        script.src = "js/schedule-actions.js?v=2";
        script.dataset.scheduleActions = "1";
        script.onload = () => {
            console.log("[Schedule Board] Edit/Hapus aktif.");
            loadDeleteDialog();
        };
        script.onerror = error => console.error("[Schedule Board] Gagal memuat Edit/Hapus:", error);
        document.body.appendChild(script);
        return true;
    }

    if (!loadActions()) {
        const timer = setInterval(() => {
            if (loadActions()) clearInterval(timer);
        }, 100);
        setTimeout(() => clearInterval(timer), 15000);
    }
})();

/* =========================================================
   BOOTSTRAP KALENDER SUMATIF
   ========================================================= */
(function bootCalendarPlanner() {
    if (document.querySelector('script[data-calendar-planner="1"]')) return;

    const script = document.createElement("script");
    script.src = "js/calendar.js?v=1";
    script.dataset.calendarPlanner = "1";
    script.onload = () => {
        console.log("[Calendar] Kalender Sumatif aktif.");

        if (document.querySelector('script[data-calendar-print="1"]')) return;
        const printScript = document.createElement("script");
        printScript.src = "js/calendar-print.js?v=1";
        printScript.dataset.calendarPrint = "1";
        printScript.onload = () => console.log("[Calendar] Layout cetak F4 aktif.");
        printScript.onerror = error => console.error("[Calendar] Gagal memuat layout cetak F4:", error);
        document.body.appendChild(printScript);
    };
    script.onerror = error => console.error("[Calendar] Gagal memuat Kalender Sumatif:", error);
    document.body.appendChild(script);
})();
