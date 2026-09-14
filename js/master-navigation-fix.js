/* =========================================================
   MASTER NAVIGATION FIX
   Keep Data Master as a single workspace instead of allowing
   it to remain visible underneath Dashboard/Calendar/Report.
   ========================================================= */

(function () {
    function hideMasterWorkspace() {
        document.getElementById("masterWorkspace")?.classList.add("hidden");
    }

    document.addEventListener("click", function (event) {
        const menu = event.target.closest("[data-menu]");
        if (!menu) return;

        if (menu.dataset.menu !== "master") {
            hideMasterWorkspace();
        }
    });

    // Safety: when another workspace explicitly becomes active,
    // Data Master must not remain visible in the page flow.
    window.hideMasterWorkspace = hideMasterWorkspace;
})();
