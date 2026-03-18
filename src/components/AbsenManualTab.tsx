import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Pencil, Trash2, FileText, Users } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";
import logoKemenkeu from "@/assets/logo-kemenkeu-pdf.png";
import AbsenNamaDialog from "@/components/AbsenNamaDialog";

interface AbsenManual {
  id: string;
  nama_kegiatan: string;
  tanggal: string;
  tempat: string;
  jumlah_page: number;
  created_at: string;
  created_by_email: string | null;
}

export default function AbsenManualTab() {
  const { user, role } = useAuth();
  const canEdit = role !== "overview";
  const [data, setData] = useState<AbsenManual[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showAbsenNamaDialog, setShowAbsenNamaDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<AbsenManual | null>(null);
  const [formData, setFormData] = useState({
    nama_kegiatan: "",
    tanggal: new Date(),
    tempat: "",
    jumlah_page: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: result, error } = await supabase
      .from("absen_manual")
      .select("*")
      .order("tanggal", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data absen manual");
      console.error(error);
    } else {
      setData(result || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama_kegiatan || !formData.tempat) {
      toast.error("Nama kegiatan dan tempat harus diisi");
      return;
    }

    if (editingItem) {
      const { error } = await supabase
        .from("absen_manual")
        .update({
          nama_kegiatan: formData.nama_kegiatan,
          tanggal: format(formData.tanggal, "yyyy-MM-dd"),
          tempat: formData.tempat,
          jumlah_page: formData.jumlah_page
        })
        .eq("id", editingItem.id);

      if (error) {
        toast.error("Gagal mengubah data");
        return;
      }
      toast.success("Data berhasil diubah");
    } else {
      const { error } = await supabase
        .from("absen_manual")
        .insert({
          nama_kegiatan: formData.nama_kegiatan,
          tanggal: format(formData.tanggal, "yyyy-MM-dd"),
          tempat: formData.tempat,
          jumlah_page: formData.jumlah_page,
          created_by_email: user?.email
        });

      if (error) {
        toast.error("Gagal menyimpan data");
        return;
      }
      toast.success("Data berhasil ditambahkan");
    }

    setShowDialog(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    
    const { error } = await supabase.from("absen_manual").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus data");
      return;
    }
    toast.success("Data berhasil dihapus");
    fetchData();
  };

  const handleEdit = (item: AbsenManual) => {
    setEditingItem(item);
    setFormData({
      nama_kegiatan: item.nama_kegiatan,
      tanggal: new Date(item.tanggal),
      tempat: item.tempat,
      jumlah_page: item.jumlah_page
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      nama_kegiatan: "",
      tanggal: new Date(),
      tempat: "",
      jumlah_page: 1
    });
  };

  const generatePDF = async (item: AbsenManual) => {
    const rowsPerPage = 20;
    const totalRows = item.jumlah_page * rowsPerPage;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    
    // Calculate column widths
    const colNo = 12;
    const colNama = (contentWidth - colNo) * 0.4;
    const colUnit = (contentWidth - colNo) * 0.35;
    const colTTD = (contentWidth - colNo) * 0.25;
    
    let currentRow = 0;
    
    // Load logo image
    const loadImage = (src: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => resolve("");
        img.src = src;
      });
    };
    
    const logoBase64 = await loadImage(logoKemenkeu);
    
    const drawHeader = () => {
      // Add logo on the left - widened for symmetrical pentagon shape
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", margin, 8, 22, 22);
      }
      
      // Kop Surat Header - shifted right to account for logo
      const textCenterX = (pageWidth + margin + 22) / 2;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("KEMENTERIAN KEUANGAN REPUBLIK INDONESIA", textCenterX, 12, { align: "center" });
      
      doc.setFontSize(9);
      doc.text("DIREKTORAT JENDERAL BEA DAN CUKAI", textCenterX, 17, { align: "center" });
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I", textCenterX, 22, { align: "center" });
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("JALAN RAYA BANDARA JUANDA NOMOR 39, DESA SEMAMBUNG, SIDOARJO 61254", textCenterX, 27, { align: "center" });
      doc.text("TELEPON (031) 8675356; FAKSIMILE (031) 8675335; LAMAN kanwiljatim1.beacukai.go.id", textCenterX, 31, { align: "center" });
      doc.text("PUSAT KONTAK LAYANAN 1500225; SUREL kwbcjatim1@customs.go.id", textCenterX, 35, { align: "center" });
      
      // Draw line under header
      doc.setLineWidth(0.5);
      doc.line(margin, 38, pageWidth - margin, 38);
      doc.setLineWidth(0.2);
      doc.line(margin, 39, pageWidth - margin, 39);
    };
    
    for (let page = 0; page < item.jumlah_page; page++) {
      if (page > 0) doc.addPage();
      
      // Draw kop surat header
      drawHeader();
      
      // Title (nama kegiatan)
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(item.nama_kegiatan, pageWidth / 2, 50, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Tanggal : ${format(new Date(item.tanggal), "EEEE, d MMMM yyyy", { locale: id })}`, margin, 60);
      doc.text(`Tempat : ${item.tempat}`, margin, 66);
      
      // Table header
      let y = 75;
      const headerHeight = 9;
      const rowHeight = 9;
      
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, contentWidth, headerHeight, "F");
      doc.setDrawColor(0);
      doc.rect(margin, y, contentWidth, headerHeight);
      
      // Column headers
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      let x = margin;
      
      doc.rect(x, y, colNo, headerHeight);
      doc.text("No", x + colNo / 2, y + 6, { align: "center" });
      x += colNo;
      
      doc.rect(x, y, colNama, headerHeight);
      doc.text("Nama", x + colNama / 2, y + 6, { align: "center" });
      x += colNama;
      
      doc.rect(x, y, colUnit, headerHeight);
      doc.text("Unit Kerja", x + colUnit / 2, y + 6, { align: "center" });
      x += colUnit;
      
      doc.rect(x, y, colTTD, headerHeight);
      doc.text("Tanda Tangan", x + colTTD / 2, y + 6, { align: "center" });
      
      // Table rows
      y += headerHeight;
      doc.setFont("helvetica", "normal");
      
      for (let row = 0; row < rowsPerPage; row++) {
        currentRow++;
        if (currentRow > totalRows) break;
        
        x = margin;
        
        doc.rect(x, y, colNo, rowHeight);
        doc.text(String(currentRow), x + colNo / 2, y + 6, { align: "center" });
        x += colNo;
        
        doc.rect(x, y, colNama, rowHeight);
        x += colNama;
        
        doc.rect(x, y, colUnit, rowHeight);
        x += colUnit;
        
        doc.rect(x, y, colTTD, rowHeight);
        
        y += rowHeight;
      }
      
      // Page number
      doc.setFontSize(8);
      doc.text(`Halaman ${page + 1} dari ${item.jumlah_page}`, pageWidth / 2, 285, { align: "center" });
    }
    
    doc.save(`Absen_${item.nama_kegiatan.replace(/\s+/g, "_")}_${format(new Date(item.tanggal), "yyyyMMdd")}.pdf`);
    toast.success("PDF berhasil di-generate");
  };

  return (
    <div className="space-y-6">
      {/* Absen Manual Kegiatan Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Absen Manual Kegiatan</CardTitle>
          {canEdit && (
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kegiatan
            </Button>
          )}
        </CardHeader>
        <CardContent>
        {loading ? (
          <div className="text-center py-8">Memuat data...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada data absen manual
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama Kegiatan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tempat</TableHead>
                <TableHead className="text-center">Jumlah Page</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.nama_kegiatan}</TableCell>
                  <TableCell>{format(new Date(item.tanggal), "dd MMM yyyy", { locale: id })}</TableCell>
                  <TableCell>{item.tempat}</TableCell>
                  <TableCell className="text-center">{item.jumlah_page}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generatePDF(item)}
                        title="Generate PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      {canEdit && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Kegiatan" : "Tambah Kegiatan"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nama_kegiatan">Nama Kegiatan</Label>
                <Input
                  id="nama_kegiatan"
                  value={formData.nama_kegiatan}
                  onChange={(e) => setFormData({ ...formData, nama_kegiatan: e.target.value })}
                  placeholder="Contoh: Jam Pimpinan DJBC"
                  required
                />
              </div>
              
              <div>
                <Label>Tanggal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.tanggal, "PPP", { locale: id })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.tanggal}
                      onSelect={(date) => date && setFormData({ ...formData, tanggal: date })}
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="tempat">Tempat</Label>
                <Input
                  id="tempat"
                  value={formData.tempat}
                  onChange={(e) => setFormData({ ...formData, tempat: e.target.value })}
                  placeholder="Contoh: Auditorium Bung Tomo"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="jumlah_page">Berapa Page?</Label>
                <Input
                  id="jumlah_page"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.jumlah_page}
                  onChange={(e) => setFormData({ ...formData, jumlah_page: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Setiap halaman berisi 15 baris untuk tanda tangan
                </p>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingItem ? "Simpan Perubahan" : "Tambah"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>

    {/* Absen Nama Card */}
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Absen Nama
        </CardTitle>
        {canEdit && (
          <Button onClick={() => setShowAbsenNamaDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Absen Nama
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Buat daftar absen dengan nama pegawai yang sudah terisi otomatis berdasarkan data kepegawaian.
        </p>
      </CardContent>
    </Card>

    {/* Absen Nama Dialog */}
    <AbsenNamaDialog
      open={showAbsenNamaDialog}
      onOpenChange={setShowAbsenNamaDialog}
      onSuccess={fetchData}
    />
  </div>
  );
}