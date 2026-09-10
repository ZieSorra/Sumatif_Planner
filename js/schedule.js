/* =========================================================
   SUMATIF PLANNER - schedule.js
   Supabase version
   =========================================================

   FLOW:

   Tahun Pelajaran
        ↓
   Kelas
        ↓
   Semester
        ↓
   Kalender Pendidikan
        ↓
   Klik tanggal
        ↓
   Validasi
        ↓
   Form Input
        ↓
   Simpan

   DATABASE:

   education_calendar
   - id
   - academic_year_id
   - semester
   - date
   - day_type
   - title
   - description
   - is_selectable
   - created_at
   - updated_at

   sumatif_schedules
   - id
   - academic_year_id
   - semester
   - class_id
   - subject_id
   - teacher_id
   - sumatif_number
   - date
   - start_time
   - end_time
   - material
   - assessment_type
   - room
   - notes
   - status
   - created_at
   - updated_at

   ========================================================= */


/* =========================================================
   STATE
   ========================================================= */

let scheduleContext = {

    academicYearId: "",

    classId: "",

    semester: "",

    academicYearName: "",

    className: ""

};


let scheduleAcademicYears = [];

let scheduleClasses = [];

let scheduleSubjects = [];

let scheduleSchedules = [];

let scheduleCalendarDays = [];



/* =========================================================
   RENDER SCHEDULE PAGE
   ========================================================= */

function renderSchedulePage() {


    const content =
        document.getElementById(
            "appContent"
        );


    if (!content) {

        console.error(
            "[Schedule] appContent tidak ditemukan."
        );

        return;

    }



    content.innerHTML = `

        <div class="schedule-page">


            <!-- =================================
                 HEADER
            ================================== -->

            <div class="page-heading">

                <div>

                    <h2>
                        Jadwal Sumatif
                    </h2>

                    <p>
                        Pilih konteks pembelajaran
                        untuk menampilkan kalender pendidikan.
                    </p>

                </div>

            </div>



            <!-- =================================
                 KONTEKS PEMBELAJARAN
            ================================== -->

            <section
                class="schedule-context-card"
            >

                <div class="context-header">

                    <div class="context-icon">
                        ◫
                    </div>


                    <div>

                        <h3>
                            Konteks Pembelajaran
                        </h3>

                        <p>
                            Tentukan tahun pelajaran,
                            kelas, dan semester.
                        </p>

                    </div>

                </div>



                <div class="context-fields">


                    <!-- TAHUN PELAJARAN -->

                    <div class="filter-group">

                        <label
                            for="scheduleYearFilter"
                        >
                            Tahun Pelajaran
                        </label>


                        <select
                            id="scheduleYearFilter"
                        >

                            <option value="">
                                Pilih Tahun Pelajaran
                            </option>

                        </select>

                    </div>



                    <!-- KELAS -->

                    <div class="filter-group">

                        <label
                            for="scheduleClassFilter"
                        >
                            Kelas
                        </label>


                        <select
                            id="scheduleClassFilter"
                        >

                            <option value="">
                                Pilih Kelas
                            </option>

                        </select>

                    </div>



                    <!-- SEMESTER -->

                    <div class="filter-group">

                        <label
                            for="scheduleSemesterFilter"
                        >
                            Semester
                        </label>


                        <select
                            id="scheduleSemesterFilter"
                        >

                            <option value="">
                                Pilih Semester
                            </option>


                            <option value="1">
                                Ganjil
                            </option>


                            <option value="2">
                                Genap
                            </option>

                        </select>

                    </div>


                </div>

            </section>



            <!-- =================================
                 EMPTY STATE
            ================================== -->

            <section
                id="calendarEmpty"
                class="schedule-empty"
            >

                <div class="empty-calendar-icon">
                    ▦
                </div>


                <h3>
                    Pilih konteks pembelajaran
                </h3>


                <p>
                    Kalender pendidikan akan muncul
                    setelah Tahun Pelajaran, Kelas,
                    dan Semester dipilih.
                </p>

            </section>



            <!-- =================================
                 EDUCATION CALENDAR
            ================================== -->

            <section
                id="educationCalendarSection"
                class="calendar-section hidden"
            >

                <div class="calendar-header">


                    <div>

                        <h3>
                            Kalender Pendidikan
                        </h3>


                        <p
                            id="calendarContext"
                        ></p>

                    </div>



                    <div
                        class="calendar-legend"
                    >

                        <span>

                            <i
                                class="legend available"
                            ></i>

                            Tersedia

                        </span>


                        <span>

                            <i
                                class="legend schedule"
                            ></i>

                            Sumatif

                        </span>


                        <span>

                            <i
                                class="legend blocked"
                            ></i>

                            Tidak tersedia

                        </span>

                    </div>


                </div>



                <div
                    id="calendarGrid"
                    class="calendar-grid"
                ></div>


            </section>



            <!-- =================================
                 SCHEDULE LIST
            ================================== -->

            <section
                id="scheduleListSection"
                class="schedule-list-section hidden"
            >

                <div
                    class="schedule-list-header"
                >

                    <div>

                        <h3>
                            Jadwal Sumatif
                        </h3>

                        <p>
                            Jadwal pada konteks
                            yang dipilih.
                        </p>

                    </div>

                </div>


                <div
                    id="scheduleList"
                    class="schedule-list"
                ></div>


            </section>


        </div>

    `;



    bindScheduleContextEvents();


    loadScheduleContextData();

}



