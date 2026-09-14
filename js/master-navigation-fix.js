/* =========================================================
   SUMATIF PLANNER - MASTER NAVIGATION FIX
   Memastikan Data Master menjadi workspace tunggal.
   ========================================================= */
(function () {
    function loadMasterStyle(){if(document.querySelector('link[data-master-style="1"]'))return;const l=document.createElement("link");l.rel="stylesheet";l.href="css/master.css?v=1";l.dataset.masterStyle="1";document.head.appendChild(l);}
    function loadGuruFix(){if(document.querySelector('script[data-master-guru-fix="1"]'))return;const s=document.createElement("script");s.src="js/master-data-guru-fix.js?v=1";s.dataset.masterGuruFix="1";s.onload=()=>console.log("[Master] Perbaikan form Data Guru aktif.");document.body.appendChild(s);}
    function loadConfirmFix(){if(document.querySelector('script[data-master-confirm-fix="1"]'))return;const s=document.createElement("script");s.src="js/master-confirm-fix.js?v=1";s.dataset.masterConfirmFix="1";s.onload=()=>console.log("[Master] Dialog konfirmasi custom aktif.");document.body.appendChild(s);}
    function loadScheduleMasterSync(){if(document.querySelector('script[data-schedule-master-sync="1"]'))return;const s=document.createElement("script");s.src="js/schedule-master-sync-fix.js?v=1";s.dataset.scheduleMasterSync="1";s.onload=()=>console.log("[Schedule Master] Sinkronisasi Data Master dimuat.");document.body.appendChild(s);}
    function loadTeacherAssignments(){if(document.querySelector('script[data-teacher-assignments="1"]'))return;const s=document.createElement("script");s.src="js/teacher-assignments.js?v=1";s.dataset.teacherAssignments="1";s.onload=()=>console.log("[Master] Penugasan Guru aktif.");s.onerror=e=>console.error("[Master] Gagal memuat Penugasan Guru:",e);document.body.appendChild(s);}

    function showMasterOnly(){
        ["dashboard-home","scheduleWorkspace","calendarPlannerWorkspace","sumatifReportWorkspace","profileWorkspace"].forEach(sel=>document.querySelectorAll(sel.startsWith("#")?sel:"."+sel).forEach(x=>x.classList.add("hidden")));
        document.querySelectorAll(".dashboard-home").forEach(x=>x.classList.add("hidden"));
        document.getElementById("scheduleWorkspace")?.classList.add("hidden");
        document.getElementById("calendarPlannerWorkspace")?.classList.add("hidden");
        document.getElementById("sumatifReportWorkspace")?.classList.add("hidden");
        document.getElementById("profileWorkspace")?.classList.add("hidden");
        document.getElementById("masterWorkspace")?.classList.remove("hidden");
        document.querySelectorAll(".sidebar-menu").forEach(x=>x.classList.toggle("active",x.dataset.menu==="master"));
    }

    function bindMasterNavigation(){
        if(window.__masterWorkspaceNavigationBound)return;window.__masterWorkspaceNavigationBound=true;
        document.addEventListener("click",e=>{
            const b=e.target.closest('[data-menu="master"]');if(!b)return;
            const p=window.currentProfile;if(!p||p.role!=="admin")return;
            e.preventDefault();e.stopImmediatePropagation();showMasterOnly();
            if(typeof initMaster==="function")initMaster(p);
            setTimeout(()=>document.getElementById("masterWorkspace")?.classList.remove("hidden"),50);
        },true);
    }

    function ensureAdminMenu(){
        loadMasterStyle();loadGuruFix();loadConfirmFix();loadScheduleMasterSync();loadTeacherAssignments();
        const p=window.currentProfile;if(!p||p.role!=="admin")return;
        const nav=document.querySelector(".sidebar-nav");if(!nav)return;
        let menu=document.getElementById("masterDataMenu");
        if(!menu){const d=document.createElement("div");d.className="sidebar-divider";d.id="masterDataDivider";menu=document.createElement("button");menu.type="button";menu.id="masterDataMenu";menu.className="sidebar-menu";menu.dataset.menu="master";menu.innerHTML='<span class="sidebar-icon">▦</span><span>Data Master</span>';const pm=nav.querySelector('[data-menu="profile"]');if(pm){nav.insertBefore(d,pm);nav.insertBefore(menu,pm);}else{nav.appendChild(d);nav.appendChild(menu);}}
        bindMasterNavigation();if(typeof initMaster==="function")initMaster(p);
    }
    function run(){loadMasterStyle();loadGuruFix();loadConfirmFix();loadScheduleMasterSync();loadTeacherAssignments();bindMasterNavigation();setTimeout(ensureAdminMenu,0);setTimeout(ensureAdminMenu,300);setTimeout(ensureAdminMenu,1000);}
    run();
    if(!window.__masterNavigationAuthListenerInstalled&&typeof supabaseClient!=="undefined"){window.__masterNavigationAuthListenerInstalled=true;supabaseClient.auth.onAuthStateChange((event,session)=>{if(session)run();});}
})();