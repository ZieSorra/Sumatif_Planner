let currentUser = null;
let currentProfile = null;


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {

    try {

        const user = await getCurrentUser();

        if (!user) {
            return;
        }

        currentUser = user;

        const profile =
            await getProfile(user.id);

        currentProfile = profile;

        // Identitas guru
        document.getElementById("welcomeName").textContent =
            profile.full_name;

        document.getElementById("headerUserName").textContent =
            profile.full_name;

        document.getElementById("profileName").textContent =
            profile.full_name;

        document.getElementById("profileEmail").textContent =
            user.email;

        document.getElementById("profileRole").textContent =
            profile.role;


        // Load data dashboard
        await loadTeacherAssignments();

        await loadScheduleSummary();

    } catch (error) {

        console.error(
            "Gagal memuat dashboard:",
            error
        );

    }

}


// ==========================================
// LOAD TEACHER ASSIGNMENTS
// ==========================================

async function loadTeacherAssignments() {

    const {
        data,
        error
    } = await supabaseClient
        .from("teacher_assignments")
        .select(`
            id,
            academic_year_id,
            class_id,
            subject_id,
            academic_years (
                id,
                name,
                start_date,
                end_date,
                is_active
            ),
            classes (
                id,
                name,
                level
            ),
            subjects (
                id,
                name,
                short_name
            )
        `)
        .eq("teacher_id", currentUser.id)
        .eq("is_active", true);


    if (error) {

        console.error(
            "Gagal membaca assignment:",
            error
        );

        return;
    }


    console.log(
        "Teacher assignments:",
        data
    );


    if (!data || data.length === 0) {

        document.getElementById(
            "academicYear"
        ).textContent = "-";

        document.getElementById(
            "className"
        ).textContent = "-";

        return;
    }


    // Ambil tahun ajaran aktif
    const activeAssignment =
        data.find(
            item =>
                item.academic_years &&
                item.academic_years.is_active === true
        ) || data[0];


    if (activeAssignment.academic_years) {

        document.getElementById(
            "academicYear"
        ).textContent =
            activeAssignment.academic_years.name;

    }


    // Kumpulkan nama kelas unik
    const classNames = [
        ...new Set(
            data
                .filter(item => item.classes)
                .map(item => item.classes.name)
        )
    ];


    document.getElementById(
        "className"
    ).textContent =
        classNames.join(", ");


    // Simpan untuk digunakan halaman lain
    window.teacherAssignments = data;
}


// ==========================================
// LOAD SCHEDULE SUMMARY
// ==========================================

async function loadScheduleSummary() {

    const {
        data,
        error
    } = await supabaseClient
        .from("sumatif_schedules")
        .select(`
            id,
            date,
            material,
            sumatif_number,
            assessment_type,
            status,
            subject_id,
            subjects (
                name,
                short_name
            )
        `)
        .eq("teacher_id", currentUser.id)
        .order("date", {
            ascending: true
        });


    if (error) {

        console.error(
            "Gagal membaca jadwal:",
            error
        );

        return;
    }


    const schedules =
        data || [];


    document.getElementById(
        "scheduleCount"
    ).textContent =
        schedules.length;


    renderUpcomingSchedules(
        schedules
    );

}


// ==========================================
// UPCOMING SCHEDULES
// ==========================================

function renderUpcomingSchedules(
    schedules
) {

    const container =
        document.getElementById(
            "upcomingSchedules"
        );


    if (
        !schedules ||
        schedules.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📅
                </div>

                <h3>
                    Belum ada jadwal
                </h3>

                <p>
                    Jadwal sumatif akan muncul di sini.
                </p>

            </div>
        `;

        return;
    }


    // Maksimal 5 jadwal
    const upcoming =
        schedules.slice(0, 5);


    container.innerHTML =
        upcoming
            .map(schedule => {

                const date =
                    formatDate(
                        schedule.date
                    );

                const subject =
                    schedule.subjects
                        ? schedule.subjects.name
                        : "-";


                return `
                    <div class="schedule-item">

                        <div class="schedule-date">

                            <strong>
                                ${date.day}
                            </strong>

                            <span>
                                ${date.month}
                            </span>

                        </div>


                        <div class="schedule-info">

                            <strong>
                                ${subject}
                            </strong>

                            <span>
                                ${schedule.material}
                            </span>

                        </div>


                        <div class="schedule-type">

                            Sumatif
                            ${schedule.sumatif_number}

                        </div>

                    </div>
                `;

            })
            .join("");
}


// ==========================================
// DATE FORMAT
// ==========================================

function formatDate(
    dateString
) {

    const date =
        new Date(
            dateString + "T00:00:00"
        );


    const day =
        date.toLocaleDateString(
            "id-ID",
            {
                day: "2-digit"
            }
        );


    const month =
        date.toLocaleDateString(
            "id-ID",
            {
                month: "short"
            }
        );


    return {
        day,
        month
    };
}


// ==========================================
// SIDEBAR
// ==========================================

function initSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const toggle =
        document.getElementById(
            "sidebarToggle"
        );


    if (!sidebar || !toggle) {
        return;
    }


    toggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "collapsed"
            );

        }
    );

}


// ==========================================
// PAGE NAVIGATION
// ==========================================

function initNavigation() {

    const menuItems =
        document.querySelectorAll(
            ".menu-item"
        );


    const pages = {

        dashboard:
            document.getElementById(
                "dashboardPage"
            ),

        calendar:
            document.getElementById(
                "calendarPage"
            ),

        schedule:
            document.getElementById(
                "schedulePage"
            ),

        profile:
            document.getElementById(
                "profilePage"
            )

    };


    menuItems.forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    const page =
                        item.dataset.page;


                    // Hide all
                    Object.values(
                        pages
                    ).forEach(
                        p => {

                            if (p) {
                                p.classList.add(
                                    "hidden"
                                );
                            }

                        }
                    );


                    // Show selected
                    if (pages[page]) {

                        pages[page]
                            .classList
                            .remove(
                                "hidden"
                            );

                    }


                    // Active menu
                    menuItems.forEach(
                        menu =>
                            menu.classList
                                .remove(
                                    "active"
                                )
                    );


                    item.classList.add(
                        "active"
                    );

                }
            );

        }
    );

}


// ==========================================
// INIT
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initSidebar();

        initNavigation();

    }
);


// Load dashboard setelah auth
if (
    typeof supabaseClient !== "undefined"
) {

    supabaseClient.auth.onAuthStateChange(
        async (
            event,
            session
        ) => {

            if (session) {

                setTimeout(
                    loadDashboard,
                    0
                );

            }

        }
    );

}
