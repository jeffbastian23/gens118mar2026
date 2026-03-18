import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Plus, Printer, Eye, Trash2, Send, ArrowRight, Search, X, Pencil, Download, FileSpreadsheet, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { useAuth } from "@/hooks/useAuth";
import { useSubMenuAccess } from "@/hooks/useSubMenuAccess";
import logoKemenkeuPrint from "@/assets/logo-kemenkeu-print.png";
import logoKemenkeuHeader from "@/assets/logo-kemenkeu-header.png";
import SuratMasukDashboard from "@/components/SuratMasukDashboard";
import SuratMasukFeedbackDialog from "@/components/SuratMasukFeedbackDialog";
import SuratMasukEditDialog from "@/components/SuratMasukEditDialog";
import BukuBambuCard from "@/components/BukuBambuCard";
import BukuBambuDialog from "@/components/BukuBambuDialog";
import BookNomorManualTable from "@/components/BookNomorManualTable";
import DistribusiSuratTable from "@/components/DistribusiSuratTable";

interface SuratMasuk {
  id: string;
  nomor_agenda: number;
  nomor_dokumen: string;
  hal: string;
  tujuan_bagian: string[];
  nama_pengirim: string;
  instansi_pengirim: string | null;
  nama_penerima: string;
  petugas_bc_penerima: string;
  foto_penerima: string | null;
  pdf_dokumen?: string | null;
  tanggal_terima: string;
  created_at: string;
  feedback_rating: number | null;
  feedback_comment: string | null;
}

interface BukuBambu {
  id: string;
  surat_masuk_id: string | null;
  dari_unit: string;
  ke_unit: string;
  nama_penerima: string;
  tanggal_kirim: string;
  catatan: string | null;
  no_urut: number;
  foto_absen: string | null;
  pdf_dokumen?: string | null;
  created_by_name: string | null;
  created_by_email: string | null;
}

const BAGIAN_OPTIONS = [
  "Bagian Umum",
  "Bidang P2",
  "Bidang KI",
  "Bidang KC",
  "Bidang Fasilitas",
  "Bidang Audit",
  "Sub Unsur Audit",
  "Sub Unsur Keban"
];

