import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, BorderStyle, convertInchesToTwip } from "docx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Big Data employee interface for detailed lampiran generation
export interface BigDataPeserta {
  nama: string;
  nip: string;
  lokasi?: string | null;
  eselon_iii?: string | null;
  eselon_iv?: string | null;
  pangkat?: string | null;
  pangkat_golongan?: string | null;
  tmt_pangkat?: string | null;
  pendidikan?: string | null;
  jabatan?: string | null;
  grade?: string | null;
  tmt_terakhir?: string | null;
  pkt_2024?: string | null;
  pkt_2025?: string | null;
  kemampuan_kerja?: string | null;
  rekomendasi?: string | null;
  jabatan_baru?: string | null;
  grade_baru?: string | null;
  akumulasi_masa_kerja?: string | null;
  akumulasi_terakhir?: string | null;
}

// Eselonisasi structure for sorting
interface EselonGroup {
  eselon_iii: string;
  seksi: {
    eselon_iv: string;
    employees: BigDataPeserta[];
  }[];
}

// Eselonisasi data interface
export interface EselonisasiData {
  id: string;
  no_urut: number | null;
  nama_unit: string;
  tingkat_eselon: string;
  kode_unit: string | null;
}

interface BeritaAcaraData {
  nomor_ba: string | null;
  tanggal: string | null;
  lokasi: string | null;
  satuan_kerja: string | null;
  nama_pimpinan: string | null;
  nip_pimpinan: string | null;
  kategori: string | null;
  peserta: { nama: string; nip: string }[];
  pesertaBigData?: BigDataPeserta[]; // Optional Big Data details for lampiran
  eselonisasiData?: EselonisasiData[]; // Optional eselonisasi data for sorting
}

// Parse date to Indonesian format
const parseDate = (dateStr: string | null) => {
  if (!dateStr) return { hari: "...", tanggal: "...", bulan: "...", tahun: "..." };
  
  try {
    const date = new Date(dateStr);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    
    return {
      hari: days[date.getDay()],
      tanggal: date.getDate().toString(),
      bulan: months[date.getMonth()],
      tahun: date.getFullYear().toString()
    };
  } catch {
    return { hari: "...", tanggal: "...", bulan: "...", tahun: "..." };
  }
};

