import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  TabStopPosition,
  TabStopType,
  convertInchesToTwip,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageOrientation,
} from "docx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Category mapping for document titles
const KATEGORI_TENTANG_MAP: Record<string, string> = {
  "Penetapan Pertama": "PENETAPAN PERTAMA JABATAN DAN PERINGKAT BAGI PELAKSANA",
  "Pertama": "PENETAPAN PERTAMA JABATAN DAN PERINGKAT BAGI PELAKSANA",
  "Kembali": "PENETAPAN KEMBALI JABATAN DAN PERINGKAT BAGI PELAKSANA",
  "Simulasi": "PENETAPAN JABATAN DAN PERINGKAT BAGI PELAKSANA BERDASARKAN SIMULASI SIDANG PENILAIAN",
  "Sidang": "PENETAPAN JABATAN DAN PERINGKAT BAGI PELAKSANA UMUM, PELAKSANA KHUSUS, DAN/ATAU PELAKSANA TUGAS BELAJAR BERDASARKAN HASIL SIDANG PENILAIAN",
};

// Category-based konsideran notes
export const KATEGORI_CATATAN_KONSIDERAN: Record<string, string> = {
  "Penetapan Pertama": "Catatan: Konsideran untuk Penetapan Pertama berisi Surat/Keputusan sebagai dasar penetapan pertama bagi Pejabat Pelaksana dalam Jabatan Pelaksana Umum, Jabatan Pelaksana Khusus atau Jabatan Pelaksana Tugas Belajar",
  "Pertama": "Catatan: Konsideran untuk Penetapan Pertama berisi Surat/Keputusan sebagai dasar penetapan pertama bagi Pejabat Pelaksana dalam Jabatan Pelaksana Umum, Jabatan Pelaksana Khusus atau Jabatan Pelaksana Tugas Belajar",
  "Kembali": "Catatan: Konsideran untuk Penetapan Kembali berisi Surat/Keputusan sebagai dasar penetapan kembali pelaksana dalam Jabatan Pelaksana Umum/Jabatan Pelaksana Khusus/Jabatan Pelaksana Tugas Belajar",
  "Simulasi": "Catatan: Konsideran untuk Simulasi Sidang Penilaian berisi SK Mutasi atau SK pengaktifan kembali",
  "Sidang": "Catatan: Konsideran untuk Hasil Sidang Penilaian berisi Berita Acara Hasil Sidang Penilaian",
};

export interface KonsideranND {
  naskah_dinas: string;
  nomor_nd: string;
  tanggal_nd: string;
  perihal: string;
}

export interface KEPGeneratorData {
  nomor_kep: string;
  tanggal_kep: string;
  jenis_kategori: string;
  konsideran_list: KonsideranND[];
  tujuan_salinan: string[];
  nama_pejabat: string;
}

function formatTanggal(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return format(date, "d MMMM yyyy", { locale: id });
  } catch {
    return dateStr;
  }
}

function createHeaderParagraph(text: string, isBold: boolean = true): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text,
        bold: isBold,
        size: 24,
        font: "Bookman Old Style",
      }),
    ],
  });
}

function createJudulTentang(kategori: string): Paragraph {
  const tentangText = KATEGORI_TENTANG_MAP[kategori] || KATEGORI_TENTANG_MAP["Pertama"];
  
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: tentangText,
        bold: true,
        size: 24,
        font: "Bookman Old Style",
      }),
    ],
  });
}

function createMemperhatikanSection(konsideranList: KonsideranND[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Memperhatikan", bold: false, size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
      ],
      tabStops: [
        { type: TabStopType.LEFT, position: convertInchesToTwip(1.5) },
      ],
    })
  );

  konsideranList.forEach((k, idx) => {
    const konsideranText = `${idx + 1}. ${k.naskah_dinas} Nomor ${k.nomor_nd} tanggal ${formatTanggal(k.tanggal_nd)} hal ${k.perihal};`;
    paragraphs.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(1.6) },
        children: [
          new TextRun({
            text: konsideranText,
            size: 24,
            font: "Bookman Old Style",
          }),
        ],
      })
    );
  });

  return paragraphs;
}

