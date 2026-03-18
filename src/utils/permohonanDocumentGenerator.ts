import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, PageOrientation, ImageRun } from "docx";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

interface PermohonanData {
  id: string;
  nomor_kep: string;
  tanggal_kep: string;
  hal: string;
  nama_lengkap: string;
  nip: string;
  pangkat_gol_tmt: string;
  pendidikan: string;
  jabatan_lama: string;
  grade_lama: string;
  jabatan_baru: string;
  grade_baru: string;
  tmt_peringkat_terakhir: string;
  dari: string;
  ke: string;
}

interface NDPermohonanOptions {
  satuanKerja?: string; // Eselon III dari pegawai
  nomorKep?: string; // Nomor KEP (Konsideran)
  tanggalKep?: string; // Tanggal KEP (Konsideran)
  kategoriPenetapan?: string; // Gambaran Umum total PU/PK/PTB
  unitTerkecil?: string; // Eselon IV pada big data
  totalPegawai?: number; // Total pegawai dalam 1 KEP
  atasanDariAtasan?: string; // Nama atasan dari atasan
}

interface EselonisasiData {
  id: string;
  no_urut: number;
  kode_unit: string;
  nama_unit: string;
  tingkat_eselon: string;
}

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
};

function formatDateIndonesia(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Generate ND (Nota Dinas) Word Document
export async function generateNDPermohonan(
  permohonanList: PermohonanData[],
  nomorND: string,
  tanggalND: string,
  satuanKerja: string = "KPPBC TMP Tanjung Perak",
  atasanDariAtasan: string = "(Nama Atasan dari Atasan)",
  options?: NDPermohonanOptions
) {
  const formattedDate = formatDateIndonesia(tanggalND);
  const totalPegawai = options?.totalPegawai || permohonanList.length;
  
  // Resolve actual values from options, falling back to placeholders
  const namaStKerja = options?.satuanKerja || satuanKerja || "(Nama Satuan Kerja)";
  const konsideranNomor = options?.nomorKep || nomorND;
  const konsideranTanggal = options?.tanggalKep ? formatDateIndonesia(options.tanggalKep) : formattedDate;
  const kategoriPenetapan = options?.kategoriPenetapan || "(Gambaran Umum total PU/PK/PTB)";
  const unitTerkecil = options?.unitTerkecil || "(Unit Terkecil)";
  const namaAtasanDariAtasan = options?.atasanDariAtasan || atasanDariAtasan;
  
  // Get names list for "a.n" field
  const namaList = permohonanList.map(p => p.nama_lengkap.split(' ')[0]).join(', ');
  
  // Helper to create bold text
  const createBoldText = (text: string) => new TextRun({ text, size: 22, bold: true });
  // Regular text
  const createText = (text: string) => new TextRun({ text, size: 22 });
  // Field text - no underline, displayed as regular text (previously underlined)
  const createFieldText = (text: string) => new TextRun({ text, size: 22 });
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1800,
          },
        },
      },
      children: [
        // Header
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [createBoldText("KEMENTERIAN KEUANGAN REPUBLIK INDONESIA")],
          spacing: { after: 0 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "DIREKTORAT JENDERAL BEA DAN CUKAI", bold: true, size: 22 })],
          spacing: { after: 0 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I", bold: true, size: 20 })],
          spacing: { after: 0 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [createFieldText(namaStKerja)],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        
        // NOTA DINAS Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "NOTA DINAS", bold: true, size: 28 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `NOMOR ${konsideranNomor}`, bold: true, size: 24 })],
        }),
        new Paragraph({ text: "" }),
        
        // Header Info
        new Paragraph({ 
          children: [
            createFieldText("Yth."),
            createText("\t\t: "),
            createText("Kepala Kantor Wilayah Direktorat Jenderal Bea dan Cukai Jawa Timur I"),
          ]
        }),
        new Paragraph({ 
          children: [
            createFieldText("Dari"),
            createText("\t\t: "),
            createFieldText(namaStKerja),
          ]
        }),
        new Paragraph({ 
          children: [
            createFieldText("Sifat"),
            createText("\t\t: "),
            createFieldText("Biasa"),
          ]
        }),
        new Paragraph({ 
          children: [
            createText("Lampiran"),
            createText("\t: -"),
          ]
        }),
        new Paragraph({ 
          children: [
            createFieldText("Hal"),
            createText("\t\t: "),
            createFieldText(`Usulan Penetapan Jabatan dan Peringkat Pelaksana pada ${namaStKerja}`),
          ]
        }),
        new Paragraph({ 
          children: [
            createFieldText("Tanggal"),
            createText("\t: "),
            createFieldText(formattedDate),
          ]
        }),
        new Paragraph({ text: "" }),
        
        // Opening paragraph
        new Paragraph({ 
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 720 },
          children: [
            createFieldText("Sehubungan dengan"),
            createText(" "),
            createFieldText(konsideranNomor),
            createText(" "),
            createFieldText(konsideranNomor),
            createText(" "),
            createFieldText(konsideranTanggal),
            createText(" "),
            createFieldText("Perihal Konsideran Naskah Dinas"),
            createText(", dengan ini disampaikan hal-hal sebagai berikut:"),
          ],
          spacing: { after: 200 },
        }),
        
        // Numbered list item 1
        new Paragraph({ 
          alignment: AlignmentType.JUSTIFIED,
          children: [
            createText("1.  "),
            createFieldText("Sehubungan dengan"),
            createText(" "),
            createFieldText(konsideranNomor),
            createText(" "),
            createFieldText("Perihal Konsideran Naskah Dinas"),
            createText(" di Lingkungan Direktorat Jenderal Bea dan Cukai terdapat "),
            createFieldText(kategoriPenetapan),
            createText(" yang dimutasikan ke "),
            createFieldText(namaStKerja),
            createText(", atas pegawai tersebut telah dilakukan penempatan pada "),
            createFieldText(unitTerkecil),
            createText(" terhitung mulai "),
            createFieldText("Tanggal Awal Masuk"),
            createText(" sesuai dengan Surat Tugas Kepala "),
            createFieldText(namaStKerja),
            createText(" nomor "),
            createFieldText("Konsideran Penugasan Satuan Kerja"),
            createText(" tanggal "),
            createFieldText("Konsideran Penugasan Satuan Kerja"),
            createText(" hal "),
            createFieldText("Konsideran Hal"),
            createText(" a.n. "),
            createFieldText(namaList),
            createText(" bersamaan dengan Rolling pegawai."),
          ],
          spacing: { after: 200 },
        }),
        
        // Numbered list item 2
        new Paragraph({ 
          alignment: AlignmentType.JUSTIFIED,
          children: [
            createText("2.  "),
            createFieldText("Sesuai dengan"),
            createText(" "),
            createFieldText("Konsideran Naskah Dinas Satuan Kerja & Tanggal Naskah Dinas"),
            createText(" hingga "),
            createFieldText("Perihal Naskah Dinas Satuan Kerja"),
            createText(" a.n "),
            createFieldText(namaStKerja),
            createText(" terdapat "),
            createFieldText(`${totalPegawai}`),
            createText(" yang ditempatkan pada seksi / unit kerja terbaru terhitung mulai tanggal "),
            createFieldText("Tanggal Konsideran Awal"),
            createText("."),
          ],
          spacing: { after: 200 },
        }),
        
        // Numbered list item 3
        new Paragraph({ 
          alignment: AlignmentType.JUSTIFIED,
          children: [
            createText("3.  "),
            createFieldText("Bahwa"),
            createText(" sesuai "),
            createFieldText("Peraturan Menteri Keuangan nomor 54/KMK.01/2023"),
            createText(" tentang "),
            createFieldText("Tata Cara Pembentukan Jabatan Pelaksana"),
            createText(" dan "),
            createFieldText("Mekanisme Penetapan Pejabat Pelaksana ke dalam Jabatan dan Peringkat bagi Jabatan Pelaksana"),
            createText(" di Lingkungan Kementerian Keuangan, "),
            createFieldText("pegawai yang dimutasi dalam/antar unit kerja terkecil perlu ditetapkan kembali jabatan dan peringkatnya."),
          ],
          spacing: { after: 200 },
        }),
        
        // Numbered list item 4
        new Paragraph({ 
          alignment: AlignmentType.JUSTIFIED,
          children: [
            createText("4.  "),
            createFieldText("Sehubungan dengan hal tersebut di atas"),
            createText(", kami "),
            createFieldText("mengusulkan penetapan Jabatan dan Peringkat"),
            createText(" pegawai dengan data sebagaimana terlampir."),
          ],
          spacing: { after: 200 },
        }),
        
        // Closing paragraph
        new Paragraph({ 
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 720 },
          children: [
            createText("Demikian kami "),
            createFieldText("sampaikan untuk mendapat keputusan lebih lanjut"),
            createText(", "),
            createFieldText("atas perhatian Bapak diucapkan terimakasih."),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        
        // Signature section using table for side-by-side layout
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Row 1: empty left, satuan kerja right
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "" })],
                }),
                new TableCell({
                  borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createText(namaStKerja)] })],
                }),
              ],
            }),
            // Row 2-4: spacing
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
                  children: [new Paragraph({ text: "" }), new Paragraph({ text: "" })],
                }),
                new TableCell({
                  borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
                  children: [new Paragraph({ text: "" }), new Paragraph({ text: "" })],
                }),
              ],
            }),
            // Row 3: Digital signature left, empty right
            new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
                  children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [createBoldText("Ditandatangani secara elektronik")] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [createBoldText(namaAtasanDariAtasan)] }),
                  ],
                }),
                new TableCell({
                  borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
                  children: [new Paragraph({ text: "" })],
                }),
              ],
            }),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `ND_Permohonan_${nomorND.replace(/\//g, '_')}.docx`);
}

