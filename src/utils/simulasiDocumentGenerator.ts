import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

interface IsianTabelRow {
  data_per_januari_tahun: string;
  hasil_evaluasi: string;
  predikat_kinerja: string;
  gol_ruang: string;
  status_hukuman_disiplin: string;
  pendidikan: string;
  hasil_simulasi: string;
}

interface SimulasiData {
  nama_lengkap: string;
  nip: string;
  unit_organisasi: string;
  isian_tabel: IsianTabelRow[];
  grade_awal: number | null;
  batas_peringkat_tertinggi: number | null;
  rekomendasi_grade: number | null;
  nomenklatur_jabatan: string;
  lokasi: string;
  tanggal: string;
  jabatan_atasan_langsung: string;
  nama_atasan_langsung: string;
  nip_atasan_langsung: string;
  jabatan_unit_kepegawaian: string;
  nama_pejabat_kepegawaian: string;
  nip_pejabat_kepegawaian: string;
}

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getYear(dateStr: string): string {
  if (!dateStr) return "20xx";
  return new Date(dateStr).getFullYear().toString();
}

export async function generateKelengkapanDataPelaksana(data: SimulasiData) {
  const isianTabel = Array.isArray(data.isian_tabel) ? data.isian_tabel : [];
  
  // Create header row
  const headerRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Data Per Januari Tahun", bold: true, size: 20 })] })], borders: tableBorders, width: { size: 1200, type: WidthType.DXA } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Hasil Evaluasi", bold: true, size: 20 })] })], borders: tableBorders, width: { size: 1200, type: WidthType.DXA } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Predikat Kinerja", bold: true, size: 20 })] })], borders: tableBorders, width: { size: 1200, type: WidthType.DXA } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Gol. Ruang", bold: true, size: 20 })] })], borders: tableBorders, width: { size: 1000, type: WidthType.DXA } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status Hukuman Disiplin", bold: true, size: 20 })] })], borders: tableBorders, width: { size: 1200, type: WidthType.DXA } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Pendidikan", bold: true, size: 20 })] })], borders: tableBorders, width: { size: 1000, type: WidthType.DXA } }),
    ],
  });

  // Data rows
  const dataRows = isianTabel.length > 0 ? isianTabel.map(row => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.data_per_januari_tahun || "", size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.hasil_evaluasi || "", size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.predikat_kinerja || "", size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.gol_ruang || "", size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.status_hukuman_disiplin || "", size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.pendidikan || "", size: 20 })] })], borders: tableBorders }),
    ],
  })) : [new TableRow({
    children: Array(6).fill(null).map(() => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })], borders: tableBorders })),
  })];

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "KELENGKAPAN DATA PELAKSANA", bold: true, size: 28, underline: {} })],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "Nama Pelaksana\t", size: 22 }), new TextRun({ text: `: ${data.nama_lengkap}`, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: "NIP Pelaksana\t", size: 22 }), new TextRun({ text: `: ${data.nip}`, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: "Unit Organisasi\t", size: 22 }), new TextRun({ text: `: ${data.unit_organisasi}`, size: 22 })] }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...dataRows],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Kelengkapan_Data_Pelaksana_${data.nama_lengkap.replace(/\s+/g, "_")}.docx`);
}

export async function generateSimulasiSidangPenilaian(data: SimulasiData) {
  const isianTabel = Array.isArray(data.isian_tabel) ? data.isian_tabel : [];
  
  // Create header row with "Hasil Simulasi"
  const headerRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Data Per Januari Tahun", bold: true, size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Hasil Evaluasi", bold: true, size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Predikat Kinerja", bold: true, size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Gol. Ruang", bold: true, size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status Hukuman Disiplin", bold: true, size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Pendidikan", bold: true, size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Hasil Simulasi", bold: true, size: 20 })] })], borders: tableBorders }),
    ],
  });

  // Data rows
  const dataRows = isianTabel.length > 0 ? isianTabel.map(row => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.data_per_januari_tahun || "", size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.hasil_evaluasi || "", size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.predikat_kinerja || "", size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.gol_ruang || "", size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.status_hukuman_disiplin || "", size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.pendidikan || "", size: 20 })] })], borders: tableBorders }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.hasil_simulasi || "", size: 20 })] })], borders: tableBorders }),
    ],
  })) : [new TableRow({
    children: Array(7).fill(null).map(() => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })], borders: tableBorders })),
  })];

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "SIMULASI SIDANG PENILAIAN", bold: true, size: 28, underline: {} })],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "Nama Pelaksana\t", size: 22 }), new TextRun({ text: `: ${data.nama_lengkap}`, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: "NIP Pelaksana\t", size: 22 }), new TextRun({ text: `: ${data.nip}`, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: "Unit Organisasi\t", size: 22 }), new TextRun({ text: `: ${data.unit_organisasi}`, size: 22 })] }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "a) Penentuan peringkat awal", size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `    Peringkat awal adalah ... ${data.grade_awal || ""}`, size: 22 })] }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "b) Pelaksanaan simulasi Sidang Penilaian", size: 22 })] }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...dataRows],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "c) Penentuan batas peringkat tertinggi", size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: `    Batas peringkat tertinggi yang dapat diberikan adalah ... ${data.batas_peringkat_tertinggi || ""}`, size: 22 })] }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "d) Berdasarkan pertimbangan huruf b) dan memperhatikan formasi pada jabatan yang diusulkan, maka yang bersangkutan direkomendasikan peringkat ", size: 22 }), new TextRun({ text: `${data.rekomendasi_grade || "..."}`, size: 22, bold: true }), new TextRun({ text: ` dengan nomenklatur jabatan `, size: 22 }), new TextRun({ text: `${data.nomenklatur_jabatan || "..."}`, size: 22, bold: true })] }),
        new Paragraph({ text: "" }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${data.lokasi || "..."}, ${formatDate(data.tanggal)}`, size: 22 })] }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "Mengetahui,", size: 22 })] }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        // Two column signature area
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: data.jabatan_unit_kepegawaian || "Jabatan Unit Kepegawaian", size: 22 })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: data.nama_pejabat_kepegawaian || "Nama Pejabat", size: 22, bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: `NIP ${data.nip_pejabat_kepegawaian || ""}`, size: 20 })] }),
                  ],
                }),
                new TableCell({
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: data.jabatan_atasan_langsung || "Jabatan Atasan Langsung", size: 22 })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: data.nama_atasan_langsung || "Nama Atasan", size: 22, bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: `NIP ${data.nip_atasan_langsung || ""}`, size: 20 })] }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Simulasi_Sidang_Penilaian_${data.nama_lengkap.replace(/\s+/g, "_")}.docx`);
}
