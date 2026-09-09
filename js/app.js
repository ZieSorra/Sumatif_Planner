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

        const profile = await getProfile(user.id);

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


                // ----------------------------------
                // Jangan loadUser() di sini.
                // Auth state listener akan menangani.
                // ----------------------------------


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
    async (event, session) => {

        console.log(
            "AUTH EVENT:",
            event
        );


        if (session) {

            await loadUser();

        } else {

            showLogin();

        }

    }
);


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {

    try {

        const schedules =
            await getDashboardSchedules();


        console.log(
            "DASHBOARD SCHEDULES:",
            schedules
        );


        // --------------------------------------
        // Untuk tahap awal:
        // data ditampilkan di console.
        //
        // Tahap berikutnya kita akan
        // render data ini ke dashboard.
        // --------------------------------------


    } catch (error) {

        console.error(
            "Gagal memuat dashboard:",
            error
        );

    }

}


// ==========================================
// INITIAL LOAD
// ==========================================

loadUser();
