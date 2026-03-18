import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubMenuAccess } from "@/hooks/useSubMenuAccess";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, LogOut, Settings, LayoutDashboard } from "lucide-react";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import NotificationBell from "@/components/NotificationBell";
import FloatingVoiceAssistant from "@/components/FloatingVoiceAssistant";
import QREventManagement from "@/components/QREventManagement";
import QRAttendanceResponses from "@/components/QRAttendanceResponses";
import QRPresensiDashboard from "@/components/QRPresensiDashboard";

export default function QRPresensiPage() {
  const { user, fullName, role, loading: authLoading, signOut } = useAuth();
  const { hasSubMenuAccess, isAdmin } = useSubMenuAccess("qr-presensi");
  const navigate = useNavigate();
  const canEdit = role !== "overview";

  // Determine which tabs are accessible
  const tabs = [
    { value: "dashboard", label: "Dashboard", subMenuId: "qr-presensi:dashboard" },
    { value: "events", label: "Database Kegiatan", subMenuId: "qr-presensi:database-kegiatan" },
    { value: "responses", label: "Data Absensi", subMenuId: "qr-presensi:data-absensi" },
  ];

  const accessibleTabs = tabs.filter(tab => hasSubMenuAccess(tab.subMenuId));
  const defaultTab = accessibleTabs.length > 0 ? accessibleTabs[0].value : "dashboard";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-lg">Memuat...</p>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold">QR Presensi</h1>
                <p className="text-sm text-blue-100">Sistem Absensi Berbasis QR Code & Geolokasi</p>
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
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList>
            {accessibleTabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className={tab.value === "dashboard" ? "gap-2" : ""}>
                {tab.value === "dashboard" && <LayoutDashboard className="w-4 h-4" />}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {hasSubMenuAccess("qr-presensi:dashboard") && (
            <TabsContent value="dashboard" className="space-y-4">
              <QRPresensiDashboard />
            </TabsContent>
          )}
          
          {hasSubMenuAccess("qr-presensi:database-kegiatan") && (
            <TabsContent value="events" className="space-y-4">
              <QREventManagement />
            </TabsContent>
          )}
          
          {hasSubMenuAccess("qr-presensi:data-absensi") && (
            <TabsContent value="responses" className="space-y-4">
              <QRAttendanceResponses />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Floating Voice Assistant */}
      <FloatingVoiceAssistant />
    </div>
  );
}