// ==========================================
// SUMATIF PLANNER
// schedule.js
// BAGIAN 1
// ==========================================


// ==========================================
// STATE
// ==========================================

let selectedAcademicYear = null;
let selectedClass = null;
let selectedSemester = null;

let educationCalendar = [];

let selectedDate = null;


// ==========================================
// ELEMENT
// ==========================================

const scheduleModal =
    document.getElementById("scheduleModal");

const addScheduleBtn =
    document.getElementById("addScheduleBtn");


// ==========================================
// INIT
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initSchedule();

    }
);


// ==========================================
// INIT SCHEDULE
// ==========================================

async function initSchedule() {

    console.log(
        "Schedule module aktif"
    );


    if (addScheduleBtn) {

        addScheduleBtn.addEventListener(
            "click",
            () => {

                openScheduleModal();

            }
        );

    }


    await loadAcademicYears();

    await loadClasses();

    await loadSubjects();

}


// ==========================================
// LOAD TAHUN AJARAN
// ==========================================

async function loadAcademicYears() {


    const select =
        document.getElementById(
            "academicYearSelect"
        );


    if (!select) {
        return;
    }


    const {
        data,
        error
    } =
    await supabaseClient
        .from("academic_years")
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

        console.error(
            "Gagal mengambil tahun ajaran",
            error
        );

        return;

    }


    select.innerHTML =
        `
        <option value="">
            Pilih Tahun Pelajaran
        </option>
        `;


    data.forEach(
        item => {

            select.innerHTML +=
            `
            <option value="${item.id}">
                ${item.name}
            </option>
            `;

        }
    );


    select.addEventListener(
        "change",
        async function(){

            selectedAcademicYear =
                this.value;


            selectedSemester =
                null;


            await loadSemester();

        }
    );


}


// ==========================================
// LOAD KELAS
// ==========================================

async function loadClasses() {


    const select =
        document.getElementById(
            "classSelect"
        );


    if (!select) {
        return;
    }


    const {
        data,
        error
    } =
    await supabaseClient
        .from("classes")
        .select(
            "id,name,level"
        )
        .order(
            "level"
        )
        .order(
            "name"
        );


    if (error) {

        console.error(
            "Gagal mengambil kelas",
            error
        );

        return;

    }


    select.innerHTML =
    `
    <option value="">
        Pilih Kelas
    </option>
    `;


    data.forEach(
        item => {

            select.innerHTML +=
            `
            <option value="${item.id}">
                ${item.name}
            </option>
            `;

        }
    );


    select.addEventListener(
        "change",
        function(){

            selectedClass =
                this.value;


            loadEducationCalendar();

        }
    );


}


// ==========================================
// LOAD SEMESTER
// ==========================================

async function loadSemester() {


    const select =
        document.getElementById(
            "semesterSelect"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
    `
    <option value="">
        Pilih Semester
    </option>

    <option value="1">
        Ganjil
    </option>

    <option value="2">
        Genap
    </option>
    `;


    select.addEventListener(
        "change",
        function(){

            selectedSemester =
                this.value;


            loadEducationCalendar();

        }
    );


}


// ==========================================
// LOAD SUBJECT
// ==========================================

async function loadSubjects() {


    const select =
        document.getElementById(
            "subjectSelect"
        );


    if (!select) {
        return;
    }


    const {
        data,
        error
    } =
    await supabaseClient
        .from("subjects")
        .select(
            "id,name,short_name"
        )
        .order(
            "name"
        );


    if(error){

        console.error(
            "Gagal mengambil mapel",
            error
        );

        return;

    }


    select.innerHTML =
    `
    <option value="">
        Pilih Mata Pelajaran
    </option>
    `;


    data.forEach(
        item => {

            select.innerHTML +=
            `
            <option value="${item.id}">
                ${item.name}
            </option>
            `;

        }
    );

}
// ==========================================
// LOAD EDUCATION CALENDAR
// ==========================================

async function loadEducationCalendar() {


    if (
        !selectedAcademicYear ||
        !selectedSemester
    ) {

        console.log(
            "Tahun ajaran atau semester belum dipilih"
        );

        return;

    }



    const {
        data,
        error
    } =
    await supabaseClient
        .from("education_calendar")
        .select(
            `
            id,
            date,
            day_type,
            title,
            description,
            is_selectable
            `
        )
        .eq(
            "academic_year_id",
            selectedAcademicYear
        )
        .eq(
            "semester",
            selectedSemester
        )
        .order(
            "date",
            {
                ascending:true
            }
        );



    if(error){

        console.error(
            "Gagal mengambil kalender pendidikan:",
            error
        );

        return;

    }



    educationCalendar =
        data || [];



    console.log(
        "EDUCATION CALENDAR:",
        educationCalendar
    );



    renderCalendar();

}



// ==========================================
// FILTER TANGGAL YANG BISA DIPILIH
// ==========================================

function getSelectableDates(){


    return educationCalendar.filter(
        item =>
            item.is_selectable === true
    );


}



// ==========================================
// RENDER CALENDAR
// ==========================================

function renderCalendar(){


    const container =
        document.getElementById(
            "calendarContainer"
        );


    if(!container){

        console.log(
            "calendarContainer belum ada"
        );

        return;

    }



    const dates =
        getSelectableDates();



    if(
        dates.length === 0
    ){

        container.innerHTML =
        `
        <p>
        Belum ada tanggal yang tersedia.
        </p>
        `;


        return;

    }



    container.innerHTML =
    "";



    dates.forEach(
        item => {


            const button =
                document.createElement(
                    "button"
                );



            button.className =
                "calendar-date";



            button.innerHTML =
            `
            <strong>
                ${formatDate(item.date)}
            </strong>
            <br>
            <small>
                ${item.title || ""}
            </small>
            `;



            button.addEventListener(
                "click",
                ()=>{


                    selectDate(
                        item.date
                    );


                }
            );



            container.appendChild(
                button
            );


        }
    );


}



// ==========================================
// SELECT DATE
// ==========================================

function selectDate(date){


    selectedDate =
        date;



    console.log(
        "Tanggal dipilih:",
        selectedDate
    );



    const input =
        document.getElementById(
            "scheduleDate"
        );



    if(input){

        input.value =
            selectedDate;

    }



    document
        .querySelectorAll(
            ".calendar-date"
        )
        .forEach(
            btn =>
            btn.classList.remove(
                "active"
            )
        );



    event
        ?.target
        ?.closest(
            ".calendar-date"
        )
        ?.classList.add(
            "active"
        );

}



// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(date){


    if(!date){
        return "-";
    }



    return new Date(
        date + "T00:00:00"
    )
    .toLocaleDateString(
        "id-ID",
        {
            day:"2-digit",
            month:"short",
            year:"numeric"
        }
    );


}
// ==========================================
// OPEN SCHEDULE FORM
// ==========================================

