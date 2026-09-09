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

    const loading =
        document.getElementById("scheduleLoading");

    const empty =
        document.getElementById("scheduleEmpty");

    const container =
        document.getElementById("scheduleContainer");

    const tableBody =
        document.getElementById("scheduleTableBody");


    try {

        // Tampilkan loading

        if (loading) {
            loading.classList.remove("hidden");
        }

        if (empty) {
            empty.classList.add("hidden");
        }

        if (container) {
            container.classList.add("hidden");
        }


        // Ambil data

        const schedules =
            await getDashboardSchedules();

        console.log(
            "DASHBOARD SCHEDULES:",
            schedules
        );


        // Sembunyikan loading

        if (loading) {
            loading.classList.add("hidden");
        }


        // ==============================
        // SUMMARY
        // ==============================

        const totalSchedule =
            document.getElementById("totalSchedule");

        const monthlySchedule =
            document.getElementById("monthlySchedule");

        const writtenSchedule =
            document.getElementById("writtenSchedule");

        const practicalSchedule =
            document.getElementById("practicalSchedule");


        const total =
            schedules.length;


        const now = new Date();

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
                    new Date(item.date + "T00:00:00");

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


        if (totalSchedule) {
            totalSchedule.textContent = total;
        }

        if (monthlySchedule) {
            monthlySchedule.textContent = monthly;
        }

        if (writtenSchedule) {
            writtenSchedule.textContent = written;
        }

        if (practicalSchedule) {
            practicalSchedule.textContent = practical;
        }


        // ==============================
        // TIDAK ADA DATA
        // ==============================

        if (schedules.length === 0) {

            if (empty) {
                empty.classList.remove("hidden");
            }

            return;
        }


        // ==============================
        // TAMPILKAN TABLE
        // ==============================

        if (container) {
            container.classList.remove("hidden");
        }


        if (!tableBody) {
            return;
        }


        tableBody.innerHTML = "";


        schedules.forEach((item, index) => {

            const row =
                document.createElement("tr");


            const date =
                formatDashboardDate(item.date);


            const className =
                item.classes?.name || "-";


            const subjectName =
                item.subjects?.name || "-";


            const assessmentType =
                formatAssessmentType(
                    item.assessment_type
                );


            const status =
                formatStatus(item.status);


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${date}
                </td>

                <td>
                    ${className}
                </td>

                <td>
                    ${subjectName}
                </td>

                <td>
                    Sumatif ${item.sumatif_number}
                </td>

                <td>
                    ${escapeHtml(item.material)}
                </td>

                <td>
                    ${assessmentType}
                </td>

                <td>
                    ${status}
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

        });


    } catch (error) {

        console.error(
            "Gagal memuat dashboard:",
            error
        );


        if (loading) {
            loading.classList.add("hidden");
        }


        if (empty) {

            empty.classList.remove("hidden");

            empty.innerHTML = `

                <h3>
                    Gagal memuat jadwal
                </h3>

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
        new Date(dateString + "T00:00:00");


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
   FORMAT JENIS PENILAIAN
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

    if (value === null || value === undefined) {
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
