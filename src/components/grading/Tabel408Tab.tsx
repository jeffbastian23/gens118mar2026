import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";

// Color coding based on grade
const getGradeColor = (grade: number): string => {
  if (grade >= 12) return "bg-purple-600 text-white";
  if (grade >= 11) return "bg-purple-500 text-white";
  if (grade >= 10) return "bg-indigo-500 text-white";
  if (grade >= 9) return "bg-blue-500 text-white";
  if (grade >= 8) return "bg-cyan-500 text-white";
  if (grade >= 7) return "bg-teal-500 text-white";
  if (grade >= 6) return "bg-green-500 text-white";
  if (grade >= 5) return "bg-lime-500 text-white";
  if (grade >= 4) return "bg-yellow-500 text-black";
  return "bg-gray-400 text-white";
};

// Helper function to normalize education level display
// DI→D1, DII→D2, DIII→D3, DIV→D4, SLTA Sederajat→SMA, DIV/S1→D4/S1
const normalizePendidikan = (pendidikan: string): string => {
  if (!pendidikan) return "";
  return pendidikan
    .replace(/DIV\/S1/gi, "D4/S1")
    .replace(/DIII/gi, "D3")
    .replace(/DII/gi, "D2")
    .replace(/DIV/gi, "D4")
    .replace(/DI/gi, "D1")
    .replace(/SLTA Sederajat/gi, "SMA")
    .replace(/SLTA sederajat/gi, "SMA")
    .replace(/SLTA/gi, "SMA");
};

interface JabatanRow {
  no?: number;
  jabatan1?: string;
  gol1?: string;
  pendidikan1?: string;
  jabatan2?: string;
  gol2?: string;
  pendidikan2?: string;
  jabatan3?: string;
  gol3?: string;
  pendidikan3?: string;
  grade?: number;
}

interface SectionData {
  title: string;
  isEselonIII?: boolean; // Bidang/Bagian
  isEselonIV?: boolean;  // Subbagian/Seksi
  rows: JabatanRow[];
}

interface UnitKerjaData {
  header: string;
  subtitle?: string;
  sections: SectionData[];
}

// Tabel Header Component
const TabelHeader = () => (
  <tr className="bg-blue-900 text-white text-xs">
    <th className="border border-gray-300 px-2 py-2 text-center w-10">NO.</th>
    <th className="border border-gray-300 px-2 py-2 text-center min-w-[180px]">NAMA JABATAN</th>
    <th className="border border-gray-300 px-2 py-2 text-center w-24">GOL./RUANG MINIMAL</th>
    <th className="border border-gray-300 px-2 py-2 text-center w-24">PENDIDIKAN MINIMAL</th>
    <th className="border border-gray-300 px-2 py-2 text-center min-w-[180px]">NAMA JABATAN</th>
    <th className="border border-gray-300 px-2 py-2 text-center w-24">GOL./RUANG MINIMAL</th>
    <th className="border border-gray-300 px-2 py-2 text-center w-24">PENDIDIKAN MINIMAL</th>
    <th className="border border-gray-300 px-2 py-2 text-center min-w-[180px]">NAMA JABATAN</th>
    <th className="border border-gray-300 px-2 py-2 text-center w-24">GOL./RUANG MINIMAL</th>
    <th className="border border-gray-300 px-2 py-2 text-center w-24">PENDIDIKAN MINIMAL</th>
    <th className="border border-gray-300 px-2 py-2 text-center w-20">PERINGKAT JABATAN</th>
  </tr>
);

