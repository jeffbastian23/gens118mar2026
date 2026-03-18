import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, 
  UserCog, 
  Award, 
  GraduationCap, 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Heart,
  Cloud,
  CloudRain,
  Sun,
  LogOut,
  MapPin,
  Mic,
  MicOff,
  Settings,
  BookOpen,
  CalendarCheck,
  Menu,
  LayoutDashboard,
  ShieldCheck,
  Home,
  Building2,
  Archive,
  BrainCircuit,
  Newspaper,
  Activity,
  UserCheck,
  Mail,
  QrCode,
  Headphones,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  ShieldCheck as CortaxIcon,
  ClipboardList
} from "lucide-react";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import logoBigFive from "@/assets/logo-big-five.png";
import NotificationBell from "@/components/NotificationBell";
import HeaderWorkButton from "@/components/HeaderWorkButton";
import FloatingVoiceAssistant from "@/components/FloatingVoiceAssistant";
import UserAvatarWithStatus from "@/components/UserAvatarWithStatus";
import InstagramStories from "@/components/InstagramStories";
import LiveStatusPanel from "@/components/LiveStatusPanel";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import AISearchBar from "@/components/AISearchBar";
import WhatsAppHelpdeskDialog from "@/components/WhatsAppHelpdeskDialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  path: string;
}

