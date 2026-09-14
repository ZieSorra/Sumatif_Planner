/* =========================================================
   SUMATIF PLANNER - DATA MASTER
   Admin-only management workspace.
   ========================================================= */

(function () {
    const state = {
        profile: null,
        activeTab: "academic_years",
        tables: {
            academic_years: { label: "Tahun Pelajaran", columns: ["name"] },
            classes: { label: "Kelas", columns: ["name", "level"] },
            subjects: { label: "Mata Pelajaran", columns: ["name", "short_name"] },
            profiles: { label: "Data Guru", columns: ["full_name", "role", "is_active"] }
        }
    };

    function isAdmin() {
        return state.profile && state.profile.role === "admin";
    }

    function esc(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function ensureMenu() {
        const nav = document.querySelector(".sidebar-nav");
        if (!nav || document.getElementById("masterDataMenu")) return;

        const divider = document.createElement("div");
        divider.className = "sidebar-divider";
        divider.id = "masterDataDivider";

        const button = document.createElement("button");
        button.type = "button";
        button.id = "masterDataMenu";
        button.className = "sidebar-menu";
        button.dataset.menu = "master";
        button.innerHTML = '<span class="sidebar-icon">▦</span><span>Data Master</span>';

        const profileButton = nav.querySelector('[data-menu="profile"]');
        if (profileButton) {
            nav.insertBefore(divider, profileButton);
            nav.insertBefore(button, profileButton);
        } else {
            nav.appendChild(divider);
            nav.appendChild(button);
        }
    }

    function hideAllWorkspace() {
        document.querySelectorAll(".dashboard-home").forEach(el => el.classList.add("hidden"));
        document.getElementById("scheduleWorkspace")?.classList.add("hidden");
        document.getElementById("calendarWorkspace")?.classList.add("hidden");
        document.getElementById("reportWorkspace")?.classList.add("hidden");
        document.getElementById("profileWorkspace")?.classList.add("hidden");
        document.getElementById("masterWorkspace")?.classList.add("hidden");
    }

    function setActive(menu) {
        document.querySelectorAll(".sidebar-menu").forEach(button => {
            button.classList.toggle("active", button.dataset.menu === menu);
        });
    }

    function showMaster() {
        if (!isAdmin()) {
            showAppDialog("Anda tidak memiliki hak akses untuk Data Master.", "warning", "Akses Ditolak");
            return;
        }
        hideAllWorkspace();
        document.getElementById("masterWorkspace")?.classList.remove("hidden");
        setActive("master");
        loadTab(state.activeTab);
    }

    function injectWorkspace() {
        if (document.getElementById("masterWorkspace")) return;
        const main = document.querySelector(".app-content");
        if (!main) return;

        const section = document.createElement("section");
        section.id = "masterWorkspace";
        section.className = "master-workspace hidden";
        section.innerHTML = `
            <div class="section-header">
                <div>
                    <h2>Data Master</h2>
                    <p>Kelola data dasar yang digunakan oleh Jadwal, Kalender, dan Laporan Sumatif.</p>
                </div>
            </div>
            <div class="master-tabs" id="masterTabs"></div>
            <div class="master-panel" id="masterPanel">
                <div class="master-loading">Memuat data...</div>
            </div>
        `;
        main.appendChild(section);
        renderTabs();
    }

    function renderTabs() {
        const tabs = document.getElementById("masterTabs");
        if (!tabs) return;
        tabs.innerHTML = Object.entries(state.tables).map(([key, item]) => `
            <button type="button" class="master-tab ${state.activeTab === key ? "active" : ""}" data-master-tab="${key}">${item.label}</button>
        `).join("") + `
            <button type="button" class="master-tab ${state.activeTab === "education_calendar" ? "active" : ""}" data-master-tab="education_calendar">Kalender Pendidikan</button>
            <button type="button" class="master-tab disabled" title="Belum diaktifkan karena tabel students belum tersedia">Data Siswa</button>
        `;
    }

    async function loadTab(tab) {
        state.activeTab = tab;
        renderTabs();
        const panel = document.getElementById("masterPanel");
        if (!panel) return;
        panel.innerHTML = '<div class="master-loading">Memuat data...</div>';

        if (tab === "education_calendar") {
            await loadCalendar(panel);
            return;
        }

        const config = state.tables[tab];
        if (!config) return;

        let query = supabaseClient.from(tab).select("*");
        if (tab === "profiles") query = query.eq("role", "guru").order("full_name");
        else query = query.order(config.columns[0]);

        const { data, error } = await query;
        if (error) {
            panel.innerHTML = `<div class="master-error">Gagal memuat ${esc(config.label)}: ${esc(error.message)}</div>`;
            return;
        }
        renderTable(panel, tab, config, data || []);
    }

    function renderTable(panel, tab, config, rows) {
        const headers = config.columns.map(column => {
            const labels = { name: "Nama", level: "Tingkat", short_name: "Singkatan", full_name: "Nama Guru", role: "Peran", is_active: "Aktif" };
            return `<th>${labels[column] || column}</th>`;
        }).join("");

        const body = rows.length ? rows.map(row => `
            <tr>
                ${config.columns.map(column => `<td>${column === "is_active" ? (row[column] ? "Ya" : "Tidak") : esc(row[column])}</td>`).join("")}
                <td class="master-actions">
                    <button type="button" class="master-action edit" data-master-edit="${esc(row.id)}">Edit</button>
                    <button type="button" class="master-action delete" data-master-delete="${esc(row.id)}">Hapus</button>
                </td>
            </tr>
        `).join("") : `<tr><td colspan="${config.columns.length + 1}" class="master-empty">Belum ada data.</td></tr>`;

        panel.innerHTML = `
            <div class="master-panel-header">
                <div><h3>${config.label}</h3><span>${rows.length} data</span></div>
                <button type="button" class="primary-button" id="masterAddButton">+ Tambah Data</button>
            </div>
            <div class="master-table-wrap">
                <table class="master-table"><thead><tr>${headers}<th>Aksi</th></tr></thead><tbody>${body}</tbody></table>
            </div>
        `;

        panel.querySelector("#masterAddButton")?.addEventListener("click", () => openForm(tab, config, null));
        panel.querySelectorAll("[data-master-edit]").forEach(btn => btn.addEventListener("click", () => {
            const row = rows.find(item => item.id === btn.dataset.masterEdit);
            openForm(tab, config, row || null);
        }));
        panel.querySelectorAll("[data-master-delete]").forEach(btn => btn.addEventListener("click", () => deleteRow(tab, btn.dataset.masterDelete)));
    }

    async function loadCalendar(panel) {
        const { data, error } = await supabaseClient
            .from("education_calendar")
            .select("*")
            .order("date");
        if (error) {
            panel.innerHTML = `<div class="master-error">Gagal memuat Kalender Pendidikan: ${esc(error.message)}</div>`;
            return;
        }
        const rows = data || [];
        panel.innerHTML = `
            <div class="master-panel-header">
                <div><h3>Kalender Pendidikan</h3><span>${rows.length} data</span></div>
                <button type="button" class="primary-button" id="masterCalendarAdd">+ Tambah Event</button>
            </div>
            <div class="master-table-wrap"><table class="master-table">
                <thead><tr><th>Tanggal</th><th>Semester</th><th>Jenis</th><th>Judul</th><th>Dapat Dipilih</th><th>Aksi</th></tr></thead>
                <tbody>${rows.length ? rows.map(row => `<tr>
                    <td>${esc(row.date)}</td><td>${row.semester === 1 ? "Ganjil" : "Genap"}</td><td>${esc(row.day_type)}</td><td>${esc(row.title)}</td><td>${row.is_selectable ? "Ya" : "Tidak"}</td>
                    <td class="master-actions"><button class="master-action edit" data-cal-edit="${esc(row.id)}">Edit</button><button class="master-action delete" data-cal-delete="${esc(row.id)}">Hapus</button></td>
                </tr>`).join("") : '<tr><td colspan="6" class="master-empty">Belum ada event.</td></tr>'}</tbody>
            </table></div>`;
        panel.querySelector("#masterCalendarAdd")?.addEventListener("click", () => openCalendarForm(null));
        panel.querySelectorAll("[data-cal-edit]").forEach(btn => btn.addEventListener("click", () => openCalendarForm(rows.find(x => x.id === btn.dataset.calEdit))));
        panel.querySelectorAll("[data-cal-delete]").forEach(btn => btn.addEventListener("click", () => deleteRow("education_calendar", btn.dataset.calDelete)));
    }

    function openForm(tab, config, row) {
        const fields = config.columns.map(column => {
            if (column === "is_active") return `<label><input type="checkbox" name="${column}" ${row?.[column] ? "checked" : ""}> Aktif</label>`;
            return `<label>${column === "name" ? "Nama" : column === "level" ? "Tingkat" : "Singkatan"}<input name="${column}" value="${esc(row?.[column])}" required></label>`;
        }).join("");
        showMasterModal(`${row ? "Edit" : "Tambah"} ${config.label}`, fields, async form => {
            const payload = {};
            config.columns.forEach(column => payload[column] = column === "is_active" ? form.elements[column].checked : form.elements[column].value.trim());
            await saveRow(tab, row?.id, payload);
        });
    }

    function openCalendarForm(row) {
        const fields = `
            <label>Tahun Pelajaran ID<input name="academic_year_id" value="${esc(row?.academic_year_id)}" required></label>
            <label>Semester<select name="semester"><option value="1" ${row?.semester === 1 ? "selected" : ""}>Ganjil</option><option value="2" ${row?.semester === 2 ? "selected" : ""}>Genap</option></select></label>
            <label>Tanggal<input type="date" name="date" value="${esc(row?.date)}" required></label>
            <label>Jenis Hari<input name="day_type" value="${esc(row?.day_type || "Hari Efektif")}" required></label>
            <label>Judul Event<input name="title" value="${esc(row?.title)}" required></label>
            <label>Deskripsi<textarea name="description">${esc(row?.description)}</textarea></label>
            <label><input type="checkbox" name="is_selectable" ${row?.is_selectable ? "checked" : ""}> Tanggal dapat dipilih untuk Sumatif</label>`;
        showMasterModal(`${row ? "Edit" : "Tambah"} Event Kalender Pendidikan`, fields, async form => {
            const payload = {
                academic_year_id: form.elements.academic_year_id.value,
                semester: Number(form.elements.semester.value),
                date: form.elements.date.value,
                day_type: form.elements.day_type.value.trim(),
                title: form.elements.title.value.trim(),
                description: form.elements.description.value.trim(),
                is_selectable: form.elements.is_selectable.checked
            };
            await saveRow("education_calendar", row?.id, payload);
        });
    }

    function showMasterModal(title, fields, onSubmit) {
        document.getElementById("masterModal")?.remove();
        const overlay = document.createElement("div");
        overlay.id = "masterModal";
        overlay.className = "master-modal-overlay";
        overlay.innerHTML = `<div class="master-modal"><h3>${esc(title)}</h3><form id="masterModalForm"><div class="master-form-grid">${fields}</div><div class="master-modal-footer"><button type="button" id="masterCancel">Batal</button><button type="submit" class="primary-button">Simpan</button></div></form></div>`;
        document.body.appendChild(overlay);
        const form = overlay.querySelector("form");
        overlay.querySelector("#masterCancel").onclick = () => overlay.remove();
        form.onsubmit = async event => {
            event.preventDefault();
            try { await onSubmit(form); overlay.remove(); await loadTab(state.activeTab); showAppDialog("Data berhasil disimpan.", "success", "Data Master"); }
            catch (error) { showAppDialog(error.message || "Gagal menyimpan data.", "error", "Gagal Menyimpan"); }
        };
    }

    async function saveRow(table, id, payload) {
        let result;
        if (id) result = await supabaseClient.from(table).update(payload).eq("id", id);
        else result = await supabaseClient.from(table).insert(payload);
        if (result.error) throw result.error;
    }

    async function deleteRow(table, id) {
        if (!confirm("Hapus data ini? Tindakan ini tidak dapat dibatalkan.")) return;
        const { error } = await supabaseClient.from(table).delete().eq("id", id);
        if (error) { showAppDialog(error.message || "Gagal menghapus data.", "error", "Gagal Menghapus"); return; }
        await loadTab(state.activeTab);
        showAppDialog("Data berhasil dihapus.", "success", "Data Master");
    }

    function installStyles() {
        if (document.getElementById("masterStyles")) return;
        const style = document.createElement("style");
        style.id = "masterStyles";
        style.textContent = `
            .master-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}.master-tab{border:1px solid #dbe2ea;background:#fff;border-radius:8px;padding:9px 14px;cursor:pointer}.master-tab.active{background:#eef5ff;border-color:#b9d1f5;color:#1456a0;font-weight:600}.master-tab.disabled{opacity:.45;cursor:not-allowed}.master-panel{background:#fff;border:1px solid #e1e7ef;border-radius:14px;padding:18px}.master-panel-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.master-panel-header h3{margin:0 0 3px}.master-panel-header span{font-size:12px;color:#667085}.master-table-wrap{overflow:auto}.master-table{width:100%;border-collapse:collapse;font-size:13px}.master-table th,.master-table td{border-bottom:1px solid #edf0f4;padding:10px;text-align:left;vertical-align:middle}.master-table th{background:#f8fafc;font-weight:600}.master-actions{white-space:nowrap}.master-action{border:0;background:transparent;cursor:pointer;margin-right:8px}.master-action.edit{color:#1456a0}.master-action.delete{color:#b42318}.master-empty,.master-loading,.master-error{text-align:center;padding:30px;color:#667085}.master-error{color:#b42318}.master-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px}.master-modal{width:min(560px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:14px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.2)}.master-modal h3{margin-top:0}.master-form-grid{display:grid;gap:12px}.master-form-grid label{display:grid;gap:6px;font-size:13px;font-weight:600}.master-form-grid input,.master-form-grid select,.master-form-grid textarea{box-sizing:border-box;width:100%;border:1px solid #d0d5dd;border-radius:8px;padding:9px;font:inherit;font-weight:400}.master-form-grid textarea{min-height:80px;resize:vertical}.master-modal-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.master-modal-footer button{border:1px solid #d0d5dd;background:#fff;border-radius:8px;padding:9px 14px;cursor:pointer}
        `;
        document.head.appendChild(style);
    }

    async function init() {
        try {
            const user = await getCurrentUser();
            if (!user) return;
            state.profile = await getProfile(user.id);
            if (!isAdmin()) return;
            ensureMenu();
            injectWorkspace();
            installStyles();
            console.log("[Master] Data Master admin aktif.");
        } catch (error) {
            console.error("[Master] Gagal inisialisasi:", error);
        }
    }

    document.addEventListener("click", event => {
        const tab = event.target.closest("[data-master-tab]");
        if (tab && !tab.classList.contains("disabled")) loadTab(tab.dataset.masterTab);
        const menu = event.target.closest('[data-menu="master"]');
        if (menu) { event.preventDefault(); showMaster(); }
    });

    window.initMasterData = init;
    init();
})();
