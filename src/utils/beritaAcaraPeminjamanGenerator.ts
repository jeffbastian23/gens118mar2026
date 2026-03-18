import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, Header, ImageRun } from "docx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface PeminjamanItem {
  no_urut: number;
  nama_dokumen: string;
  kode_klasifikasi: string;
  nomor_boks: string;
  tahun_dokumen: string;
  pemilik_dokumen: string;
}

interface GenerateBeritaAcaraParams {
  pihakPertamaNama: string;
  pihakPertamaEmail: string;
  pihakKeduaNama: string;
  items: PeminjamanItem[];
}

// Convert number to Indonesian words
const angkaKeKata = (num: number): string => {
  const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  
  if (num < 12) return satuan[num];
  if (num < 20) return angkaKeKata(num - 10) + " belas";
  if (num < 100) return angkaKeKata(Math.floor(num / 10)) + " puluh " + angkaKeKata(num % 10);
  if (num < 200) return "seratus " + angkaKeKata(num - 100);
  if (num < 1000) return angkaKeKata(Math.floor(num / 100)) + " ratus " + angkaKeKata(num % 100);
  if (num < 2000) return "seribu " + angkaKeKata(num - 1000);
  if (num < 1000000) return angkaKeKata(Math.floor(num / 1000)) + " ribu " + angkaKeKata(num % 1000);
  return num.toString();
};

// Format date to Indonesian text
const formatTanggalTeks = (date: Date): string => {
  const hari = format(date, "EEEE", { locale: id });
  const tanggal = angkaKeKata(date.getDate()).trim();
  const bulan = format(date, "MMMM", { locale: id });
  const tahun = format(date, "yyyy");
  const tahunTeks = `tahun ${angkaKeKata(parseInt(tahun.substring(0, 2)))} ribu ${angkaKeKata(parseInt(tahun.substring(2)))}`.trim();
  
  return `${hari} tanggal ${tanggal} bulan ${bulan} ${tahunTeks}`;
};

