/* =========================================================
   SCHEDULE BOARD FIX / MODULE BOOTSTRAP
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
        printScript.src = "js/calendar-print.js?v=3";
        printScript.dataset.calendarPrint = "1";
        printScript.onload = () => console.log("[Calendar] Layout cetak F4 v3 aktif.");
        printScript.onerror = error => console.error("[Calendar] Gagal memuat layout cetak F4:", error);
        document.body.appendChild(printScript);
    };
    script.onerror = error => console.error("[Calendar] Gagal memuat Kalender Sumatif:", error);
    document.body.appendChild(script);
})();

(function bootReport() {
    if (document.querySelector('script[data-sumatif-report="1"]')) return;
    const script = document.createElement("script");
    script.src = "js/report.js?v=1";
    script.dataset.sumatifReport = "1";
    script.onload = () => {
        console.log("[Report] Laporan Sumatif aktif.");
        if (document.querySelector('script[data-report-print="1"]')) return;
        const printScript = document.createElement("script");
        printScript.src = "js/report-print.js?v=2";
        printScript.dataset.reportPrint = "1";
        printScript.onload = () => console.log("[Report] Template cetak laporan F4 aktif.");
        printScript.onerror = error => console.error("[Report] Gagal memuat template cetak laporan:", error);
        document.body.appendChild(printScript);
    };
    script.onerror = error => console.error("[Report] Gagal memuat Laporan Sumatif:", error);
    document.body.appendChild(script);
})();