export default function Beranda() {
  const { user, fullName, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [weather, setWeather] = useState({ temp: 28, condition: "Cerah" });
  const [tomorrowWeather, setTomorrowWeather] = useState({ temp: 27, condition: "Berawan", rainChance: 40 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [location, setLocation] = useState("Surabaya, Jawa Timur");
  const [voiceBotEnabled, setVoiceBotEnabled] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newsItems, setNewsItems] = useState<string[]>([]);
  const [newsWithImages, setNewsWithImages] = useState<Array<{id: string; title: string; image_url: string | null; published_at: string | null; source: string | null}>>([]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [allowedMenus, setAllowedMenus] = useState<string[]>([]);
  const [menuAccessLoading, setMenuAccessLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<"available" | "busy" | "away" | "in_meeting">("available");
  const [userAvatar, setUserAvatar] = useState<string | undefined>();
  const [liveCameraActive, setLiveCameraActive] = useState(false);
  const liveCameraDisplayRef = useRef<HTMLVideoElement>(null);
  const [events, setEvents] = useState<Array<{id: string; title: string; description: string | null; event_date: string; event_time: string | null; location: string | null; image_url: string | null}>>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [eselonIII, setEselonIII] = useState<string | null>(null);
  const [eselonIV, setEselonIV] = useState<string | null>(null);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);

  // Fetch user profile (avatar & status)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("avatar_url, user_status, eselon_iii, eselon_iv")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setUserAvatar(data.avatar_url || undefined);
          setUserStatus((data.user_status as typeof userStatus) || "available");
          setEselonIII(data.eselon_iii || null);
          setEselonIV(data.eselon_iv || null);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch news from database
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from("news")
          .select("id, title, image_url, published_at, source")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;
        
        if (data && data.length > 0) {
          setNewsWithImages(data as any);
          const newsText = data.map(item => item.title).join(" • ") + " • ";
          setNewsItems([newsText]);
        } else {
          setNewsItems([
            "Jakarta, 06 November 2025 – Kementerian Keuangan (Kemenkeu) melalui Direktorat Jenderal Bea dan Cukai (DJBC) dan Direktorat Jenderal Pajak (DJP) bersama Satuan Tugas Khusus Optimalisasi Penerimaan Negara (Satgassus OPN) Polri berhasil mengungkap dugaan pelanggaran ekspor produk turunan crude palm oil (CPO) dalam 87 kontainer di Pelabuhan Tanjung Priok, Jakarta • "
          ]);
        }
      } catch (error) {
        console.error("Error fetching news:", error);
        setNewsItems([
          "Jakarta, 06 November 2025 – Kementerian Keuangan (Kemenkeu) melalui Direktorat Jenderal Bea dan Cukai (DJBC) dan Direktorat Jenderal Pajak (DJP) bersama Satuan Tugas Khusus Optimalisasi Penerimaan Negara (Satgassus OPN) Polri berhasil mengungkap dugaan pelanggaran ekspor produk turunan crude palm oil (CPO) dalam 87 kontainer di Pelabuhan Tanjung Priok, Jakarta • "
        ]);
      }
    };
    
    fetchNews();
  }, []);

  // Fetch events from database
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("id, title, description, event_date, event_time, location, image_url")
          .eq("is_active", true)
          .order("event_date", { ascending: true })
          .limit(10);

        if (error) throw error;
        setEvents((data as any) || []);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    
    fetchEvents();
  }, []);

  // News carousel auto-advance
  useEffect(() => {
    if (newsWithImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % newsWithImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [newsWithImages.length]);

  // Event carousel auto-advance
  useEffect(() => {
    if (events.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentEventIndex((prev) => (prev + 1) % events.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [events.length]);

  // Fetch user menu access
  useEffect(() => {
    const fetchMenuAccess = async () => {
      if (!user) {
        setMenuAccessLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_menu_access")
          .select("allowed_menus")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        // If user has access record, use it. Otherwise, they have access to all menus.
        if (data) {
          setAllowedMenus(data.allowed_menus || []);
        } else {
          // No access record means no restrictions (for backwards compatibility)
          // Admin always has full access
          setAllowedMenus([]);
        }
      } catch (error) {
        console.error("Error fetching menu access:", error);
        setAllowedMenus([]);
      } finally {
        setMenuAccessLoading(false);
      }
    };

    fetchMenuAccess();
  }, [user]);


  // Cluster 1: Administrasi SDM - Sorted alphabetically by title
  const administrasiSDMItems: MenuItem[] = [
    {
      id: "absensi",
      title: "Absensi",
      icon: <Calendar className="w-8 h-8" />,
      description: "Kelola absensi pegawai",
      path: "/absensi"
    },
    {
      id: "surat-masuk",
      title: "Administrasi Surat",
      icon: <Mail className="w-8 h-8" />,
      description: "Kelola surat masuk, buku bambu & book nomor",
      path: "/surat-masuk"
    },
    {
      id: "agenda",
      title: "Agenda",
      icon: <CalendarCheck className="w-8 h-8" />,
      description: "Kelola agenda & booking ruangan",
      path: "/agenda"
    },
    {
      id: "aktivasi-cortax",
      title: "Aktivasi Cortax",
      icon: <CortaxIcon className="w-8 h-8" />,
      description: "Monitoring aktivasi akun Coretax",
      path: "/aktivasi-cortax"
    },
    {
      id: "arsip",
      title: "Arsip",
      icon: <Archive className="w-8 h-8" />,
      description: "Kelola arsip berkas",
      path: "/arsip"
    },
    {
      id: "berita",
      title: "Berita",
      icon: <Newspaper className="w-8 h-8" />,
      description: "Lihat berita terkini",
      path: "/berita"
    },
    {
      id: "corebase",
      title: "Corebase",
      icon: <BrainCircuit className="w-8 h-8" />,
      description: "Database pokok pegawai",
      path: "/corebase"
    },
    {
      id: "cuti",
      title: "Cuti",
      icon: <CalendarCheck className="w-8 h-8" />,
      description: "Data cuti pegawai",
      path: "/cuti"
    },
    {
      id: "daftar-pegawai",
      title: "Daftar Pegawai",
      icon: <Users className="w-8 h-8" />,
      description: "Kelola data pegawai",
      path: "/daftar-pegawai"
    },
    {
      id: "digital-footprint",
      title: "Digital Footprint",
      icon: <Activity className="w-8 h-8" />,
      description: "Lacak aktivitas & produktivitas kerja",
      path: "/digital-footprint"
    },
    {
      id: "ebook",
      title: "eBook",
      icon: <BookOpen className="w-8 h-8" />,
      description: "Perpustakaan digital peraturan ASN",
      path: "/ebook"
    },
    {
      id: "grading",
      title: "Grading",
      icon: <Award className="w-8 h-8" />,
      description: "Sistem penilaian pegawai",
      path: "/grading"
    },
    {
      id: "japri-teman",
      title: "Japri Teman",
      icon: <MessageSquare className="w-8 h-8" />,
      description: "Kontak pegawai untuk komunikasi tim",
      path: "/japri-teman"
    },
    {
      id: "kekuatan-pegawai",
      title: "Kekuatan Pegawai",
      icon: <Users className="w-8 h-8" />,
      description: "Monitoring kehadiran & kekuatan pegawai",
      path: "/kekuatan-pegawai"
    },
    {
      id: "kenaikan-gaji",
      title: "Kenaikan Gaji Berkala",
      icon: <DollarSign className="w-8 h-8" />,
      description: "Kelola kenaikan gaji berkala",
      path: "maintenance"
    },
    {
      id: "kenaikan-pangkat",
      title: "Kenaikan Pangkat",
      icon: <TrendingUp className="w-8 h-8" />,
      description: "Proses kenaikan pangkat",
      path: "/kenaikan-pangkat"
    },
    {
      id: "live-chat-sdm",
      title: "Live Chat SDM",
      icon: <MessageCircle className="w-8 h-8" />,
      description: "FAQ kepegawaian & integrasi agent bidang",
      path: "/live-chat-sdm"
    },
    {
      id: "monitor-pbdk",
      title: "Monitor PBDK",
      icon: <ClipboardList className="w-8 h-8" />,
      description: "Monitoring Perubahan Berkas Data Kepegawaian",
      path: "/monitor-pbdk"
    },
    {
      id: "kunjungan-tamu",
      title: "Pengguna Jasa/Layanan",
      icon: <UserCheck className="w-8 h-8" />,
      description: "Kelola data pengguna jasa/layanan",
      path: "/kunjungan-tamu"
    },
    {
      id: "pensiun",
      title: "Pensiun",
      icon: <Users className="w-8 h-8" />,
      description: "Data kepegawaian pensiun",
      path: "/pensiun"
    },
    {
      id: "perkawinan",
      title: "Perkawinan",
      icon: <Heart className="w-8 h-8" />,
      description: "Data perkawinan pegawai",
      path: "/perkawinan"
    },
    {
      id: "plh-plt",
      title: "Plh/Plt",
      icon: <UserCog className="w-8 h-8" />,
      description: "Penugasan Plh/Plt",
      path: "/plh-plt"
    },
    {
      id: "qr-presensi",
      title: "QR Presensi",
      icon: <QrCode className="w-8 h-8" />,
      description: "Sistem absensi QR & geolokasi",
      path: "/qr-presensi"
    },
    {
      id: "rumah-negara",
      title: "Rumah Negara",
      icon: <Building2 className="w-8 h-8" />,
      description: "Kelola data rumah negara",
      path: "/rumah-negara"
    },
    {
      id: "surat-tugas",
      title: "Surat Tugas",
      icon: <FileText className="w-8 h-8" />,
      description: "Kelola surat tugas pegawai",
      path: "/surat-tugas"
    }
  ];

  // Cluster 2: Pengembangan SDM - Sorted alphabetically by title
  const pengembanganSDMItems: MenuItem[] = [
    {
      id: "kompetensi",
      title: "Kompetensi",
      icon: <BookOpen className="w-8 h-8" />,
      description: "Pengembangan kompetensi pegawai",
      path: "maintenance"
    },
    {
      id: "mutasi",
      title: "Mutasi",
      icon: <RefreshCw className="w-8 h-8" />,
      description: "Administrasi & penunjang pengembangan SDM",
      path: "/mutasi"
    },
    {
      id: "pendidikan",
      title: "Pendidikan",
      icon: <GraduationCap className="w-8 h-8" />,
      description: "Data pendidikan pegawai",
      path: "/pendidikan"
    },
    {
      id: "penilaian-perilaku",
      title: "Penilaian Perilaku",
      icon: <Award className="w-8 h-8" />,
      description: "Penilaian perilaku kerja pegawai",
      path: "/penilaian-perilaku"
    }
  ];

  // Check if user has access to a specific menu
  const hasMenuAccess = (menuId: string): boolean => {
    // Admin always has full access
    if (role === "admin") return true;
    
    // If no access record exists (allowedMenus is empty and not loading), allow all for backwards compatibility
    // But if allowedMenus has entries, only show those menus
    if (allowedMenus.length === 0) {
      // No restriction set - allow all
      return true;
    }
    
    return allowedMenus.includes(menuId);
  };

  // Filter menus based on access
  const filteredAdminSDMItems = administrasiSDMItems.filter(item => hasMenuAccess(item.id));
  const filteredPengembanganSDMItems = pengembanganSDMItems.filter(item => hasMenuAccess(item.id));

  const handleMenuClick = (item: MenuItem) => {
    if (item.path === "maintenance") {
      toast({
        title: "Sedang Maintenance",
        description: `Fitur ${item.title} sedang dalam tahap pengembangan.`,
        variant: "default",
      });
    } else {
      navigate(item.path);
    }
  };

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Update current date every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get real-time location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // You can integrate with a geocoding API here
            // For now, keeping default location
            setLocation("Surabaya, Jawa Timur");
          } catch (error) {
            console.error("Error getting location:", error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    // Simulate weather data - in real app, use weather API
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      setWeather({ temp: 28, condition: "Cerah Pagi" });
      setTomorrowWeather({ temp: 27, condition: "Berawan", rainChance: 40 });
    } else if (hour >= 12 && hour < 18) {
      setWeather({ temp: 32, condition: "Cerah" });
      setTomorrowWeather({ temp: 29, condition: "Cerah Berawan", rainChance: 30 });
    } else {
      setWeather({ temp: 26, condition: "Cerah Malam" });
      setTomorrowWeather({ temp: 28, condition: "Cerah", rainChance: 20 });
    }
  }, []);

  const getWeatherIcon = () => {
    const condition = weather.condition.toLowerCase();
    if (condition.includes("hujan")) {
      return <CloudRain className="w-6 h-6" />;
    } else if (condition.includes("mendung")) {
      return <Cloud className="w-6 h-6" />;
    } else {
      return <Sun className="w-6 h-6" />;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

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
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            {/* Left - Logos and Title */}
            <div className="flex items-center gap-3">
              <img src={logoKemenkeu} alt="Kementerian Keuangan" className="h-12 w-auto" />
              <img src={logoCustoms} alt="Customs" className="h-10 w-auto mt-0.5" />
              <div className="border-l-2 border-white/30 pl-3 flex items-center gap-3">
                <img src={logoBigFive} alt="Big Five" className="h-12 w-auto" />
                <div>
                  <h1 className="text-xl font-bold text-white leading-tight">Gensi V.01</h1>
                  <p className="text-xs text-blue-100">Gensi - Generator Sistem Informasi SDM V.01</p>
                  <p className="text-xs text-blue-100">Kanwil DJBC Jawa Timur I</p>
                </div>
              </div>
            </div>

            {/* Right - Date, Location, Weather & Actions */}
            <div className="flex items-center gap-4">
              {/* Date & Time */}
              <div className="text-white text-right">
                <div className="flex items-center gap-2 justify-end">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {format(currentDate, "EEEE, dd MMMM yyyy HH:mm:ss", { locale: id })}
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs text-blue-100">{location}</span>
                </div>
              </div>

              {/* Weather */}
              <div className="text-white text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-200">Hari Ini:</span>
                  {getWeatherIcon()}
                  <span className="font-medium">{weather.temp}°C</span>
                  <span className="text-blue-100">• {weather.condition}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-200">Besok:</span>
                  <Cloud className="w-4 h-4" />
                  <span className="font-medium">{tomorrowWeather.temp}°C</span>
                  <span className="text-blue-100">• {tomorrowWeather.condition}</span>
                  <span className="text-blue-200 text-xs">• Hujan {tomorrowWeather.rainChance}%</span>
                </div>
              </div>

              {/* Separator */}
              <div className="border-l border-white/30 h-10"></div>

              {/* Navigation & Actions */}
              <div className="flex items-center gap-1">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-white hover:bg-white/20 h-9 w-9"
                      title="Menu"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 bg-gradient-to-r from-blue-600 to-indigo-700 border-l border-white/20 text-white">
                    <SheetHeader>
                      <SheetTitle className="text-white">Navigasi Sistem</SheetTitle>
                      <SheetDescription className="text-blue-100">
                        Akses menu dan fitur sistem secara cepat
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-8 flex flex-col gap-4">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-12 text-white hover:bg-white/20 transition-colors"
                        onClick={() => {
                          navigate("/");
                          setSidebarOpen(false);
                        }}
                      >
                        <Home className="h-5 w-5" />
                        <span className="text-base">Beranda</span>
                      </Button>
                      {(role === "admin" || role === "overview" || hasMenuAccess("dashboard")) && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-12 text-white hover:bg-white/20 transition-colors"
                          onClick={() => {
                            navigate("/dashboard");
                            setSidebarOpen(false);
                          }}
                        >
                          <LayoutDashboard className="h-5 w-5" />
                          <span className="text-base">Dashboard</span>
                        </Button>
                      )}
                      {role === "admin" && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-12 text-white hover:bg-white/20 transition-colors"
                          onClick={() => {
                            navigate("/admin");
                            setSidebarOpen(false);
                          }}
                        >
                          <ShieldCheck className="h-5 w-5" />
                          <span className="text-base">Panel Admin</span>
                        </Button>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
                
                <HeaderWorkButton />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setWhatsappDialogOpen(true)}
                  className="text-white hover:bg-white/20 h-9 w-9"
                  title="Helpdesk WhatsApp"
                >
                  <Headphones className="h-5 w-5" />
                </Button>
                <NotificationBell />
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={signOut}
                  className="text-white hover:bg-white/20 h-9 w-9"
                  title="Keluar"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden">
            {/* Row 1: Logo and Title */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <img src={logoKemenkeu} alt="Kementerian Keuangan" className="h-8 sm:h-10 w-auto" />
                <img src={logoCustoms} alt="Customs" className="h-7 sm:h-9 w-auto" />
                <img src={logoBigFive} alt="Big Five" className="h-8 sm:h-10 w-auto" />
                <div>
                  <h1 className="text-sm sm:text-base font-bold text-white leading-tight">Gensi V.01</h1>
                  <p className="text-[10px] sm:text-xs text-blue-100">Gensi - Generator Sistem Informasi SDM V.01</p>
                  <p className="text-[10px] sm:text-xs text-blue-100">Kanwil DJBC Jawa Timur I</p>
                </div>
              </div>
            </div>
            
            {/* Row 2: Date, Location, Weather - Compact 2-column grid */}
            <div className="grid grid-cols-2 gap-2 text-white text-xs mb-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span className="font-medium truncate">
                    {format(currentDate, "EEE, dd MMM yyyy", { locale: id })}
                  </span>
                </div>
                <div className="flex items-center gap-1 pl-4">
                  <span className="text-blue-100">
                    {format(currentDate, "HH:mm:ss")}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="text-blue-100 truncate">{location}</span>
                </div>
                <div className="flex items-center gap-1">
                  {getWeatherIcon()}
                  <span className="text-blue-100">{weather.temp}°C • {weather.condition}</span>
                </div>
              </div>
            </div>
            
            {/* Row 3: Weather Tomorrow */}
            <div className="flex items-center gap-1 text-xs text-white mb-2">
              <span className="text-blue-200">Besok:</span>
              <Cloud className="w-3 h-3" />
              <span>{tomorrowWeather.temp}°C • {tomorrowWeather.condition}</span>
              <span className="text-blue-200">• Hujan {tomorrowWeather.rainChance}%</span>
            </div>
            
            {/* Row 4: Navigation - 2 icons per row */}
            <div className="flex items-center justify-start gap-1">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-white hover:bg-white/20 h-8 w-8"
                    title="Menu"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 bg-gradient-to-r from-blue-600 to-indigo-700 border-l border-white/20 text-white">
                  <SheetHeader>
                    <SheetTitle className="text-white">Navigasi Sistem</SheetTitle>
                    <SheetDescription className="text-blue-100">
                      Akses menu dan fitur sistem secara cepat
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-8 flex flex-col gap-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-12 text-white hover:bg-white/20 transition-colors"
                      onClick={() => {
                        navigate("/");
                        setSidebarOpen(false);
                      }}
                    >
                      <Home className="h-5 w-5" />
                      <span className="text-base">Beranda</span>
                    </Button>
                    {(role === "admin" || role === "overview" || hasMenuAccess("dashboard")) && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-12 text-white hover:bg-white/20 transition-colors"
                        onClick={() => {
                          navigate("/dashboard");
                          setSidebarOpen(false);
                        }}
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        <span className="text-base">Dashboard</span>
                      </Button>
                    )}
                    {role === "admin" && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-12 text-white hover:bg-white/20 transition-colors"
                        onClick={() => {
                          navigate("/admin");
                          setSidebarOpen(false);
                        }}
                      >
                        <ShieldCheck className="h-5 w-5" />
                        <span className="text-base">Panel Admin</span>
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              
              <HeaderWorkButton />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setWhatsappDialogOpen(true)}
                className="text-white hover:bg-white/20 h-8 w-8"
                title="Helpdesk WhatsApp"
              >
                <Headphones className="h-4 w-4" />
              </Button>
              <NotificationBell />
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={signOut}
                className="text-white hover:bg-white/20 h-8 w-8"
                title="Keluar"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* AI Search Bar - visible to all roles */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-3 shadow-md">
        <div className="container mx-auto px-4">
          <AISearchBar placeholder="Cari dengan AI di seluruh database..." />
        </div>
      </div>

      {/* Welcome Section */}
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none shadow-xl mb-6">
          <CardContent className="py-6">
            {/* Compact Header Section: Stories | Status Rekan | Live Project */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {/* Stories Section - Left */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-2">
                <InstagramStories
                  currentUserId={user?.id || ""}
                  currentUserEmail={user?.email || ""}
                  currentUserName={fullName || user?.email?.split("@")[0] || "User"}
                  currentUserRole={role || "user"}
                />
              </div>
              
              {/* Status Rekan & Live Project - Center & Right */}
              <div className="md:col-span-2">
                <LiveStatusPanel currentUserId={user?.id || ""} />
              </div>
            </div>
            
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                {/* User Avatar with Status */}
                <UserAvatarWithStatus
                  userId={user?.id || ""}
                  avatarUrl={userAvatar}
                  fullName={fullName}
                  email={user?.email}
                  status={userStatus}
                  size="md"
                  editable={true}
                  onAvatarChange={(url) => setUserAvatar(url)}
                  onStatusChange={(status) => setUserStatus(status as typeof userStatus)}
                  onLiveCameraStart={(stream) => {
                    setLiveCameraActive(true);
                    setTimeout(() => {
                      if (liveCameraDisplayRef.current && stream) {
                        liveCameraDisplayRef.current.srcObject = stream;
                        liveCameraDisplayRef.current.play().catch(console.error);
                      }
                    }, 100);
                  }}
                  onLiveCameraStop={() => setLiveCameraActive(false)}
                />
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                    {getGreeting()}, {fullName || "User"}! 👋
                  </h2>
                  <p className="text-blue-100 text-base sm:text-lg">
                    Selamat datang di sistem administrasi kepegawaian
                  </p>
                </div>
                
                {/* Live camera is now displayed in the avatar circle */}
              </div>
              <div className="flex flex-col items-end gap-1 min-w-0 max-w-[220px] shrink-0">
                <Badge 
                  variant="secondary" 
                  className="text-base px-4 py-2 bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  {role === "admin" ? "Admin" : role === "super" ? "Super" : role === "overview" ? "Overview" : "User"}
                </Badge>
                {eselonIII && (
                  <span 
                    className="text-xs text-blue-100 text-right w-full break-words leading-tight" 
                    title={eselonIII}
                  >
                    {eselonIII}
                  </span>
                )}
                {eselonIV && (
                  <span 
                    className="text-xs text-blue-200 text-right w-full break-words leading-tight" 
                    title={eselonIV}
                  >
                    {eselonIV}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Berita Terbaru (Left) & Event (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Berita Terbaru - Left */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                Berita Terbaru
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/berita")}
              >
                Lihat Semua
              </Button>
            </div>
            
            {/* Running Text for News - Inside card */}
            {newsItems.length > 0 && newsItems[0] && (
              <div className="px-4 py-2 bg-red-50 border-b">
                <div className="flex items-center gap-3">
                  <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                    BERITA
                  </span>
                  <div className="flex-1 overflow-hidden relative">
                     <style>{`
                      @keyframes scroll-berita {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                      }
                      .animate-scroll-berita {
                        animation: scroll-berita ${Math.max(30, newsItems[0].length * 0.15)}s linear infinite;
                        display: inline-block;
                        white-space: nowrap;
                        will-change: transform;
                      }
                    `}</style>
                    <p className="text-gray-700 text-sm animate-scroll-berita">
                      {newsItems[0] + newsItems[0]}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-4">
              {newsWithImages.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setCurrentNewsIndex((prev) => (prev - 1 + newsWithImages.length) % newsWithImages.length)}
                      >
                        ‹
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setCurrentNewsIndex((prev) => (prev + 1) % newsWithImages.length)}
                      >
                        ›
                      </Button>
                    </div>
                  </div>
                  
                  <div className="relative rounded-xl overflow-hidden shadow-lg">
                    {newsWithImages[currentNewsIndex]?.image_url ? (
                      <img 
                        src={newsWithImages[currentNewsIndex].image_url || ''} 
                        alt={newsWithImages[currentNewsIndex].title}
                        className="w-full h-48 md:h-64 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 md:h-64 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Newspaper className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                    
                    {/* Overlay with news title */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      {newsWithImages[currentNewsIndex]?.published_at && (
                        <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(newsWithImages[currentNewsIndex].published_at), "dd MMMM yyyy", { locale: id })}</span>
                        </div>
                      )}
                      <p className="text-white font-semibold text-sm md:text-base line-clamp-2">
                        {newsWithImages[currentNewsIndex]?.title}
                      </p>
                    </div>
                  </div>
                  
                  {/* Dots indicator */}
                  <div className="flex justify-center gap-2 mt-3">
                    {newsWithImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentNewsIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentNewsIndex ? 'bg-primary w-6' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">Belum ada berita</p>
              )}
            </div>
          </div>

          {/* Event - Right */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                Event Mendatang
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/berita?tab=events")}
              >
                Lihat Semua
              </Button>
            </div>
            
            {/* Running Text for Events */}
            {events.length > 0 && (
              <div className="px-4 py-2 bg-green-50 border-b">
                <div className="flex items-center gap-3">
                  <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                    EVENT
                  </span>
                  <div className="flex-1 overflow-hidden relative">
                    <style>{`
                      @keyframes scroll-event {
                        0% { transform: translateX(0%); }
                        100% { transform: translateX(-50%); }
                      }
                      .animate-scroll-event {
                        animation: scroll-event 120s linear infinite;
                        display: inline-block;
                        white-space: nowrap;
                      }
                    `}</style>
                    <p className="text-gray-700 text-sm animate-scroll-event">
                      {events.map(e => `📅 ${format(new Date(e.event_date), "dd MMM", { locale: id })} - ${e.title}${e.location ? ` @ ${e.location}` : ''}`).join(' • ') + ' • ' + events.map(e => `📅 ${format(new Date(e.event_date), "dd MMM", { locale: id })} - ${e.title}${e.location ? ` @ ${e.location}` : ''}`).join(' • ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-4">
              {events.length > 0 ? (
                <>
                  {/* Event Image Carousel */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setCurrentEventIndex((prev) => (prev - 1 + events.length) % events.length)}
                      >
                        ‹
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setCurrentEventIndex((prev) => (prev + 1) % events.length)}
                      >
                        ›
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {currentEventIndex + 1} / {events.length}
                    </span>
                  </div>
                  
                  <div className="relative rounded-xl overflow-hidden shadow-lg">
                    {events[currentEventIndex]?.image_url ? (
                      <img 
                        src={events[currentEventIndex].image_url || ''} 
                        alt={events[currentEventIndex].title}
                        className="w-full h-48 md:h-64 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 md:h-64 bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                    
                    {/* Overlay with event info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(events[currentEventIndex]?.event_date), "dd MMMM yyyy", { locale: id })}</span>
                        {events[currentEventIndex]?.event_time && (
                          <>
                            <span>•</span>
                            <span>{events[currentEventIndex].event_time}</span>
                          </>
                        )}
                      </div>
                      <p className="text-white font-semibold text-sm md:text-base line-clamp-2">
                        {events[currentEventIndex]?.title}
                      </p>
                      {events[currentEventIndex]?.location && (
                        <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {events[currentEventIndex].location}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Dots indicator */}
                  <div className="flex justify-center gap-2 mt-3">
                    {events.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentEventIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentEventIndex ? 'bg-green-500 w-6' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">Tidak ada event mendatang</p>
              )}
            </div>
          </div>
        </div>

        {/* Cluster 1: Administrasi SDM */}
        {filteredAdminSDMItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Administrasi SDM
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredAdminSDMItems.map((item) => (
                <Card
                  key={item.id}
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-blue-500"
                  onClick={() => handleMenuClick(item)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full text-white group-hover:from-indigo-600 group-hover:to-blue-500 transition-all duration-300 group-hover:scale-110">
                        {item.icon}
                      </div>
                    </div>
                    <h3 className="text-base font-bold mb-1 text-gray-800 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Cluster 2: Pengembangan SDM */}
        {filteredPengembanganSDMItems.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              Pengembangan SDM
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredPengembanganSDMItems.map((item) => (
                <Card
                  key={item.id}
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-blue-500"
                  onClick={() => handleMenuClick(item)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full text-white group-hover:from-indigo-600 group-hover:to-blue-500 transition-all duration-300 group-hover:scale-110">
                        {item.icon}
                      </div>
                    </div>
                    <h3 className="text-base font-bold mb-1 text-gray-800 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Floating Voice Assistant */}
      {voiceBotEnabled && <FloatingVoiceAssistant />}
      
      {/* WhatsApp Helpdesk Dialog */}
      <WhatsAppHelpdeskDialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen} />
    </div>
  );
}