// Generate Lampiran Excel Document
export async function generateLampiranPermohonan(
  permohonanList: PermohonanData[],
  eselonisasiData: EselonisasiData[],
  nomorND: string,
  tanggalND: string
) {
  // Sort by eselonisasi order if available
  const sortedList = [...permohonanList].sort((a, b) => {
    // Try to match unit from jabatan_baru to eselonisasi
    const getUnitOrder = (jabatan: string): number => {
      for (const eselon of eselonisasiData) {
        if (jabatan.toLowerCase().includes(eselon.kode_unit.toLowerCase())) {
          return eselon.no_urut;
        }
      }
      return 999; // Default to end if not found
    };
    return getUnitOrder(a.jabatan_baru || a.jabatan_lama) - getUnitOrder(b.jabatan_baru || b.jabatan_lama);
  });

  // Group by unit (Eselon III / Kantor)
  const groupedData: { [unit: string]: PermohonanData[] } = {};
  
  sortedList.forEach(item => {
    // Extract unit from jabatan (simplified - get the kantor/unit name)
    const jabatan = item.jabatan_baru || item.jabatan_lama || "";
    let unit = "Lainnya";
    
    // Try to extract unit name pattern like "KPPBC TMP Tanjung Perak", "Bagian Umum", etc.
    if (jabatan.toLowerCase().includes("tanjung perak")) {
      unit = "KPPBC TMP TANJUNG PERAK";
    } else if (jabatan.toLowerCase().includes("bagian umum")) {
      unit = "Bagian Umum";
    } else {
      // Try to match with eselonisasi
      for (const eselon of eselonisasiData) {
        if (jabatan.toLowerCase().includes(eselon.kode_unit.toLowerCase())) {
          unit = eselon.kode_unit;
          break;
        }
      }
    }
    
    if (!groupedData[unit]) {
      groupedData[unit] = [];
    }
    groupedData[unit].push(item);
  });

  // Create Excel data with proper structure
  const excelData: any[] = [];
  let globalNo = 1;

  // Header info
  excelData.push(["", "", "", "", "", "", "", "", "Lampiran I"]);
  excelData.push(["", "", "", "", "", "", "", "", "Nota Dinas Kepala Kantor"]);
  excelData.push(["", "", "", "", "", "", "", "", "Nomor", `: ${nomorND}`]);
  excelData.push(["", "", "", "", "", "", "", "", "Tanggal", `: ${formatDateIndonesia(tanggalND)}`]);
  excelData.push([]);
  excelData.push(["PELAKSANA UMUM YANG DIMUTASIKAN ANTAR UNIT TERKECIL"]);
  excelData.push([]);
  
  // Table header
  excelData.push([
    "NO.",
    "NAMA / NIP YANG DINILAI",
    "PANGKAT / GOLONGAN\nRUANG / TMT GOL.",
    "PENDIDIKAN",
    "LAMA\nJABATAN",
    "PERINGKAT",
    "TMT PERINGKAT\nTERAKHIR",
    "BARU\nJABATAN",
    "PERINGKAT",
    "KETERANGAN"
  ]);
  excelData.push(["(1)", "(2)", "(3)", "(4)", "(5)", "(6)", "(7)", "(8)", "(9)", "(10)"]);

  // Data rows grouped by unit
  Object.entries(groupedData).forEach(([unit, items]) => {
    // Unit header row
    excelData.push([unit]);
    
    // Items in this unit
    items.forEach((item, idx) => {
      // Extract seksi/subbagian from jabatan if available
      let seksi = "";
      const jabatanLower = (item.jabatan_baru || item.jabatan_lama || "").toLowerCase();
      if (jabatanLower.includes("seksi")) {
        const seksiMatch = jabatanLower.match(/seksi\s+[\w\s]+/);
        if (seksiMatch) seksi = seksiMatch[0];
      } else if (jabatanLower.includes("subbagian")) {
        const subMatch = jabatanLower.match(/subbagian\s+[\w\s]+/);
        if (subMatch) seksi = subMatch[0];
      }
      
      // Add section header if first item or new section
      if (idx === 0 || seksi) {
        // Check if we need a section header
      }
      
      excelData.push([
        globalNo,
        `${item.nama_lengkap}\n/ ${item.nip}`,
        item.pangkat_gol_tmt || "",
        item.pendidikan || "",
        item.jabatan_lama || "",
        item.grade_lama || "",
        item.tmt_peringkat_terakhir || "",
        item.jabatan_baru || "",
        item.grade_baru || "",
        `${formatDateIndonesia(tanggalND)}\n/Sangat Baik`
      ]);
      globalNo++;
    });
  });

  // Add footer - without specific name
  excelData.push([]);
  excelData.push(["", "", "", "", "", "", "", "", "Kepala Kantor"]);
  excelData.push([]);
  excelData.push([]);
  excelData.push([]);

  // Create workbook
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 5 },   // NO
    { wch: 25 },  // NAMA/NIP
    { wch: 20 },  // PANGKAT
    { wch: 12 },  // PENDIDIKAN
    { wch: 30 },  // JABATAN LAMA
    { wch: 10 },  // PERINGKAT LAMA
    { wch: 15 },  // TMT
    { wch: 30 },  // JABATAN BARU
    { wch: 10 },  // PERINGKAT BARU
    { wch: 15 },  // KETERANGAN
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lampiran ND");
  
  XLSX.writeFile(wb, `Lampiran_ND_${nomorND.replace(/\//g, '_')}.xlsx`);
}

