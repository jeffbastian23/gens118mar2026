import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign, HeightRule, PageOrientation } from "docx";
import { saveAs } from "file-saver";

interface HasilEvaluasiData {
  id: string;
  jenis_evaluasi: string;
  satuan_kerja: string | null;
  no_urut: number | null;
  nama_nip: string;
  pangkat_gol_ruang_tmt: string | null;
  pendidikan: string | null;
  jabatan_kedudukan: string | null;
  peringkat_lama: string | null;
  pkt_y_minus_1: string | null;
  pkt_y: string | null;
  kemampuan_kerja: string | null;
  jabatan_tugas_kedudukan: string | null;
  predikat_kinerja_terakhir_peringkat_lama: string | null;
  akumulasi_masa_kerja_terakhir_peringkat_lama: string | null;
  akumulasi_masa_kerja_sd_tahun_y: string | null;
  predikat_kinerja_tahunan_y: string | null;
  lokasi: string | null;
  tanggal: string | null;
  nama_atasan_dari_atasan_langsung: string | null;
  nip_atasan_dari_atasan_langsung: string | null;
  nama_atasan_langsung: string | null;
  nip_atasan_langsung: string | null;
}

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
};

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "..................";
  const date = new Date(dateStr);
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getYear(dateStr: string | null): string {
  if (!dateStr) return "20XX";
  return new Date(dateStr).getFullYear().toString();
}

// Template A: Hasil Evaluasi Pelaksana Umum
export async function generateHasilEvaluasiPU(dataList: HasilEvaluasiData[]) {
  const currentYear = new Date().getFullYear();
  const satuanKerja = dataList[0]?.satuan_kerja || "...............";
  
  // Header row for PU
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NO.", bold: true, size: 20 })] })],
        width: { size: 500, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NAMA/NIP YANG DINILAI", bold: true, size: 20 })] })],
        width: { size: 2000, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PANGKAT/\nGOLONGAN RUANG/\nTMT GOL.", bold: true, size: 20 })] })],
        width: { size: 1500, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PENDIDIKAN", bold: true, size: 20 })] })],
        width: { size: 1200, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "JABATAN/KEDUDUKAN", bold: true, size: 20 })] })],
        width: { size: 1500, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PERINGKAT LAMA", bold: true, size: 20 })] })],
        width: { size: 1000, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `PREDIKAT KINERJA TAHUN ${currentYear - 1}`, bold: true, size: 20 })] })],
        width: { size: 1200, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        columnSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "EVALUASI PELAKSANA UMUM", bold: true, size: 20 })] })],
        width: { size: 2000, type: WidthType.DXA },
      }),
    ],
  });

  const headerRow2 = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: tableBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `PREDIKAT KINERJA TAHUN ${currentYear}`, bold: true, size: 20 })] })],
        width: { size: 1000, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "KEMAMPUAN KERJA PELAKSANA", bold: true, size: 20 })] })],
        width: { size: 1000, type: WidthType.DXA },
      }),
    ],
  });

  // Column number row
  const numberRow = new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(1)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(2)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(3)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(4)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(5)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(6)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(7)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(8)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(9)", size: 18 })] })] }),
    ],
  });

  // Data rows
  const dataRows = dataList.map((item, index) => new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${index + 1}.`, size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.nama_nip || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pangkat_gol_ruang_tmt || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pendidikan || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.jabatan_kedudukan || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.peringkat_lama || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pkt_y_minus_1 || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pkt_y || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.kemampuan_kerja || "", size: 20 })] })] }),
    ],
  }));

  // Add empty rows if needed
  if (dataRows.length < 2) {
    for (let i = dataRows.length; i < 2; i++) {
      dataRows.push(new TableRow({
        children: Array(9).fill(null).map(() => new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] })),
      }));
    }
  }

  // Add "dst..." row
  dataRows.push(new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "dst...", size: 20, italics: true })] })] }),
      ...Array(7).fill(null).map(() => new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] })),
    ],
  }));

  const firstData = dataList[0];
  const lokasi = firstData?.lokasi || "..................";
  const tanggal = formatDate(firstData?.tanggal);
  
  // Get atasan names and NIPs from first data
  const namaAtasanDariAtasanLangsung = firstData?.nama_atasan_dari_atasan_langsung || "..........................................";
  const nipAtasanDariAtasanLangsung = firstData?.nip_atasan_dari_atasan_langsung || "........";
  const namaAtasanLangsung = firstData?.nama_atasan_langsung || "..........................................";
  const nipAtasanLangsung = firstData?.nip_atasan_langsung || "........";

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: "A. CONTOH FORMAT HASIL EVALUASI BAGI PELAKSANA UMUM", bold: true, size: 24 })],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `HASIL EVALUASI PELAKSANA UMUM PADA ${satuanKerja}`, bold: true, size: 24 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `TAHUN ${currentYear}`, bold: true, size: 24 })],
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, headerRow2, numberRow, ...dataRows],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        // Signature section
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "Mengetahui:", size: 22 })] }),
                    new Paragraph({ children: [new TextRun({ text: "Atasan dari Atasan Langsung", size: 22 })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: namaAtasanDariAtasanLangsung, size: 22 })] }),
                    new Paragraph({ children: [new TextRun({ text: `NIP ${nipAtasanDariAtasanLangsung}`, size: 22 })] }),
                  ],
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${lokasi}, ${tanggal}.${getYear(firstData?.tanggal)} (10)`, size: 22 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Atasan Langsung", size: 22 })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: namaAtasanLangsung, size: 22 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `NIP ${nipAtasanLangsung}`, size: 22 })] }),
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
  saveAs(blob, `Hasil_Evaluasi_PU_${satuanKerja.replace(/\s+/g, "_")}_${currentYear}.docx`);
}

