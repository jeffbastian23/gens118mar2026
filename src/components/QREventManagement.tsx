import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, QrCode, MapPin, Trash2, Download, FileDown, Pencil, Search, Navigation } from "lucide-react";
import QRCode from "qrcode";
import { format } from "date-fns";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QREvent {
  id: string;
  nama_kegiatan: string;
  link_tujuan: string;
  qr_code: string | null;
  latitude: number;
  longitude: number;
  radius_meter: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  is_active: boolean;
  created_at: string;
  alamat: string | null;
}

export default function QREventManagement() {
  const { toast } = useToast();
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [events, setEvents] = useState<QREvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<QREvent | null>(null);
  const [isLoadingAlamat, setIsLoadingAlamat] = useState(false);
  const [isEditLoadingAlamat, setIsEditLoadingAlamat] = useState(false);
  const [editLocationMode, setEditLocationMode] = useState(false);
  
  // Search/filter states
  const [searchNamaKegiatan, setSearchNamaKegiatan] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [searchAlamat, setSearchAlamat] = useState("");
  const [searchLokasi, setSearchLokasi] = useState("");

  const [formData, setFormData] = useState({
    nama_kegiatan: "",
    link_tujuan: "",
    latitude: "",
    longitude: "",
    radius_meter: "5",
    tanggal_mulai: "",
    tanggal_selesai: "",
    alamat: ""
  });
  const [editFormData, setEditFormData] = useState({
    nama_kegiatan: "",
    link_tujuan: "",
    latitude: "",
    longitude: "",
    radius_meter: "5",
    tanggal_mulai: "",
    tanggal_selesai: "",
    is_active: true,
    alamat: ""
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  // Reverse geocoding function
  const reverseGeocode = async (lat: string, lon: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id',
            'User-Agent': 'QRPresensiApp/1.0'
          }
        }
      );
      const data = await response.json();
      if (data.display_name) {
        return data.display_name;
      }
      return "";
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return "";
    }
  };

  // Auto-fetch alamat when coordinates change for add dialog
  useEffect(() => {
    const fetchAlamat = async () => {
      if (formData.latitude && formData.longitude) {
        setIsLoadingAlamat(true);
        const address = await reverseGeocode(formData.latitude, formData.longitude);
        setFormData(prev => ({ ...prev, alamat: address }));
        setIsLoadingAlamat(false);
      }
    };
    
    const timeoutId = setTimeout(fetchAlamat, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.latitude, formData.longitude]);

  // Auto-fetch alamat when coordinates change for edit dialog (only when in edit location mode)
  useEffect(() => {
    const fetchAlamat = async () => {
      if (editLocationMode && editFormData.latitude && editFormData.longitude) {
        setIsEditLoadingAlamat(true);
        const address = await reverseGeocode(editFormData.latitude, editFormData.longitude);
        setEditFormData(prev => ({ ...prev, alamat: address }));
        setIsEditLoadingAlamat(false);
      }
    };
    
    const timeoutId = setTimeout(fetchAlamat, 500);
    return () => clearTimeout(timeoutId);
  }, [editFormData.latitude, editFormData.longitude, editLocationMode]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("qr_presensi_events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Gagal memuat data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtered events based on search/filter criteria
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Filter by nama kegiatan
      if (searchNamaKegiatan && !event.nama_kegiatan.toLowerCase().includes(searchNamaKegiatan.toLowerCase())) {
        return false;
      }
      // Filter by status
      if (filterStatus === "active" && !event.is_active) return false;
      if (filterStatus === "inactive" && event.is_active) return false;
      // Filter by date range
      if (filterDateStart) {
        const startDate = new Date(filterDateStart);
        const eventStart = new Date(event.tanggal_mulai);
        if (eventStart < startDate) return false;
      }
      if (filterDateEnd) {
        const endDate = new Date(filterDateEnd);
        const eventEnd = new Date(event.tanggal_selesai);
        if (eventEnd > endDate) return false;
      }
      // Filter by alamat
      if (searchAlamat && (!event.alamat || !event.alamat.toLowerCase().includes(searchAlamat.toLowerCase()))) {
        return false;
      }
      // Filter by lokasi (lat/long)
      if (searchLokasi) {
        const lokasiStr = `${event.latitude} ${event.longitude}`;
        if (!lokasiStr.includes(searchLokasi)) return false;
      }
      return true;
    });
  }, [events, searchNamaKegiatan, filterStatus, filterDateStart, filterDateEnd, searchAlamat, searchLokasi]);

  const generateQRCode = async (link: string) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(link, {
        width: 300,
        margin: 2,
        color: {
          dark: "#1e40af",
          light: "#ffffff",
        },
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error("Error generating QR code:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Normalize URL - add https:// if no protocol specified
      let normalizedUrl = formData.link_tujuan.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      
      const qrCode = await generateQRCode(normalizedUrl);
      
      const { error } = await supabase
        .from("qr_presensi_events")
        .insert({
          nama_kegiatan: formData.nama_kegiatan,
          link_tujuan: normalizedUrl,
          qr_code: qrCode,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          radius_meter: parseInt(formData.radius_meter),
          tanggal_mulai: formData.tanggal_mulai,
          tanggal_selesai: formData.tanggal_selesai,
          alamat: formData.alamat || null,
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Kegiatan berhasil ditambahkan dengan QR Code",
      });

      setDialogOpen(false);
      setFormData({
        nama_kegiatan: "",
        link_tujuan: "",
        latitude: "",
        longitude: "",
        radius_meter: "5",
        tanggal_mulai: "",
        tanggal_selesai: "",
        alamat: ""
      });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Gagal menambahkan kegiatan",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (event: QREvent) => {
    setEditingEvent(event);
    setEditFormData({
      nama_kegiatan: event.nama_kegiatan,
      link_tujuan: event.link_tujuan,
      latitude: event.latitude.toString(),
      longitude: event.longitude.toString(),
      radius_meter: event.radius_meter.toString(),
      tanggal_mulai: format(new Date(event.tanggal_mulai), "yyyy-MM-dd'T'HH:mm"),
      tanggal_selesai: format(new Date(event.tanggal_selesai), "yyyy-MM-dd'T'HH:mm"),
      is_active: event.is_active,
      alamat: event.alamat || ""
    });
    setEditLocationMode(false);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      let normalizedUrl = editFormData.link_tujuan.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      const qrCode = await generateQRCode(normalizedUrl);

      const { error } = await supabase
        .from("qr_presensi_events")
        .update({
          nama_kegiatan: editFormData.nama_kegiatan,
          link_tujuan: normalizedUrl,
          qr_code: qrCode,
          latitude: parseFloat(editFormData.latitude),
          longitude: parseFloat(editFormData.longitude),
          radius_meter: parseInt(editFormData.radius_meter),
          tanggal_mulai: editFormData.tanggal_mulai,
          tanggal_selesai: editFormData.tanggal_selesai,
          is_active: editFormData.is_active,
          alamat: editFormData.alamat || null,
        })
        .eq("id", editingEvent.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Kegiatan berhasil diperbarui",
      });

      setEditDialogOpen(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Gagal memperbarui kegiatan",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kegiatan ini?")) return;

    try {
      const { error } = await supabase
        .from("qr_presensi_events")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Kegiatan berhasil dihapus",
      });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Gagal menghapus",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = (qrCode: string, namaKegiatan: string) => {
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `QR_${namaKegiatan.replace(/\s+/g, "_")}.png`;
    link.click();
  };

  const downloadEventPDF = async (event: QREvent) => {
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Add title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("PENGUMUMAN KEGIATAN", 105, 20, { align: "center" });

      // Add event name
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(event.nama_kegiatan, 105, 35, { align: "center" });

      // Add QR Code
      if (event.qr_code) {
        const qrSize = 80;
        const qrX = (210 - qrSize) / 2;
        pdf.addImage(event.qr_code, "PNG", qrX, 50, qrSize, qrSize);
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "italic");
        pdf.text("Scan QR Code untuk Absensi", 105, 140, { align: "center" });
      }

      // Add details section
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("INFORMASI KEGIATAN", 20, 155);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      
      let yPos = 165;
      
      // Period
      pdf.setFont("helvetica", "bold");
      pdf.text("Periode:", 20, yPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `${format(new Date(event.tanggal_mulai), "dd/MM/yyyy HH:mm")} s/d ${format(new Date(event.tanggal_selesai), "dd/MM/yyyy HH:mm")}`,
        50,
        yPos
      );
      
      yPos += 10;
      
      // Alamat
      if (event.alamat) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Alamat:", 20, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(event.alamat, 50, yPos, { maxWidth: 140 });
        yPos += 10;
      }
      
      // Location
      pdf.setFont("helvetica", "bold");
      pdf.text("Lokasi Absensi:", 20, yPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Latitude: ${event.latitude}`, 20, yPos + 7);
      pdf.text(`Longitude: ${event.longitude}`, 20, yPos + 14);
      pdf.text(`Radius: ${event.radius_meter} meter`, 20, yPos + 21);
      
      yPos += 35;
      
      // Link
      if (event.link_tujuan) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Link Tujuan:", 20, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(event.link_tujuan, 20, yPos + 7, { maxWidth: 170 });
      }

      // Add footer
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.text(
        `Dicetak pada: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}`,
        105,
        280,
        { align: "center" }
      );

      // Save PDF
      pdf.save(`Pengumuman_${event.nama_kegiatan.replace(/\s+/g, "_")}.pdf`);

      toast({
        title: "Berhasil",
        description: "PDF pengumuman berhasil diunduh",
      });
    } catch (error: any) {
      toast({
        title: "Gagal membuat PDF",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
          toast({
            title: "Lokasi terdeteksi",
            description: "Koordinat berhasil diisi otomatis",
          });
        },
        (error) => {
          toast({
            title: "Gagal mendapatkan lokasi",
            description: error.message,
            variant: "destructive",
          });
        }
      );
    }
  };

  const clearFilters = () => {
    setSearchNamaKegiatan("");
    setFilterStatus("all");
    setFilterDateStart("");
    setFilterDateEnd("");
    setSearchAlamat("");
    setSearchLokasi("");
  };

  if (loading) {
    return <div className="text-center py-8">Memuat data...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Database Kegiatan & QR Code</CardTitle>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Tambah Kegiatan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tambah Kegiatan Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nama_kegiatan">Nama Kegiatan</Label>
                    <Input
                      id="nama_kegiatan"
                      value={formData.nama_kegiatan}
                      onChange={(e) => setFormData({ ...formData, nama_kegiatan: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="link_tujuan">Link Tujuan (untuk QR Code)</Label>
                    <Input
                      id="link_tujuan"
                      type="text"
                      placeholder="s.kemenkeu.go.id/sdmBCjatim1"
                      value={formData.link_tujuan}
                      onChange={(e) => setFormData({ ...formData, link_tujuan: e.target.value })}
                      required
                    />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format apapun diterima (akan otomatis menambahkan https:// jika diperlukan)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tanggal_mulai">Tanggal Mulai</Label>
                    <Input
                      id="tanggal_mulai"
                      type="datetime-local"
                      value={formData.tanggal_mulai}
                      onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tanggal_selesai">Tanggal Selesai</Label>
                    <Input
                      id="tanggal_selesai"
                      type="datetime-local"
                      value={formData.tanggal_selesai}
                      onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Lokasi Titik 0 Absen</Label>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      className="gap-2 w-full mb-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Gunakan Lokasi Saat Ini
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="lokasi_kegiatan">Lokasi Kegiatan</Label>
                  <Input
                    id="lokasi_kegiatan"
                    placeholder="Contoh: Kanwil DJBC Jatim I, Gedung A Lt.2, dll"
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Masukkan nama lokasi atau alamat kegiatan
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="-7.2575"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="112.7521"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="radius_meter">Radius (meter)</Label>
                    <Input
                      id="radius_meter"
                      type="number"
                      min="1"
                      value={formData.radius_meter}
                      onChange={(e) => setFormData({ ...formData, radius_meter: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                {/* Map Preview */}
                {formData.latitude && formData.longitude && (
                  <div className="border rounded-lg overflow-hidden">
                    <Label className="block p-2 bg-muted font-semibold">Preview Peta Lokasi</Label>
                    <iframe
                      width="100%"
                      height="300"
                      frameBorder="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(formData.longitude) - 0.01},${parseFloat(formData.latitude) - 0.01},${parseFloat(formData.longitude) + 0.01},${parseFloat(formData.latitude) + 0.01}&layer=mapnik&marker=${formData.latitude},${formData.longitude}`}
                      style={{ border: 0 }}
                    ></iframe>
                    <div className="p-2 bg-muted text-xs text-muted-foreground">
                      Lokasi: {formData.latitude}, {formData.longitude} (Radius: {formData.radius_meter}m)
                    </div>
                  </div>
                )}
                
                <Button type="submit" className="w-full">
                  Simpan & Generate QR Code
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Section */}
        <div className="mb-4 p-4 bg-muted/50 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filter & Pencarian</h4>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Reset Filter
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <Label className="text-xs">Nama Kegiatan</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari nama..."
                  value={searchNamaKegiatan}
                  onChange={(e) => setSearchNamaKegiatan(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tanggal Mulai</Label>
              <Input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Tanggal Selesai</Label>
              <Input
                type="date"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Alamat Otomasi</Label>
              <Input
                placeholder="Cari alamat..."
                value={searchAlamat}
                onChange={(e) => setSearchAlamat(e.target.value)}
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Lokasi (Lat/Long)</Label>
              <Input
                placeholder="Cari koordinat..."
                value={searchLokasi}
                onChange={(e) => setSearchLokasi(e.target.value)}
                className="h-9 mt-1"
              />
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">No</TableHead>
                <TableHead>Nama Kegiatan</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Alamat Otomasi</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-left">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {events.length === 0 
                      ? "Belum ada kegiatan. Tambahkan kegiatan baru untuk mulai."
                      : "Tidak ada kegiatan yang sesuai dengan filter."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event, index) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{event.nama_kegiatan}</TableCell>
                    <TableCell>
                      {event.qr_code && (
                        <div className="flex items-center gap-2">
                          <img src={event.qr_code} alt="QR Code" className="w-16 h-16" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadQRCode(event.qr_code!, event.nama_kegiatan)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Lat: {event.latitude}</div>
                        <div>Long: {event.longitude}</div>
                        <div className="text-gray-500">Radius: {event.radius_meter}m</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-[200px]">
                        {event.alamat || <span className="text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(event.tanggal_mulai), "dd/MM/yyyy HH:mm")}</div>
                        <div>{format(new Date(event.tanggal_selesai), "dd/MM/yyyy HH:mm")}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.is_active ? (
                        <span className="text-green-600 font-medium">Aktif</span>
                      ) : (
                        <span className="text-gray-500">Nonaktif</span>
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex gap-2 justify-start">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadEventPDF(event)}
                          title="Download PDF Pengumuman"
                        >
                          <FileDown className="w-4 h-4" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(event)}
                              title="Edit Kegiatan"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(event.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Total: {filteredEvents.length} kegiatan {filteredEvents.length !== events.length && `(dari ${events.length})`}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Kegiatan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit_nama_kegiatan">Nama Kegiatan</Label>
              <Input
                id="edit_nama_kegiatan"
                value={editFormData.nama_kegiatan}
                onChange={(e) => setEditFormData({ ...editFormData, nama_kegiatan: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_link_tujuan">Link Tujuan (untuk QR Code)</Label>
              <Input
                id="edit_link_tujuan"
                type="text"
                placeholder="s.kemenkeu.go.id/sdmBCjatim1"
                value={editFormData.link_tujuan}
                onChange={(e) => setEditFormData({ ...editFormData, link_tujuan: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_tanggal_mulai">Tanggal Mulai</Label>
                <Input
                  id="edit_tanggal_mulai"
                  type="datetime-local"
                  value={editFormData.tanggal_mulai}
                  onChange={(e) => setEditFormData({ ...editFormData, tanggal_mulai: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_tanggal_selesai">Tanggal Selesai</Label>
                <Input
                  id="edit_tanggal_selesai"
                  type="datetime-local"
                  value={editFormData.tanggal_selesai}
                  onChange={(e) => setEditFormData({ ...editFormData, tanggal_selesai: e.target.value })}
                  required
                />
              </div>
            </div>
            
            {/* Location Section */}
            {editLocationMode ? (
              <>
                <div>
                  <Label>Lokasi Titik 0 Absen</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              setEditFormData({
                                ...editFormData,
                                latitude: position.coords.latitude.toString(),
                                longitude: position.coords.longitude.toString(),
                              });
                              toast({
                                title: "Lokasi terdeteksi",
                                description: "Koordinat berhasil diisi otomatis",
                              });
                            },
                            (error) => {
                              toast({
                                title: "Gagal mendapatkan lokasi",
                                description: error.message,
                                variant: "destructive",
                              });
                            }
                          );
                        }
                      }}
                      className="gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Gunakan Lokasi Saat Ini
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditLocationMode(false)}
                    >
                      Selesai Edit
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit_latitude">Latitude</Label>
                    <Input
                      id="edit_latitude"
                      type="number"
                      step="any"
                      placeholder="-7.2575"
                      value={editFormData.latitude}
                      onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_longitude">Longitude</Label>
                    <Input
                      id="edit_longitude"
                      type="number"
                      step="any"
                      placeholder="112.7521"
                      value={editFormData.longitude}
                      onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_radius_meter">Radius (meter)</Label>
                    <Input
                      id="edit_radius_meter"
                      type="number"
                      min="1"
                      value={editFormData.radius_meter}
                      onChange={(e) => setEditFormData({ ...editFormData, radius_meter: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Latitude</Label>
                  <Input value={editFormData.latitude} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input value={editFormData.longitude} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Radius (meter)</Label>
                  <Input value={editFormData.radius_meter} readOnly className="bg-muted" />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={editFormData.is_active}
                onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit_is_active">Kegiatan Aktif</Label>
            </div>
            
            {/* Map Preview with Edit Button */}
            {editFormData.latitude && editFormData.longitude && (
              <div className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-2 bg-muted">
                  <Label className="font-semibold">Preview Peta Lokasi</Label>
                  {!editLocationMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditLocationMode(true)}
                      className="gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      Edit Lokasi
                    </Button>
                  )}
                </div>
                <iframe
                  width="100%"
                  height="200"
                  frameBorder="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(editFormData.longitude) - 0.01},${parseFloat(editFormData.latitude) - 0.01},${parseFloat(editFormData.longitude) + 0.01},${parseFloat(editFormData.latitude) + 0.01}&layer=mapnik&marker=${editFormData.latitude},${editFormData.longitude}`}
                  style={{ border: 0 }}
                ></iframe>
                <div className="p-2 bg-muted text-xs text-muted-foreground">
                  Lokasi: {editFormData.latitude}, {editFormData.longitude} (Radius: {editFormData.radius_meter}m)
                </div>
              </div>
            )}
            
            {/* Alamat Otomasi */}
            <div>
              <Label htmlFor="edit_alamat">Alamat Otomasi</Label>
              <div className="relative">
                <Input
                  id="edit_alamat"
                  placeholder={isEditLoadingAlamat ? "Mengambil alamat..." : "Alamat akan terisi otomatis dari lokasi"}
                  value={editFormData.alamat}
                  readOnly
                  className="bg-muted pr-8"
                />
                {isEditLoadingAlamat && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Alamat diambil otomatis berdasarkan koordinat lokasi titik 0 absen
              </p>
            </div>
            
            <Button type="submit" className="w-full">
              Simpan Perubahan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
