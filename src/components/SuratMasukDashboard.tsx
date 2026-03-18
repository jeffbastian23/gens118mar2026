import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FileText, TrendingUp, Clock, CheckCircle, ArrowRight, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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
}

interface SuratMasukDashboardProps {
  suratMasuk: SuratMasuk[];
  bukuBambu: BukuBambu[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

export default function SuratMasukDashboard({ suratMasuk, bukuBambu }: SuratMasukDashboardProps) {
  // Calculate statistics
  const totalSurat = suratMasuk.length;
  
  // Get surat this month
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const suratThisMonth = suratMasuk.filter(s => {
    const date = new Date(s.tanggal_terima);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  }).length;

  // Get surat today
  const today = new Date().toDateString();
  const suratToday = suratMasuk.filter(s => 
    new Date(s.tanggal_terima).toDateString() === today
  ).length;

  // Calculate total tracking
  const totalTracking = bukuBambu.length;

  // Calculate buku tamu count (entries without surat_masuk_id)
  const bukuTamuCount = bukuBambu.filter(b => !b.surat_masuk_id).length;

  // Distribution by tujuan bagian
  const tujuanStats: { [key: string]: number } = {};
  suratMasuk.forEach(s => {
    s.tujuan_bagian.forEach(tujuan => {
      tujuanStats[tujuan] = (tujuanStats[tujuan] || 0) + 1;
    });
  });

  const tujuanData = Object.entries(tujuanStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Monthly trend (last 6 months)
  const monthlyData: { [key: string]: number } = {};
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  
  suratMasuk.forEach(s => {
    const date = new Date(s.tanggal_terima);
    if (date >= sixMonthsAgo) {
      const monthKey = format(date, "MMM yyyy", { locale: id });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    }
  });

  const trendData = Object.entries(monthlyData)
    .map(([month, total]) => ({ month, total }))
    .slice(-6);

  // Get tracking for a specific surat
  const getSuratTracking = (suratId: string) => {
    return bukuBambu.filter(b => b.surat_masuk_id === suratId).sort((a, b) => 
      new Date(a.tanggal_kirim).getTime() - new Date(b.tanggal_kirim).getTime()
    );
  };

  // Get recent surat with tracking
  const recentSuratWithTracking = suratMasuk
    .filter(s => getSuratTracking(s.id).length > 0)
    .slice(0, 5);

  // Calculate feedback statistics
  const suratWithFeedback = suratMasuk.filter(s => s.feedback_rating !== null);
  const averageRating = suratWithFeedback.length > 0
    ? (suratWithFeedback.reduce((sum, s) => sum + (s.feedback_rating || 0), 0) / suratWithFeedback.length).toFixed(1)
    : 0;
  const feedbackCount = suratWithFeedback.length;
  
  // Rating distribution
  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating: `${rating}★`,
    count: suratWithFeedback.filter(s => s.feedback_rating === rating).length
  }));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Surat Masuk</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSurat}</div>
            <p className="text-xs text-muted-foreground">Semua data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suratThisMonth}</div>
            <p className="text-xs text-muted-foreground">{format(new Date(), "MMMM yyyy", { locale: id })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suratToday}</div>
            <p className="text-xs text-muted-foreground">{format(new Date(), "dd MMMM yyyy", { locale: id })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tracking</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTracking}</div>
            <p className="text-xs text-muted-foreground">Riwayat pergerakan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buku Tamu</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bukuTamuCount}</div>
            <p className="text-xs text-muted-foreground">Entri buku tamu</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tren 6 Bulan Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution by Tujuan */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi per Tujuan Bagian</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tujuanData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tujuanData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feedback Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Statistik Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{averageRating}</div>
                <p className="text-sm text-muted-foreground">Rata-rata Rating</p>
                <p className="text-xs text-muted-foreground">{feedbackCount} dari {totalSurat} surat</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ratingDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="rating" type="category" />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tracking Display - Moved from Buku Bambu */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Surat Terbaru</CardTitle>
          <CardDescription>Lacak pergerakan surat antar unit</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSuratWithTracking.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Belum ada tracking surat</p>
          ) : (
            <div className="space-y-4">
              {recentSuratWithTracking.map((surat) => {
                const tracking = getSuratTracking(surat.id);
                return (
                  <Card key={surat.id} className="border">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{surat.nomor_dokumen}</CardTitle>
                          <CardDescription>{surat.hal}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-2">
                        {tracking.map((t, index) => (
                          <div key={t.id} className="flex items-center gap-2">
                            <div className="bg-primary/10 rounded-lg px-3 py-2 text-sm">
                              <div className="font-medium">{t.ke_unit}</div>
                              <div className="text-xs text-muted-foreground">{t.nama_penerima}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(t.tanggal_kirim), "dd/MM/yy HH:mm")}
                              </div>
                            </div>
                            {index < tracking.length - 1 && (
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
