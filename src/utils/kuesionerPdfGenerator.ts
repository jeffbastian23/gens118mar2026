import jsPDF from "jspdf";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// Kuesioner templates based on grade transitions
const KUESIONER_TEMPLATES: Record<string, {
  title: string;
  indicators: { no: number; text: string; levels: { level: number; text: string }[] }[];
  keputusanText: string;
  tidakMemenuhiText: string;
}> = {
  "4-5/5-6": {
    title: "KUESIONER UNTUK PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 4 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 5, ATAU PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 5 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 6",
    indicators: [
      {
        no: 1,
        text: "Kemampuan memahami peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas dan menjadikannya sebagai acuan kerja",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas" },
          { level: 2, text: "Mampu menggunakan peraturan terkait, proses bisnis dan SOP sebagai acuan kerja dalam menyelesaikan pekerjaan" },
          { level: 3, text: "Mampu menganalisis dan mengevaluasi permasalahan pada peraturan terkait, proses bisnis dan SOP yang menjadi acuan kerja" },
        ],
      },
      {
        no: 2,
        text: "Kemampuan menyusun rencana kerja sesuai bidang tugasnya dan memastikan rencana kerja terlaksana",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi tugas-tugas yang harus diselesaikan" },
          { level: 2, text: "Mampu menentukan prioritas atas pekerjaan berdasarkan tingkat kepentingan dan memastikan rencana kerja terlaksana" },
          { level: 3, text: "Mampu melakukan penyesuaian rencana kerja berdasarkan hasil analisis dan evaluasi terhadap kebutuhan organisasi" },
        ],
      },
      {
        no: 3,
        text: "Kemampuan untuk melakukan kerja sama dalam rangka koordinasi dengan atasan, rekan kerja, dan stakeholders",
        levels: [
          { level: 1, text: "Mampu memahami pentingnya kerja sama dengan atasan, rekan kerja, dan stakeholders" },
          { level: 2, text: "Mampu menggunakan kemampuan kerja sama untuk kepentingan tugas jabatan" },
          { level: 3, text: "Mampu menggunakan kemampuan kerja sama untuk kepentingan organisasi" },
        ],
      },
    ],
    keputusanText: "Memenuhi Kemampuan Kerja Pelaksana Umum (3 dari 3 indikator penilaian Kemampuan Kerja Pelaksana bernilai sekurang-kurangnya 2)",
    tidakMemenuhiText: "Tidak memenuhi Kemampuan Kerja Pelaksana Umum (salah satu atau lebih indikator penilaian Kemampuan Kerja Pelaksana bernilai kurang dari 2)",
  },
  "6-7/7-8": {
    title: "KUESIONER UNTUK PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 6 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 7, ATAU PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 7 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 8",
    indicators: [
      {
        no: 1,
        text: "Kemampuan memahami peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas dan menjadikannya sebagai acuan kerja",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas" },
          { level: 2, text: "Mampu menggunakan peraturan terkait, proses bisnis dan SOP sebagai acuan kerja dalam menyelesaikan pekerjaan" },
          { level: 3, text: "Mampu menganalisis dan mengevaluasi permasalahan pada peraturan terkait, proses bisnis dan SOP yang menjadi acuan kerja" },
        ],
      },
      {
        no: 2,
        text: "Kemampuan menggunakan metode/aplikasi/peralatan umum (misal: aplikasi MS Office, komputer, printer, dll)",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi metode/aplikasi/peralatan umum yang dibutuhkan untuk menyelesaikan pekerjaan" },
          { level: 2, text: "Mampu menggunakan metode/aplikasi/peralatan umum yang dibutuhkan untuk menyelesaikan pekerjaan" },
          { level: 3, text: "Mampu menganalisis dan mengevaluasi metode/aplikasi/peralatan umum sesuai bidang tugasnya" },
        ],
      },
      {
        no: 3,
        text: "Kemampuan menyusun rencana kerja sesuai bidang tugasnya dan memastikan rencana kerja terlaksana",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi tugas-tugas yang harus diselesaikan" },
          { level: 2, text: "Mampu menentukan prioritas atas pekerjaan berdasarkan tingkat kepentingan dan memastikan rencana kerja terlaksana" },
          { level: 3, text: "Mampu melakukan penyesuaian rencana kerja berdasarkan hasil analisis dan evaluasi terhadap kebutuhan organisasi" },
        ],
      },
      {
        no: 4,
        text: "Kemampuan untuk melakukan kerja sama dalam rangka koordinasi dengan atasan, rekan kerja, dan stakeholders",
        levels: [
          { level: 1, text: "Mampu memahami pentingnya kerja sama dengan atasan, rekan kerja, dan stakeholders" },
          { level: 2, text: "Mampu menggunakan kemampuan kerja sama untuk kepentingan tugas jabatan" },
          { level: 3, text: "Mampu menggunakan kemampuan kerja sama untuk kepentingan organisasi" },
        ],
      },
    ],
    keputusanText: "Memenuhi Kemampuan Kerja Pelaksana Umum (4 dari 4 indikator penilaian Kemampuan Kerja Pelaksana bernilai sekurang-kurangnya 2)",
    tidakMemenuhiText: "Tidak memenuhi Kemampuan Kerja Pelaksana Umum (salah satu atau lebih indikator penilaian Kemampuan Kerja Pelaksana bernilai kurang dari 2)",
  },
  "8-9/9-10": {
    title: "KUESIONER UNTUK PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 8 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 9, ATAU PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 9 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 10",
    indicators: [
      {
        no: 1,
        text: "Kemampuan memahami peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas dan menjadikannya sebagai acuan kerja",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas" },
          { level: 2, text: "Mampu menggunakan peraturan terkait, proses bisnis dan SOP sebagai acuan kerja dalam menyelesaikan pekerjaan" },
          { level: 3, text: "Mampu menganalisis dan mengevaluasi permasalahan pada peraturan terkait, proses bisnis dan SOP yang menjadi acuan kerja" },
        ],
      },
      {
        no: 2,
        text: "Kemampuan menggunakan metode/aplikasi/peralatan khusus (misal: aplikasi SPAN, ABK, SIMAK BMN, APPROWEB, dll)",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi metode/aplikasi/peralatan khusus yang dibutuhkan untuk menyelesaikan pekerjaan" },
          { level: 2, text: "Mampu menggunakan metode/aplikasi/peralatan khusus yang dibutuhkan untuk menyelesaikan pekerjaan" },
          { level: 3, text: "Mampu menganalisis dan mengevaluasi metode/aplikasi/peralatan khusus sesuai bidang tugasnya" },
        ],
      },
      {
        no: 3,
        text: "Kemampuan menyusun rencana kerja sesuai bidang tugasnya dan memastikan rencana kerja terlaksana",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi tugas-tugas yang harus diselesaikan" },
          { level: 2, text: "Mampu menentukan prioritas atas pekerjaan berdasarkan tingkat kepentingan dan memastikan rencana kerja terlaksana" },
          { level: 3, text: "Mampu melakukan penyesuaian rencana kerja berdasarkan hasil analisis dan evaluasi terhadap kebutuhan organisasi" },
        ],
      },
      {
        no: 4,
        text: "Kemampuan untuk melakukan kerja sama dalam rangka koordinasi dengan atasan, rekan kerja, dan stakeholders",
        levels: [
          { level: 1, text: "Mampu memahami pentingnya kerja sama dengan atasan, rekan kerja, dan stakeholders" },
          { level: 2, text: "Mampu menggunakan kemampuan kerja sama untuk kepentingan tugas jabatan" },
          { level: 3, text: "Mampu menggunakan kemampuan kerja sama untuk kepentingan organisasi" },
        ],
      },
    ],
    keputusanText: "Memenuhi Kemampuan Kerja Pelaksana Umum (4 dari 4 indikator penilaian Kemampuan Kerja Pelaksana bernilai sekurang-kurangnya 2)",
    tidakMemenuhiText: "Tidak memenuhi Kemampuan Kerja Pelaksana Umum (salah satu atau lebih indikator penilaian Kemampuan Kerja Pelaksana bernilai kurang dari 2)",
  },
  "10-11/11-12": {
    title: "KUESIONER UNTUK PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 10 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 11, ATAU PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 11 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 12",
    indicators: [
      {
        no: 1,
        text: "Kemampuan memahami peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas dan menjadikannya sebagai acuan kerja",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas" },
          { level: 2, text: "Mampu menggunakan peraturan terkait, proses bisnis dan SOP sebagai acuan kerja dalam menyelesaikan pekerjaan" },
          { level: 3, text: "Mampu menganalisis dan mengevaluasi permasalahan pada peraturan terkait, proses bisnis dan SOP yang menjadi acuan kerja" },
        ],
      },
      {
        no: 2,
        text: "Kemampuan menganalisis masalah dan menemukan solusi terbaik",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi dan memperhatikan inti permasalahan sesuai bidang tugasnya" },
          { level: 2, text: "Mampu menemukan solusi atas permasalahan sesuai bidang tugasnya" },
          { level: 3, text: "Mampu menganalisis dampak permasalahan terhadap tugas lain yang berkaitan" },
        ],
      },
      {
        no: 3,
        text: "Kemampuan menyusun rencana kerja sesuai bidang tugasnya dan memastikan rencana kerja terlaksana",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi tugas-tugas yang harus diselesaikan" },
          { level: 2, text: "Mampu menentukan prioritas atas pekerjaan berdasarkan tingkat kepentingan dan memastikan rencana kerja terlaksana" },
          { level: 3, text: "Mampu melakukan penyesuaian rencana kerja berdasarkan hasil analisis dan evaluasi terhadap kebutuhan organisasi" },
        ],
      },
      {
        no: 4,
        text: "Kemampuan untuk melakukan kerja sama dalam rangka koordinasi dengan atasan, rekan kerja, dan stakeholders",
        levels: [
          { level: 1, text: "Mampu memahami pentingnya kerjasama dengan atasan, rekan kerja, dan stakeholders" },
          { level: 2, text: "Mampu menggunakan kemampuan kerjasama untuk kepentingan tugas jabatan" },
          { level: 3, text: "Mampu menggunakan kemampuan kerjasama untuk kepentingan organisasi" },
        ],
      },
    ],
    keputusanText: "Memenuhi Kemampuan Kerja Pelaksana Umum (4 dari 4 indikator penilaian Kemampuan Kerja Pelaksana bernilai sekurang-kurangnya 2)",
    tidakMemenuhiText: "Tidak memenuhi Kemampuan Kerja Pelaksana Umum (salah satu atau lebih indikator penilaian Kemampuan Kerja Pelaksana bernilai kurang dari 2)",
  },
};

