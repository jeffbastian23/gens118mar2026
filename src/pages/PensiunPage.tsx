import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Home, LogOut, Settings, Mic, Upload } from "lucide-react";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import PensiunTable from "@/components/PensiunTable";
import NotificationBell from "@/components/NotificationBell";
import AISearchBar from "@/components/AISearchBar";
import FloatingVoiceAssistant from "@/components/FloatingVoiceAssistant";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Voicebot from "@/components/Voicebot";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PensiunPage() {
  const { user, fullName, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const canEdit = role !== "overview";
  const [voicebotOpen, setVoicebotOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      toast.error("Hanya admin yang dapat mengimport data");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Transform data to match database schema
      const pensiunData = jsonData.map((item: any) => ({
        nip: String(item["NIP"] || "").replace(/^'/, "").trim(),
        nama_lengkap: String(item["Nama Lengkap"] || "").trim(),
        usia_tahun: item["Usia Tahun"] ? parseInt(String(item["Usia Tahun"])) : null,
        masa_kerja_tahun: item["Masa Kerja Tahun"] ? parseInt(String(item["Masa Kerja Tahun"])) : null,
        jenjang_jabatan: item["Jenjang Jabatan"] ? String(item["Jenjang Jabatan"]).trim() : null,
        jabatan: item["Jabatan"] ? String(item["Jabatan"]).trim() : null,
        unit_organisasi: item["Eselon 3"] ? String(item["Eselon 3"]).trim() : (item["Unit Organisasi"] ? String(item["Unit Organisasi"]).trim() : null),
      }));

      console.log("Data yang akan diimport:", pensiunData.slice(0, 3)); // Debug first 3 records

      // Insert in batches of 100
      const batchSize = 100;
      let successCount = 0;
      
      for (let i = 0; i < pensiunData.length; i += batchSize) {
        const batch = pensiunData.slice(i, i + batchSize);
        const { error } = await supabase
          .from("pensiun")
          .upsert(batch, { onConflict: "nip", ignoreDuplicates: false });

        if (error) {
          console.error("Error importing batch:", error);
          toast.error(`Error pada batch ${i / batchSize + 1}: ${error.message}`);
        } else {
          successCount += batch.length;
        }
      }

      toast.success(`Berhasil mengimport ${successCount} data pensiun ke database`);
      
      // Reset file input and reload to show updated data
      event.target.value = '';
      
      // Reload page after a short delay to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error importing data:", error);
      toast.error("Gagal mengimport data: " + error);
    } finally {
      setImporting(false);
    }
  };

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
                <h1 className="text-2xl font-bold">Pensiun</h1>
                <p className="text-sm text-blue-100">Kanwil DJBC Jawa Timur I</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{fullName}</p>
                <p className="text-xs text-blue-100">{role === "admin" ? "Administrator" : role === "overview" ? "Overview" : "Pengguna"}</p>
              </div>
              {isAdmin && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => document.getElementById('pensiun-file-input')?.click()}
                    disabled={importing}
                    className="text-white hover:bg-white/20 gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {importing ? "Mengimport..." : "Import Excel"}
                  </Button>
                  <input
                    id="pensiun-file-input"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportData}
                    style={{ display: 'none' }}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/admin")}
                    className="text-white hover:bg-white/20 gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Panel Admin
                  </Button>
                </>
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
        <PensiunTable />
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
