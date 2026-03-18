import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel, convertInchesToTwip, PageOrientation, TabStopPosition, TabStopType } from "docx";
import { saveAs } from "file-saver";

interface AuditRow {
  no: number;
  npwp: string;
  nama_perusahaan: string;
  bentuk_kantor: string;
  alamat: string;
  fasilitas: string;
  npa: string;
  tanggal_awal_peklap: string;
  tanggal_akhir_peklap: string;
  nama_pma: string;
  pangkat_gol_pma: string;
  jabatan_pma: string;
  nama_pta: string;
  pangkat_gol_pta: string;
  jabatan_pta: string;
  nama_katim: string;
  pangkat_gol_katim: string;
  jabatan_katim: string;
  nama_a1: string;
  pangkat_gol_a1: string;
  jabatan_a1: string;
  nama_a2: string;
  pangkat_gol_a2: string;
  jabatan_a2: string;
  nama_a3: string;
  pangkat_gol_a3: string;
  jabatan_a3: string;
  no_st_induk: string;
  tanggal_st_induk: string;
  tahap_pelaksanaan_st_ke: string;
  dipa: string;
  periode_ke: string;
  [key: string]: any;
}

const simpleBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
};

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};

function makeTextRun(text: string, opts: { bold?: boolean; size?: number; underline?: boolean; font?: string; italics?: boolean } = {}): TextRun {
  return new TextRun({
    text,
    bold: opts.bold,
    size: (opts.size || 11) * 2,
    underline: opts.underline ? {} : undefined,
    font: opts.font || "Bookman Old Style",
    italics: opts.italics,
  });
}

function makeParagraph(runs: TextRun[], opts: { alignment?: typeof AlignmentType[keyof typeof AlignmentType]; spacing?: { after?: number; before?: number; line?: number }; indent?: { left?: number } } = {}): Paragraph {
  return new Paragraph({
    children: runs,
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    spacing: opts.spacing || { after: 120, line: 276 },
    indent: opts.indent,
  });
}

function makeFieldRow(label: string, value: string, labelWidth = 1800): Paragraph {
  return new Paragraph({
    children: [
      makeTextRun(label),
      makeTextRun(":  "),
      makeTextRun(value),
    ],
    spacing: { after: 40, line: 276 },
    indent: { left: 720 },
  });
}

function headerFields(fields: { label: string; value: string }[]): Paragraph[] {
  return fields.map(f => makeFieldRow(f.label, f.value));
}

function signatureParagraphs(name: string): Paragraph[] {
  return [
    new Paragraph({ spacing: { before: 600 } }),
    makeParagraph([makeTextRun("Ditandatangani secara elektronik", { size: 10, italics: true })], { alignment: AlignmentType.CENTER }),
    makeParagraph([makeTextRun(name, { bold: true, underline: true })], { alignment: AlignmentType.CENTER }),
  ];
}