/* =========================================================
   INITIALIZATION
   ========================================================= */

function initSchedule() {


    console.log(
        "[Schedule] Initializing..."
    );


    bindScheduleContextEvents();


    loadScheduleContextData();

}



/* =========================================================
   BIND CONTEXT
   ========================================================= */

function bindScheduleContextEvents() {


   const year =
    document.getElementById(
        "scheduleYearFilter"
    );

const classSelect =
    document.getElementById(
        "scheduleClassFilter"
    );

   const semesterRaw =
    semesterFilter.value;

const semester =
    semesterRaw === "Ganjil"
        ? 1
        : semesterRaw === "Genap"
            ? 2
            : Number(semesterRaw);



    if (year) {

        year.onchange =
            handleScheduleContextChange;

    }


    if (classSelect) {

        classSelect.onchange =
            handleScheduleContextChange;

    }


    if (semesterFilter) {

        semester.onchange =
            handleScheduleContextChange;

    }

}



/* =========================================================
   LOAD CONTEXT DATA
   ========================================================= */

async function loadScheduleContextData() {


    try {


        await Promise.all([

            loadScheduleAcademicYears(),

            loadScheduleClasses(),

            loadScheduleSubjects()

        ]);


        console.log(
            "[Schedule] Context data loaded."
        );


    }
    catch (error) {


        console.error(
            "[Schedule] Gagal memuat context:",
            error
        );


        showScheduleError(
            error.message ||
            "Gagal memuat data."
        );

    }

}



/* =========================================================
   LOAD TAHUN PELAJARAN
   ========================================================= */

async function loadScheduleAcademicYears() {


    const select =
        document.getElementById(
            "scheduleYearFilter"
        );


    if (!select) {

        console.warn(
            "[Schedule] scheduleYearFilter tidak ditemukan."
        );

        return;

    }



    const {

        data,

        error

    } =
    await supabaseClient

        .from(
            "academic_years"
        )

        .select(
            "id,name"
        )

        .order(
            "name",
            {
                ascending:false
            }
        );



    if (error) {

        throw error;

    }



    scheduleAcademicYears =
        data || [];



    select.innerHTML = `

        <option value="">
            Pilih Tahun Pelajaran
        </option>

    `;



    scheduleAcademicYears.forEach(
        item => {


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                item.id;


            option.textContent =
                item.name;


            select.appendChild(
                option
            );


        }
    );

}



/* =========================================================
   LOAD KELAS
   ========================================================= */

async function loadScheduleClasses() {


    const select =
        document.getElementById(
            "scheduleClassFilter"
        );


    if (!select) {

        console.warn(
            "[Schedule] scheduleClassFilter tidak ditemukan."
        );

        return;

    }



    const {

        data,

        error

    } =
    await supabaseClient

        .from(
            "classes"
        )

        .select(
            "id,name,level"
        )

        .order(
            "level",
            {
                ascending:true
            }
        )

        .order(
            "name",
            {
                ascending:true
            }
        );



    if (error) {

        throw error;

    }



    scheduleClasses =
        data || [];



    select.innerHTML = `

        <option value="">
            Pilih Kelas
        </option>

    `;



    scheduleClasses.forEach(
        item => {


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                item.id;


            option.textContent =
                item.name;


            select.appendChild(
                option
            );


        }
    );

}



/* =========================================================
   LOAD MATA PELAJARAN
   ========================================================= */

async function loadScheduleSubjects() {


    const {

        data,

        error

    } =
    await supabaseClient

        .from(
            "subjects"
        )

        .select(
            "id,name,short_name"
        )

        .order(
            "name",
            {
                ascending:true
            }
        );



    if (error) {

        throw error;

    }



    scheduleSubjects =
        data || [];


}



/* =========================================================
   HANDLE CONTEXT CHANGE
   ========================================================= */

