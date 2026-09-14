/* =========================================================
   SUMATIF PLANNER - MODULE BOOTSTRAP
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
    script.onload = async () => {
        console.log("[Master] Modul Data Master dimuat.");

        // Sinkronkan role dari tabel profiles setelah sesi login tersedia.
        async function syncAdminProfile() {
            try {
                if (typeof getCurrentUser !== "function" || typeof getProfile !== "function") return;
                const user = await getCurrentUser();
                if (!user) return;
                const profile = await getProfile(user.id);
                if (!profile) return;

                window.currentProfile = profile;

                const roleLabel = document.querySelector(".app-user .user-info span");
                if (roleLabel) roleLabel.textContent = profile.role === "admin" ? "Admin" : "Guru";

                console.log("[Master] Role tersinkron:", profile.role);

                if (typeof initMaster === "function") {
                    initMaster();
                }
            } catch (error) {
                console.error("[Master] Gagal sinkron role:", error);
            }
        }

        await syncAdminProfile();

        // Pastikan Data Master diinisialisasi kembali setelah login.
        if (!window.__masterAuthListenerInstalled && typeof supabaseClient !== "undefined") {
            window.__masterAuthListenerInstalled = true;
            supabaseClient.auth.onAuthStateChange((event, session) => {
                if (session) setTimeout(syncAdminProfile, 0);
            });
        }

        if (!document.querySelector('script[data-academic-year-fix="1"]')) {
            const academicYearFix = document.createElement("script");
            academicYearFix.src = "js/master-academic-year-fix.js?v=1";
            academicYearFix.dataset.academicYearFix = "1";
            academicYearFix.onload = () => console.log("[Master] Form Tahun Pelajaran aktif.");
            academicYearFix.onerror = error => console.error("[Master] Gagal memuat form Tahun Pelajaran:", error);
            document.body.appendChild(academicYearFix);
        }

        if (!document.querySelector('script[data-academic-year-status-action="1"]')) {
            const statusScript = document.createElement("script");
            statusScript.src = "js/master-academic-year-action-fix.js?v=1";
            statusScript.dataset.academicYearStatusAction = "1";
            statusScript.onload = () => console.log("[Master] Aksi status Tahun Pelajaran siap.");
            statusScript.onerror = error => console.error("[Master] Gagal memuat aksi status Tahun Pelajaran:", error);
            document.body.appendChild(statusScript);
        }

        if (!document.querySelector('script[data-master-navigation-fix="1"]')) {
            const navigationFix = document.createElement("script");
            navigationFix.src = "js/master-navigation-fix.js?v=1";
            navigationFix.dataset.masterNavigationFix = "1";
            navigationFix.onload = () => console.log("[Master] Navigasi workspace diperbaiki.");
            navigationFix.onerror = error => console.error("[Master] Gagal memuat perbaikan navigasi:", error);
            document.body.appendChild(navigationFix);
        }
    };
    script.onerror = error => console.error("[Master] Gagal memuat Data Master:", error);
    document.body.appendChild(script);
})();