function createKesatuKedua(kategori: string): Paragraph[] {
  const isSidang = kategori === "Sidang";
  const paragraphs: Paragraph[] = [];

  // KESATU
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: "KESATU", bold: true, size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  if (isSidang) {
    // Blue template for Sidang
    paragraphs.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(1.6) },
        children: [
          new TextRun({
            text: "Menetapkan jabatan dan peringkat bagi Pelaksana Umum di lingkungan Kantor Wilayah Direktur Jenderal Bea dan Cukai Jawa Timur I sebagaimana tercantum dalam Lampiran I yang merupakan bagian tidak terpisahkan dari Keputusan Direktur Jenderal Bea dan Cukai ini.",
            size: 24,
            color: "0070C0", // Blue color
            font: "Bookman Old Style",
          }),
        ],
      })
    );
    paragraphs.push(new Paragraph({ text: "", spacing: { after: 100 } }));
    paragraphs.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(1.6) },
        children: [
          new TextRun({
            text: "Menetapkan jabatan dan peringkat bagi Pelaksana Khusus di lingkungan Kantor Wilayah Direktur Jenderal Bea dan Cukai Jawa Timur I sebagaimana tercantum dalam Lampiran II yang merupakan bagian tidak terpisahkan dari Keputusan Direktur Jenderal Bea dan Cukai ini.",
            size: 24,
            color: "0070C0",
            font: "Bookman Old Style",
          }),
        ],
      })
    );
    paragraphs.push(new Paragraph({ text: "", spacing: { after: 100 } }));
    paragraphs.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(1.6) },
        children: [
          new TextRun({
            text: "Menetapkan jabatan dan peringkat bagi Pelaksana Tugas Belajar di lingkungan Kantor Wilayah Direktur Jenderal Bea dan Cukai Jawa Timur I sebagaimana tercantum dalam Lampiran III yang merupakan bagian tidak terpisahkan dari Keputusan Direktur Jenderal Bea dan Cukai ini.",
            size: 24,
            color: "0070C0",
            font: "Bookman Old Style",
          }),
        ],
      })
    );
  } else {
    // Non-blue template for other categories
    paragraphs.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(1.6) },
        children: [
          new TextRun({
            text: "Menetapkan jabatan dan peringkat bagi Pelaksana di lingkungan Kantor Wilayah Direktur Jenderal Bea dan Cukai Jawa Timur I sebagaimana tercantum dalam Lampiran yang merupakan bagian tidak terpisahkan dari Keputusan Direktur Jenderal Bea dan Cukai ini.",
            size: 24,
            font: "Bookman Old Style",
          }),
        ],
      })
    );
  }

  // KEDUA
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: "KEDUA", bold: true, size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  if (isSidang) {
    // Blue template for Sidang
    paragraphs.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(1.6) },
        children: [
          new TextRun({
            text: "Keputusan Direktur Jenderal Bea dan Cukai ini mulai berlaku pada tanggal ditetapkan dan pemberian peringkat jabatan berlaku ketentuan sebagai berikut:",
            size: 24,
            color: "0070C0",
            font: "Bookman Old Style",
          }),
        ],
      })
    );
    const keduaItems = [
      "Berlaku surut sejak tanggal 1 Januari pada tahun yang sama dengan pelaksanaan Sidang Penilaian dalam hal rekomendasi sidang berupa kenaikan atau tetap;",
      "Berlaku mulai tanggal 1 April pada tahun yang sama dengan pelaksanaan Sidang Penilaian dalam hal rekomendasi sidang berupa penurunan; atau",
      "Berlaku surut sejak tanggal mutasi dalam hal Pelaksanaan dimutasi ke jabatan/Unit Kerja Terkecil lain sebelum sidang penilaian dan terjadi kenaikan/penurunan peringkat jabatan karena mutasi atau tidak terdapat formasi sebelumnya.",
    ];
    keduaItems.forEach((item, idx) => {
      paragraphs.push(
        new Paragraph({
          indent: { left: convertInchesToTwip(2) },
          children: [
            new TextRun({ text: `${idx + 1}. ${item}`, size: 24, color: "0070C0", font: "Bookman Old Style" }),
          ],
        })
      );
    });
  } else {
    paragraphs.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(1.6) },
        children: [
          new TextRun({
            text: "Keputusan Direktur Jenderal Bea dan Cukai ini mulai berlaku pada tanggal ditetapkan dan pemberian peringkat jabatan berlaku surut terhitung mulai tanggal di kolom keterangan setiap pelaksana sesuai lampiran Keputusan Direktur Jenderal ini.",
            size: 24,
            font: "Bookman Old Style",
          }),
        ],
      })
    );
  }

  return paragraphs;
}

function createSalinanSection(tujuanSalinan: string[], _jenisKategori?: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Salinan Keputusan Direktur Jenderal Bea dan Cukai ini disampaikan kepada:",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  // Fixed recipients 1-3
  const fixedRecipients = [
    "Sekretaris Direktorat Jenderal Bea dan Cukai;",
    "Kepala Biro Organisasi dan Ketatalaksanaan;",
    "Kepala Biro Sumber Daya Manusia;",
  ];

  fixedRecipients.forEach((recipient, idx) => {
    paragraphs.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(0.5) },
        children: [
          new TextRun({ text: `${idx + 1}. ${recipient}`, size: 24, font: "Bookman Old Style" }),
        ],
      })
    );
  });

  // Dynamic recipients from tujuan_salinan (starting from #4)
  tujuanSalinan.forEach((satker, idx) => {
    paragraphs.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(0.5) },
        children: [
          new TextRun({ text: `${idx + 4}. ${satker};`, size: 24, font: "Bookman Old Style" }),
        ],
      })
    );
  });

  return paragraphs;
}

