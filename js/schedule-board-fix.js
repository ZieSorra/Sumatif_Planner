/* =========================================================
   FIX / BOOTSTRAP SCHEDULE BOARD
   Memuat fitur aksi setelah Subject Board tersedia.
   ========================================================= */

(function bootScheduleActions() {
    if (window.__scheduleActionsBootstrapInstalled) return;
    window.__scheduleActionsBootstrapInstalled = true;

    function loadActions() {
        if (typeof window.renderScheduleList !== "function") return false;
        if (document.querySelector('script[data-schedule-actions="1"]')) return true;

        const script = document.createElement("script");
        script.src = "js/schedule-actions.js?v=1";
        script.dataset.scheduleActions = "1";
        script.onload = () => console.log("[Schedule Board] Edit/Hapus aktif.");
        script.onerror = error => console.error("[Schedule Board] Gagal memuat Edit/Hapus:", error);
        document.body.appendChild(script);
        return true;
    }

    if (loadActions()) return;

    const timer = setInterval(() => {
        if (loadActions()) clearInterval(timer);
    }, 100);

    setTimeout(() => clearInterval(timer), 15000);
})();