async function handleScheduleContextChange() {


    const yearFilter =
        document.getElementById(
            "scheduleYearFilter"
        );


    const classFilter =
        document.getElementById(
            "scheduleClassFilter"
        );


    const semesterFilter =
        document.getElementById(
            "scheduleSemesterFilter"
        );



    if (

        !yearFilter ||

        !classFilter ||

        !semesterFilter

    ) {

        return;

    }



    const academicYearId =
        yearFilter.value;


    const classId =
        classFilter.value;


 
    /* =========================
       CONTEXT BELUM LENGKAP
    ========================== */

    if (

        !academicYearId ||

        !classId ||

        !semester

    ) {


        scheduleContext = {

            academicYearId:"",

            classId:"",

            semester:"",

            academicYearName:"",

            className:""

        };


        scheduleSchedules = [];

        scheduleCalendarDays = [];


        hideEducationCalendar();


        return;

    }



    /* =========================
       DATA YANG DIPILIH
    ========================== */

    const selectedYear =
        scheduleAcademicYears.find(

            item =>

                String(item.id)
                ===
                String(academicYearId)

        );



    const selectedClass =
        scheduleClasses.find(

            item =>

                String(item.id)
                ===
                String(classId)

        );



    /* =========================
       SET CONTEXT
    ========================== */

    scheduleContext = {

        academicYearId:

            academicYearId,


        classId:

            classId,


        semester:

            Number(semester),


        academicYearName:

            selectedYear
                ? selectedYear.name
                : "",


        className:

            selectedClass
                ? selectedClass.name
                : ""

    };



    console.log(
        "[Schedule] Context:",
        scheduleContext
    );



    try {


        await loadScheduleData();


        renderEducationCalendar();


        renderScheduleList();


    }
    catch (error) {


        console.error(
            "[Schedule] Gagal memuat jadwal:",
            error
        );


        showScheduleError(
            error.message ||
            "Gagal memuat jadwal."
        );

    }

}



/* =========================================================
   LOAD SCHEDULE + EDUCATION CALENDAR
   ========================================================= */

async function loadScheduleData() {


    if (

        !scheduleContext.academicYearId ||

        !scheduleContext.classId ||

        !scheduleContext.semester

    ) {

        return;

    }



    /* =========================
       SUMATIF
    ========================== */

    const {

        data: schedules,

        error: scheduleError

    } =

    await supabaseClient

        .from(
            "sumatif_schedules"
        )

        .select("*")

        .eq(
            "academic_year_id",
            scheduleContext.academicYearId
        )

        .eq(
            "class_id",
            scheduleContext.classId
        )

        .eq(
            "semester",
            Number(
                scheduleContext.semester
            )
        )

        .neq(
            "status",
            "cancelled"
        )

        .order(
            "date",
            {
                ascending:true
            }
        )

        .order(
            "start_time",
            {
                ascending:true
            }
        );



    if (scheduleError) {

        throw scheduleError;

    }



    scheduleSchedules =
        schedules || [];



    /* =========================
       EDUCATION CALENDAR
    ========================== */

    const {

        data: calendarDays,

        error: calendarError

    } =

    await supabaseClient

        .from(
            "education_calendar"
        )

        .select(`

            id,

            academic_year_id,

            semester,

            date,

            day_type,

            title,

            description,

            is_selectable

        `)

        .eq(
            "academic_year_id",
            scheduleContext.academicYearId
        )

        .eq(
            "semester",
            Number(
                scheduleContext.semester
            )
        )

        .order(
            "date",
            {
                ascending:true
            }
        );



    if (calendarError) {

        throw calendarError;

    }



    scheduleCalendarDays =
        calendarDays || [];



    console.log(
        "[Schedule] Schedules:",
        scheduleSchedules
    );


    console.log(
        "[Schedule] Education Calendar:",
        scheduleCalendarDays
    );

}



/* =========================================================
   HIDE CALENDAR
   ========================================================= */

function hideEducationCalendar() {


    const section =
        document.getElementById(
            "educationCalendarSection"
        );


    const empty =
        document.getElementById(
            "calendarEmpty"
        );


    const listSection =
        document.getElementById(
            "scheduleListSection"
        );



    if (section) {

        section.classList.add(
            "hidden"
        );

    }



    if (empty) {

        empty.classList.remove(
            "hidden"
        );

    }



    if (listSection) {

        listSection.classList.add(
            "hidden"
        );

    }

}



/* =========================================================
   RENDER EDUCATION CALENDAR
   ========================================================= */

function renderEducationCalendar() {


    const section =
        document.getElementById(
            "educationCalendarSection"
        );


    const empty =
        document.getElementById(
            "calendarEmpty"
        );


    const grid =
        document.getElementById(
            "calendarGrid"
        );


    const context =
        document.getElementById(
            "calendarContext"
        );



    if (

        !section ||

        !empty ||

        !grid

    ) {

        return;

    }



    section.classList.remove(
        "hidden"
    );


    empty.classList.add(
        "hidden"
    );



    if (context) {

        context.textContent =

            `${scheduleContext.academicYearName} · ` +

            `${scheduleContext.className} · ` +

            `Semester ${getSemesterLabel(
                scheduleContext.semester
            )}`;

    }



    if (
        !scheduleCalendarDays.length
    ) {


        grid.innerHTML = `

            <div class="schedule-list-empty">

                Kalender pendidikan
                belum tersedia untuk konteks ini.

            </div>

        `;


        return;

    }



    const monthKeys =
        getCalendarMonthKeys();



    grid.innerHTML =

        monthKeys

            .map(
                monthKey =>
                    renderMonthCalendar(
                        monthKey
                    )
            )

            .join("");

}



/* =========================================================
   GET MONTH KEYS
   ========================================================= */