export const generateBeritaAcaraPeminjaman = async (params: GenerateBeritaAcaraParams) => {
  const { pihakPertamaNama, pihakPertamaEmail, pihakKeduaNama, items } = params;
  const today = new Date();
  const tanggalFormatted = format(today, "dd MMMM yyyy", { locale: id });
  const nomorBA = `BA-${format(today, "dd")}/KBC.${format(today, "MMddyyyy")}/${today.getFullYear()}`;

  // Create document header paragraphs
  const headerParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "KEMENTERIAN KEUANGAN REPUBLIK INDONESIA", bold: true, size: 24 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "DIREKTORAT JENDERAL BEA DAN CUKAI", bold: true, size: 24 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I", bold: true, size: 22 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "JALAN RAYA BANDARA JUANDA NOMOR 39, DESA SEMAMBUNG, SIDOARJO 61254", size: 18, italics: true }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "TELEPON (031) 8675356; FAKSIMILE (031) 8675335; LAMAN kanwiljatim1.beacukai.go.id", size: 16, italics: true }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "PUSAT KONTAK LAYANAN 1500225; SUREL kwbcjatim1@customs.go.id", size: 16, italics: true }),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: "" })],
    }),
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.DOUBLE, size: 6, color: "000000" },
      },
      children: [new TextRun({ text: "" })],
    }),
    new Paragraph({
      children: [new TextRun({ text: "" })],
    }),
  ];

  // Title
  const titleParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "BERITA ACARA PEMINJAMAN ARSIP INAKTIF", bold: true, size: 28 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: `NOMOR ${nomorBA}`, bold: true, size: 24 }),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: "" })],
    }),
  ];

  // Body content
  const bodyParagraphs = [
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `Pada hari ini, ${formatTanggalTeks(today)}, kami yang bertanda tangan di bawah ini :`, size: 24 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "1.    Nama", size: 24 }),
        new TextRun({ text: "\t\t: ", size: 24 }),
        new TextRun({ text: pihakPertamaNama, size: 24 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "       Email", size: 24 }),
        new TextRun({ text: "\t\t: ", size: 24 }),
        new TextRun({ text: pihakPertamaEmail, size: 24 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "       Jabatan", size: 24 }),
        new TextRun({ text: "\t\t: ", size: 24 }),
        new TextRun({ text: "Petugas Arsip", size: 24 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "dalam hal ini bertindak untuk dan atas nama Kepala Subbagian Umum selaku Kepala Unit Kearsipan, yang selanjutnya disebut sebagai ", size: 24 }),
        new TextRun({ text: "PIHAK PERTAMA.", bold: true, size: 24 }),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: "" })],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "2.    Nama", size: 24 }),
        new TextRun({ text: "\t\t: ", size: 24 }),
        new TextRun({ text: pihakKeduaNama, size: 24 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "       Jabatan", size: 24 }),
        new TextRun({ text: "\t\t: ", size: 24 }),
        new TextRun({ text: "Peminjam Arsip", size: 24 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "dalam hal ini bertindak sebagai peminjam arsip inaktif, yang selanjutnya disebut ", size: 24 }),
        new TextRun({ text: "PIHAK KEDUA.", bold: true, size: 24 }),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: "" })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "Menyatakan bahwa PIHAK PERTAMA telah menyerahkan arsip inaktif kepada PIHAK KEDUA dan PIHAK KEDUA telah menerima arsip inaktif sebagaimana tersebut dalam Daftar Arsip Inaktif yang Dipinjam terlampir untuk dipinjam dan dipergunakan sebagaimana mestinya.", size: 24 }),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: "" })],
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({ text: "Demikian Berita Acara ini dibuat dengan sesungguhnya dan penuh rasa tanggung jawab.", size: 24 }),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: "" })],
    }),
  ];

  // Signature section
  const signatureParagraphs = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `Surabaya, ${tanggalFormatted}`, size: 24 }),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: "" })],
    }),
    new Table({
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
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "Yang Menerima", size: 24 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "PIHAK KEDUA,", bold: true, size: 24 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "Yang Menyerahkan", size: 24 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "PIHAK PERTAMA,", bold: true, size: 24 })],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: "" })] }),
                new Paragraph({ children: [new TextRun({ text: "" })] }),
                new Paragraph({ children: [new TextRun({ text: "" })] }),
                new Paragraph({ children: [new TextRun({ text: "" })] }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: "" })] }),
                new Paragraph({ children: [new TextRun({ text: "" })] }),
                new Paragraph({ children: [new TextRun({ text: "" })] }),
                new Paragraph({ children: [new TextRun({ text: "" })] }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: pihakKeduaNama, size: 24, underline: {} })],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: pihakPertamaNama, size: 24, underline: {} })],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  // Create Lampiran (Attachment) - Daftar Arsip Inaktif
  const lampiranParagraphs = [
    new Paragraph({
      pageBreakBefore: true,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "LAMPIRAN", bold: true, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Berita Acara Peminjaman Arsip Inaktif", size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Kantor Wilayah DJBC Jawa Timur I", size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 200 },
      children: [
        new TextRun({ text: "Nomor", size: 22 }),
        new TextRun({ text: `\t\t: ${nomorBA}`, size: 22 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: "Tanggal", size: 22 }),
        new TextRun({ text: `\t\t: ${tanggalFormatted}`, size: 22 }),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: "" })],
    }),
  ];

  // Create table for items
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "No", bold: true, size: 20 })] })],
          width: { size: 5, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Nama Dokumen", bold: true, size: 20 })] })],
          width: { size: 35, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Kode Klasifikasi", bold: true, size: 20 })] })],
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "No Boks", bold: true, size: 20 })] })],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tahun", bold: true, size: 20 })] })],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Pemilik", bold: true, size: 20 })] })],
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
    ...items.map((item, index) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (index + 1).toString(), size: 20 })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: item.nama_dokumen, size: 20 })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: item.kode_klasifikasi, size: 20 })] })],
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.nomor_boks, size: 20 })] })],
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.tahun_dokumen, size: 20 })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: item.pemilik_dokumen, size: 20 })] })],
          }),
        ],
      })
    ),
  ];

  const itemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });

  // Create the document
  const doc = new Document({
    sections: [
      {
        children: [
          ...headerParagraphs,
          ...titleParagraphs,
          ...bodyParagraphs,
          ...signatureParagraphs,
          ...lampiranParagraphs,
          itemsTable,
        ],
      },
    ],
  });

  // Generate and save
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Berita_Acara_Peminjaman_Arsip_${format(today, "ddMMyyyy")}.docx`);
};
