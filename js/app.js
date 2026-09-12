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


// ==========================================
// SHOW LOGIN
// ==========================================

function showLogin() {

    if (loginPage) {
        loginPage.classList.remove("hidden");
    }

    if (appPage) {
        appPage.classList.add("hidden");
    }

}


// ==========================================
// SHOW APP
// ==========================================

function showApp() {

    if (loginPage) {
        loginPage.classList.add("hidden");
    }

    if (appPage) {
        appPage.classList.remove("hidden");
    }

}


// ==========================================
// LOAD USER
// ==========================================

async function loadUser() {

    try {

        const user = await getCurrentUser();


        // --------------------------------------
        // Tidak ada session
        // --------------------------------------

        if (!user) {

            showLogin();

            return;

        }


        // --------------------------------------
        // Ambil profile
        // --------------------------------------

        const profile =
            await getProfile(user.id);


        console.log("USER:", user);
        console.log("PROFILE:", profile);


        // --------------------------------------
        // HEADER USER
        // --------------------------------------

        const headerUserName =
            document.getElementById("headerUserName");

        if (headerUserName && profile) {

            headerUserName.textContent =
                profile.full_name;

        }


        // --------------------------------------
        // WELCOME
        // --------------------------------------

        const welcomeName =
            document.getElementById("welcomeName");

        if (welcomeName && profile) {

            welcomeName.textContent =
                profile.full_name;

        }


        // --------------------------------------
        // PROFILE
        // --------------------------------------

        const profileName =
            document.getElementById("profileName");

        const profileEmail =
            document.getElementById("profileEmail");

        const profileRole =
            document.getElementById("profileRole");


        if (profileName && profile) {

            profileName.textContent =
                profile.full_name;

        }


        if (profileEmail) {

            profileEmail.textContent =
                user.email || "";

        }


        if (profileRole && profile) {

            profileRole.textContent =
                profile.role;

        }


        // --------------------------------------
        // TAMPILKAN APP
        // --------------------------------------

        showApp();


        // --------------------------------------
        // LOAD DASHBOARD
        // --------------------------------------

        await loadDashboard();

        // --------------------------------------
// LOAD SCHEDULE
// --------------------------------------

if (typeof initSchedule === "function") {
    initSchedule();
}


    } catch (error) {

        console.error(
            "Gagal memuat user:",
            error
        );

        showLogin();

    }

}


// ==========================================
// LOGIN
// ==========================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            loginMessage.textContent =
                "Sedang masuk...";


            try {

                const data =
                    await login(
                        email,
                        password
                    );


                console.log(
                    "LOGIN BERHASIL:",
                    data
                );


                loginMessage.textContent =
                    "";


                /*
                 * Tidak memanggil loadUser() di sini.
                 *
                 * Supabase Auth State Listener
                 * akan menangani SIGNED_IN.
                 */


            } catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );


                loginMessage.textContent =
                    "Login gagal: " +
                    error.message;

            }

        }
    );

}


// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await logout();

                showLogin();


            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

            }

        }
    );

}


// ==========================================
// AUTH STATE
// ==========================================

supabaseClient.auth.onAuthStateChange(
    (event, session) => {

        console.log(
            "AUTH EVENT:",
            event
        );

        if (session) {

            // Jangan langsung memanggil fungsi async
            // yang kembali mengakses Supabase
            setTimeout(() => {
                loadUser();
            }, 0);

        } else {

            showLogin();

        }

    }
);

// ==========================================
// APP DIALOG
// ==========================================

function showAppDialog(
    message,
    type = "info",
    title = null
) {

    // Hapus dialog lama jika masih ada
    const existing =
        document.getElementById(
            "appDialogOverlay"
        );

    if (existing) {
        existing.remove();
    }


    // Judul default
    const dialogTitle =
        title ||
        (
            type === "success"
                ? "Berhasil"
                : type === "warning"
                    ? "Perhatian"
                    : type === "error"
                        ? "Terjadi Kesalahan"
                        : "Informasi"
        );


    // Icon
    const icon =
        type === "success"
            ? "✓"
            : type === "warning"
                ? "⚠"
                : type === "error"
                    ? "✕"
                    : "ℹ";


    // Overlay
    const overlay =
        document.createElement("div");

    overlay.id =
        "appDialogOverlay";

    overlay.className =
        "app-dialog-overlay";


    // Dialog
    const dialog =
        document.createElement("div");

    dialog.className =
        `app-dialog ${type}`;


    dialog.innerHTML = `
        <div class="app-dialog-icon">
            ${icon}
        </div>

        <h3 class="app-dialog-title">
            ${dialogTitle}
        </h3>

        <p class="app-dialog-message"></p>

        <div class="app-dialog-footer">
            <button
                type="button"
                class="app-dialog-button"
            >
                Oke
            </button>
        </div>
    `;


    // Message aman dari HTML injection
    dialog.querySelector(
        ".app-dialog-message"
    ).textContent = message;


    // Tombol
    const closeButton =
        dialog.querySelector(
            ".app-dialog-button"
        );


    function closeDialog() {

        overlay.remove();

    }


    closeButton.addEventListener(
        "click",
        closeDialog
    );


    // Klik area luar dialog
    overlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target === overlay
            ) {

                closeDialog();

            }

        }
    );


    // ESC
    document.addEventListener(
        "keydown",
        function handleEscape(event) {

            if (
                event.key === "Escape"
            ) {

                closeDialog();

                document.removeEventListener(
                    "keydown",
                    handleEscape
                );

            }

        }
    );


    overlay.appendChild(dialog);

    document.body.appendChild(
        overlay
    );


    // Fokus tombol
    closeButton.focus();

}

// ==========================================
// SIDEBAR NAVIGATION
// ==========================================

function showWorkspace(menu) {

    const dashboardSections =
        document.querySelectorAll(
            ".dashboard-home"
        );

    const scheduleWorkspace =
        document.getElementById(
            "scheduleWorkspace"
        );


    if (menu === "dashboard") {

        dashboardSections.forEach(
            section => {
                section.classList.remove(
                    "hidden"
                );
            }
        );

        if (scheduleWorkspace) {
            scheduleWorkspace.classList.add(
                "hidden"
            );
        }

    }


    if (menu === "schedule") {

        dashboardSections.forEach(
            section => {
                section.classList.add(
                    "hidden"
                );
            }
        );

        if (scheduleWorkspace) {
            scheduleWorkspace.classList.remove(
                "hidden"
            );
        }

    }


    document
        .querySelectorAll(
            ".sidebar-menu"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.menu === menu
            );

        });

}


document.addEventListener(
    "click",
    event => {

        const menu =
            event.target.closest(
                "[data-menu]"
            );


        if (!menu) {
            return;
        }


        const target =
            menu.dataset.menu;


        if (
            target === "dashboard" ||
            target === "schedule"
        ) {

            showWorkspace(target);

        }

    }
);
