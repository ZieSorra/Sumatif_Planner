// ==========================================
// SUMATIF PLANNER
// app.js
// ==========================================


// ==========================================
// ELEMENT
// ==========================================

const loginPage = document.getElementById("loginPage");
const appPage = document.getElementById("appPage");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const logoutBtn = document.getElementById("logoutBtn");

let authStateVersion = 0;
let activeSessionUserId = null;


function resetSessionUi({ clearProfile = true } = {}) {
    if (clearProfile) {
        window.currentProfile = null;
    }

    document.getElementById("masterDataMenu")?.remove();
    document.getElementById("masterDataDivider")?.remove();

    [
        "masterWorkspace",
        "calendarPlannerWorkspace",
        "sumatifReportWorkspace",
        "profileWorkspace"
    ].forEach(id => document.getElementById(id)?.classList.add("hidden"));

    document.getElementById("masterModalOverlay")?.remove();
    document.getElementById("masterGuruFixOverlay")?.remove();
    document.getElementById("teacherAssignmentModal")?.remove();
    document.getElementById("masterConfirmOverlay")?.remove();

    const headerUserName = document.getElementById("headerUserName");
    const headerUserRole = document.querySelector(".app-user .user-info span");
    const welcomeName = document.getElementById("welcomeName");

    if (headerUserName) headerUserName.textContent = "Guru";
    if (headerUserRole) headerUserRole.textContent = "Guru";
    if (welcomeName) welcomeName.textContent = "";

    showWorkspace("dashboard");
}


// ==========================================
// SHOW LOGIN
// ==========================================

function showLogin() {
    if (loginPage) loginPage.classList.remove("hidden");
    if (appPage) appPage.classList.add("hidden");
}


// ==========================================
// SHOW APP
// ==========================================

function showApp() {
    if (loginPage) loginPage.classList.add("hidden");
    if (appPage) appPage.classList.remove("hidden");
}


// ==========================================
// LOAD USER
// ==========================================

async function loadUser(
    version = ++authStateVersion,
    { resetWorkspace = false } = {}
) {
    try {
        const user = await getCurrentUser();

        if (version !== authStateVersion) return;

        if (!user) {
            activeSessionUserId = null;
            resetSessionUi();
            showLogin();
            return;
        }

        const profile = await getProfile(user.id);

        if (version !== authStateVersion) return;

        const isNewSessionUser = activeSessionUserId !== user.id;

        window.currentProfile = profile;

        if (resetWorkspace && isNewSessionUser) {
            resetSessionUi({ clearProfile: false });
        }

        activeSessionUserId = user.id;

        if (typeof initMaster === "function") {
            initMaster(profile);
        }

        console.log("USER:", user);
        console.log("PROFILE:", profile);

        const headerUserName = document.getElementById("headerUserName");
        if (headerUserName && profile) headerUserName.textContent = profile.full_name;

        const welcomeName = document.getElementById("welcomeName");
        if (welcomeName && profile) welcomeName.textContent = profile.full_name;

        const profileName = document.getElementById("profileName");
        const profileEmail = document.getElementById("profileEmail");
        const profileRole = document.getElementById("profileRole");

        if (profileName && profile) profileName.textContent = profile.full_name;
        if (profileEmail) profileEmail.textContent = user.email || "";
        if (profileRole && profile) profileRole.textContent = profile.role;

        showApp();

        await loadDashboard();

        // --------------------------------------
        // LOAD SCHEDULE
        // --------------------------------------
        if (isNewSessionUser && typeof initSchedule === "function") {
            initSchedule();
        }

    } catch (error) {
        console.error("Gagal memuat user:", error);
        if (version !== authStateVersion) return;
        activeSessionUserId = null;
        resetSessionUi();
        showLogin();
    }
}


// ==========================================
// LOGIN
// ==========================================

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        loginMessage.textContent = "Sedang masuk...";

        try {
            const data = await login(email, password);
            console.log("LOGIN BERHASIL:", data);
            loginMessage.textContent = "";
        } catch (error) {
            console.error("LOGIN ERROR:", error);
            loginMessage.textContent = "Login gagal: " + error.message;
        }
    });
}


// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        authStateVersion += 1;
        activeSessionUserId = null;
        resetSessionUi();

        try {
            await logout();
            showLogin();
        } catch (error) {
            console.error("LOGOUT ERROR:", error);
        }
    });
}


// ==========================================
// AUTH STATE
// ==========================================

supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log("AUTH EVENT:", event);

    if (event === "SIGNED_OUT") {
        authStateVersion += 1;
        activeSessionUserId = null;
        resetSessionUi();
        showLogin();
        return;
    }

    if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && session) {
        const version = ++authStateVersion;

        setTimeout(() => {
            loadUser(version, { resetWorkspace: true });
        }, 0);
        return;
    }

    if (event === "INITIAL_SESSION") {
        authStateVersion += 1;
        activeSessionUserId = null;
        resetSessionUi();
        showLogin();
    }
});


// ==========================================
// APP DIALOG
// ==========================================

