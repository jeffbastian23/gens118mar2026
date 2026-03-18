import { 
  Document, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, 
  WidthType, BorderStyle, UnderlineType, convertInchesToTwip, Packer
} from "docx";
import { saveAs } from "file-saver";

/**
 * Creates ST template for assignments with ≤5 employees
 * Uses docxtemplater placeholders in format: {placeholder}
 */
export async function createSTTemplateSmallGroup() {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.79),
            right: convertInchesToTwip(0.79),
            bottom: convertInchesToTwip(0.79),
            left: convertInchesToTwip(0.79),
          },
        },
      },
      children: [
        // Header - Kementerian Info
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "KEMENTERIAN KEUANGAN REPUBLIK INDONESIA",
              bold: true,
              size: 24,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "DIREKTORAT JENDERAL BEA DAN CUKAI",
              bold: true,
              size: 24,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I",
              bold: true,
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "JALAN RAYA BANDARA JUANDA NOMOR 39, DESA SEMAMBUNG, SIDOARJO 61254",
              size: 18,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "TELEPON (031) 8675356; FAKSIMILE (031) 8675335; LAMAN kanwiljatim1.beacukai.go.id",
              size: 18,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "PUSAT KONTAK LAYANAN 1500225; SUREL kwbcjatim1@customs.go.id",
              size: 18,
            }),
          ],
        }),
        
        // Horizontal line
        new Paragraph({
          border: {
            bottom: {
              color: "000000",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        // Title - SURAT TUGAS
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "SURAT TUGAS",
              bold: true,
              underline: {
                type: UnderlineType.SINGLE,
              },
              size: 28,
            }),
          ],
        }),
        
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "NOMOR {Nomor ST}",
              size: 22,
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        // Body paragraph - Konsideran
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: "Sehubungan dengan {Dasar Penugasan} {Nomor Naskah Dinas} tanggal {Tanggal Naskah Dinas} {Perihal}, kami menugasi:",
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        // Employee list - Manual entries for up to 5 employees
        // Employee 1
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
                  width: { size: 5, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "1." })],
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "nama" })],
                }),
                new TableCell({
                  width: { size: 2, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: ":" })],
                }),
                new TableCell({
                  width: { size: 63, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "{Nama Pegawai 1}" })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "" })] }),
                new TableCell({ children: [new Paragraph({ text: "pangkat/gol. ruang" })],}),
                new TableCell({ children: [new Paragraph({ text: ":" })], }),
                new TableCell({ children: [new Paragraph({ text: "{Pangkat Pegawai 1}" })], }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "" })] }),
                new TableCell({ children: [new Paragraph({ text: "jabatan" })], }),
                new TableCell({ children: [new Paragraph({ text: ":" })], }),
                new TableCell({ children: [new Paragraph({ text: "{Jabatan Pegawai 1}" })], }),
              ],
            }),
          ],
        }),
        
        // Employee 2
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
                  width: { size: 5, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "2." })],
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "nama" })],
                }),
                new TableCell({
                  width: { size: 2, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: ":" })],
                }),
                new TableCell({
                  width: { size: 63, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "{Nama Pegawai 2}" })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "" })] }),
                new TableCell({ children: [new Paragraph({ text: "pangkat/gol. ruang" })], }),
                new TableCell({ children: [new Paragraph({ text: ":" })], }),
                new TableCell({ children: [new Paragraph({ text: "{Pangkat Pegawai 2}" })], }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "" })] }),
                new TableCell({ children: [new Paragraph({ text: "jabatan" })], }),
                new TableCell({ children: [new Paragraph({ text: ":" })], }),
                new TableCell({ children: [new Paragraph({ text: "{Jabatan Pegawai 2}" })], }),
              ],
            }),
          ],
        }),
        
        // Employee 3
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
                  width: { size: 5, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "3." })],
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "nama" })],
                }),
                new TableCell({
                  width: { size: 2, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: ":" })],
                }),
                new TableCell({
                  width: { size: 63, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "{Nama Pegawai 3}" })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "" })] }),
                new TableCell({ children: [new Paragraph({ text: "pangkat/gol. ruang" })], }),
                new TableCell({ children: [new Paragraph({ text: ":" })], }),
                new TableCell({ children: [new Paragraph({ text: "{Pangkat Pegawai 3}" })], }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "" })] }),
                new TableCell({ children: [new Paragraph({ text: "jabatan" })], }),
                new TableCell({ children: [new Paragraph({ text: ":" })], }),
                new TableCell({ children: [new Paragraph({ text: "{Jabatan Pegawai 3}" })], }),
              ],
            }),
          ],
        }),

        // Employee 4
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
                  width: { size: 5, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "4." })],
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "nama" })],
                }),
                new TableCell({
                  width: { size: 2, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: ":" })],
                }),
                new TableCell({
                  width: { size: 63, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "{Nama Pegawai 4}" })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "" })] }),
                new TableCell({ children: [new Paragraph({ text: "pangkat/gol. ruang" })], }),
                new TableCell({ children: [new Paragraph({ text: ":" })], }),
                new TableCell({ children: [new Paragraph({ text: "{Pangkat Pegawai 4}" })], }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "" })] }),
                new TableCell({ children: [new Paragraph({ text: "jabatan" })], }),
                new TableCell({ children: [new Paragraph({ text: ":" })], }),
                new TableCell({ children: [new Paragraph({ text: "{Jabatan Pegawai 4}" })], }),
              ],
            }),
          ],
        }),

        // Employee 5
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
                  width: { size: 5, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "5." })],
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "nama" })],
                }),
                new TableCell({
                  width: { size: 2, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: ":" })],
                }),
                new TableCell({
                  width: { size: 63, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "{Nama Pegawai 5}" })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "" })] }),
                new TableCell({ children: [new Paragraph({ text: "pangkat/gol. ruang" })], }),
                new TableCell({ children: [new Paragraph({ text: ":" })], }),
                new TableCell({ children: [new Paragraph({ text: "{Pangkat Pegawai 5}" })], }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "" })] }),
                new TableCell({ children: [new Paragraph({ text: "jabatan" })], }),
                new TableCell({ children: [new Paragraph({ text: ":" })], }),
                new TableCell({ children: [new Paragraph({ text: "{Jabatan Pegawai 5}" })], }),
              ],
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        // Assignment details
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: "Untuk {Tujuan Penugasan} yang dilaksanakan pada:",
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        // Assignment details table
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
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "hari, tanggal" })],
                }),
                new TableCell({
                  width: { size: 2, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: ":" })],
                }),
                new TableCell({
                  width: { size: 73, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "{Tanggal Kegiatan}" })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: "waktu" })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: ":" })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: "{Waktu Penugasan}" })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: "tempat" })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: ":" })],
                }),
                new TableCell({
                  children: [
                    new Paragraph({ text: "{Tempat Penugasan}" }),
                    new Paragraph({ text: "{Alamat Penugasan}" }),
                  ],
                }),
              ],
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        // Conditional DIPA text - placeholder
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: "{Kalimat Biaya DIPA}",
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: "Setelah selesai melaksanakan penugasan wajib menyampaikan laporan kepada Kepala Kantor Wilayah DJBC Jawa Timur I.",
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        new Paragraph({ text: "" }), // Spacing
        
        // Signature section
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
                  children: [new Paragraph({ text: "" })],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Sidoarjo, {Tanggal Surat}" })],
                      alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "{Signature Line 1}" })],
                      alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "{Signature Line 2}" })],
                      alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "{Signature Line 3}" })],
                      alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "{Signature Line 4}" })],
                      alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "{Signature Line 5}" })],
                      alignment: AlignmentType.LEFT,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        new Paragraph({ text: "" }), // Spacing
        new Paragraph({ text: "" }), // Spacing
        
        // Electronic signature note
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Ditandatangani secara elektronik",
              italics: true,
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        // Signatory details
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
                  children: [new Paragraph({ text: "" })],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "{Pejabat Penandatangan}", bold: true })],
                      alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "NIP. {NIP Pejabat}" })],
                      alignment: AlignmentType.LEFT,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        new Paragraph({ text: "" }), // Spacing
        
        // Tembusan
        new Paragraph({
          children: [
            new TextRun({
              text: "Tembusan:",
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          text: "1. Kepala Bidang Kepatuhan Internal",
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "ST_Kegiatan_kurang_dari_sama_dengan_5_pegawai.docx");
}

/**
 * Download ST template for small group assignments (≤5 employees)
 */
export async function downloadSTTemplateSmallGroup() {
  await createSTTemplateSmallGroup();
}

/**
 * Creates ST template for assignments with >5 employees
 * Uses docxtemplater placeholders with loop syntax
 */
export async function createSTTemplateLargeGroup() {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.79),
            right: convertInchesToTwip(0.79),
            bottom: convertInchesToTwip(0.79),
            left: convertInchesToTwip(0.79),
          },
        },
      },
      children: [
        // Header - Kementerian Info
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "KEMENTERIAN KEUANGAN REPUBLIK INDONESIA",
              bold: true,
              size: 24,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "DIREKTORAT JENDERAL BEA DAN CUKAI",
              bold: true,
              size: 24,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I",
              bold: true,
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "JALAN RAYA BANDARA JUANDA NOMOR 39, DESA SEMAMBUNG, SIDOARJO 61254",
              size: 18,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "TELEPON (031) 8675356; FAKSIMILE (031) 8675335; LAMAN kanwiljatim1.beacukai.go.id",
              size: 18,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "PUSAT KONTAK LAYANAN 1500225; SUREL kwbcjatim1@customs.go.id",
              size: 18,
            }),
          ],
        }),
        
        // Horizontal line
        new Paragraph({
          border: {
            bottom: {
              color: "000000",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        // Title - SURAT TUGAS
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "SURAT TUGAS",
              bold: true,
              underline: {
                type: UnderlineType.SINGLE,
              },
              size: 28,
            }),
          ],
        }),
        
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "NOMOR {Nomor ST}",
              size: 22,
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        // Body paragraph - Konsideran
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: "Sehubungan dengan {Dasar Penugasan} {Nomor Naskah Dinas} tanggal {Tanggal Naskah Dinas} {Perihal}, kami menugasi:",
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        // Employee table with loop
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Header row
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 5, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "No", bold: true })],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Nama", bold: true })],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Pangkat/Gol. Ruang", bold: true })],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Jabatan", bold: true })],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
              ],
            }),
            // Loop row - docxtemplater will expand this
            // Note: Loop syntax wraps the entire row for proper table loop
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      text: "{#employees}{index}",
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
                new TableCell({
                  children: [new Paragraph({ text: "{nama}" })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: "{pangkat}" })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: "{jabatan}{/employees}" })],
                }),
              ],
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        // Assignment details
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: "Untuk {Tujuan Penugasan} yang dilaksanakan pada:",
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        // Assignment details table
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
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "hari, tanggal" })],
                }),
                new TableCell({
                  width: { size: 2, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: ":" })],
                }),
                new TableCell({
                  width: { size: 73, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: "{Tanggal Kegiatan}" })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: "waktu" })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: ":" })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: "{Waktu Penugasan}" })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: "tempat" })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: ":" })],
                }),
                new TableCell({
                  children: [
                    new Paragraph({ text: "{Tempat Penugasan}" }),
                    new Paragraph({ text: "{Alamat Penugasan}" }),
                  ],
                }),
              ],
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        // Conditional DIPA text - placeholder
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: "{Kalimat Biaya DIPA}",
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: "Setelah selesai melaksanakan penugasan wajib menyampaikan laporan kepada Kepala Kantor Wilayah DJBC Jawa Timur I.",
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        new Paragraph({ text: "" }), // Spacing
        
        // Signature section
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
                  children: [new Paragraph({ text: "" })],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Sidoarjo, {Tanggal Surat}" })],
                      alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "{Signature Line 1}" })],
                      alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "{Signature Line 2}" })],
                      alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "{Signature Line 3}" })],
                      alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "{Signature Line 4}" })],
                      alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "{Signature Line 5}" })],
                      alignment: AlignmentType.LEFT,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        new Paragraph({ text: "" }), // Spacing
        new Paragraph({ text: "" }), // Spacing
        
        // Electronic signature note
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Ditandatangani secara elektronik",
              italics: true,
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        
        // Signatory details
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
                  children: [new Paragraph({ text: "" })],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "{Pejabat Penandatangan}", bold: true })],
                      alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "NIP. {NIP Pejabat}" })],
                      alignment: AlignmentType.LEFT,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        
        new Paragraph({ text: "" }), // Spacing
        new Paragraph({ text: "" }), // Spacing
        
        // Tembusan
        new Paragraph({
          children: [
            new TextRun({
              text: "Tembusan:",
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          text: "1. Kepala Bidang Kepatuhan Internal",
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "ST_Kegiatan_lebih_dari_5_pegawai.docx");
}

/**
 * Download ST template for large group assignments (>5 employees)
 */
export async function downloadSTTemplateLargeGroup() {
  await createSTTemplateLargeGroup();
}