export async function generateBeritaAcaraSidangDocument(data: BeritaAcaraData) {
  const dateInfo = parseDate(data.tanggal);
  
  // Format satuan kerja name - use uppercase for document
  const satuanKerjaUpper = data.satuan_kerja?.toUpperCase() || ".....................";
  
  // Create signature section with peserta on left and tandatangan on right
  const signatureParagraphs: Paragraph[] = [];
  
  // Create two-column signature layout
  const pesertaWithNip = data.peserta.filter(p => p.nama && p.nip);
  
  // Add signature table with peserta on left, tandatangan on right
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      // Header row
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [],
          }),
        ],
      }),
      // Signature rows for each peserta (all of them, up to 50)
      ...pesertaWithNip.map((p, idx) => 
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  spacing: { before: 100, after: 50 },
                  children: [
                    new TextRun({ text: `${idx + 1}. ${p.nama}`, size: 22 }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: `    NIP ${p.nip}`, size: 22 }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100, after: 50 },
                  children: [
                    new TextRun({ text: `${idx + 1}. Ditandatangani secara elektronik`, size: 22, italics: true }),
                  ],
                }),
              ],
            }),
          ],
        })
      ),
    ],
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.25),
          },
        },
      },
      children: [
        // Header KOP - Line 1
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [new TextRun({ text: "KEMENTERIAN KEUANGAN REPUBLIK INDONESIA", bold: true, size: 24 })],
        }),
        // Line 2
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [new TextRun({ text: "DIREKTORAT JENDERAL BEA DAN CUKAI", bold: true, size: 24 })],
        }),
        // Line 3
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [new TextRun({ text: "KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I", bold: true, size: 20 })],
        }),
        // Line 4
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [new TextRun({ text: "JALAN RAYA BANDARA JUANDA NOMOR 39, DESA SEMAMBUNG, SIDOARJO 61254", size: 18 })],
        }),
        // Line 5
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [new TextRun({ text: "TELEPON (031) 8675356; FAKSIMILE (031) 8675335; LAMAN kanwiljatim1.beacukai.go.id", size: 18 })],
        }),
        // Line 6
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "PUSAT KONTAK LAYANAN 1500225; SUREL kwbcjatim1@customs.go.id", size: 18 })],
        }),
        
        // Divider line
        new Paragraph({
          border: { bottom: { color: "000000", size: 12, style: BorderStyle.SINGLE } },
          spacing: { after: 400 },
        }),
        
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 100 },
          children: [
            new TextRun({ text: "BERITA ACARA HASIL SIDANG PENILAIAN", bold: true, size: 24 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "PELAKSANA UMUM, PELAKSANA KHUSUS, DAN PELAKSANA TUGAS BELAJAR", bold: true, size: 24 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: `NOMOR: ${data.nomor_ba || "BA-..."}`, bold: true, size: 24 }),
          ],
        }),
        
        // Opening paragraph - use satuan_kerja for (3)
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 360 },
          indent: { firstLine: 720 },
          children: [
            new TextRun({ text: `Pada hari ini, ${dateInfo.hari} tanggal ${dateInfo.tanggal} bulan ${dateInfo.bulan} tahun ${dateInfo.tahun}`, size: 22 }),
            new TextRun({ text: " (1)", superScript: true, size: 18 }),
            new TextRun({ text: `, bertempat di ${data.lokasi || ".................."}`, size: 22 }),
            new TextRun({ text: " (2)", superScript: true, size: 18 }),
            new TextRun({ text: `, telah dilaksanakan Sidang Penilaian dalam rangka penetapan jabatan dan peringkat bagi Pelaksana di ${satuanKerjaUpper}`, size: 22 }),
            new TextRun({ text: " (3)", superScript: true, size: 18 }),
            new TextRun({ text: ", dengan uraian sebagai berikut:", size: 22 }),
          ],
        }),
        
        // Item 1: Sidang Penilaian dipimpin oleh - use nama_pimpinan
        new Paragraph({
          spacing: { before: 100 },
          children: [
            new TextRun({ text: `1. Sidang Penilaian dipimpin  :  ${data.nama_pimpinan || "........................"}`, size: 22 }),
            new TextRun({ text: " (4)", superScript: true, size: 18 }),
          ],
        }),
        new Paragraph({
          indent: { left: 400 },
          children: [
            new TextRun({ text: "oleh", size: 22 }),
          ],
        }),
        
        // Item 2: Peserta Sidang Penilaian - with NIP
        new Paragraph({
          spacing: { before: 200 },
          children: [
            new TextRun({ text: "2. Peserta Sidang Penilaian   :", size: 22 }),
          ],
        }),
        
        // Peserta list with NIP (supports up to 50)
        ...data.peserta.map((p, idx) => 
          new Paragraph({
            indent: { left: 2160 },
            children: [
              new TextRun({ text: `${idx + 1}. ${p.nama || "..........................."}${p.nip ? `, ${p.nip}` : ""}`, size: 22 }),
              new TextRun({ text: " (5)", superScript: true, size: 18 }),
            ],
          })
        ),
        
        // Item 3 - use satuan_kerja
        new Paragraph({
          spacing: { before: 300 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({ text: `3. Hasil penilaian atas Pelaksana di ${satuanKerjaUpper}`, size: 22 }),
            new TextRun({ text: " (3)", superScript: true, size: 18 }),
            new TextRun({ text: ", adalah sebagaimana tercantum dalam Lampiran Berita Acara ini.", size: 22 }),
          ],
        }),
        
        // Item 4 - use satuan_kerja
        new Paragraph({
          spacing: { before: 200, after: 300 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({ text: `4. Hasil penilaian sebagaimana dimaksud pada angka 3 akan digunakan sebagai dasar penetapan Keputusan Pimpinan Tinggi Madya tentang Penetapan bagi Pelaksana dalam Jabatan dan Peringkat di ${satuanKerjaUpper}`, size: 22 }),
            new TextRun({ text: " (3)", superScript: true, size: 18 }),
            new TextRun({ text: " yang penetapannya dilakukan oleh Pimpinan Tinggi Pratama atas nama Pimpinan Tinggi Madya.", size: 22 }),
          ],
        }),
        
        // Closing
        new Paragraph({
          spacing: { before: 200, after: 400 },
          indent: { firstLine: 720 },
          children: [
            new TextRun({ text: "Demikian Berita Acara ini dibuat untuk digunakan sebagaimana mestinya.", size: 22 }),
          ],
        }),
        
        // Signatures table
        signatureTable,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Berita_Acara_Sidang_${data.nomor_ba?.replace(/\//g, "-") || "draft"}.docx`);
}

// Category A: Pelaksana Umum yang Direkomendasikan Naik/Turun/Tetap
export async function generateLampiranPUNaikTurunTetap(data: BeritaAcaraData) {
  const doc = new Document({
    sections: [{
      properties: {
        page: { size: { orientation: "landscape" } }
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: `HASIL SIDANG PENILAIAN PELAKSANA UMUM DI LINGKUNGAN ${data.satuan_kerja?.toUpperCase() || "........."}`, bold: true, size: 22 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: "A. PELAKSANA UMUM YANG DIREKOMENDASIKAN NAIK/TURUN/TETAP", bold: true, size: 22 }),
          ],
        }),
        createPUNaikTurunTetapTable(data.pesertaBigData, data.eselonisasiData),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Lampiran_PU_Naik_Turun_Tetap_${data.nomor_ba?.replace(/\//g, "-") || "draft"}.docx`);
}

// Category B: Pelaksana Umum yang Belum Direkomendasikan
export async function generateLampiranPUBelumRekomendasi(data: BeritaAcaraData) {
  const doc = new Document({
    sections: [{
      properties: {
        page: { size: { orientation: "landscape" } }
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: `HASIL SIDANG PENILAIAN PELAKSANA UMUM DI LINGKUNGAN ${data.satuan_kerja?.toUpperCase() || "........."}`, bold: true, size: 22 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: "B. PELAKSANA UMUM YANG BELUM DIREKOMENDASIKAN NAIK/TURUN/TETAP (BARU MENGUMPULKAN 1 PREDIKAT KINERJA /BELUM MEMPUNYAI PREDIKAT KINERJA)", bold: true, size: 20 }),
          ],
        }),
        createPUBelumRekomendasiTable(data.pesertaBigData, data.eselonisasiData),
        // Signature section
        createSignatureSection(data),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Lampiran_PU_Belum_Rekomendasi_${data.nomor_ba?.replace(/\//g, "-") || "draft"}.docx`);
}

// Category C: Pelaksana Khusus yang Direkomendasikan Naik/Tetap
export async function generateLampiranPKNaikTetap(data: BeritaAcaraData) {
  const dateInfo = parseDate(data.tanggal);
  
  const doc = new Document({
    sections: [{
      properties: {
        page: { size: { orientation: "landscape" } }
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "TANGGAL", underline: { type: "single" }, size: 22 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: `HASIL SIDANG PENILAIAN PELAKSANA KHUSUS DI LINGKUNGAN ${data.satuan_kerja?.toUpperCase() || "........."}`, bold: true, size: 22 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: "A. PELAKSANA KHUSUS YANG DIREKOMENDASIKAN NAIK/TETAP", bold: true, size: 22 }),
          ],
        }),
        createPKNaikTetapTable(data.pesertaBigData),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Lampiran_PK_Naik_Tetap_${data.nomor_ba?.replace(/\//g, "-") || "draft"}.docx`);
}

// Category D: Pelaksana Khusus yang Belum Direkomendasikan
export async function generateLampiranPKBelumRekomendasi(data: BeritaAcaraData) {
  const doc = new Document({
    sections: [{
      properties: {
        page: { size: { orientation: "landscape" } }
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: `HASIL SIDANG PENILAIAN PELAKSANA KHUSUS DI LINGKUNGAN ${data.satuan_kerja?.toUpperCase() || "........."}`, bold: true, size: 22 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: "B. PELAKSANA KHUSUS YANG BELUM DIREKOMENDASIKAN NAIK/TETAP", bold: true, size: 22 }),
          ],
        }),
        createPKBelumRekomendasiTable(data.pesertaBigData),
        createSignatureSection(data),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Lampiran_PK_Belum_Rekomendasi_${data.nomor_ba?.replace(/\//g, "-") || "draft"}.docx`);
}

// Category E: Pelaksana Tugas Belajar yang Direkomendasikan Naik/Turun/Tetap
export async function generateLampiranPTBNaikTurunTetap(data: BeritaAcaraData) {
  const doc = new Document({
    sections: [{
      properties: {
        page: { size: { orientation: "landscape" } }
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: `HASIL SIDANG PENILAIAN PELAKSANA TUGAS BELAJAR DI LINGKUNGAN ${data.satuan_kerja?.toUpperCase() || "........."}`, bold: true, size: 22 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: "A. PELAKSANA TUGAS BELAJAR YANG DIREKOMENDASIKAN NAIK/TURUN/TETAP", bold: true, size: 22 }),
          ],
        }),
        createPTBNaikTurunTetapTable(data.pesertaBigData),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Lampiran_PTB_Naik_Turun_Tetap_${data.nomor_ba?.replace(/\//g, "-") || "draft"}.docx`);
}

// Category F: Pelaksana Tugas Belajar yang Belum Direkomendasikan
export async function generateLampiranPTBBelumRekomendasi(data: BeritaAcaraData) {
  const doc = new Document({
    sections: [{
      properties: {
        page: { size: { orientation: "landscape" } }
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: `HASIL SIDANG PENILAIAN PELAKSANA TUGAS BELAJAR DI LINGKUNGAN ${data.satuan_kerja?.toUpperCase() || "........."}`, bold: true, size: 22 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: "B. PELAKSANA TUGAS BELAJAR YANG BELUM DIREKOMENDASIKAN NAIK/TURUN/TETAP", bold: true, size: 22 }),
          ],
        }),
        createPTBBelumRekomendasiTable(data.pesertaBigData),
        createSignatureSection(data),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Lampiran_PTB_Belum_Rekomendasi_${data.nomor_ba?.replace(/\//g, "-") || "draft"}.docx`);
}

// Helper function to create signature section
function createSignatureSection(data: BeritaAcaraData): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: 600 },
    children: [
      new TextRun({ text: "a.n.  ........................", size: 22 }),
      new TextRun({ text: " (9)", superScript: true, size: 16 }),
    ],
  });
}

// Table creation helper functions
function createTableCell(text: string, options: { bold?: boolean; width?: number; rowSpan?: number; columnSpan?: number } = {}): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: options.bold, size: 18 })],
      }),
    ],
    width: options.width ? { size: options.width, type: WidthType.DXA } : undefined,
    rowSpan: options.rowSpan,
    columnSpan: options.columnSpan,
  });
}

