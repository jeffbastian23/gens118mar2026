import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Home, LogOut, Settings, Mic } from "lucide-react";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AbsensiTable from "@/components/AbsensiTable";
import AbsensiDashboard from "@/components/AbsensiDashboard";
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

export default function AbsensiPage() {
  const { user, fullName, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const canEdit = role !== "overview";
  const [voicebotOpen, setVoicebotOpen] = useState(false);

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
                <h1 className="text-2xl font-bold">Absensi</h1>
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
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="pengolahan">Pengolahan Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-4">
            <AbsensiDashboard />
          </TabsContent>
          
          <TabsContent value="pengolahan" className="space-y-4">
            <AbsensiTable />
          </TabsContent>
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
