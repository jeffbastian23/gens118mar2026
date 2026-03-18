import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Home, Calendar, MapPin, Headphones } from "lucide-react";
import { useAuth, isAdminRole } from "@/hooks/useAuth";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import NotificationBell from "@/components/NotificationBell";
import FloatingVoiceAssistant from "@/components/FloatingVoiceAssistant";
import HeaderWorkButton from "@/components/HeaderWorkButton";
import Breadcrumb from "./Breadcrumb";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useState, useEffect } from "react";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface AppLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  showVoiceBot?: boolean;
}

export default function AppLayout({ 
  children, 
  breadcrumbs = [],
  showVoiceBot = true 
}: AppLayoutProps) {
  const { role, fullName, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [location, setLocation] = useState("Memuat lokasi...");
  const [weather, setWeather] = useState<{ temp: number; condition: string; humidity: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Get user's location using geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Use reverse geocoding to get location name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();
            
            // Extract city and region
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Lokasi Tidak Diketahui";
            const region = data.address?.state || "";
            const locationText = region ? `${city}, ${region}` : city;
            
            setLocation(locationText);

            // Fetch weather data (OpenMeteo API - no key needed)
            try {
              const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FJakarta`
              );
              const weatherData = await weatherResponse.json();
              
              // Map weather codes to conditions
              const weatherCode = weatherData.current?.weather_code || 0;
              let condition = "Cerah";
              if (weatherCode >= 51 && weatherCode <= 67) condition = "Hujan";
              else if (weatherCode >= 71 && weatherCode <= 77) condition = "Salju";
              else if (weatherCode >= 80 && weatherCode <= 82) condition = "Hujan";
              else if (weatherCode >= 1 && weatherCode <= 3) condition = "Berawan";
              else if (weatherCode >= 45 && weatherCode <= 48) condition = "Kabut";
              
              setWeather({
                temp: Math.round(weatherData.current?.temperature_2m || 26),
                condition: condition,
                humidity: weatherData.current?.relative_humidity_2m || 0
              });
            } catch (error) {
              console.error("Error fetching weather:", error);
            }
          } catch (error) {
            console.error("Error fetching location:", error);
            setLocation("Surabaya, Jawa Timur");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocation("Surabaya, Jawa Timur");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocation("Surabaya, Jawa Timur");
    }
  }, []);

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
                <h1 className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold leading-tight">Sistem Informasi SDM</h1>
                <p className="text-[10px] sm:text-xs md:text-sm text-blue-100">Kanwil DJBC Jawa Timur I</p>
              </div>
            </div>
            
            {/* Right side: Date/Location/Weather + Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Date and Location - Hidden on mobile */}
              <div className="hidden lg:flex flex-col gap-1 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Calendar className="w-4 h-4" />
                  <p className="text-sm font-medium">
                    {format(currentDate, "EEEE, dd MMMM yyyy HH:mm:ss", { locale: id })}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <MapPin className="w-4 h-4" />
                  <p className="text-sm font-medium">{location}</p>
                  {weather && (
                    <>
                      <span className="mx-1">•</span>
                      <p className="text-sm font-medium">{weather.temp}°C • {weather.condition} • Hujan {weather.humidity}%</p>
                    </>
                  )}
                </div>
              </div>
              
              {/* Separator & Navigation */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-2">
                  <div className="border-l border-white/30 h-10"></div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/")}
                    className="text-white hover:bg-white/20 gap-1 text-xs sm:text-sm"
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden xl:inline">Beranda</span>
                  </Button>
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
                </div>
                
                {/* Mobile Navigation Icons */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate("/")}
                  className="lg:hidden text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9"
                  title="Beranda"
                >
                  <Home className="h-4 w-4" />
                </Button>
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

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 md:py-6">
        {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}
        {children}
      </div>

      {/* Floating Buttons */}
      {showVoiceBot && <FloatingVoiceAssistant />}
    </div>
  );
}
