/* =========================================================
   SUMATIF PLANNER - DATA GURU FORM FIX
   Memastikan form Data Guru mengirim role = guru.
   Tidak mengubah struktur tabel profiles.
   ========================================================= */

(function () {
    function esc(v) {
        return String(v ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function openGuruForm() {
        document.getElementById("masterGuruFixOverlay")?.remove();

        const overlay = document.createElement("div");
        overlay.id = "masterGuruFixOverlay";
        overlay.className = "master-modal-overlay";
        overlay.innerHTML = `
            <div class="master-modal">
                <h3>Tambah Data Guru</h3>
                <form id="masterGuruFixForm">
                    <label>Nama Guru
                        <input name="full_name" placeholder="Contoh: Budi Santoso" required>
                    </label>
                    <label>Peran
                        <input value="Guru" disabled>
                    </label>
                    <label>
                        <input type="checkbox" name="is_active" checked> Aktif
                    </label>
                    <div class="master-modal-actions">
                        <button type="button" class="secondary-button" id="masterGuruFixCancel">Batal</button>
                        <button type="submit" class="primary-button">Simpan</button>
                    </div>
                </form>
            </div>`;

        document.body.appendChild(overlay);
        overlay.querySelector("#masterGuruFixCancel").onclick = () => overlay.remove();

        overlay.querySelector("form").onsubmit = async (event) => {
            event.preventDefault();
            const form = event.target;
            const button = form.querySelector('[type="submit"]');
            button.disabled = true;

            try {
                const fullName = form.elements.full_name.value.trim();
                if (!fullName) throw new Error("Nama Guru wajib diisi.");

                const { error } = await supabaseClient.from("profiles").insert({
                    full_name: fullName,
                    role: "guru",
                    is_active: form.elements.is_active.checked
                });

                if (error) throw error;

                overlay.remove();
                if (typeof initMaster === "function" && window.currentProfile) {
                    initMaster(window.currentProfile);
                }
                if (document.querySelector('[data-master-tab="profiles"]')) {
                    document.querySelector('[data-master-tab="profiles"]').click();
                }
                showAppDialog("Data Guru berhasil ditambahkan.", "success", "Data Guru");
            } catch (error) {
                showAppDialog(error.message || "Gagal menyimpan Data Guru.", "error", "Gagal Menyimpan");
                button.disabled = false;
            }
        };
    }

    function intercept(event) {
        const button = event.target.closest("#masterAddButton");
        if (!button) return;

        const tab = document.querySelector('.master-tab[data-master-tab="profiles"].active');
        if (!tab) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        openGuruForm();
    }

    document.addEventListener("click", intercept, true);
})();
