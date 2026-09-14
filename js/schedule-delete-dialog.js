/* =========================================================
   SUMATIF PLANNER - CUSTOM DELETE CONFIRMATION
   Mengganti window.confirm() dengan dialog aplikasi.
   ========================================================= */

function showDeleteScheduleDialog(item, subjectName) {
    return new Promise(resolve => {
        const oldDialog = document.getElementById("scheduleDeleteConfirmOverlay");
        if (oldDialog) oldDialog.remove();

        const overlay = document.createElement("div");
        overlay.id = "scheduleDeleteConfirmOverlay";
        overlay.className = "app-dialog-overlay schedule-delete-confirm-overlay";

        const dialog = document.createElement("div");
        dialog.className = "app-dialog warning schedule-delete-confirm-dialog";

        const icon = document.createElement("div");
        icon.className = "app-dialog-icon";
        icon.textContent = "!";

        const title = document.createElement("h3");
        title.className = "app-dialog-title";
        title.textContent = "Hapus Jadwal";

        const message = document.createElement("p");
        message.className = "app-dialog-message";
        message.textContent = `Apakah Anda yakin ingin menghapus ${subjectName} - Sumatif ${item.sumatif_number} pada ${formatDateLong(item.date)}?`;

        const note = document.createElement("p");
        note.className = "schedule-delete-confirm-note";
        note.textContent = "Jadwal akan dinonaktifkan, bukan dihapus permanen.";

        const footer = document.createElement("div");
        footer.className = "schedule-delete-confirm-footer";

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "secondary-button";
        cancelButton.textContent = "Batal";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "schedule-delete-confirm-button";
        deleteButton.textContent = "Hapus";

        footer.appendChild(cancelButton);
        footer.appendChild(deleteButton);

        dialog.appendChild(icon);
        dialog.appendChild(title);
        dialog.appendChild(message);
        dialog.appendChild(note);
        dialog.appendChild(footer);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        let finished = false;
        const finish = result => {
            if (finished) return;
            finished = true;
            overlay.remove();
            document.removeEventListener("keydown", handleKeydown);
            resolve(result);
        };

        const handleKeydown = event => {
            if (event.key === "Escape") finish(false);
        };

        cancelButton.addEventListener("click", () => finish(false));
        deleteButton.addEventListener("click", () => finish(true));
        overlay.addEventListener("click", event => {
            if (event.target === overlay) finish(false);
        });
        document.addEventListener("keydown", handleKeydown);

        cancelButton.focus();
    });
}

/* Override fungsi hapus lama setelah file ini dimuat. */
async function deleteScheduleFromBoard(id) {
    const item = findScheduleById(id);
    if (!item) {
        showAppDialog("Jadwal tidak ditemukan.", "error", "Gagal Menghapus Jadwal");
        return;
    }

    const subjectName = getSubjectName(item.subject_id);
    const confirmed = await showDeleteScheduleDialog(item, subjectName);
    if (!confirmed) return;

    try {
        const { error } = await supabaseClient
            .from("sumatif_schedules")
            .update({
                status: "cancelled",
                updated_at: new Date().toISOString()
            })
            .eq("id", item.id);

        if (error) throw error;

        console.log("[Schedule] Berhasil dibatalkan:", item.id);
        await loadScheduleData();
        renderEducationCalendar();
        renderScheduleList();
        decorateScheduleRows();
        showAppDialog("Jadwal sumatif berhasil dihapus.", "success", "Jadwal Dihapus");
    } catch (error) {
        console.error("[Schedule] Gagal menghapus:", error);
        showAppDialog(error.message || "Jadwal gagal dihapus.", "error", "Gagal Menghapus Jadwal");
    }
}

/* Hilangkan tooltip browser dari tombol aksi. */
function removeScheduleActionTitles(root = document) {
    root.querySelectorAll?.(".schedule-action-btn[title]").forEach(button => {
        button.removeAttribute("title");
    });
}

const scheduleDeleteTitleObserver = new MutationObserver(() => {
    removeScheduleActionTitles();
});

function initScheduleDeleteDialog() {
    removeScheduleActionTitles();
    scheduleDeleteTitleObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScheduleDeleteDialog);
} else {
    initScheduleDeleteDialog();
}

(function injectScheduleDeleteDialogStyles() {
    if (document.getElementById("scheduleDeleteDialogStyles")) return;

    const style = document.createElement("style");
    style.id = "scheduleDeleteDialogStyles";
    style.textContent = `
        .schedule-delete-confirm-dialog{max-width:430px}
        .schedule-delete-confirm-dialog .app-dialog-icon{font-weight:700}
        .schedule-delete-confirm-note{margin:0 0 18px;color:#667085;font-size:13px;line-height:1.5}
        .schedule-delete-confirm-footer{display:flex;justify-content:flex-end;gap:10px}
        .schedule-delete-confirm-button{border:0;border-radius:8px;padding:10px 18px;background:#b42318;color:#fff;font-weight:600;cursor:pointer}
        .schedule-delete-confirm-button:hover{background:#912018}
    `;
    document.head.appendChild(style);
})();
