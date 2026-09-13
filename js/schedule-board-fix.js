/* =========================================================
   FIX: BRIDGE TO LEGACY INPUT MODAL
   schedule-board.js menggunakan nama global yang sama dengan
   modal lama. Simpan fungsi lama sebelum board dimuat, lalu
   gunakan bridge ini agar tidak terjadi rekursi.
   ========================================================= */

function openScheduleInputModal(dateString, subjectId) {

    const legacyModal =
        window.__legacyScheduleInputModal;

    if (typeof legacyModal !== "function") {
        console.error(
            "[Schedule Board] Modal input lama tidak tersedia."
        );
        return;
    }

    legacyModal(dateString);

    requestAnimationFrame(() => {

        const subjectSelect =
            document.getElementById(
                "inputScheduleSubject"
            );

        if (
            subjectSelect &&
            subjectId
        ) {
            subjectSelect.value = subjectId;
        }

    });
}
