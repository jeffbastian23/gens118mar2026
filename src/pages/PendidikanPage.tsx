import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Home, LogOut, Settings, Mic, Upload } from "lucide-react";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import PendidikanTable from "@/components/PendidikanTable";
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

export default function PendidikanPage() {
  const { user, fullName, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const canEdit = role !== "overview";
  const [voicebotOpen, setVoicebotOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

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
      const pendidikanData = jsonData.map((item: any) => ({
        nip: String(item["NIP"] || "").replace(/^'/, "").trim(),
        nama_lengkap: String(item["Nama Lengkap"] || "").trim(),
        pendidikan: String(item["Pendidikan"] || "").trim(),
        tahun_lulus: item["Tahun Lulus"] ? parseInt(String(item["Tahun Lulus"])) : null,
        lokasi_pendidikan: String(item["Lokasi Pendidikan"] || "").trim(),
        jurusan: item["Jurusan"] && item["Jurusan"] !== "-" ? String(item["Jurusan"]).trim() : null,
        nama_lembaga_pendidikan: item["Nama Lembaga Pendidikan"] && item["Nama Lembaga Pendidikan"] !== "-" ? String(item["Nama Lembaga Pendidikan"]).trim() : null,
      }));

      console.log("Data yang akan diimport:", pendidikanData.slice(0, 3)); // Debug first 3 records

      // Insert in batches of 100
      const batchSize = 100;
      let successCount = 0;
      let errorCount = 0;
      
      console.log(`[Import] Starting import of ${pendidikanData.length} records in ${Math.ceil(pendidikanData.length / batchSize)} batches`);
      
      for (let i = 0; i < pendidikanData.length; i += batchSize) {
        const batch = pendidikanData.slice(i, i + batchSize);
        console.log(`[Import] Processing batch ${Math.floor(i / batchSize) + 1}: records ${i + 1} to ${Math.min(i + batchSize, pendidikanData.length)}`);
        
        const { error } = await supabase
          .from("pendidikan")
          .upsert(batch, { onConflict: "nip", ignoreDuplicates: false });

        if (error) {
          console.error(`[Import] Error on batch ${Math.floor(i / batchSize) + 1}:`, error);
          toast.error(`Error pada batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
          console.log(`[Import] Batch ${Math.floor(i / batchSize) + 1} success: ${batch.length} records (total success: ${successCount})`);
        }
      }
      
      console.log(`[Import] Import complete: ${successCount} success, ${errorCount} errors`);

      toast.success(`Berhasil mengimport ${successCount} data pendidikan ke database`);
      
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
                <h1 className="text-2xl font-bold">Pendidikan</h1>
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
                    onClick={() => document.getElementById('pendidikan-file-input')?.click()}
                    disabled={importing}
                    className="text-white hover:bg-white/20 gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {importing ? "Mengimport..." : "Import Excel"}
                  </Button>
                  <input
                    id="pendidikan-file-input"
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
        <PendidikanTable />
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
