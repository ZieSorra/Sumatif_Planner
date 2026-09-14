/* =========================================================
   SUMATIF PLANNER - ACADEMIC YEAR FORM FIX
   academic_years requires name, start_date, end_date, is_active.
   This module keeps the existing Data Master UI and only replaces
   the incomplete Tahun Pelajaran add/edit form.
   ========================================================= */

(function bootAcademicYearFix() {
    if (window.__academicYearFixInstalled) return;
    window.__academicYearFixInstalled = true;

    const esc = value => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    function isAcademicYearTab() {
        return !!document.querySelector('.master-tab[data-master-tab="academic_years"].active');
    }

    function closeModal() {
        document.getElementById("academicYearFixModal")?.remove();
    }

    function openForm(row = null) {
        closeModal();

        const overlay = document.createElement("div");
        overlay.id = "academicYearFixModal";
        overlay.className = "master-modal-overlay";
        overlay.innerHTML = `
            <div class="master-modal">
                <h3>${row ? "Edit" : "Tambah"} Tahun Pelajaran</h3>
                <form id="academicYearFixForm">
                    <div class="master-form-grid">
                        <label>Nama Tahun Pelajaran
                            <input name="name" value="${esc(row?.name)}" placeholder="Contoh: 2027/2028" required>
                        </label>
                        <label>Tanggal Mulai
                            <input type="date" name="start_date" value="${esc(row?.start_date)}" required>
                        </label>
                        <label>Tanggal Selesai
                            <input type="date" name="end_date" value="${esc(row?.end_date)}" required>
                        </label>
                        <label class="master-check-row">
                            <input type="checkbox" name="is_active" ${row?.is_active ? "checked" : ""}>
                            Tahun pelajaran aktif
                        </label>
                    </div>
                    <div class="master-modal-footer">
                        <button type="button" id="academicYearFixCancel">Batal</button>
                        <button type="submit" class="primary-button">Simpan</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);

        const form = overlay.querySelector("#academicYearFixForm");
        overlay.querySelector("#academicYearFixCancel").onclick = closeModal;

        form.onsubmit = async event => {
            event.preventDefault();

            const name = form.elements.name.value.trim();
            const startDate = form.elements.start_date.value;
            const endDate = form.elements.end_date.value;
            const isActive = form.elements.is_active.checked;

            if (!name || !startDate || !endDate) return;
            if (startDate > endDate) {
                showAppDialog("Tanggal mulai tidak boleh setelah tanggal selesai.", "warning", "Data Tidak Valid");
                return;
            }

            const payload = {
                name,
                start_date: startDate,
                end_date: endDate,
                is_active: isActive
            };

            const result = row?.id
                ? await supabaseClient.from("academic_years").update(payload).eq("id", row.id)
                : await supabaseClient.from("academic_years").insert(payload);

            if (result.error) {
                showAppDialog(result.error.message || "Gagal menyimpan tahun pelajaran.", "error", "Gagal Menyimpan");
                return;
            }

            closeModal();

            // Reuse the existing Data Master initialization so no table markup
            // or other master-data behavior is duplicated here.
            if (typeof window.initMasterData === "function") {
                await window.initMasterData();
            }

            showAppDialog("Tahun pelajaran berhasil disimpan.", "success", "Data Master");
        };
    }

    async function handleAdd(event) {
        if (!isAcademicYearTab()) return;
        const button = event.target.closest("#masterAddButton");
        if (!button) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        openForm(null);
    }

    async function handleEdit(event) {
        if (!isAcademicYearTab()) return;
        const button = event.target.closest("[data-master-edit]");
        if (!button) return;

        const rowId = button.dataset.masterEdit;
        if (!rowId) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        const { data, error } = await supabaseClient
            .from("academic_years")
            .select("id,name,start_date,end_date,is_active")
            .eq("id", rowId)
            .maybeSingle();

        if (error) {
            showAppDialog(error.message || "Gagal memuat tahun pelajaran.", "error", "Gagal Memuat");
            return;
        }
        if (!data) return;
        openForm(data);
    }

    // Capture phase runs before master.js's own button listeners.
    document.addEventListener("click", handleAdd, true);
    document.addEventListener("click", handleEdit, true);

    const style = document.createElement("style");
    style.id = "academicYearFixStyles";
    style.textContent = `
        .master-check-row{display:flex!important;flex-direction:row!important;align-items:center;gap:8px}
        .master-check-row input{width:auto!important}
    `;
    document.head.appendChild(style);

    console.log("[Master] Form Tahun Pelajaran diperbaiki.");
})();
