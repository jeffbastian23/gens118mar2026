import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileSpreadsheet, Star, Frown, Meh, Smile, Laugh, RefreshCw, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SurveyResponse {
  id: string;
  nama_tamu: string;
  instansi: string | null;
  jenis_kelamin: string | null;
  pilihan_kantor: string | null;
  pendidikan: string | null;
  layanan: string | null;
  feedback_rating: number | null;
  feedback_comment: string | null;
  survey_responses: any;
  feedback_submitted_at: string | null;
  feedback_submitted_by: string | null;
  created_at: string;
}

const SURVEY_QUESTIONS = [
  { id: "q1", text: "a. Terdapat kejelasan persyaratan (kelengkapan dokumen yang dipersyaratkan) atas jenis layanan yang Anda ajukan." },
  { id: "q2", text: "b. Prosedur atas jenis layanan yang Anda ajukan, mudah dipahami." },
  { id: "q3", text: "c. Petugas layanan sigap dan cepat tanggap dalam memberikan layanan yang Anda ajukan." },
  { id: "q4", text: "d. Petugas layanan kompeten dan profesional dalam memberikan pelayanan." },
  { id: "q5", text: "e. Petugas layanan sopan dan ramah dalam memberikan pelayanan." },
  { id: "q6", text: "f. Sarana dan Prasarana (Toilet, Ruang Tunggu, Area Parkir, dsb) sangat baik dan mendukung layanan." },
  { id: "q7", text: "g. Tidak terdapat biaya yang dipungut atas jenis layanan yang Anda ajukan." },
  { id: "q8", text: "h. Produk layanan (output) yang tercantum dalam standar pelayanan sesuai dengan hasil (kenyataan) layanan yang diberikan." },
  { id: "q9", text: "i. Informasi mengenai pelayanan pengaduan dapat diakses dengan baik." }
];

const getRatingIcon = (rating: number | null) => {
  if (!rating) return null;
  if (rating === 2) return <Frown className="w-5 h-5 text-orange-500" />;
  if (rating === 3) return <Meh className="w-5 h-5 text-yellow-500" />;
  if (rating === 4) return <Smile className="w-5 h-5 text-lime-500" />;
  if (rating === 5) return <Laugh className="w-5 h-5 text-green-500" />;
  return null;
};

const getRatingLabel = (rating: number | null) => {
  if (!rating) return "-";
  if (rating === 2) return "Buruk";
  if (rating === 3) return "Cukup";
  if (rating === 4) return "Baik";
  if (rating === 5) return "Sangat Baik";
  return "-";
};

