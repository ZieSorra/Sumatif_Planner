/* =========================================
   GET DASHBOARD SCHEDULES
========================================= */

async function getDashboardSchedules() {

    const user = await getCurrentUser();

    if (!user) {
        throw new Error("User belum login.");
    }

    const { data, error } = await supabaseClient
        .from("sumatif_schedules")
        .select(`
            id,
            sumatif_number,
            date,
            start_time,
            end_time,
            material,
            assessment_type,
            room,
            notes,
            status,
            academic_years (
                name
            ),
            classes (
                name,
                level
            ),
            subjects (
                name,
                short_name
            )
        `)
        .eq("teacher_id", user.id)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

    if (error) {
        console.error("Gagal mengambil jadwal:", error);
        throw error;
    }

    return data || [];
}


/* =========================================
   LOAD DASHBOARD
========================================= */

async function loadDashboard() {

    console.log("LOAD DASHBOARD DIMULAI");

    const loading =
        document.getElementById("scheduleLoading");

    const empty =
        document.getElementById("scheduleEmpty");

    const container =
        document.getElementById("scheduleContainer");

    const tableBody =
        document.getElementById("scheduleTableBody");

    const totalSchedule =
        document.getElementById("totalSchedule");

    const monthlySchedule =
        document.getElementById("monthlySchedule");

    const writtenSchedule =
        document.getElementById("writtenSchedule");

    const practicalSchedule =
        document.getElementById("practicalSchedule");


    try {

        /* ==============================
           RESET TAMPILAN
        ============================== */

        if (loading) {
            loading.classList.remove("hidden");
        }

        if (empty) {
            empty.classList.add("hidden");
        }

        if (container) {
            container.classList.add("hidden");
        }


        /* ==============================
           AMBIL DATA
        ============================== */

        const schedules =
            await getDashboardSchedules();

        console.log(
            "DASHBOARD SCHEDULES:",
            schedules
        );

        console.log(
            "JUMLAH JADWAL:",
            schedules.length
        );


        /* ==============================
           SUMMARY
        ============================== */

        const total =
            schedules.length;


        const now =
            new Date();

        const currentYear =
            now.getFullYear();

        const currentMonth =
            now.getMonth();


        const monthly =
            schedules.filter(item => {

                if (!item.date) {
                    return false;
                }

                const date =
                    new Date(
                        item.date + "T00:00:00"
                    );

                return (
                    date.getFullYear() === currentYear &&
                    date.getMonth() === currentMonth
                );

            }).length;


        const written =
            schedules.filter(item =>
                item.assessment_type === "written"
            ).length;


        const practical =
            schedules.filter(item =>
                item.assessment_type === "practical"
            ).length;


        console.log(
            "SUMMARY:",
            {
                total,
                monthly,
                written,
                practical
            }
        );


        /* ==============================
           UPDATE SUMMARY
        ============================== */

        if (totalSchedule) {
            totalSchedule.textContent =
                total;
        }

        if (monthlySchedule) {
            monthlySchedule.textContent =
                monthly;
        }

        if (writtenSchedule) {
            writtenSchedule.textContent =
                written;
        }

        if (practicalSchedule) {
            practicalSchedule.textContent =
                practical;
        }


        /* ==============================
           SELESAI LOADING
        ============================== */

        if (loading) {
            loading.classList.add("hidden");
        }


        /* ==============================
           TIDAK ADA DATA
        ============================== */

        if (schedules.length === 0) {

            if (empty) {
                empty.classList.remove("hidden");
            }

            return;
        }


        /* ==============================
           TAMPILKAN CONTAINER
        ============================== */

        if (container) {
            container.classList.remove("hidden");
        }


        if (!tableBody) {

            console.error(
                "scheduleTableBody tidak ditemukan."
            );

            return;
        }


        /* ==============================
           ISI TABLE
        ============================== */

        tableBody.innerHTML = "";


        schedules.forEach(
            (item, index) => {

                const row =
                    document.createElement("tr");


                const className =
                    item.classes?.name || "-";


                const subjectName =
                    item.subjects?.name || "-";


                row.innerHTML = `

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${formatDashboardDate(item.date)}
                    </td>

                    <td>
                        ${escapeHtml(className)}
                    </td>

                    <td>
                        ${escapeHtml(subjectName)}
                    </td>

                    <td>
                        Sumatif ${item.sumatif_number}
                    </td>

                    <td>
                        ${escapeHtml(item.material)}
                    </td>

                    <td>
                        ${formatAssessmentType(
                            item.assessment_type
                        )}
                    </td>

                    <td>
                        ${formatStatus(item.status)}
                    </td>

                    <td>

                        <button
                            class="btn-action"
                            onclick="viewSchedule('${item.id}')"
                        >
                            Lihat
                        </button>

                    </td>

                `;


                tableBody.appendChild(row);

            }
        );


        console.log(
            "TABLE DASHBOARD BERHASIL DITAMPILKAN"
        );


    } catch (error) {

        console.error(
            "GAGAL MEMUAT DASHBOARD:",
            error
        );


        if (loading) {
            loading.classList.add("hidden");
        }


        if (container) {
            container.classList.add("hidden");
        }


        if (empty) {

            empty.classList.remove("hidden");

            empty.innerHTML = `
                <h3>Gagal memuat jadwal</h3>
                <p>
                    ${escapeHtml(error.message)}
                </p>
            `;

        }

    }

}


/* =========================================
   FORMAT TANGGAL
========================================= */

function formatDashboardDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const date =
        new Date(
            dateString + "T00:00:00"
        );

    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================
   FORMAT ASSESSMENT
========================================= */

function formatAssessmentType(type) {

    if (type === "written") {
        return "Tertulis";
    }

    if (type === "practical") {
        return "Praktik";
    }

    return type || "-";

}


/* =========================================
   FORMAT STATUS
========================================= */

function formatStatus(status) {

    if (status === "scheduled") {
        return "Terjadwal";
    }

    if (status === "completed") {
        return "Selesai";
    }

    if (status === "cancelled") {
        return "Dibatalkan";
    }

    return status || "-";

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================
   VIEW SCHEDULE
========================================= */

function viewSchedule(id) {

    console.log(
        "VIEW SCHEDULE:",
        id
    );

    alert(
        "Detail jadwal akan kita buat pada tahap berikutnya."
    );

}