function getCalendarMonthKeys() {


    const keys =
        new Set();



    scheduleCalendarDays.forEach(
        item => {


            const date =
                String(
                    item.date || ""
                )
                .slice(
                    0,
                    10
                );


            if (
                date.length >= 7
            ) {

                keys.add(
                    date.slice(
                        0,
                        7
                    )
                );

            }

        }
    );



    scheduleSchedules.forEach(
        item => {


            const date =
                String(
                    item.date || ""
                )
                .slice(
                    0,
                    10
                );


            if (
                date.length >= 7
            ) {

                keys.add(
                    date.slice(
                        0,
                        7
                    )
                );

            }

        }
    );



    return [

        ...keys

    ]
    .sort();

}



/* =========================================================
   RENDER MONTH
   ========================================================= */

function renderMonthCalendar(
    monthKey
) {


    const [

        year,

        monthNumber

    ] =
        monthKey
            .split("-")
            .map(Number);



    const monthIndex =
        monthNumber - 1;



    const monthName =

        new Date(
            year,
            monthIndex,
            1
        )
        .toLocaleDateString(
            "id-ID",
            {
                month:"long",
                year:"numeric"
            }
        );



    const firstDay =

        new Date(
            year,
            monthIndex,
            1
        )
        .getDay();



    const daysInMonth =

        new Date(
            year,
            monthIndex + 1,
            0
        )
        .getDate();



    const weekdays = [

        "Min",

        "Sen",

        "Sel",

        "Rab",

        "Kam",

        "Jum",

        "Sab"

    ];



    let html = `

        <div class="month-card">

            <div class="month-title">

                ${escapeHtml(
                    monthName
                )}

            </div>


            <div class="calendar-weekdays">

                ${

                    weekdays

                        .map(
                            day =>
                                `<div>${day}</div>`
                        )

                        .join("")

                }

            </div>


            <div class="calendar-days">

    `;



    for (
        let i = 0;
        i < firstDay;
        i++
    ) {


        html += `

            <div
                class="calendar-empty-day"
            ></div>

        `;

    }



    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {


        const dateString =

            `${year}-` +

            `${String(
                monthIndex + 1
            ).padStart(2,"0")}-` +

            `${String(
                day
            ).padStart(2,"0")}`;



        html +=

            renderCalendarDay(
                dateString,
                day
            );

    }



    html += `

            </div>

        </div>

    `;



    return html;

}



/* =========================================================
   RENDER CALENDAR DAY
   ========================================================= */

function renderCalendarDay(
    dateString,
    day
) {


    const calendarDay =
        getCalendarDay(
            dateString
        );


    const schedules =
        getSchedulesForDate(
            dateString
        );



    const exists =
        Boolean(
            calendarDay
        );



    const selectable =

        exists &&

        calendarDay.is_selectable
        ===
        true;



    const blocked =
        !selectable;



    let dateClass =
        "calendar-day ";



    if (blocked) {

        dateClass +=
            "blocked";

    }
    else if (
        schedules.length
    ) {

        dateClass +=
            "has-schedule";

    }
    else {

        dateClass +=
            "available";

    }



    const title =

        calendarDay?.title

        ||

        (
            exists

                ? "Tanggal tidak tersedia"

                : "Belum ada data kalender pendidikan"
        );



    const scheduleHtml =

        schedules

            .map(
                schedule => `

                    <div
                        class="calendar-schedule"
                        title="${escapeHtml(
                            schedule.material || ""
                        )}"
                    >

                        ${escapeHtml(
                            getSubjectName(
                                schedule.subject_id
                            )
                        )}

                    </div>

                `
            )

            .join("");



    const eventHtml =

        blocked && calendarDay

            ? `

                <div
                    class="calendar-event"
                >

                    ${escapeHtml(
                        calendarDay.title
                        ||
                        "Tidak tersedia"
                    )}

                </div>

            `

            : "";



    return `

        <button

            type="button"

            class="${dateClass}"

            data-calendar-date="${dateString}"

            title="${escapeHtml(
                title
            )}"

        >

            <div
                class="calendar-day-number"
            >

                ${day}

            </div>



            ${

                blocked

                    ? `<div class="day-status">🔒</div>`

                    : ""

            }



            ${scheduleHtml}



            ${eventHtml}


        </button>

    `;

}

/* =========================================================
   CLICK CALENDAR DATE
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                "[data-calendar-date]"
            );


        if (!button) {
            return;
        }


        const date =
            button.dataset.calendarDate;


        handleCalendarDateClick(
            date
        );

    }
);



/* =========================================================
   HANDLE DATE CLICK
   ========================================================= */

async function handleCalendarDateClick(
    dateString
) {


    const calendarDay =
        getCalendarDay(
            dateString
        );


    /*
       Tanggal tidak terdapat dalam
       education_calendar.
    */

    if (!calendarDay) {

        showScheduleMessage(
            "Tanggal tersebut tidak tersedia pada kalender pendidikan."
        );

        return;

    }


    /*
       Tanggal ada tetapi tidak selectable.
    */

    if (
        calendarDay.is_selectable
        !==
        true
    ) {

        showUnavailableDate(
            dateString,
            calendarDay
        );

        return;

    }


    /*
       Validasi batas harian.
    */

    try {

        const validation =
            await validateDateForSchedule(
                dateString
            );


        if (
            !validation.valid
        ) {

            showScheduleMessage(
                validation.message
            );

            return;

        }


        openScheduleInputModal(
            dateString
        );

    }
    catch (error) {

        console.error(
            "[Schedule] Validasi tanggal gagal:",
            error
        );


        showScheduleMessage(
            error.message ||
            "Tanggal tidak dapat diproses."
        );

    }

}