// Helper function to group and sort employees by lokasi (unit organisasi), then eselon hierarchy
function groupByLokasiAndEselonHierarchy(
  pesertaBigData: BigDataPeserta[], 
  eselonisasiData?: EselonisasiData[]
): { lokasi: string; eselon_iii: string; eselon_iv: string; employees: BigDataPeserta[] }[] {
  
  // Create a map of unit names to their no_urut for sorting
  const unitOrderMap = new Map<string, number>();
  if (eselonisasiData) {
    eselonisasiData.forEach(e => {
      if (e.nama_unit && e.no_urut !== null) {
        unitOrderMap.set(e.nama_unit.toLowerCase(), e.no_urut);
      }
    });
  }
  
  // Define hierarchy order for lokasi (KPPBC)
  const lokasiOrder = [
    'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Tanjung Perak',
    'KPPBC TMP Tanjung Perak',
    'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Juanda',
    'KPPBC TMP Juanda',
    'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean B Gresik',
    'KPPBC TMP B Gresik',
    'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean C Bojonegoro',
    'KPPBC TMP C Bojonegoro',
    'KPPBC TMP A Pasuruan',
    'KPPBC TMP B Sidoarjo',
    'BLBC Kelas I Surabaya',
  ];
  
  // Define eselon III order (for internal unit sorting)
  const eselonIIIOrder = [
    'Bagian Umum',
    'Subbagian Umum',
    'Subbagian Umum dan Kepatuhan Internal',
    'Bidang Kepabeanan dan Cukai', 
    'Bidang Fasilitas Kepabeanan dan Cukai',
    'Bidang Penindakan dan Penyidikan',
    'Bidang Kepatuhan Internal'
  ];
  
  // Define eselon IV order within each eselon III
  const eselonIVOrder: Record<string, string[]> = {
    'Bagian Umum': [
      'Subbagian Kepegawaian',
      'Subbagian Rumah Tangga', 
      'Subbagian Tata Usaha dan Keuangan'
    ],
    'Subbagian Umum': [
      'Subbagian Umum'
    ],
    'Subbagian Umum dan Kepatuhan Internal': [
      'Subbagian Umum dan Kepatuhan Internal'
    ],
    'Bidang Kepabeanan dan Cukai': [
      'Seksi Pemeriksaan',
      'Seksi Keberatan dan Banding',
      'Seksi Penerimaan dan Pengelolaan Data',
      'Seksi Bantuan Hukum'
    ],
    'Bidang Fasilitas Kepabeanan dan Cukai': [
      'Seksi Perijinan dan Fasilitas I',
      'Seksi Perijinan dan Fasilitas II',
      'Seksi Perijinan dan Fasilitas III',
      'Seksi Bimbingan Kepatuhan dan Hubungan Masyarakat'
    ],
    'Bidang Penindakan dan Penyidikan': [
      'Seksi Intelijen',
      'Seksi Penindakan I',
      'Seksi Penindakan II',
      'Seksi Narkotika dan Barang Larangan',
      'Seksi Penyidikan dan Barang Hasil Penindakan',
      'Seksi Penindakan dan Penyidikan'
    ],
    'Bidang Kepatuhan Internal': [
      'Seksi Kepatuhan Pelaksanaan Tugas Pelayanan',
      'Seksi Kepatuhan Pelaksanaan Tugas Pengawasan',
      'Seksi Kepatuhan Pelaksanaan Tugas Administrasi',
      'Seksi Kepatuhan Internal',
      'Seksi Kepatuhan Internal dan Penyuluhan'
    ]
  };

  // First, group by lokasi, then by eselon_iii, then by eselon_iv
  const lokasiGroupMap = new Map<string, Map<string, Map<string, BigDataPeserta[]>>>();
  
  pesertaBigData.forEach(p => {
    const lokasi = p.lokasi || 'Lainnya';
    const eselonIII = p.eselon_iii || 'Lainnya';
    const eselonIV = p.eselon_iv || 'Lainnya';
    
    if (!lokasiGroupMap.has(lokasi)) {
      lokasiGroupMap.set(lokasi, new Map());
    }
    const eselonIIIMap = lokasiGroupMap.get(lokasi)!;
    
    if (!eselonIIIMap.has(eselonIII)) {
      eselonIIIMap.set(eselonIII, new Map());
    }
    const eselonIVMap = eselonIIIMap.get(eselonIII)!;
    
    if (!eselonIVMap.has(eselonIV)) {
      eselonIVMap.set(eselonIV, []);
    }
    eselonIVMap.get(eselonIV)!.push(p);
  });

  // Convert to array and sort
  const result: { lokasi: string; eselon_iii: string; eselon_iv: string; employees: BigDataPeserta[] }[] = [];
  
  // Helper function to get lokasi order
  const getLokasiOrder = (lokasi: string): number => {
    // First check unitOrderMap from eselonisasi data
    const orderFromData = unitOrderMap.get(lokasi.toLowerCase());
    if (orderFromData !== undefined) return orderFromData;
    
    // Then check predefined lokasiOrder
    const idx = lokasiOrder.findIndex(l => 
      lokasi.toLowerCase().includes(l.toLowerCase()) || 
      l.toLowerCase().includes(lokasi.toLowerCase())
    );
    return idx !== -1 ? idx : 999;
  };
  
  // Sort by lokasi order
  const sortedLokasi = Array.from(lokasiGroupMap.keys()).sort((a, b) => {
    return getLokasiOrder(a) - getLokasiOrder(b);
  });

  for (const lokasi of sortedLokasi) {
    const eselonIIIMap = lokasiGroupMap.get(lokasi)!;
    
    // Sort by eselon III order
    const sortedEselonIII = Array.from(eselonIIIMap.keys()).sort((a, b) => {
      const idxA = eselonIIIOrder.findIndex(e => a.toLowerCase().includes(e.toLowerCase()) || e.toLowerCase().includes(a.toLowerCase()));
      const idxB = eselonIIIOrder.findIndex(e => b.toLowerCase().includes(e.toLowerCase()) || e.toLowerCase().includes(b.toLowerCase()));
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    for (const eselonIII of sortedEselonIII) {
      const eselonIVMap = eselonIIIMap.get(eselonIII)!;
      
      // Find the matching eselon IV order list
      let eselonIVOrderList: string[] = [];
      for (const [key, value] of Object.entries(eselonIVOrder)) {
        if (eselonIII.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(eselonIII.toLowerCase())) {
          eselonIVOrderList = value;
          break;
        }
      }
      
      // Sort by eselon IV order
      const sortedEselonIV = Array.from(eselonIVMap.keys()).sort((a, b) => {
        const idxA = eselonIVOrderList.findIndex(e => a.toLowerCase().includes(e.toLowerCase()) || e.toLowerCase().includes(a.toLowerCase()));
        const idxB = eselonIVOrderList.findIndex(e => b.toLowerCase().includes(e.toLowerCase()) || e.toLowerCase().includes(b.toLowerCase()));
        if (idxA === -1 && idxB === -1) return a.localeCompare(b);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });

      for (const eselonIV of sortedEselonIV) {
        const employees = eselonIVMap.get(eselonIV)!;
        // Sort employees by name
        employees.sort((a, b) => a.nama.localeCompare(b.nama));
        result.push({ lokasi, eselon_iii: eselonIII, eselon_iv: eselonIV, employees });
      }
    }
  }

  return result;
}

// Create table rows with lokasi and eselon hierarchy headers
function createDataRowsWithEselonHeaders(
  pesertaBigData: BigDataPeserta[], 
  columnCount: number, 
  createRowFn: (p: BigDataPeserta, idx: number) => TableRow,
  eselonisasiData?: EselonisasiData[]
): TableRow[] {
  if (!pesertaBigData || pesertaBigData.length === 0) {
    return [new TableRow({ children: Array(columnCount).fill(null).map(() => createTableCell("")) })];
  }

  const grouped = groupByLokasiAndEselonHierarchy(pesertaBigData, eselonisasiData);
  const rows: TableRow[] = [];
  let globalIdx = 0;

  let lastLokasi = '';
  let lastEselonIII = '';
  let lastEselonIV = '';

  for (const group of grouped) {
    // Add lokasi (unit organisasi) header row if changed
    if (group.lokasi !== lastLokasi && group.lokasi !== 'Lainnya') {
      rows.push(new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: group.lokasi, bold: true, size: 22 })],
              }),
            ],
            columnSpan: columnCount,
            shading: { fill: "C0C0C0" },
          }),
        ],
      }));
      lastLokasi = group.lokasi;
      lastEselonIII = ''; // Reset eselon III when lokasi changes
      lastEselonIV = ''; // Reset eselon IV when lokasi changes
    }

    // Add eselon III header row if changed
    if (group.eselon_iii !== lastEselonIII && group.eselon_iii !== 'Lainnya') {
      rows.push(new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: group.eselon_iii, bold: true, italics: true, size: 20 })],
              }),
            ],
            columnSpan: columnCount,
            shading: { fill: "E0E0E0" },
          }),
        ],
      }));
      lastEselonIII = group.eselon_iii;
      lastEselonIV = ''; // Reset eselon IV when eselon III changes
    }

    // Add eselon IV header row if changed (only if different from eselon III)
    if (group.eselon_iv !== lastEselonIV && group.eselon_iv !== 'Lainnya' && group.eselon_iv !== group.eselon_iii) {
      rows.push(new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: group.eselon_iv, bold: false, italics: true, size: 18 })],
              }),
            ],
            columnSpan: columnCount,
            shading: { fill: "F5F5F5" },
          }),
        ],
      }));
      lastEselonIV = group.eselon_iv;
    }

    // Add employee rows
    for (const emp of group.employees) {
      globalIdx++;
      rows.push(createRowFn(emp, globalIdx));
    }
  }

  return rows;
}