// ===== 1. ND Rencana Penugasan (Ke Kepala Kanwil) =====
export function generateNDRencanaPenugasan(nomorND: string, tanggalND: string, jumlahNPA: number): void {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children: [
        makeParagraph([makeTextRun("NOTA DINAS", { bold: true, size: 12 })], { alignment: AlignmentType.CENTER }),
        makeParagraph([makeTextRun(`NOMOR ${nomorND || "[@NomorND]"}`, { bold: true, size: 12 })], { alignment: AlignmentType.CENTER }),
        new Paragraph({ spacing: { after: 200 } }),
        ...headerFields([
          { label: "Yth.", value: "Kepala Kantor Wilayah DJBC Jawa Timur I" },
          { label: "Dari", value: "Pemeriksa Bea dan Cukai Madya" },
          { label: "Hal", value: "Rencana Penugasan Tim Audit Terencana Umum NPA November 2025" },
          { label: "Lampiran", value: "1 (Satu) Berkas" },
          { label: "Tanggal", value: tanggalND || "[@TanggalND]" },
        ]),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "─".repeat(60), size: 16, font: "Bookman Old Style" })] }),
        makeParagraph([
          makeTextRun(`\tSehubungan dengan Pelaksanaan Fungsi Audit Kepabeanan dan Cukai pada Kantor Wilayah DJBC Jawa Timur I, dengan ini disampaikan hal-hal sebagai berikut:`)
        ]),
        makeParagraph([
          makeTextRun(`1. Berdasarkan Nota Dinas Direktur Audit Kepabeanan dan Cukai Nomor ND-2627 /BC.09/2025 tanggal 30 Oktober 2025 hal Penerbitan NPA atas Penyampaian Usulan Objek Audit Umum Secara Terencana IV Tahun 2025, terdapat ${jumlahNPA} (${numberToWords(jumlahNPA)}) Nomor Penugasan Audit (NPA) Terencana Umum pada Kantor Wilayah DJBC Jawa Timur I yang telah diterbitkan;`)
        ]),
        makeParagraph([
          makeTextRun(`2. Bahwa pada saat ini telah terbentuk ${jumlahNPA} (${numberToWords(jumlahNPA)}) tim audit pada Kantor Wilayah DJBC Jawa Timur I yang siap ditugaskan;`)
        ]),
        makeParagraph([
          makeTextRun(`3. Berdasarkan butir 1 s.d. 2 di atas, rencana penugasan selanjutnya adalah sejumlah ${jumlahNPA} (${numberToWords(jumlahNPA)}) tim audit dengan konsep penugasan audit sebagaimana terlampir;`)
        ]),
        makeParagraph([
          makeTextRun(`4. Penugasan Tim Audit Terencana Umum direncanakan dilaksanakan pada periode tanggal 05 November 2025 s.d. 04 Februari 2026 dan 12 November 2025 s.d. 11 Februari 2026.`)
        ]),
        makeParagraph([
          makeTextRun(`5. Pengarahan auditee untuk penugasan Tim Audit Terencana Umum pada tanggal 03 November 2025;`)
        ]),
        makeParagraph([
          makeTextRun(`\tDemikian disampaikan, dimohon dapat diterbitkan Surat Tugas Pelaksanaan Audit Kepabeanan dan Cukai. Atas perhatian dan izin Bapak kami ucapkan terima kasih.`)
        ]),
        ...signatureParagraphs("Irwan Djuhais"),
      ],
    }],
  });

  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `ND_Rencana_Penugasan_Audit.docx`);
  });
}

// ===== 2. ND Kakanwil - Dir. Audit =====
export function generateNDKakanwilDirAudit(nomorND: string, tanggalND: string, jumlahNPA: number): void {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children: [
        makeParagraph([makeTextRun("Direktur Audit Kepabeanan dan Cukai", { size: 11 })], { alignment: AlignmentType.RIGHT }),
        new Paragraph({ spacing: { after: 200 } }),
        ...headerFields([
          { label: "Yth.", value: "Direktur Audit Kepabeanan dan Cukai" },
          { label: "Dari", value: "Kepala Kantor Wilayah Direktorat Jenderal Bea dan Cukai Jawa Timur I" },
          { label: "Sifat", value: "Biasa" },
          { label: "Lampiran", value: "1 (Satu Berkas)" },
          { label: "Hal", value: "Pemberitahuan Rencana Penugasan Audit Terencana Umum" },
          { label: "Tanggal", value: tanggalND || "[@TanggalND]" },
        ]),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "─".repeat(60), size: 16, font: "Bookman Old Style" })] }),
        makeParagraph([
          makeTextRun(`\tSehubungan dengan Nota Dinas Direktur Audit Kepabeanan dan Cukai Nomor ND-2627 /BC.09/2025 tanggal 30 Oktober 2025 hal Penerbitan NPA atas Penyampaian Usulan Objek Audit Umum Secara Terencana IV Tahun 2025, yang diterima tanggal 30 Oktober 2025 dengan ini disampaikan rencana penugasan untuk ${jumlahNPA} (${numberToWords(jumlahNPA)}) Nomor Penugasan Audit (NPA) Terencana Umum sebagaimana dimaksud dalam surat tersebut sesuai dengan lampiran ini.`)
        ]),
        makeParagraph([
          makeTextRun(`\tDemikian disampaikan, atas perhatian dan kerjasamanya diucapkan terima kasih.`)
        ]),
        ...signatureParagraphs("Rusman Hadi"),
      ],
    }],
  });

  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `ND_Kakanwil_Dir_Audit.docx`);
  });
}