export default function PenilaianSKMTab() {
  const [data, setData] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchNama, setSearchNama] = useState("");
  const [searchLayanan, setSearchLayanan] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedItem, setSelectedItem] = useState<SurveyResponse | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: responses, error } = await supabase
      .from("kunjungan_tamu")
      .select("*")
      .not("feedback_rating", "is", null)
      .order("feedback_submitted_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data penilaian");
      setLoading(false);
      return;
    }

    setData(responses || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter data
  const filteredData = data.filter(item => {
    const matchNama = !searchNama || item.nama_tamu.toLowerCase().includes(searchNama.toLowerCase());
    const matchLayanan = !searchLayanan || (item.layanan && item.layanan.toLowerCase().includes(searchLayanan.toLowerCase()));
    
    const feedbackDate = item.feedback_submitted_at ? new Date(item.feedback_submitted_at) : null;
    const matchDateFrom = !dateFrom || (feedbackDate && feedbackDate >= new Date(dateFrom));
    const matchDateTo = !dateTo || (feedbackDate && feedbackDate <= new Date(dateTo + "T23:59:59"));
    
    return matchNama && matchLayanan && matchDateFrom && matchDateTo;
  });

  // Statistics
  const stats = (() => {
    const avgFeedback = filteredData.length > 0
      ? (filteredData.reduce((sum, item) => sum + (item.feedback_rating || 0), 0) / filteredData.length).toFixed(2)
      : 0;

    // Calculate average survey responses
    const allSurveyAvg: Record<string, { sum: number; count: number }> = {};
    SURVEY_QUESTIONS.forEach(q => {
      allSurveyAvg[q.id] = { sum: 0, count: 0 };
    });

    filteredData.forEach(item => {
      if (item.survey_responses && typeof item.survey_responses === 'object') {
        Object.entries(item.survey_responses as Record<string, number>).forEach(([key, value]) => {
          if (allSurveyAvg[key] && typeof value === 'number') {
            allSurveyAvg[key].sum += value;
            allSurveyAvg[key].count += 1;
          }
        });
      }
    });

    const surveyAvgScores = SURVEY_QUESTIONS.map(q => ({
      id: q.id,
      text: q.text,
      avg: allSurveyAvg[q.id].count > 0 
        ? (allSurveyAvg[q.id].sum / allSurveyAvg[q.id].count).toFixed(2) 
        : "-"
    }));

    // Calculate overall SKM average
    let totalSurveySum = 0;
    let totalSurveyCount = 0;
    Object.values(allSurveyAvg).forEach(v => {
      totalSurveySum += v.sum;
      totalSurveyCount += v.count;
    });
    const overallSKM = totalSurveyCount > 0 ? (totalSurveySum / totalSurveyCount).toFixed(2) : "-";

    return { avgFeedback, surveyAvgScores, overallSKM, total: filteredData.length };
  })();

  // Export to Excel
  const exportExcel = () => {
    const exportData = filteredData.map((item, i) => {
      const row: Record<string, any> = {
        "No": i + 1,
        "Nama Tamu": item.nama_tamu,
        "Instansi": item.instansi || "-",
        "Jenis Kelamin": item.jenis_kelamin === "L" ? "Laki-laki" : item.jenis_kelamin === "P" ? "Perempuan" : "-",
        "Kantor": item.pilihan_kantor || "-",
        "Pendidikan": item.pendidikan || "-",
        "Layanan": item.layanan || "-",
        "Rating Kepuasan": getRatingLabel(item.feedback_rating),
        "Komentar": item.feedback_comment || "-",
        "Waktu Feedback": item.feedback_submitted_at 
          ? format(new Date(item.feedback_submitted_at), "dd/MM/yyyy HH:mm") 
          : "-",
        "Diisi Oleh": item.feedback_submitted_by || "-"
      };

      // Add survey responses
      SURVEY_QUESTIONS.forEach(q => {
        row[`SKM ${q.id.replace('q', '')}`] = item.survey_responses?.[q.id] || "-";
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Penilaian SKM");
    XLSX.writeFile(wb, `penilaian_skm_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
    toast.success("Data berhasil diekspor");
  };

  const openDetail = (item: SurveyResponse) => {
    setSelectedItem(item);
    setShowDetailDialog(true);
  };

  // Calculate individual average for a response
  const calculateItemAvg = (surveyResponses: Record<string, number> | null) => {
    if (!surveyResponses) return "-";
    const values = Object.values(surveyResponses);
    if (values.length === 0) return "-";
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Responden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Rata-rata Kepuasan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              {stats.avgFeedback}
              <Star className="w-6 h-6 fill-yellow-300 text-yellow-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Nilai SKM (1-8)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.overallSKM}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Konversi SKM (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.overallSKM !== "-" ? ((parseFloat(stats.overallSKM) / 8) * 100).toFixed(1) : "-"}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Survey Averages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Rata-rata Penilaian Per Butir
          </CardTitle>
          <CardDescription>Nilai rata-rata dari semua responden (skala 1-8)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.surveyAvgScores.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <span className="text-sm flex-1">{item.text}</span>
                <Badge variant={parseFloat(item.avg as string) >= 6 ? "default" : parseFloat(item.avg as string) >= 4 ? "secondary" : "destructive"}>
                  {item.avg}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>Daftar Penilaian SKM</CardTitle>
              <CardDescription>Semua hasil penilaian dari pengguna jasa</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-xs">Cari Nama</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nama tamu..."
                  value={searchNama}
                  onChange={(e) => setSearchNama(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cari Layanan</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Layanan..."
                  value={searchLayanan}
                  onChange={(e) => setSearchLayanan(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Dari Tanggal</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Sampai Tanggal</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Tamu</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Kepuasan</TableHead>
                  <TableHead>Rata SKM</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead className="w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada data penilaian
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.nama_tamu}</TableCell>
                      <TableCell>{item.layanan || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRatingIcon(item.feedback_rating)}
                          <span>{getRatingLabel(item.feedback_rating)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {calculateItemAvg(item.survey_responses as Record<string, number> | null)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.feedback_submitted_at 
                          ? format(new Date(item.feedback_submitted_at), "dd MMM yyyy HH:mm", { locale: id })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openDetail(item)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Detail Penilaian SKM</DialogTitle>
            <DialogDescription>Detail lengkap penilaian dari responden</DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <ScrollArea className="flex-1 min-h-0 pr-4">
              <div className="space-y-4 py-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nama Tamu</Label>
                    <p className="font-medium">{selectedItem.nama_tamu}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Instansi</Label>
                    <p className="font-medium">{selectedItem.instansi || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Jenis Kelamin</Label>
                    <p className="font-medium">
                      {selectedItem.jenis_kelamin === "L" ? "Laki-laki" : 
                       selectedItem.jenis_kelamin === "P" ? "Perempuan" : "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Kantor</Label>
                    <p className="font-medium">{selectedItem.pilihan_kantor || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Pendidikan</Label>
                    <p className="font-medium">{selectedItem.pendidikan || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Layanan</Label>
                    <p className="font-medium">{selectedItem.layanan || "-"}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="border-t pt-4">
                  <Label className="text-xs text-muted-foreground">Rating Kepuasan</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getRatingIcon(selectedItem.feedback_rating)}
                    <span className="font-medium text-lg">{getRatingLabel(selectedItem.feedback_rating)}</span>
                  </div>
                </div>

                {/* Comment */}
                {selectedItem.feedback_comment && (
                  <div className="border-t pt-4">
                    <Label className="text-xs text-muted-foreground">Komentar / Saran</Label>
                    <p className="mt-1 p-3 bg-muted rounded-lg">{selectedItem.feedback_comment}</p>
                  </div>
                )}

                {/* Survey Responses */}
                {selectedItem.survey_responses && Object.keys(selectedItem.survey_responses).length > 0 && (
                  <div className="border-t pt-4">
                    <Label className="text-xs text-muted-foreground mb-3 block">Penilaian 9 Butir SKM</Label>
                    <div className="space-y-2">
                      {SURVEY_QUESTIONS.map(q => (
                        <div key={q.id} className="p-3 bg-muted/50 rounded-lg flex justify-between items-start gap-4">
                          <span className="text-sm flex-1">{q.text}</span>
                          <Badge variant={
                            (selectedItem.survey_responses as Record<string, number>)?.[q.id] >= 6 ? "default" : 
                            (selectedItem.survey_responses as Record<string, number>)?.[q.id] >= 4 ? "secondary" : "destructive"
                          }>
                            {(selectedItem.survey_responses as Record<string, number>)?.[q.id] || "-"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Rata-rata Penilaian</p>
                      <p className="text-2xl font-bold text-primary">
                        {calculateItemAvg(selectedItem.survey_responses as Record<string, number>)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="border-t pt-4 text-sm text-muted-foreground">
                  <p>Diisi oleh: {selectedItem.feedback_submitted_by || "-"}</p>
                  <p>Waktu: {selectedItem.feedback_submitted_at 
                    ? format(new Date(selectedItem.feedback_submitted_at), "dd MMMM yyyy HH:mm", { locale: id })
                    : "-"}</p>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