// PU Naik/Turun/Tetap Table with data
function createPUNaikTurunTetapTable(pesertaBigData?: BigDataPeserta[], eselonisasiData?: EselonisasiData[]): Table {
  const headerRows = [
    new TableRow({
      children: [
        createTableCell("NO.", { bold: true, rowSpan: 2 }),
        createTableCell("NAMA/NIP", { bold: true, rowSpan: 2 }),
        createTableCell("PANGKAT/ GOLONGAN RUANG/ TMT GOL.", { bold: true, rowSpan: 2 }),
        createTableCell("PENDIDIKAN", { bold: true, rowSpan: 2 }),
        createTableCell("LAMA", { bold: true, columnSpan: 2 }),
        createTableCell("TMT PERINGKAT TERAKHIR", { bold: true, rowSpan: 2 }),
        createTableCell("HASIL EVALUASI", { bold: true, columnSpan: 3 }),
        createTableCell("REKOMENDASI", { bold: true, rowSpan: 2 }),
        createTableCell("BARU", { bold: true, columnSpan: 2 }),
        createTableCell("KET", { bold: true, rowSpan: 2 }),
      ],
    }),
    new TableRow({
      children: [
        createTableCell("JABATAN", { bold: true }),
        createTableCell("PERINGKAT", { bold: true }),
        createTableCell("PREDIKAT KINERJA PERIODE I", { bold: true }),
        createTableCell("PREDIKAT KINERJA PERIODE II", { bold: true }),
        createTableCell("KEMAMPUAN KERJA PELAKSANA UMUM", { bold: true }),
        createTableCell("JABATAN", { bold: true }),
        createTableCell("PERINGKAT", { bold: true }),
      ],
    }),
    new TableRow({
      children: [
        createTableCell("(1)"),
        createTableCell("(2)"),
        createTableCell("(3)"),
        createTableCell("(4)"),
        createTableCell("(5)"),
        createTableCell("(6)"),
        createTableCell("(7)"),
        createTableCell("(8)"),
        createTableCell("(9)"),
        createTableCell("(10)"),
        createTableCell("(11)"),
        createTableCell("(12)"),
        createTableCell("(13)"),
        createTableCell("(14)"),
      ],
    }),
  ];

  // Create data rows with lokasi and eselon hierarchy headers
  const dataRows = createDataRowsWithEselonHeaders(pesertaBigData || [], 14, (p, idx) => new TableRow({
    children: [
      createTableCell(idx.toString()),
      createTableCell(`${p.nama}\n${p.nip}`),
      createTableCell([p.pangkat, p.pangkat_golongan, p.tmt_pangkat].filter(Boolean).join(' / ')),
      createTableCell(p.pendidikan || ''),
      createTableCell(p.jabatan || ''),
      createTableCell(p.grade || ''),
      createTableCell(p.tmt_terakhir || ''),
      createTableCell(p.pkt_2024 || ''),
      createTableCell(p.pkt_2025 || ''),
      createTableCell(p.kemampuan_kerja || ''),
      createTableCell(p.rekomendasi || ''),
      createTableCell(p.jabatan_baru || ''),
      createTableCell(p.grade_baru || ''),
      createTableCell(''),
    ],
  }), eselonisasiData);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [...headerRows, ...dataRows],
  });
}