// Template B: Hasil Evaluasi Pelaksana Khusus
export async function generateHasilEvaluasiPK(dataList: HasilEvaluasiData[]) {
  const currentYear = new Date().getFullYear();
  const satuanKerja = dataList[0]?.satuan_kerja || "...............";

  // Header row for PK
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NO.", bold: true, size: 20 })] })],
        width: { size: 400, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NAMA/\nNIP YANG DINILAI", bold: true, size: 20 })] })],
        width: { size: 1500, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PANGKAT DAN GOLONGAN/\nRUANG/TMT GOL.", bold: true, size: 20 })] })],
        width: { size: 1400, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PENDIDIKAN", bold: true, size: 20 })] })],
        width: { size: 1000, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "JABATAN/ TUGAS JABATAN/\nKEDUDUKAN", bold: true, size: 20 })] })],
        width: { size: 1400, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PERINGKAT LAMA", bold: true, size: 20 })] })],
        width: { size: 900, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PREDIKAT KINERJA TERAKHIR PADA PERINGKAT LAMA", bold: true, size: 20 })] })],
        width: { size: 1100, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "AKUMULASI MASA KERJA TERAKHIR PADA PERINGKAT LAMA", bold: true, size: 20 })] })],
        width: { size: 1100, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        columnSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `EVALUASI PELAKSANA KHUSUS TAHUN ${currentYear}`, bold: true, size: 20 })] })],
        width: { size: 2000, type: WidthType.DXA },
      }),
    ],
  });

  const headerRow2 = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: tableBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `AKUMULASI MASA KERJA S.D TAHUN ${currentYear}`, bold: true, size: 20 })] })],
        width: { size: 1000, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `PREDIKAT KINERJA TAHUN ${currentYear}`, bold: true, size: 20 })] })],
        width: { size: 1000, type: WidthType.DXA },
      }),
    ],
  });

  // Column number row
  const numberRow = new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(1)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(2)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(3)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(4)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(5)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(6)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(7)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(8)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(9)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(10)", size: 18 })] })] }),
    ],
  });

  // Data rows
  const dataRows = dataList.map((item, index) => new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${index + 1}.`, size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.nama_nip || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pangkat_gol_ruang_tmt || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pendidikan || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.jabatan_tugas_kedudukan || item.jabatan_kedudukan || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.peringkat_lama || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.predikat_kinerja_terakhir_peringkat_lama || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.akumulasi_masa_kerja_terakhir_peringkat_lama || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.akumulasi_masa_kerja_sd_tahun_y || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.predikat_kinerja_tahunan_y || "", size: 20 })] })] }),
    ],
  }));

  // Add empty rows if needed
  if (dataRows.length < 2) {
    for (let i = dataRows.length; i < 2; i++) {
      dataRows.push(new TableRow({
        children: Array(10).fill(null).map(() => new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] })),
      }));
    }
  }

  // Add "dst..." row
  dataRows.push(new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "dst...", size: 20, italics: true })] })] }),
      ...Array(8).fill(null).map(() => new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] })),
    ],
  }));

  const firstData = dataList[0];
  const lokasi = firstData?.lokasi || "..................";
  const tanggal = formatDate(firstData?.tanggal);
  
  // Get atasan names and NIPs from first data
  const namaAtasanDariAtasanLangsung = firstData?.nama_atasan_dari_atasan_langsung || "..........................................";
  const nipAtasanDariAtasanLangsung = firstData?.nip_atasan_dari_atasan_langsung || "........";
  const namaAtasanLangsung = firstData?.nama_atasan_langsung || "..........................................";
  const nipAtasanLangsung = firstData?.nip_atasan_langsung || "........";

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: "B. CONTOH FORMAT HASIL EVALUASI PELAKSANA KHUSUS", bold: true, size: 24 })],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `HASIL EVALUASI PELAKSANA KHUSUS PADA ${satuanKerja}`, bold: true, size: 24 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `TAHUN ${currentYear}`, bold: true, size: 24 })],
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, headerRow2, numberRow, ...dataRows],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        // Signature section
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "Mengetahui:", size: 22 })] }),
                    new Paragraph({ children: [new TextRun({ text: "Atasan dari Atasan Langsung", size: 22 })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: namaAtasanDariAtasanLangsung, size: 22 })] }),
                    new Paragraph({ children: [new TextRun({ text: `NIP ${nipAtasanDariAtasanLangsung}`, size: 22 })] }),
                  ],
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${lokasi}, ${tanggal}.${getYear(firstData?.tanggal)} (11)`, size: 22 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Atasan Langsung", size: 22 })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: namaAtasanLangsung, size: 22 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `NIP ${nipAtasanLangsung}`, size: 22 })] }),
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
  saveAs(blob, `Hasil_Evaluasi_PK_${satuanKerja.replace(/\s+/g, "_")}_${currentYear}.docx`);
}

