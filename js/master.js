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
            classes: { label: "Kelas", columns: ["academic_year_id", "name", "level", "is_active"] },
            subjects: { label: "Mata Pelajaran", columns: ["name", "short_name", "is_active"] },
            profiles: { label: "Data Guru", columns: ["full_name", "role", "is_active"] }
        }
    };

    function isAdmin() { return state.profile && state.profile.role === "admin"; }
    function esc(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }

    function ensureMenu() {
        const nav = document.querySelector(".sidebar-nav");
        if (!nav || document.getElementById("masterDataMenu")) return;
        const divider = document.createElement("div"); divider.className = "sidebar-divider"; divider.id = "masterDataDivider";
        const button = document.createElement("button"); button.type = "button"; button.id = "masterDataMenu"; button.className = "sidebar-menu"; button.dataset.menu = "master"; button.innerHTML = '<span class="sidebar-icon">▦</span><span>Data Master</span>';
        const profileButton = nav.querySelector('[data-menu="profile"]');
        if (profileButton) { nav.insertBefore(divider, profileButton); nav.insertBefore(button, profileButton); } else { nav.appendChild(divider); nav.appendChild(button); }
    }

    function hideAllWorkspace() {
        document.querySelectorAll(".dashboard-home").forEach(el => el.classList.add("hidden"));
        ["scheduleWorkspace", "calendarWorkspace", "reportWorkspace", "profileWorkspace", "masterWorkspace"].forEach(id => document.getElementById(id)?.classList.add("hidden"));
    }
    function setActive(menu) { document.querySelectorAll(".sidebar-menu").forEach(button => button.classList.toggle("active", button.dataset.menu === menu)); }
    function showMaster() { if (!isAdmin()) { showAppDialog("Anda tidak memiliki hak akses untuk Data Master.", "warning", "Akses Ditolak"); return; } hideAllWorkspace(); document.getElementById("masterWorkspace")?.classList.remove("hidden"); setActive("master"); loadTab(state.activeTab); }

    function injectWorkspace() {
        if (document.getElementById("masterWorkspace")) return;
        const main = document.querySelector(".app-content"); if (!main) return;
        const section = document.createElement("section"); section.id = "masterWorkspace"; section.className = "master-workspace hidden";
        section.innerHTML = `<div class="section-header"><div><h2>Data Master</h2><p>Kelola data dasar yang digunakan oleh Jadwal, Kalender, dan Laporan Sumatif.</p></div></div><div class="master-tabs" id="masterTabs"></div><div class="master-panel" id="masterPanel"><div class="master-loading">Memuat data...</div></div>`;
        main.appendChild(section); renderTabs();
    }

    function renderTabs() {
        const tabs = document.getElementById("masterTabs"); if (!tabs) return;
        tabs.innerHTML = Object.entries(state.tables).map(([key, item]) => `<button type="button" class="master-tab ${state.activeTab === key ? "active" : ""}" data-master-tab="${key}">${item.label}</button>`).join("") + `<button type="button" class="master-tab ${state.activeTab === "education_calendar" ? "active" : ""}" data-master-tab="education_calendar">Kalender Pendidikan</button><button type="button" class="master-tab disabled" title="Belum diaktifkan karena tabel students belum tersedia">Data Siswa</button>`;
        tabs.querySelectorAll("[data-master-tab]").forEach(btn => btn.addEventListener("click", () => loadTab(btn.dataset.masterTab)));
    }

    async function loadTab(tab) {
        state.activeTab = tab; renderTabs(); const panel = document.getElementById("masterPanel"); if (!panel) return; panel.innerHTML = '<div class="master-loading">Memuat data...</div>';
        if (tab === "education_calendar") { await loadCalendar(panel); return; }
        const config = state.tables[tab]; if (!config) return;
        let query = supabaseClient.from(tab).select("*");
        if (tab === "profiles") query = query.eq("role", "guru").order("full_name"); else if (tab === "classes") query = query.order("name"); else query = query.order(config.columns[0]);
        const { data, error } = await query;
        if (error) { panel.innerHTML = `<div class="master-error">Gagal memuat ${esc(config.label)}: ${esc(error.message)}</div>`; return; }
        renderTable(panel, tab, config, data || []);
    }

    async function getAcademicYears() {
        const { data, error } = await supabaseClient.from("academic_years").select("id,name,start_date,end_date,is_active").order("start_date", { ascending: false });
        if (error) throw error; return data || [];
    }

    async function renderClasses(panel, rows) {
        let years = []; try { years = await getAcademicYears(); } catch (error) { panel.innerHTML = `<div class="master-error">Gagal memuat Tahun Pelajaran: ${esc(error.message)}</div>`; return; }
        const yearMap = Object.fromEntries(years.map(year => [year.id, year.name]));
        panel.innerHTML = `<div class="master-panel-header"><div><h3>Kelas</h3><span>${rows.length} data</span></div><button type="button" class="primary-button" id="masterAddButton">+ Tambah Data</button></div><div class="master-table-wrap"><table class="master-table"><thead><tr><th>Tahun Pelajaran</th><th>Nama Kelas</th><th>Tingkat</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${rows.length ? rows.map(row => `<tr><td>${esc(yearMap[row.academic_year_id] || "-")}</td><td>${esc(row.name)}</td><td>${esc(row.level)}</td><td><span class="master-status ${row.is_active ? "active" : "inactive"}">${row.is_active ? "Aktif" : "Tidak Aktif"}</span></td><td class="master-actions"><button type="button" class="master-action edit" data-master-edit="${esc(row.id)}">Edit</button><button type="button" class="master-action status" data-master-toggle="${esc(row.id)}">${row.is_active ? "Nonaktifkan" : "Aktifkan"}</button><button type="button" class="master-action delete" data-master-delete="${esc(row.id)}">Hapus</button></td></tr>`).join("") : '<tr><td colspan="5" class="master-empty">Belum ada data.</td></tr>'}</tbody></table></div>`;
        panel.querySelector("#masterAddButton")?.addEventListener("click", () => openClassForm(null, years));
        panel.querySelectorAll("[data-master-edit]").forEach(btn => btn.addEventListener("click", () => openClassForm(rows.find(item => item.id === btn.dataset.masterEdit) || null, years)));
        panel.querySelectorAll("[data-master-toggle]").forEach(btn => btn.addEventListener("click", () => { const row = rows.find(item => item.id === btn.dataset.masterToggle); if (row) toggleClassStatus(row); }));
        panel.querySelectorAll("[data-master-delete]").forEach(btn => btn.addEventListener("click", () => deleteRow("classes", btn.dataset.masterDelete)));
    }

    function renderTable(panel, tab, config, rows) {
        if (tab === "classes") { renderClasses(panel, rows); return; }
        const labels = { name: "Nama", level: "Tingkat", short_name: "Singkatan", full_name: "Nama Guru", role: "Peran", is_active: "Status" };
        const headers = config.columns.map(column => `<th>${labels[column] || column}</th>`).join("");
        const body = rows.length ? rows.map(row => `<tr>${config.columns.map(column => `<td>${column === "is_active" ? `<span class="master-status ${row[column] ? "active" : "inactive"}">${row[column] ? "Aktif" : "Tidak Aktif"}</span>` : esc(row[column])}</td>`).join("")}<td class="master-actions"><button type="button" class="master-action edit" data-master-edit="${esc(row.id)}">Edit</button>${config.columns.includes("is_active") ? `<button type="button" class="master-action status" data-master-toggle="${esc(row.id)}">${row.is_active ? "Nonaktifkan" : "Aktifkan"}</button>` : ""}<button type="button" class="master-action delete" data-master-delete="${esc(row.id)}">Hapus</button></td></tr>`).join("") : `<tr><td colspan="${config.columns.length + 1}" class="master-empty">Belum ada data.</td></tr>`;
        panel.innerHTML = `<div class="master-panel-header"><div><h3>${config.label}</h3><span>${rows.length} data</span></div><button type="button" class="primary-button" id="masterAddButton">+ Tambah Data</button></div><div class="master-table-wrap"><table class="master-table"><thead><tr>${headers}<th>Aksi</th></tr></thead><tbody>${body}</tbody></table></div>`;
        panel.querySelector("#masterAddButton")?.addEventListener("click", () => openForm(tab, config, null));
        panel.querySelectorAll("[data-master-edit]").forEach(btn => btn.addEventListener("click", () => { const row = rows.find(item => item.id === btn.dataset.masterEdit); openForm(tab, config, row || null); }));
        panel.querySelectorAll("[data-master-toggle]").forEach(btn => btn.addEventListener("click", () => toggleStatus(tab, rows.find(item => item.id === btn.dataset.masterToggle))));
        panel.querySelectorAll("[data-master-delete]").forEach(btn => btn.addEventListener("click", () => deleteRow(tab, btn.dataset.masterDelete)));
    }

    async function toggleStatus(tab, row) {
        if (!row) return;
        const next = !row.is_active;
        const label = tab === "subjects" ? `mata pelajaran ${row.name}` : `data ${row.full_name || row.name || "ini"}`;
        if (!confirm(`Yakin ingin ${next ? "mengaktifkan" : "menonaktifkan"} ${label}?`)) return;
        const { error } = await supabaseClient.from(tab).update({ is_active: next }).eq("id", row.id);
        if (error) { showAppDialog(error.message || "Gagal mengubah status.", "error", "Gagal Mengubah Status"); return; }
        await loadTab(tab);
        showAppDialog(`${tab === "subjects" ? "Mata pelajaran" : "Data"} ${row.name || row.full_name} berhasil ${next ? "diaktifkan" : "dinonaktifkan"}.`, "success", "Status Diperbarui");
    }

    async function toggleClassStatus(row) {
        const nextStatus = !row.is_active;
        const action = nextStatus ? "mengaktifkan" : "menonaktifkan";
        if (!confirm(`Yakin ingin ${action} kelas ${row.name}?`)) return;
        const { error } = await supabaseClient.from("classes").update({ is_active: nextStatus }).eq("id", row.id);
        if (error) { showAppDialog(error.message || "Gagal mengubah status kelas.", "error", "Gagal Mengubah Status"); return; }
        await loadTab("classes");
        showAppDialog(`Kelas ${row.name} berhasil ${nextStatus ? "diaktifkan" : "dinonaktifkan"}.`, "success", "Status Kelas");
    }

    function openForm(tab, config, row) {
        const fields = config.columns.map(column => {
            if (column === "is_active") return `<label><input type="checkbox" name="${column}" ${row?.[column] !== false ? "checked" : ""}> Aktif</label>`;
            return `<label>${column === "name" ? "Nama" : "Singkatan"}<input name="${column}" value="${esc(row?.[column])}" required></label>`;
        }).join("");
        showMasterModal(`${row ? "Edit" : "Tambah"} ${config.label}`, fields, async form => {
            const payload = {};
            config.columns.forEach(column => payload[column] = column === "is_active" ? form.elements[column].checked : form.elements[column].value.trim());
            await saveRow(tab, row?.id, payload);
        });
    }

    function openClassForm(row, years) {
        const activeYears = years.filter(year => year.is_active || year.id === row?.academic_year_id);
        const yearOptions = activeYears.length ? activeYears.map(year => `<option value="${esc(year.id)}" ${year.id === row?.academic_year_id ? "selected" : ""}>${esc(year.name)}</option>`).join("") : '<option value="">Belum ada Tahun Pelajaran aktif</option>';
        const fields = `<label>Tahun Pelajaran<select name="academic_year_id" required>${yearOptions}</select></label><label>Nama Kelas<input name="name" value="${esc(row?.name)}" placeholder="Contoh: 5A" required></label><label>Tingkat<select name="level" required>${[1,2,3,4,5,6].map(level => `<option value="${level}" ${Number(row?.level) === level ? "selected" : ""}>${level}</option>`).join("")}</select></label><label><input type="checkbox" name="is_active" ${row?.id ? (row.is_active ? "checked" : "") : "checked"}> Aktif</label>`;
        showMasterModal(`${row ? "Edit" : "Tambah"} Kelas`, fields, async form => { await saveRow("classes", row?.id, { academic_year_id: form.elements.academic_year_id.value, name: form.elements.name.value.trim(), level: Number(form.elements.level.value), is_active: form.elements.is_active.checked }); });
    }

    async function loadCalendar(panel) {
        const { data, error } = await supabaseClient.from("education_calendar").select("*").order("date");
        if (error) { panel.innerHTML = `<div class="master-error">Gagal memuat Kalender Pendidikan: ${esc(error.message)}</div>`; return; }
        const rows = data || [];
        panel.innerHTML = `<div class="master-panel-header"><div><h3>Kalender Pendidikan</h3><span>${rows.length} data</span></div><button type="button" class="primary-button" id="masterCalendarAdd">+ Tambah Event</button></div><div class="master-table-wrap"><table class="master-table"><thead><tr><th>Tanggal</th><th>Semester</th><th>Jenis</th><th>Judul</th><th>Dapat Dipilih</th><th>Aksi</th></tr></thead><tbody>${rows.length ? rows.map(row => `<tr><td>${esc(row.date)}</td><td>${row.semester === 1 ? "Ganjil" : "Genap"}</td><td>${esc(row.day_type)}</td><td>${esc(row.title)}</td><td>${row.is_selectable ? "Ya" : "Tidak"}</td><td class="master-actions"><button class="master-action edit" data-cal-edit="${esc(row.id)}">Edit</button><button class="master-action delete" data-cal-delete="${esc(row.id)}">Hapus</button></td></tr>`).join("") : '<tr><td colspan="6" class="master-empty">Belum ada event.</td></tr>'}</tbody></table></div>`;
        panel.querySelector("#masterCalendarAdd")?.addEventListener("click", () => openCalendarForm(null));
        panel.querySelectorAll("[data-cal-edit]").forEach(btn => btn.addEventListener("click", () => openCalendarForm(rows.find(x => x.id === btn.dataset.calEdit))));
        panel.querySelectorAll("[data-cal-delete]").forEach(btn => btn.addEventListener("click", () => deleteRow("education_calendar", btn.dataset.calDelete)));
    }

    function showMasterModal(title, fields, onSubmit) {
        document.getElementById("masterModalOverlay")?.remove();
        const overlay = document.createElement("div"); overlay.id = "masterModalOverlay"; overlay.className = "master-modal-overlay";
        overlay.innerHTML = `<div class="master-modal"><h3>${esc(title)}</h3><form id="masterForm">${fields}<div class="master-modal-actions"><button type="button" class="secondary-button" id="masterCancel">Batal</button><button type="submit" class="primary-button">Simpan</button></div></form></div>`;
        document.body.appendChild(overlay);
        overlay.querySelector("#masterCancel").onclick = () => overlay.remove();
        overlay.querySelector("form").onsubmit = async e => { e.preventDefault(); const button = overlay.querySelector('[type="submit"]'); button.disabled = true; try { await onSubmit(e.target); overlay.remove(); await loadTab(state.activeTab); } catch (error) { showAppDialog(error.message || "Gagal menyimpan data.", "error", "Gagal Menyimpan"); button.disabled = false; } };
    }

    async function saveRow(tab, id, payload) {
        const query = id ? supabaseClient.from(tab).update(payload).eq("id", id) : supabaseClient.from(tab).insert(payload);
        const { error } = await query; if (error) throw error;
    }

    function openCalendarForm(row) {
        const fields = `<label>Tanggal<input type="date" name="date" value="${esc(row?.date)}" required></label><label>Semester<select name="semester"><option value="1" ${row?.semester !== 2 ? "selected" : ""}>Ganjil</option><option value="2" ${row?.semester === 2 ? "selected" : ""}>Genap</option></select></label><label>Jenis<input name="day_type" value="${esc(row?.day_type || "Hari Efektif")}" required></label><label>Judul<input name="title" value="${esc(row?.title)}" required></label><label>Deskripsi<textarea name="description">${esc(row?.description)}</textarea></label><label><input type="checkbox" name="is_selectable" ${row?.id ? (row.is_selectable ? "checked" : "") : "checked"}> Dapat Dipilih</label>`;
        showMasterModal(`${row ? "Edit" : "Tambah"} Event Kalender Pendidikan`, fields, async form => { await saveRow("education_calendar", row?.id, { date: form.elements.date.value, semester: Number(form.elements.semester.value), day_type: form.elements.day_type.value.trim(), title: form.elements.title.value.trim(), description: form.elements.description.value.trim(), is_selectable: form.elements.is_selectable.checked }); });
    }

    async function deleteRow(tab, id) {
        if (!confirm("Yakin ingin menghapus data ini?")) return;
        const { error } = await supabaseClient.from(tab).delete().eq("id", id);
        if (error) { showAppDialog(error.message || "Gagal menghapus data.", "error", "Gagal Menghapus"); return; }
        await loadTab(state.activeTab);
    }

    function boot() {
        if (!isAdmin()) return;
        ensureMenu(); injectWorkspace();
        const button = document.getElementById("masterDataMenu");
        if (button && !button.dataset.bound) { button.dataset.bound = "1"; button.addEventListener("click", showMaster); }
        console.log("[Master] Data Master admin aktif.");
    }

    window.initMaster = boot;
})();