// Section Row Component
const SectionRow = ({ section }: { section: SectionData }) => (
  <>
    <tr className="bg-gray-100">
      <td colSpan={11} className="border border-gray-300 px-2 py-2 text-center font-semibold text-sm">
        {section.title}
      </td>
    </tr>
    {section.rows.map((row, idx) => (
      <tr key={idx} className="hover:bg-gray-50">
        <td className="border border-gray-300 px-2 py-1 text-center text-xs">{row.no || ""}</td>
        <td className="border border-gray-300 px-2 py-1 text-xs">{row.jabatan1 || ""}</td>
        <td className="border border-gray-300 px-2 py-1 text-center text-xs text-red-600 underline">{row.gol1 || ""}</td>
        <td className="border border-gray-300 px-2 py-1 text-center text-xs">{normalizePendidikan(row.pendidikan1 || "")}</td>
        <td className="border border-gray-300 px-2 py-1 text-xs">{row.jabatan2 || ""}</td>
        <td className="border border-gray-300 px-2 py-1 text-center text-xs text-red-600 underline">{row.gol2 || ""}</td>
        <td className="border border-gray-300 px-2 py-1 text-center text-xs">{normalizePendidikan(row.pendidikan2 || "")}</td>
        <td className="border border-gray-300 px-2 py-1 text-xs">{row.jabatan3 || ""}</td>
        <td className="border border-gray-300 px-2 py-1 text-center text-xs text-red-600 underline">{row.gol3 || ""}</td>
        <td className="border border-gray-300 px-2 py-1 text-center text-xs">{normalizePendidikan(row.pendidikan3 || "")}</td>
        <td className={`border border-gray-300 px-2 py-1 text-center text-xs font-bold ${row.grade ? getGradeColor(row.grade) : ""}`}>
          {row.grade || ""}
        </td>
      </tr>
    ))}
  </>
);

