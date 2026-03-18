import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, isAdminRole } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Database, LayoutDashboard, Home, LogOut, Settings, Headphones, FolderOutput, FolderInput } from "lucide-react";
import MutasiDashboard from "@/components/MutasiDashboard";
import MutasiPengolahanData from "@/components/MutasiPengolahanData";
import DosirOutTable from "@/components/DosirOutTable";
import DosirInTable from "@/components/DosirInTable";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import NotificationBell from "@/components/NotificationBell";
import HeaderWorkButton from "@/components/HeaderWorkButton";

export default function MutasiPage() {
  const { user, loading, fullName, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
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
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 md:py-6">
          <div className="flex items-center justify-between gap-2">
            {/* Logo and Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <img src={logoKemenkeu} alt="Kementerian Keuangan" className="h-8 sm:h-10 md:h-12 lg:h-14 w-auto drop-shadow-lg" />
              <img src={logoCustoms} alt="Customs" className="h-6 sm:h-8 md:h-10 lg:h-12 w-auto drop-shadow-lg" />
              <div>
                <h1 className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold leading-tight">Mutasi</h1>
                <p className="text-[10px] sm:text-xs md:text-sm text-blue-100">Kanwil DJBC Jawa Timur I</p>
              </div>
            </div>
            
            {/* Right side: User info + Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* User info - Hidden on mobile */}
              <div className="hidden lg:flex flex-col gap-1 text-right">
                <p className="text-sm font-medium">{fullName || 'User'}</p>
                <p className="text-xs text-blue-200 capitalize">{role || 'User'}</p>
              </div>
              
              {/* Separator & Navigation */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-2">
                  <div className="border-l border-white/30 h-10"></div>
                  {isAdminRole(role) && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate("/admin")}
                      className="text-white hover:bg-white/20 gap-1 text-xs sm:text-sm"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden xl:inline">Panel Admin</span>
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/")}
                    className="text-white hover:bg-white/20 gap-1 text-xs sm:text-sm"
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden xl:inline">Beranda</span>
                  </Button>
                </div>
                
                {/* Mobile Navigation Icons */}
                {isAdminRole(role) && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => navigate("/admin")}
                    className="lg:hidden text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9"
                    title="Panel Admin"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
                
                <HeaderWorkButton />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => window.open("https://teams.microsoft.com/l/chat/48:notes/conversations?context=%7B%22contextType%22%3A%22chat%22%7D", "_blank")}
                  className="text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9"
                  title="Call Center"
                >
                  <Headphones className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <NotificationBell />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate("/")}
                  className="lg:hidden text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9"
                  title="Beranda"
                >
                  <Home className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={signOut}
                  className="text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9"
                  title="Keluar"
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="pengolahan-data" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Pengolahan Data
            </TabsTrigger>
            <TabsTrigger value="dosir-out" className="flex items-center gap-2">
              <FolderOutput className="w-4 h-4" />
              Dosir Out
            </TabsTrigger>
            <TabsTrigger value="dosir-in" className="flex items-center gap-2">
              <FolderInput className="w-4 h-4" />
              Dosir In
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <MutasiDashboard />
          </TabsContent>

          <TabsContent value="pengolahan-data">
            <MutasiPengolahanData />
          </TabsContent>

          <TabsContent value="dosir-out">
            <DosirOutTable />
          </TabsContent>

          <TabsContent value="dosir-in">
            <DosirInTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
