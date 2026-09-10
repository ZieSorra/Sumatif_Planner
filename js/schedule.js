/* =========================================================
   SUMATIF PLANNER
   schedule.js
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
   Validasi jadwal
        ↓
   Form input jadwal
        ↓
   Simpan

   BACKEND:
   Supabase

   CATATAN:
   - Tidak menggunakan APP_STATE
   - Tidak menggunakan Google Apps Script
   - Tidak menggunakan tombol "Tambah Jadwal"
   - Konteks jadwal ditentukan dari 3 filter
   - Maksimal 2 Tes Tertulis / hari
   - Maksimal 3 asesmen / hari
========================================================= */


/* =========================================================
   STATE
========================================================= */

let scheduleContext = {

    academicYearId: '',
    classId: '',
    semester: '',

    academicYearName: '',
    className: ''

};


/* =========================================================
   LOCAL DATA
========================================================= */

let scheduleAcademicYears = [];
let scheduleClasses = [];
let scheduleSubjects = [];
let scheduleSchedules = [];
let scheduleEvents = [];


/* =========================================================
   INITIALIZATION
========================================================= */

function initSchedule() {

    console.log(
        '[Schedule] Initializing...'
    );


    bindScheduleContextEvents();

    loadScheduleContextData();

}


/* =========================================================
   RENDER SCHEDULE PAGE
========================================================= */