// Template C: Hasil Evaluasi Pelaksana Tugas Belajar
export async function generateHasilEvaluasiPTB(dataList: HasilEvaluasiData[]) {
  const currentYear = new Date().getFullYear();
  const satuanKerja = dataList[0]?.satuan_kerja || "...............";

  // Header row for PTB
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NO.", bold: true, size: 20 })] })],
        width: { size: 500, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NAMA/NIP YANG DINILAI", bold: true, size: 20 })] })],
        width: { size: 2000, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PANGKAT/\nGOLONGAN RUANG/\nTMT GOL.", bold: true, size: 20 })] })],
        width: { size: 1500, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PENDIDIKAN", bold: true, size: 20 })] })],
        width: { size: 1200, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "JABATAN/\nKEDUDUKAN", bold: true, size: 20 })] })],
        width: { size: 1500, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PERINGKAT LAMA", bold: true, size: 20 })] })],
        width: { size: 1000, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `PREDIKAT KINERJA TAHUN ${currentYear - 1}`, bold: true, size: 20 })] })],
        width: { size: 1200, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        columnSpan: 1,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `EVALUASI PELAKSANA TUGAS BELAJAR TAHUN ${currentYear}`, bold: true, size: 20 })] })],
        width: { size: 1500, type: WidthType.DXA },
      }),
    ],
  });

  const headerRow2 = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: tableBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `PREDIKAT KINERJA TAHUN ${currentYear}`, bold: true, size: 20 })] })],
        width: { size: 1500, type: WidthType.DXA },
      }),
    ],
  });

  // Column number row
  const numberRow = new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(1)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(2)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(3)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(4)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(5)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(6)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(7)", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(8)", size: 18 })] })] }),
    ],
  });

  // Data rows
  const dataRows = dataList.map((item, index) => new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${index + 1}.`, size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.nama_nip || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pangkat_gol_ruang_tmt || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pendidikan || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.jabatan_kedudukan || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.peringkat_lama || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pkt_y_minus_1 || "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.predikat_kinerja_tahunan_y || item.pkt_y || "", size: 20 })] })] }),
    ],
  }));

  // Add empty rows if needed
  if (dataRows.length < 2) {
    for (let i = dataRows.length; i < 2; i++) {
      dataRows.push(new TableRow({
        children: Array(8).fill(null).map(() => new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] })),
      }));
    }
  }

  // Add "dst..." row
  dataRows.push(new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "dst...", size: 20, italics: true })] })] }),
      ...Array(6).fill(null).map(() => new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] })),
    ],
  }));

  const firstData = dataList[0];
  const lokasi = firstData?.lokasi || "..................";
  const tanggal = formatDate(firstData?.tanggal);
  
  // Get atasan names and NIPs from first data
  const namaAtasanDariAtasanLangsung = firstData?.nama_atasan_dari_atasan_langsung || "..........................................";
  const nipAtasanDariAtasanLangsung = firstData?.nip_atasan_dari_atasan_langsung || "........";
  const namaAtasanLangsung = firstData?.nama_atasan_langsung || "..........................................";
  const nipAtasanLangsung = firstData?.nip_atasan_langsung || "........";

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: "C. CONTOH FORMAT HASIL EVALUASI BAGI PELAKSANA TUGAS BELAJAR", bold: true, size: 24 })],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `HASIL EVALUASI PELAKSANA TUGAS BELAJAR PADA ${satuanKerja}`, bold: true, size: 24 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `TAHUN ${currentYear}`, bold: true, size: 24 })],
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, headerRow2, numberRow, ...dataRows],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        // Signature section
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "Mengetahui,", size: 22 })] }),
                    new Paragraph({ children: [new TextRun({ text: "Atasan dari Atasan Langsung", size: 22 })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: namaAtasanDariAtasanLangsung, size: 22 })] }),
                    new Paragraph({ children: [new TextRun({ text: `NIP ${nipAtasanDariAtasanLangsung}`, size: 22 })] }),
                  ],
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${lokasi}, ${tanggal}.${getYear(firstData?.tanggal)} (9)`, size: 22 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Atasan Langsung", size: 22 })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: namaAtasanLangsung, size: 22 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `NIP ${nipAtasanLangsung}`, size: 22 })] }),
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
  saveAs(blob, `Hasil_Evaluasi_PTB_${satuanKerja.replace(/\s+/g, "_")}_${currentYear}.docx`);
}

