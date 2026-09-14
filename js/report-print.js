/* =========================================================
   SUMATIF PLANNER - CETAK LAPORAN
   Dokumen administrasi: 1 halaman F4 portrait.
   ========================================================= */
(function bootReportPrint() {
    if (window.__sumatifReportPrintInstalled) return;
    window.__sumatifReportPrintInstalled = true;

    function esc(value) {
        return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
    }

    function buildDocument() {
        const table = document.querySelector("#reportTableWrap table.report-table");
        if (!table) throw new Error("Belum ada data laporan untuk dicetak.");

        const year = document.getElementById("reportYear")?.selectedOptions?.[0]?.textContent || "-";
        const className = document.getElementById("reportClass")?.selectedOptions?.[0]?.textContent || "-";
        const semester = document.getElementById("reportSemester")?.selectedOptions?.[0]?.textContent || "Ganjil";
        const rows = Array.from(table.querySelectorAll("tbody tr"));
        const groups = {1: [], 2: [], 3: []};
        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            if (cells.length < 6) return;
            const sumatifText = cells[1].textContent.trim();
            const number = Number((sumatifText.match(/(\d+)/) || ["", "0"])[1]);
            if (!groups[number]) groups[number] = [];
            groups[number].push({
                date: cells[0].textContent.trim(),
                subject: cells[2].textContent.trim(),
                material: cells[3].textContent.trim(),
                type: cells[5].textContent.trim()
            });
        });

        const groupHtml = [1,2,3].map(n => {
            const items = groups[n];
            const body = items.length ? items.map(item => `<tr><td>${esc(item.date)}</td><td>${esc(item.subject)}</td><td class="material">${esc(item.material || "-")}</td><td>${esc(item.type)}</td></tr>`).join("") : `<tr><td colspan="4" class="empty">Belum ada jadwal.</td></tr>`;
            return `<tbody class="group-body"><tr class="group-label"><td rowspan="${Math.max(items.length,1)}">Sumatif ${n}</td>${items.length ? `<td>${esc(items[0].subject)}</td><td class="material">${esc(items[0].material || "-")}</td><td>${esc(items[0].type)}</td>` : `<td colspan="3" class="empty">Belum ada jadwal.</td>`}</tr>${items.slice(1).map(item => `<tr><td>${esc(item.subject)}</td><td class="material">${esc(item.material || "-")}</td><td>${esc(item.type)}</td></tr>`).join("")}</tbody>`;
        }).join("");

        const wrap = document.createElement("div");
        wrap.id = "reportPrintDocument";
        wrap.innerHTML = `<div class="report-sheet"><header><div class="school">SD ISLAM DARUL MU'MININ</div><h1>LAPORAN JADWAL SUMATIF</h1><div class="sub">SEMESTER ${esc(semester.toUpperCase())}</div><div class="sub">TAHUN PELAJARAN ${esc(year)}</div><div class="sub">KELAS ${esc(className)}</div></header><table class="formal-report"><thead><tr><th>Sumatif</th><th>Tanggal</th><th>Mata Pelajaran</th><th>Materi</th><th>Jenis Tes</th></tr></thead>${[1,2,3].map(n => { const items=groups[n]; return `<tbody><tr class="group-start"><td class="group-label" rowspan="${Math.max(items.length,1)}">Sumatif ${n}</td>${items.length ? `<td>${esc(items[0].date)}</td><td>${esc(items[0].subject)}</td><td class="material">${esc(items[0].material||"-")}</td><td>${esc(items[0].type)}</td>` : `<td colspan="4" class="empty">Belum ada jadwal.</td>`}</tr>${items.slice(1).map(item=>`<tr><td>${esc(item.date)}</td><td>${esc(item.subject)}</td><td class="material">${esc(item.material||"-")}</td><td>${esc(item.type)}</td></tr>`).join("")}</tbody>`; }).join("")}</table><div class="sts-sas"><div><b>STS :</b><span></span></div><div><b>SAS :</b><span></span></div></div><div class="signatures"><div>Mengetahui,<br>Kepala Sekolah<br><br>(________________________)</div><div>Tangerang, __________________ 20____<br>Wali Kelas ${esc(className)}<br><br>(________________________)</div></div><div class="footer">Berilmu&nbsp;&nbsp;•&nbsp;&nbsp;Berakhlak&nbsp;&nbsp;•&nbsp;&nbsp;Berprestasi</div></div>`;
        return wrap;
    }

    function installStyles() {
        const old = document.getElementById("reportPrintStyles");
        if (old) old.remove();
        const style = document.createElement("style");
        style.id = "reportPrintStyles";
        style.textContent = `
#reportPrintDocument{display:none}
@media print{
  @page{size:215mm 330mm;margin:0}
  html,body{margin:0!important;padding:0!important;background:#fff!important}
  body>*:not(#calendarPrintDocument):not(#reportPrintDocument){display:none!important}
  #calendarPrintDocument{display:none!important}
  #reportPrintDocument{display:block!important;width:215mm;height:330mm;font-family:Arial,Helvetica,sans-serif;color:#172b4d;background:#fff}
  .report-sheet{box-sizing:border-box;width:215mm;height:330mm;overflow:hidden;padding:6mm 7mm 4mm;background:#fff;position:relative}
  .report-sheet header{text-align:center;margin-bottom:3.5mm}.school{font-size:8pt;font-weight:700}.report-sheet h1{font-size:16pt;margin:.5mm 0 .7mm;font-weight:800;letter-spacing:.3px}.sub{font-size:7pt;line-height:1.35}.formal-report{width:100%;border-collapse:collapse;table-layout:fixed;font-size:6.2pt}.formal-report th,.formal-report td{border:1px solid #1d2939;padding:1.15mm 1.1mm;vertical-align:middle;line-height:1.1}.formal-report th{background:#eef5fa;text-align:center;font-weight:800}.formal-report th:nth-child(1){width:16mm}.formal-report th:nth-child(2){width:28mm}.formal-report th:nth-child(3){width:42mm}.formal-report th:nth-child(4){width:auto}.formal-report th:nth-child(5){width:24mm}.formal-report .group-label{font-weight:800;text-align:center;vertical-align:middle}.formal-report .material{white-space:normal;overflow-wrap:anywhere}.formal-report tbody.group-start{}.formal-report tbody tr:first-child{}.formal-report .empty{text-align:center;color:#667085;font-style:italic}.sts-sas{display:grid;grid-template-columns:1fr 1fr;gap:3mm;border:1px solid #1d2939;margin-top:3mm;padding:2mm 3mm;font-size:6.5pt}.sts-sas>div{display:flex;gap:2mm;align-items:center}.sts-sas>div+div{border-left:1px solid #98a2b3;padding-left:3mm}.sts-sas span{flex:1;border-bottom:1px dotted #667085;height:3mm}.signatures{position:absolute;left:7mm;right:7mm;bottom:12mm;display:grid;grid-template-columns:1fr 1fr;text-align:center;font-size:6.5pt;line-height:1.25}.footer{position:absolute;bottom:4mm;left:0;right:0;text-align:center;font-size:5pt;font-style:italic;font-weight:700}
}`;
        document.head.appendChild(style);
    }

    async function printReport() {
        installStyles();
        const existing = document.getElementById("reportPrintDocument");
        if (existing) existing.remove();
        const doc = buildDocument();
        document.body.appendChild(doc);
        setTimeout(() => window.print(), 100);
    }

    document.addEventListener("click", event => {
        const button = event.target.closest("#reportPrint");
        if (!button) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        printReport().catch(error => {
            console.error("[Report Print]", error);
            if (typeof showAppDialog === "function") showAppDialog(error.message, "warning", "Cetak Laporan");
        });
    }, true);
})();