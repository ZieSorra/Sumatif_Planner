/* =========================================================
   SUMATIF PLANNER - MASTER NAVIGATION FIX
   Memastikan menu Data Master dan tampilannya siap setelah profile admin tersedia.
   ========================================================= */

(function () {
    function loadMasterStyle() {
        if (document.querySelector('link[data-master-style="1"]')) return;

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "css/master.css?v=1";
        link.dataset.masterStyle = "1";
        document.head.appendChild(link);
    }

    function loadGuruFix() {
        if (document.querySelector('script[data-master-guru-fix="1"]')) return;
        const script = document.createElement("script");
        script.src = "js/master-data-guru-fix.js?v=1";
        script.dataset.masterGuruFix = "1";
        script.onload = () => console.log("[Master] Perbaikan form Data Guru aktif.");
        script.onerror = error => console.error("[Master] Gagal memuat perbaikan Data Guru:", error);
        document.body.appendChild(script);
    }

    function ensureAdminMenu() {
        loadMasterStyle();
        loadGuruFix();

        const profile = window.currentProfile;
        if (!profile || profile.role !== "admin") return;

        const nav = document.querySelector(".sidebar-nav");
        if (!nav) return;

        let menu = document.getElementById("masterDataMenu");

        if (!menu) {
            const divider = document.createElement("div");
            divider.className = "sidebar-divider";
            divider.id = "masterDataDivider";

            menu = document.createElement("button");
            menu.type = "button";
            menu.id = "masterDataMenu";
            menu.className = "sidebar-menu";
            menu.dataset.menu = "master";
            menu.innerHTML = '<span class="sidebar-icon">▦</span><span>Data Master</span>';

            const profileMenu = nav.querySelector('[data-menu="profile"]');
            if (profileMenu) {
                nav.insertBefore(divider, profileMenu);
                nav.insertBefore(menu, profileMenu);
            } else {
                nav.appendChild(divider);
                nav.appendChild(menu);
            }

            console.log("[Master] Menu Data Master dipastikan tersedia untuk admin.");
        }

        if (typeof initMaster === "function") {
            initMaster(profile);
        }
    }

    function run() {
        loadMasterStyle();
        loadGuruFix();
        setTimeout(ensureAdminMenu, 0);
        setTimeout(ensureAdminMenu, 300);
        setTimeout(ensureAdminMenu, 1000);
    }

    run();

    if (!window.__masterNavigationAuthListenerInstalled && typeof supabaseClient !== "undefined") {
        window.__masterNavigationAuthListenerInstalled = true;
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (session) run();
        });
    }
})();
