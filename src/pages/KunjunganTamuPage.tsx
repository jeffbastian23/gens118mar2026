import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Eye, Trash2, Edit, MessageSquare, Search, FileSpreadsheet, Upload, Star, Maximize2, ClipboardList, ThumbsUp, UserPlus, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import CameraCapture from "@/components/CameraCapture";
import VisitorFeedbackDialog from "@/components/VisitorFeedbackDialog";
import PenilaianSKMTab from "@/components/PenilaianSKMTab";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import * as XLSX from "xlsx";
const KANTOR_OPTIONS = [
  "Kanwil DJBC Jawa Timur I",
  "KPPBC TMP B Sidoarjo"
];

interface SurveyData {
  pendidikan: string;
  layanan: string;
  jenis_kelamin: string;
  pilihan_kantor: string;
  survey_responses: Record<string, number>;
}

interface KunjunganTamu {
  id: string;
  nama_tamu: string;
  instansi: string | null;
  no_identitas: string | null;
  no_telepon: string | null;
  keperluan: string;
  tujuan_bagian: string[];
  foto_tamu: string | null;
  created_at: string;
  recorded_by_name: string | null;
  recorded_by_email: string | null;
  feedback_rating: number | null;
  feedback_comment: string | null;
  pilihan_kantor: string | null;
  jenis_kelamin: string | null;
  status_janji: string | null;
  jumlah_tamu: number | null;
  pendidikan?: string | null;
  layanan?: string | null;
  survey_responses?: any;
  feedback_submitted_by?: string | null;
  feedback_submitted_at?: string | null;
}

// Seksi options for KPPBC TMP B Sidoarjo
const SEKSI_KPPBC_OPTIONS = [
  "Subbagian Umum",
  "Seksi Penindakan dan Penyidikan",
  "Seksi Perbendaharaan",
  "Seksi Pelayanan Kepabeanan dan Cukai I",
  "Seksi Pelayanan Kepabeanan dan Cukai II",
  "Seksi Pelayanan Kepabeanan dan Cukai III",
  "Seksi Pelayanan Kepabeanan dan Cukai IV",
  "Seksi Pelayanan Kepabeanan dan Cukai V",
  "Seksi Pelayanan Kepabeanan dan Cukai VI",
  "Seksi Penyuluhan dan Layanan Informasi",
  "Seksi Kepatuhan Internal",
  "Seksi Pengolahan Data dan Administrasi Dokumen"
];

// Bagian options for Kanwil DJBC Jawa Timur I (includes Kepala Kantor)
const BAGIAN_KANWIL_OPTIONS = [
  "Kepala Kantor",
  "Bagian Umum",
  "Bidang P2",
  "Bidang KI",
  "Bidang KC",
  "Bidang Fasilitas",
  "Bidang Audit",
  "Sub Unsur Audit",
  "Sub Unsur Keban"
];