// ===== 3. ND Pengajuan ST Peklap Tahap I =====
export function generateNDPengajuanSTPeklap(nomorND: string, tanggalND: string, tahap: number): void {
  const tahapText = tahap === 1 ? "Satu" : "Dua";
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children: [
        makeParagraph([makeTextRun("NOTA DINAS", { bold: true, size: 12 })], { alignment: AlignmentType.CENTER }),
        makeParagraph([makeTextRun(`NOMOR ${nomorND || "[@NomorND]"}`, { bold: true, size: 12 })], { alignment: AlignmentType.CENTER }),
        new Paragraph({ spacing: { after: 200 } }),
        ...headerFields([
          { label: "Yth.", value: "Kepala Kantor Wilayah DJBC Jawa Timur I" },
          { label: "Dari", value: "Pemeriksa Bea Cukai Madya, Koordinator Pejabat Fungsional Subunsur Audit" },
          { label: "Sifat", value: "Sangat Segera" },
          { label: "Lampiran", value: "1 (Satu Berkas)" },
          { label: "Hal", value: `Permohonan Penerbitan Surat Tugas Audit Kepabeanan dan Cukai Pekerjaan Lapangan Tahap ${tahapText}` },
          { label: "Tanggal", value: tanggalND || "[@TanggalND]" },
        ]),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "─".repeat(60), size: 16, font: "Bookman Old Style" })] }),
        makeParagraph([
          makeTextRun(`\tSehubungan dengan Nota Dinas Direktur Audit Kepabeanan dan Cukai nomor ND-2627 /BC.09/2025 tanggal 30 Oktober 2025 hal Penerbitan NPA atas Penyampaian Usulan Objek Audit Umum Secara Terencana IV Tahun 2025, dengan ini kami mengajukan usulan penerbitan surat tugas dalam rangka audit kepabeanan dan/atau audit cukai serta melakukan penindakan seperlunya terhadap Perusahaan yang diaudit, dengan rincian data sesuai lampiran nota dinas ini.`)
        ]),
        makeParagraph([
          makeTextRun(`\tDemikian disampaikan, mohon dapat diterbitkan Surat Tugas Audit Kepabeanan dan Cukai.`)
        ]),
        makeParagraph([
          makeTextRun(`\tAtas perhatian Bapak  kami ucapkan terima kasih.`)
        ]),
        ...signatureParagraphs("Irwan Djuhais"),
      ],
    }],
  });

  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `ND_Pengajuan_ST_Peklap_Tahap_${tahap}.docx`);
  });
}

// ===== Lampiran Rencana Penugasan Audit (Updated format matching 02. Lampiran ND PMA ke Kakanwil-NPA) =====
export function generateLampiranRencanaPenugasan(nomorND: string, tanggalND: string, rows: AuditRow[]): void {
  const headerRow = new TableRow({
    tableHeader: true,
    children: ["NO", "NAMA OBJEK", "NPWP", "ALAMAT PERUSAHAAN", "PMA", "PTA", "Ketua", "A1", "A2", "PELAKSANAAN"].map(text =>
      new TableCell({
        children: [makeParagraph([makeTextRun(text, { bold: true, size: 8 })], { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 240 } })],
        borders: simpleBorders,
        verticalAlign: "center",
      })
    ),
  });

  const dataRows = rows.map((r) =>
    new TableRow({
      children: [
        makeSimpleCell(String(r.no), true),
        makeSimpleCell(r.nama_perusahaan?.toUpperCase() || ""),
        makeSimpleCell(r.npwp),
        makeSimpleCell(r.alamat?.toUpperCase() || ""),
        makeSimpleCell(r.nama_pma),
        makeSimpleCell(r.nama_pta),
        makeSimpleCell(r.nama_katim),
        makeSimpleCell(r.nama_a1),
        makeSimpleCell(r.nama_a2),
        makeSimpleCell(r.tanggal_awal_peklap && r.tanggal_akhir_peklap ? `${r.tanggal_awal_peklap} s.d. ${r.tanggal_akhir_peklap}` : ""),
      ],
    })
  );

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 800, right: 800 }, size: { orientation: PageOrientation.LANDSCAPE } } },
      children: [
        makeParagraph([makeTextRun("Lampiran Nota Dinas", { size: 10 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun("Pemeriksa Bea dan Cukai Madya", { bold: true, size: 10 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`Nomor\t: ${nomorND || "[@NomorND]"}`, { size: 10 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`Tanggal\t: ${tanggalND || "[@TanggalND]"}`, { size: 10 })], { alignment: AlignmentType.RIGHT, spacing: { after: 200 } }),
        new Table({
          rows: [headerRow, ...dataRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
        ...signatureParagraphs("Irwan Djuhais"),
      ],
    }],
  });

  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `Lampiran_Rencana_Penugasan_Audit.docx`);
  });
}