function openScheduleModal(){


    const modal =
        document.getElementById(
            "scheduleModal"
        );


    if(!modal){

        console.error(
            "scheduleModal tidak ditemukan"
        );

        return;

    }



    modal.classList.add(
        "show"
    );


}



// ==========================================
// CLOSE MODAL
// ==========================================

function closeScheduleModal(){


    const modal =
        document.getElementById(
            "scheduleModal"
        );


    if(modal){

        modal.classList.remove(
            "show"
        );

    }

}



// ==========================================
// VALIDASI HARIAN
// ==========================================

async function validateDailySchedule(
    date
){


    const {
        data,
        error
    }
    =
    await supabaseClient
        .from(
            "sumatif_schedules"
        )
        .select(
            `
            id,
            assessment_type
            `
        )
        .eq(
            "academic_year_id",
            selectedAcademicYear
        )
        .eq(
            "class_id",
            selectedClass
        )
        .eq(
            "date",
            date
        )
        .neq(
            "status",
            "cancelled"
        );



    if(error){

        throw error;

    }



    const schedules =
        data || [];



    const writtenCount =
        schedules.filter(
            item =>
            item.assessment_type
            ===
            "written"
        )
        .length;



    const totalCount =
        schedules.length;



    if(
        writtenCount >= 2
    ){

        return {

            valid:false,

            message:
            "Maksimal 2 Tes Tertulis dalam satu hari."

        };

    }



    if(
        totalCount >= 3
    ){

        return {

            valid:false,

            message:
            "Maksimal 3 asesmen dalam satu hari."

        };

    }



    return {

        valid:true

    };


}



// ==========================================
// SAVE SCHEDULE
// ==========================================

async function saveSchedule(){


    try{


        const user =
            await getCurrentUser();



        if(!user){

            throw new Error(
                "User belum login"
            );

        }



        if(!selectedDate){

            throw new Error(
                "Tanggal sumatif belum dipilih"
            );

        }



        const validation =
            await validateDailySchedule(
                selectedDate
            );



        if(!validation.valid){

            throw new Error(
                validation.message
            );

        }



        const subject =
            document.getElementById(
                "subjectSelect"
            )
            .value;



        const number =
            document.getElementById(
                "sumatifNumber"
            )
            .value;



        const type =
            document.getElementById(
                "assessmentType"
            )
            .value;



        const material =
            document.getElementById(
                "materialInput"
            )
            .value;



        const startTime =
            document.getElementById(
                "startTime"
            )
            ?.value
            ||
            null;



        const endTime =
            document.getElementById(
                "endTime"
            )
            ?.value
            ||
            null;



        const room =
            document.getElementById(
                "roomInput"
            )
            ?.value
            ||
            null;



        const notes =
            document.getElementById(
                "notesInput"
            )
            ?.value
            ||
            null;




        const payload = {


            academic_year_id:
                selectedAcademicYear,


            semester:
                Number(
                    selectedSemester
                ),


            class_id:
                selectedClass,


            subject_id:
                subject,


            teacher_id:
                user.id,


            sumatif_number:
                Number(
                    number
                ),


            date:
                selectedDate,


            start_time:
                startTime,


            end_time:
                endTime,


            material:
                material,


            assessment_type:
                type,


            room:
                room,


            notes:
                notes,


            status:
                "scheduled"

        };



        console.log(
            "PAYLOAD:",
            payload
        );



        const {
            data,
            error
        }
        =
        await supabaseClient
            .from(
                "sumatif_schedules"
            )
            .insert(
                payload
            )
            .select()
            .single();



        if(error){

            throw error;

        }



        console.log(
            "BERHASIL SIMPAN:",
            data
        );



        alert(
            "Jadwal sumatif berhasil disimpan"
        );



        closeScheduleModal();



        // refresh kalender

        await loadEducationCalendar();



        // refresh dashboard jika ada

        if(
            typeof loadDashboard
            ===
            "function"
        ){

            await loadDashboard();

        }



    }
    catch(error){


        console.error(
            "Gagal menyimpan jadwal:",
            error
        );



        alert(
            error.message
        );


    }


}



// ==========================================
// BUTTON SIMPAN
// ==========================================

document.addEventListener(
    "click",
    function(event){


        if(
            event.target.id
            ===
            "saveScheduleBtn"
        ){


            saveSchedule();


        }



        if(
            event.target.id
            ===
            "closeScheduleBtn"
        ){


            closeScheduleModal();


        }


    }
); 
