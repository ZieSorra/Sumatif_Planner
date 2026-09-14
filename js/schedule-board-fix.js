/* =========================================================
   SCHEDULE BOARD FIX / CALENDAR BOOTSTRAP
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
        printScript.src = "js/calendar-print.js?v=2";
        printScript.dataset.calendarPrint = "1";
        printScript.onload = () => console.log("[Calendar] Layout cetak F4 v2 aktif.");
        printScript.onerror = error => console.error("[Calendar] Gagal memuat layout cetak F4:", error);
        document.body.appendChild(printScript);
    };
    script.onerror = error => console.error("[Calendar] Gagal memuat Kalender Sumatif:", error);
    document.body.appendChild(script);
})();