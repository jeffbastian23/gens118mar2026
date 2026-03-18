import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Download, Trash2, TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw, FileUp, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useAuth, isAdminRole } from "@/hooks/useAuth";

interface RealisasiAnggaran {
  id: string;
  no_urut: number | null;
  kode_program: string | null;
  kode_kegiatan: string | null;
  kode_output: string | null;
  kode_sub_output: string | null;
  kode_komponen: string | null;
  kode_sub_komponen: string | null;
  kode_akun: string | null;
  uraian: string;
  pagu_revisi: number;
  lock_pagu: number;
  realisasi_periode_lalu: number;
  realisasi_periode_ini: number;
  realisasi_sd_periode: number;
  persentase: number;
  sisa_anggaran: number;
  level_hierarki: number;
  tahun_anggaran: number;
  periode: string | null;
  created_at: string;
}

interface Statistics {
  totalPagu: number;
  totalRealisasi: number;
  totalSisa: number;
  persentaseRealisasi: number;
  jumlahProgram: number;
  jumlahKegiatan: number;
  jumlahAkun: number;
}

export default function RealisasiAnggaranDashboard() {
  const { role } = useAuth();
  const isAdmin = isAdminRole(role);
  const [data, setData] = useState<RealisasiAnggaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [statistics, setStatistics] = useState<Statistics>({
    totalPagu: 0,
    totalRealisasi: 0,
    totalSisa: 0,
    persentaseRealisasi: 0,
    jumlahProgram: 0,
    jumlahKegiatan: 0,
    jumlahAkun: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .from("realisasi_anggaran")
        .select("*")
        .order("no_urut", { ascending: true });

      if (error) throw error;

      const typedData = (result || []).map(item => ({
        ...item,
        pagu_revisi: Number(item.pagu_revisi) || 0,
        lock_pagu: Number(item.lock_pagu) || 0,
        realisasi_periode_lalu: Number(item.realisasi_periode_lalu) || 0,
        realisasi_periode_ini: Number(item.realisasi_periode_ini) || 0,
        realisasi_sd_periode: Number(item.realisasi_sd_periode) || 0,
        persentase: Number(item.persentase) || 0,
        sisa_anggaran: Number(item.sisa_anggaran) || 0,
        level_hierarki: Number(item.level_hierarki) || 0,
        tahun_anggaran: Number(item.tahun_anggaran) || new Date().getFullYear(),
      })) as RealisasiAnggaran[];

      setData(typedData);
      calculateStatistics(typedData);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (items: RealisasiAnggaran[]) => {
    // Get top-level summary (level 0 or first row with highest pagu)
    const topLevelRow = items.find(item => item.uraian?.includes("JUMLAH SELURUHNYA") || item.level_hierarki === 0);
    
    // Calculate unique counts
    const programs = new Set(items.filter(i => i.kode_program).map(i => i.kode_program));
    const kegiatan = new Set(items.filter(i => i.kode_kegiatan).map(i => i.kode_kegiatan));
    const akun = new Set(items.filter(i => i.kode_akun).map(i => i.kode_akun));

    if (topLevelRow && topLevelRow.pagu_revisi > 0) {
      const persentase = topLevelRow.persentase > 1 
        ? topLevelRow.persentase  // Already in percentage format
        : topLevelRow.persentase * 100; // Decimal format
      
      setStatistics({
        totalPagu: topLevelRow.pagu_revisi,
        totalRealisasi: topLevelRow.realisasi_sd_periode,
        totalSisa: topLevelRow.sisa_anggaran,
        persentaseRealisasi: persentase,
        jumlahProgram: programs.size,
        jumlahKegiatan: kegiatan.size,
        jumlahAkun: akun.size,
      });
    } else {
      // Fallback: sum all items or leaf nodes
      const itemsToSum = items.filter(i => i.kode_akun).length > 0 
        ? items.filter(i => i.kode_akun) 
        : items;
      const totalPagu = itemsToSum.reduce((sum, i) => sum + i.pagu_revisi, 0);
      const totalRealisasi = itemsToSum.reduce((sum, i) => sum + i.realisasi_sd_periode, 0);
      const totalSisa = itemsToSum.reduce((sum, i) => sum + i.sisa_anggaran, 0);

      setStatistics({
        totalPagu,
        totalRealisasi,
        totalSisa,
        persentaseRealisasi: totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0,
        jumlahProgram: programs.size,
        jumlahKegiatan: kegiatan.size,
        jumlahAkun: akun.size,
      });
    }
  };

  useEffect(() => {
    fetchData();
    fetchPdfUrl();
  }, []);

  const fetchPdfUrl = async () => {
    try {
      const { data: files } = await supabase.storage
        .from("realisasi-pdf")
        .list("", { limit: 1, sortBy: { column: "created_at", order: "desc" } });
      
      if (files && files.length > 0) {
        const { data: urlData } = supabase.storage
          .from("realisasi-pdf")
          .getPublicUrl(files[0].name);
        if (urlData?.publicUrl) {
          setPdfUrl(urlData.publicUrl);
        }
      }
    } catch (error) {
      console.error("Error fetching PDF:", error);
    }
  };

  const handleUploadPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Hanya file PDF yang diperbolehkan");
      return;
    }

    setUploadingPdf(true);
    try {
      const fileName = `realisasi_anggaran_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("realisasi-pdf")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("realisasi-pdf")
        .getPublicUrl(fileName);
      
      if (urlData?.publicUrl) {
        setPdfUrl(urlData.publicUrl);
      }
      toast.success("PDF berhasil diupload");
    } catch (error: any) {
      toast.error(error.message || "Gagal upload PDF");
    } finally {
      setUploadingPdf(false);
      event.target.value = "";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const parseExcelNumber = (value: any): number => {
    if (value === undefined || value === null || value === "") return 0;
    if (typeof value === "number") return value;
    const cleaned = String(value).replace(/[^\d.-]/g, "");
    return parseFloat(cleaned) || 0;
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      const records: any[] = [];
      let noUrut = 0;

      // Find numeric column indices by looking for the header row with "Pagu Revisi", "Lock Pagu", etc.
      // In Laporan Fa Detail, numeric values are in specific columns after the uraian columns
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 5) continue;

        // Skip header and metadata rows
        const rowText = row.map(c => String(c || "")).join(" ").toLowerCase();
        if (rowText.includes("laporan") || 
            rowText.includes("per program") || 
            rowText.includes("kementerian") ||
            rowText.includes("unit organisasi") ||
            rowText.includes("satuan kerja") ||
            rowText.includes("pagu revisi") ||
            rowText.includes("periode lalu") ||
            rowText.includes("lock pagu adalah")) continue;

        // Collect all cell values
        const cellValues: { index: number; value: any; isNumeric: boolean; numValue: number }[] = [];
        
        for (let j = 0; j < row.length; j++) {
          const cellVal = row[j];
          if (cellVal === undefined || cellVal === null || cellVal === "") continue;
          
          let isNumeric = false;
          let numValue = 0;
          
          if (typeof cellVal === "number") {
            isNumeric = true;
            numValue = cellVal;
          } else {
            const strVal = String(cellVal).replace(/,/g, "").trim();
            // Check if it's a formatted number (with or without decimals)
            if (strVal.match(/^-?[\d.]+$/)) {
              const parsed = parseFloat(strVal);
              if (!isNaN(parsed)) {
                isNumeric = true;
                numValue = parsed;
              }
            }
          }
          
          cellValues.push({ index: j, value: cellVal, isNumeric, numValue });
        }

        // Find uraian - longest non-numeric text that's not a code
        const textCells = cellValues.filter(c => {
          if (c.isNumeric) return false;
          const str = String(c.value).trim();
          // Exclude codes like "CC", "AEF", "100.0A", "521211"
          if (str.match(/^[A-Z]{2,3}$/)) return false;
          if (str.match(/^[A-Z]{2}\.\d+$/)) return false;
          if (str.match(/^[A-Z]{3}\.\d+$/)) return false;
          if (str.match(/^\d+$/)) return false;
          if (str.match(/^\d+\.[A-Z0-9]+$/)) return false;
          if (str.match(/^\d{6}$/)) return false;
          if (str.length < 3) return false;
          return true;
        });

        const uraian = textCells.reduce((longest, c) => {
          const str = String(c.value).trim();
          return str.length > longest.length ? str : longest;
        }, "");

        // Get numeric values in order they appear (should be: Pagu, Lock, PeriodeLalu, PeriodeIni, SdPeriode, %, Sisa)
        const numericCells = cellValues.filter(c => c.isNumeric).map(c => c.numValue);

        // Skip rows without uraian or insufficient numeric data
        if (!uraian || numericCells.length < 5) continue;

        // Map numeric values - the Excel format has values in this order:
        // Pagu Revisi, Lock Pagu, Realisasi Periode Lalu, Realisasi Periode Ini, Realisasi s.d. Periode, %, Sisa Anggaran
        const paguRevisi = numericCells[0] || 0;
        const lockPagu = numericCells[1] || 0;
        const realisasiPeriodeLalu = numericCells[2] || 0;
        const realisasiPeriodeIni = numericCells[3] || 0;
        const realisasiSdPeriode = numericCells[4] || 0;
        // Persentase could be in decimal (0.889) or percentage (88.9) format
        let persentase = numericCells[5] || 0;
        // Normalize to decimal if it appears to be a percentage value > 1
        if (persentase > 1 && persentase < 100) {
          persentase = persentase / 100;
        }
        const sisaAnggaran = numericCells[6] || 0;

        // Determine level based on content and position
        let level = 0;
        let kodeProgram: string | null = null;
        let kodeKegiatan: string | null = null;
        let kodeOutput: string | null = null;
        let kodeSubOutput: string | null = null;
        let kodeKomponen: string | null = null;
        let kodeSubKomponen: string | null = null;
        let kodeAkun: string | null = null;

        // Check for codes in specific positions
        for (const cell of cellValues) {
          const str = String(cell.value).trim();
          if (str.match(/^[A-Z]{2}$/) && !kodeProgram) { kodeProgram = str; level = Math.max(level, 1); }
          else if (str.match(/^[A-Z]{2}\.\d+$/) && !kodeKegiatan) { kodeKegiatan = str; level = Math.max(level, 2); }
          else if (str.match(/^[A-Z]{3}$/) && !kodeOutput) { kodeOutput = str; level = Math.max(level, 3); }
          else if (str.match(/^[A-Z]{3}\.\d+$/) && !kodeSubOutput) { kodeSubOutput = str; level = Math.max(level, 4); }
          else if (str.match(/^\d{3}$/) && !kodeKomponen) { kodeKomponen = str; level = Math.max(level, 5); }
          else if (str.match(/^\d+\.[A-Z0-9]+$/) && !kodeSubKomponen) { kodeSubKomponen = str; level = Math.max(level, 6); }
          else if (str.match(/^\d{6}$/) && !kodeAkun) { kodeAkun = str; level = Math.max(level, 7); }
        }

        if (uraian.includes("JUMLAH SELURUHNYA")) level = 0;

        noUrut++;
        records.push({
          no_urut: noUrut,
          kode_program: kodeProgram,
          kode_kegiatan: kodeKegiatan,
          kode_output: kodeOutput,
          kode_sub_output: kodeSubOutput,
          kode_komponen: kodeKomponen,
          kode_sub_komponen: kodeSubKomponen,
          kode_akun: kodeAkun,
          uraian: uraian.substring(0, 500),
          pagu_revisi: paguRevisi,
          lock_pagu: lockPagu,
          realisasi_periode_lalu: realisasiPeriodeLalu,
          realisasi_periode_ini: realisasiPeriodeIni,
          realisasi_sd_periode: realisasiSdPeriode,
          persentase: persentase,
          sisa_anggaran: sisaAnggaran,
          level_hierarki: level,
          tahun_anggaran: new Date().getFullYear(),
          periode: `Desember ${new Date().getFullYear()}`,
        });
      }

      if (records.length === 0) {
        toast.error("Tidak ada data valid yang ditemukan di file Excel");
        return;
      }

      // Delete existing data first
      await supabase.from("realisasi_anggaran").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Insert new data in batches
      const batchSize = 50;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from("realisasi_anggaran").insert(batch);
        if (error) throw error;
      }

      toast.success(`Berhasil import ${records.length} data dari Laporan FA Detail`);
      fetchData();
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Gagal import data");
    } finally {
      setImporting(false);
      // Reset input
      event.target.value = "";
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = data.map((item, index) => {
        const persentaseDisplay = item.persentase > 1 ? item.persentase : item.persentase * 100;
        return {
          "No": index + 1,
          "Kode Program": item.kode_program || "",
          "Kode Kegiatan": item.kode_kegiatan || "",
          "Kode Output": item.kode_output || "",
          "Kode Sub Output": item.kode_sub_output || "",
          "Kode Komponen": item.kode_komponen || "",
          "Kode Sub Komponen": item.kode_sub_komponen || "",
          "Kode Akun": item.kode_akun || "",
          "Uraian": item.uraian,
          "Pagu Revisi": item.pagu_revisi,
          "Lock Pagu": item.lock_pagu,
          "Realisasi Periode Lalu": item.realisasi_periode_lalu,
          "Realisasi Periode Ini": item.realisasi_periode_ini,
          "Realisasi s.d. Periode": item.realisasi_sd_periode,
          "Persentase (%)": persentaseDisplay.toFixed(2),
          "Sisa Anggaran": item.sisa_anggaran,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Realisasi Anggaran");
      
      // Set column widths
      const colWidths = [
        { wch: 5 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 40 }, { wch: 18 },
        { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 18 },
      ];
      worksheet["!cols"] = colWidths;

      const fileName = `Realisasi_Anggaran_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("Data berhasil diexport");
    } catch (error: any) {
      toast.error(error.message || "Gagal export data");
    }
  };

  const handleDeleteAll = async () => {
    try {
      const { error } = await supabase
        .from("realisasi_anggaran")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      toast.success("Semua data berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus data");
    } finally {
      setDeleteAllDialogOpen(false);
    }
  };

  const filteredData = data.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.uraian?.toLowerCase().includes(query) ||
      item.kode_program?.toLowerCase().includes(query) ||
      item.kode_kegiatan?.toLowerCase().includes(query) ||
      item.kode_akun?.toLowerCase().includes(query)
    );
  });

  const getLevelStyle = (level: number) => {
    const paddings = ["pl-0", "pl-2", "pl-4", "pl-6", "pl-8", "pl-10", "pl-12", "pl-14"];
    const fontWeights = ["font-bold", "font-semibold", "font-medium", "font-normal", "font-normal", "font-normal", "font-normal", "font-normal"];
    return `${paddings[level] || "pl-0"} ${fontWeights[level] || "font-normal"}`;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pagu</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(statistics.totalPagu)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Realisasi</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(statistics.totalRealisasi)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sisa Anggaran</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(statistics.totalSisa)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <PieChart className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Persentase Realisasi</p>
              <p className="text-lg font-bold text-purple-600">{statistics.persentaseRealisasi.toFixed(2)}%</p>
            </div>
          </div>
          <Progress value={statistics.persentaseRealisasi} className="mt-2" />
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{statistics.jumlahProgram}</p>
          <p className="text-sm text-muted-foreground">Program</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{statistics.jumlahKegiatan}</p>
          <p className="text-sm text-muted-foreground">Kegiatan</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{statistics.jumlahAkun}</p>
          <p className="text-sm text-muted-foreground">Mata Anggaran</p>
        </Card>
      </div>

      {/* Actions and Search */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Label htmlFor="import-excel" className="cursor-pointer">
                  <Button variant="outline" className="gap-2" disabled={importing} asChild>
                    <span>
                      <Upload className="h-4 w-4" />
                      {importing ? "Importing..." : "Import Excel"}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="import-excel"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />

                <Button variant="outline" className="gap-2" onClick={handleExportExcel} disabled={data.length === 0}>
                  <Download className="h-4 w-4" />
                  Export Excel
                </Button>

                <Button variant="outline" className="gap-2" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>

                <Label htmlFor="import-pdf" className="cursor-pointer">
                  <Button variant="outline" className="gap-2" disabled={uploadingPdf} asChild>
                    <span>
                      <FileUp className="h-4 w-4" />
                      {uploadingPdf ? "Uploading..." : "Upload PDF"}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="import-pdf"
                  type="file"
                  accept=".pdf"
                  onChange={handleUploadPdf}
                  className="hidden"
                />

                {pdfUrl && (
                  <Button variant="outline" className="gap-2" onClick={() => window.open(pdfUrl, "_blank")}>
                    <FileText className="h-4 w-4" />
                    Lihat PDF
                  </Button>
                )}
              </>
            )}

            {(role === "admin" || role === "super") && data.length > 0 && (
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => setDeleteAllDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Hapus Semua
              </Button>
            )}
          </div>

          <div className="w-full md:w-auto">
            <Input
              placeholder="Cari uraian, kode program, kegiatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-80"
            />
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Data Realisasi Anggaran ({filteredData.length} data)</h3>
        
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {data.length === 0 ? "Belum ada data. Import file Excel untuk memulai." : "Tidak ada data yang sesuai pencarian."}
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-b-0">
                  <TableHead rowSpan={2} className="w-10 sticky left-0 bg-background border-b align-bottom">No</TableHead>
                  <TableHead rowSpan={2} className="min-w-[250px] border-b align-bottom">Uraian</TableHead>
                  <TableHead rowSpan={2} className="text-right whitespace-nowrap border-b align-bottom">Pagu Revisi</TableHead>
                  <TableHead rowSpan={2} className="text-right whitespace-nowrap border-b align-bottom">Lock Pagu</TableHead>
                  <TableHead colSpan={4} className="text-center bg-blue-50 dark:bg-blue-900/20 border-b-0">
                    Realisasi TA {new Date().getFullYear()}
                  </TableHead>
                  <TableHead rowSpan={2} className="text-right whitespace-nowrap border-b align-bottom">Sisa Anggaran</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-right whitespace-nowrap bg-blue-50 dark:bg-blue-900/20">Periode Lalu</TableHead>
                  <TableHead className="text-right whitespace-nowrap bg-blue-50 dark:bg-blue-900/20">Periode Ini</TableHead>
                  <TableHead className="text-right whitespace-nowrap bg-blue-50 dark:bg-blue-900/20">s.d. Periode</TableHead>
                  <TableHead className="text-right whitespace-nowrap bg-blue-50 dark:bg-blue-900/20">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => {
                  const persentaseDisplay = item.persentase > 1 ? item.persentase : item.persentase * 100;
                  const persentaseValue = item.persentase > 1 ? item.persentase / 100 : item.persentase;
                  return (
                    <TableRow key={item.id} className={item.level_hierarki === 0 ? "bg-muted/50 font-semibold" : ""}>
                      <TableCell className="font-medium sticky left-0 bg-background">{index + 1}</TableCell>
                      <TableCell className={getLevelStyle(item.level_hierarki)}>
                        <div>
                          <span>{item.uraian}</span>
                          {(item.kode_akun || item.kode_kegiatan) && (
                            <span className="text-xs text-muted-foreground ml-2">
                              [{item.kode_akun || item.kode_kegiatan || item.kode_program}]
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.pagu_revisi)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.lock_pagu)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap bg-blue-50/50 dark:bg-blue-900/10">{formatCurrency(item.realisasi_periode_lalu)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap bg-blue-50/50 dark:bg-blue-900/10">{formatCurrency(item.realisasi_periode_ini)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap bg-blue-50/50 dark:bg-blue-900/10">{formatCurrency(item.realisasi_sd_periode)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap bg-blue-50/50 dark:bg-blue-900/10">
                        <span className={persentaseValue >= 0.9 ? "text-green-600 font-medium" : persentaseValue >= 0.7 ? "text-orange-600 font-medium" : "text-red-600 font-medium"}>
                          {persentaseDisplay.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.sisa_anggaran)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Card>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus semua data realisasi anggaran. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground">
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