// ===== Lampiran ND Pengajuan ST Peklap (Tahap I & II) =====
export function generateLampiranPengajuanSTPeklap(nomorND: string, tanggalND: string, rows: AuditRow[], tahap: number): void {
  const headerRow = new TableRow({
    tableHeader: true,
    children: ["NO", "NAMA OBJEK", "NPWP", "ALAMAT PERUSAHAAN", "PMA", "PTA", "Ketua", "A1", "A2", "PELAKSANAAN"].map(text =>
      new TableCell({
        children: [makeParagraph([makeTextRun(text, { bold: true, size: 9 })], { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 240 } })],
        borders: simpleBorders,
        verticalAlign: "center",
      })
    ),
  });

  const dataRows = rows.map((r) =>
    new TableRow({
      children: [
        makeSimpleCell(String(r.no), true),
        makeSimpleCell(r.nama_perusahaan?.toUpperCase() || ""),
        makeSimpleCell(r.npwp),
        makeSimpleCell(r.alamat?.toUpperCase() || ""),
        makeSimpleCell(r.nama_pma),
        makeSimpleCell(r.nama_pta),
        makeSimpleCell(r.nama_katim),
        makeSimpleCell(r.nama_a1),
        makeSimpleCell(r.nama_a2),
        makeSimpleCell(r.tanggal_awal_peklap && r.tanggal_akhir_peklap ? `${r.tanggal_awal_peklap} s.d. ${r.tanggal_akhir_peklap}` : ""),
      ],
    })
  );

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 800, right: 800 }, size: { orientation: PageOrientation.LANDSCAPE } } },
      children: [
        makeParagraph([makeTextRun("Lampiran Nota Dinas", { size: 10 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun("Pemeriksa Bea dan Cukai Madya", { bold: true, size: 10 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`Nomor\t: ${nomorND || "[@NomorND]"}`, { size: 10 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`Tanggal\t: ${tanggalND || "[@TanggalND]"}`, { size: 10 })], { alignment: AlignmentType.RIGHT, spacing: { after: 200 } }),
        new Table({
          rows: [headerRow, ...dataRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
        ...signatureParagraphs("Irwan Djuhais"),
      ],
    }],
  });

  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `Lampiran_Pengajuan_ST_Peklap_Tahap_${tahap}.docx`);
  });
}

// ===== Lampiran Kakanwil - Dir Audit (sama seperti Rencana Penugasan) =====
export function generateLampiranKakanwilDirAudit(nomorND: string, tanggalND: string, rows: AuditRow[]): void {
  generateLampiranRencanaPenugasan(nomorND, tanggalND, rows);
}