/* =========================================================
   GET CALENDAR DAY
   ========================================================= */

function getCalendarDay(
    dateString
) {

    return scheduleCalendarDays.find(
        item =>
            String(
                item.date || ""
            ).slice(
                0,
                10
            )
            ===
            dateString
    ) || null;

}



/* =========================================================
   GET SCHEDULES BY DATE
   ========================================================= */

function getSchedulesForDate(
    dateString
) {

    return scheduleSchedules.filter(
        item =>

            String(
                item.date || ""
            ).slice(
                0,
                10
            )
            ===
            dateString

    );

}



/* =========================================================
   VALIDATE DAILY LIMIT
   ========================================================= */

async function validateDateForSchedule(
    dateString
) {


    /*
       Kita mengambil ulang data dari Supabase
       agar validasi tidak hanya bergantung
       pada data yang sedang ada di browser.
    */

    const {
        data,
        error
    } =
    await supabaseClient

        .from(
            "sumatif_schedules"
        )

        .select(
            "id,assessment_type,status"
        )

        .eq(
            "academic_year_id",
            scheduleContext.academicYearId
        )

        .eq(
            "class_id",
            scheduleContext.classId
        )

        .eq(
            "semester",
            Number(
                scheduleContext.semester
            )
        )

        .eq(
            "date",
            dateString
        )

        .neq(
            "status",
            "cancelled"
        );



    if (error) {

        throw error;

    }



    const schedules =
        data || [];



    const writtenCount =
        schedules.filter(
            item =>

                String(
                    item.assessment_type || ""
                ).toLowerCase()
                ===
                "written"

        ).length;



    const totalCount =
        schedules.length;



    /*
       Maksimal 2 tes tertulis.
    */

    if (
        writtenCount >= 2
    ) {

        return {

            valid:false,

            message:
                "Tanggal ini sudah memiliki 2 Tes Tertulis. Maksimal 2 Tes Tertulis dalam satu hari."

        };

    }



    /*
       Maksimal 3 asesmen total.
    */

    if (
        totalCount >= 3
    ) {

        return {

            valid:false,

            message:
                "Tanggal ini sudah memiliki 3 asesmen. Maksimal 3 asesmen dalam satu hari."

        };

    }



    return {

        valid:true

    };

}



/* =========================================================
   OPEN INPUT MODAL
   ========================================================= */