// Generate Lampiran Word Document (Landscape)
export async function generateLampiranPermohonanWord(
  permohonanList: PermohonanData[],
  nomorND: string,
  tanggalND: string
) {
  const formattedDate = formatDateIndonesia(tanggalND);
  
  // Header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NO.", bold: true, size: 18 })] })],
        width: { size: 400, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NAMA / NIP YANG DINILAI", bold: true, size: 18 })] })],
        width: { size: 2000, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PANGKAT / GOLONGAN\nRUANG / TMT GOL.", bold: true, size: 18 })] })],
        width: { size: 1200, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PENDIDIKAN", bold: true, size: 18 })] })],
        width: { size: 800, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        columnSpan: 2,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "LAMA", bold: true, size: 18 })] })],
        width: { size: 1600, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TMT PERINGKAT\nTERAKHIR", bold: true, size: 18 })] })],
        width: { size: 1000, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        columnSpan: 2,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BARU", bold: true, size: 18 })] })],
        width: { size: 1600, type: WidthType.DXA },
      }),
      new TableCell({
        borders: tableBorders,
        rowSpan: 2,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "KETERANGAN", bold: true, size: 18 })] })],
        width: { size: 1200, type: WidthType.DXA },
      }),
    ],
  });

  const headerRow2 = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: tableBorders,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "JABATAN", bold: true, size: 18 })] })],
      }),
      new TableCell({
        borders: tableBorders,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PERINGKAT", bold: true, size: 18 })] })],
      }),
      new TableCell({
        borders: tableBorders,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "JABATAN", bold: true, size: 18 })] })],
      }),
      new TableCell({
        borders: tableBorders,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PERINGKAT", bold: true, size: 18 })] })],
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
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(10)", size: 16 })] })] }),
    ],
  });

  // Data rows
  const dataRows = permohonanList.map((item, index) => new TableRow({
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${index + 1}`, size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: `${item.nama_lengkap}\n/${item.nip}`, size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pangkat_gol_tmt || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pendidikan || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.jabatan_lama || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.grade_lama || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.tmt_peringkat_terakhir || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.jabatan_baru || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.grade_baru || "", size: 18 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: `${formattedDate}\n/Sangat Baik`, size: 18 })] })] }),
    ],
  }));

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
        // Header info - right aligned
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Nomor\t\t: ${nomorND}`, size: 20 })] }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Tanggal\t: ${formattedDate}`, size: 20 })] }),
        new Paragraph({ text: "" }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "PELAKSANA UMUM YANG DIMUTASIKAN ANTAR UNIT TERKECIL", bold: true, size: 22 })],
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, headerRow2, numberRow, ...dataRows],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        // Signature section
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "Kepala Kantor", size: 22 })],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "..........................................", size: 22 })],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "NIP ........", size: 22 })],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Lampiran_Word_${nomorND.replace(/\//g, '_')}.docx`);
}