function renderSchedulePage() {

    const content =
        document.getElementById(
            'appContent'
        );


    if (!content) {

        console.error(
            '[Schedule] appContent tidak ditemukan.'
        );

        return;

    }


    content.innerHTML = `

        <div class="schedule-page">

            <!-- =========================
                 HEADER
            ========================== -->

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


            <!-- =========================
                 CONTEXT
            ========================== -->

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

                            <option value="Ganjil">
                                Ganjil
                            </option>

                            <option value="Genap">
                                Genap
                            </option>

                        </select>

                    </div>

                </div>

            </section>


            <!-- =========================
                 EMPTY STATE
            ========================== -->

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


            <!-- =========================
                 CALENDAR
            ========================== -->

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


            <!-- =========================
                 SCHEDULE LIST
            ========================== -->

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
   BIND CONTEXT EVENTS
========================================================= */

function bindScheduleContextEvents() {

    const ids = [

        'scheduleYearFilter',

        'scheduleClassFilter',

        'scheduleSemesterFilter'

    ];


    ids.forEach(id => {

        const element =
            document.getElementById(id);


        if (!element) {

            return;

        }


        element.onchange =
            handleScheduleContextChange;

    });

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
            '[Schedule] Context data loaded.'
        );


    } catch (error) {

        console.error(
            '[Schedule] Gagal memuat context:',
            error
        );


        showScheduleError(
            error.message ||
            'Gagal memuat data jadwal.'
        );

    }

}


/* =========================================================
   LOAD TAHUN PELAJARAN
========================================================= */

async function loadScheduleAcademicYears() {

    const select =
        document.getElementById(
            'scheduleYearFilter'
        );


    if (!select) {

        return;

    }


    const {
        data,
        error
    } = await supabaseClient

        .from('academic_years')

        .select(
            'id, name'
        )

        .order(
            'name',
            {
                ascending: false
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
                    'option'
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
            'scheduleClassFilter'
        );


    if (!select) {

        return;

    }


    const {
        data,
        error
    } = await supabaseClient

        .from('classes')

        .select(
            'id, name, level'
        )

        .order(
            'level',
            {
                ascending: true
            }
        )

        .order(
            'name',
            {
                ascending: true
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
                    'option'
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
    } = await supabaseClient

        .from('subjects')

        .select(
            'id, name'
        )

        .order(
            'name',
            {
                ascending: true
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
            'scheduleYearFilter'
        );


    const classFilter =
        document.getElementById(
            'scheduleClassFilter'
        );


    const semesterFilter =
        document.getElementById(
            'scheduleSemesterFilter'
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


    const semester =
        semesterFilter.value;


    /* =========================
       CONTEXT BELUM LENGKAP
    ========================== */

    if (
        !academicYearId ||
        !classId ||
        !semester
    ) {

        scheduleContext = {

            academicYearId: '',
            classId: '',
            semester: '',

            academicYearName: '',
            className: ''

        };


        hideEducationCalendar();

        return;

    }


    /* =========================
       GET SELECTED DATA
    ========================== */

    const selectedYear =
        scheduleAcademicYears.find(
            item =>
                String(item.id) ===
                String(academicYearId)
        );


    const selectedClass =
        scheduleClasses.find(
            item =>
                String(item.id) ===
                String(classId)
        );


    /* =========================
       SET CONTEXT
    ========================== */

    scheduleContext = {

        academicYearId,

        classId,

        semester,

        academicYearName:
            selectedYear
                ? selectedYear.name
                : '',

        className:
            selectedClass
                ? selectedClass.name
                : ''

    };


    console.log(
        '[Schedule] Context:',
        scheduleContext
    );


    /* =========================
       LOAD SCHEDULE DATA
    ========================== */

    try {

        await loadScheduleData();

        renderEducationCalendar();

        renderScheduleList();


    } catch (error) {

        console.error(
            '[Schedule] Gagal memuat jadwal:',
            error
        );


        showScheduleError(
            error.message ||
            'Gagal memuat jadwal.'
        );

    }

}


/* =========================================================
   LOAD SCHEDULE DATA
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
       LOAD SUMATIF
    ========================== */

    const {
        data: schedules,
        error: scheduleError
    } = await supabaseClient

        .from('sumatif_schedules')

        .select('*')

        .eq(
            'academic_year_id',
            scheduleContext.academicYearId
        )

        .eq(
            'class_id',
            scheduleContext.classId
        )

        .eq(
            'semester',
            scheduleContext.semester
        )

        .neq(
            'status',
            'Dibatalkan'
        )

        .order(
            'date',
            {
                ascending: true
            }
        );


    if (scheduleError) {

        throw scheduleError;

    }


    scheduleSchedules =
        schedules || [];


    /* =========================
       LOAD EVENT SEKOLAH
    ========================== */

    const {
        data: events,
        error: eventError
    } = await supabaseClient

        .from('school_events')

        .select('*')

        .eq(
            'status',
            'Aktif'
        );


    if (eventError) {

        /*
         * Event sekolah tidak boleh
         * membuat halaman jadwal crash.
         */

        console.warn(
            '[Schedule] Event gagal dimuat:',
            eventError
        );


        scheduleEvents = [];


    } else {

        scheduleEvents =
            events || [];

    }

}


/* =========================================================
   HIDE CALENDAR
========================================================= */

function hideEducationCalendar() {

    const section =
        document.getElementById(
            'educationCalendarSection'
        );


    const empty =
        document.getElementById(
            'calendarEmpty'
        );


    const listSection =
        document.getElementById(
            'scheduleListSection'
        );


    if (section) {

        section.classList.add(
            'hidden'
        );

    }


    if (empty) {

        empty.classList.remove(
            'hidden'
        );

    }


    if (listSection) {

        listSection.classList.add(
            'hidden'
        );

    }

}


/* =========================================================
   RENDER EDUCATION CALENDAR
========================================================= */

function renderEducationCalendar() {

    const section =
        document.getElementById(
            'educationCalendarSection'
        );


    const empty =
        document.getElementById(
            'calendarEmpty'
        );


    const grid =
        document.getElementById(
            'calendarGrid'
        );


    const context =
        document.getElementById(
            'calendarContext'
        );


    if (
        !section ||
        !empty ||
        !grid
    ) {

        return;

    }


    section.classList.remove(
        'hidden'
    );


    empty.classList.add(
        'hidden'
    );


    if (context) {

        context.textContent =
            `${scheduleContext.academicYearName} · ${scheduleContext.className} · Semester ${scheduleContext.semester}`;

    }


    const months =
        getSemesterMonths(
            scheduleContext.academicYearName,
            scheduleContext.semester
        );


    if (!months.length) {

        grid.innerHTML = `

            <div class="schedule-list-empty">

                Tahun pelajaran tidak valid.

            </div>

        `;

        return;

    }


    grid.innerHTML =
        months
            .map(
                ({ month, year }) =>
                    renderMonthCalendar(
                        month,
                        year
                    )
            )
            .join('');

}


/* =========================================================
   SEMESTER MONTHS
========================================================= */

function getSemesterMonths(
    academicYear,
    semester
) {

    const parts =
        String(
            academicYear
        )
        .split('/')
        .map(
            value =>
                Number(
                    value
                )
        );


    if (
        parts.length !== 2 ||
        parts.some(
            value =>
                Number.isNaN(
                    value
                )
        )
    ) {

        return [];

    }


    const startYear =
        parts[0];


    const endYear =
        parts[1];


    if (
        semester ===
        'Ganjil'
    ) {

        return [

            {
                month: 6,
                year: startYear
            },

            {
                month: 7,
                year: startYear
            },

            {
                month: 8,
                year: startYear
            },

            {
                month: 9,
                year: startYear
            },

            {
                month: 10,
                year: startYear
            },

            {
                month: 11,
                year: startYear
            }

        ];

    }


    if (
        semester ===
        'Genap'
    ) {

        return [

            {
                month: 0,
                year: endYear
            },

            {
                month: 1,
                year: endYear
            },

            {
                month: 2,
                year: endYear
            },

            {
                month: 3,
                year: endYear
            },

            {
                month: 4,
                year: endYear
            },

            {
                month: 5,
                year: endYear
            }

        ];

    }


    return [];

}


/* =========================================================
   RENDER MONTH
========================================================= */

function renderMonthCalendar(
    month,
    year
) {

    const monthName =
        new Date(
            year,
            month,
            1
        ).toLocaleDateString(
            'id-ID',
            {
                month: 'long',
                year: 'numeric'
            }
        );


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const weekdays = [

        'Min',
        'Sen',
        'Sel',
        'Rab',
        'Kam',
        'Jum',
        'Sab'

    ];


    let html = `

        <div class="month-card">

            <div class="month-title">
                ${escapeHtml(
                    monthName
                )}
            </div>


            <div class="calendar-weekdays">

                ${weekdays
                    .map(
                        day =>
                            `<div>
                                ${day}
                            </div>`
                    )
                    .join('')
                }

            </div>


            <div class="calendar-days">

    `;


    /* =========================
       EMPTY CELLS
    ========================== */

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


    /* =========================
       DAYS
    ========================== */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const dateString =
            formatDateISO(
                date
            );


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

    const schedules =
        getSchedulesForDate(
            dateString
        );


    const events =
        getEventsForDate(
            dateString
        );


    const blocked =
        events.length > 0;


    const dateClass =
        blocked

            ? 'calendar-day blocked'

            : schedules.length

                ? 'calendar-day has-schedule'

                : 'calendar-day available';


    return `

        <button
            type="button"
            class="${dateClass}"
            data-calendar-date="${dateString}"
        >

            <div
                class="calendar-day-number"
            >
                ${day}
            </div>


            ${
                blocked

                    ? `

                        <div class="day-status">
                            🔒
                        </div>

                    `

                    : ''
            }


            ${
                schedules
                    .map(
                        schedule => `

                            <div
                                class="calendar-schedule"
                                title="${escapeHtml(
                                    schedule.material || ''
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
                    .join('')
            }


            ${
                events
                    .map(
                        event => `

                            <div
                                class="calendar-event"
                            >

                                ${escapeHtml(
                                    event.name ||
                                    event.title ||
                                    ''
                                )}

                            </div>

                        `
                    )
                    .join('')
            }

        </button>

    `;

}


/* =========================================================
   GET SCHEDULES FOR DATE
========================================================= */

function getSchedulesForDate(
    dateString
) {

    return scheduleSchedules.filter(
        item => {

            const itemDate =
                String(
                    item.date || ''
                ).slice(
                    0,
                    10
                );


            return (
                itemDate ===
                dateString
            );

        }
    );

}


/* =========================================================
   GET EVENTS FOR DATE
========================================================= */

function getEventsForDate(
    dateString
) {

    return scheduleEvents.filter(
        event => {

            const status =
                String(
                    event.status || ''
                ).toLowerCase();


            if (
                status !==
                'aktif'
            ) {

                return false;

            }


            const start =
                String(
                    event.start_date ||
                    event.tanggal_mulai ||
                    ''
                ).slice(
                    0,
                    10
                );


            const end =
                String(
                    event.end_date ||
                    event.tanggal_selesai ||
                    ''
                ).slice(
                    0,
                    10
                );


            if (
                !start ||
                !end
            ) {

                return false;

            }


            return (
                dateString >= start &&
                dateString <= end
            );

        }
    );

}


/* =========================================================
   CALENDAR CLICK
========================================================= */

document.addEventListener(
    'click',
    event => {

        const button =
            event.target.closest(
                '[data-calendar-date]'
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

function handleCalendarDateClick(
    dateString
) {

    const events =
        getEventsForDate(
            dateString
        );


    /* =========================
       BLOCKED BY EVENT
    ========================== */

    if (
        events.length
    ) {

        showBlockedDateModal(
            dateString,
            events
        );

        return;

    }


    /* =========================
       VALIDATE
    ========================== */

    const validation =
        validateDateForSchedule(
            dateString
        );


    if (
        !validation.valid
    ) {

        showBlockedMessage(
            validation.message
        );

        return;

    }


    /* =========================
       OPEN INPUT
    ========================== */

    openScheduleInputModal(
        dateString
    );

}


/* =========================================================
   VALIDATE DAILY SCHEDULE
========================================================= */

function validateDateForSchedule(
    dateString
) {

    const schedules =
        getSchedulesForDate(
            dateString
        );


    const writtenCount =
        schedules.filter(
            item =>

                String(
                    item.type || ''
                ).toLowerCase() ===
                'tes tertulis'
        ).length;


    /* =========================
       MAX 2 WRITTEN TESTS
    ========================== */

    if (
        writtenCount >= 2
    ) {

        return {

            valid: false,

            message:
                'Maksimal 2 Tes Tertulis dalam satu hari.'

        };

    }


    /* =========================
       MAX 3 ASSESSMENTS
    ========================== */

    if (
        schedules.length >= 3
    ) {

        return {

            valid: false,

            message:
                'Maksimal 3 asesmen dalam satu hari.'

        };

    }


    return {

        valid: true

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
            'div'
        );


    modal.id =
        'scheduleInputModal';


    modal.className =
        'modal-overlay';


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

                        ${escapeHtml(
                            scheduleContext.semester
                        )}

                    </p>

                </div>


                <button
                    class="modal-close"
                    type="button"
                    onclick="closeScheduleInputModal()"
                >
                    ×
                </button>

            </div>


            <!-- FORM -->

            <form
                id="scheduleInputForm"
                class="schedule-form"
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

                        ${scheduleSubjects
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
                            .join('')
                        }

                    </select>

                </div>


                <!-- CATEGORY + TYPE -->

                <div
                    class="form-grid"
                >


                    <!-- CATEGORY -->

                    <div
                        class="form-group"
                    >

                        <label
                            for="inputScheduleCategory"
                        >
                            Kategori Sumatif
                        </label>


                        <select
                            id="inputScheduleCategory"
                            required
                        >

                            <option
                                value="Sumatif 1"
                            >
                                Sumatif 1
                            </option>

                            <option
                                value="Sumatif 2"
                            >
                                Sumatif 2
                            </option>

                            <option
                                value="Sumatif 3"
                            >
                                Sumatif 3
                            </option>

                            <option
                                value="STS"
                            >
                                STS
                            </option>

                            <option
                                value="SAS"
                            >
                                SAS
                            </option>

                        </select>

                    </div>


                    <!-- TYPE -->

                    <div
                        class="form-group"
                    >

                        <label
                            for="inputScheduleType"
                        >
                            Jenis Sumatif
                        </label>


                        <select
                            id="inputScheduleType"
                            required
                        >

                            <option
                                value="Tes Tertulis"
                            >
                                Tes Tertulis
                            </option>

                            <option
                                value="Tes Praktik"
                            >
                                Tes Praktik
                            </option>

                            <option
                                value="Tes Lisan"
                            >
                                Tes Lisan
                            </option>

                        </select>

                    </div>

                </div>


                <!-- MATERIAL -->

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


                <!-- ERROR -->

                <div
                    id="scheduleInputError"
                    class="login-error"
                    hidden
                ></div>


                <!-- FOOTER -->

                <div
                    class="form-modal-footer"
                >

                    <button
                        type="button"
                        class="secondary-button"
                        onclick="closeScheduleInputModal()"
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
                'show'
            );

        }
    );


    const form =
        document.getElementById(
            'scheduleInputForm'
        );


    if (form) {

        form.addEventListener(
            'submit',
            event => {

                saveScheduleFromCalendar(
                    event,
                    dateString
                );

            }
        );

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
            'scheduleInputError'
        );


    try {

        /* =========================
           GET FORM DATA
        ========================== */

        const subjectId =
            document.getElementById(
                'inputScheduleSubject'
            ).value;


        const category =
            document.getElementById(
                'inputScheduleCategory'
            ).value;


        const type =
            document.getElementById(
                'inputScheduleType'
            ).value;


        const material =
            document.getElementById(
                'inputScheduleMaterial'
            ).value.trim();


        /* =========================
           VALIDATE
        ========================== */

        if (!subjectId) {

            throw new Error(
                'Mata pelajaran wajib dipilih.'
            );

        }


        if (!category) {

            throw new Error(
                'Kategori sumatif wajib dipilih.'
            );

        }


        if (!type) {

            throw new Error(
                'Jenis sumatif wajib dipilih.'
            );

        }


        /* =========================
           RECHECK DAILY LIMIT
        ========================== */

        const validation =
            validateDateForSchedule(
                dateString
            );


        if (
            !validation.valid
        ) {

            throw new Error(
                validation.message
            );

        }


        /* =========================
           PAYLOAD
        ========================== */

        const payload = {

            academic_year_id:
                scheduleContext.academicYearId,

            class_id:
                scheduleContext.classId,

            semester:
                scheduleContext.semester,

            date:
                dateString,

            subject_id:
                subjectId,

            category:
                category,

            type:
                type,

            material:
                material,

            status:
                'Aktif'

        };


        console.log(
            '[Schedule] Insert payload:',
            payload
        );


        /* =========================
           INSERT SUPABASE
        ========================== */

        const {
            data,
            error
        } = await supabaseClient

            .from('sumatif_schedules')

            .insert(
                payload
            )

            .select()
            .single();


        if (error) {

            throw error;

        }


        console.log(
            '[Schedule] Saved:',
            data
        );


        /* =========================
           CLOSE
        ========================== */

        closeScheduleInputModal();


        /* =========================
           TOAST
        ========================== */

        if (
            typeof showToast ===
            'function'
        ) {

            showToast(
                'Jadwal sumatif berhasil disimpan.',
                'success'
            );

        }


        /* =========================
           REFRESH
        ========================== */

        await loadScheduleData();


        renderEducationCalendar();

        renderScheduleList();


    } catch (error) {

        console.error(
            '[Schedule] Save error:',
            error
        );


        if (errorElement) {

            errorElement.textContent =
                error.message ||
                'Jadwal gagal disimpan.';


            errorElement.hidden =
                false;

        }

    }

}


/* =========================================================
   CLOSE INPUT MODAL
========================================================= */

function closeScheduleInputModal() {

    const modal =
        document.getElementById(
            'scheduleInputModal'
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        'show'
    );


    setTimeout(
        () => {

            if (
                modal &&
                modal.parentNode
            ) {

                modal.remove();

            }

        },
        200
    );

}


/* =========================================================
   BLOCKED DATE MODAL
========================================================= */

function showBlockedDateModal(
    dateString,
    events
) {

    closeScheduleInputModal();


    const modal =
        document.createElement(
            'div'
        );


    modal.id =
        'scheduleBlockedModal';


    modal.className =
        'modal-overlay';


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
                    class="modal-close"
                    type="button"
                    onclick="closeBlockedDateModal()"
                >
                    ×
                </button>

            </div>


            <div
                class="schedule-blocked-content"
            >

                <p>
                    Tanggal ini memiliki
                    event sekolah.
                </p>


                <div
                    class="blocked-event-list"
                >

                    ${events
                        .map(
                            event => `

                                <div
                                    class="blocked-event-item"
                                >

                                    <strong>
                                        ${escapeHtml(
                                            event.name ||
                                            event.title ||
                                            'Event Sekolah'
                                        )}
                                    </strong>

                                </div>

                            `
                        )
                        .join('')
                    }

                </div>

            </div>


            <div
                class="form-modal-footer"
            >

                <button
                    type="button"
                    class="primary-button"
                    onclick="closeBlockedDateModal()"
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
                'show'
            );

        }
    );

}