function openScheduleInputModal(
    dateString
) {


    closeScheduleInputModal();



    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "scheduleInputModal";


    modal.className =
        "modal-overlay";



    modal.innerHTML = `

        <div
            class="form-modal"
        >


            <!-- HEADER -->

            <div
                class="form-modal-header"
            >

                <div>

                    <div
                        class="modal-date-label"
                    >
                        TANGGAL SUMATIF
                    </div>


                    <h2>
                        ${escapeHtml(
                            formatDateLong(
                                dateString
                            )
                        )}
                    </h2>


                    <p>
                        ${escapeHtml(
                            scheduleContext.className
                        )}

                        ·

                        Semester
                        ${escapeHtml(
                            getSemesterLabel(
                                scheduleContext.semester
                            )
                        )}
                    </p>

                </div>



                <button
                    type="button"
                    class="modal-close"
                    id="closeScheduleInputButton"
                >
                    ×
                </button>

            </div>



            <!-- FORM -->

            <form
                id="scheduleInputForm"
            >


                <!-- MAPEL -->

                <div
                    class="form-group"
                >

                    <label
                        for="inputScheduleSubject"
                    >
                        Mata Pelajaran
                    </label>


                    <select
                        id="inputScheduleSubject"
                        required
                    >

                        <option value="">
                            Pilih Mata Pelajaran
                        </option>


                        ${

                            scheduleSubjects
                                .map(
                                    subject => `

                                        <option
                                            value="${escapeHtml(
                                                subject.id
                                            )}"
                                        >

                                            ${escapeHtml(
                                                subject.name
                                            )}

                                        </option>

                                    `
                                )
                                .join("")

                        }

                    </select>

                </div>



                <!-- NOMOR + JENIS -->

                <div
                    class="form-grid"
                >


                    <div
                        class="form-group"
                    >

                        <label
                            for="inputScheduleNumber"
                        >
                            Nomor Sumatif
                        </label>


                        <select
                            id="inputScheduleNumber"
                            required
                        >

                            <option value="">
                                Pilih Nomor
                            </option>


                            <option value="1">
                                Sumatif 1
                            </option>


                            <option value="2">
                                Sumatif 2
                            </option>


                            <option value="3">
                                Sumatif 3
                            </option>

                        </select>

                    </div>



                    <div
                        class="form-group"
                    >

                        <label
                            for="inputScheduleType"
                        >
                            Jenis Asesmen
                        </label>


                        <select
                            id="inputScheduleType"
                            required
                        >

                            <option value="">
                                Pilih Jenis
                            </option>


                            <option value="written">
                                Tes Tertulis
                            </option>


                            <option value="practical">
                                Tes Praktik
                            </option>

                        </select>

                    </div>


                </div>



                <!-- MATERI -->

                <div
                    class="form-group"
                >

                    <label
                        for="inputScheduleMaterial"
                    >
                        Uraian Materi
                    </label>


                    <textarea
                        id="inputScheduleMaterial"
                        rows="4"
                        placeholder="Masukkan materi yang diujikan..."
                    ></textarea>

                </div>



                <!-- WAKTU -->

                <div
                    class="form-grid"
                >


                    <div
                        class="form-group"
                    >

                        <label
                            for="inputScheduleStartTime"
                        >
                            Waktu Mulai
                        </label>


                        <input
                            type="time"
                            id="inputScheduleStartTime"
                        >

                    </div>



                    <div
                        class="form-group"
                    >

                        <label
                            for="inputScheduleEndTime"
                        >
                            Waktu Selesai
                        </label>


                        <input
                            type="time"
                            id="inputScheduleEndTime"
                        >

                    </div>


                </div>



                <!-- RUANG + CATATAN -->

                <div
                    class="form-grid"
                >


                    <div
                        class="form-group"
                    >

                        <label
                            for="inputScheduleRoom"
                        >
                            Ruang
                        </label>


                        <input
                            type="text"
                            id="inputScheduleRoom"
                            placeholder="Opsional"
                        >

                    </div>



                    <div
                        class="form-group"
                    >

                        <label
                            for="inputScheduleNotes"
                        >
                            Catatan
                        </label>


                        <input
                            type="text"
                            id="inputScheduleNotes"
                            placeholder="Opsional"
                        >

                    </div>


                </div>



                <!-- ERROR -->

                <div
                    id="scheduleInputError"
                    class="schedule-form-error"
                    hidden
                ></div>



                <!-- FOOTER -->

                <div
                    class="form-modal-footer"
                >

                    <button
                        type="button"
                        class="secondary-button"
                        id="cancelScheduleInputButton"
                    >
                        Batal
                    </button>


                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Simpan Jadwal
                    </button>

                </div>


            </form>


        </div>

    `;



    document.body.appendChild(
        modal
    );



    requestAnimationFrame(
        () => {

            modal.classList.add(
                "show"
            );

        }
    );



    const form =
        document.getElementById(
            "scheduleInputForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            function (event) {

                saveScheduleFromCalendar(
                    event,
                    dateString
                );

            }
        );

    }



    const closeButton =
        document.getElementById(
            "closeScheduleInputButton"
        );


    if (closeButton) {

        closeButton.onclick =
            closeScheduleInputModal;

    }



    const cancelButton =
        document.getElementById(
            "cancelScheduleInputButton"
        );


    if (cancelButton) {

        cancelButton.onclick =
            closeScheduleInputModal;

    }

}



/* =========================================================
   SAVE SCHEDULE
   ========================================================= */

