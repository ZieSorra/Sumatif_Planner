// ==========================================
// SUMATIF PLANNER
// schedule.js
// TAMBAH JADWAL
// ==========================================


// ==========================================
// ELEMENT
// ==========================================

const scheduleModal =
    document.getElementById("scheduleModal");

const addScheduleBtn =
    document.getElementById("addScheduleBtn");

const closeScheduleModal =
    document.getElementById("closeScheduleModal");

const cancelScheduleBtn =
    document.getElementById("cancelScheduleBtn");

const scheduleForm =
    document.getElementById("scheduleForm");

const scheduleFormMessage =
    document.getElementById("scheduleFormMessage");

const saveScheduleBtn =
    document.getElementById("saveScheduleBtn");


// ==========================================
// OPEN MODAL
// ==========================================

if (addScheduleBtn) {

    addScheduleBtn.addEventListener(
        "click",
        async () => {

            openScheduleModal();

            await loadScheduleFormData();

        }
    );

}


// ==========================================
// CLOSE MODAL
// ==========================================

function closeScheduleForm() {

    if (scheduleModal) {
        scheduleModal.classList.add("hidden");
    }

}


if (closeScheduleModal) {

    closeScheduleModal.addEventListener(
        "click",
        closeScheduleForm
    );

}


if (cancelScheduleBtn) {

    cancelScheduleBtn.addEventListener(
        "click",
        closeScheduleForm
    );

}


// ==========================================
// OPEN MODAL
// ==========================================

function openScheduleModal() {

    if (!scheduleModal) {
        return;
    }

    scheduleModal.classList.remove("hidden");

    clearScheduleFormMessage();

}


// ==========================================
// LOAD FORM DATA
// ==========================================

async function loadScheduleFormData() {

    try {

        await Promise.all([
            loadAcademicYears(),
            loadClasses(),
            loadSubjects()
        ]);

    } catch (error) {

        console.error(
            "Gagal memuat data form:",
            error
        );

        showScheduleFormMessage(
            "Gagal memuat data form: " +
            error.message,
            "error"
        );

    }

}


// ==========================================
// LOAD TAHUN AJARAN
// ==========================================

async function loadAcademicYears() {

    const select =
        document.getElementById("academicYear");

    if (!select) {
        return;
    }


    const { data, error } =
        await supabaseClient
            .from("academic_years")
            .select("id, name")
            .order("name", {
                ascending: false
            });


    if (error) {
        throw error;
    }


    select.innerHTML = `
        <option value="">
            Pilih tahun ajaran
        </option>
    `;


    (data || []).forEach(item => {

        const option =
            document.createElement("option");

        option.value = item.id;

        option.textContent =
            item.name;

        select.appendChild(option);

    });

}


// ==========================================
// LOAD KELAS
// ==========================================

async function loadClasses() {

    const select =
        document.getElementById("classId");

    if (!select) {
        return;
    }


    const { data, error } =
        await supabaseClient
            .from("classes")
            .select("id, name, level")
            .order("level", {
                ascending: true
            })
            .order("name", {
                ascending: true
            });


    if (error) {
        throw error;
    }


    select.innerHTML = `
        <option value="">
            Pilih kelas
        </option>
    `;


    (data || []).forEach(item => {

        const option =
            document.createElement("option");

        option.value = item.id;

        option.textContent =
            item.level
                ? `${item.name} - ${item.level}`
                : item.name;

        select.appendChild(option);

    });

}


// ==========================================
// LOAD MATA PELAJARAN
// ==========================================

async function loadSubjects() {

    const select =
        document.getElementById("subjectId");

    if (!select) {
        return;
    }


    const { data, error } =
        await supabaseClient
            .from("subjects")
            .select("id, name, short_name")
            .order("name", {
                ascending: true
            });


    if (error) {
        throw error;
    }


    select.innerHTML = `
        <option value="">
            Pilih mata pelajaran
        </option>
    `;


    (data || []).forEach(item => {

        const option =
            document.createElement("option");

        option.value = item.id;

        option.textContent =
            item.short_name
                ? `${item.name} (${item.short_name})`
                : item.name;

        select.appendChild(option);

    });

}


// ==========================================
// SUBMIT
// ==========================================

if (scheduleForm) {

    scheduleForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await saveSchedule();

        }
    );

}


// ==========================================
// SAVE SCHEDULE
// ==========================================