export default function KunjunganTamuPage() {
  const navigate = useNavigate();
  const { fullName, user, role } = useAuth();
  const isAdmin = role === "admin";
  const canEdit = role !== "overview";
  const [visitors, setVisitors] = useState<KunjunganTamu[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<KunjunganTamu | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showBukuTamuFullscreen, setShowBukuTamuFullscreen] = useState(false);
  const [showFeedbackSelectDialog, setShowFeedbackSelectDialog] = useState(false);
  const [formData, setFormData] = useState({
    nama_tamu: "",
    instansi: "",
    no_identitas: "",
    no_telepon: "",
    keperluan: "",
    tujuan_bagian: [] as string[],
    foto_tamu: "",
    pilihan_kantor: "Kanwil DJBC Jawa Timur I",
    jenis_kelamin: "",
    status_janji: "Belum",
    jumlah_tamu: 1
  });
  
  // Filter states
  const [searchNama, setSearchNama] = useState("");
  const [searchInstansi, setSearchInstansi] = useState("");
  const [searchKeperluan, setSearchKeperluan] = useState("");
  const [searchTujuan, setSearchTujuan] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    const { data, error } = await supabase
      .from("kunjungan_tamu")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data kunjungan");
      return;
    }

    setVisitors(data || []);
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

    // Require tujuan_bagian/seksi for both office options
    if (formData.tujuan_bagian.length === 0) {
      toast.error(formData.pilihan_kantor === "KPPBC TMP B Sidoarjo" 
        ? "Pilih minimal satu tujuan seksi" 
        : "Pilih minimal satu tujuan bagian");
      return;
    }

    const { error } = await supabase.from("kunjungan_tamu").insert({
      nama_tamu: formData.nama_tamu,
      instansi: formData.instansi || null,
      no_identitas: formData.no_identitas || null,
      no_telepon: formData.no_telepon || null,
      keperluan: formData.keperluan,
      tujuan_bagian: formData.tujuan_bagian,
      foto_tamu: formData.foto_tamu || null,
      recorded_by_name: fullName || null,
      recorded_by_email: user?.email || null,
      pilihan_kantor: formData.pilihan_kantor || null,
      jenis_kelamin: formData.jenis_kelamin || null,
      status_janji: formData.status_janji || null,
      jumlah_tamu: formData.jumlah_tamu || 1
    });

    if (error) {
      toast.error("Gagal menyimpan data kunjungan");
      return;
    }

    toast.success("Data kunjungan berhasil disimpan");
    setShowAddDialog(false);
    resetForm();
    fetchVisitors();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVisitor) return;

    // Require tujuan_bagian/seksi for both office options
    if (formData.tujuan_bagian.length === 0) {
      toast.error(formData.pilihan_kantor === "KPPBC TMP B Sidoarjo" 
        ? "Pilih minimal satu tujuan seksi" 
        : "Pilih minimal satu tujuan bagian");
      return;
    }

    const { error } = await supabase
      .from("kunjungan_tamu")
      .update({
        nama_tamu: formData.nama_tamu,
        instansi: formData.instansi || null,
        no_identitas: formData.no_identitas || null,
        no_telepon: formData.no_telepon || null,
        keperluan: formData.keperluan,
        tujuan_bagian: formData.tujuan_bagian,
        foto_tamu: formData.foto_tamu || null,
        pilihan_kantor: formData.pilihan_kantor || null,
        jenis_kelamin: formData.jenis_kelamin || null,
        status_janji: formData.status_janji || null,
        jumlah_tamu: formData.jumlah_tamu || 1
      })
      .eq("id", selectedVisitor.id);

    if (error) {
      toast.error("Gagal mengupdate data kunjungan");
      return;
    }

    toast.success("Data kunjungan berhasil diupdate");
    setShowEditDialog(false);
    resetForm();
    fetchVisitors();
  };

  const handleFeedback = async (rating: number, comment?: string, surveyData?: SurveyData) => {
    if (!selectedVisitor) return;

    const updateData: any = { 
      feedback_rating: rating,
      feedback_comment: comment || null,
      feedback_submitted_by: user?.email || null,
      feedback_submitted_at: new Date().toISOString()
    };

    // Add survey data if provided
    if (surveyData) {
      updateData.pendidikan = surveyData.pendidikan || null;
      updateData.layanan = surveyData.layanan || null;
      updateData.survey_responses = surveyData.survey_responses || null;
    }

    const { error } = await supabase
      .from("kunjungan_tamu")
      .update(updateData)
      .eq("id", selectedVisitor.id);

    if (error) {
      console.error("Feedback error:", error);
      toast.error("Gagal menyimpan feedback");
      return;
    }

    toast.success("Feedback berhasil disimpan");
    setShowFeedbackDialog(false);
    setSelectedVisitor(null);
    fetchVisitors();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("kunjungan_tamu").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus data");
      return;
    }

    toast.success("Data berhasil dihapus");
    fetchVisitors();
  };

  const resetForm = () => {
    setFormData({
      nama_tamu: "",
      instansi: "",
      no_identitas: "",
      no_telepon: "",
      keperluan: "",
      tujuan_bagian: [],
      foto_tamu: "",
      pilihan_kantor: "Kanwil DJBC Jawa Timur I",
      jenis_kelamin: "",
      status_janji: "Belum",
      jumlah_tamu: 1
    });
    setSelectedVisitor(null);
  };

  const openEditDialog = (visitor: KunjunganTamu) => {
    setSelectedVisitor(visitor);
    setFormData({
      nama_tamu: visitor.nama_tamu,
      instansi: visitor.instansi || "",
      no_identitas: visitor.no_identitas || "",
      no_telepon: visitor.no_telepon || "",
      keperluan: visitor.keperluan,
      tujuan_bagian: visitor.tujuan_bagian,
      foto_tamu: visitor.foto_tamu || "",
      pilihan_kantor: visitor.pilihan_kantor || "Kanwil DJBC Jawa Timur I",
      jenis_kelamin: visitor.jenis_kelamin || "",
      status_janji: visitor.status_janji || "Belum",
      jumlah_tamu: visitor.jumlah_tamu || 1
    });
    setShowEditDialog(true);
  };

  const openFeedbackDialog = (visitor: KunjunganTamu) => {
    setSelectedVisitor(visitor);
    setShowFeedbackDialog(true);
  };

  const viewDetail = (visitor: KunjunganTamu) => {
    setSelectedVisitor(visitor);
    setShowDetailDialog(true);
  };

  // Filter visitors
  const filteredVisitors = visitors.filter(v => {
    const matchNama = !searchNama || v.nama_tamu.toLowerCase().includes(searchNama.toLowerCase());
    const matchInstansi = !searchInstansi || (v.instansi && v.instansi.toLowerCase().includes(searchInstansi.toLowerCase()));
    const matchKeperluan = !searchKeperluan || v.keperluan.toLowerCase().includes(searchKeperluan.toLowerCase());
    const matchTujuan = !searchTujuan || v.tujuan_bagian.some(t => t.toLowerCase().includes(searchTujuan.toLowerCase()));
    
    const visitDate = new Date(v.created_at);
    const matchDateFrom = !dateFrom || visitDate >= new Date(dateFrom);
    const matchDateTo = !dateTo || visitDate <= new Date(dateTo + "T23:59:59");
    
    return matchNama && matchInstansi && matchKeperluan && matchTujuan && matchDateFrom && matchDateTo;
  });

  // Stats for dashboard
  const todayVisitors = filteredVisitors.filter(v => {
    const visitDate = new Date(v.created_at).toDateString();
    return visitDate === new Date().toDateString();
  }).length;

  const weekVisitors = filteredVisitors.filter(v => {
    const visitDate = new Date(v.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return visitDate >= weekAgo;
  }).length;

  // Unique officers count
  const uniqueOfficers = new Set(
    filteredVisitors
      .filter(v => v.recorded_by_name)
      .map(v => v.recorded_by_name)
  ).size;

  // Chart data - visits per day for last 7 days
  const chartData = (() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const count = filteredVisitors.filter(v => {
        const visitDate = new Date(v.created_at).toISOString().split('T')[0];
        return visitDate === date;
      }).length;

      return {
        date: format(new Date(date), "dd MMM", { locale: id }),
        total: count
      };
    });
  })();

  // Feedback statistics
  const feedbackStats = (() => {
    const withFeedback = filteredVisitors.filter(v => v.feedback_rating);
    const avgRating = withFeedback.length > 0 
      ? (withFeedback.reduce((sum, v) => sum + (v.feedback_rating || 0), 0) / withFeedback.length).toFixed(1)
      : 0;
    const ratingDistribution = [1, 2, 3, 4, 5].map(r => ({
      rating: `${r}★`,
      count: withFeedback.filter(v => v.feedback_rating === r).length
    }));
    return { avgRating, total: withFeedback.length, distribution: ratingDistribution };
  })();

  // Export Kunjungan to Excel
  const exportKunjunganExcel = () => {
    const exportData = filteredVisitors.map((v, i) => ({
      "No": i + 1,
      "Nama Tamu": v.nama_tamu,
      "Instansi": v.instansi || "-",
      "No Identitas": v.no_identitas || "-",
      "No Telepon": v.no_telepon || "-",
      "Keperluan": v.keperluan,
      "Tujuan": v.tujuan_bagian.join(", "),
      "Waktu": format(new Date(v.created_at), "dd/MM/yyyy HH:mm"),
      "Petugas": v.recorded_by_name || "-",
      "Rating": v.feedback_rating || "-",
      "Feedback": v.feedback_comment || "-"
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kunjungan Tamu");
    XLSX.writeFile(wb, `kunjungan_tamu_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
    toast.success("Data berhasil diekspor");
  };

  // Import Kunjungan from Excel
  const importKunjunganExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const { error } = await supabase.from("kunjungan_tamu").insert({
          nama_tamu: row["Nama Tamu"] || "",
          instansi: row["Instansi"] !== "-" ? row["Instansi"] : null,
          no_identitas: row["No Identitas"] !== "-" ? row["No Identitas"] : null,
          no_telepon: row["No Telepon"] !== "-" ? row["No Telepon"] : null,
          keperluan: row["Keperluan"] || "",
          tujuan_bagian: row["Tujuan"]?.split(", ") || [],
          recorded_by_name: fullName || null,
          recorded_by_email: user?.email || null
        });
        if (!error) imported++;
      }
      toast.success(`${imported} data berhasil diimport`);
      fetchVisitors();
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Beranda", path: "/" },
        { label: "Pengguna Jasa/Layanan" }
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pengguna Jasa/Layanan</h1>
            <p className="text-muted-foreground">Kelola data pengguna jasa/layanan</p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="form">Daftar Kunjungan</TabsTrigger>
            <TabsTrigger value="skm">Penilaian SKM</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            {/* Buku Tamu Card with Kemenkeu Gold Theme */}
            <Card className="bg-gradient-to-r from-kemenkeu-gold-dark to-kemenkeu-gold text-white border-0">
              <CardContent className="py-8">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <h2 className="text-3xl font-bold mb-2 text-white">BUKU TAMU</h2>
                    <div className="w-16 h-1 bg-white mx-auto mb-4"></div>
                    <p className="text-lg mb-2">SELAMAT DATANG</p>
                    <p className="text-sm opacity-90">KANTOR WILAYAH DJBC JAWA TIMUR I DAN KPPBC TMP B SIDOARJO</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowBukuTamuFullscreen(true)}
                    className="text-white border-white hover:bg-white/20"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* Action Buttons below header */}
                <div className="flex justify-center gap-4 mt-6">
                  <Button 
                    variant="secondary"
                    className="bg-white text-kemenkeu-gold-dark hover:bg-white/90 font-semibold"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Tambah Kunjungan
                  </Button>
                  <Button 
                    variant="secondary"
                    className="bg-white text-kemenkeu-gold-dark hover:bg-white/90 font-semibold"
                    onClick={() => setShowFeedbackSelectDialog(true)}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Feedback
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Kunjungan Hari Ini - Orange */}
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white/90">Kunjungan Hari Ini</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{todayVisitors}</div>
                </CardContent>
              </Card>
              
              {/* Kunjungan Minggu Ini - Teal */}
              <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white/90">Kunjungan Minggu Ini</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{weekVisitors}</div>
                </CardContent>
              </Card>
              
              {/* Total Kunjungan - Purple */}
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white/90">Total Kunjungan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{filteredVisitors.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Chart with Kemenkeu Blue Theme */}
            <Card className="bg-gradient-to-br from-kemenkeu-blue to-kemenkeu-blue-light border-0">
              <CardHeader>
                <CardTitle className="text-white">Grafik Kunjungan Tamu</CardTitle>
                <CardDescription className="text-white/70">7 hari terakhir</CardDescription>
              </CardHeader>
              <CardContent className="bg-white/95 rounded-lg mx-4 mb-4 p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="hsl(217, 91%, 35%)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feedback Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Feedback Stakeholders
                </CardTitle>
                <CardDescription>Rating dan komentar dari pengunjung</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg ${
                    Number(feedbackStats.avgRating) >= 4 ? 'bg-green-50 border border-green-200' :
                    Number(feedbackStats.avgRating) >= 3 ? 'bg-yellow-50 border border-yellow-200' :
                    Number(feedbackStats.avgRating) > 0 ? 'bg-red-50 border border-red-200' : 'bg-muted'
                  }`}>
                    <p className="text-sm text-muted-foreground">Rata-rata Rating</p>
                    <p className={`text-3xl font-bold ${
                      Number(feedbackStats.avgRating) >= 4 ? 'text-green-600' :
                      Number(feedbackStats.avgRating) >= 3 ? 'text-yellow-600' :
                      Number(feedbackStats.avgRating) > 0 ? 'text-red-600' : ''
                    }`}>{feedbackStats.avgRating}★</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Feedback</p>
                    <p className="text-3xl font-bold">{feedbackStats.total}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Distribusi Rating</p>
                    <div className="flex gap-1">
                      {feedbackStats.distribution.map((d) => (
                        <div key={d.rating} className={`flex-1 text-center p-1 rounded text-xs ${
                          d.rating.includes('5') || d.rating.includes('4') ? 'bg-green-100 text-green-800' :
                          d.rating.includes('3') ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          <div className="font-bold">{d.count}</div>
                          <div>{d.rating}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Recent Feedback */}
                {filteredVisitors.filter(v => v.feedback_rating).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Feedback Terbaru</h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {filteredVisitors.filter(v => v.feedback_rating).slice(0, 5).map((v) => (
                        <div key={v.id} className={`p-3 rounded-lg border ${
                          (v.feedback_rating || 0) >= 4 ? 'border-green-200 bg-green-50' :
                          (v.feedback_rating || 0) >= 3 ? 'border-yellow-200 bg-yellow-50' :
                          'border-red-200 bg-red-50'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium">{v.nama_tamu}</span>
                              <span className="text-muted-foreground text-sm ml-2">({v.instansi || "-"})</span>
                            </div>
                            <span className={`font-bold ${
                              (v.feedback_rating || 0) >= 4 ? 'text-green-600' :
                              (v.feedback_rating || 0) >= 3 ? 'text-yellow-600' : 'text-red-600'
                            }`}>{v.feedback_rating}★</span>
                          </div>
                          {v.feedback_comment && (
                            <p className="text-sm text-muted-foreground mt-1">"{v.feedback_comment}"</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(v.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kunjungan Terbaru</CardTitle>
                <CardDescription>5 kunjungan terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Tamu</TableHead>
                      <TableHead>Instansi</TableHead>
                      <TableHead>Keperluan</TableHead>
                      <TableHead>Tujuan</TableHead>
                      <TableHead>Waktu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisitors.slice(0, 5).map((visitor) => (
                      <TableRow key={visitor.id}>
                        <TableCell className="font-medium">{visitor.nama_tamu}</TableCell>
                        <TableCell>{visitor.instansi || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{visitor.keperluan}</TableCell>
                        <TableCell>{visitor.tujuan_bagian.join(", ")}</TableCell>
                        <TableCell>{format(new Date(visitor.created_at), "dd MMM yyyy HH:mm", { locale: id })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="form" className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <CardTitle>Daftar Kunjungan Tamu</CardTitle>
                    <CardDescription>Semua data kunjungan tamu</CardDescription>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Kunjungan
                      </Button>
                      <Button variant="outline" onClick={exportKunjunganExcel}>
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
                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={importKunjunganExcel} />
                      </label>
                      <Button variant="destructive" onClick={async () => {
                        if (visitors.length === 0) {
                          toast.error("Tidak ada data untuk dihapus");
                          return;
                        }
                        if (!confirm(`Yakin ingin menghapus SEMUA ${visitors.length} data kunjungan tamu?`)) return;
                        const { error } = await supabase.from("kunjungan_tamu").delete().neq("id", "00000000-0000-0000-0000-000000000000");
                        if (error) {
                          toast.error("Gagal menghapus semua data");
                          return;
                        }
                        toast.success("Semua data berhasil dihapus");
                        fetchVisitors();
                      }}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus Semua
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filter Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="search-nama" className="text-xs">Cari Nama Tamu</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-nama"
                        placeholder="Nama tamu..."
                        value={searchNama}
                        onChange={(e) => setSearchNama(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="search-instansi" className="text-xs">Cari Instansi</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-instansi"
                        placeholder="Instansi..."
                        value={searchInstansi}
                        onChange={(e) => setSearchInstansi(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="search-keperluan" className="text-xs">Cari Keperluan</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-keperluan"
                        placeholder="Keperluan..."
                        value={searchKeperluan}
                        onChange={(e) => setSearchKeperluan(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="search-tujuan" className="text-xs">Cari Tujuan</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-tujuan"
                        placeholder="Tujuan bagian..."
                        value={searchTujuan}
                        onChange={(e) => setSearchTujuan(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-from" className="text-xs">Dari Tanggal</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-to" className="text-xs">Sampai Tanggal</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Tamu</TableHead>
                      <TableHead>Instansi</TableHead>
                      <TableHead>Keperluan</TableHead>
                      <TableHead>Tujuan</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Waktu Kunjungan
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Waktu Feedback
                        </div>
                      </TableHead>
                      <TableHead>Petugas</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisitors.map((visitor) => (
                      <TableRow key={visitor.id}>
                        <TableCell className="font-medium">{visitor.nama_tamu}</TableCell>
                        <TableCell>{visitor.instansi || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{visitor.keperluan}</TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="text-xs">{visitor.tujuan_bagian.join(", ")}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div className="font-medium text-primary">
                              {format(new Date(visitor.created_at), "dd MMM yyyy", { locale: id })}
                            </div>
                            <div className="text-muted-foreground">
                              {format(new Date(visitor.created_at), "HH:mm:ss", { locale: id })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {visitor.feedback_submitted_at ? (
                            <div className="text-xs">
                              <div className="font-medium text-green-600">
                                {format(new Date(visitor.feedback_submitted_at), "dd MMM yyyy", { locale: id })}
                              </div>
                              <div className="text-muted-foreground">
                                {format(new Date(visitor.feedback_submitted_at), "HH:mm:ss", { locale: id })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{visitor.recorded_by_name || "-"}</div>
                            <div className="text-muted-foreground text-xs">{visitor.recorded_by_email || "-"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => viewDetail(visitor)} title="Lihat Detail">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {isAdmin && (
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(visitor)} title="Edit">
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {canEdit && (
                              <Button 
                                variant={visitor.feedback_rating ? "default" : "destructive"} 
                                size="icon" 
                                onClick={() => openFeedbackDialog(visitor)}
                                title={visitor.feedback_rating ? "Feedback Terisi" : "Belum Feedback"}
                                className={visitor.feedback_rating ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            )}
                            {isAdmin && (
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(visitor.id)} title="Hapus">
                                <Trash2 className="w-4 h-4" />
                              </Button>
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

          <TabsContent value="skm" className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            <PenilaianSKMTab />
          </TabsContent>
        </Tabs>

        {/* Add Visitor Dialog */}
        <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { resetForm(); } setShowAddDialog(open); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Kunjungan Tamu</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama *</Label>
                  <Input
                    value={formData.nama_tamu}
                    onChange={(e) => setFormData({ ...formData, nama_tamu: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jenis Kelamin *</Label>
                  <Select
                    value={formData.jenis_kelamin}
                    onValueChange={(value) => setFormData({ ...formData, jenis_kelamin: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jenis Kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-laki (L)</SelectItem>
                      <SelectItem value="P">Perempuan (P)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Perusahaan</Label>
                  <Input
                    value={formData.instansi}
                    onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                    placeholder="Nama perusahaan..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status Janji</Label>
                  <Select
                    value={formData.status_janji}
                    onValueChange={(value) => setFormData({ ...formData, status_janji: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sudah">Sudah</SelectItem>
                      <SelectItem value="Belum">Belum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>No. Telepon</Label>
                <Input
                  value={formData.no_telepon}
                  onChange={(e) => setFormData({ ...formData, no_telepon: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Jumlah Tamu</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.jumlah_tamu}
                  onChange={(e) => setFormData({ ...formData, jumlah_tamu: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Keperluan *</Label>
                <Textarea
                  value={formData.keperluan}
                  onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Pilihan Kantor *</Label>
                <Select
                  value={formData.pilihan_kantor}
                  onValueChange={(value) => {
                    // Reset tujuan_bagian when switching office
                    setFormData({ ...formData, pilihan_kantor: value, tujuan_bagian: [] });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kantor" />
                  </SelectTrigger>
                  <SelectContent>
                    {KANTOR_OPTIONS.map((kantor) => (
                      <SelectItem key={kantor} value={kantor}>{kantor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seksi/Bagian checkboxes based on Pilihan Kantor */}
              {formData.pilihan_kantor === "KPPBC TMP B Sidoarjo" && (
                <div className="space-y-2">
                  <Label>Tujuan Seksi *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SEKSI_KPPBC_OPTIONS.map((seksi) => (
                      <div key={seksi} className="flex items-center space-x-2">
                        <Checkbox
                          id={seksi}
                          checked={formData.tujuan_bagian.includes(seksi)}
                          onCheckedChange={(checked) => handleTujuanChange(seksi, checked as boolean)}
                        />
                        <label htmlFor={seksi} className="text-sm">{seksi}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.pilihan_kantor === "Kanwil DJBC Jawa Timur I" && (
                <div className="space-y-2">
                  <Label>Tujuan Bagian *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {BAGIAN_KANWIL_OPTIONS.map((bagian) => (
                      <div key={bagian} className="flex items-center space-x-2">
                        <Checkbox
                          id={bagian}
                          checked={formData.tujuan_bagian.includes(bagian)}
                          onCheckedChange={(checked) => handleTujuanChange(bagian, checked as boolean)}
                        />
                        <label htmlFor={bagian} className="text-sm">{bagian}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Foto Tamu</Label>
                <CameraCapture
                  currentImage={formData.foto_tamu}
                  onCapture={(imageData) => setFormData({ ...formData, foto_tamu: imageData })}
                />
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

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={(open) => { if (!open) { resetForm(); } setShowEditDialog(open); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Kunjungan Tamu</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama *</Label>
                  <Input
                    value={formData.nama_tamu}
                    onChange={(e) => setFormData({ ...formData, nama_tamu: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jenis Kelamin *</Label>
                  <Select
                    value={formData.jenis_kelamin}
                    onValueChange={(value) => setFormData({ ...formData, jenis_kelamin: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jenis Kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-laki (L)</SelectItem>
                      <SelectItem value="P">Perempuan (P)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Perusahaan</Label>
                  <Input
                    value={formData.instansi}
                    onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                    placeholder="Nama perusahaan..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status Janji</Label>
                  <Select
                    value={formData.status_janji}
                    onValueChange={(value) => setFormData({ ...formData, status_janji: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sudah">Sudah</SelectItem>
                      <SelectItem value="Belum">Belum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>No. Telepon</Label>
                <Input
                  value={formData.no_telepon}
                  onChange={(e) => setFormData({ ...formData, no_telepon: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Jumlah Tamu</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.jumlah_tamu}
                  onChange={(e) => setFormData({ ...formData, jumlah_tamu: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Keperluan *</Label>
                <Textarea
                  value={formData.keperluan}
                  onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Pilihan Kantor *</Label>
                <Select
                  value={formData.pilihan_kantor}
                  onValueChange={(value) => {
                    // Reset tujuan_bagian when switching office
                    setFormData({ ...formData, pilihan_kantor: value, tujuan_bagian: [] });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kantor" />
                  </SelectTrigger>
                  <SelectContent>
                    {KANTOR_OPTIONS.map((kantor) => (
                      <SelectItem key={kantor} value={kantor}>{kantor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seksi/Bagian checkboxes based on Pilihan Kantor for Edit */}
              {formData.pilihan_kantor === "KPPBC TMP B Sidoarjo" && (
                <div className="space-y-2">
                  <Label>Tujuan Seksi *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SEKSI_KPPBC_OPTIONS.map((seksi) => (
                      <div key={seksi} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${seksi}`}
                          checked={formData.tujuan_bagian.includes(seksi)}
                          onCheckedChange={(checked) => handleTujuanChange(seksi, checked as boolean)}
                        />
                        <label htmlFor={`edit-${seksi}`} className="text-sm">{seksi}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.pilihan_kantor === "Kanwil DJBC Jawa Timur I" && (
                <div className="space-y-2">
                  <Label>Tujuan Bagian *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {BAGIAN_KANWIL_OPTIONS.map((bagian) => (
                      <div key={bagian} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${bagian}`}
                          checked={formData.tujuan_bagian.includes(bagian)}
                          onCheckedChange={(checked) => handleTujuanChange(bagian, checked as boolean)}
                        />
                        <label htmlFor={`edit-${bagian}`} className="text-sm">{bagian}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Foto Tamu</Label>
                <CameraCapture
                  currentImage={formData.foto_tamu}
                  onCapture={(imageData) => setFormData({ ...formData, foto_tamu: imageData })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Update</Button>
                <Button type="button" variant="outline" onClick={() => { resetForm(); setShowEditDialog(false); }}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Feedback Dialog */}
        <VisitorFeedbackDialog
          open={showFeedbackDialog}
          onOpenChange={setShowFeedbackDialog}
          currentRating={selectedVisitor?.feedback_rating}
          currentComment={selectedVisitor?.feedback_comment}
          onSubmit={handleFeedback}
          visitorData={{
            jenis_kelamin: selectedVisitor?.jenis_kelamin,
            pilihan_kantor: selectedVisitor?.pilihan_kantor,
            id: selectedVisitor?.id
          }}
        />

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detail Kunjungan</DialogTitle>
            </DialogHeader>
            {selectedVisitor && (
              <div className="space-y-4">
                {selectedVisitor.foto_tamu && (
                  <img src={selectedVisitor.foto_tamu} alt="Foto Tamu" className="w-32 h-32 object-cover rounded border mx-auto" />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Pilihan Kantor</Label>
                    <p className="font-medium">{selectedVisitor.pilihan_kantor || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Nama</Label>
                    <p className="font-medium">{selectedVisitor.nama_tamu}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Jenis Kelamin</Label>
                    <p className="font-medium">{selectedVisitor.jenis_kelamin === "L" ? "Laki-laki" : selectedVisitor.jenis_kelamin === "P" ? "Perempuan" : "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Nama Perusahaan</Label>
                    <p className="font-medium">{selectedVisitor.instansi || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status Janji</Label>
                    <p className="font-medium">{selectedVisitor.status_janji || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Jumlah Tamu</Label>
                    <p className="font-medium">{selectedVisitor.jumlah_tamu || 1}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">No. Identitas</Label>
                    <p className="font-medium">{selectedVisitor.no_identitas || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">No. Telepon</Label>
                    <p className="font-medium">{selectedVisitor.no_telepon || "-"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Keperluan</Label>
                  <p className="font-medium">{selectedVisitor.keperluan}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tujuan {selectedVisitor.pilihan_kantor === "KPPBC TMP B Sidoarjo" ? "Seksi" : "Bagian"}</Label>
                  <p className="font-medium">{selectedVisitor.tujuan_bagian.join(", ")}</p>
                </div>
                
                {/* Timelapse Section */}
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground flex items-center gap-1 mb-2">
                    <Clock className="w-4 h-4" />
                    Time Lapse
                  </Label>
                  <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Waktu Kunjungan</p>
                      <p className="font-medium text-primary">
                        {format(new Date(selectedVisitor.created_at), "EEEE, dd MMMM yyyy", { locale: id })}
                      </p>
                      <p className="text-sm font-mono">
                        {format(new Date(selectedVisitor.created_at), "HH:mm:ss", { locale: id })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Waktu Feedback</p>
                      {selectedVisitor.feedback_submitted_at ? (
                        <>
                          <p className="font-medium text-green-600">
                            {format(new Date(selectedVisitor.feedback_submitted_at), "EEEE, dd MMMM yyyy", { locale: id })}
                          </p>
                          <p className="text-sm font-mono">
                            {format(new Date(selectedVisitor.feedback_submitted_at), "HH:mm:ss", { locale: id })}
                          </p>
                        </>
                      ) : (
                        <p className="text-muted-foreground text-sm">Belum ada feedback</p>
                      )}
                    </div>
                  </div>
                </div>
                {selectedVisitor.recorded_by_name && (
                  <div>
                    <Label className="text-muted-foreground">Dicatat Oleh</Label>
                    <p className="font-medium">{selectedVisitor.recorded_by_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedVisitor.recorded_by_email}</p>
                  </div>
                )}
                {selectedVisitor.feedback_rating && (
                  <div>
                    <Label className="text-muted-foreground">Penilaian</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedVisitor.feedback_rating === 2 && <span className="text-orange-500 font-medium">😞 Buruk</span>}
                      {selectedVisitor.feedback_rating === 3 && <span className="text-yellow-500 font-medium">😐 Cukup</span>}
                      {selectedVisitor.feedback_rating === 4 && <span className="text-lime-500 font-medium">😊 Baik</span>}
                      {selectedVisitor.feedback_rating === 5 && <span className="text-green-500 font-medium">😄 Sangat Baik</span>}
                      <span className="text-muted-foreground ml-2">({selectedVisitor.feedback_rating}/5)</span>
                    </div>
                    {selectedVisitor.feedback_comment && (
                      <div className="mt-2">
                        <Label className="text-xs text-muted-foreground">Komentar:</Label>
                        <p className="text-sm mt-1">{selectedVisitor.feedback_comment}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Buku Tamu Fullscreen Dialog - Dashboard View Only */}
        <Dialog open={showBukuTamuFullscreen} onOpenChange={setShowBukuTamuFullscreen}>
          <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 m-0 overflow-auto">
            <div className="min-h-full bg-gradient-to-b from-kemenkeu-gold-dark via-kemenkeu-gold to-kemenkeu-gold-dark text-white p-6">
              {/* Header Section */}
              <div className="text-center py-8">
                <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white">BUKU TAMU</h1>
                <div className="w-24 h-1 bg-white mx-auto mb-6"></div>
                <p className="text-2xl md:text-3xl mb-2">SELAMAT DATANG</p>
                <p className="text-lg md:text-xl opacity-90 text-center max-w-2xl mx-auto">
                  KANTOR WILAYAH DJBC JAWA TIMUR I DAN KPPBC TMP B SIDOARJO
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center gap-6 mb-8">
                <Button
                  size="lg"
                  className="bg-white text-kemenkeu-gold-dark hover:bg-white/90 font-semibold px-8"
                  onClick={() => {
                    setShowBukuTamuFullscreen(false);
                    setShowAddDialog(true);
                  }}
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Tambah Kunjungan
                </Button>
                <Button
                  size="lg"
                  className="bg-white text-kemenkeu-gold-dark hover:bg-white/90 font-semibold px-8"
                  onClick={() => {
                    setShowBukuTamuFullscreen(false);
                    setShowFeedbackSelectDialog(true);
                  }}
                >
                  <ThumbsUp className="w-5 h-5 mr-2" />
                  Feedback
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-6xl mx-auto">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-center shadow-lg">
                  <p className="text-white/90 text-sm mb-1">Kunjungan Hari Ini</p>
                  <p className="text-5xl font-bold">{todayVisitors}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-center shadow-lg">
                  <p className="text-white/90 text-sm mb-1">Kunjungan Minggu Ini</p>
                  <p className="text-5xl font-bold">{weekVisitors}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-center shadow-lg">
                  <p className="text-white/90 text-sm mb-1">Total Kunjungan</p>
                  <p className="text-5xl font-bold">{filteredVisitors.length}</p>
                </div>
              </div>

              {/* Chart Section with Blue Theme */}
              <div className="max-w-6xl mx-auto bg-gradient-to-br from-kemenkeu-blue to-kemenkeu-blue-light rounded-xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold text-white mb-2">Grafik Kunjungan Tamu</h3>
                <p className="text-white/70 mb-4">7 hari terakhir</p>
                <div className="bg-white/95 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="total" stroke="hsl(217, 91%, 35%)" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Feedback Select Dialog */}
        <Dialog open={showFeedbackSelectDialog} onOpenChange={setShowFeedbackSelectDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Pilih Nama Tamu</DialogTitle>
              <DialogDescription>Pilih nama tamu yang akan memberikan feedback</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {(() => {
                // For user/super role, filter out entries that already have feedback
                // Admin sees all entries without feedback
                const availableForFeedback = visitors.filter(v => {
                  if (!v.feedback_rating) return true;
                  return false;
                });
                
                if (availableForFeedback.length === 0) {
                  return (
                    <p className="text-center text-muted-foreground py-4">Semua tamu sudah memberikan feedback</p>
                  );
                }
                
                return availableForFeedback.map((visitor) => (
                  <Button
                    key={visitor.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => {
                      setSelectedVisitor(visitor);
                      setShowFeedbackSelectDialog(false);
                      setShowFeedbackDialog(true);
                    }}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{visitor.nama_tamu}</span>
                      <span className="text-xs text-muted-foreground">
                        {visitor.instansi || "-"} • {format(new Date(visitor.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                      </span>
                    </div>
                  </Button>
                ));
              })()}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