// Main function to generate document based on jenis
export async function generateHasilEvaluasiDocument(item: HasilEvaluasiData) {
  switch (item.jenis_evaluasi) {
    case 'PU':
      await generateHasilEvaluasiPU([item]);
      break;
    case 'PK':
      await generateHasilEvaluasiPK([item]);
      break;
    case 'PTB':
      await generateHasilEvaluasiPTB([item]);
      break;
    case 'PT':
      await generateHasilEvaluasiPT([item]);
      break;
    default:
      throw new Error(`Jenis evaluasi tidak dikenal: ${item.jenis_evaluasi}`);
  }
}

// Template D: Hasil Evaluasi Pelaksana Tertentu (Landscape)
export async function generateHasilEvaluasiPT(dataList: HasilEvaluasiData[]) {
  const currentYear = new Date().getFullYear();
  const satuanKerja = dataList[0]?.satuan_kerja || "Kantor Wilayah Direktorat Jenderal Bea dan Cukai Jawa Timur I";
  
  // Header row for PT
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NO.", bold: true, size: 18 })] })],
        width: { size: 400, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NAMA/NIP YANG DINILAI", bold: true, size: 18 })] })],
        width: { size: 2200, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PANGKAT/ GOLONGAN\nRUANG/ TMT GOL.", bold: true, size: 18 })] })],
        width: { size: 1300, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PENDIDIKAN", bold: true, size: 18 })] })],
        width: { size: 900, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "JABATAN/KEDUDUKAN", bold: true, size: 18 })] })],
        width: { size: 1800, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PERINGKAT LAMA", bold: true, size: 18 })] })],
        width: { size: 800, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `PREDIKAT KINERJA TAHUN ${currentYear - 1}`, bold: true, size: 18 })] })],
        width: { size: 1000, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        columnSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "EVALUASI PELAKSANA TERTENTU", bold: true, size: 18 })] })],
        width: { size: 1800, type: WidthType.DXA },
      }),
    ],
  });

  const headerRow2 = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: tableBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `PREDIKAT KINERJA TAHUN ${currentYear}`, bold: true, size: 18 })] })],
        width: { size: 900, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "KEMAMPUAN KERJA PELAKSANA", bold: true, size: 18 })] })],
        width: { size: 900, type: WidthType.DXA },
      }),
    ],
  });

  // Column number row
  const numberRow = new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(1)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(2)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(3)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(4)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(5)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(6)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(7)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(8)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(9)", size: 16 })] })] }),
    ],
  });

  // Data rows
  const dataRows = dataList.map((item, index) => new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${index + 1}.`, size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.nama_nip || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pangkat_gol_ruang_tmt || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pendidikan || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.jabatan_kedudukan || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.peringkat_lama || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pkt_y_minus_1 || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pkt_y || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.kemampuan_kerja || "", size: 18 })] })] }),
    ],
  }));

  // Add "dst..." row
  dataRows.push(new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "dst...", size: 18, italics: true })] })] }),
      ...Array(7).fill(null).map(() => new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "", size: 18 })] })] })),
    ],
  }));

  const firstData = dataList[0];
  const lokasi = firstData?.lokasi || "Sidoarjo";
  const tanggal = formatDate(firstData?.tanggal);
  
  const namaAtasanDariAtasanLangsung = firstData?.nama_atasan_dari_atasan_langsung || "..........................................";
  const nipAtasanDariAtasanLangsung = firstData?.nip_atasan_dari_atasan_langsung || "........";
  const namaAtasanLangsung = firstData?.nama_atasan_langsung || "..........................................";
  const nipAtasanLangsung = firstData?.nip_atasan_langsung || "........";

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            orientation: PageOrientation.LANDSCAPE,
            width: 15840, // 11 inches
            height: 12240, // 8.5 inches
          },
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `HASIL EVALUASI PELAKSANA TERTENTU PADA ${satuanKerja}`, bold: true, size: 24 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `TAHUN ${currentYear}`, bold: true, size: 24 })],
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, headerRow2, numberRow, ...dataRows],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        // Signature section
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "Mengetahui:", size: 22 })] }),
                    new Paragraph({ children: [new TextRun({ text: "Atasan dari Atasan Langsung", size: 22, underline: {} })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: namaAtasanDariAtasanLangsung, size: 22, underline: {} })] }),
                    new Paragraph({ children: [new TextRun({ text: `NIP ${nipAtasanDariAtasanLangsung}`, size: 22 })] }),
                  ],
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${lokasi}, ${tanggal}.${getYear(firstData?.tanggal)} (10)`, size: 22 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Atasan Langsung", size: 22, underline: {} })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: namaAtasanLangsung, size: 22, underline: {} })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `NIP ${nipAtasanLangsung}`, size: 22 })] }),
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
  saveAs(blob, `Hasil_Evaluasi_PT_${satuanKerja.replace(/\s+/g, "_")}_${currentYear}.docx`);
}