/* =========================================================
   CLOSE BLOCKED MODAL
========================================================= */

function closeBlockedDateModal() {

    const modal =
        document.getElementById(
            'scheduleBlockedModal'
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        'show'
    );


    setTimeout(
        () => {

            if (
                modal &&
                modal.parentNode
            ) {

                modal.remove();

            }

        },
        200
    );

}


/* =========================================================
   BLOCKED MESSAGE
========================================================= */

function showBlockedMessage(
    message
) {

    if (
        typeof showToast ===
        'function'
    ) {

        showToast(
            message,
            'warning'
        );

        return;

    }


    alert(
        message
    );

}


/* =========================================================
   RENDER SCHEDULE LIST
========================================================= */

function renderScheduleList() {

    const section =
        document.getElementById(
            'scheduleListSection'
        );


    const list =
        document.getElementById(
            'scheduleList'
        );


    if (
        !section ||
        !list
    ) {

        return;

    }


    section.classList.remove(
        'hidden'
    );


    const schedules =
        scheduleSchedules
            .filter(
                item => {

                    return (

                        String(
                            item.academic_year_id
                        ) ===
                        String(
                            scheduleContext.academicYearId
                        )

                        &&

                        String(
                            item.class_id
                        ) ===
                        String(
                            scheduleContext.classId
                        )

                        &&

                        String(
                            item.semester
                        ) ===
                        String(
                            scheduleContext.semester
                        )

                        &&

                        String(
                            item.status ||
                            ''
                        ).toLowerCase()
                        !==
                        'dibatalkan'

                    );

                }
            )
            .sort(
                (a, b) =>
                    new Date(
                        a.date
                    ) -
                    new Date(
                        b.date
                    )
            );


    /* =========================
       EMPTY
    ========================== */

    if (
        !schedules.length
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


    /* =========================
       LIST
    ========================== */

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

                                ${escapeHtml(
                                    item.category ||
                                    ''
                                )}

                                ·

                                ${escapeHtml(
                                    item.type ||
                                    ''
                                )}

                            </span>


                            <small>

                                ${escapeHtml(
                                    item.material ||
                                    ''
                                )}

                            </small>

                        </div>

                    </div>

                `
            )
            .join('');

}


/* =========================================================
   GET SUBJECT NAME
========================================================= */

function getSubjectName(
    subjectId
) {

    const subject =
        scheduleSubjects.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    subjectId
                )
        );


    return subject
        ? subject.name
        : '-';

}


/* =========================================================
   FORMAT DATE ISO
========================================================= */

function formatDateISO(
    date
) {

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(
            2,
            '0'
        ),

        String(
            date.getDate()
        ).padStart(
            2,
            '0'
        )

    ].join('-');

}


/* =========================================================
   FORMAT DATE LONG
========================================================= */

function formatDateLong(
    dateValue
) {

    if (!dateValue) {

        return '-';

    }


    const parts =
        String(
            dateValue
        )
        .slice(
            0,
            10
        )
        .split('-')
        .map(
            Number
        );


    if (
        parts.length !== 3 ||
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
        'id-ID',
        {

            weekday: 'long',

            day: 'numeric',

            month: 'long',

            year: 'numeric'

        }
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ''
    )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );

}


/* =========================================================
   ERROR
========================================================= */

function showScheduleError(
    message
) {

    console.error(
        '[Schedule]',
        message
    );


    if (
        typeof showToast ===
        'function'
    ) {

        showToast(
            message,
            'error'
        );

        return;

    }


    alert(
        message
    );

}


/* =========================================================
   AUTO INIT
=========================================================

   Jangan menjalankan initSchedule()
   secara otomatis jika sistem utama
   sudah mempunyai router/navigation.

   Jika halaman Jadwal dipanggil melalui
   renderSchedulePage(), fungsi tersebut
   akan memanggil loader sendiri.

========================================================= */