interface KuesionerData {
  id: string;
  nama_lengkap: string;
  nip: string | null;
  jenis_kuesioner: string | null;
  jawaban: Record<string, any> | null;
  status: string | null;
}

export const generateKuesionerPdf = (kuesionerData: KuesionerData): void => {
  const template = kuesionerData.jenis_kuesioner ? KUESIONER_TEMPLATES[kuesionerData.jenis_kuesioner] : null;
  if (!template) {
    throw new Error("Template tidak ditemukan");
  }

  const jawaban = kuesionerData.jawaban || {};
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Title
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  const titleLines = pdf.splitTextToSize(template.title, contentWidth);
  pdf.text(titleLines, pageWidth / 2, y, { align: "center" });
  y += titleLines.length * 5 + 10;

  // Lokasi dan Tanggal
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  const lokasi = jawaban.lokasi || ".....................";
  const tanggal = jawaban.tanggal ? format(new Date(jawaban.tanggal), "d MMMM yyyy", { locale: localeId }) : ".................20XX";
  pdf.text(`Lokasi: ${lokasi}`, margin, y);
  y += 5;
  pdf.text(`Tanggal: ${tanggal}`, margin, y);
  y += 8;

  // Employee Info Table
  pdf.setFontSize(9);
  const infoData = [
    ["Nama Pelaksana", kuesionerData.nama_lengkap],
    ["NIP Pelaksana", kuesionerData.nip || "-"],
    ["Peringkat Saat Ini", jawaban.peringkat_saat_ini || "-"],
    ["Jabatan Saat Ini", jawaban.jabatan_saat_ini || "-"],
    ["Pangkat/Golongan Saat Ini", jawaban.pangkat_golongan || "-"],
    ["Pendidikan Saat Ini", jawaban.pendidikan_saat_ini || "-"],
    ["Unit Organisasi", jawaban.unit_organisasi || "-"],
  ];

  infoData.forEach(([label, value]) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(`${label}:`, margin, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(value), margin + 50, y);
    y += 5;
  });
  y += 5;

  // Check for page break
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pdf.internal.pageSize.getHeight() - 20) {
      pdf.addPage();
      y = 20;
    }
  };

  // Indicators Table Header
  checkPageBreak(50);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  
  const colWidths = [8, 45, 35, 35, 35, 22];
  let x = margin;
  
  // Header row
  pdf.rect(x, y, colWidths[0], 15);
  pdf.text("No", x + 2, y + 8);
  x += colWidths[0];
  
  pdf.rect(x, y, colWidths[1], 15);
  const headerText = pdf.splitTextToSize("Indikator Penilaian Kemampuan Kerja Pelaksana Umum", colWidths[1] - 2);
  pdf.text(headerText, x + 2, y + 5);
  x += colWidths[1];
  
  pdf.rect(x, y, colWidths[2], 15);
  pdf.text("Level 1", x + 2, y + 8);
  x += colWidths[2];
  
  pdf.rect(x, y, colWidths[3], 15);
  pdf.text("Level 2", x + 2, y + 8);
  x += colWidths[3];
  
  pdf.rect(x, y, colWidths[4], 15);
  pdf.text("Level 3", x + 2, y + 8);
  x += colWidths[4];
  
  pdf.rect(x, y, colWidths[5], 15);
  pdf.text("Bukti", x + 2, y + 8);
  
  y += 15;

  // Indicator rows
  pdf.setFont("helvetica", "normal");
  const indicatorAnswers = jawaban.indicator_answers || {};
  const buktiKerja = jawaban.bukti_kerja || {};

  template.indicators.forEach((indicator) => {
    checkPageBreak(40);
    
    // Calculate row height based on content
    const indicatorText = pdf.splitTextToSize(indicator.text, colWidths[1] - 4);
    const level1Text = pdf.splitTextToSize(indicator.levels[0]?.text || "", colWidths[2] - 4);
    const level2Text = pdf.splitTextToSize(indicator.levels[1]?.text || "", colWidths[3] - 4);
    const level3Text = pdf.splitTextToSize(indicator.levels[2]?.text || "", colWidths[4] - 4);
    
    const maxLines = Math.max(
      indicatorText.length,
      level1Text.length,
      level2Text.length,
      level3Text.length
    );
    const rowHeight = Math.max(20, maxLines * 4 + 8);
    
    x = margin;
    
    // No
    pdf.rect(x, y, colWidths[0], rowHeight);
    pdf.text(String(indicator.no), x + 2, y + 5);
    x += colWidths[0];
    
    // Indicator text
    pdf.rect(x, y, colWidths[1], rowHeight);
    pdf.text(indicatorText, x + 2, y + 5);
    x += colWidths[1];
    
    // Level 1
    pdf.rect(x, y, colWidths[2], rowHeight);
    const selectedLevel = indicatorAnswers[indicator.no];
    if (selectedLevel === 1) {
      pdf.setFillColor(200, 255, 200);
      pdf.rect(x + 1, y + 1, colWidths[2] - 2, rowHeight - 2, "F");
    }
    pdf.text(level1Text, x + 2, y + 5);
    x += colWidths[2];
    
    // Level 2
    pdf.rect(x, y, colWidths[3], rowHeight);
    if (selectedLevel === 2) {
      pdf.setFillColor(200, 255, 200);
      pdf.rect(x + 1, y + 1, colWidths[3] - 2, rowHeight - 2, "F");
    }
    pdf.text(level2Text, x + 2, y + 5);
    x += colWidths[3];
    
    // Level 3
    pdf.rect(x, y, colWidths[4], rowHeight);
    if (selectedLevel === 3) {
      pdf.setFillColor(200, 255, 200);
      pdf.rect(x + 1, y + 1, colWidths[4] - 2, rowHeight - 2, "F");
    }
    pdf.text(level3Text, x + 2, y + 5);
    x += colWidths[4];
    
    // Bukti
    pdf.rect(x, y, colWidths[5], rowHeight);
    const bukti = buktiKerja[indicator.no] || "-";
    const buktiText = pdf.splitTextToSize(bukti, colWidths[5] - 4);
    pdf.text(buktiText, x + 2, y + 5);
    
    y += rowHeight;
  });

  y += 10;
  checkPageBreak(40);

  // Keputusan Section
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("Keputusan penilaian Kemampuan Kerja Pelaksana:", margin, y);
  y += 6;
  
  pdf.setFont("helvetica", "normal");
  const keputusan = jawaban.keputusan;
  
  // Memenuhi option
  const memenuhiSymbol = keputusan === "memenuhi" ? "[X]" : "[ ]";
  const memenuhiText = pdf.splitTextToSize(`${memenuhiSymbol} ${template.keputusanText}`, contentWidth);
  pdf.text(memenuhiText, margin, y);
  y += memenuhiText.length * 4 + 3;
  
  // Tidak memenuhi option
  const tidakMemenuhiSymbol = keputusan === "tidak_memenuhi" ? "[X]" : "[ ]";
  const tidakMemenuhiTextLines = pdf.splitTextToSize(`${tidakMemenuhiSymbol} ${template.tidakMemenuhiText}`, contentWidth);
  pdf.text(tidakMemenuhiTextLines, margin, y);
  y += tidakMemenuhiTextLines.length * 4 + 15;

  checkPageBreak(60);

  // Signature Section
  const sigY = y;
  const sigWidth = (contentWidth - 20) / 2;
  
  // Left - Atasan dari Atasan Langsung
  pdf.setFont("helvetica", "bold");
  pdf.text("Mengetahui:", margin, sigY);
  pdf.setFont("helvetica", "normal");
  pdf.text("Atasan dari Atasan Langsung", margin, sigY + 20);
  
  // 7 line spacing (approximately 35 units)
  const signatureSpacing = 35;
  
  // "Ditandatangani secara elektronik" text in gray
  pdf.setTextColor(128, 128, 128);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "italic");
  pdf.text("Ditandatangani secara elektronik", margin, sigY + 20 + signatureSpacing);
  
  // Reset to normal text
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  
  pdf.text(jawaban.atasan_dari_atasan_nama || ".................................", margin, sigY + 20 + signatureSpacing + 8);
  pdf.line(margin, sigY + 20 + signatureSpacing + 9, margin + sigWidth - 10, sigY + 20 + signatureSpacing + 9);
  pdf.text(`NIP ${jawaban.atasan_dari_atasan_nip || "................................."}`, margin, sigY + 20 + signatureSpacing + 16);
  
  // Right - Atasan Langsung
  const rightX = margin + sigWidth + 20;
  const lokasiTanggal = `${lokasi}, ${tanggal}`;
  pdf.text(lokasiTanggal, rightX, sigY);
  pdf.text("Atasan Langsung", rightX, sigY + 20);
  
  // "Ditandatangani secara elektronik" text in gray
  pdf.setTextColor(128, 128, 128);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "italic");
  pdf.text("Ditandatangani secara elektronik", rightX, sigY + 20 + signatureSpacing);
  
  // Reset to normal text
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  
  pdf.text(jawaban.atasan_langsung_nama || ".................................", rightX, sigY + 20 + signatureSpacing + 8);
  pdf.line(rightX, sigY + 20 + signatureSpacing + 9, rightX + sigWidth - 10, sigY + 20 + signatureSpacing + 9);
  pdf.text(`NIP ${jawaban.atasan_langsung_nip || "................................."}`, rightX, sigY + 20 + signatureSpacing + 16);

  // Save PDF
  const fileName = `Kuesioner_${kuesionerData.nama_lengkap.replace(/\s+/g, "_")}_${kuesionerData.jenis_kuesioner}.pdf`;
  pdf.save(fileName);
};
