import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubMenuAccess } from "@/hooks/useSubMenuAccess";
import { Button } from "@/components/ui/button";
import { Home, LogOut, Settings, Mic } from "lucide-react";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DaftarBerkasTable from "@/components/DaftarBerkasTable";
import IsiBerkasTable from "@/components/IsiBerkasTable";
import NotificationBell from "@/components/NotificationBell";
import DashboardArsip from "@/components/DashboardArsip";
import PeminjamanArsipTable from "@/components/PeminjamanArsipTable";
import GudangArsipTegalsariTable from "@/components/GudangArsipTegalsariTable";
import PendataanMasukTable from "@/components/PendataanMasukTable";
import AISearchBar from "@/components/AISearchBar";
import FloatingVoiceAssistant from "@/components/FloatingVoiceAssistant";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Voicebot from "@/components/Voicebot";

export default function ArsipPage() {
  const { user, fullName, role, loading: authLoading, signOut } = useAuth();
  const { hasSubMenuAccess, loading: accessLoading, isAdmin } = useSubMenuAccess("arsip");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canEdit = role !== "overview";
  const [voicebotOpen, setVoicebotOpen] = useState(false);

  // Reordered tabs: Dashboard, Gudang Arsip Tegalsari, Isi Berkas, Daftar Berkas, Pendataan Masuk, Peminjaman Arsip
  const tabs = [
    { value: "dashboard", label: "Dashboard", subMenuId: "arsip:dashboard" },
    { value: "gudang", label: "Gudang Arsip Tegalsari", subMenuId: "arsip:gudang-tegalsari" },
    { value: "isi", label: "Isi Berkas", subMenuId: "arsip:isi-berkas" },
    { value: "daftar", label: "Daftar Berkas", subMenuId: "arsip:daftar-berkas" },
    { value: "pendataan", label: "Pendataan Masuk", subMenuId: "arsip:pendataan-masuk" },
    { value: "peminjaman", label: "Peminjaman Arsip", subMenuId: "arsip:peminjaman" },
  ];

  const accessibleTabs = tabs.filter(tab => hasSubMenuAccess(tab.subMenuId));
  const defaultTab = accessibleTabs.length > 0 ? accessibleTabs[0].value : "dashboard";

  // Handle auto-download from QR code scan
  const handleAutoDownload = useCallback(async () => {
    const downloadType = searchParams.get("download");
    const berkasNo = searchParams.get("berkas");

    if (downloadType === "pdf" && berkasNo) {
      try {
        // Fetch berkas data
        const { data: berkas, error } = await supabase
          .from("daftar_berkas")
          .select("*")
          .eq("no_berkas", parseInt(berkasNo))
          .single();

        if (error || !berkas) {
          console.error("Error fetching berkas:", error);
          return;
        }

        // Fetch isi_berkas
        const { data: isiBerkas } = await supabase
          .from("isi_berkas")
          .select("*")
          .eq("no_berkas", berkas.no_berkas)
          .order("no_urut", { ascending: true });

        // Generate PDF
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
        });

        // Generate QR Code
        const baseUrl = window.location.origin;
        const qrLink = `${baseUrl}/arsip?download=pdf&berkas=${berkas.no_berkas}`;
        const qrDataUrl = await QRCode.toDataURL(qrLink, { width: 100, margin: 1 });

        // Load logos
        const loadImage = (url: string): Promise<HTMLImageElement> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
          });
        };

        const logoKemenkeuUrl = await import("@/assets/logo-kemenkeu-pdf.png");
        const logoBeacukaiUrl = await import("@/assets/logo-beacukai-pdf.png");

        let logoKemenkeu: HTMLImageElement | null = null;
        let logoBeacukai: HTMLImageElement | null = null;
        
        try {
          logoKemenkeu = await loadImage(logoKemenkeuUrl.default);
          logoBeacukai = await loadImage(logoBeacukaiUrl.default);
        } catch (e) {
          console.log("Could not load logos");
        }

        // Header background
        doc.setFillColor(30, 100, 200);
        doc.rect(0, 0, 210, 35, "F");

        if (logoKemenkeu) {
          doc.addImage(logoKemenkeu, "PNG", 15, 5, 22, 25);
        }
        if (logoBeacukai) {
          doc.addImage(logoBeacukai, "PNG", 173, 5, 22, 25);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Arsip", 105, 15, { align: "center" });
        doc.setFontSize(12);
        doc.text("Kanwil DJBC Jawa Timur I", 105, 25, { align: "center" });

        let yPos = 50;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);

        const drawField = (label: string, value: string, x: number, y: number, labelWidth: number = 50) => {
          doc.setFont("helvetica", "bold");
          doc.text(label, x, y);
          doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(value, 100);
          doc.text(lines, x + labelWidth, y);
          return Math.max(1, lines.length) * 6;
        };

        yPos += drawField("JENIS ARSIP:", berkas.uraian_informasi_berkas, 20, yPos);
        yPos += 4;
        yPos += drawField("KODE KLASIFIKASI:", berkas.kode_klasifikasi, 20, yPos);
        yPos += 4;
        yPos += drawField("TAHUN:", berkas.kurun_waktu, 20, yPos);
        yPos += 4;
        yPos += drawField("TINGKAT:", berkas.tingkat_perkembangan, 20, yPos);
        yPos += 4;
        yPos += drawField("JUMLAH:", String(berkas.jumlah), 20, yPos);
        yPos += 4;
        yPos += drawField("LOKASI:", berkas.lokasi, 20, yPos);
        yPos += 4;
        yPos += drawField("PIC:", berkas.pic, 20, yPos);
        yPos += 4;
        yPos += drawField("KETERANGAN:", berkas.keterangan || "-", 20, yPos);

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(145, 45, 45, 30);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("NOMOR BOKS", 167.5, 55, { align: "center" });
        doc.setFontSize(20);
        doc.text(String(berkas.no_berkas), 167.5, 68, { align: "center" });

        doc.addImage(qrDataUrl, "PNG", 152, 80, 30, 30);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("Scan untuk detail", 167, 115, { align: "center" });

        if (isiBerkas && isiBerkas.length > 0) {
          yPos += 20;
          doc.setLineWidth(0.3);
          doc.line(20, yPos - 5, 190, yPos - 5);
          
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("DAFTAR ISI BERKAS", 105, yPos, { align: "center" });
          yPos += 10;

          doc.setFillColor(240, 240, 240);
          doc.rect(20, yPos - 5, 170, 8, "F");
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text("No", 25, yPos);
          doc.text("Uraian Informasi Arsip", 40, yPos);
          doc.text("Kurun Waktu", 130, yPos);
          doc.text("Jumlah", 165, yPos);
          yPos += 8;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);

          isiBerkas.forEach((isi: any) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }

            doc.text(String(isi.no_urut), 25, yPos);
            const uraianLines = doc.splitTextToSize(isi.uraian_informasi_arsip || "", 85);
            doc.text(uraianLines, 40, yPos);
            doc.text(isi.kurun_waktu || "", 130, yPos);
            doc.text(String(isi.jumlah), 165, yPos);

            yPos += Math.max(6, uraianLines.length * 4);
          });
        }

        doc.save(`Label-Berkas-${berkas.no_berkas}.pdf`);
        
        // Clear URL params after download
        navigate("/arsip", { replace: true });
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    handleAutoDownload();
  }, [handleAutoDownload]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <img src={logoKemenkeu} alt="Kementerian Keuangan" className="h-14 w-auto drop-shadow-lg" />
              <img src={logoCustoms} alt="Customs" className="h-12 w-auto drop-shadow-lg" />
              <div>
                <h1 className="text-2xl font-bold">Arsip</h1>
                <p className="text-sm text-blue-100">Kanwil DJBC Jawa Timur I</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{fullName}</p>
                <p className="text-xs text-blue-100">{role === "admin" ? "Administrator" : role === "overview" ? "Overview" : "Pengguna"}</p>
              </div>
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/admin")}
                  className="text-white hover:bg-white/20 gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Panel Admin
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setVoicebotOpen(true)}
                className="text-white hover:bg-white/20 gap-2"
              >
                <Mic className="h-4 w-4" />
                Buka Voicebot
              </Button>
              <NotificationBell />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/")}
                className="text-white hover:bg-white/20 gap-2"
              >
                <Home className="h-5 w-5" />
                Beranda
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={signOut}
                className="text-white hover:bg-white/20"
                title="Keluar"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* AI Search Bar */}
          <div className="mt-4">
            <AISearchBar placeholder="Cari dengan AI di seluruh database..." />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="flex flex-wrap justify-start gap-1 h-auto p-1">
            {accessibleTabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="whitespace-nowrap">{tab.label}</TabsTrigger>
            ))}
          </TabsList>

          {hasSubMenuAccess("arsip:daftar-berkas") && (
            <TabsContent value="daftar" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Berkas</CardTitle>
                  <CardDescription>Daftar semua berkas arsip</CardDescription>
                </CardHeader>
                <CardContent>
                  <DaftarBerkasTable />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasSubMenuAccess("arsip:isi-berkas") && (
            <TabsContent value="isi" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Isi Berkas</CardTitle>
                  <CardDescription>Detail isi berkas arsip</CardDescription>
                </CardHeader>
                <CardContent>
                  <IsiBerkasTable />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasSubMenuAccess("arsip:pendataan-masuk") && (
            <TabsContent value="pendataan" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pendataan Masuk</CardTitle>
                  <CardDescription>Pendataan arsip masuk dengan informasi lokasi penyimpanan</CardDescription>
                </CardHeader>
                <CardContent>
                  <PendataanMasukTable />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasSubMenuAccess("arsip:dashboard") && (
            <TabsContent value="dashboard" className="mt-6">
              <DashboardArsip />
            </TabsContent>
          )}

          {hasSubMenuAccess("arsip:peminjaman") && (
            <TabsContent value="peminjaman" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Peminjaman Arsip</CardTitle>
                  <CardDescription>Kelola peminjaman arsip dokumen</CardDescription>
                </CardHeader>
                <CardContent>
                  <PeminjamanArsipTable />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasSubMenuAccess("arsip:gudang-tegalsari") && (
            <TabsContent value="gudang" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gudang Arsip Tegalsari</CardTitle>
                  <CardDescription>Kapasitas dan informasi rak arsip Tegalsari</CardDescription>
                </CardHeader>
                <CardContent>
                  <GudangArsipTegalsariTable />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Voicebot Dialog */}
      <Dialog open={voicebotOpen} onOpenChange={setVoicebotOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Voicebot Asisten</DialogTitle>
          </DialogHeader>
          <Voicebot />
        </DialogContent>
      </Dialog>

      {/* Floating Voice Assistant */}
      <FloatingVoiceAssistant />
    </div>
  );
}
