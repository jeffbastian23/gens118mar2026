import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Download, Upload, Search, Building2, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SatuanKerja {
  id: string;
  no_urut: number | null;
  nama_satuan_kerja: string;
  kode_satuan_kerja: string | null;
  alamat: string | null;
  keterangan: string | null;
  created_at?: string;
  updated_at?: string;
}

interface SatuanKerjaTabProps {
  isAdmin: boolean;
  canEdit: boolean;
}

// Struktur hierarki Kanwil DJBC Jawa Timur I
const KANWIL_HIERARCHY = {
  code: "WBC.11",
  name: "Kantor Wilayah Direktorat Jenderal Bea dan Cukai Jawa Timur I",
  children: [
    {
      code: "A",
      name: "Bagian Umum",
      kode: "WBC.111",
      level: "Eselon III",
      children: [
        { name: "Subbagian Kepegawaian", level: "Eselon IV" },
        { name: "Subbagian Tata Usaha dan Keuangan", level: "Eselon IV" },
        { name: "Subbagian Rumah Tangga", level: "Eselon IV" },
      ]
    },
    {
      code: "B",
      name: "Bidang Kepabeanan dan Cukai",
      kode: "WBC.112",
      level: "Eselon III",
      children: [
        { name: "Seksi Keberatan dan Banding", level: "Eselon IV" },
        { name: "Seksi Bantuan Hukum", level: "Eselon IV" },
        { name: "Seksi Pemeriksaan", level: "Eselon IV" },
        { name: "Seksi Penerimaan dan Pengelolaan Data", level: "Eselon IV" },
      ]
    },
    {
      code: "C",
      name: "Bidang Penindakan dan Penyidikan",
      kode: "WBC.114",
      level: "Eselon III",
      children: [
        { name: "Seksi Intelijen", level: "Eselon IV" },
        { name: "Seksi Penindakan I", level: "Eselon IV" },
        { name: "Seksi Penindakan II", level: "Eselon IV" },
        { name: "Seksi Narkotika dan Barang Larangan", level: "Eselon IV" },
        { name: "Seksi Penyidikan dan Barang Hasil Penindakan", level: "Eselon IV" },
      ]
    },
    {
      code: "D",
      name: "Bidang Kepatuhan Internal",
      kode: "WBC.115",
      level: "Eselon III",
      children: [
        { name: "Seksi Kepatuhan Pelaksanaan Tugas Pelayanan", level: "Eselon IV" },
        { name: "Seksi Kepatuhan Pelaksanaan Tugas Pengawasan", level: "Eselon IV" },
        { name: "Seksi Kepatuhan Pelaksanaan Tugas Administrasi", level: "Eselon IV" },
      ]
    },
    {
      code: "E",
      name: "Bidang Fasilitas Kepabeanan dan Cukai",
      kode: "WBC.113",
      level: "Eselon III",
      children: [
        { name: "Seksi Perijinan dan Fasilitas I", level: "Eselon IV" },
        { name: "Seksi Perijinan dan Fasilitas II", level: "Eselon IV" },
        { name: "Seksi Perijinan dan Fasilitas III", level: "Eselon IV" },
        { name: "Seksi Bimbingan Kepatuhan dan Hubungan Masyarakat", level: "Eselon IV" },
      ]
    },
    {
      code: "F",
      name: "Sub Unsur Keberatan dan Banding",
      kode: "WBC.111/PaBC.02",
      level: "Eselon III",
      children: []
    },
    {
      code: "G",
      name: "Sub Unsur Audit Kepabeanan dan Cukai",
      kode: "WBC.111/PaBC.03",
      level: "Eselon III",
      children: []
    },
  ]
};

