/* =========================================================
   SUMATIF PLANNER - MASTER NAVIGATION FIX
   Memastikan menu Data Master dan tampilannya siap setelah profile admin tersedia.
   ========================================================= */

(function () {
    function loadMasterStyle() {
        if (document.querySelector('link[data-master-style="1"]')) return;
        const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "css/master.css?v=1"; link.dataset.masterStyle = "1"; document.head.appendChild(link);
    }
    function loadGuruFix() {
        if (document.querySelector('script[data-master-guru-fix="1"]')) return;
        const script=document.createElement("script"); script.src="js/master-data-guru-fix.js?v=1"; script.dataset.masterGuruFix="1"; script.onload=()=>console.log("[Master] Perbaikan form Data Guru aktif."); document.body.appendChild(script);
    }
    function loadConfirmFix() {
        if (document.querySelector('script[data-master-confirm-fix="1"]')) return;
        const script=document.createElement("script"); script.src="js/master-confirm-fix.js?v=1"; script.dataset.masterConfirmFix="1"; script.onload=()=>console.log("[Master] Dialog konfirmasi custom aktif."); document.body.appendChild(script);
    }
    function loadScheduleMasterSync() {
        if (document.querySelector('script[data-schedule-master-sync="1"]')) return;
        const script=document.createElement("script"); script.src="js/schedule-master-sync-fix.js?v=1"; script.dataset.scheduleMasterSync="1"; script.onload=()=>console.log("[Schedule Master] Sinkronisasi Data Master dimuat."); document.body.appendChild(script);
    }
    function loadTeacherAssignments() {
        if (document.querySelector('script[data-teacher-assignments="1"]')) return;
        const script=document.createElement("script"); script.src="js/teacher-assignments.js?v=1"; script.dataset.teacherAssignments="1"; script.onload=()=>console.log("[Master] Penugasan Guru aktif."); script.onerror=e=>console.error("[Master] Gagal memuat Penugasan Guru:",e); document.body.appendChild(script);
    }
    function ensureAdminMenu() {
        loadMasterStyle(); loadGuruFix(); loadConfirmFix(); loadScheduleMasterSync(); loadTeacherAssignments();
        const profile=window.currentProfile; if(!profile||profile.role!=="admin") return;
        const nav=document.querySelector(".sidebar-nav"); if(!nav)return;
        let menu=document.getElementById("masterDataMenu");
        if(!menu){const divider=document.createElement("div"); divider.className="sidebar-divider"; divider.id="masterDataDivider"; menu=document.createElement("button"); menu.type="button"; menu.id="masterDataMenu"; menu.className="sidebar-menu"; menu.dataset.menu="master"; menu.innerHTML='<span class="sidebar-icon">▦</span><span>Data Master</span>'; const profileMenu=nav.querySelector('[data-menu="profile"]'); if(profileMenu){nav.insertBefore(divider,profileMenu);nav.insertBefore(menu,profileMenu);}else{nav.appendChild(divider);nav.appendChild(menu);} console.log("[Master] Menu Data Master dipastikan tersedia untuk admin.");}
        if(typeof initMaster==="function") initMaster(profile);
    }
    function run(){loadMasterStyle();loadGuruFix();loadConfirmFix();loadScheduleMasterSync();loadTeacherAssignments();setTimeout(ensureAdminMenu,0);setTimeout(ensureAdminMenu,300);setTimeout(ensureAdminMenu,1000);}
    run();
    if(!window.__masterNavigationAuthListenerInstalled&&typeof supabaseClient!=="undefined"){window.__masterNavigationAuthListenerInstalled=true;supabaseClient.auth.onAuthStateChange((event,session)=>{if(session)run();});}
})();