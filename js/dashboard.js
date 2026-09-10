// ==========================================
// SUMATIF PLANNER
// dashboard.js FINAL
// ==========================================


// ==========================================
// GET DASHBOARD SCHEDULES
// ==========================================

async function getDashboardSchedules() {


    const user =
        await getCurrentUser();



    if (!user) {

        throw new Error(
            "User belum login."
        );

    }



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

            `
        )
        .eq(
            "teacher_id",
            user.id
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



    if(error){

        console.error(
            "Gagal mengambil jadwal:",
            error
        );

        throw error;

    }



    return data || [];


}





// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard(){


    console.log(
        "LOAD DASHBOARD DIMULAI"
    );



    try{


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





        // =================================
        // SUMMARY
        // =================================


        const total =
            schedules.length;



        const now =
            new Date();



        const month =
            now.getMonth();



        const year =
            now.getFullYear();




        const monthly =
            schedules.filter(
                item => {


                    if(
                        !item.date
                    ){

                        return false;

                    }



                    const date =
                        new Date(
                            item.date
                            +
                            "T00:00:00"
                        );



                    return (

                        date.getMonth()
                        ===
                        month

                        &&

                        date.getFullYear()
                        ===
                        year

                    );


                }
            )
            .length;





        const written =
            schedules.filter(
                item =>

                item.assessment_type
                ===
                "written"

            )
            .length;





        const practical =
            schedules.filter(
                item =>

                item.assessment_type
                ===
                "practical"

            )
            .length;





        console.log(
            "SUMMARY:",
            {

                total,

                monthly,

                written,

                practical

            }
        );





        // =================================
        // UPDATE CARD
        // =================================


        setDashboardValue(
            "totalSchedule",
            total
        );


        setDashboardValue(
            "monthlySchedule",
            monthly
        );


        setDashboardValue(
            "writtenSchedule",
            written
        );


        setDashboardValue(
            "practicalSchedule",
            practical
        );






        // =================================
        // OPTIONAL LIST
        // =================================

        renderLatestSchedules(
            schedules
        );



        console.log(
            "DASHBOARD BERHASIL DIMUAT"
        );



    }
    catch(error){


        console.error(
            "GAGAL MEMUAT DASHBOARD:",
            error
        );


    }


}







// ==========================================
// SET CARD VALUE
// ==========================================

function setDashboardValue(
    id,
    value
){


    const element =
        document.getElementById(
            id
        );



    if(element){

        element.textContent =
            value;

    }


}






// ==========================================
// OPTIONAL LIST JADWAL TERBARU
// ==========================================

function renderLatestSchedules(
    schedules
){


    const container =
        document.getElementById(
            "latestScheduleContainer"
        );



    /*
       Jika HTML belum mempunyai
       container daftar jadwal,
       abaikan.
    */


    if(!container){

        console.log(
            "latestScheduleContainer belum tersedia."
        );

        return;

    }




    if(
        schedules.length === 0
    ){

        container.innerHTML =
        `
        <p>
            Belum ada jadwal sumatif.
        </p>
        `;


        return;

    }





    const latest =
        schedules.slice(
            0,
            5
        );




    container.innerHTML =
        latest.map(
            item =>


            `

            <div class="schedule-item">

                <strong>

                    ${escapeHtml(
                        item.subjects?.name
                        ||
                        "-"
                    )}

                </strong>


                <p>

                    Sumatif
                    ${item.sumatif_number}

                    -

                    ${formatAssessmentType(
                        item.assessment_type
                    )}

                </p>


                <small>

                    ${formatDate(
                        item.date
                    )}

                </small>


            </div>

            `

        )
        .join("");



}





// ==========================================
// FORMAT
// ==========================================

function formatAssessmentType(
    type
){


    if(
        type === "written"
    ){

        return "Tes Tertulis";

    }



    if(
        type === "practical"
    ){

        return "Tes Praktik";

    }



    return type || "-";


}






function formatDate(
    date
){


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





function escapeHtml(
    value
){


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
