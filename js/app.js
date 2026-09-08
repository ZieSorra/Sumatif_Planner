const loginPage = document.getElementById("loginPage");
const appPage = document.getElementById("appPage");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const logoutBtn = document.getElementById("logoutBtn");

const userInfo = document.getElementById("userInfo");
const profileInfo = document.getElementById("profileInfo");


function showLogin() {

    loginPage.classList.remove("hidden");
    appPage.classList.add("hidden");

}


function showApp() {

    loginPage.classList.add("hidden");
    appPage.classList.remove("hidden");

}


loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    loginMessage.textContent = "Sedang masuk...";

    try {

        const data = await login(email, password);

        console.log("LOGIN BERHASIL:", data);

        await loadUser();

        loginMessage.textContent = "";

    } catch (error) {

        console.error(error);

        loginMessage.textContent =
            "Login gagal: " + error.message;

    }

});


logoutBtn.addEventListener("click", async () => {

    try {

        await logout();

        showLogin();

    } catch (error) {

        console.error(error);

    }

});


async function loadUser() {

    try {

        const user = await getCurrentUser();

        if (!user) {

            showLogin();
            return;

        }

        const profile =
            await getProfile(user.id);

        console.log("USER:", user);
        console.log("PROFILE:", profile);

        userInfo.textContent =
            `${profile.full_name} • ${profile.role}`;

        profileInfo.innerHTML = `
            <strong>Nama:</strong> ${profile.full_name}<br>
            <strong>Role:</strong> ${profile.role}<br>
            <strong>Email:</strong> ${user.email}
        `;

        showApp();

    } catch (error) {

        console.error(error);

        showLogin();

    }

}


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


loadUser();