// Generate Landscape Word Document for Hasil Evaluasi PU
export async function generateHasilEvaluasiPULandscape(dataList: HasilEvaluasiData[]) {
  const currentYear = new Date().getFullYear();
  const satuanKerja = dataList[0]?.satuan_kerja || "Kantor Wilayah Direktorat Jenderal Bea dan Cukai Jawa Timur I";
  
  // Header row for PU Landscape
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NO.", bold: true, size: 18 })] })],
        width: { size: 400, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NAMA/NIP YANG DINILAI", bold: true, size: 18 })] })],
        width: { size: 2200, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PANGKAT/ GOLONGAN\nRUANG/ TMT GOL.", bold: true, size: 18 })] })],
        width: { size: 1300, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PENDIDIKAN", bold: true, size: 18 })] })],
        width: { size: 900, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "JABATAN/KEDUDUKAN", bold: true, size: 18 })] })],
        width: { size: 1800, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PERINGKAT LAMA", bold: true, size: 18 })] })],
        width: { size: 800, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `PREDIKAT KINERJA TAHUN ${currentYear - 1}`, bold: true, size: 18 })] })],
        width: { size: 1000, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        columnSpan: 2,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "EVALUASI PELAKSANA UMUM", bold: true, size: 18 })] })],
        width: { size: 1800, type: WidthType.DXA },
      }),
    ],
  });

  const headerRow2 = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: tableBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `PREDIKAT KINERJA TAHUN ${currentYear}`, bold: true, size: 18 })] })],
        width: { size: 900, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "KEMAMPUAN KERJA PELAKSANA", bold: true, size: 18 })] })],
        width: { size: 900, type: WidthType.DXA },
      }),
    ],
  });

  // Column number row
  const numberRow = new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(1)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(2)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(3)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(4)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(5)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(6)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(7)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(8)", size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(9)", size: 16 })] })] }),
    ],
  });

  // Data rows
  const dataRows = dataList.map((item, index) => new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${index + 1}.`, size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.nama_nip || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pangkat_gol_ruang_tmt || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pendidikan || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.jabatan_kedudukan || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.peringkat_lama || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pkt_y_minus_1 || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pkt_y || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.kemampuan_kerja || "", size: 18 })] })] }),
    ],
  }));

  // Add "dst..." row
  dataRows.push(new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "dst...", size: 18, italics: true })] })] }),
      ...Array(7).fill(null).map(() => new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: "", size: 18 })] })] })),
    ],
  }));

  const firstData = dataList[0];
  const lokasi = firstData?.lokasi || "Sidoarjo";
  const tanggal = formatDate(firstData?.tanggal);
  
  const namaAtasanDariAtasanLangsung = firstData?.nama_atasan_dari_atasan_langsung || "..........................................";
  const nipAtasanDariAtasanLangsung = firstData?.nip_atasan_dari_atasan_langsung || "........";
  const namaAtasanLangsung = firstData?.nama_atasan_langsung || "..........................................";
  const nipAtasanLangsung = firstData?.nip_atasan_langsung || "........";

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            orientation: PageOrientation.LANDSCAPE,
            width: 15840,
            height: 12240,
          },
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `HASIL EVALUASI PELAKSANA UMUM PADA ${satuanKerja}`, bold: true, size: 24 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `TAHUN ${currentYear}`, bold: true, size: 24 })],
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, headerRow2, numberRow, ...dataRows],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        // Signature section
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "Mengetahui:", size: 22 })] }),
                    new Paragraph({ children: [new TextRun({ text: "Atasan dari Atasan Langsung", size: 22, underline: {} })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: namaAtasanDariAtasanLangsung, size: 22, underline: {} })] }),
                    new Paragraph({ children: [new TextRun({ text: `NIP ${nipAtasanDariAtasanLangsung}`, size: 22 })] }),
                  ],
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${lokasi}, ${tanggal}.${getYear(firstData?.tanggal)} (10)`, size: 22 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Atasan Langsung", size: 22, underline: {} })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: namaAtasanLangsung, size: 22, underline: {} })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `NIP ${nipAtasanLangsung}`, size: 22 })] }),
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
  saveAs(blob, `Hasil_Evaluasi_PU_Landscape_${satuanKerja.replace(/\s+/g, "_")}_${currentYear}.docx`);
}