export default function SuratMasukPage() {
  const { user, fullName, role } = useAuth();
  const { hasSubMenuAccess, isAdmin } = useSubMenuAccess("surat-masuk");
  const canEdit = role !== "overview";
  const [suratMasuk, setSuratMasuk] = useState<SuratMasuk[]>([]);

  // Determine which tabs are accessible
  const tabs = [
    { value: "dashboard", label: "Dashboard", subMenuId: "surat-masuk:dashboard" },
    { value: "form", label: "Daftar Surat Masuk", subMenuId: "surat-masuk:daftar-surat-masuk" },
    { value: "buku-bambu", label: "Buku Bambu", subMenuId: "surat-masuk:buku-bambu" },
    { value: "book-nomor", label: "Book Nomor Manual", subMenuId: "surat-masuk:book-nomor" },
    { value: "distribusi-surat", label: "Distribusi Surat", subMenuId: "surat-masuk:distribusi-surat" },
  ];

  const accessibleTabs = tabs.filter(tab => hasSubMenuAccess(tab.subMenuId));
  const defaultTab = accessibleTabs.length > 0 ? accessibleTabs[0].value : "dashboard";
  const [bukuBambu, setBukuBambu] = useState<BukuBambu[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [showAddTrackingDialog, setShowAddTrackingDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showBukuBambuDialog, setShowBukuBambuDialog] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState<SuratMasuk | null>(null);
  const [editingBukuBambu, setEditingBukuBambu] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [bukuBambuSearch, setBukuBambuSearch] = useState({
    nama_penerima: "",
    unit_asal: "",
    unit_tujuan: "",
    date_from: "",
    date_to: ""
  });
  const [formData, setFormData] = useState({
    nomor_dokumen: "",
    hal: "",
    tujuan_bagian: [] as string[],
    nama_pengirim: "",
    instansi_pengirim: "",
    nama_penerima: "",
    petugas_bc_penerima: "",
    foto_penerima: "",
    pdf_dokumen: ""
  });
  const [trackingForm, setTrackingForm] = useState({
    dari_unit: "",
    ke_unit: "",
    nama_penerima: "",
    catatan: ""
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    fetchSuratMasuk();
    fetchBukuBambu();
  }, []);

  const fetchSuratMasuk = async () => {
    const { data, error } = await supabase
      .from("surat_masuk")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data surat masuk");
      return;
    }

    setSuratMasuk(data || []);
  };

  const fetchBukuBambu = async () => {
    const { data, error } = await supabase
      .from("buku_bambu")
      .select("*")
      .order("tanggal_kirim", { ascending: false });

    if (error) {
      console.error("Error fetching buku bambu:", error);
      return;
    }

    setBukuBambu(data || []);
  };

  const startCamera = async () => {
    try {
      setIsVideoReady(false);
      let mediaStream: MediaStream | null = null;
      
      try {
        // Try back camera first
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch {
        // Fallback to front camera
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      }
      
      setStream(mediaStream);
      setShowCamera(true);
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Gagal mengakses kamera. Pastikan izin kamera diaktifkan.");
    }
  };

  // Handle video element with stream
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play()
          .then(() => setIsVideoReady(true))
          .catch(console.error);
      };
    }
  }, [stream, showCamera]);

  const capturePhoto = () => {
    if (videoRef.current && isVideoReady) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setFormData({ ...formData, foto_penerima: dataUrl });
        stopCamera();
        toast.success("Foto berhasil diambil");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setIsVideoReady(false);
  };

  const handleTujuanChange = (bagian: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, tujuan_bagian: [...formData.tujuan_bagian, bagian] });
    } else {
      setFormData({ ...formData, tujuan_bagian: formData.tujuan_bagian.filter(b => b !== bagian) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.tujuan_bagian.length === 0) {
      toast.error("Pilih minimal satu tujuan bagian");
      return;
    }

    // Auto-fill petugas_bc_penerima with current user's name and email
    const petugasInfo = `${fullName || user?.email || 'Unknown'} (${user?.email || ''})`;

    const { data, error } = await supabase.from("surat_masuk").insert({
      nomor_dokumen: formData.nomor_dokumen,
      hal: formData.hal,
      tujuan_bagian: formData.tujuan_bagian,
      nama_pengirim: formData.nama_pengirim,
      instansi_pengirim: formData.instansi_pengirim || null,
      nama_penerima: formData.nama_penerima,
      petugas_bc_penerima: petugasInfo,
      foto_penerima: formData.foto_penerima || null,
      pdf_dokumen: formData.pdf_dokumen || null
    }).select().single();

    if (error) {
      toast.error("Gagal menyimpan data surat masuk");
      return;
    }

    // Auto create first buku bambu entry
    if (data && formData.tujuan_bagian.length > 0) {
      await supabase.from("buku_bambu").insert({
        surat_masuk_id: data.id,
        dari_unit: "Penerima Awal",
        ke_unit: formData.tujuan_bagian[0],
        nama_penerima: formData.nama_penerima,
        catatan: "Penerimaan awal surat masuk"
      });
    }

    toast.success("Data surat masuk berhasil disimpan");
    setShowAddDialog(false);
    resetForm();
    fetchSuratMasuk();
    fetchBukuBambu();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("surat_masuk").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus data");
      return;
    }

    toast.success("Data berhasil dihapus");
    fetchSuratMasuk();
    fetchBukuBambu();
  };

  const resetForm = () => {
    setFormData({
      nomor_dokumen: "",
      hal: "",
      tujuan_bagian: [],
      nama_pengirim: "",
      instansi_pengirim: "",
      nama_penerima: "",
      petugas_bc_penerima: "",
      foto_penerima: "",
      pdf_dokumen: ""
    });
    stopCamera();
  };

  const handleAddTracking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSurat) return;

    const { error } = await supabase.from("buku_bambu").insert({
      surat_masuk_id: selectedSurat.id,
      dari_unit: trackingForm.dari_unit,
      ke_unit: trackingForm.ke_unit,
      nama_penerima: trackingForm.nama_penerima,
      catatan: trackingForm.catatan || null
    });

    if (error) {
      toast.error("Gagal menyimpan tracking");
      return;
    }

    toast.success("Tracking berhasil ditambahkan");
    setShowAddTrackingDialog(false);
    setTrackingForm({ dari_unit: "", ke_unit: "", nama_penerima: "", catatan: "" });
    fetchBukuBambu();
  };

  const handleDeleteBukuBambu = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    const { error } = await supabase.from("buku_bambu").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus data");
      return;
    }

    toast.success("Data berhasil dihapus");
    fetchBukuBambu();
  };

  const openEditBukuBambu = (entry: BukuBambu) => {
    setEditingBukuBambu(entry);
    setShowBukuBambuDialog(true);
  };

  const viewTracking = (surat: SuratMasuk) => {
    setSelectedSurat(surat);
    setShowTrackingDialog(true);
  };

  const openAddTracking = (surat: SuratMasuk) => {
    setSelectedSurat(surat);
    // Get last tracking entry for this surat
    const suratTracking = bukuBambu.filter(b => b.surat_masuk_id === surat.id);
    const lastEntry = suratTracking[0];
    if (lastEntry) {
      setTrackingForm({ ...trackingForm, dari_unit: lastEntry.ke_unit });
    }
    setShowAddTrackingDialog(true);
  };

  const handleFeedbackSubmit = async (rating: number, comment?: string) => {
    if (!selectedSurat) return;

    const { error } = await supabase
      .from("surat_masuk")
      .update({
        feedback_rating: rating,
        feedback_comment: comment || null,
      })
      .eq("id", selectedSurat.id);

    if (error) {
      toast.error("Gagal menyimpan feedback");
      return;
    }

    toast.success("Feedback berhasil disimpan");
    fetchSuratMasuk();
  };

  const openFeedback = (surat: SuratMasuk) => {
    setSelectedSurat(surat);
    setShowFeedbackDialog(true);
  };

  const printReceipt = (surat: SuratMasuk) => {
    const doc = new jsPDF();
    
    // Add Kemenkeu logo on the left
    const img = new Image();
    img.src = logoKemenkeuHeader;
    doc.addImage(img, 'PNG', 15, 10, 25, 25);
    
    // Header text - centered and symmetric with reduced font sizes
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("KEMENTERIAN KEUANGAN REPUBLIK INDONESIA", 105, 15, { align: "center" });
    doc.setFontSize(9);
    doc.text("DIREKTORAT JENDERAL BEA DAN CUKAI", 105, 20, { align: "center" });
    doc.setFontSize(8);
    doc.text("KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I", 105, 25, { align: "center" });
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("JALAN RAYA BANDARA JUANDA NOMOR 39, DESA SEMAMBUNG, SIDOARJO 61254", 105, 30, { align: "center" });
    doc.text("TELEPON (031) 8675356; FAKSIMILE (031) 8675335; LAMAN kanwiljatim1.beacukai.go.id", 105, 34, { align: "center" });
    doc.text("PUSAT KONTAK LAYANAN 1500225; SUREL kwbcjatim1@customs.go.id", 105, 38, { align: "center" });
    
    // Horizontal line
    doc.setLineWidth(0.8);
    doc.line(15, 45, 195, 45);
    
    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TANDA TERIMA SURAT MASUK", 105, 55, { align: "center" });
    
    // Content
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    let y = 65;
    const lineHeight = 8;
    
    doc.text(`Nomor Agenda: ${surat.nomor_agenda}`, 20, y);
    y += lineHeight;
    doc.text(`Nomor Dokumen: ${surat.nomor_dokumen}`, 20, y);
    y += lineHeight;
    doc.text(`Hal: ${surat.hal}`, 20, y);
    y += lineHeight;
    doc.text(`Tujuan: ${surat.tujuan_bagian.join(", ")}`, 20, y);
    y += lineHeight * 2;
    
    doc.text(`Pengirim: ${surat.nama_pengirim}`, 20, y);
    y += lineHeight;
    if (surat.instansi_pengirim) {
      doc.text(`Instansi: ${surat.instansi_pengirim}`, 20, y);
      y += lineHeight;
    }
    y += lineHeight;
    
    doc.text(`Penerima: ${surat.nama_penerima}`, 20, y);
    y += lineHeight;
    doc.text(`Petugas BC: ${surat.petugas_bc_penerima}`, 20, y);
    y += lineHeight;
    doc.text(`Tanggal Terima: ${format(new Date(surat.tanggal_terima), "dd MMMM yyyy HH:mm", { locale: id })}`, 20, y);
    y += lineHeight * 2;
    
    // Photo if exists
    if (surat.foto_penerima) {
      try {
        doc.addImage(surat.foto_penerima, "JPEG", 20, y, 50, 50);
        y += 55;
      } catch (e) {
        console.error("Error adding image to PDF:", e);
      }
    }
    
    // Footer
    y += 10;
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${format(new Date(), "dd MMMM yyyy HH:mm:ss", { locale: id })}`, 20, y);
    
    doc.save(`Tanda_Terima_${surat.nomor_agenda}.pdf`);
    toast.success("Tanda terima berhasil dicetak");
  };

  const filteredSuratMasuk = suratMasuk.filter(s => 
    s.nomor_dokumen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.hal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nama_pengirim.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSuratTracking = (suratId: string) => {
    return bukuBambu.filter(b => b.surat_masuk_id === suratId).sort((a, b) => 
      new Date(a.tanggal_kirim).getTime() - new Date(b.tanggal_kirim).getTime()
    );
  };

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Beranda", path: "/" },
        { label: "Administrasi Surat" }
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Administrasi Surat</h1>
            <p className="text-muted-foreground">Kelola penerimaan, tracking surat & book nomor</p>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="flex flex-wrap justify-start gap-1 h-auto p-1">
            {accessibleTabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="whitespace-nowrap">{tab.label}</TabsTrigger>
            ))}
          </TabsList>

          {hasSubMenuAccess("surat-masuk:dashboard") && (
          <TabsContent value="dashboard" className="space-y-4">
            <SuratMasukDashboard suratMasuk={suratMasuk} bukuBambu={bukuBambu} />
          </TabsContent>
          )}

          {hasSubMenuAccess("surat-masuk:daftar-surat-masuk") && (
          <TabsContent value="form" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <CardTitle>Daftar Surat Masuk</CardTitle>
                    <CardDescription>Semua data penerimaan surat masuk</CardDescription>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Surat Masuk
                      </Button>
                      <Button variant="outline" onClick={() => {
                        const exportData = filteredSuratMasuk.map((s, i) => ({
                          "No": i + 1,
                          "No Agenda": s.nomor_agenda,
                          "No Dokumen": s.nomor_dokumen,
                          "Hal": s.hal,
                          "Pengirim": s.nama_pengirim,
                          "Instansi": s.instansi_pengirim || "-",
                          "Penerima": s.nama_penerima,
                          "Tujuan": s.tujuan_bagian.join(", "),
                          "Petugas BC": s.petugas_bc_penerima,
                          "Tanggal": format(new Date(s.tanggal_terima), "dd/MM/yyyy HH:mm"),
                          "Rating": s.feedback_rating || "-",
                          "Feedback": s.feedback_comment || "-"
                        }));
                        const ws = XLSX.utils.json_to_sheet(exportData);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Surat Masuk");
                        XLSX.writeFile(wb, `surat_masuk_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
                        toast.success("Data berhasil diekspor");
                      }}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export Excel
                      </Button>
                      <label>
                        <Button variant="outline" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Import Excel
                          </span>
                        </Button>
                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = async (evt) => {
                          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                          const wb = XLSX.read(data, { type: "array" });
                          const ws = wb.Sheets[wb.SheetNames[0]];
                          const jsonData = XLSX.utils.sheet_to_json(ws);
                          let imported = 0;
                          for (const row of jsonData as any[]) {
                            const { error } = await supabase.from("surat_masuk").insert({
                              nomor_dokumen: row["No Dokumen"] || "",
                              hal: row["Hal"] || "",
                              nama_pengirim: row["Pengirim"] || "",
                              instansi_pengirim: row["Instansi"] !== "-" ? row["Instansi"] : null,
                              nama_penerima: row["Penerima"] || "",
                              tujuan_bagian: row["Tujuan"]?.split(", ") || [],
                              petugas_bc_penerima: row["Petugas BC"] || ""
                            });
                            if (!error) imported++;
                          }
                          toast.success(`${imported} data berhasil diimport`);
                          fetchSuratMasuk();
                        };
                        reader.readAsArrayBuffer(file);
                          e.target.value = "";
                        }} />
                      </label>
                        <Button 
                          variant="destructive" 
                          onClick={async () => {
                            if (!confirm("Yakin ingin menghapus SEMUA data surat masuk? Tindakan ini tidak dapat dibatalkan.")) return;
                            const { error } = await supabase.from("surat_masuk").delete().neq("id", "");
                            if (error) {
                              toast.error("Gagal menghapus semua data");
                              return;
                            }
                            toast.success("Semua data berhasil dihapus");
                            fetchSuratMasuk();
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus Semua
                        </Button>
                      </div>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari nomor dokumen, hal, atau pengirim..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Agenda</TableHead>
                      <TableHead>No. Dokumen</TableHead>
                      <TableHead>Hal</TableHead>
                      <TableHead>Pengirim</TableHead>
                      <TableHead>Tujuan</TableHead>
                      <TableHead>Petugas BC</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuratMasuk.map((surat) => (
                      <TableRow key={surat.id}>
                        <TableCell className="font-medium">{surat.nomor_agenda}</TableCell>
                        <TableCell>{surat.nomor_dokumen}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{surat.hal}</TableCell>
                        <TableCell>{surat.nama_pengirim}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{surat.tujuan_bagian.join(", ")}</TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="text-xs truncate" title={surat.petugas_bc_penerima}>
                            {surat.petugas_bc_penerima}
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(surat.tanggal_terima), "dd MMM yyyy", { locale: id })}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => viewTracking(surat)} title="Lihat Tracking">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {isAdmin && (
                              <Button variant="ghost" size="icon" onClick={() => openAddTracking(surat)} title="Tambah Tracking">
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => printReceipt(surat)} title="Cetak Tanda Terima">
                              <Printer className="w-4 h-4" />
                            </Button>
                            {canEdit && (
                              <Button 
                                variant={surat.feedback_rating ? "default" : "ghost"} 
                                size="icon" 
                                onClick={() => openFeedback(surat)} 
                                title={surat.feedback_rating ? "Edit Feedback" : "Berikan Feedback"}
                              >
                                {surat.feedback_rating ? (
                                  <span className="text-xs">{surat.feedback_rating}★</span>
                                ) : (
                                  <span className="text-xs">★</span>
                                )}
                              </Button>
                            )}
                            {isAdmin && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => { setSelectedSurat(surat); setShowEditDialog(true); }} title="Edit">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                {surat.pdf_dokumen && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = surat.pdf_dokumen!;
                                      link.download = `Surat_${surat.nomor_dokumen}.pdf`;
                                      link.click();
                                      toast.success("PDF berhasil diunduh");
                                    }} 
                                    title="Unduh PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(surat.id)} title="Hapus">
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
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {hasSubMenuAccess("surat-masuk:buku-bambu") && (
          <TabsContent value="buku-bambu" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Buku Bambu</CardTitle>
                    <CardDescription>Data distribusi surat antar unit</CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {isAdmin && (
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" onClick={() => {
                          const exportData = bukuBambu.map((b, i) => ({
                            "No": i + 1,
                            "No Urut": b.no_urut,
                            "Dari Unit": b.dari_unit,
                            "Ke Unit": b.ke_unit,
                            "Nama Penerima": b.nama_penerima,
                            "Tanggal": format(new Date(b.tanggal_kirim), "dd/MM/yyyy HH:mm"),
                            "Catatan": b.catatan || "-",
                            "Direkam Oleh": b.created_by_name || "-",
                            "Email": b.created_by_email || "-"
                          }));
                          const ws = XLSX.utils.json_to_sheet(exportData);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, "Buku Bambu");
                          XLSX.writeFile(wb, `buku_bambu_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
                          toast.success("Data berhasil diekspor");
                        }}>
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Export Excel
                        </Button>
                        <label>
                          <Button variant="outline" asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              Import Excel
                            </span>
                          </Button>
                          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = async (evt) => {
                              const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                              const wb = XLSX.read(data, { type: "array" });
                              const ws = wb.Sheets[wb.SheetNames[0]];
                              const jsonData = XLSX.utils.sheet_to_json(ws);
                              let imported = 0;
                              for (const row of jsonData as any[]) {
                                const { error } = await supabase.from("buku_bambu").insert({
                                  dari_unit: row["Dari Unit"] || "",
                                  ke_unit: row["Ke Unit"] || "",
                                  nama_penerima: row["Nama Penerima"] || "",
                                  catatan: row["Catatan"] !== "-" ? row["Catatan"] : null,
                                  created_by_name: fullName || null,
                                  created_by_email: user?.email || null
                                });
                                if (!error) imported++;
                              }
                              toast.success(`${imported} data berhasil diimport`);
                              fetchBukuBambu();
                            };
                            reader.readAsArrayBuffer(file);
                            e.target.value = "";
                          }} />
                        </label>
                        <Button 
                          variant="destructive" 
                          onClick={async () => {
                            if (!confirm("Yakin ingin menghapus SEMUA data buku bambu? Tindakan ini tidak dapat dibatalkan.")) return;
                            const { error } = await supabase.from("buku_bambu").delete().neq("id", "");
                            if (error) {
                              toast.error("Gagal menghapus semua data");
                              return;
                            }
                            toast.success("Semua data berhasil dihapus");
                            fetchBukuBambu();
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus Semua
                        </Button>
                      </div>
                    )}
                    {canEdit && (
                      <Button onClick={() => { setEditingBukuBambu(null); setShowBukuBambuDialog(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Form Buku Bambu
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filter Section */}
                <div className="mb-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Penerima</Label>
                      <Input
                        placeholder="Cari penerima..."
                        value={bukuBambuSearch.nama_penerima}
                        onChange={(e) => setBukuBambuSearch({ ...bukuBambuSearch, nama_penerima: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Penerima/Asal</Label>
                      <Select value={bukuBambuSearch.unit_asal} onValueChange={(v) => setBukuBambuSearch({ ...bukuBambuSearch, unit_asal: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Unit</SelectItem>
                          {BAGIAN_OPTIONS.map((bagian) => (
                            <SelectItem key={bagian} value={bagian}>{bagian}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Tujuan</Label>
                      <Select value={bukuBambuSearch.unit_tujuan} onValueChange={(v) => setBukuBambuSearch({ ...bukuBambuSearch, unit_tujuan: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Unit</SelectItem>
                          {BAGIAN_OPTIONS.map((bagian) => (
                            <SelectItem key={bagian} value={bagian}>{bagian}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tanggal Dari</Label>
                      <Input
                        type="date"
                        value={bukuBambuSearch.date_from}
                        onChange={(e) => setBukuBambuSearch({ ...bukuBambuSearch, date_from: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Sampai</Label>
                      <Input
                        type="date"
                        value={bukuBambuSearch.date_to}
                        onChange={(e) => setBukuBambuSearch({ ...bukuBambuSearch, date_to: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBukuBambuSearch({ nama_penerima: "", unit_asal: "", unit_tujuan: "", date_from: "", date_to: "" })}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reset Filter
                  </Button>
                </div>

                {/* Buku Bambu Entries */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {bukuBambu
                    .filter((b) => {
                      const matchPenerima = !bukuBambuSearch.nama_penerima || 
                        b.nama_penerima.toLowerCase().includes(bukuBambuSearch.nama_penerima.toLowerCase());
                      const matchUnitAsal = !bukuBambuSearch.unit_asal || bukuBambuSearch.unit_asal === "all" ||
                        b.dari_unit === bukuBambuSearch.unit_asal;
                      const matchUnitTujuan = !bukuBambuSearch.unit_tujuan || bukuBambuSearch.unit_tujuan === "all" ||
                        b.ke_unit === bukuBambuSearch.unit_tujuan;
                      const tanggal = new Date(b.tanggal_kirim);
                      const matchDateFrom = !bukuBambuSearch.date_from || tanggal >= new Date(bukuBambuSearch.date_from);
                      const matchDateTo = !bukuBambuSearch.date_to || tanggal <= new Date(bukuBambuSearch.date_to + "T23:59:59");
                      return matchPenerima && matchUnitAsal && matchUnitTujuan && matchDateFrom && matchDateTo;
                    })
                    .map((entry) => (
                      <BukuBambuCard
                        key={entry.id}
                        entry={entry}
                        onEdit={openEditBukuBambu}
                        onDelete={handleDeleteBukuBambu}
                        isAdmin={isAdmin}
                      />
                    ))}
                  {bukuBambu.length === 0 && (
                    <div className="col-span-3 text-center text-muted-foreground py-8">
                      Belum ada entri buku bambu
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {hasSubMenuAccess("surat-masuk:book-nomor") && (
          <TabsContent value="book-nomor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Book Nomor Manual</CardTitle>
                <CardDescription>Pencatatan nomor surat SPKTNP, SPP, dan SPSA</CardDescription>
              </CardHeader>
              <CardContent>
                <BookNomorManualTable />
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {hasSubMenuAccess("surat-masuk:distribusi-surat") && (
          <TabsContent value="distribusi-surat" className="space-y-4">
            <DistribusiSuratTable />
          </TabsContent>
          )}
        </Tabs>

        {/* Add Surat Masuk Dialog */}
        <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { resetForm(); } setShowAddDialog(open); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Surat Masuk</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nomor Dokumen *</Label>
                  <Input
                    value={formData.nomor_dokumen}
                    onChange={(e) => setFormData({ ...formData, nomor_dokumen: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hal *</Label>
                  <Input
                    value={formData.hal}
                    onChange={(e) => setFormData({ ...formData, hal: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tujuan Bagian *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {BAGIAN_OPTIONS.map((bagian) => (
                    <div key={bagian} className="flex items-center space-x-2">
                      <Checkbox
                        id={`surat-${bagian}`}
                        checked={formData.tujuan_bagian.includes(bagian)}
                        onCheckedChange={(checked) => handleTujuanChange(bagian, checked as boolean)}
                      />
                      <label htmlFor={`surat-${bagian}`} className="text-sm">{bagian}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Pengirim *</Label>
                  <Input
                    value={formData.nama_pengirim}
                    onChange={(e) => setFormData({ ...formData, nama_pengirim: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instansi Pengirim</Label>
                  <Input
                    value={formData.instansi_pengirim}
                    onChange={(e) => setFormData({ ...formData, instansi_pengirim: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nama Penerima *</Label>
                <Input
                  value={formData.nama_penerima}
                  onChange={(e) => setFormData({ ...formData, nama_penerima: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ambil Foto (Dokumentasi)</Label>
                  {showCamera ? (
                    <div className="space-y-2">
                      <div className="relative rounded border overflow-hidden bg-black" style={{ minHeight: "240px" }}>
                        {!isVideoReady && (
                          <div className="absolute inset-0 flex items-center justify-center text-white">
                            <p>Memuat kamera...</p>
                          </div>
                        )}
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline
                          muted
                          className="w-full max-w-sm h-auto" 
                          style={{ display: isVideoReady ? "block" : "none" }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" onClick={capturePhoto} disabled={!isVideoReady}>
                          <Camera className="w-4 h-4 mr-2" />
                          Ambil Foto
                        </Button>
                        <Button type="button" variant="outline" onClick={stopCamera}>Batal</Button>
                      </div>
                    </div>
                  ) : formData.foto_penerima ? (
                    <div className="space-y-2">
                      <img src={formData.foto_penerima} alt="Foto Penerima" className="w-32 h-32 object-cover rounded border" />
                      <Button type="button" variant="outline" onClick={() => setFormData({ ...formData, foto_penerima: "" })}>
                        Hapus Foto
                      </Button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" onClick={startCamera}>
                      <Camera className="w-4 h-4 mr-2" />
                      Ambil Foto
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Upload Dokumen PDF (Opsional)</Label>
                  {formData.pdf_dokumen ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">PDF telah diupload</p>
                      <Button type="button" variant="outline" onClick={() => setFormData({ ...formData, pdf_dokumen: "" })}>
                        Hapus PDF
                      </Button>
                    </div>
                  ) : (
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, pdf_dokumen: reader.result as string });
                            toast.success("PDF berhasil diupload");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Simpan</Button>
                <Button type="button" variant="outline" onClick={() => { resetForm(); setShowAddDialog(false); }}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Tracking Dialog */}
        <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tracking Surat</DialogTitle>
            </DialogHeader>
            {selectedSurat && (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Nomor Dokumen</Label>
                  <p className="font-medium">{selectedSurat.nomor_dokumen}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hal</Label>
                  <p className="font-medium">{selectedSurat.hal}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Pengirim</Label>
                  <p className="font-medium">{selectedSurat.nama_pengirim} {selectedSurat.instansi_pengirim && `(${selectedSurat.instansi_pengirim})`}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Penerima Awal</Label>
                  <p className="font-medium">{selectedSurat.nama_penerima}</p>
                </div>
                {selectedSurat.foto_penerima && (
                  <div>
                    <Label className="text-muted-foreground">Foto Penerima</Label>
                    <img src={selectedSurat.foto_penerima} alt="Foto" className="w-24 h-24 object-cover rounded border mt-1" />
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Riwayat Tracking</Label>
                  <div className="mt-2 space-y-2">
                    {getSuratTracking(selectedSurat.id).map((t, index) => (
                      <div key={t.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{t.dari_unit} → {t.ke_unit}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.nama_penerima} - {format(new Date(t.tanggal_kirim), "dd MMM yyyy HH:mm", { locale: id })}
                          </p>
                          {t.catatan && <p className="text-xs italic">{t.catatan}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Tracking Dialog */}
        <Dialog open={showAddTrackingDialog} onOpenChange={setShowAddTrackingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Tracking Surat</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTracking} className="space-y-4">
              <div className="space-y-2">
                <Label>Dari Unit *</Label>
                <Select value={trackingForm.dari_unit} onValueChange={(v) => setTrackingForm({ ...trackingForm, dari_unit: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih unit asal" />
                  </SelectTrigger>
                  <SelectContent>
                    {BAGIAN_OPTIONS.map((bagian) => (
                      <SelectItem key={bagian} value={bagian}>{bagian}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ke Unit *</Label>
                <Select value={trackingForm.ke_unit} onValueChange={(v) => setTrackingForm({ ...trackingForm, ke_unit: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih unit tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {BAGIAN_OPTIONS.map((bagian) => (
                      <SelectItem key={bagian} value={bagian}>{bagian}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nama Penerima *</Label>
                <Input
                  value={trackingForm.nama_penerima}
                  onChange={(e) => setTrackingForm({ ...trackingForm, nama_penerima: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea
                  value={trackingForm.catatan}
                  onChange={(e) => setTrackingForm({ ...trackingForm, catatan: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Simpan</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddTrackingDialog(false)}>Batal</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Feedback Dialog */}
        <SuratMasukFeedbackDialog
          open={showFeedbackDialog}
          onOpenChange={setShowFeedbackDialog}
          onSubmit={handleFeedbackSubmit}
        />

        {/* Edit Surat Masuk Dialog */}
        <SuratMasukEditDialog
          surat={selectedSurat}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={fetchSuratMasuk}
        />

        {/* Buku Bambu Dialog */}
        <BukuBambuDialog
          open={showBukuBambuDialog}
          onOpenChange={(open) => { if (!open) setEditingBukuBambu(null); setShowBukuBambuDialog(open); }}
          onSuccess={fetchBukuBambu}
          editData={editingBukuBambu}
        />
      </div>
    </AppLayout>
  );
}