// ===== ST Induk (Surat Tugas Induk) =====
export function generateSTInduk(nomorND: string, tanggalND: string, rows: AuditRow[]): void {
  const sections = rows.map((row) => {
    // Build team member list
    const teamMembers: { nama: string; pangkat: string; jabatan: string }[] = [];
    if (row.nama_pma) teamMembers.push({ nama: row.nama_pma, pangkat: row.pangkat_gol_pma, jabatan: row.jabatan_pma || "Pengawas Mutu Audit" });
    if (row.nama_pta) teamMembers.push({ nama: row.nama_pta, pangkat: row.pangkat_gol_pta, jabatan: row.jabatan_pta || "Pengendali Teknis Audit" });
    if (row.nama_katim) teamMembers.push({ nama: row.nama_katim, pangkat: row.pangkat_gol_katim, jabatan: row.jabatan_katim || "Ketua Auditor" });
    if (row.nama_a1) teamMembers.push({ nama: row.nama_a1, pangkat: row.pangkat_gol_a1, jabatan: row.jabatan_a1 || "Auditor" });
    if (row.nama_a2) teamMembers.push({ nama: row.nama_a2, pangkat: row.pangkat_gol_a2, jabatan: row.jabatan_a2 || "Auditor" });
    if (row.nama_a3) teamMembers.push({ nama: row.nama_a3, pangkat: row.pangkat_gol_a3, jabatan: row.jabatan_a3 || "Auditor" });

    const memberParagraphs: Paragraph[] = [];
    teamMembers.forEach((m, idx) => {
      memberParagraphs.push(
        makeParagraph([makeTextRun(`${idx + 1}.`, { size: 11 }), makeTextRun(`\tNama\t\t: ${m.nama}`, { size: 11 })], { spacing: { after: 0, line: 276 }, indent: { left: 720 } }),
        makeParagraph([makeTextRun(`\tPangkat/Golongan\t: ${m.pangkat}`, { size: 11 })], { spacing: { after: 0, line: 276 }, indent: { left: 720 } }),
        makeParagraph([makeTextRun(`\tJabatan\t\t: ${m.jabatan}`, { size: 11 })], { spacing: { after: idx < teamMembers.length - 1 ? 80 : 120, line: 276 }, indent: { left: 720 } }),
      );
    });

    const waktu = row.tanggal_awal_peklap && row.tanggal_akhir_peklap
      ? `Tanggal ${row.tanggal_awal_peklap} s.d. ${row.tanggal_akhir_peklap}`
      : "";

    return {
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children: [
        // Header
        makeParagraph([makeTextRun("KEMENTERIAN KEUANGAN REPUBLIK INDONESIA", { bold: true, size: 11 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
        makeParagraph([makeTextRun("DIREKTORAT JENDERAL BEA DAN CUKAI", { bold: true, size: 11 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
        makeParagraph([makeTextRun("KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I", { bold: true, size: 10 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
        makeParagraph([makeTextRun("JALAN RAYA BANDARA JUANDA NOMOR 39, DESA SEMAMBUNG, SIDOARJO 61254", { size: 7 })], { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 240 } }),
        makeParagraph([makeTextRun("TELEPON (031) 8675386; FAKSIMILE (031) 8675335; LAMAN www.beacukaijatim1.com", { size: 7 })], { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 240 } }),
        makeParagraph([makeTextRun("PUSAT KONTAK LAYANAN 1500225; SUREL kwbcjatim1@customs.go.id", { size: 7 })], { alignment: AlignmentType.CENTER, spacing: { after: 100, line: 240 } }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "─".repeat(70), size: 16, font: "Bookman Old Style" })] }),

        // Title
        makeParagraph([makeTextRun("SURAT TUGAS", { bold: true, size: 12 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`NOMOR ${nomorND || "[@NomorND]"}`, { bold: true, size: 12 })], { alignment: AlignmentType.CENTER, spacing: { after: 200 } }),

        // Body
        makeParagraph([
          makeTextRun(`\tBerdasarkan Pasal 86 Undang-Undang Nomor 10 Tahun 1995 tentang Kepabeanan sebagaimana telah diubah dengan Undang-Undang Nomor 17 Tahun 2006 dan/atau pasal 39 Undang-Undang Nomor 11 Tahun 1995 tentang Cukai sebagaimana telah beberapa kali diubah terakhir dengan Undang-Undang Nomor 7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan, dengan ini kami pejabat yang bertanda tangan dibawah ini memberi tugas kepada:`)
        ]),

        // Team members
        ...memberParagraphs,

        // Purpose
        makeParagraph([
          makeTextRun(`untuk melakukan audit kepabeanan dan/atau cukai serta melakukan penindakan seperlunya terhadap:`)
        ]),

        // Company details
        makeParagraph([makeTextRun(`Nama Perusahaan\t: ${row.nama_perusahaan || ""}`, { size: 11 })], { spacing: { after: 40, line: 276 }, indent: { left: 720 } }),
        makeParagraph([makeTextRun(`NPWP\t\t\t: ${row.npwp || ""}`, { size: 11 })], { spacing: { after: 40, line: 276 }, indent: { left: 720 } }),
        makeParagraph([makeTextRun(`Alamat\t\t\t: ${row.alamat || ""}`, { size: 11 })], { spacing: { after: 40, line: 276 }, indent: { left: 720 } }),
        makeParagraph([makeTextRun(`Waktu\t\t\t: ${waktu}`, { size: 11 })], { spacing: { after: 40, line: 276 }, indent: { left: 720 } }),
        makeParagraph([makeTextRun(`Jenis Audit\t\t: Audit Umum`, { size: 11 })], { spacing: { after: 120, line: 276 }, indent: { left: 720 } }),

        // Additional paragraphs
        makeParagraph([makeTextRun(`\tSemua informasi yang diperoleh dari perusahaan yang diaudit merupakan rahasia jabatan.`)]),
        makeParagraph([makeTextRun(`\tSetelah tugas selesai dilaksanakan agar menyampaikan laporan secara tertulis kepada Kepala Kantor Wilayah Direktorat Jenderal Bea dan Cukai Jawa Timur I.`)]),
        makeParagraph([makeTextRun(`\tKepada yang berwajib/berwenang/terkait diminta bantuan seperlunya.`)]),

        // Signature block
        new Paragraph({ spacing: { before: 200 } }),
        makeParagraph([makeTextRun(`Dikeluarkan di : Sidoarjo`, { size: 11 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`Pada Tanggal : ${tanggalND || "[@TanggalND]"}`, { size: 11 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`Direktur Jenderal Bea dan Cukai`, { size: 11 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`u.b.`, { size: 11 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`Kepala Kantor Wilayah`, { size: 11 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`Direktorat Jenderal Bea dan Cukai`, { size: 11 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`Jawa Timur I`, { size: 11 })], { alignment: AlignmentType.RIGHT, spacing: { after: 200 } }),

        makeParagraph([makeTextRun("Ditandatangani secara elektronik", { size: 10, italics: true })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun("Rusman Hadi", { bold: true, underline: true })], { alignment: AlignmentType.RIGHT, spacing: { after: 200 } }),

        // Tembusan
        makeParagraph([makeTextRun("Tembusan :", { size: 10, underline: true })], { spacing: { after: 0 } }),
        makeParagraph([makeTextRun("1. Direktur Jenderal Bea dan Cukai;", { size: 10 })], { spacing: { after: 0 } }),
        makeParagraph([makeTextRun("2. Direktur Audit Kepabeanan dan  Cukai;", { size: 10 })], { spacing: { after: 0 } }),
        makeParagraph([makeTextRun("3. Direktur Kepatuhan Internal;", { size: 10 })], { spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`4. Pimpinan ${row.nama_perusahaan || ""}.`, { size: 10 })], { spacing: { after: 0 } }),
      ],
    };
  });

  const doc = new Document({ sections });

  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `ST_Induk_Audit.docx`);
  });
}

// ===== ST Pekerjaan Lapangan =====
export function generateSTPekerjaanLapangan(nomorND: string, tanggalND: string, rows: AuditRow[]): void {
  const sections = rows.map((row) => {
    const teamMembers: { nama: string; pangkat: string; jabatan: string }[] = [];
    if (row.nama_pma) teamMembers.push({ nama: row.nama_pma, pangkat: row.pangkat_gol_pma, jabatan: row.jabatan_pma || "Pengawas Mutu Audit" });
    if (row.nama_pta) teamMembers.push({ nama: row.nama_pta, pangkat: row.pangkat_gol_pta, jabatan: row.jabatan_pta || "Pengendali Teknis Audit" });
    if (row.nama_katim) teamMembers.push({ nama: row.nama_katim, pangkat: row.pangkat_gol_katim, jabatan: row.jabatan_katim || "Ketua Auditor" });
    if (row.nama_a1) teamMembers.push({ nama: row.nama_a1, pangkat: row.pangkat_gol_a1, jabatan: row.jabatan_a1 || "Auditor" });
    if (row.nama_a2) teamMembers.push({ nama: row.nama_a2, pangkat: row.pangkat_gol_a2, jabatan: row.jabatan_a2 || "Auditor" });
    if (row.nama_a3) teamMembers.push({ nama: row.nama_a3, pangkat: row.pangkat_gol_a3, jabatan: row.jabatan_a3 || "Auditor" });

    const memberParagraphs: Paragraph[] = [];
    teamMembers.forEach((m, idx) => {
      memberParagraphs.push(
        makeParagraph([makeTextRun(`${idx + 1}.`, { size: 11 }), makeTextRun(`\tNama\t\t: ${m.nama}`, { size: 11 })], { spacing: { after: 0, line: 276 }, indent: { left: 720 } }),
        makeParagraph([makeTextRun(`\tPangkat/Golongan\t: ${m.pangkat}`, { size: 11 })], { spacing: { after: 0, line: 276 }, indent: { left: 720 } }),
        makeParagraph([makeTextRun(`\tJabatan\t\t: ${m.jabatan}`, { size: 11 })], { spacing: { after: idx < teamMembers.length - 1 ? 80 : 120, line: 276 }, indent: { left: 720 } }),
      );
    });

    const waktu = row.tanggal_awal_peklap && row.tanggal_akhir_peklap
      ? `Tanggal ${row.tanggal_awal_peklap} s.d. ${row.tanggal_akhir_peklap}`
      : "";

    const stRef = row.no_st_induk ? `dan ${row.no_st_induk}` : "";
    const stDate = row.tanggal_st_induk ? ` tanggal ${row.tanggal_st_induk}` : "";
    const tahapKe = row.tahap_pelaksanaan_st_ke || "kedua";

    return {
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children: [
        // Header
        makeParagraph([makeTextRun("KEMENTERIAN KEUANGAN REPUBLIK INDONESIA", { bold: true, size: 11 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
        makeParagraph([makeTextRun("DIREKTORAT JENDERAL BEA DAN CUKAI", { bold: true, size: 11 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
        makeParagraph([makeTextRun("KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I", { bold: true, size: 10 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
        makeParagraph([makeTextRun("JALAN RAYA BANDARA JUANDA NOMOR 39, DESA SEMAMBUNG, SIDOARJO 61254", { size: 7 })], { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 240 } }),
        makeParagraph([makeTextRun("TELEPON (031) 8675386; FAKSIMILE (031) 8675335; LAMAN www.beacukaijatim1.com", { size: 7 })], { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 240 } }),
        makeParagraph([makeTextRun("PUSAT KONTAK LAYANAN 1500225; SUREL kwbcjatim1@customs.go.id", { size: 7 })], { alignment: AlignmentType.CENTER, spacing: { after: 100, line: 240 } }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "─".repeat(70), size: 16, font: "Bookman Old Style" })] }),

        // Title
        makeParagraph([makeTextRun("SURAT TUGAS PEKERJAAN LAPANGAN", { bold: true, size: 12 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`NOMOR: ${nomorND || "[@NomorND]"}`, { bold: true, size: 12 })], { alignment: AlignmentType.CENTER, spacing: { after: 200 } }),

        // Body
        makeParagraph([
          makeTextRun(`\tBerdasarkan Pasal 86 Undang-Undang Nomor 10 Tahun 1995 tentang Kepabeanan sebagaimana telah diubah dengan Undang-Undang Nomor 17 Tahun 2006 dan/atau pasal 39 Undang-Undang Nomor 11 Tahun 1995 tentang Cukai sebagaimana telah beberapa kali diubah terakhir dengan Undang-Undang Nomor 7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan ${stRef}${stDate}, dengan  dengan ini kami pejabat yang bertanda tangan dibawah ini memberi tugas kepada :`)
        ]),

        // Team members
        ...memberParagraphs,

        // Purpose
        makeParagraph([
          makeTextRun(`untuk melakukan pekerjaan lapangan tahap ${tahapKe} dalam rangka audit kepabeanan dan/atau cukai tehadap:`)
        ]),

        // Company details
        makeParagraph([makeTextRun(`Nama Perusahaan\t: ${row.nama_perusahaan || ""}`, { size: 11 })], { spacing: { after: 40, line: 276 }, indent: { left: 720 } }),
        makeParagraph([makeTextRun(`NPWP\t\t\t: ${row.npwp || ""}`, { size: 11 })], { spacing: { after: 40, line: 276 }, indent: { left: 720 } }),
        makeParagraph([makeTextRun(`Alamat Kantor\t\t: ${row.alamat || ""}`, { size: 11 })], { spacing: { after: 40, line: 276 }, indent: { left: 720 } }),
        makeParagraph([makeTextRun(`Waktu\t\t\t: ${waktu}`, { size: 11 })], { spacing: { after: 120, line: 276 }, indent: { left: 720 } }),

        // Additional paragraphs
        makeParagraph([makeTextRun(`\tSemua informasi yang diperoleh dari perusahaan yang diaudit merupakan rahasia jabatan.`)]),
        makeParagraph([makeTextRun(`\tSegala biaya yang timbul sebagai akibat dilaksanakannya surat tugas ini dapat dibebankan pada DIPA Kantor Wilayah DJBC Jawa Timur I Tahun Anggaran ${new Date().getFullYear()} dan pelaksanaannya menggunakan sistem E-perjadin sehingga peserta perjalanan dinas wajib melakukan geotagging pada aplikasi satu kemenkeu sesuai dengan Keputusan Menteri Keuangan Nomor 176 Tahun 2024.`)]),
        makeParagraph([makeTextRun(`\tSetelah tugas selesai dilaksanakan agar menyampaikan laporan secara tertulis kepada Kepala Kantor Wilayah Direktorat Jenderal Bea dan Cukai Jawa Timur I.`)]),
        makeParagraph([makeTextRun(`\tKepada yang berwajib/berwenang/terkait diminta bantuan seperlunya`)]),

        // Signature block
        new Paragraph({ spacing: { before: 200 } }),
        makeParagraph([makeTextRun(`Dikeluarkan di  : Sidoarjo`, { size: 11 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`Pada Tanggal  : ${tanggalND || "[@TanggalND]"}`, { size: 11 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`Direktur Jenderal Bea dan Cukai`, { size: 11 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`u.b.`, { size: 11 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`Kepala Kantor Wilayah`, { size: 11 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`Direktorat Jenderal Bea dan Cukai`, { size: 11 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`Jawa Timur I`, { size: 11 })], { alignment: AlignmentType.RIGHT, spacing: { after: 200 } }),

        makeParagraph([makeTextRun("Ditandatangani secara elektronik", { size: 10, italics: true })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
        makeParagraph([makeTextRun("Rusman Hadi", { bold: true, underline: true })], { alignment: AlignmentType.RIGHT, spacing: { after: 200 } }),

        // Tembusan
        makeParagraph([makeTextRun("Tembusan :", { size: 10, underline: true })], { spacing: { after: 0 } }),
        makeParagraph([makeTextRun("1. Direktur Jenderal Bea dan Cukai;", { size: 10 })], { spacing: { after: 0 } }),
        makeParagraph([makeTextRun("2. Direktur Audit Kepabeanan dan Cukai;", { size: 10 })], { spacing: { after: 0 } }),
        makeParagraph([makeTextRun("3. Direktur Kepatuhan Internal;", { size: 10 })], { spacing: { after: 0 } }),
        makeParagraph([makeTextRun(`4. Pimpinan ${row.nama_perusahaan || ""}.`, { size: 10 })], { spacing: { after: 0 } }),
      ],
    };
  });

  const doc = new Document({ sections });

  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `ST_Pekerjaan_Lapangan_Audit.docx`);
  });
}

// ===== Helpers =====
function makeSimpleCell(text: string, center = false): TableCell {
  return new TableCell({
    children: [makeParagraph([makeTextRun(text || "", { size: 8 })], { alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT, spacing: { after: 0, line: 240 } })],
    borders: simpleBorders,
    verticalAlign: "center",
  });
}

function numberToWords(n: number): string {
  const words: Record<number, string> = {
    1: "satu", 2: "dua", 3: "tiga", 4: "empat", 5: "lima",
    6: "enam", 7: "tujuh", 8: "delapan", 9: "sembilan", 10: "sepuluh",
    11: "sebelas", 12: "dua belas", 13: "tiga belas", 14: "empat belas",
    15: "lima belas", 16: "enam belas", 17: "tujuh belas", 18: "delapan belas",
    19: "sembilan belas", 20: "dua puluh",
  };
  return words[n] || String(n);
}