export default function SatuanKerjaTab({ isAdmin, canEdit }: SatuanKerjaTabProps) {
  const [data, setData] = useState<SatuanKerja[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<SatuanKerja | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama_satuan_kerja: "",
    kode_satuan_kerja: "",
    kode_kantor: "",
    alamat: "",
    keterangan: "",
  });
  const [expandedKanwil, setExpandedKanwil] = useState(true);
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: result, error } = await supabase
        .from("satuan_kerja")
        .select("*")
        .order("no_urut", { ascending: true });

      if (error) throw error;
      setData(result || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data satuan kerja");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nama_satuan_kerja: "",
      kode_satuan_kerja: "",
      kode_kantor: "",
      alamat: "",
      keterangan: "",
    });
    setEditingData(null);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.nama_satuan_kerja) {
        toast.error("Nama Satuan Kerja wajib diisi");
        return;
      }

      if (editingData) {
        const { error } = await supabase
          .from("satuan_kerja")
          .update({
            nama_satuan_kerja: formData.nama_satuan_kerja,
            kode_satuan_kerja: formData.kode_satuan_kerja || null,
            kode_kantor: formData.kode_kantor || null,
            alamat: formData.alamat || null,
            keterangan: formData.keterangan || null,
          } as any)
          .eq("id", editingData.id);

        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const nextNoUrut = data.length > 0 ? Math.max(...data.map(d => d.no_urut || 0)) + 1 : 1;
        
        const { error } = await supabase
          .from("satuan_kerja")
          .insert({
            no_urut: nextNoUrut,
            nama_satuan_kerja: formData.nama_satuan_kerja,
            kode_satuan_kerja: formData.kode_satuan_kerja || null,
            kode_kantor: formData.kode_kantor || null,
            alamat: formData.alamat || null,
            keterangan: formData.keterangan || null,
          } as any);

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

  const handleEdit = (item: SatuanKerja) => {
    setEditingData(item);
    setFormData({
      nama_satuan_kerja: item.nama_satuan_kerja,
      kode_satuan_kerja: item.kode_satuan_kerja || "",
      kode_kantor: (item as any).kode_kantor || "",
      alamat: item.alamat || "",
      keterangan: item.keterangan || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("satuan_kerja")
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

  const handleExport = () => {
    const exportData = data.map((item, index) => ({
      No: item.no_urut || index + 1,
      "Nama Satuan Kerja": item.nama_satuan_kerja,
      "Kode Satuan Kerja": item.kode_satuan_kerja || "",
      "Kode Kantor": (item as any).kode_kantor || "",
      Alamat: item.alamat || "",
      Keterangan: item.keterangan || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Satuan Kerja");
    XLSX.writeFile(wb, "satuan_kerja.xlsx");
    toast.success("Data berhasil diekspor");
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

        for (const row of jsonData as any[]) {
          await supabase.from("satuan_kerja").insert({
            no_urut: row["No"] || null,
            nama_satuan_kerja: row["Nama Satuan Kerja"] || "",
            kode_satuan_kerja: row["Kode Satuan Kerja"] || null,
            kode_kantor: row["Kode Kantor"] || null,
            alamat: row["Alamat"] || null,
            keterangan: row["Keterangan"] || null,
          } as any);
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

  const toggleUnit = (code: string) => {
    setExpandedUnits(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const filteredData = data.filter(item => 
    !searchTerm || 
    item.nama_satuan_kerja.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.kode_satuan_kerja && item.kode_satuan_kerja.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Check if current item is Kanwil (code WBC.11 or KANWIL)
  const isKanwil = (item: SatuanKerja) => 
    item.kode_satuan_kerja === "KANWIL" || 
    item.kode_satuan_kerja === "WBC.11" ||
    item.nama_satuan_kerja.includes("Kantor Wilayah Direktorat Jenderal Bea dan Cukai Jawa Timur I");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Satuan Kerja
            <Badge variant="secondary" className="ml-2">
              Total: {data.length}
            </Badge>
          </span>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
                <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari satuan kerja..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama Satuan Kerja</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Kode Kantor</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Keterangan</TableHead>
                {canEdit && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Tidak ada data yang cocok" : "Belum ada data satuan kerja."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <>
                    <TableRow key={item.id} className={isKanwil(item) ? "bg-primary/5" : ""}>
                      <TableCell>{item.no_urut || index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {isKanwil(item) ? (
                          <Collapsible open={expandedKanwil} onOpenChange={setExpandedKanwil}>
                            <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary cursor-pointer">
                              {expandedKanwil ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              {item.nama_satuan_kerja}
                            </CollapsibleTrigger>
                          </Collapsible>
                        ) : (
                          item.nama_satuan_kerja
                        )}
                      </TableCell>
                      <TableCell>
                        {item.kode_satuan_kerja && (
                          <Badge variant="outline">{item.kode_satuan_kerja}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {(item as any).kode_kantor ? (
                          <Badge variant="secondary">{(item as any).kode_kantor}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{item.alamat || "-"}</TableCell>
                      <TableCell>{item.keterangan || "-"}</TableCell>
                      {canEdit && (
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
                      )}
                    </TableRow>
                    {/* Hierarchical sub-units for Kanwil */}
                    {isKanwil(item) && expandedKanwil && (
                      <>
                        {KANWIL_HIERARCHY.children.map((unit) => (
                          <>
                            <TableRow key={`unit-${unit.code}`} className="bg-muted/30">
                              <TableCell></TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2 pl-6">
                                  {unit.children.length > 0 ? (
                                    <Collapsible 
                                      open={expandedUnits[unit.code]} 
                                      onOpenChange={() => toggleUnit(unit.code)}
                                    >
                                      <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary cursor-pointer">
                                        {expandedUnits[unit.code] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        <span className="font-semibold text-primary">{unit.code}.</span>
                                        {unit.name}
                                      </CollapsibleTrigger>
                                    </Collapsible>
                                  ) : (
                                    <>
                                      <span className="font-semibold text-primary">{unit.code}.</span>
                                      {unit.name}
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {(unit as any).kode || unit.level}
                                </Badge>
                              </TableCell>
                              <TableCell>-</TableCell>
                              <TableCell>-</TableCell>
                              <TableCell>-</TableCell>
                              {canEdit && <TableCell></TableCell>}
                            </TableRow>
                            {/* Sub-units (Eselon IV) */}
                            {unit.children.length > 0 && expandedUnits[unit.code] && (
                              unit.children.map((subUnit, subIndex) => (
                                <TableRow key={`subunit-${unit.code}-${subIndex}`} className="bg-muted/10">
                                  <TableCell></TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2 pl-12">
                                      <span className="text-muted-foreground">-</span>
                                      {subUnit.name}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">{subUnit.level}</Badge>
                                  </TableCell>
                                  <TableCell>-</TableCell>
                                  <TableCell>-</TableCell>
                                  <TableCell>-</TableCell>
                                  {canEdit && <TableCell></TableCell>}
                                </TableRow>
                              ))
                            )}
                          </>
                        ))}
                      </>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingData ? "Edit Satuan Kerja" : "Tambah Satuan Kerja"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Satuan Kerja *</Label>
              <Input
                value={formData.nama_satuan_kerja}
                onChange={(e) => setFormData({ ...formData, nama_satuan_kerja: e.target.value })}
                placeholder="Masukkan nama satuan kerja"
              />
            </div>
            <div className="space-y-2">
              <Label>Kode Satuan Kerja</Label>
              <Input
                value={formData.kode_satuan_kerja}
                onChange={(e) => setFormData({ ...formData, kode_satuan_kerja: e.target.value })}
                placeholder="Contoh: KANWIL, KPPBC-TP, WBC.11"
              />
            </div>
            <div className="space-y-2">
              <Label>Kode Kantor</Label>
              <Input
                value={formData.kode_kantor}
                onChange={(e) => setFormData({ ...formData, kode_kantor: e.target.value })}
                placeholder="Contoh: 070000, 070100, 070500"
              />
              <p className="text-xs text-muted-foreground">
                Contoh: Kanwil DJBC Jawa Timur I = 070000, KPPBC TMP Tanjung Perak = 070100
              </p>
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Textarea
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Alamat satuan kerja (opsional)"
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
              Apakah Anda yakin ingin menghapus satuan kerja ini? Tindakan ini tidak dapat dibatalkan.
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
    </Card>
  );
}

// Export options for use in other components
export const ESELON_III_OPTIONS = [
  "Bagian Umum",
  "Bidang Kepabeanan dan Cukai",
  "Bidang Penindakan dan Penyidikan",
  "Bidang Kepatuhan Internal",
  "Bidang Fasilitas Kepabeanan dan Cukai",
  "Sub Unsur Keberatan dan Banding",
  "Sub Unsur Audit Kepabeanan dan Cukai",
  "KPPBC TMP Tanjung Perak",
  "KPPBC TMP Juanda",
  "KPPBC TMP A Pasuruan",
  "KPPBC TMP B Gresik",
  "KPPBC TMP B Sidoarjo",
  "KPPBC TMP C Bojonegoro",
  "KPPBC TMP C Madura",
  "BLBC Kelas I Surabaya",
];

export const ESELON_IV_OPTIONS = [
  "Subbagian Kepegawaian",
  "Subbagian Tata Usaha dan Keuangan",
  "Subbagian Rumah Tangga",
  "Seksi Keberatan dan Banding",
  "Seksi Bantuan Hukum",
  "Seksi Pemeriksaan",
  "Seksi Penerimaan dan Pengelolaan Data",
  "Seksi Intelijen",
  "Seksi Penindakan I",
  "Seksi Penindakan II",
  "Seksi Narkotika dan Barang Larangan",
  "Seksi Penyidikan dan Barang Hasil Penindakan",
  "Seksi Kepatuhan Pelaksanaan Tugas Pelayanan",
  "Seksi Kepatuhan Pelaksanaan Tugas Pengawasan",
  "Seksi Kepatuhan Pelaksanaan Tugas Administrasi",
  "Seksi Perijinan dan Fasilitas I",
  "Seksi Perijinan dan Fasilitas II",
  "Seksi Perijinan dan Fasilitas III",
  "Seksi Bimbingan Kepatuhan dan Hubungan Masyarakat",
  // KPPBC & BLBC Eselon IV
  "Subbagian Umum",
  "Seksi Kepatuhan Internal",
  "Seksi Penindakan dan Penyidikan",
  "Seksi Perbendaharaan",
  "Seksi Penyuluhan dan Layanan Informasi",
  "Seksi Pengolahan Data dan Administrasi Dokumen",
  "Seksi Administrasi Manifes",
  "Seksi Pelayanan Kepabeanan dan Cukai I",
  "Seksi Pelayanan Kepabeanan dan Cukai II",
  "Seksi Pelayanan Kepabeanan dan Cukai III",
  "Seksi Pelayanan Kepabeanan dan Cukai IV",
  "Seksi Pelayanan Kepabeanan dan Cukai V",
  "Seksi Pelayanan Kepabeanan dan Cukai VI",
  "Seksi Pelayanan Kepabeanan dan Cukai VII",
  "Seksi Pelayanan Kepabeanan dan Cukai VIII",
  "Seksi Pelayanan Kepabeanan dan Cukai IX",
  "Seksi Pelayanan Kepabeanan dan Cukai X",
  "Seksi Kepatuhan Internal dan Penyuluhan",
  "Seksi Pelayanan Kepabeanan dan Cukai dan Dukungan Teknis",
  "Subbagian Umum dan Kepatuhan Internal",
  "Seksi Teknis Laboratorium",
  "Seksi Penjaminan Mutu Laboratorium",
];

// Mapping Eselon III to Eselon IV options based on KANWIL_HIERARCHY
export const ESELON_III_TO_IV_MAP: Record<string, string[]> = {
  "Bagian Umum": [
    "Subbagian Kepegawaian",
    "Subbagian Tata Usaha dan Keuangan",
    "Subbagian Rumah Tangga",
  ],
  "Bidang Kepabeanan dan Cukai": [
    "Seksi Keberatan dan Banding",
    "Seksi Bantuan Hukum",
    "Seksi Pemeriksaan",
    "Seksi Penerimaan dan Pengelolaan Data",
  ],
  "Bidang Penindakan dan Penyidikan": [
    "Seksi Intelijen",
    "Seksi Penindakan I",
    "Seksi Penindakan II",
    "Seksi Narkotika dan Barang Larangan",
    "Seksi Penyidikan dan Barang Hasil Penindakan",
  ],
  "Bidang Kepatuhan Internal": [
    "Seksi Kepatuhan Pelaksanaan Tugas Pelayanan",
    "Seksi Kepatuhan Pelaksanaan Tugas Pengawasan",
    "Seksi Kepatuhan Pelaksanaan Tugas Administrasi",
  ],
  "Bidang Fasilitas Kepabeanan dan Cukai": [
    "Seksi Perijinan dan Fasilitas I",
    "Seksi Perijinan dan Fasilitas II",
    "Seksi Perijinan dan Fasilitas III",
    "Seksi Bimbingan Kepatuhan dan Hubungan Masyarakat",
  ],
  "Sub Unsur Keberatan dan Banding": [],
  "Sub Unsur Audit Kepabeanan dan Cukai": [],
  "KPPBC TMP Tanjung Perak": [
    "Subbagian Umum",
    "Seksi Kepatuhan Internal",
    "Seksi Penindakan dan Penyidikan",
    "Seksi Perbendaharaan",
    "Seksi Penyuluhan dan Layanan Informasi",
    "Seksi Pengolahan Data dan Administrasi Dokumen",
    "Seksi Administrasi Manifes",
    "Seksi Pelayanan Kepabeanan dan Cukai I",
    "Seksi Pelayanan Kepabeanan dan Cukai II",
    "Seksi Pelayanan Kepabeanan dan Cukai III",
    "Seksi Pelayanan Kepabeanan dan Cukai IV",
    "Seksi Pelayanan Kepabeanan dan Cukai V",
    "Seksi Pelayanan Kepabeanan dan Cukai VI",
    "Seksi Pelayanan Kepabeanan dan Cukai VII",
    "Seksi Pelayanan Kepabeanan dan Cukai VIII",
    "Seksi Pelayanan Kepabeanan dan Cukai IX",
  ],
  "KPPBC TMP Juanda": [
    "Subbagian Umum",
    "Seksi Kepatuhan Internal",
    "Seksi Penindakan dan Penyidikan",
    "Seksi Perbendaharaan",
    "Seksi Penyuluhan dan Layanan Informasi",
    "Seksi Pengolahan Data dan Administrasi Dokumen",
    "Seksi Administrasi Manifes",
    "Seksi Pelayanan Kepabeanan dan Cukai I",
    "Seksi Pelayanan Kepabeanan dan Cukai II",
    "Seksi Pelayanan Kepabeanan dan Cukai III",
    "Seksi Pelayanan Kepabeanan dan Cukai IV",
    "Seksi Pelayanan Kepabeanan dan Cukai V",
    "Seksi Pelayanan Kepabeanan dan Cukai VI",
    "Seksi Pelayanan Kepabeanan dan Cukai VII",
    "Seksi Pelayanan Kepabeanan dan Cukai VIII",
    "Seksi Pelayanan Kepabeanan dan Cukai IX",
  ],
  "KPPBC TMP A Pasuruan": [
    "Subbagian Umum",
    "Seksi Kepatuhan Internal",
    "Seksi Penindakan dan Penyidikan",
    "Seksi Perbendaharaan",
    "Seksi Penyuluhan dan Layanan Informasi",
    "Seksi Pengolahan Data dan Administrasi Dokumen",
    "Seksi Pelayanan Kepabeanan dan Cukai I",
    "Seksi Pelayanan Kepabeanan dan Cukai II",
    "Seksi Pelayanan Kepabeanan dan Cukai III",
    "Seksi Pelayanan Kepabeanan dan Cukai IV",
    "Seksi Pelayanan Kepabeanan dan Cukai V",
    "Seksi Pelayanan Kepabeanan dan Cukai VI",
    "Seksi Pelayanan Kepabeanan dan Cukai VII",
    "Seksi Pelayanan Kepabeanan dan Cukai VIII",
    "Seksi Pelayanan Kepabeanan dan Cukai IX",
    "Seksi Pelayanan Kepabeanan dan Cukai X",
  ],
  "KPPBC TMP B Gresik": [
    "Subbagian Umum",
    "Seksi Kepatuhan Internal",
    "Seksi Penindakan dan Penyidikan",
    "Seksi Perbendaharaan",
    "Seksi Penyuluhan dan Layanan Informasi",
    "Seksi Pengolahan Data dan Administrasi Dokumen",
    "Seksi Pelayanan Kepabeanan dan Cukai I",
    "Seksi Pelayanan Kepabeanan dan Cukai II",
    "Seksi Pelayanan Kepabeanan dan Cukai III",
    "Seksi Pelayanan Kepabeanan dan Cukai IV",
    "Seksi Pelayanan Kepabeanan dan Cukai V",
    "Seksi Pelayanan Kepabeanan dan Cukai VI",
  ],
  "KPPBC TMP B Sidoarjo": [
    "Subbagian Umum",
    "Seksi Kepatuhan Internal",
    "Seksi Penindakan dan Penyidikan",
    "Seksi Perbendaharaan",
    "Seksi Penyuluhan dan Layanan Informasi",
    "Seksi Pengolahan Data dan Administrasi Dokumen",
    "Seksi Pelayanan Kepabeanan dan Cukai I",
    "Seksi Pelayanan Kepabeanan dan Cukai II",
    "Seksi Pelayanan Kepabeanan dan Cukai III",
    "Seksi Pelayanan Kepabeanan dan Cukai IV",
    "Seksi Pelayanan Kepabeanan dan Cukai V",
    "Seksi Pelayanan Kepabeanan dan Cukai VI",
  ],
  "KPPBC TMP C Bojonegoro": [
    "Subbagian Umum",
    "Seksi Kepatuhan Internal dan Penyuluhan",
    "Seksi Penindakan dan Penyidikan",
    "Seksi Perbendaharaan",
    "Seksi Pelayanan Kepabeanan dan Cukai dan Dukungan Teknis",
  ],
  "KPPBC TMP C Madura": [
    "Subbagian Umum",
    "Seksi Kepatuhan Internal dan Penyuluhan",
    "Seksi Penindakan dan Penyidikan",
    "Seksi Perbendaharaan",
    "Seksi Pelayanan Kepabeanan dan Cukai dan Dukungan Teknis",
  ],
  "BLBC Kelas I Surabaya": [
    "Subbagian Umum dan Kepatuhan Internal",
    "Seksi Teknis Laboratorium",
    "Seksi Penjaminan Mutu Laboratorium",
  ],
};
