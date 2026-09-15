/* =========================================================
   SUMATIF PLANNER - SCHEDULE CONFIRM DIALOG
   Mengganti confirm() bawaan browser pada Hapus Jadwal Sumatif.
   Soft delete: hanya mengubah status menjadi cancelled.
   ========================================================= */
(function () {
    if (window.__scheduleConfirmFixInstalled) return;
    window.__scheduleConfirmFixInstalled = true;

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function closeDialog() {
        document.getElementById("scheduleConfirmOverlay")?.remove();
    }

    function openConfirm(message, onConfirm) {
        if (document.getElementById("scheduleConfirmOverlay")) return;

        const overlay = document.createElement("div");
        overlay.id = "scheduleConfirmOverlay";
        overlay.className = "master-modal-overlay";
        overlay.innerHTML = `
            <div class="master-modal master-confirm-modal" role="dialog" aria-modal="true">
                <div class="master-confirm-icon">!</div>
                <h3>Hapus Jadwal</h3>
                <p class="master-confirm-message">${escapeHtml(message)}</p>
                <div class="master-modal-actions">
                    <button type="button" class="secondary-button" id="scheduleConfirmCancel">Batal</button>
                    <button type="button" class="primary-button" id="scheduleConfirmOk">Ya, Hapus</button>
                </div>
            </div>`;

        document.body.appendChild(overlay);

        let busy = false;
        overlay.querySelector("#scheduleConfirmCancel").onclick = () => {
            if (!busy) closeDialog();
        };
        overlay.querySelector("#scheduleConfirmOk").onclick = async () => {
            if (busy) return;
            busy = true;
            const ok = overlay.querySelector("#scheduleConfirmOk");
            const cancel = overlay.querySelector("#scheduleConfirmCancel");
            ok.disabled = true;
            cancel.disabled = true;
            ok.textContent = "Memproses...";
            try {
                await onConfirm();
                closeDialog();
            } catch (error) {
                busy = false;
                ok.disabled = false;
                cancel.disabled = false;
                ok.textContent = "Ya, Hapus";
                showAppDialog(error.message || "Jadwal gagal dihapus.", "error", "Gagal Menghapus Jadwal");
            }
        };
        overlay.addEventListener("click", event => {
            if (event.target === overlay && !busy) closeDialog();
        });
    }

    const originalDelete = window.deleteScheduleFromBoard;
    if (typeof originalDelete !== "function") {
        console.warn("[Schedule] Fungsi deleteScheduleFromBoard belum tersedia saat fix dimuat.");
        return;
    }

    window.deleteScheduleFromBoard = function (id) {
        const item = typeof findScheduleById === "function" ? findScheduleById(id) : null;
        if (!item) {
            showAppDialog("Jadwal tidak ditemukan.", "error", "Gagal Menghapus Jadwal");
            return;
        }

        const subjectName = typeof getSubjectName === "function"
            ? getSubjectName(item.subject_id)
            : "Mata Pelajaran";
        const dateText = typeof formatDateLong === "function"
            ? formatDateLong(item.date)
            : item.date;

        openConfirm(
            `Yakin ingin menghapus jadwal ${subjectName} - Sumatif ${item.sumatif_number} pada ${dateText}? Jadwal akan dinonaktifkan, bukan dihapus permanen.`,
            () => originalDeleteWithoutConfirm(id)
        );
    };

    async function originalDeleteWithoutConfirm(id) {
        const item = typeof findScheduleById === "function" ? findScheduleById(id) : null;
        if (!item) throw new Error("Jadwal tidak ditemukan.");

        // Sengaja hanya mengubah status. Tidak mengirim updated_at karena
        // operasi delete sebelumnya mendapat HTTP 400 dari PostgREST.
        const { error } = await supabaseClient
            .from("sumatif_schedules")
            .update({ status: "cancelled" })
            .eq("id", item.id);

        if (error) throw error;

        console.log("[Schedule] Berhasil dibatalkan:", item.id);
        await loadScheduleData();
        renderEducationCalendar();
        renderScheduleList();
        if (typeof decorateScheduleRows === "function") decorateScheduleRows();
        showAppDialog("Jadwal sumatif berhasil dihapus.", "success", "Jadwal Dihapus");
    }

    console.log("[Schedule] Konfirmasi Hapus custom aktif.");
})();