function showAppDialog(message, type = "info", title = null) {
    const existing = document.getElementById("appDialogOverlay");
    if (existing) existing.remove();

    const dialogTitle = title || (
        type === "success"
            ? "Berhasil"
            : type === "warning"
                ? "Perhatian"
                : type === "error"
                    ? "Terjadi Kesalahan"
                    : "Informasi"
    );

    const icon = type === "success"
        ? "✓"
        : type === "warning"
            ? "⚠"
            : type === "error"
                ? "✕"
                : "ℹ";

    const overlay = document.createElement("div");
    overlay.id = "appDialogOverlay";
    overlay.className = "app-dialog-overlay";

    const dialog = document.createElement("div");
    dialog.className = `app-dialog ${type}`;

    dialog.innerHTML = `
        <div class="app-dialog-icon">${icon}</div>
        <h3 class="app-dialog-title">${dialogTitle}</h3>
        <p class="app-dialog-message"></p>
        <div class="app-dialog-footer">
            <button type="button" class="app-dialog-button">Oke</button>
        </div>
    `;

    dialog.querySelector(".app-dialog-message").textContent = message;

    const closeButton = dialog.querySelector(".app-dialog-button");
    function closeDialog() {
        overlay.remove();
    }

    closeButton.addEventListener("click", closeDialog);

    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) closeDialog();
    });

    document.addEventListener("keydown", function handleEscape(event) {
        if (event.key === "Escape") {
            closeDialog();
            document.removeEventListener("keydown", handleEscape);
        }
    });

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    closeButton.focus();
}


// ==========================================
// SIDEBAR NAVIGATION
// ==========================================

function showWorkspace(menu) {
    const dashboardSections = document.querySelectorAll(".dashboard-home");
    const scheduleWorkspace = document.getElementById("scheduleWorkspace");

    if (menu === "dashboard") {
        dashboardSections.forEach(section => section.classList.remove("hidden"));
        if (scheduleWorkspace) scheduleWorkspace.classList.add("hidden");
    }

    if (menu === "schedule") {
        dashboardSections.forEach(section => section.classList.add("hidden"));
        if (scheduleWorkspace) scheduleWorkspace.classList.remove("hidden");
    }

    document.querySelectorAll(".sidebar-menu").forEach(button => {
        button.classList.toggle("active", button.dataset.menu === menu);
    });
}

document.addEventListener("click", event => {
    const menu = event.target.closest("[data-menu]");
    if (!menu) return;

    const target = menu.dataset.menu;
    if (target === "dashboard" || target === "schedule") {
        showWorkspace(target);
    }
});

// Sidebar hanya dapat dilipat pada layout mobile yang memang menyediakan
// kelas .app-sidebar.collapsed. Desktop tidak diubah oleh kontrol ini.
const sidebarToggle = document.getElementById("sidebarToggle");
const appSidebar = document.querySelector(".app-sidebar");
const mobileSidebarQuery = window.matchMedia("(max-width: 768px)");

function setMobileSidebarCollapsed(collapsed) {
    if (!appSidebar || !mobileSidebarQuery.matches) return;
    appSidebar.classList.toggle("collapsed", collapsed);
    if (sidebarToggle) sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
}

if (sidebarToggle && appSidebar) {
    sidebarToggle.setAttribute("aria-expanded", String(!appSidebar.classList.contains("collapsed")));
    sidebarToggle.addEventListener("click", () => {
        if (!mobileSidebarQuery.matches) return;
        setMobileSidebarCollapsed(!appSidebar.classList.contains("collapsed"));
    });

    document.addEventListener("click", event => {
        if (event.target.closest("[data-menu]") && mobileSidebarQuery.matches) {
            setMobileSidebarCollapsed(true);
        }
    });

    window.addEventListener("resize", () => {
        if (!mobileSidebarQuery.matches) {
            appSidebar.classList.remove("collapsed");
            sidebarToggle.setAttribute("aria-expanded", "true");
        }
    });
}


// ==========================================
// LOAD SUBJECT BOARD UI
// ==========================================
// schedule.js tetap menjadi sumber logika utama.
// File ini hanya mengganti tampilan Jadwal Sumatif
// setelah aplikasi selesai dimuat.

(function loadScheduleBoardUI() {
    const script = document.createElement("script");
    script.src = "js/schedule-board.js?v=2";

    script.onload = function () {
        console.log("[Schedule Board] UI subject-card berhasil dimuat.");

        if (
            typeof scheduleContext !== "undefined" &&
            scheduleContext.academicYearId &&
            scheduleContext.classId &&
            scheduleContext.semester &&
            typeof renderScheduleList === "function"
        ) {
            renderScheduleList();
        }

        // Muat aksi Edit/Hapus setelah Subject Board tersedia.
        const actionFix = document.createElement("script");
        actionFix.src = "js/schedule-board-fix.js?v=2";
        actionFix.onload = function () {
            console.log("[Schedule Board] Bootstrap aksi Edit/Hapus berhasil dimuat.");
        };
        actionFix.onerror = function () {
            console.error("[Schedule Board] Gagal memuat schedule-board-fix.js");
        };
        document.body.appendChild(actionFix);
    };

    script.onerror = function () {
        console.error("[Schedule Board] Gagal memuat schedule-board.js");
    };

    document.body.appendChild(script);
})();