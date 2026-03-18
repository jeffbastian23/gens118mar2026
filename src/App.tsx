import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import Beranda from "./pages/Beranda";
import SuratTugas from "./pages/SuratTugas";
import PlhPlt from "./pages/PlhPlt";
import PendidikanPage from "./pages/PendidikanPage";
import PensiunPage from "./pages/PensiunPage";
import CutiPage from "./pages/CutiPage";
import GenerateTemplate from "./pages/GenerateTemplate";
import TemplateSetupGuide from "./pages/TemplateSetupGuide";
import AbsensiPage from "./pages/AbsensiPage";
import DaftarPegawai from "./pages/DaftarPegawai";
import ArsipPage from "./pages/ArsipPage";
import BeritaPage from "./pages/BeritaPage";
import DigitalFootprint from "./pages/DigitalFootprint";
import AgendaPage from "./pages/AgendaPage";
import KunjunganTamuPage from "./pages/KunjunganTamuPage";
import SuratMasukPage from "./pages/SuratMasukPage";
import EbookPage from "./pages/EbookPage";
import QRPresensiPage from "./pages/QRPresensiPage";
import AktivasiCortaxPage from "./pages/AktivasiCortaxPage";
import JapriTemanPage from "./pages/JapriTemanPage";
import LiveChatSDM from "./pages/LiveChatSDM";
import RumahNegaraPage from "./pages/RumahNegaraPage";
import MonitorPBDKPage from "./pages/MonitorPBDKPage";
import MutasiPage from "./pages/MutasiPage";
import KekuatanPegawaiPage from "./pages/KekuatanPegawaiPage";
import GradingPage from "./pages/GradingPage";
import PenilaianPerilakuPage from "./pages/PenilaianPerilakuPage";
import KenaikanPangkatPage from "./pages/KenaikanPangkatPage";
import CorebasePage from "./pages/CorebasePage";
import PerkawinanPage from "./pages/PerkawinanPage";
import { useActiveUserTracking } from "./hooks/useActiveUserTracking";

const queryClient = new QueryClient();

// Wrapper component to enable active user tracking
function AppContent() {
  useActiveUserTracking();
  
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<Beranda />} />
      <Route path="/main" element={<Index />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/surat-tugas" element={<SuratTugas />} />
      <Route path="/plh-plt" element={<PlhPlt />} />
      <Route path="/pendidikan" element={<PendidikanPage />} />
      <Route path="/pensiun" element={<PensiunPage />} />
      <Route path="/cuti" element={<CutiPage />} />
      <Route path="/generate-template" element={<GenerateTemplate />} />
      <Route path="/template-setup-guide" element={<TemplateSetupGuide />} />
      <Route path="/absensi" element={<AbsensiPage />} />
      <Route path="/daftar-pegawai" element={<DaftarPegawai />} />
      <Route path="/arsip" element={<ArsipPage />} />
      <Route path="/berita" element={<BeritaPage />} />
      <Route path="/digital-footprint" element={<DigitalFootprint />} />
      <Route path="/agenda" element={<AgendaPage />} />
      <Route path="/kunjungan-tamu" element={<KunjunganTamuPage />} />
      <Route path="/surat-masuk" element={<SuratMasukPage />} />
      <Route path="/ebook" element={<EbookPage />} />
      <Route path="/qr-presensi" element={<QRPresensiPage />} />
      <Route path="/aktivasi-cortax" element={<AktivasiCortaxPage />} />
      <Route path="/japri-teman" element={<JapriTemanPage />} />
      <Route path="/live-chat-sdm" element={<LiveChatSDM />} />
      <Route path="/rumah-negara" element={<RumahNegaraPage />} />
      <Route path="/monitor-pbdk" element={<MonitorPBDKPage />} />
      <Route path="/mutasi" element={<MutasiPage />} />
      <Route path="/kekuatan-pegawai" element={<KekuatanPegawaiPage />} />
      <Route path="/grading" element={<GradingPage />} />
      <Route path="/penilaian-perilaku" element={<PenilaianPerilakuPage />} />
      <Route path="/kenaikan-pangkat" element={<KenaikanPangkatPage />} />
      <Route path="/corebase" element={<CorebasePage />} />
      <Route path="/perkawinan" element={<PerkawinanPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;