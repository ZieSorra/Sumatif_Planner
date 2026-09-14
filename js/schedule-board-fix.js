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
        printScript.src = "js/report-print.js?v=3";
        printScript.dataset.reportPrint = "1";
        printScript.onload = () => console.log("[Report] Template cetak laporan F4 v3 aktif.");
        printScript.onerror = error => console.error("[Report] Gagal memuat template cetak laporan:", error);
        document.body.appendChild(printScript);
    };
    script.onerror = error => console.error("[Report] Gagal memuat Laporan Sumatif:", error);
    document.body.appendChild(script);
})();

(function bootMaster() {
    if (document.querySelector('script[data-master-data="1"]')) return;
    const script = document.createElement("script");
    script.src = "js/master.js?v=3";
    script.dataset.masterData = "1";
    script.onload = () => {
        console.log("[Master] Modul Data Master dimuat.");

        if (typeof initMasterData === "function") {
            initMasterData();
        }

        // master.js dapat dimuat sebelum sesi login tersedia.
        // Pastikan Data Master diinisialisasi kembali setelah login.
        if (!window.__masterAuthListenerInstalled && typeof supabaseClient !== "undefined") {
            window.__masterAuthListenerInstalled = true;
            supabaseClient.auth.onAuthStateChange((event, session) => {
                if (session && typeof initMasterData === "function") {
                    setTimeout(() => initMasterData(), 0);
                }
            });
        }

        // Fix form Tahun Pelajaran setelah master.js tersedia.
        if (!document.querySelector('script[data-academic-year-fix="1"]')) {
            const academicYearFix = document.createElement("script");
            academicYearFix.src = "js/master-academic-year-fix.js?v=1";
            academicYearFix.dataset.academicYearFix = "1";
            academicYearFix.onload = () => console.log("[Master] Form Tahun Pelajaran aktif.");
            academicYearFix.onerror = error => console.error("[Master] Gagal memuat form Tahun Pelajaran:", error);
            document.body.appendChild(academicYearFix);
        }

        // Aksi status Tahun Pelajaran: Aktif / Nonaktifkan.
        if (!document.querySelector('script[data-academic-year-status-action="1"]')) {
            const statusScript = document.createElement("script");
            statusScript.src = "js/master-academic-year-action-fix.js?v=1";
            statusScript.dataset.academicYearStatusAction = "1";
            statusScript.onload = () => console.log("[Master] Aksi status Tahun Pelajaran siap.");
            statusScript.onerror = error => console.error("[Master] Gagal memuat aksi status Tahun Pelajaran:", error);
            document.body.appendChild(statusScript);
        }
    };
    script.onerror = error => console.error("[Master] Gagal memuat Data Master:", error);
    document.body.appendChild(script);
})();