async function saveSchedule() {

    try {

        const user =
            await getCurrentUser();


        if (!user) {

            throw new Error(
                "Session login tidak ditemukan."
            );

        }


        // --------------------------------------
        // AMBIL NILAI FORM
        // --------------------------------------

        const academicYearId =
            document
                .getElementById("academicYear")
                .value;

        const classId =
            document
                .getElementById("classId")
                .value;

        const subjectId =
            document
                .getElementById("subjectId")
                .value;

        const sumatifNumber =
            Number(
                document
                    .getElementById("sumatifNumber")
                    .value
            );

        const date =
            document
                .getElementById("scheduleDate")
                .value;

        const startTime =
            document
                .getElementById("startTime")
                .value;

        const endTime =
            document
                .getElementById("endTime")
                .value;

        const material =
            document
                .getElementById("material")
                .value
                .trim();

        const assessmentType =
            document
                .getElementById("assessmentType")
                .value;

        const room =
            document
                .getElementById("room")
                .value
                .trim();

        const notes =
            document
                .getElementById("notes")
                .value
                .trim();


        // --------------------------------------
        // VALIDASI DASAR
        // --------------------------------------

        if (
            !academicYearId ||
            !classId ||
            !subjectId ||
            !sumatifNumber ||
            !date ||
            !startTime ||
            !endTime ||
            !material ||
            !assessmentType
        ) {

            throw new Error(
                "Semua field wajib harus diisi."
            );

        }


        // --------------------------------------
        // VALIDASI JAM
        // --------------------------------------

        if (endTime <= startTime) {

            throw new Error(
                "Jam selesai harus lebih besar dari jam mulai."
            );

        }


        // --------------------------------------
        // VALIDASI ATURAN HARIAN
        // --------------------------------------

        await validateDailySchedule(
            user.id,
            date,
            assessmentType
        );


        // --------------------------------------
        // TAMPILKAN LOADING
        // --------------------------------------

        saveScheduleBtn.disabled = true;

        saveScheduleBtn.textContent =
            "Menyimpan...";


        clearScheduleFormMessage();


        // --------------------------------------
        // INSERT
        // --------------------------------------

        const payload = {

            teacher_id: user.id,

            academic_year_id:
                academicYearId,

            class_id:
                classId,

            subject_id:
                subjectId,

            sumatif_number:
                sumatifNumber,

            date:
                date,

            start_time:
                startTime,

            end_time:
                endTime,

            material:
                material,

            assessment_type:
                assessmentType,

            room:
                room || null,

            notes:
                notes || null,

            status:
                "scheduled"

        };


        console.log(
            "INSERT SCHEDULE:",
            payload
        );


        const { data, error } =
            await supabaseClient
                .from("sumatif_schedules")
                .insert(payload)
                .select()
                .single();


        if (error) {
            throw error;
        }


        console.log(
            "JADWAL BERHASIL DISIMPAN:",
            data
        );


        // --------------------------------------
        // BERHASIL
        // --------------------------------------

        showScheduleFormMessage(
            "Jadwal berhasil disimpan.",
            "success"
        );


        // Tunggu sebentar agar pesan terlihat

        setTimeout(
            async () => {

                closeScheduleForm();

                scheduleForm.reset();

                await loadDashboard();

            },
            700
        );


    } catch (error) {

        console.error(
            "GAGAL MENYIMPAN JADWAL:",
            error
        );


        showScheduleFormMessage(
            error.message ||
            "Gagal menyimpan jadwal.",
            "error"
        );


    } finally {

        saveScheduleBtn.disabled = false;

        saveScheduleBtn.textContent =
            "Simpan Jadwal";

    }

}


// ==========================================
// VALIDASI JADWAL HARIAN
// ==========================================

async function validateDailySchedule(
    teacherId,
    date,
    assessmentType
) {

    const { data, error } =
        await supabaseClient
            .from("sumatif_schedules")
            .select(`
                id,
                assessment_type,
                status
            `)
            .eq("teacher_id", teacherId)
            .eq("date", date)
            .neq("status", "cancelled");


    if (error) {
        throw error;
    }


    const schedules =
        data || [];


    const writtenCount =
        schedules.filter(
            item =>
                item.assessment_type === "written"
        ).length;


    const totalCount =
        schedules.length;


    // --------------------------------------
    // MAKSIMAL 2 TERTULIS
    // --------------------------------------

    if (
        assessmentType === "written" &&
        writtenCount >= 2
    ) {

        throw new Error(
            "Maksimal 2 sumatif tertulis dalam satu hari."
        );

    }


    // --------------------------------------
    // MAKSIMAL 3 JADWAL
    // --------------------------------------

    if (totalCount >= 3) {

        throw new Error(
            "Maksimal 3 jadwal sumatif dalam satu hari."
        );

    }

}


// ==========================================
// MESSAGE
// ==========================================

function showScheduleFormMessage(
    message,
    type = "error"
) {

    if (!scheduleFormMessage) {
        return;
    }


    scheduleFormMessage.textContent =
        message;


    scheduleFormMessage.className =
        "form-message " + type;

}


function clearScheduleFormMessage() {

    if (!scheduleFormMessage) {
        return;
    }


    scheduleFormMessage.textContent =
        "";

    scheduleFormMessage.className =
        "form-message";

}
