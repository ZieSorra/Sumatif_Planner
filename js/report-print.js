/* =========================================================
   SUMATIF PLANNER - CETAK LAPORAN
   Dokumen administrasi: 1 halaman F4 portrait.
   ========================================================= */
(function bootReportPrint() {
    if (window.__sumatifReportPrintInstalled) return;
    window.__sumatifReportPrintInstalled = true;

    const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));

    function buildDocument() {
        const table = document.querySelector("#reportTableWrap table.report-table");
        if (!table) throw new Error("Belum ada data laporan untuk dicetak.");
        const year = document.getElementById("reportYear")?.selectedOptions?.[0]?.textContent?.trim() || "-";
        const className = document.getElementById("reportClass")?.selectedOptions?.[0]?.textContent?.trim() || "-";
        const semester = document.getElementById("reportSemester")?.selectedOptions?.[0]?.textContent?.trim() || "Ganjil";
        const rows = [...table.querySelectorAll("tbody tr")];
        const groups = {1:[],2:[],3:[]};
        rows.forEach(row => {
            const cells = [...row.children];
            if (cells.length < 6) return;
            const sumatifText = cells[1]?.textContent?.trim() || "";
            const number = Number((sumatifText.match(/(\d+)/) || ["",0])[1]);
            if (!groups[number]) return;
            groups[number].push({
                date: cells[0]?.textContent?.trim() || "-",
                subject: cells[2]?.textContent?.trim() || "-",
                material: cells[3]?.textContent?.trim() || "-",
                type: cells[5]?.textContent?.trim() || "-"
            });
        });

        const bodies = [1,2,3].map(n => {
            const items = groups[n];
            if (!items.length) return `<tbody><tr><td class="group-label">Sumatif ${n}</td><td colspan="4" class="empty">Belum ada jadwal.</td></tr></tbody>`;
            return `<tbody>${items.map((item,index) => `<tr>${index===0?`<td class="group-label" rowspan="${items.length}">Sumatif ${n}</td>`:""}<td class="date">${esc(item.date)}</td><td>${esc(item.subject)}</td><td class="material">${esc(item.material)}</td><td class="type">${esc(item.type)}</td></tr>`).join("")}</tbody>`;
        }).join("");

        const wrap = document.createElement("div");
        wrap.id = "reportPrintDocument";
        wrap.innerHTML = `<div class="report-sheet">
            <header class="report-print-header">
                <div class="school">SD ISLAM DARUL MU'MININ</div>
                <h1>LAPORAN JADWAL SUMATIF</h1>
                <div>SEMESTER ${esc(semester.toUpperCase())}</div>
                <div>TAHUN PELAJARAN ${esc(year)}</div>
                <div class="class-line">KELAS ${esc(className)}</div>
            </header>
            <table class="formal-report"><thead><tr><th>Sumatif</th><th>Tanggal</th><th>Mata Pelajaran</th><th>Materi</th><th>Jenis Tes</th></tr></thead>${bodies}</table>
            <div class="sts-sas"><div><b>STS :</b><span></span></div><div><b>SAS :</b><span></span></div></div>
            <div class="signatures"><div>Mengetahui,<br>Kepala Sekolah<br><br><br>(________________________)</div><div>Tangerang, __________________ 20____<br>Wali Kelas ${esc(className)}<br><br><br>(________________________)</div></div>
            <div class="footer">Berilmu&nbsp;&nbsp;•&nbsp;&nbsp;Berakhlak&nbsp;&nbsp;•&nbsp;&nbsp;Berprestasi</div>
        </div>`;
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
 body>*{display:none!important}
 #reportPrintDocument{display:block!important;width:215mm!important;height:330mm!important;font-family:Arial,Helvetica,sans-serif;color:#172b4d;background:#fff!important}
 .report-sheet{box-sizing:border-box;width:215mm;height:330mm;overflow:hidden;position:relative;padding:7mm 8mm 5mm;background:#fff}
 .report-print-header{text-align:center;margin-bottom:4mm;font-size:7.5pt;line-height:1.35}.report-print-header .school{font-size:9pt;font-weight:700}.report-print-header h1{font-size:17pt;font-weight:800;letter-spacing:.3px;margin:1mm 0 .7mm}.class-line{font-weight:700;margin-top:.5mm}
 .formal-report{width:100%;border-collapse:collapse;table-layout:fixed;font-size:7pt}.formal-report th,.formal-report td{border:1px solid #222;padding:1.55mm 1.6mm;vertical-align:middle;line-height:1.12}.formal-report th{text-align:center;font-weight:800;background:#eef4f8}.formal-report th:nth-child(1){width:15%}.formal-report th:nth-child(2){width:17%}.formal-report th:nth-child(3){width:23%}.formal-report th:nth-child(4){width:30%}.formal-report th:nth-child(5){width:15%}.formal-report .group-label{text-align:center;font-weight:800;vertical-align:middle}.formal-report .date{white-space:nowrap}.formal-report .material{white-space:normal;overflow-wrap:anywhere}.formal-report .type{text-align:center}.formal-report .empty{text-align:center;color:#667085;font-style:italic}
 .sts-sas{display:grid;grid-template-columns:1fr 1fr;margin-top:3mm;border:1px solid #222;font-size:7pt}.sts-sas>div{padding:2mm 3mm;display:flex;align-items:center;gap:2mm}.sts-sas>div+div{border-left:1px solid #222}.sts-sas span{flex:1;border-bottom:1px dotted #555;height:3mm}
 .signatures{position:absolute;left:8mm;right:8mm;bottom:13mm;display:grid;grid-template-columns:1fr 1fr;text-align:center;font-size:7pt;line-height:1.3}.footer{position:absolute;left:0;right:0;bottom:5mm;text-align:center;font-size:5.5pt;font-style:italic;font-weight:700}
}
`;
        document.head.appendChild(style);
    }

    function printReport() {
        installStyles();
        document.getElementById("reportPrintDocument")?.remove();
        const doc = buildDocument();
        document.body.appendChild(doc);
        setTimeout(() => window.print(), 80);
    }

    window.addEventListener("afterprint", () => document.getElementById("reportPrintDocument")?.remove());

    document.addEventListener("click", event => {
        const button = event.target.closest("#reportPrint");
        if (!button) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        try { printReport(); }
        catch (error) {
            console.error("[Report Print]", error);
            if (typeof showAppDialog === "function") showAppDialog(error.message, "warning", "Cetak Laporan");
        }
    }, true);
})();