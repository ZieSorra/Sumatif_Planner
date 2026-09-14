/* =========================================================
   SUMATIF PLANNER - DATA GURU FORM
   Data Guru adalah profile yang terhubung ke auth.users.
   Form ini tidak membuat akun Auth dan tidak membutuhkan Service Role Key.
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

    function isUuid(value) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }

    function openGuruForm() {
        document.getElementById("masterGuruFixOverlay")?.remove();

        const overlay = document.createElement("div");
        overlay.id = "masterGuruFixOverlay";
        overlay.className = "master-modal-overlay";
        overlay.innerHTML = `
            <div class="master-modal">
                <h3>Tambah Data Guru</h3>
                <p class="master-form-help">
                    Buat akun guru terlebih dahulu di Supabase Authentication, lalu masukkan User ID-nya di sini.
                </p>
                <form id="masterGuruFixForm">
                    <label>User ID Akun Auth
                        <input name="id" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required autocomplete="off">
                    </label>
                    <small class="master-form-help">User ID harus berasal dari akun pada Authentication → Users.</small>

                    <label>Nama Guru
                        <input name="full_name" placeholder="Contoh: Budi Santoso" required autocomplete="name">
                    </label>

                    <label>Peran
                        <input value="Guru" disabled>
                    </label>

                    <label class="master-check-label">
                        <input type="checkbox" name="is_active" checked> Aktif
                    </label>

                    <div class="master-modal-actions">
                        <button type="button" class="secondary-button" id="masterGuruFixCancel">Batal</button>
                        <button type="submit" class="primary-button">Simpan Profile</button>
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
                const id = form.elements.id.value.trim();
                const fullName = form.elements.full_name.value.trim();

                if (!isUuid(id)) throw new Error("User ID Auth tidak valid. Masukkan UUID dari Authentication → Users.");
                if (!fullName) throw new Error("Nama Guru wajib diisi.");

                const { data: existing, error: existingError } = await supabaseClient
                    .from("profiles")
                    .select("id, full_name, role")
                    .eq("id", id)
                    .maybeSingle();

                if (existingError) throw existingError;
                if (existing) throw new Error(`User ID tersebut sudah memiliki profile (${existing.full_name || "tanpa nama"}).`);

                const { error } = await supabaseClient.from("profiles").insert({
                    id,
                    full_name: fullName,
                    role: "guru",
                    is_active: form.elements.is_active.checked
                });

                if (error) {
                    if (error.code === "23503") {
                        throw new Error("User ID tidak ditemukan pada Authentication → Users. Pastikan UUID yang dimasukkan benar.");
                    }
                    if (error.code === "42501") {
                        throw new Error("Akun ini belum memiliki izin untuk membuat profile guru.");
                    }
                    throw error;
                }

                overlay.remove();
                if (typeof initMaster === "function" && window.currentProfile) {
                    initMaster(window.currentProfile);
                }
                document.querySelector('[data-master-tab="profiles"]')?.click();
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
