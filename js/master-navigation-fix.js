/* =========================================================
   SUMATIF PLANNER - MASTER NAVIGATION FIX
   Memastikan menu Data Master muncul dan dapat diklik setelah
   profile admin tersedia.
   ========================================================= */

(function () {
    function ensureAdminMenu() {
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

        // master.js menyimpan profile ke state internal melalui parameter boot().
        // Jangan memanggil initMaster() tanpa profile karena state internal tetap null.
        if (typeof initMaster === "function") {
            initMaster(profile);
        }
    }

    function run() {
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