async function saveScheduleFromCalendar(
    event,
    dateString
) {


    event.preventDefault();



    const errorElement =
        document.getElementById(
            "scheduleInputError"
        );



    try {


        const user =
            await getCurrentUser();



        if (!user) {

            throw new Error(
                "Sesi login tidak ditemukan."
            );

        }



        const subjectId =
            document.getElementById(
                "inputScheduleSubject"
            )?.value
            ||
            "";



        const sumatifNumber =
            document.getElementById(
                "inputScheduleNumber"
            )?.value
            ||
            "";



        const assessmentType =
            document.getElementById(
                "inputScheduleType"
            )?.value
            ||
            "";



        const material =
            document.getElementById(
                "inputScheduleMaterial"
            )?.value
            ?.trim()
            ||
            "";



        const startTime =
            document.getElementById(
                "inputScheduleStartTime"
            )?.value
            ||
            null;



        const endTime =
            document.getElementById(
                "inputScheduleEndTime"
            )?.value
            ||
            null;



        const room =
            document.getElementById(
                "inputScheduleRoom"
            )?.value
            ?.trim()
            ||
            null;



        const notes =
            document.getElementById(
                "inputScheduleNotes"
            )?.value
            ?.trim()
            ||
            null;



        /* =========================
           REQUIRED
        ========================== */

        if (!subjectId) {

            throw new Error(
                "Mata pelajaran wajib dipilih."
            );

        }



        if (!sumatifNumber) {

            throw new Error(
                "Nomor sumatif wajib dipilih."
            );

        }



        if (!assessmentType) {

            throw new Error(
                "Jenis asesmen wajib dipilih."
            );

        }



        /* =========================
           TIME VALIDATION
        ========================== */

        if (
            startTime &&
            endTime &&
            startTime >= endTime
        ) {

            throw new Error(
                "Waktu selesai harus lebih besar dari waktu mulai."
            );

        }



        /* =========================
           CALENDAR RECHECK
        ========================== */

        const calendarDay =
            getCalendarDay(
                dateString
            );



        if (
            !calendarDay ||
            calendarDay.is_selectable !== true
        ) {

            throw new Error(
                "Tanggal tersebut tidak tersedia pada kalender pendidikan."
            );

        }



        /* =========================
           DAILY RECHECK
        ========================== */

        const validation =
            await validateDateForSchedule(
                dateString
            );



        if (!validation.valid) {

            throw new Error(
                validation.message
            );

        }



        /* =========================
           PAYLOAD
        ========================== */

        const payload = {

            academic_year_id:

                scheduleContext
                    .academicYearId,


            semester:

                Number(
                    scheduleContext
                        .semester
                ),


            class_id:

                scheduleContext
                    .classId,


            subject_id:

                subjectId,


            teacher_id:

                user.id,


            sumatif_number:

                Number(
                    sumatifNumber
                ),


            date:

                dateString,


            start_time:

                startTime,


            end_time:

                endTime,


            material:

                material || null,


            assessment_type:

                assessmentType,


            room:

                room,


            notes:

                notes,


            status:

                "scheduled"

        };



        console.log(
            "[Schedule] INSERT:",
            payload
        );



        /* =========================
           INSERT
        ========================== */

        const {

            data,

            error

        } =

        await supabaseClient

            .from(
                "sumatif_schedules"
            )

            .insert(
                payload
            )

            .select()
            
            .single();



        if (error) {

            throw error;

        }



        console.log(
            "[Schedule] Berhasil disimpan:",
            data
        );



        /* =========================
           CLOSE
        ========================== */

        closeScheduleInputModal();



        /* =========================
           REFRESH DATA
        ========================== */

        await loadScheduleData();



        renderEducationCalendar();



        renderScheduleList();



        /*
           Jika dashboard sedang ditampilkan
           oleh aplikasi, loadDashboard tetap
           tersedia. Kita tidak memaksa reload
           halaman.
        */

        if (
            typeof loadDashboard
            ===
            "function"
        ) {

            console.log(
                "[Schedule] Jadwal baru tersimpan."
            );

        }



        showScheduleMessage(
            "Jadwal sumatif berhasil disimpan."
        );


    }
    catch (error) {


        console.error(
            "[Schedule] Gagal menyimpan:",
            error
        );



        if (errorElement) {

            errorElement.textContent =

                error.message
                ||
                "Jadwal gagal disimpan.";


            errorElement.hidden =
                false;

        }
        else {

            showScheduleMessage(
                error.message
                ||
                "Jadwal gagal disimpan."
            );

        }

    }

}



/* =========================================================
   CLOSE INPUT MODAL
   ========================================================= */

function closeScheduleInputModal() {


    const modal =
        document.getElementById(
            "scheduleInputModal"
        );


    if (!modal) {

        return;

    }



    modal.classList.remove(
        "show"
    );



    setTimeout(
        () => {

            if (
                modal.parentNode
            ) {

                modal.remove();

            }

        },
        200
    );

}



/* =========================================================
   SHOW UNAVAILABLE DATE
   ========================================================= */

function showUnavailableDate(
    dateString,
    calendarDay
) {


    closeUnavailableDate();



    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "scheduleUnavailableModal";


    modal.className =
        "modal-overlay";



    const title =
        calendarDay?.title
        ||
        "Tanggal tidak tersedia";



    const description =
        calendarDay?.description
        ||
        "";



    modal.innerHTML = `

        <div
            class="form-modal"
        >

            <div
                class="form-modal-header"
            >

                <div>

                    <div
                        class="modal-date-label"
                    >
                        TANGGAL TIDAK TERSEDIA
                    </div>


                    <h2>
                        ${escapeHtml(
                            formatDateLong(
                                dateString
                            )
                        )}
                    </h2>

                </div>


                <button
                    type="button"
                    class="modal-close"
                    id="closeUnavailableButton"
                >
                    ×
                </button>

            </div>



            <div
                class="schedule-blocked-content"
            >

                <p>

                    <strong>
                        ${escapeHtml(
                            title
                        )}
                    </strong>

                </p>


                ${
                    description

                    ?

                    `
                    <p>
                        ${escapeHtml(
                            description
                        )}
                    </p>
                    `

                    :

                    ""
                }


                <p>
                    Tanggal ini tidak dapat digunakan
                    untuk membuat jadwal sumatif.
                </p>

            </div>



            <div
                class="form-modal-footer"
            >

                <button
                    type="button"
                    class="primary-button"
                    id="closeUnavailableButton2"
                >
                    Tutup
                </button>

            </div>

        </div>

    `;



    document.body.appendChild(
        modal
    );



    requestAnimationFrame(
        () => {

            modal.classList.add(
                "show"
            );

        }
    );



    document
        .getElementById(
            "closeUnavailableButton"
        )
        ?.addEventListener(
            "click",
            closeUnavailableDate
        );



    document
        .getElementById(
            "closeUnavailableButton2"
        )
        ?.addEventListener(
            "click",
            closeUnavailableDate
        );

}



/* =========================================================
   CLOSE UNAVAILABLE MODAL
   ========================================================= */

