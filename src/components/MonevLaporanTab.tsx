import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Download, Upload, Search, FileText, FileDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Document, Paragraph, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, TextRun, Packer, WidthType, AlignmentType, BorderStyle, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import MonevRekapGradingSection from "@/components/grading/MonevRekapGradingSection";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface MonevLaporan {
  id: string;
  no_urut: number | null;
  jenis_mekanisme_penetapan: string;
  jumlah_keputusan: number;
  hasil_monev: string | null;
  tindak_lanjut: string | null;
  keterangan: string | null;
  created_at?: string;
  updated_at?: string;
}

interface MonevLaporanTabProps {
  isAdmin?: boolean;
}

// Months for dropdown
const BULAN_OPTIONS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Generate year options (current year +/- 5 years)
const currentYear = new Date().getFullYear();
const TAHUN_OPTIONS = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

export default function MonevLaporanTab({ isAdmin = true }: MonevLaporanTabProps) {
  const [data, setData] = useState<MonevLaporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<MonevLaporan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [satkerList, setSatkerList] = useState<string[]>([]);
  
  // Export header fields
  const [exportSatker, setExportSatker] = useState("");
  const [exportBulanMulai, setExportBulanMulai] = useState("Januari");
  const [exportBulanAkhir, setExportBulanAkhir] = useState("Desember");
  const [exportTahun, setExportTahun] = useState(currentYear);
  
  const [formData, setFormData] = useState({
    jenis_mekanisme_penetapan: "",
    jumlah_keputusan: 0,
    hasil_monev: "",
    tindak_lanjut: "",
    keterangan: "",
  });

  useEffect(() => {
    fetchData();
    fetchSatkerList();
  }, []);

  const fetchSatkerList = async () => {
    try {
      const { data: satkerData, error } = await supabase
        .from("satuan_kerja")
        .select("nama_satuan_kerja")
        .order("no_urut", { ascending: true });
      
      if (error) throw error;
      setSatkerList(satkerData?.map(s => s.nama_satuan_kerja) || []);
    } catch (error) {
      console.error("Error fetching satker:", error);
    }
  };

  const fetchData = async () => {
    try {
      const { data: result, error } = await supabase
        .from("monev_laporan")
        .select("*")
        .order("no_urut", { ascending: true });

      if (error) throw error;
      setData(result || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      jenis_mekanisme_penetapan: "",
      jumlah_keputusan: 0,
      hasil_monev: "",
      tindak_lanjut: "",
      keterangan: "",
    });
    setEditingData(null);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.jenis_mekanisme_penetapan) {
        toast.error("Jenis Mekanisme Penetapan wajib diisi");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || "unknown";

      if (editingData) {
        const { error } = await supabase
          .from("monev_laporan")
          .update({
            jenis_mekanisme_penetapan: formData.jenis_mekanisme_penetapan,
            jumlah_keputusan: formData.jumlah_keputusan,
            hasil_monev: formData.hasil_monev || null,
            tindak_lanjut: formData.tindak_lanjut || null,
            keterangan: formData.keterangan || null,
          })
          .eq("id", editingData.id);

        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const nextNoUrut = data.length > 0 ? Math.max(...data.map(d => d.no_urut || 0)) + 1 : 1;
        
        const { error } = await supabase
          .from("monev_laporan")
          .insert({
            no_urut: nextNoUrut,
            jenis_mekanisme_penetapan: formData.jenis_mekanisme_penetapan,
            jumlah_keputusan: formData.jumlah_keputusan,
            hasil_monev: formData.hasil_monev || null,
            tindak_lanjut: formData.tindak_lanjut || null,
            keterangan: formData.keterangan || null,
            created_by_email: userEmail,
          });

        if (error) throw error;
        toast.success("Data berhasil ditambahkan");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error saving data:", error);
      toast.error("Gagal menyimpan data");
    }
  };

  const handleEdit = (item: MonevLaporan) => {
    setEditingData(item);
    setFormData({
      jenis_mekanisme_penetapan: item.jenis_mekanisme_penetapan,
      jumlah_keputusan: item.jumlah_keputusan,
      hasil_monev: item.hasil_monev || "",
      tindak_lanjut: item.tindak_lanjut || "",
      keterangan: item.keterangan || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("monev_laporan")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Data berhasil dihapus");
      setDeleteId(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting data:", error);
      toast.error("Gagal menghapus data");
    }
  };

  const handleDeleteAll = async () => {
    try {
      const { error } = await supabase
        .from("monev_laporan")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;
      toast.success("Semua data berhasil dihapus");
      setDeleteAllOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting all data:", error);
      toast.error("Gagal menghapus semua data");
    }
  };

  const handleExportExcel = () => {
    const exportData = data.map((item, index) => ({
      No: item.no_urut || index + 1,
      "Jenis Mekanisme Penetapan": item.jenis_mekanisme_penetapan,
      "Jumlah Keputusan": item.jumlah_keputusan,
      "Hasil Monev": item.hasil_monev || "",
      "Tindak Lanjut": item.tindak_lanjut || "",
      Keterangan: item.keterangan || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Monev");
    XLSX.writeFile(wb, "laporan_monev.xlsx");
    toast.success("Data berhasil diekspor ke Excel");
  };

  const handleExportWord = async () => {
    try {
      const tableRows = [
        new DocxTableRow({
          children: [
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })] })], width: { size: 5, type: WidthType.PERCENTAGE } }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Jenis Mekanisme Penetapan", bold: true })] })], width: { size: 25, type: WidthType.PERCENTAGE } }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Jumlah Keputusan", bold: true })] })], width: { size: 15, type: WidthType.PERCENTAGE } }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Hasil Monev", bold: true })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tindak Lanjut", bold: true })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
            new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Keterangan", bold: true })] })], width: { size: 15, type: WidthType.PERCENTAGE } }),
          ],
        }),
        ...data.map((item, index) => 
          new DocxTableRow({
            children: [
              new DocxTableCell({ children: [new Paragraph({ text: String(item.no_urut || index + 1) })] }),
              new DocxTableCell({ children: [new Paragraph({ text: item.jenis_mekanisme_penetapan })] }),
              new DocxTableCell({ children: [new Paragraph({ text: String(item.jumlah_keputusan), alignment: AlignmentType.CENTER })] }),
              new DocxTableCell({ children: [new Paragraph({ text: item.hasil_monev || "-" })] }),
              new DocxTableCell({ children: [new Paragraph({ text: item.tindak_lanjut || "-" })] }),
              new DocxTableCell({ children: [new Paragraph({ text: item.keterangan || "-" })] }),
            ],
          })
        ),
      ];

      // Header text with Satker and Period
      const satkerText = exportSatker ? `pada ${exportSatker}` : "pada .... (Unit Eselon I/non Eselon)";
      const periodeText = `Periode Bulan ${exportBulanMulai} s.d. ${exportBulanAkhir} Tahun ${exportTahun}`;

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Laporan Hasil Monitoring dan Evaluasi", bold: true, size: 28 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Penetapan Jabatan dan Peringkat bagi Pelaksana ${satkerText}`, size: 24 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: periodeText, size: 24 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new DocxTable({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `laporan_monev_${exportTahun}.docx`);
      toast.success("Laporan berhasil diekspor ke Word");
      setExportDialogOpen(false);
    } catch (error: any) {
      console.error("Error exporting to Word:", error);
      toast.error("Gagal mengekspor ke Word");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email || "unknown";

        for (const row of jsonData as any[]) {
          await supabase.from("monev_laporan").insert({
            no_urut: row["No"] || null,
            jenis_mekanisme_penetapan: row["Jenis Mekanisme Penetapan"] || "",
            jumlah_keputusan: parseInt(row["Jumlah Keputusan"]) || 0,
            hasil_monev: row["Hasil Monev"] || null,
            tindak_lanjut: row["Tindak Lanjut"] || null,
            keterangan: row["Keterangan"] || null,
            created_by_email: userEmail,
          });
        }

        toast.success("Data berhasil diimpor");
        fetchData();
      };
      reader.readAsBinaryString(file);
    } catch (error: any) {
      console.error("Error importing data:", error);
      toast.error("Gagal mengimpor data");
    }
    e.target.value = "";
  };

  const filteredData = data.filter(item => 
    !searchTerm || 
    item.jenis_mekanisme_penetapan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari jenis mekanisme..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteAllOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Semua
              </Button>
            )}
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
              <FileDown className="h-4 w-4 mr-2" />
              Export Word
            </Button>
            {isAdmin && (
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Excel
                </Button>
              </div>
            )}
            {isAdmin && (
              <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Data
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="rounded-md border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Jenis Mekanisme Penetapan</TableHead>
              <TableHead>Jumlah Keputusan</TableHead>
              <TableHead>Hasil Monev</TableHead>
              <TableHead>Tindak Lanjut</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "Tidak ada data yang cocok" : "Belum ada data. Klik \"Tambah Data\" untuk menambahkan."}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{item.no_urut || index + 1}</TableCell>
                  <TableCell className="font-medium">{item.jenis_mekanisme_penetapan}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.jumlah_keputusan}</Badge>
                  </TableCell>
                  <TableCell>{item.hasil_monev || "-"}</TableCell>
                  <TableCell>{item.tindak_lanjut || "-"}</TableCell>
                  <TableCell>{item.keterangan || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingData ? "Edit Data" : "Tambah Data Laporan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis Mekanisme Penetapan *</Label>
              <Input
                value={formData.jenis_mekanisme_penetapan}
                onChange={(e) => setFormData({ ...formData, jenis_mekanisme_penetapan: e.target.value })}
                placeholder="Contoh: Penetapan Reguler, Penetapan Khusus"
              />
            </div>
            <div className="space-y-2">
              <Label>Jumlah Keputusan *</Label>
              <Input
                type="number"
                value={formData.jumlah_keputusan}
                onChange={(e) => setFormData({ ...formData, jumlah_keputusan: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Hasil Monev</Label>
              <Textarea
                value={formData.hasil_monev}
                onChange={(e) => setFormData({ ...formData, hasil_monev: e.target.value })}
                placeholder="Hasil monitoring dan evaluasi"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Tindak Lanjut</Label>
              <Textarea
                value={formData.tindak_lanjut}
                onChange={(e) => setFormData({ ...formData, tindak_lanjut: e.target.value })}
                placeholder="Tindak lanjut yang diperlukan"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Input
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                placeholder="Keterangan (opsional)"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {editingData ? "Simpan Perubahan" : "Tambah Data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data Monev?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus SEMUA data Monev? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Word Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Laporan Monev ke Word</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Satker (Satuan Kerja)</Label>
              <select
                value={exportSatker}
                onChange={(e) => setExportSatker(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Pilih Satker...</option>
                {satkerList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bulan Mulai</Label>
                <select
                  value={exportBulanMulai}
                  onChange={(e) => setExportBulanMulai(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {BULAN_OPTIONS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Bulan Akhir</Label>
                <select
                  value={exportBulanAkhir}
                  onChange={(e) => setExportBulanAkhir(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {BULAN_OPTIONS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tahun</Label>
              <select
                value={exportTahun}
                onChange={(e) => setExportTahun(parseInt(e.target.value))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {TAHUN_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-medium">Preview Header:</p>
              <p className="text-muted-foreground mt-1">
                Penetapan Jabatan dan Peringkat bagi Pelaksana pada {exportSatker || "...."}
              </p>
              <p className="text-muted-foreground">
                Periode Bulan {exportBulanMulai} s.d. {exportBulanAkhir} Tahun {exportTahun}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleExportWord}>
              <FileDown className="h-4 w-4 mr-2" />
              Export Word
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rekap Grading Section */}
      <MonevRekapGradingSection />
    </div>
  );
}
