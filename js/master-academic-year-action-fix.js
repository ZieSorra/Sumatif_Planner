/* =========================================================
   SUMATIF PLANNER - ACADEMIC YEAR STATUS ACTION
   Adds active/inactive status and one-click activation.
   ========================================================= */

(function () {
    let observer = null;
    let busy = false;

    function show(message, type, title) {
        if (typeof showAppDialog === "function") {
            showAppDialog(message, type, title);
        } else {
            alert(message);
        }
    }

    async function toggleAcademicYear(id, currentlyActive) {
        if (busy) return;
        busy = true;

        try {
            if (currentlyActive) {
                const { error } = await supabaseClient
                    .from("academic_years")
                    .update({ is_active: false })
                    .eq("id", id);
                if (error) throw error;
            } else {
                const { error: deactivateError } = await supabaseClient
                    .from("academic_years")
                    .update({ is_active: false })
                    .neq("id", id);
                if (deactivateError) throw deactivateError;

                const { error: activateError } = await supabaseClient
                    .from("academic_years")
                    .update({ is_active: true })
                    .eq("id", id);
                if (activateError) throw activateError;
            }

            if (typeof window.loadMasterAcademicYears === "function") {
                await window.loadMasterAcademicYears();
            } else {
                window.location.reload();
            }

            show(
                currentlyActive ? "Tahun pelajaran dinonaktifkan." : "Tahun pelajaran berhasil diaktifkan.",
                "success",
                "Status Tahun Pelajaran"
            );
        } catch (error) {
            console.error("[Master] Gagal mengubah status tahun pelajaran:", error);
            show(error.message || "Gagal mengubah status tahun pelajaran.", "error", "Gagal Mengubah Status");
        } finally {
            busy = false;
        }
    }

    function enhanceAcademicYearTable() {
        if (busy) return;

        const tabs = document.getElementById("masterTabs");
        const activeTab = tabs?.querySelector('[data-master-tab="academic_years"]');
        if (!activeTab?.classList.contains("active")) return;

        const panel = document.getElementById("masterPanel");
        const table = panel?.querySelector(".master-table");
        if (!table || table.dataset.academicYearEnhanced === "1") return;

        const headerRow = table.querySelector("thead tr");
        const bodyRows = table.querySelectorAll("tbody tr");
        if (!headerRow || !bodyRows.length) return;

        const statusHeader = document.createElement("th");
        statusHeader.textContent = "Status";
        headerRow.insertBefore(statusHeader, headerRow.lastElementChild);

        bodyRows.forEach(row => {
            const editButton = row.querySelector("[data-master-edit]");
            const id = editButton?.dataset.masterEdit;
            if (!id) return;

            const statusCell = document.createElement("td");
            statusCell.className = "master-status-cell";
            statusCell.textContent = "Memuat...";
            row.insertBefore(statusCell, row.lastElementChild);

            const actionCell = row.lastElementChild;
            const actionButton = document.createElement("button");
            actionButton.type = "button";
            actionButton.className = "master-action status-toggle";
            actionButton.dataset.academicYearStatusId = id;
            actionCell.appendChild(actionButton);
        });

        table.dataset.academicYearEnhanced = "1";
        loadAcademicYearStatuses(table);
    }

    async function loadAcademicYearStatuses(table) {
        const { data, error } = await supabaseClient
            .from("academic_years")
            .select("id, is_active")
            .order("name");

        if (error) {
            console.error("[Master] Gagal memuat status tahun pelajaran:", error);
            return;
        }

        const map = new Map((data || []).map(row => [row.id, !!row.is_active]));
        table.querySelectorAll("tbody tr").forEach(row => {
            const button = row.querySelector("[data-academic-year-status-id]");
            if (!button) return;

            const active = map.get(button.dataset.academicYearStatusId) === true;
            const statusCell = row.querySelector(".master-status-cell");
            if (statusCell) {
                statusCell.textContent = active ? "Aktif" : "Tidak Aktif";
                statusCell.classList.toggle("active", active);
                statusCell.classList.toggle("inactive", !active);
            }

            button.textContent = active ? "Nonaktifkan" : "Aktifkan";
            button.classList.toggle("deactivate", active);
            button.classList.toggle("activate", !active);
            button.onclick = () => toggleAcademicYear(button.dataset.academicYearStatusId, active);
        });
    }

    function watch() {
        if (observer) return;
        observer = new MutationObserver(() => enhanceAcademicYearTable());
        const panel = document.getElementById("masterPanel");
        if (panel) observer.observe(panel, { childList: true, subtree: true });
        enhanceAcademicYearTable();
    }

    function init() {
        watch();
        console.log("[Master] Aksi aktif/tidak aktif Tahun Pelajaran aktif.");
    }

    window.initAcademicYearStatusAction = init;
    init();
})();