// Unit Kerja Table Component
const UnitKerjaTable = ({ unitKerja }: { unitKerja: UnitKerjaData }) => (
  <Card className="mb-6">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-bold text-blue-900 underline">{unitKerja.header}</CardTitle>
      {unitKerja.subtitle && (
        <p className="text-xs text-gray-600 italic">{unitKerja.subtitle}</p>
      )}
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <TabelHeader />
          </thead>
          <tbody>
            {unitKerja.sections.map((section, idx) => (
              <SectionRow key={idx} section={section} />
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

// Data for Kanwil DJBC (14. KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI)
const kanwilData: UnitKerjaData = {
  header: "14. KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI 1A)",
  subtitle: "ex Kantor Wilayah Direktorat Jenderal Bea dan Cukai Jawa Timur I",
  sections: [
    {
      title: "Bagian Umum",
      isEselonIII: true,
      rows: []
    },
    {
      title: "Subbagian Kepegawaian",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Subbagian Rumah Tangga",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Subbagian Tata Usaha dan Keuangan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
        { no: 9, jabatan1: "Penata Keprotokolan Tk.III:\na. Sekretaris Eselon II dengan masa kerja paling sedikit 4 tahun\nb. Pengemudi Eselon II dengan masa kerja paling sedikit 4 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 10, jabatan1: "Penata Keprotokolan Tk.IV:\na. Sekretaris Eselon II dengan masa kerja paling sedikit 2 tahun\nb. Pengemudi Eselon II dengan masa kerja paling sedikit 2 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 11, jabatan1: "Penata Keprotokolan Tk.V:\na. Sekretaris Eselon II dengan masa kerja kurang dari 2 tahun\nb. Pengemudi Eselon II dengan masa kerja kurang dari 2 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 8 },
      ]
    },
    {
      title: "Bidang Kepabeanan dan Cukai",
      isEselonIII: true,
      rows: []
    },
    {
      title: "Seksi Pemeriksaan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Keberatan dan Banding",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Penerimaan dan Pengelolaan Data",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Bantuan Hukum",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Bidang Fasilitas Kepabeanan dan Cukai",
      isEselonIII: true,
      rows: []
    },
    {
      title: "Seksi Perijinan dan Fasilitas",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Bimbingan Kepatuhan dan Hubungan Masyarakat",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Bidang Penindakan dan Penyidikan",
      isEselonIII: true,
      rows: []
    },
    {
      title: "Seksi Intelijen",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Penindakan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Narkotika dan Barang Larangan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Penyidikan dan Barang Hasil Penindakan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Bidang Kepatuhan Internal",
      isEselonIII: true,
      rows: []
    },
    {
      title: "Seksi Kepatuhan Pelaksanaan Tugas Pelayanan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
      ]
    },
    {
      title: "Seksi Kepatuhan Pelaksanaan Tugas Pengawasan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
      ]
    },
    {
      title: "Seksi Kepatuhan Pelaksanaan Tugas Administrasi",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
      ]
    },
  ]
};

// Data for KPPBC Tipe Madya Pabean (22. KANTOR PENGAWASAN DAN PELAYANAN BEA DAN CUKAI TIPE MADYA PABEAN)
const kppbcMadyaPabeanData: UnitKerjaData = {
  header: "22. KANTOR PENGAWASAN DAN PELAYANAN BEA DAN CUKAI TIPE MADYA PABEAN",
  subtitle: "ex Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Tanjung Perak & Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Juanda",
  sections: [
    {
      title: "Subbagian Umum",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
        { no: 9, jabatan1: "Penata Keprotokolan Tk.III:\na. Sekretaris Eselon II dengan masa kerja paling sedikit 4 tahun\nb. Pengemudi Eselon II dengan masa kerja paling sedikit 4 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 10, jabatan1: "Penata Keprotokolan Tk.IV:\na. Sekretaris Eselon II dengan masa kerja paling sedikit 2 tahun\nb. Pengemudi Eselon II dengan masa kerja paling sedikit 2 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 11, jabatan1: "Penata Keprotokolan Tk.V:\na. Sekretaris Eselon II dengan masa kerja kurang dari 2 tahun\nb. Pengemudi Eselon II dengan masa kerja kurang dari 2 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 8 },
      ]
    },
    {
      title: "Seksi Penindakan dan Penyidikan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Administrasi Manifes",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Perbendaharaan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I/Juru Sita Keuangan Negara Tk. II", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II/Juru Sita Keuangan Negara Tk. III", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I/Juru Sita Keuangan Negara Tk. IV", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II/Juru Sita Keuangan Negara Tk. V", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III/Juru Sita Keuangan Negara Tk. VI", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Pelayanan Kepabeanan dan Cukai",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Penyuluhan dan Layanan Informasi",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Kepatuhan Internal",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
      ]
    },
    {
      title: "Seksi Pengolahan Data dan Administrasi Dokumen",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
  ]
};

// Data for KPPBC Tipe Madya Pabean A (24. KANTOR PENGAWASAN DAN PELAYANAN BEA DAN CUKAI TIPE MADYA PABEAN A)
const kppbcMadyaPabeanAData: UnitKerjaData = {
  header: "24. KANTOR PENGAWASAN DAN PELAYANAN BEA DAN CUKAI TIPE MADYA PABEAN A",
  subtitle: "ex Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean A Pasuruan",
  sections: [
    {
      title: "Subbagian Umum",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
        { no: 9, jabatan1: "Penata Keprotokolan Tk.III:\na. Sekretaris Eselon III dengan masa kerja paling sedikit 4 tahun\nb. Pengemudi Eselon III dengan masa kerja paling sedikit 4 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 10, jabatan1: "Penata Keprotokolan Tk.IV:\na. Sekretaris Eselon III dengan masa kerja paling sedikit 2 tahun\nb. Pengemudi Eselon III dengan masa kerja paling sedikit 2 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 11, jabatan1: "Penata Keprotokolan Tk.V:\na. Sekretaris Eselon III dengan masa kerja kurang dari 2 tahun\nb. Pengemudi Eselon III dengan masa kerja kurang dari 2 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 8 },
      ]
    },
    {
      title: "Seksi Penindakan dan Penyidikan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Perbendaharaan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I/\nJuru Sita Keuangan Negara Tk. II", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II/\nJuru Sita Keuangan Negara Tk. III", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I/ Juru Sita Keuangan Negara Tk. IV", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II/ Juru Sita Keuangan Negara Tk. V", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III/ Juru Sita Keuangan Negara Tk. VI", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Pelayanan Kepabeanan dan Cukai",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Penyuluhan dan Layanan Informasi",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Kepatuhan Internal",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
      ]
    },
    {
      title: "Seksi Pengolahan Data dan Administrasi Dokumen",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
  ]
};

// Data for KPPBC Tipe Madya Pabean B (25. KANTOR PENGAWASAN DAN PELAYANAN BEA DAN CUKAI TIPE MADYA PABEAN B)
const kppbcMadyaPabeanBData: UnitKerjaData = {
  header: "25. KANTOR PENGAWASAN DAN PELAYANAN BEA DAN CUKAI TIPE MADYA PABEAN B",
  subtitle: "ex Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean B Gresik, Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean B Sidoarjo",
  sections: [
    {
      title: "Subbagian Umum",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
        { no: 9, jabatan1: "Penata Keprotokolan Tk.III:\na. Sekretaris Eselon III dengan masa kerja paling sedikit 4 tahun\nb. Pengemudi Eselon III dengan masa kerja paling sedikit 4 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 10, jabatan1: "Penata Keprotokolan Tk.IV:\na. Sekretaris Eselon III dengan masa kerja paling sedikit 2 tahun\nb. Pengemudi Eselon III dengan masa kerja paling sedikit 2 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 11, jabatan1: "Penata Keprotokolan Tk.V:\na. Sekretaris Eselon III dengan masa kerja kurang dari 2 tahun\nb. Pengemudi Eselon III dengan masa kerja kurang dari 2 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 8 },
      ]
    },
    {
      title: "Seksi Penindakan dan Penyidikan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Perbendaharaan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I/\nJuru Sita Keuangan Negara Tk. II", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II/\nJuru Sita Keuangan Negara Tk. III", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I/ Juru Sita Keuangan Negara Tk. IV", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II/ Juru Sita Keuangan Negara Tk. V", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III/ Juru Sita Keuangan Negara Tk. VI", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Pelayanan Kepabeanan dan Cukai",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Penyuluhan dan Layanan Informasi",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Kepatuhan Internal",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
      ]
    },
    {
      title: "Seksi Pengolahan Data Dan Administrasi Dokumen",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
  ]
};

// Data for KPPBC Tipe Madya Pabean C (26. KANTOR PENGAWASAN DAN PELAYANAN BEA DAN CUKAI TIPE MADYA PABEAN C)
const kppbcMadyaPabeanCData: UnitKerjaData = {
  header: "26. KANTOR PENGAWASAN DAN PELAYANAN BEA DAN CUKAI TIPE MADYA PABEAN C",
  subtitle: "ex Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean C Madura, Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean C Bojonegoro",
  sections: [
    {
      title: "Subbagian Umum",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
        { no: 9, jabatan1: "Penata Keprotokolan Tk.III:\na. Sekretaris Eselon III dengan masa kerja paling sedikit 4 tahun\nb. Pengemudi Eselon III dengan masa kerja paling sedikit 4 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 10, jabatan1: "Penata Keprotokolan Tk.IV:\na. Sekretaris Eselon III dengan masa kerja paling sedikit 2 tahun\nb. Pengemudi Eselon III dengan masa kerja paling sedikit 2 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 11, jabatan1: "Penata Keprotokolan Tk.V:\na. Sekretaris Eselon III dengan masa kerja kurang dari 2 tahun\nb. Pengemudi Eselon III dengan masa kerja kurang dari 2 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 8 },
      ]
    },
    {
      title: "Seksi Penindakan dan Penyidikan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I*", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Perbendaharaan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I/\nJuru Sita Keuangan Negara Tk. II", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II/\nJuru Sita Keuangan Negara Tk. III", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I/ Juru Sita Keuangan Negara Tk. IV", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II/ Juru Sita Keuangan Negara Tk. V", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III/ Juru Sita Keuangan Negara Tk. VI", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Pelayanan Kepabeanan dan Cukai dan Dukungan Teknis",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I *", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Kepatuhan Internal dan Penyuluhan",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.I *", gol1: "III/c", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 12 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 5, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 9, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
  ]
};

// Data for Balai Laboratorium Bea dan Cukai (27. BALAI LABORATORIUM BEA DAN CUKAI)
const balaiLaboratoriumData: UnitKerjaData = {
  header: "27. BALAI LABORATORIUM BEA DAN CUKAI",
  subtitle: "ex Balai Laboratorium Bea dan Cukai Kelas I Surabaya",
  sections: [
    {
      title: "Balai Laboratorium Bea dan Cukai Kelas I\nSubbagian Umum dan Kepatuhan Internal",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
        { no: 9, jabatan1: "Penata Keprotokolan Tk.III:\na. Sekretaris Eselon III dengan masa kerja paling sedikit 4 tahun\nb. Pengemudi Eselon III dengan masa kerja paling sedikit 4 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 10, jabatan1: "Penata Keprotokolan Tk.IV:\na. Sekretaris Eselon III dengan masa kerja paling sedikit 2 tahun\nb. Pengemudi Eselon III dengan masa kerja paling sedikit 2 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 11, jabatan1: "Penata Keprotokolan Tk.V:\na. Sekretaris Eselon III dengan masa kerja kurang dari 2 tahun\nb. Pengemudi Eselon III dengan masa kerja kurang dari 2 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 8 },
      ]
    },
    {
      title: "Seksi Teknis Laboratorium",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Program dan Evaluasi",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Balai Laboratorium Bea dan Cukai Kelas II\nSubbagian Umum dan Kepatuhan Internal",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
        { no: 9, jabatan1: "Penata Keprotokolan Tk.III:\na. Sekretaris Eselon III dengan masa kerja paling sedikit 4 tahun\nb. Pengemudi Eselon III dengan masa kerja paling sedikit 4 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 10, jabatan1: "Penata Keprotokolan Tk.IV:\na. Sekretaris Eselon III dengan masa kerja paling sedikit 2 tahun\nb. Pengemudi Eselon III dengan masa kerja paling sedikit 2 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 11, jabatan1: "Penata Keprotokolan Tk.V:\na. Sekretaris Eselon III dengan masa kerja kurang dari 2 tahun\nb. Pengemudi Eselon III dengan masa kerja kurang dari 2 tahun", gol1: "II/a", pendidikan1: "DI", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 8 },
      ]
    },
    {
      title: "Seksi Teknis Laboratorium",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
    {
      title: "Seksi Program dan Evaluasi",
      isEselonIV: true,
      rows: [
        { no: 1, jabatan1: "Penata Layanan Operasional Tk.II", gol1: "III/b", pendidikan1: "DIV/S1", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "", gol3: "", pendidikan3: "", grade: 11 },
        { no: 2, jabatan1: "Penata Layanan Operasional Tk.III", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.I", gol2: "III/a", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 10 },
        { no: 3, jabatan1: "Penata Layanan Operasional Tk.IV", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.II", gol2: "II/d", pendidikan2: "DIII", jabatan3: "", gol3: "", pendidikan3: "", grade: 9 },
        { no: 4, jabatan1: "Penata Layanan Operasional Tk.V", gol1: "III/a", pendidikan1: "DIV/S1", jabatan2: "Pengolah Data dan Informasi Tk.III", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.I", gol3: "II/c", pendidikan3: "DI", grade: 8 },
        { no: 5, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.IV", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.II", gol3: "II/b", pendidikan3: "DI", grade: 7 },
        { no: 6, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "Pengolah Data dan Informasi Tk.V", gol2: "II/c", pendidikan2: "DIII", jabatan3: "Pengadministrasi Perkantoran Tk.III", gol3: "II/a", pendidikan3: "SLTA Sederajat", grade: 6 },
        { no: 7, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.IV", gol3: "I/d", pendidikan3: "SLTA Sederajat", grade: 5 },
        { no: 8, jabatan1: "", gol1: "", pendidikan1: "", jabatan2: "", gol2: "", pendidikan2: "", jabatan3: "Pengadministrasi Perkantoran Tk.V", gol3: "I/c", pendidikan3: "SLTA Sederajat", grade: 4 },
      ]
    },
  ]
};

// All unit kerja data with identifiers
const allUnitKerjaData: { id: string; name: string; data: UnitKerjaData }[] = [
  { id: "kanwil", name: "Kantor Wilayah Direktorat Jenderal Bea dan Cukai Jawa Timur I", data: kanwilData },
  { id: "tanjung-perak", name: "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Tanjung Perak", data: kppbcMadyaPabeanData },
  { id: "juanda", name: "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Juanda", data: kppbcMadyaPabeanData },
  { id: "pasuruan", name: "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean A Pasuruan", data: kppbcMadyaPabeanAData },
  { id: "gresik", name: "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean B Gresik", data: kppbcMadyaPabeanBData },
  { id: "sidoarjo", name: "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean B Sidoarjo", data: kppbcMadyaPabeanBData },
  { id: "madura", name: "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean C Madura", data: kppbcMadyaPabeanCData },
  { id: "bojonegoro", name: "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean C Bojonegoro", data: kppbcMadyaPabeanCData },
  { id: "balai-lab", name: "Balai Laboratorium Bea dan Cukai Kelas I Surabaya", data: balaiLaboratoriumData },
];

// Grade Legend Component with clickable filtering
interface GradeLegendProps {
  selectedGrades: number[];
  onGradeToggle: (grade: number) => void;
}

const GradeLegend = ({ selectedGrades, onGradeToggle }: GradeLegendProps) => (
  <div className="flex flex-wrap gap-2 mb-4 p-3 bg-white rounded-lg shadow-sm items-center">
    <span className="text-xs font-semibold mr-2">Legenda Grade:</span>
    {[12, 11, 10, 9, 8, 7, 6, 5, 4].map(grade => (
      <button
        key={grade}
        onClick={() => onGradeToggle(grade)}
        className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition-all ${getGradeColor(grade)} ${
          selectedGrades.length === 0 || selectedGrades.includes(grade)
            ? "opacity-100 ring-2 ring-offset-1 ring-gray-400"
            : "opacity-40"
        }`}
      >
        {grade}
      </button>
    ))}
    {selectedGrades.length > 0 && (
      <button
        onClick={() => selectedGrades.forEach(g => onGradeToggle(g))}
        className="text-xs text-blue-600 hover:text-blue-800 ml-2 underline"
      >
        Reset
      </button>
    )}
  </div>
);

// Filter Component
interface FilterPanelProps {
  showEselonII: boolean;
  setShowEselonII: (v: boolean) => void;
  showEselonIII: boolean;
  setShowEselonIII: (v: boolean) => void;
  searchJabatan: string;
  setSearchJabatan: (v: string) => void;
  searchGolRuang: string;
  setSearchGolRuang: (v: string) => void;
  searchPendidikan: string;
  setSearchPendidikan: (v: string) => void;
  selectedSatuanKerja: string[];
  setSelectedSatuanKerja: (v: string[]) => void;
}

const FilterPanel = ({
  showEselonII,
  setShowEselonII,
  showEselonIII,
  setShowEselonIII,
  searchJabatan,
  setSearchJabatan,
  searchGolRuang,
  setSearchGolRuang,
  searchPendidikan,
  setSearchPendidikan,
  selectedSatuanKerja,
  setSelectedSatuanKerja,
}: FilterPanelProps) => {
  const handleSatuanKerjaToggle = (id: string) => {
    if (selectedSatuanKerja.includes(id)) {
      setSelectedSatuanKerja(selectedSatuanKerja.filter(sk => sk !== id));
    } else {
      setSelectedSatuanKerja([...selectedSatuanKerja, id]);
    }
  };

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg border space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Eselon Filters */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Eselon</Label>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="eselon-ii"
                checked={showEselonII}
                onCheckedChange={(checked) => setShowEselonII(!!checked)}
              />
              <Label htmlFor="eselon-ii" className="text-xs">Eselon II</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="eselon-iii"
                checked={showEselonIII}
                onCheckedChange={(checked) => setShowEselonIII(!!checked)}
              />
              <Label htmlFor="eselon-iii" className="text-xs">Eselon III</Label>
            </div>
          </div>
        </div>

        {/* Nama Jabatan */}
        <div className="space-y-2">
          <Label htmlFor="search-jabatan" className="text-xs font-semibold">Nama Jabatan</Label>
          <Input
            id="search-jabatan"
            placeholder="Cari jabatan..."
            value={searchJabatan}
            onChange={(e) => setSearchJabatan(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        {/* Gol/Ruang */}
        <div className="space-y-2">
          <Label htmlFor="search-gol" className="text-xs font-semibold">Gol/Ruang</Label>
          <Input
            id="search-gol"
            placeholder="Cari gol/ruang..."
            value={searchGolRuang}
            onChange={(e) => setSearchGolRuang(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        {/* Pendidikan */}
        <div className="space-y-2">
          <Label htmlFor="search-pendidikan" className="text-xs font-semibold">Pendidikan</Label>
          <Input
            id="search-pendidikan"
            placeholder="Cari pendidikan..."
            value={searchPendidikan}
            onChange={(e) => setSearchPendidikan(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Satuan Kerja */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Filter Satuan Kerja</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-3 bg-white rounded border max-h-40 overflow-y-auto">
          {allUnitKerjaData.map(unit => (
            <div key={unit.id} className="flex items-center gap-2">
              <Checkbox
                id={`satker-${unit.id}`}
                checked={selectedSatuanKerja.length === 0 || selectedSatuanKerja.includes(unit.id)}
                onCheckedChange={() => handleSatuanKerjaToggle(unit.id)}
              />
              <Label htmlFor={`satker-${unit.id}`} className="text-xs cursor-pointer truncate" title={unit.name}>
                {unit.name}
              </Label>
            </div>
          ))}
        </div>
        {selectedSatuanKerja.length > 0 && (
          <button
            onClick={() => setSelectedSatuanKerja([])}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Tampilkan Semua
          </button>
        )}
      </div>
    </div>
  );
};

export default function Tabel408Tab() {
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [showEselonII, setShowEselonII] = useState(true);
  const [showEselonIII, setShowEselonIII] = useState(true);
  const [searchJabatan, setSearchJabatan] = useState("");
  const [searchGolRuang, setSearchGolRuang] = useState("");
  const [searchPendidikan, setSearchPendidikan] = useState("");
  const [selectedSatuanKerja, setSelectedSatuanKerja] = useState<string[]>([]);

  const handleGradeToggle = (grade: number) => {
    if (selectedGrades.includes(grade)) {
      setSelectedGrades(selectedGrades.filter(g => g !== grade));
    } else {
      setSelectedGrades([...selectedGrades, grade]);
    }
  };

  // Filter logic for unit kerja data
  const filteredUnitKerjaData = useMemo(() => {
    return allUnitKerjaData.filter(unit => {
      // Filter by satuan kerja
      if (selectedSatuanKerja.length > 0 && !selectedSatuanKerja.includes(unit.id)) {
        return false;
      }
      return true;
    }).map(unit => ({
      ...unit,
      data: {
        ...unit.data,
        sections: unit.data.sections.filter(section => {
          // Filter by eselon
          if (!showEselonII && !showEselonIII) return true;
          if (!showEselonII && section.isEselonIII) return false;
          if (!showEselonIII && section.isEselonIV) return false;
          return true;
        }).map(section => ({
          ...section,
          rows: section.rows.filter(row => {
            // Filter by grade
            if (selectedGrades.length > 0 && row.grade && !selectedGrades.includes(row.grade)) {
              return false;
            }

            // Filter by jabatan
            if (searchJabatan) {
              const jabatanMatch = 
                (row.jabatan1?.toLowerCase().includes(searchJabatan.toLowerCase())) ||
                (row.jabatan2?.toLowerCase().includes(searchJabatan.toLowerCase())) ||
                (row.jabatan3?.toLowerCase().includes(searchJabatan.toLowerCase()));
              if (!jabatanMatch) return false;
            }

            // Filter by gol/ruang
            if (searchGolRuang) {
              const golMatch = 
                (row.gol1?.toLowerCase().includes(searchGolRuang.toLowerCase())) ||
                (row.gol2?.toLowerCase().includes(searchGolRuang.toLowerCase())) ||
                (row.gol3?.toLowerCase().includes(searchGolRuang.toLowerCase()));
              if (!golMatch) return false;
            }

            // Filter by pendidikan
            if (searchPendidikan) {
              const pendidikanMatch = 
                (row.pendidikan1?.toLowerCase().includes(searchPendidikan.toLowerCase())) ||
                (row.pendidikan2?.toLowerCase().includes(searchPendidikan.toLowerCase())) ||
                (row.pendidikan3?.toLowerCase().includes(searchPendidikan.toLowerCase()));
              if (!pendidikanMatch) return false;
            }

            return true;
          })
        })).filter(section => section.rows.length > 0)
      }
    })).filter(unit => unit.data.sections.length > 0);
  }, [selectedGrades, showEselonII, showEselonIII, searchJabatan, searchGolRuang, searchPendidikan, selectedSatuanKerja]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tabel 408 - Daftar Jabatan dan Peringkat Jabatan per Unit Kerja</CardTitle>
          <p className="text-sm text-muted-foreground">
            Menampilkan struktur jabatan pada unit kerja terkecil. Bidang/Bagian = Eselon III, Subbagian/Seksi = Eselon IV
          </p>
        </CardHeader>
        <CardContent>
          <GradeLegend selectedGrades={selectedGrades} onGradeToggle={handleGradeToggle} />
          
          <FilterPanel
            showEselonII={showEselonII}
            setShowEselonII={setShowEselonII}
            showEselonIII={showEselonIII}
            setShowEselonIII={setShowEselonIII}
            searchJabatan={searchJabatan}
            setSearchJabatan={setSearchJabatan}
            searchGolRuang={searchGolRuang}
            setSearchGolRuang={setSearchGolRuang}
            searchPendidikan={searchPendidikan}
            setSearchPendidikan={setSearchPendidikan}
            selectedSatuanKerja={selectedSatuanKerja}
            setSelectedSatuanKerja={setSelectedSatuanKerja}
          />
          
          <ScrollArea className="h-[calc(100vh-450px)]">
            <div className="space-y-8">
              {filteredUnitKerjaData.length > 0 ? (
                filteredUnitKerjaData.map((unit, idx) => (
                  <UnitKerjaTable key={`${unit.id}-${idx}`} unitKerja={unit.data} />
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p>Tidak ada data yang sesuai dengan filter</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
