const loginPage = document.getElementById("loginPage");
const appPage = document.getElementById("appPage");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const logoutBtn = document.getElementById("logoutBtn");


// ==========================================
// SHOW LOGIN
// ==========================================

function showLogin() {

    loginPage.classList.remove("hidden");
    appPage.classList.add("hidden");

}


// ==========================================
// SHOW APP
// ==========================================

function showApp() {

    loginPage.classList.add("hidden");
    appPage.classList.remove("hidden");

}


// ==========================================
// LOAD USER
// ==========================================

async function loadUser() {

    try {

        const user = await getCurrentUser();


        // Tidak ada session
        if (!user) {

            showLogin();

            return;
        }


        // Ambil profile dari Supabase
        const profile =
            await getProfile(user.id);


        console.log("USER:", user);
        console.log("PROFILE:", profile);


        // ======================================
        // HEADER
        // ======================================

        const headerUserName =
            document.getElementById(
                "headerUserName"
            );

        if (headerUserName) {

            headerUserName.textContent =
                profile.full_name;

        }


        // ======================================
        // DASHBOARD
        // ======================================

        const welcomeName =
            document.getElementById(
                "welcomeName"
            );

        if (welcomeName) {

            welcomeName.textContent =
                profile.full_name;

        }


        // ======================================
        // PROFILE
        // ======================================

        const profileName =
            document.getElementById(
                "profileName"
            );

        const profileEmail =
            document.getElementById(
                "profileEmail"
            );

        const profileRole =
            document.getElementById(
                "profileRole"
            );


        if (profileName) {

            profileName.textContent =
                profile.full_name;

        }


        if (profileEmail) {

            profileEmail.textContent =
                user.email;

        }


        if (profileRole) {

            profileRole.textContent =
                profile.role;

        }


        // ======================================
        // TAMPILKAN APLIKASI
        // ======================================

        showApp();


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


            await loadUser();


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


// ==========================================
// LOGOUT
// ==========================================

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

        const schedules = await getDashboardSchedules();

        console.log("DASHBOARD SCHEDULES:", schedules);

    } catch (error) {

        console.error("Gagal memuat dashboard:", error);

    }

};
// ==========================================
// INITIAL LOAD
// ==========================================

loadUser();
loaddashboard();
