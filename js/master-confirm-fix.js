/* =========================================================
   SUMATIF PLANNER - MASTER CONFIRM DIALOG
   Mengganti confirm() bawaan browser pada aksi Data Master.
   Tidak mengubah struktur database.
   ========================================================= */

(function () {
    let busy = false;

    function closeDialog() {
        document.getElementById("masterConfirmOverlay")?.remove();
    }

    function confirmDialog(message, title, onConfirm) {
        if (busy || document.getElementById("masterConfirmOverlay")) return;

        const overlay = document.createElement("div");
        overlay.id = "masterConfirmOverlay";
        overlay.className = "master-modal-overlay";
        overlay.innerHTML = `
            <div class="master-modal master-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="masterConfirmTitle">
                <div class="master-confirm-icon">!</div>
                <h3 id="masterConfirmTitle">${escapeHtml(title)}</h3>
                <p class="master-confirm-message">${escapeHtml(message)}</p>
                <div class="master-modal-actions">
                    <button type="button" class="secondary-button" id="masterConfirmCancel">Batal</button>
                    <button type="button" class="primary-button" id="masterConfirmOk">Ya, Lanjutkan</button>
                </div>
            </div>`;

        document.body.appendChild(overlay);

        overlay.querySelector("#masterConfirmCancel").onclick = closeDialog;
        overlay.querySelector("#masterConfirmOk").onclick = async () => {
            if (busy) return;
            busy = true;
            const ok = overlay.querySelector("#masterConfirmOk");
            const cancel = overlay.querySelector("#masterConfirmCancel");
            ok.disabled = true;
            cancel.disabled = true;
            ok.textContent = "Memproses...";
            try {
                await onConfirm();
                closeDialog();
            } catch (error) {
                showAppDialog(error.message || "Operasi gagal.", "error", "Operasi Gagal");
                ok.disabled = false;
                cancel.disabled = false;
                ok.textContent = "Ya, Lanjutkan";
            } finally {
                busy = false;
            }
        };

        overlay.addEventListener("click", event => {
            if (event.target === overlay && !busy) closeDialog();
        });
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function activeTab() {
        return document.querySelector("#masterTabs .master-tab.active")?.dataset.masterTab || null;
    }

    async function reloadCurrentTab() {
        const tab = activeTab();
        if (typeof window.loadMasterTab === "function" && tab) {
            await window.loadMasterTab(tab);
            return;
        }
        const tabButton = tab && document.querySelector(`#masterTabs [data-master-tab="${CSS.escape(tab)}"]`);
        tabButton?.click();
    }

    function getRowName(button) {
        const row = button.closest("tr");
        return row?.querySelector("td")?.textContent?.trim() || "data ini";
    }

    async function toggleStatus(button) {
        const tab = activeTab();
        const id = button.dataset.masterToggle;
        if (!tab || !id) return;

        const row = button.closest("tr");
        const status = row?.querySelector(".master-status")?.textContent?.trim();
        const nextActive = status !== "Aktif";
        const name = getRowName(button);
        const label = tab === "subjects" ? `mata pelajaran ${name}` : tab === "classes" ? `kelas ${name}` : tab === "profiles" ? `guru ${name}` : `data ${name}`;
        const action = nextActive ? "mengaktifkan" : "menonaktifkan";

        confirmDialog(`Yakin ingin ${action} ${label}?`, nextActive ? "Aktifkan Data" : "Nonaktifkan Data", async () => {
            const { error } = await supabaseClient.from(tab).update({ is_active: nextActive }).eq("id", id);
            if (error) throw error;
            await reloadCurrentTab();
            showAppDialog(`${label.charAt(0).toUpperCase() + label.slice(1)} berhasil ${nextActive ? "diaktifkan" : "dinonaktifkan"}.`, "success", "Status Diperbarui");
        });
    }

    async function deleteData(button) {
        const tab = activeTab();
        const id = button.dataset.masterDelete;
        if (!tab || !id) return;
        const name = getRowName(button);

        confirmDialog(`Yakin ingin menghapus ${name}? Tindakan ini tidak dapat dibatalkan.`, "Hapus Data", async () => {
            const { error } = await supabaseClient.from(tab).delete().eq("id", id);
            if (error) throw error;
            await reloadCurrentTab();
            showAppDialog("Data berhasil dihapus.", "success", "Data Dihapus");
        });
    }

    document.addEventListener("click", event => {
        if (busy) return;

        const statusButton = event.target.closest("[data-master-toggle]");
        if (statusButton && document.getElementById("masterWorkspace")) {
            event.preventDefault();
            event.stopImmediatePropagation();
            toggleStatus(statusButton);
            return;
        }

        const deleteButton = event.target.closest("[data-master-delete]");
        if (deleteButton && document.getElementById("masterWorkspace")) {
            event.preventDefault();
            event.stopImmediatePropagation();
            deleteData(deleteButton);
        }
    }, true);
})();