// PU Belum Rekomendasi Table with data
function createPUBelumRekomendasiTable(pesertaBigData?: BigDataPeserta[], eselonisasiData?: EselonisasiData[]): Table {
  const headerRows = [
    new TableRow({
      children: [
        createTableCell("NO.", { bold: true, rowSpan: 2 }),
        createTableCell("NAMA / NIP", { bold: true, rowSpan: 2 }),
        createTableCell("PANGKAT/ GOL. RUANG/ TMT GOL", { bold: true, rowSpan: 2 }),
        createTableCell("PENDIDIKAN", { bold: true, rowSpan: 2 }),
        createTableCell("JABATAN", { bold: true, rowSpan: 2 }),
        createTableCell("PERINGKAT", { bold: true, rowSpan: 2 }),
        createTableCell("TMT PERINGKAT TERAKHIR", { bold: true, rowSpan: 2 }),
        createTableCell("KETERANGAN", { bold: true }),
      ],
    }),
    new TableRow({
      children: [
        createTableCell("PREDIKAT KINERJA PERIODE I", { bold: true }),
      ],
    }),
    new TableRow({
      children: [
        createTableCell("(1)"),
        createTableCell("(2)"),
        createTableCell("(3)"),
        createTableCell("(4)"),
        createTableCell("(5)"),
        createTableCell("(6)"),
        createTableCell("(7)"),
        createTableCell("(8)"),
      ],
    }),
  ];

  // Create data rows with eselon hierarchy headers
  const dataRows = createDataRowsWithEselonHeaders(pesertaBigData || [], 8, (p, idx) => new TableRow({
    children: [
      createTableCell(idx.toString()),
      createTableCell(`${p.nama}\n${p.nip}`),
      createTableCell([p.pangkat, p.pangkat_golongan, p.tmt_pangkat].filter(Boolean).join(' / ')),
      createTableCell(p.pendidikan || ''),
      createTableCell(p.jabatan || ''),
      createTableCell(p.grade || ''),
      createTableCell(p.tmt_terakhir || ''),
      createTableCell(p.pkt_2024 || ''),
    ],
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [...headerRows, ...dataRows],
  });
}

// PK Naik/Tetap Table with data
function createPKNaikTetapTable(pesertaBigData?: BigDataPeserta[]): Table {
  const headerRows = [
    new TableRow({
      children: [
        createTableCell("NO.", { bold: true, rowSpan: 2 }),
        createTableCell("NAMA/NIP YANG DINILAI", { bold: true, rowSpan: 2 }),
        createTableCell("PANGKAT DAN GOLONGAN/ RUANG/TMT GOL.", { bold: true, rowSpan: 2 }),
        createTableCell("PENDIDIKAN", { bold: true, rowSpan: 2 }),
        createTableCell("LAMA", { bold: true, columnSpan: 3 }),
        createTableCell("TMT PERINGKAT TERAKHIR", { bold: true, rowSpan: 2 }),
        createTableCell("HASIL EVALUASI", { bold: true, columnSpan: 2 }),
        createTableCell("REKOMENDASI", { bold: true, rowSpan: 2 }),
        createTableCell("BARU", { bold: true, columnSpan: 2 }),
        createTableCell("KET", { bold: true, rowSpan: 2 }),
      ],
    }),
    new TableRow({
      children: [
        createTableCell("JABATAN/ TUGAS JABATAN", { bold: true }),
        createTableCell("PERINGKAT", { bold: true }),
        createTableCell("AKUMULASI MASA KERJA", { bold: true }),
        createTableCell("PREDIKAT KINERJA", { bold: true }),
        createTableCell("AKUMULASI MASA KERJA AKHIR", { bold: true }),
        createTableCell("JABATAN/ TUGAS JABATAN", { bold: true }),
        createTableCell("PERINGKAT", { bold: true }),
      ],
    }),
    new TableRow({
      children: Array(14).fill(null).map((_, i) => createTableCell(`(${i + 1})`)),
    }),
  ];

  // Create data rows with eselon hierarchy headers
  const dataRows = createDataRowsWithEselonHeaders(pesertaBigData || [], 14, (p, idx) => new TableRow({
    children: [
      createTableCell(idx.toString()),
      createTableCell(`${p.nama}\n${p.nip}`),
      createTableCell([p.pangkat, p.pangkat_golongan, p.tmt_pangkat].filter(Boolean).join(' / ')),
      createTableCell(p.pendidikan || ''),
      createTableCell(p.jabatan || ''),
      createTableCell(p.grade || ''),
      createTableCell(p.akumulasi_masa_kerja || ''),
      createTableCell(p.tmt_terakhir || ''),
      createTableCell(p.pkt_2024 || ''),
      createTableCell(p.akumulasi_terakhir || ''),
      createTableCell(p.rekomendasi || ''),
      createTableCell(p.jabatan_baru || ''),
      createTableCell(p.grade_baru || ''),
      createTableCell(''),
    ],
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [...headerRows, ...dataRows],
  });
}

// PK Belum Rekomendasi Table with data
function createPKBelumRekomendasiTable(pesertaBigData?: BigDataPeserta[]): Table {
  const headerRows = [
    new TableRow({
      children: [
        createTableCell("NO.", { bold: true, rowSpan: 2 }),
        createTableCell("NAMA/NIP", { bold: true, rowSpan: 2 }),
        createTableCell("PANGKAT/GOL /TMT GOL", { bold: true, rowSpan: 2 }),
        createTableCell("PENDIDIKAN", { bold: true, rowSpan: 2 }),
        createTableCell("JABATAN/ TUGAS JABATAN", { bold: true, rowSpan: 2 }),
        createTableCell("PERINGKAT", { bold: true, rowSpan: 2 }),
        createTableCell("AKUMULASI MASA KERJA", { bold: true, rowSpan: 2 }),
        createTableCell("TMT PERINGKAT TERAKHIR", { bold: true, rowSpan: 2 }),
        createTableCell("KETERANGAN", { bold: true, columnSpan: 2 }),
      ],
    }),
    new TableRow({
      children: [
        createTableCell("PREDIKAT KINERJA", { bold: true }),
        createTableCell("AKUMULASI MASA KERJA TERAKHIR", { bold: true }),
      ],
    }),
    new TableRow({
      children: Array(10).fill(null).map((_, i) => createTableCell(`(${i + 1})`)),
    }),
  ];

  // Create data rows with eselon hierarchy headers
  const dataRows = createDataRowsWithEselonHeaders(pesertaBigData || [], 10, (p, idx) => new TableRow({
    children: [
      createTableCell(idx.toString()),
      createTableCell(`${p.nama}\n${p.nip}`),
      createTableCell([p.pangkat, p.pangkat_golongan, p.tmt_pangkat].filter(Boolean).join(' / ')),
      createTableCell(p.pendidikan || ''),
      createTableCell(p.jabatan || ''),
      createTableCell(p.grade || ''),
      createTableCell(p.akumulasi_masa_kerja || ''),
      createTableCell(p.tmt_terakhir || ''),
      createTableCell(p.pkt_2024 || ''),
      createTableCell(p.akumulasi_terakhir || ''),
    ],
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [...headerRows, ...dataRows],
  });
}

// PTB Naik/Turun/Tetap Table with data
function createPTBNaikTurunTetapTable(pesertaBigData?: BigDataPeserta[]): Table {
  const headerRows = [
    new TableRow({
      children: [
        createTableCell("NO.", { bold: true, rowSpan: 2 }),
        createTableCell("NAMA/NIP", { bold: true, rowSpan: 2 }),
        createTableCell("PANGKAT/ GOLONGAN RUANG/ TMT GOL.", { bold: true, rowSpan: 2 }),
        createTableCell("PENDIDIKAN", { bold: true, rowSpan: 2 }),
        createTableCell("LAMA", { bold: true, columnSpan: 2 }),
        createTableCell("TMT PERINGKAT TERAKHIR", { bold: true, rowSpan: 2 }),
        createTableCell("HASIL EVALUASI", { bold: true, columnSpan: 2 }),
        createTableCell("REKOMENDASI", { bold: true, rowSpan: 2 }),
        createTableCell("BARU", { bold: true, columnSpan: 2 }),
        createTableCell("KET", { bold: true, rowSpan: 2 }),
      ],
    }),
    new TableRow({
      children: [
        createTableCell("JABATAN", { bold: true }),
        createTableCell("PERINGKAT", { bold: true }),
        createTableCell("PREDIKAT KINERJA PERIODE I", { bold: true }),
        createTableCell("PREDIKAT KINERJA PERIODE II", { bold: true }),
        createTableCell("JABATAN", { bold: true }),
        createTableCell("PERINGKAT", { bold: true }),
      ],
    }),
    new TableRow({
      children: Array(13).fill(null).map((_, i) => createTableCell(`(${i + 1})`)),
    }),
  ];

  // Create data rows with eselon hierarchy headers
  const dataRows = createDataRowsWithEselonHeaders(pesertaBigData || [], 13, (p, idx) => new TableRow({
    children: [
      createTableCell(idx.toString()),
      createTableCell(`${p.nama}\n${p.nip}`),
      createTableCell([p.pangkat, p.pangkat_golongan, p.tmt_pangkat].filter(Boolean).join(' / ')),
      createTableCell(p.pendidikan || ''),
      createTableCell(p.jabatan || ''),
      createTableCell(p.grade || ''),
      createTableCell(p.tmt_terakhir || ''),
      createTableCell(p.pkt_2024 || ''),
      createTableCell(p.pkt_2025 || ''),
      createTableCell(p.rekomendasi || ''),
      createTableCell(p.jabatan_baru || ''),
      createTableCell(p.grade_baru || ''),
      createTableCell(''),
    ],
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [...headerRows, ...dataRows],
  });
}

// PTB Belum Rekomendasi Table with data
function createPTBBelumRekomendasiTable(pesertaBigData?: BigDataPeserta[]): Table {
  const headerRows = [
    new TableRow({
      children: [
        createTableCell("NO.", { bold: true, rowSpan: 2 }),
        createTableCell("NAMA / NIP", { bold: true, rowSpan: 2 }),
        createTableCell("PANGKAT/ GOL/TMT GOL", { bold: true, rowSpan: 2 }),
        createTableCell("PENDIDIKAN", { bold: true, rowSpan: 2 }),
        createTableCell("JABATAN", { bold: true, rowSpan: 2 }),
        createTableCell("PERINGKAT", { bold: true, rowSpan: 2 }),
        createTableCell("TMT PERINGKAT TERAKHIR", { bold: true, rowSpan: 2 }),
        createTableCell("KETERANGAN", { bold: true }),
      ],
    }),
    new TableRow({
      children: [
        createTableCell("PREDIKAT KINERJA PERIODE I", { bold: true }),
      ],
    }),
    new TableRow({
      children: Array(8).fill(null).map((_, i) => createTableCell(`(${i + 1})`)),
    }),
  ];

  // Create data rows with eselon hierarchy headers
  const dataRows = createDataRowsWithEselonHeaders(pesertaBigData || [], 8, (p, idx) => new TableRow({
    children: [
      createTableCell(idx.toString()),
      createTableCell(`${p.nama}\n${p.nip}`),
      createTableCell([p.pangkat, p.pangkat_golongan, p.tmt_pangkat].filter(Boolean).join(' / ')),
      createTableCell(p.pendidikan || ''),
      createTableCell(p.jabatan || ''),
      createTableCell(p.grade || ''),
      createTableCell(p.tmt_terakhir || ''),
      createTableCell(p.pkt_2024 || ''),
    ],
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [...headerRows, ...dataRows],
  });
}

// Main function to generate lampiran based on category
export async function generateLampiranByCategory(data: BeritaAcaraData) {
  switch (data.kategori) {
    case "PU_NAIK_TURUN_TETAP":
      await generateLampiranPUNaikTurunTetap(data);
      break;
    case "PU_BELUM_REKOMENDASI":
      await generateLampiranPUBelumRekomendasi(data);
      break;
    case "PK_NAIK_TETAP":
      await generateLampiranPKNaikTetap(data);
      break;
    case "PK_BELUM_REKOMENDASI":
      await generateLampiranPKBelumRekomendasi(data);
      break;
    case "PTB_NAIK_TURUN_TETAP":
      await generateLampiranPTBNaikTurunTetap(data);
      break;
    case "PTB_BELUM_REKOMENDASI":
      await generateLampiranPTBBelumRekomendasi(data);
      break;
    default:
      throw new Error("Kategori tidak valid");
  }
}