// Interface for Big Data enriched permohonan
interface BigDataPermohonanItem {
  nama_lengkap: string;
  nip: string;
  pangkat_gol_tmt: string;
  pendidikan: string;
  jabatan_lama: string;
  grade_lama: string;
  akumulasi_masa_kerja: string;
  tmt_peringkat_terakhir: string;
  jabatan_baru: string;
  grade_baru: string;
  tmt_peringkat_baru: string;
  pkt_2025: string;
  eselon_iii: string;
  eselon_iv: string;
}

interface EselonisasiUnit {
  id: string;
  no_urut: number;
  nama_unit: string;
  tingkat_eselon: string;
  parent_id: string | null;
}

// Generate Lampiran Word from Big Data (landscape, sorted by eselonisasi)
export async function generateLampiranPermohonanWordFromBigData(
  items: BigDataPermohonanItem[],
  eselonisasiData: EselonisasiUnit[],
  nomorND: string,
  tanggalND: string,
  title: string = "PELAKSANA UMUM YANG DIMUTASIKAN ANTAR UNIT TERKECIL"
) {
  const formattedDate = formatDateIndonesia(tanggalND);

  // Build eselon IV lookup: nama_unit -> no_urut (only eselon IV)
  const eselonIVMap = new Map<string, number>();
  const eselonIIIMap = new Map<string, { nama: string; no_urut: number }>();

  eselonisasiData.forEach(e => {
    if (e.tingkat_eselon === "Eselon IV" || e.tingkat_eselon === "eselon_iv") {
      eselonIVMap.set(e.nama_unit.toLowerCase(), e.no_urut);
    }
    if (e.tingkat_eselon === "Eselon III" || e.tingkat_eselon === "eselon_iii") {
      eselonIIIMap.set(e.id, { nama: e.nama_unit, no_urut: e.no_urut });
    }
  });

  // Group items by eselon_iv (unit terkecil)
  const grouped = new Map<string, BigDataPermohonanItem[]>();
  items.forEach(item => {
    const unit = item.eselon_iv || "Lainnya";
    if (!grouped.has(unit)) grouped.set(unit, []);
    grouped.get(unit)!.push(item);
  });

  // Sort groups by eselonisasi order
  const sortedGroups = Array.from(grouped.entries()).sort(([a], [b]) => {
    const orderA = eselonIVMap.get(a.toLowerCase()) ?? 999;
    const orderB = eselonIVMap.get(b.toLowerCase()) ?? 999;
    return orderA - orderB;
  });

  // Build header rows
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({ borders: tableBorders, rowSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NO.", bold: true, size: 16 })] })], width: { size: 400, type: WidthType.DXA } }),
      new TableCell({ borders: tableBorders, rowSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NAMA / NIP YANG DINILAI", bold: true, size: 16 })] })], width: { size: 1800, type: WidthType.DXA } }),
      new TableCell({ borders: tableBorders, rowSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PANGKAT / GOLONGAN\nRUANG / TMT GOL.", bold: true, size: 16 })] })], width: { size: 1200, type: WidthType.DXA } }),
      new TableCell({ borders: tableBorders, rowSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PENDIDIKAN", bold: true, size: 16 })] })], width: { size: 700, type: WidthType.DXA } }),
      new TableCell({ borders: tableBorders, columnSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "LAMA", bold: true, size: 16 })] })], width: { size: 1600, type: WidthType.DXA } }),
      new TableCell({ borders: tableBorders, rowSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TMT PERINGKAT\nTERAKHIR", bold: true, size: 16 })] })], width: { size: 900, type: WidthType.DXA } }),
      new TableCell({ borders: tableBorders, columnSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BARU", bold: true, size: 16 })] })], width: { size: 1600, type: WidthType.DXA } }),
      new TableCell({ borders: tableBorders, rowSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "KETERANGAN", bold: true, size: 16 })] })], width: { size: 1200, type: WidthType.DXA } }),
    ],
  });

  const headerRow2 = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "JABATAN", bold: true, size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PERINGKAT", bold: true, size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "JABATAN", bold: true, size: 16 })] })] }),
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PERINGKAT", bold: true, size: 16 })] })] }),
    ],
  });

  const numberRow = new TableRow({
    children: Array.from({ length: 10 }, (_, i) => 
      new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `(${i + 1})`, size: 14 })] })] })
    ),
  });

  // Build data rows with eselon III and eselon IV unit headers
  const dataRows: TableRow[] = [];
  let globalNo = 1;

  // Group items by eselon_iii first, then by eselon_iv within each
  const groupedByEselonIII = new Map<string, Map<string, BigDataPermohonanItem[]>>();
  items.forEach(item => {
    const eselonIII = item.eselon_iii || "Lainnya";
    const eselonIV = item.eselon_iv || "Lainnya";
    if (!groupedByEselonIII.has(eselonIII)) groupedByEselonIII.set(eselonIII, new Map());
    const eselonIVMap = groupedByEselonIII.get(eselonIII)!;
    if (!eselonIVMap.has(eselonIV)) eselonIVMap.set(eselonIV, []);
    eselonIVMap.get(eselonIV)!.push(item);
  });

  // Sort eselon III groups by eselon order
  const eselonIIISorted = Array.from(groupedByEselonIII.entries()).sort(([a], [b]) => {
    // Find eselon III order from eselonisasiData
    const findOrder = (name: string) => {
      const found = eselonisasiData.find(e => 
        (e.tingkat_eselon === "Eselon III" || e.tingkat_eselon === "eselon_iii") &&
        e.nama_unit.toLowerCase() === name.toLowerCase()
      );
      return found?.no_urut ?? 999;
    };
    return findOrder(a) - findOrder(b);
  });

  eselonIIISorted.forEach(([eselonIIIName, eselonIVGroups]) => {
    // Add Eselon III header row (e.g., "Subbagian Kepegawaian" under "Bagian Umum")
    dataRows.push(new TableRow({
      children: [
        new TableCell({
          borders: tableBorders,
          columnSpan: 10,
          children: [new Paragraph({ children: [new TextRun({ text: eselonIIIName, bold: true, underline: { type: "single" }, size: 16 })] })],
        }),
      ],
    }));

    // Sort eselon IV groups within this eselon III
    const sortedIVGroups = Array.from(eselonIVGroups.entries()).sort(([a], [b]) => {
      const orderA = eselonIVMap.get(a.toLowerCase()) ?? 999;
      const orderB = eselonIVMap.get(b.toLowerCase()) ?? 999;
      return orderA - orderB;
    });

    sortedIVGroups.forEach(([unitName, unitItems]) => {
      // Eselon IV sub-header row
      dataRows.push(new TableRow({
        children: [
          new TableCell({
            borders: tableBorders,
            columnSpan: 10,
            children: [new Paragraph({ children: [new TextRun({ text: unitName, bold: true, size: 16 })] })],
          }),
        ],
      }));

      unitItems.forEach(item => {
        const keterangan = [
          item.tmt_peringkat_baru ? formatDateIndonesia(item.tmt_peringkat_baru) : "",
          item.pkt_2025 ? `/${item.pkt_2025}` : "",
        ].filter(Boolean).join("\n");

        dataRows.push(new TableRow({
          children: [
            new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${globalNo}`, size: 16 })] })] }),
            new TableCell({ borders: tableBorders, children: [
              new Paragraph({ children: [new TextRun({ text: item.nama_lengkap, size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: `/ ${item.nip}`, size: 16 })] }),
            ] }),
            new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pangkat_gol_tmt || "", size: 16 })] })] }),
            new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.pendidikan || "", size: 16 })] })] }),
            new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.jabatan_lama || "", size: 16 })] })] }),
            new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.grade_lama || "", size: 16 })] })] }),
            new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.tmt_peringkat_terakhir ? formatDateIndonesia(item.tmt_peringkat_terakhir) : "", size: 16 })] })] }),
            new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: item.jabatan_baru || "", size: 16 })] })] }),
            new TableCell({ borders: tableBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.grade_baru || "", size: 16 })] })] }),
            new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: keterangan, size: 16 })] })] }),
          ],
        }));
        globalNo++;
      });
    });
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { orientation: PageOrientation.LANDSCAPE, width: 15840, height: 12240 },
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      children: [
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Nota Dinas Kepala Kantor", size: 18 })] }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [
          new TextRun({ text: "Nomor", size: 18 }),
          new TextRun({ text: `\t: ${nomorND}`, size: 18 }),
        ] }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [
          new TextRun({ text: "Tanggal", size: 18 }),
          new TextRun({ text: `\t: ${formattedDate}`, size: 18 }),
        ] }),
        new Paragraph({ text: "" }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: title, bold: true, size: 20 })],
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, headerRow2, numberRow, ...dataRows],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Kepala Kantor", size: 20 })] }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "..........................................", size: 20 })] }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "NIP ........", size: 20 })] }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Lampiran_Word_BigData_${nomorND.replace(/\//g, '_')}.docx`);
}