export async function generateKEPDocument(data: KEPGeneratorData): Promise<void> {
  const tentangText = KATEGORI_TENTANG_MAP[data.jenis_kategori] || KATEGORI_TENTANG_MAP["Pertama"];
  
  const children: Paragraph[] = [
    // Header
    createHeaderParagraph("KEMENTERIAN KEUANGAN REPUBLIK INDONESIA"),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // Title
    createHeaderParagraph("KEPUTUSAN DIREKTUR JENDERAL BEA DAN CUKAI"),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Nomor
    createHeaderParagraph(`NOMOR ${data.nomor_kep}`),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // TENTANG
    createHeaderParagraph("TENTANG"),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Jenis Kategori (dynamic title)
    createJudulTentang(data.jenis_kategori),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Location
    createHeaderParagraph("DI LINGKUNGAN KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I"),
    new Paragraph({ text: "", spacing: { after: 300 } }),
    
    // Direktur
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "DIREKTUR JENDERAL BEA DAN CUKAI,", size: 24, font: "Bookman Old Style" })],
      spacing: { after: 200 },
    }),
    
    // Menimbang
    new Paragraph({
      children: [
        new TextRun({ text: "Menimbang", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({
          text: `${data.jenis_kategori === "Sidang" ? "bahwa" : "Bahwa"} sebagai bentuk pembinaan pegawai dan untuk melaksanakan Keputusan Menteri Keuangan Nomor 54/KMK.01/2023 tentang Tata Cara Pembentukan Jabatan Pelaksana dan Mekanisme Penetapan Pejabat Pelaksana ke dalam Jabatan dan Peringkat bagi Jabatan Pelaksana di Lingkungan Kementerian Keuangan, perlu menetapkan Keputusan Direktur Jenderal Bea dan Cukai tentang ${tentangText};`,
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
      tabStops: [
        { type: TabStopType.LEFT, position: convertInchesToTwip(1.5) },
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // Mengingat
    new Paragraph({
      children: [
        new TextRun({ text: "Mengingat", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
      ],
      tabStops: [
        { type: TabStopType.LEFT, position: convertInchesToTwip(1.5) },
      ],
    }),
    
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      alignment: AlignmentType.JUSTIFIED,
      children: [
        new TextRun({
          text: "1. Peraturan Menteri Keuangan Nomor 124 Tahun 2024 tentang Organisasi dan Tata Kerja Kementerian Keuangan;",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      alignment: AlignmentType.JUSTIFIED,
      children: [
        new TextRun({
          text: "2. Keputusan Menteri Keuangan Nomor 54/KMK.01/2023 tentang Tata Cara Pembentukan Jabatan Pelaksana dan Mekanisme Penetapan Pejabat Pelaksana ke dalam Jabatan dan Peringkat bagi Jabatan Pelaksana di lingkungan Kementerian Keuangan;",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      alignment: AlignmentType.JUSTIFIED,
      children: [
        new TextRun({
          text: "3. Keputusan Menteri Keuangan Nomor 408/KM.1/2023 tentang Jabatan dan Peringkat Bagi Pelaksana di Lingkungan Kementerian Keuangan;",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // Memperhatikan
    ...(data.jenis_kategori === "Sidang" && (!data.konsideran_list || data.konsideran_list.length === 0)
      ? [
        new Paragraph({
          children: [
            new TextRun({ text: "Memperhatikan", size: 24, font: "Bookman Old Style" }),
            new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
            new TextRun({ text: "<<Berita Acara Pelaksanaan Sidang Penilaian>>", size: 24, color: "C00000", font: "Bookman Old Style" }),
          ],
          tabStops: [
            { type: TabStopType.LEFT, position: convertInchesToTwip(1.5) },
          ],
        }),
      ]
      : createMemperhatikanSection(data.konsideran_list)
    ),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // MEMUTUSKAN
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "MEMUTUSKAN:", bold: true, size: 24, font: "Bookman Old Style" })],
      spacing: { before: 200, after: 200 },
    }),
    
    // Menetapkan
    new Paragraph({
      children: [
        new TextRun({ text: "Menetapkan", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({
          text: `KEPUTUSAN DIREKTUR JENDERAL BEA DAN CUKAI TENTANG ${tentangText} DI LINGKUNGAN KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I.`,
          bold: true,
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
      tabStops: [
        { type: TabStopType.LEFT, position: convertInchesToTwip(1.5) },
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // KESATU & KEDUA (& KETIGA, KEEMPAT, KELIMA for Sidang)
    ...createKesatuKedua(data.jenis_kategori),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // Salinan & Petikan
    ...createSalinanSection(data.tujuan_salinan, data.jenis_kategori),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // Tanggal penetapan
    new Paragraph({
      children: [
        new TextRun({
          text: "Ditetapkan di Sidoarjo",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `pada tanggal ${formatTanggal(data.tanggal_kep)}`,
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
      spacing: { after: 200 },
    }),
    
    // a.n. DIREKTUR JENDERAL
    new Paragraph({
      children: [new TextRun({ text: "a.n. DIREKTUR JENDERAL BEA DAN CUKAI", bold: true, size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      children: [new TextRun({ text: "      KEPALA KANTOR WILAYAH,", size: 24, font: "Bookman Old Style" })],
    }),
    
    new Paragraph({ text: "", spacing: { after: 300 } }),
    
    // Page number
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "- 3 -", size: 24, font: "Bookman Old Style" })],
      spacing: { after: 200 },
    }),
    
    // Ditandatangani secara elektronik
    new Paragraph({
      children: [new TextRun({ text: "Ditandatangani secara elektronik", italics: true, size: 22, color: "0070C0", font: "Bookman Old Style" })],
    }),
    
    // Nama Pejabat
    new Paragraph({
      children: [
        new TextRun({
          text: data.nama_pejabat || "________________________",
          bold: true,
          size: 24,
          color: "0070C0",
          font: "Bookman Old Style",
        }),
      ],
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
              right: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `KEP_${data.nomor_kep.replace(/\//g, "-")}_${data.tanggal_kep || new Date().toISOString().split("T")[0]}.docx`;
  saveAs(blob, fileName);
}

// Generate Salinan document with UB pejabat
export interface SalinanGeneratorData {
  nomor_kep: string;
  tanggal_kep: string;
  jenis_kategori: string;
  konsideran_list: KonsideranND[];
  tujuan_salinan: string[];
  nama_pejabat: string;
  nama_ub: string;
}

export async function generateSalinanDocument(data: SalinanGeneratorData): Promise<void> {
  const tentangText = KATEGORI_TENTANG_MAP[data.jenis_kategori] || KATEGORI_TENTANG_MAP["Pertama"];
  
  const children: Paragraph[] = [
    // Header
    createHeaderParagraph("KEMENTERIAN KEUANGAN REPUBLIK INDONESIA"),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // Title
    createHeaderParagraph("KEPUTUSAN DIREKTUR JENDERAL BEA DAN CUKAI"),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Nomor
    createHeaderParagraph(`NOMOR ${data.nomor_kep}`),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // TENTANG
    createHeaderParagraph("TENTANG"),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Jenis Kategori
    createJudulTentang(data.jenis_kategori),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Location
    createHeaderParagraph("DI LINGKUNGAN KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I"),
    new Paragraph({ text: "", spacing: { after: 300 } }),
    
    // Direktur
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "DIREKTUR JENDERAL BEA DAN CUKAI,", size: 24, font: "Bookman Old Style" })],
      spacing: { after: 200 },
    }),
    
    // Menimbang - dst (abbreviated)
    new Paragraph({
      children: [
        new TextRun({ text: "Menimbang", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "--- dst ---;", size: 24, font: "Bookman Old Style" }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Mengingat", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "--- dst ---;", size: 24, font: "Bookman Old Style" }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Memperhatikan", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "--- dst ---;", size: 24, font: "Bookman Old Style" }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // MEMUTUSKAN
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "MEMUTUSKAN:", bold: true, size: 24, font: "Bookman Old Style" })],
      spacing: { before: 200, after: 200 },
    }),
    
    // Menetapkan
    new Paragraph({
      children: [
        new TextRun({ text: "Menetapkan", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({
          text: `KEPUTUSAN DIREKTUR JENDERAL BEA DAN CUKAI TENTANG ${tentangText} DI LINGKUNGAN KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I.`,
          bold: true,
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // KESATU & KEDUA abbreviated
    new Paragraph({
      children: [
        new TextRun({ text: "KESATU", bold: true, size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "--- dst ---;", size: 24, font: "Bookman Old Style" }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "KEDUA", bold: true, size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "--- dst ---;", size: 24, font: "Bookman Old Style" }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // Salinan disampaikan kepada
    new Paragraph({
      children: [
        new TextRun({ text: "Salinan --- dst ---;", size: 24, font: "Bookman Old Style" }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 300 } }),
    
    // Right side - a.n. DIREKTUR
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "a.n   DIREKTUR JENDERAL BEA DAN CUKAI", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "KEPALA KANTOR WILAYAH", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "DIREKTORAT JENDERAL BEA DAN CUKAI", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "JAWA TIMUR I,", size: 24, font: "Bookman Old Style" })],
    }),
    
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Ttd
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "Ttd", size: 24, font: "Bookman Old Style" })],
    }),
    
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Nama Pejabat penandatangan (bukan UB)
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: data.nama_pejabat || "UNTUNG BASUKI",
          bold: false,
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 300 } }),
    
    // Left side - Salinan sesuai dengan aslinya
    new Paragraph({
      children: [
        new TextRun({
          text: "Salinan sesuai dengan aslinya",
          size: 24,
          color: "FF0000",
          font: "Bookman Old Style",
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Kepala Bagian Umum,",
          size: 24,
          color: "FF0000",
          font: "Bookman Old Style",
        }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // UB signature
    new Paragraph({
      children: [
        new TextRun({
          text: "Ditandatangani secara elektronik",
          italics: true,
          size: 22,
          color: "FF0000",
          font: "Bookman Old Style",
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.nama_ub || "Himawan Indarjono",
          bold: false,
          size: 24,
          color: "FF0000",
          font: "Bookman Old Style",
        }),
      ],
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
              right: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `SALINAN_${data.nomor_kep.replace(/\//g, "-")}_${data.tanggal_kep || new Date().toISOString().split("T")[0]}.docx`;
  saveAs(blob, fileName);
}

// Generate Petikan document (individual employee)
export interface PetikanGeneratorData {
  nomor_kep: string;
  hal: string;
  menetapkan: string;
  tanggal_kep: string;
  nama_pegawai: string;
  nip_pegawai: string;
  pangkat_gol_tmt: string;
  pendidikan: string;
  jabatan_lama: string;
  jabatan_baru: string;
  tmt_peringkat_terakhir: string;
  keterangan: string;
  nama_pejabat: string;
}

// Generate multiple petikan documents merged into one
export interface PetikanAllGeneratorData {
  employees: PetikanGeneratorData[];
  nama_pejabat: string;
}

// Helper to get HAL text based on hal value
function getHalText(hal: string): string {
  switch (hal) {
    case "Pertama":
      return "PENETAPAN PERTAMA JABATAN DAN PERINGKAT BAGI PELAKSANA";
    case "Kembali":
      return "PENETAPAN KEMBALI JABATAN DAN PERINGKAT BAGI PELAKSANA";
    case "Simulasi":
      return "PENETAPAN JABATAN DAN PERINGKAT BAGI PELAKSANA BERDASARKAN SIMULASI SIDANG PENILAIAN";
    case "Sidang":
      return "PENETAPAN JABATAN DAN PERINGKAT BAGI PELAKSANA UMUM, PELAKSANA KHUSUS, DAN/ATAU PELAKSANA TUGAS BELAJAR BERDASARKAN HASIL SIDANG PENILAIAN";
    default:
      return "PENETAPAN PERTAMA JABATAN DAN PERINGKAT BAGI PELAKSANA";
  }
}

// Create petikan content for a single employee
function createPetikanContent(data: PetikanGeneratorData): Paragraph[] {
  const halText = getHalText(data.hal);
  
  return [
    // Header
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "KEMENTERIAN KEUANGAN REPUBLIK INDONESIA", bold: true, size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "PETIKAN", bold: true, size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    createHeaderParagraph("KEPUTUSAN DIREKTUR JENDERAL BEA DAN CUKAI"),
    createHeaderParagraph(`NOMOR ${data.nomor_kep}`),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // TENTANG
    createHeaderParagraph("TENTANG"),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: halText, bold: true, size: 22, color: "C00000", font: "Bookman Old Style" })],
    }),
    createHeaderParagraph("DI LINGKUNGAN KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI"),
    createHeaderParagraph("JAWA TIMUR I"),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // DIREKTUR JENDERAL
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "DIREKTUR JENDERAL BEA DAN CUKAI,", size: 24, font: "Bookman Old Style" })],
      spacing: { after: 200 },
    }),
    
    // Menimbang dst
    new Paragraph({
      children: [
        new TextRun({ text: "Menimbang", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "--- dst ", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "----;", size: 24, color: "C00000", font: "Bookman Old Style" }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Mengingat", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "--- dst ", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "----;", size: 24, color: "C00000", font: "Bookman Old Style" }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Memperhatikan", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "--- dst ", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "----;", size: 24, color: "C00000", font: "Bookman Old Style" }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // MEMUTUSKAN
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "MEMUTUSKAN:", bold: true, size: 24, font: "Bookman Old Style" })],
      spacing: { before: 100, after: 100 },
    }),
    
    // Menetapkan section
    new Paragraph({
      children: [
        new TextRun({ text: "Menetapkan", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({
          text: data.menetapkan || `KEPUTUSAN DIREKTUR JENDERAL BEA DAN CUKAI TENTANG ${halText} DI LINGKUNGAN KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I.`,
          bold: true,
          size: 24,
          color: "C00000",
          font: "Bookman Old Style",
        }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Employee details intro
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({ text: "Menetapkan Pelaksana di lingkungan Kantor Wilayah DJBC Jawa Timur I,", size: 24, font: "Bookman Old Style" }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Nama / NIP
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({ text: "Nama / NIP", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: `${data.nama_pegawai} /`, size: 24, font: "Bookman Old Style" }),
      ],
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(3.2) },
      children: [
        new TextRun({ text: data.nip_pegawai, size: 24, font: "Bookman Old Style" }),
      ],
    }),
    
    // Pangkat / Gol. / TMT
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({ text: "Pangkat / Gol. / TMT", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: data.pangkat_gol_tmt || "-", size: 24, font: "Bookman Old Style" }),
      ],
    }),
    
    // Pendidikan
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({ text: "Pendidikan", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: data.pendidikan || "-", size: 24, font: "Bookman Old Style" }),
      ],
    }),
    
    // Jabatan / peringkat lama
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({ text: "Jabatan / peringkat lama", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: data.jabatan_lama || "-", size: 24, font: "Bookman Old Style" }),
      ],
    }),
    
    // Jabatan / peringkat baru
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({ text: "Jabatan / peringkat baru", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: data.jabatan_baru || "-", size: 24, font: "Bookman Old Style" }),
      ],
    }),
    
    // TMT Peringkat Terakhir
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({ text: "TMT Peringkat Terakhir", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: data.tmt_peringkat_terakhir || "-", size: 24, font: "Bookman Old Style" }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Keterangan (in red, underlined)
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({ text: "Keterangan", underline: {}, size: 24, color: "C00000", font: "Bookman Old Style" }),
        new TextRun({ text: ":", size: 24, color: "C00000", font: "Bookman Old Style" }),
      ],
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({ text: data.keterangan || "-", size: 24, color: "C00000", font: "Bookman Old Style" }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 150 } }),
    
    // KESATU
    new Paragraph({
      children: [
        new TextRun({ text: "KESATU", bold: true, size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({
          text: "Menetapkan jabatan dan peringkat bagi Pelaksana di lingkungan Kantor Wilayah Direktur Jenderal Bea dan Cukai Jawa Timur I sebagaimana tercantum dalam Lampiran yang merupakan bagian tidak terpisahkan dari Keputusan Direktur Jenderal ini.",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // KEDUA
    new Paragraph({
      children: [
        new TextRun({ text: "KEDUA", bold: true, size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({
          text: "Keputusan Direktur Jenderal ini mulai berlaku pada tanggal ditetapkan dan berlaku surut sejak tanggal Pelaksana Umum Kembali bekerja sesuai yang tercantum pada Lampiran Keputusan Direktur Jenderal ini.",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Salinan dst
    new Paragraph({
      children: [
        new TextRun({ text: "Salinan --- dst ---;", size: 24, font: "Bookman Old Style" }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Petikan disampaikan kepada
    new Paragraph({
      children: [
        new TextRun({
          text: "Petikan Keputusan Direktur Jenderal Bea dan Cukai ini disampaikan kepada yang bersangkutan untuk diketahui dan digunakan sebagaimana mestinya.",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // Ditetapkan
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "Ditetapkan di Sidoarjo", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: `pada tanggal ${formatTanggal(data.tanggal_kep)}`, size: 24, font: "Bookman Old Style" })],
      spacing: { after: 100 },
    }),
    
    // a.n. DIREKTUR
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "a.n. DIREKTUR JENDERAL BEA DAN CUKAI", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "KEPALA KANTOR WILAYAH", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "DIREKTORAT JENDERAL BEA DAN CUKAI", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "JAWA TIMUR I,", size: 24, font: "Bookman Old Style" })],
    }),
    
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // ttd
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "ttd.", size: 24, font: "Bookman Old Style" })],
    }),
    
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Nama pejabat
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: data.nama_pejabat || "UNTUNG BASUKI", bold: false, size: 24, font: "Bookman Old Style" })],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // Left side - Petikan sesuai dengan aslinya
    new Paragraph({
      children: [
        new TextRun({ text: "Petikan sesuai dengan aslinya", size: 24, italics: true, font: "Bookman Old Style" }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Kepala Bagian Umum,", size: 24, font: "Bookman Old Style" })],
    }),
    
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // UB
    new Paragraph({
      children: [
        new TextRun({ text: "Ditandatangani secara elektronik", italics: true, size: 22, color: "0070C0", font: "Bookman Old Style" }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Himawan Indarjono", size: 24, color: "0070C0", font: "Bookman Old Style" }),
      ],
    }),
  ];
}

export async function generatePetikanDocument(data: PetikanGeneratorData): Promise<void> {
  const children = createPetikanContent(data);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
              right: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `PETIKAN_${data.nomor_kep.replace(/\//g, "-")}_${data.nama_pegawai.replace(/\s+/g, "_")}.docx`;
  saveAs(blob, fileName);
}

// Generate all petikan documents merged into a single docx file
export async function generatePetikanAllDocument(data: PetikanAllGeneratorData): Promise<void> {
  // Create sections for each employee (each on a new page)
  const sections = data.employees.map((emp, idx) => ({
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.25),
          right: convertInchesToTwip(1),
        },
      },
    },
    children: createPetikanContent(emp),
  }));

  const doc = new Document({ sections });

  const blob = await Packer.toBlob(doc);
  const fileName = `PETIKAN_ALL_${new Date().toISOString().split("T")[0]}.docx`;
  saveAs(blob, fileName);
}

// Generate blank KEP template for download
export async function generateBlankKEPTemplate(): Promise<void> {
  const children: Paragraph[] = [
    // Header
    createHeaderParagraph("KEMENTERIAN KEUANGAN REPUBLIK INDONESIA"),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // Title
    createHeaderParagraph("KEPUTUSAN DIREKTUR JENDERAL BEA DAN CUKAI"),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Nomor placeholder
    createHeaderParagraph("NOMOR [@NomorND]"),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // TENTANG
    createHeaderParagraph("TENTANG"),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Placeholder for category
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "{PENETAPAN PERTAMA JABATAN DAN PERINGKAT BAGI PELAKSANA / PENETAPAN KEMBALI JABATAN DAN PERINGKAT BAGI PELAKSANA / PENETAPAN JABATAN DAN PERINGKAT BAGI PELAKSANA BERDASARKAN SIMULASI SIDANG PENILAIAN / PENETAPAN JABATAN DAN PERINGKAT BAGI PELAKSANA UMUM, PELAKSANA KHUSUS, DAN/ATAU PELAKSANA TUGAS BELAJAR BERDASARKAN HASIL SIDANG PENILAIAN}",
          bold: true,
          size: 24,
          color: "FF0000",
          font: "Bookman Old Style",
        }),
      ],
    }),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Location
    createHeaderParagraph("DI LINGKUNGAN KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I"),
    new Paragraph({ text: "", spacing: { after: 300 } }),
    
    // Direktur
    new Paragraph({
      children: [new TextRun({ text: "DIREKTUR JENDERAL BEA DAN CUKAI,", size: 24, font: "Bookman Old Style" })],
      spacing: { after: 200 },
    }),
    
    // Menimbang
    new Paragraph({
      children: [
        new TextRun({ text: "Menimbang", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({
          text: "Bahwa sebagai bentuk pembinaan pegawai dan untuk melaksanakan Keputusan Menteri Keuangan Nomor 54/KMK.01/2023 tentang Tata Cara Pembentukan Jabatan Pelaksana dan Mekanisme Penetapan Pejabat Pelaksana ke dalam Jabatan dan Peringkat bagi Jabatan Pelaksana di Lingkungan Kementerian Keuangan, perlu menetapkan Keputusan Direktur Jenderal Bea dan Cukai tentang {SESUAI KATEGORI YANG DIPILIH};",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
      tabStops: [
        { type: TabStopType.LEFT, position: convertInchesToTwip(1.5) },
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // Mengingat
    new Paragraph({
      children: [
        new TextRun({ text: "Mengingat", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
      ],
      tabStops: [
        { type: TabStopType.LEFT, position: convertInchesToTwip(1.5) },
      ],
    }),
    
    // Mengingat items
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({
          text: "1. Keputusan Menteri Keuangan Nomor 54/KMK.01/2023 Tentang Tata Cara Pembentukan Jabatan Pelaksana dan Mekanisme Penetapan Jabatan Pelaksana ke dalam Jabatan dan Peringkat bagi Jabatan Pelaksana di Lingkungan Kementerian Keuangan;",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({
          text: "2. Keputusan Menteri Keuangan Nomor 454 Tahun 2023 tentang Tata Cara Pembentukan Jabatan Pelaksana Tertentu dan Mekanisme Penetapan Pejabat Pelaksana ke dalam Jabatan dan Peringkat bagi Jabatan Pelaksana Tertentu di Lingkungan Kementerian Keuangan;",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({
          text: "3. Peraturan Menteri Keuangan Nomor 123 Tahun 2023 tentang Tata Cara Pemeriksaan Pelanggaran Disiplin dan Penjatuhan Hukuman Disiplin di Lingkungan Kementerian Keuangan;",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({
          text: "4. Peraturan Menteri Keuangan Nomor 124 Tahun 2024 tentang Organisasi dan Tata Kerja Kementerian Keuangan;",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({
          text: "5. Keputusan Menteri Keuangan Nomor 408/KMK.1/2023 Tentang Jabatan dan Peringkat Bagi Pelaksana di Lingkungan Kementerian Keuangan;",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // Memperhatikan placeholder
    new Paragraph({
      children: [
        new TextRun({ text: "Memperhatikan", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
      ],
      tabStops: [
        { type: TabStopType.LEFT, position: convertInchesToTwip(1.5) },
      ],
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({
          text: "1. {Naskah Dinas} Nomor {Nomor ND} tanggal {Tanggal ND} hal {Perihal};",
          size: 24,
          color: "FF0000",
          font: "Bookman Old Style",
        }),
      ],
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({
          text: "(Catatan Konsideran sesuai kategori yang dipilih)",
          size: 22,
          italics: true,
          color: "808080",
          font: "Bookman Old Style",
        }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // MEMUTUSKAN
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "MEMUTUSKAN:", bold: true, size: 24, font: "Bookman Old Style" })],
      spacing: { before: 200, after: 200 },
    }),
    
    // Menetapkan
    new Paragraph({
      children: [
        new TextRun({ text: "Menetapkan", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
        new TextRun({
          text: "KEPUTUSAN DIREKTUR JENDERAL BEA DAN CUKAI TENTANG {SESUAI KATEGORI} DI LINGKUNGAN KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I.",
          bold: true,
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
      tabStops: [
        { type: TabStopType.LEFT, position: convertInchesToTwip(1.5) },
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // KESATU
    new Paragraph({
      children: [
        new TextRun({ text: "KESATU", bold: true, size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
      ],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({
          text: "Menetapkan jabatan dan peringkat bagi Pelaksana di lingkungan Kantor Wilayah Direktur Jenderal Bea dan Cukai Jawa Timur I sebagaimana tercantum dalam Lampiran yang merupakan bagian tidak terpisahkan dari Keputusan Direktur Jenderal Bea dan Cukai ini.",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({
          text: "(Khusus kategori Sidang/Hasil Sidang Penilaian menggunakan template BIRU dengan 3 lampiran: PU, PK, PTB)",
          size: 22,
          italics: true,
          color: "0070C0",
          font: "Bookman Old Style",
        }),
      ],
    }),
    
    // KEDUA
    new Paragraph({
      children: [
        new TextRun({ text: "KEDUA", bold: true, size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: "\t:\t", size: 24, font: "Bookman Old Style" }),
      ],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(1.6) },
      children: [
        new TextRun({
          text: "Keputusan Direktur Jenderal Bea dan Cukai ini mulai berlaku pada tanggal ditetapkan dan pemberian peringkat jabatan berlaku surut terhitung mulai tanggal di kolom keterangan setiap pelaksana sesuai lampiran Keputusan Direktur Jenderal ini.",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // Salinan Section
    new Paragraph({
      children: [
        new TextRun({
          text: "Salinan Keputusan Direktur Jenderal Bea dan Cukai ini disampaikan kepada:",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(0.5) },
      children: [new TextRun({ text: "1. Sekretaris Direktorat Jenderal Bea dan Cukai;", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(0.5) },
      children: [new TextRun({ text: "2. Kepala Biro Organisasi dan Ketatalaksanaan;", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(0.5) },
      children: [new TextRun({ text: "3. Kepala Biro Sumber Daya Manusia;", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(0.5) },
      children: [
        new TextRun({ text: "4. {Satuan Kerja dari pilihan tujuan salinan};", size: 24, color: "FF0000", font: "Bookman Old Style" }),
      ],
    }),
    new Paragraph({
      indent: { left: convertInchesToTwip(0.5) },
      children: [
        new TextRun({ text: "5. dst...", size: 24, color: "FF0000", font: "Bookman Old Style" }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 300 } }),
    
    // Tanggal penetapan
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: "Ditetapkan di Sidoarjo pada tanggal [@TanggalND]",
          size: 24,
          font: "Bookman Old Style",
        }),
      ],
    }),
    
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // a.n. DIREKTUR JENDERAL
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "a.n. DIREKTUR JENDERAL BEA DAN CUKAI", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "KEPALA KANTOR WILAYAH", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "DIREKTORAT JENDERAL BEA DAN CUKAI", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "JAWA TIMUR I,", size: 24, font: "Bookman Old Style" })],
    }),
    
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    // Ditandatangani secara elektronik
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "Ditandatangani secara elektronik", italics: true, size: 24, font: "Bookman Old Style" })],
    }),
    
    new Paragraph({ text: "", spacing: { after: 100 } }),
    
    // Nama Pejabat placeholder
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: "[@NamaPejabat]",
          bold: true,
          size: 24,
          color: "FF0000",
          font: "Bookman Old Style",
        }),
      ],
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
              right: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "TEMPLATE_KEP.docx");
}

// Interface for Lampiran KEP employee with category-specific fields
export interface LampiranKEPEmployee {
  no: number;
  nama: string;
  nip: string;
  pangkat?: string;
  pendidikan?: string;
  jabatan_lama?: string;
  jabatan_baru?: string;
  grade_lama?: string;
  grade_baru?: string;
  tmt_peringkat?: string;
  keterangan?: string;
  akumulasi_masa_kerja?: string;
  ukuran_panjang_kapal?: string;
  pkt_periode_1?: string;
  pkt_periode_2?: string;
  kemampuan_kerja?: string;
  tmt_peringkat_baru?: string;
}

// Interface for Lampiran KEP data with employees
export interface LampiranKEPGeneratorData {
  nomor_kep: string;
  tanggal_kep: string;
  jenis_kategori: string;
  nama_pejabat: string;
  employees: LampiranKEPEmployee[];
}

// Helper: create header cells for lampiran table based on category
function createLampiranHeaderRow(kategori: string): TableRow {
  const makeHeaderCell = (text: string, widthPct: number) => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 16, font: "Bookman Old Style" })], alignment: AlignmentType.CENTER })],
    width: { size: widthPct, type: WidthType.PERCENTAGE },
  });

  const baseCells = [
    makeHeaderCell("NO", 3),
    makeHeaderCell("NAMA/NIP", 10),
    makeHeaderCell("PANGKAT/GOL/ TMT GOL", 7),
    makeHeaderCell("PENDIDIKAN", 6),
    makeHeaderCell("JABATAN (LAMA)", 7),
    makeHeaderCell("PERINGKAT (LAMA)", 6),
  ];

  let additionalCells: TableCell[] = [];
  switch (kategori) {
    case "Kembali":
      additionalCells = [
        makeHeaderCell("TMT PERINGKAT TERAKHIR", 8),
        makeHeaderCell("JABATAN (BARU)", 8),
        makeHeaderCell("PERINGKAT (BARU)", 7),
        makeHeaderCell("KETERANGAN", 8),
      ];
      break;
    case "Pertama":
    case "Penetapan Pertama":
      additionalCells = [
        makeHeaderCell("TMT PERINGKAT TERAKHIR", 7),
        makeHeaderCell("JABATAN (BARU)", 7),
        makeHeaderCell("PERINGKAT (BARU)", 6),
        makeHeaderCell("AKUMULASI MASA KERJA", 6),
        makeHeaderCell("KETERANGAN", 7),
      ];
      break;
    case "Simulasi":
      additionalCells = [
        makeHeaderCell("AKUMULASI MASA KERJA", 5),
        makeHeaderCell("UKURAN PANJANG KAPAL", 5),
        makeHeaderCell("TMT PERINGKAT TERAKHIR", 6),
        makeHeaderCell("JABATAN (BARU)", 6),
        makeHeaderCell("PERINGKAT (BARU)", 5),
        makeHeaderCell("KETERANGAN", 6),
      ];
      break;
    case "Sidang":
      additionalCells = [
        makeHeaderCell("TMT PERINGKAT TERAKHIR", 5),
        makeHeaderCell("JABATAN (BARU)", 6),
        makeHeaderCell("PERINGKAT (BARU)", 5),
        makeHeaderCell("PKT PERIODE I", 5),
        makeHeaderCell("PKT PERIODE II", 5),
        makeHeaderCell("KEMAMPUAN KERJA PU", 5),
        makeHeaderCell("TMT PERINGKAT BARU", 5),
      ];
      break;
    default:
      additionalCells = [
        makeHeaderCell("TMT PERINGKAT TERAKHIR", 8),
        makeHeaderCell("JABATAN (BARU)", 8),
        makeHeaderCell("PERINGKAT (BARU)", 7),
        makeHeaderCell("KETERANGAN", 8),
      ];
  }

  return new TableRow({
    tableHeader: true,
    children: [...baseCells, ...additionalCells],
  });
}

// Helper: create data row for lampiran table based on category
function createLampiranDataRow(emp: LampiranKEPEmployee, idx: number, kategori: string): TableRow {
  const makeCell = (text: string, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT) => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: 16, font: "Bookman Old Style" })], alignment: align })],
  });
  const makeCellMulti = (...lines: string[]) => new TableCell({
    children: lines.map(l => new Paragraph({ children: [new TextRun({ text: l, size: 16, font: "Bookman Old Style" })] })),
  });

  const baseCells = [
    makeCell(String(idx + 1), AlignmentType.CENTER),
    makeCellMulti(emp.nama, emp.nip),
    makeCell(emp.pangkat || "-"),
    makeCell(emp.pendidikan || "-"),
    makeCell(emp.jabatan_lama || "-"),
    makeCell(emp.grade_lama || "-"),
  ];

  let additionalCells: TableCell[] = [];
  switch (kategori) {
    case "Kembali":
      additionalCells = [
        makeCell(emp.tmt_peringkat || "-"),
        makeCell(emp.jabatan_baru || "-"),
        makeCell(emp.grade_baru || "-"),
        makeCell(emp.keterangan || ""),
      ];
      break;
    case "Pertama":
    case "Penetapan Pertama":
      additionalCells = [
        makeCell(emp.tmt_peringkat || "-"),
        makeCell(emp.jabatan_baru || "-"),
        makeCell(emp.grade_baru || "-"),
        makeCell(emp.akumulasi_masa_kerja || "-"),
        makeCell(emp.keterangan || ""),
      ];
      break;
    case "Simulasi":
      additionalCells = [
        makeCell(emp.akumulasi_masa_kerja || "-"),
        makeCell(emp.ukuran_panjang_kapal || "-"),
        makeCell(emp.tmt_peringkat || "-"),
        makeCell(emp.jabatan_baru || "-"),
        makeCell(emp.grade_baru || "-"),
        makeCell(emp.keterangan || ""),
      ];
      break;
    case "Sidang":
      additionalCells = [
        makeCell(emp.tmt_peringkat || "-"),
        makeCell(emp.jabatan_baru || "-"),
        makeCell(emp.grade_baru || "-"),
        makeCell(emp.pkt_periode_1 || "-"),
        makeCell(emp.pkt_periode_2 || "-"),
        makeCell(emp.kemampuan_kerja || "-"),
        makeCell(emp.tmt_peringkat_baru || "-"),
      ];
      break;
    default:
      additionalCells = [
        makeCell(emp.tmt_peringkat || "-"),
        makeCell(emp.jabatan_baru || "-"),
        makeCell(emp.grade_baru || "-"),
        makeCell(emp.keterangan || ""),
      ];
  }

  return new TableRow({
    children: [...baseCells, ...additionalCells],
  });
}

// Generate Lampiran KEP document with employee data table (landscape)
export async function generateLampiranKEPDocument(data: LampiranKEPGeneratorData): Promise<void> {
  const tentangText = KATEGORI_TENTANG_MAP[data.jenis_kategori] || KATEGORI_TENTANG_MAP["Pertama"];
  
  const tableRows: TableRow[] = [
    createLampiranHeaderRow(data.jenis_kategori),
    ...data.employees.map((emp, idx) => createLampiranDataRow(emp, idx, data.jenis_kategori)),
  ];
  
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "LAMPIRAN", bold: true, size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "KEPUTUSAN DIREKTUR JENDERAL BEA DAN CUKAI", bold: true, size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `NOMOR ${data.nomor_kep}`, bold: true, size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "TENTANG", bold: true, size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: tentangText, bold: true, size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "DI LINGKUNGAN KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I", bold: true, size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    }),
    
    new Paragraph({ text: "", spacing: { after: 300 } }),
    
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "a.n. DIREKTUR JENDERAL BEA DAN CUKAI", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "KEPALA KANTOR WILAYAH", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "DIREKTORAT JENDERAL BEA DAN CUKAI", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "JAWA TIMUR I,", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "Ditandatangani secara elektronik", italics: true, size: 22, color: "0070C0", font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: data.nama_pejabat || "________________________", bold: true, size: 24, color: "0070C0", font: "Bookman Old Style" })],
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `LAMPIRAN_KEP_${data.nomor_kep.replace(/\//g, "-")}_${data.tanggal_kep || new Date().toISOString().split("T")[0]}.docx`;
  saveAs(blob, fileName);
}

// Interface for Lampiran Salinan KEP data with UB signature
export interface LampiranSalinanGeneratorData {
  nomor_kep: string;
  tanggal_kep: string;
  jenis_kategori: string;
  nama_pejabat: string;
  nama_ub: string;
  nip_ub?: string;
  employees: LampiranKEPEmployee[];
}

// Generate Lampiran Salinan KEP document with UB signature at bottom left (landscape)
export async function generateLampiranSalinanDocument(data: LampiranSalinanGeneratorData): Promise<void> {
  const tentangText = KATEGORI_TENTANG_MAP[data.jenis_kategori] || KATEGORI_TENTANG_MAP["Pertama"];
  
  const tableRows: TableRow[] = [
    createLampiranHeaderRow(data.jenis_kategori),
    ...data.employees.map((emp, idx) => createLampiranDataRow(emp, idx, data.jenis_kategori)),
  ];
  
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "LAMPIRAN", bold: true, size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "KEPUTUSAN DIREKTUR JENDERAL BEA DAN CUKAI", bold: true, size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `NOMOR ${data.nomor_kep}`, bold: true, size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "TENTANG", bold: true, size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: tentangText, bold: true, size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "DI LINGKUNGAN KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I", bold: true, size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    }),
    
    new Paragraph({ text: "", spacing: { after: 300 } }),
    
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "a.n. DIREKTUR JENDERAL BEA DAN CUKAI", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "KEPALA KANTOR WILAYAH", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "DIREKTORAT JENDERAL BEA DAN CUKAI", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "JAWA TIMUR I,", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "Ttd", size: 24, font: "Bookman Old Style" })],
    }),
    new Paragraph({ text: "", spacing: { after: 100 } }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: data.nama_pejabat || "UNTUNG BASUKI", size: 24, font: "Bookman Old Style" })],
    }),
    
    new Paragraph({ text: "", spacing: { after: 300 } }),
    
    new Paragraph({
      children: [new TextRun({ text: "Salinan sesuai dengan aslinya", size: 24, color: "FF0000", font: "Bookman Old Style" })],
    }),
    new Paragraph({
      children: [new TextRun({ text: "Kepala Bagian Umum,", size: 24, color: "FF0000", font: "Bookman Old Style" })],
    }),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    new Paragraph({
      children: [new TextRun({ text: "Ditandatangani secara elektronik", italics: true, size: 22, color: "FF0000", font: "Bookman Old Style" })],
    }),
    new Paragraph({
      children: [new TextRun({ text: data.nama_ub || "Himawan Indarjono", size: 24, color: "FF0000", font: "Bookman Old Style" })],
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `LAMPIRAN_SALINAN_${data.nomor_kep.replace(/\//g, "-")}_${data.tanggal_kep || new Date().toISOString().split("T")[0]}.docx`;
  saveAs(blob, fileName);
}