function closeUnavailableDate() {


    const modal =
        document.getElementById(
            "scheduleUnavailableModal"
        );


    if (!modal) {

        return;

    }



    modal.classList.remove(
        "show"
    );



    setTimeout(
        () => {

            if (
                modal.parentNode
            ) {

                modal.remove();

            }

        },
        200
    );

}



/* =========================================================
   RENDER SCHEDULE LIST
   ========================================================= */

function renderScheduleList() {


    const section =
        document.getElementById(
            "scheduleListSection"
        );


    const list =
        document.getElementById(
            "scheduleList"
        );



    if (
        !section ||
        !list
    ) {

        return;

    }



    section.classList.remove(
        "hidden"
    );



    const schedules =
        scheduleSchedules
            .filter(
                item =>

                    String(
                        item.academic_year_id
                    )
                    ===
                    String(
                        scheduleContext
                            .academicYearId
                    )

                    &&

                    String(
                        item.class_id
                    )
                    ===
                    String(
                        scheduleContext
                            .classId
                    )

                    &&

                    Number(
                        item.semester
                    )
                    ===
                    Number(
                        scheduleContext
                            .semester
                    )

                    &&

                    String(
                        item.status || ""
                    )
                    .toLowerCase()
                    !==
                    "cancelled"

            )
            .sort(
                (a,b) => {

                    const dateA =
                        String(
                            a.date || ""
                        );


                    const dateB =
                        String(
                            b.date || ""
                        );


                    if (
                        dateA !== dateB
                    ) {

                        return dateA
                            .localeCompare(
                                dateB
                            );

                    }


                    return String(
                        a.start_time || ""
                    )
                    .localeCompare(
                        String(
                            b.start_time || ""
                        )
                    );

                }
            );



    if (
        schedules.length === 0
    ) {

        list.innerHTML = `

            <div
                class="schedule-list-empty"
            >

                Belum ada jadwal sumatif
                untuk konteks ini.

            </div>

        `;


        return;

    }



    list.innerHTML =

        schedules

            .map(
                item => `

                    <div
                        class="schedule-list-item"
                    >


                        <div
                            class="schedule-list-date"
                        >

                            ${escapeHtml(
                                formatDateLong(
                                    item.date
                                )
                            )}

                        </div>



                        <div
                            class="schedule-list-info"
                        >

                            <strong>

                                ${escapeHtml(
                                    getSubjectName(
                                        item.subject_id
                                    )
                                )}

                            </strong>



                            <span>

                                Sumatif
                                ${escapeHtml(
                                    item.sumatif_number
                                )}

                                ·

                                ${escapeHtml(
                                    formatAssessmentType(
                                        item.assessment_type
                                    )
                                )}

                            </span>



                            <small>

                                ${escapeHtml(
                                    item.material
                                    ||
                                    "Tanpa uraian materi"
                                )}

                            </small>


                        </div>


                    </div>

                `
            )

            .join("");

}



/* =========================================================
   SUBJECT NAME
   ========================================================= */

function getSubjectName(
    subjectId
) {


    const subject =
        scheduleSubjects.find(

            item =>

                String(
                    item.id
                )
                ===
                String(
                    subjectId
                )

        );



    return subject
        ? subject.name
        : "-";

}



/* =========================================================
   SEMESTER LABEL
   ========================================================= */

function getSemesterLabel(
    semester
) {


    return Number(
        semester
    )
    ===
    1

        ? "Ganjil"

        : "Genap";

}



/* =========================================================
   ASSESSMENT TYPE
   ========================================================= */

function formatAssessmentType(
    type
) {


    const value =
        String(
            type || ""
        )
        .toLowerCase();



    if (
        value === "written"
    ) {

        return "Tes Tertulis";

    }



    if (
        value === "practical"
    ) {

        return "Tes Praktik";

    }



    return type || "-";

}



/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDateLong(
    dateValue
) {


    if (!dateValue) {

        return "-";

    }



    const parts =
        String(
            dateValue
        )
        .slice(
            0,
            10
        )
        .split("-")
        .map(
            Number
        );



    if (
        parts.length !== 3
        ||
        parts.some(
            value =>
                Number.isNaN(
                    value
                )
        )
    ) {

        return String(
            dateValue
        );

    }



    const date =
        new Date(
            parts[0],
            parts[1] - 1,
            parts[2]
        );



    return date.toLocaleDateString(
        "id-ID",
        {

            weekday:
                "long",

            day:
                "numeric",

            month:
                "long",

            year:
                "numeric"

        }
    );

}



/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(
    value
) {


    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}



/* =========================================================
   MESSAGE
   ========================================================= */

function showScheduleMessage(
    message
) {


    if (
        typeof showToast
        ===
        "function"
    ) {


        showToast(
            message,
            "warning"
        );


        return;

    }



    alert(
        message
    );

}



/* =========================================================
   ERROR
   ========================================================= */

function showScheduleError(
    message
) {


    console.error(
        "[Schedule]",
        message
    );



    if (
        typeof showToast
        ===
        "function"
    ) {


        showToast(
            message,
            "error"
        );


        return;

    }



    alert(
        message
    );

}



/* =========================================================
   END SCHEDULE.JS
   ========================================================= */
