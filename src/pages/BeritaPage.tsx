import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, isAdminRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, LogOut, ExternalLink, Settings, Calendar, MapPin, Clock, Headphones, Radio, Quote, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import NotificationBell from "@/components/NotificationBell";
import HeaderWorkButton from "@/components/HeaderWorkButton";
import NewsManagement from "@/components/NewsManagement";
import EventManagement from "@/components/EventManagement";
import MarketTicker from "@/components/MarketTicker";
import OnAirTab from "@/components/OnAirTab";
import QuoteManagement from "@/components/QuoteManagement";
import BackgroundManagement from "@/components/BackgroundManagement";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface News {
  id: string;
  title: string;
  url: string | null;
  source: string | null;
  is_active: boolean | null;
  published_at: string | null;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  image_url: string | null;
  is_active: boolean | null;
}

export default function BeritaPage() {
  const { user, fullName, loading: authLoading, signOut, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [news, setNews] = useState<News[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  
  // Get tab from URL parameter
  const tabFromUrl = searchParams.get('tab');
  const defaultTab = tabFromUrl === 'events' ? 'events' : (role === 'admin' ? 'view' : 'berita');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("is_active", true)
        .order("published_at", { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error: any) {
      console.error("Error fetching news:", error);
      toast.error("Gagal memuat data berita");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      // Fetch all active events without date filter to show all existing events
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: false });

      if (error) throw error;
      setEvents((data as Event[]) || []);
    } catch (error: any) {
      console.error("Error fetching events:", error);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    fetchEvents();
  }, []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
                <h1 className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold leading-tight">Berita</h1>
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

      {/* Market Ticker - IHSG & Gold Price */}
      <MarketTicker />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {isAdminRole(role) ? (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full max-w-5xl grid-cols-7 mb-6">
              <TabsTrigger value="view">Lihat Berita</TabsTrigger>
              <TabsTrigger value="events">Lihat Event</TabsTrigger>
              <TabsTrigger value="on-air" className="gap-1">
                <Radio className="h-4 w-4" />
                On Air
              </TabsTrigger>
              <TabsTrigger value="manage">
                <Settings className="h-4 w-4 mr-2" />
                Kelola Berita
              </TabsTrigger>
              <TabsTrigger value="manage-events">
                <Calendar className="h-4 w-4 mr-2" />
                Kelola Event
              </TabsTrigger>
              <TabsTrigger value="quote">
                <Quote className="h-4 w-4 mr-2" />
                Quote
              </TabsTrigger>
              <TabsTrigger value="background">
                <Image className="h-4 w-4 mr-2" />
                Background
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="view">
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Berita Terkini</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center text-muted-foreground">Memuat berita...</p>
                  ) : news.length === 0 ? (
                    <p className="text-center text-muted-foreground">Belum ada berita tersedia</p>
                  ) : (
                    <div className="space-y-4">
                      {news.map((item) => (
                        <Card key={item.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                  {item.source && (
                                    <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                                      {item.source}
                                    </span>
                                  )}
                                  {item.published_at && (
                                    <span>
                                      {format(new Date(item.published_at), "dd MMMM yyyy", { locale: id })}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {item.url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(item.url!, "_blank")}
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Baca Selengkapnya
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Event Mendatang</CardTitle>
                </CardHeader>
                <CardContent>
                  {eventsLoading ? (
                    <p className="text-center text-muted-foreground">Memuat event...</p>
                  ) : events.length === 0 ? (
                    <p className="text-center text-muted-foreground">Tidak ada event mendatang</p>
                  ) : (
                    <div className="space-y-4">
                      {events.map((event) => (
                        <Card key={event.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                              )}
                              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded">
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(event.event_date), "dd MMMM yyyy", { locale: id })}
                                </span>
                                {event.event_time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {event.event_time}
                                  </span>
                                )}
                                {event.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {event.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="manage">
              <NewsManagement />
            </TabsContent>

            <TabsContent value="manage-events">
              <EventManagement />
            </TabsContent>

            <TabsContent value="on-air">
              <OnAirTab />
            </TabsContent>

            <TabsContent value="quote">
              <QuoteManagement />
            </TabsContent>

            <TabsContent value="background">
              <BackgroundManagement />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3 mb-6">
              <TabsTrigger value="berita">Berita</TabsTrigger>
              <TabsTrigger value="events">Event</TabsTrigger>
              <TabsTrigger value="on-air" className="gap-1">
                <Radio className="h-4 w-4" />
                On Air
              </TabsTrigger>
            </TabsList>

            <TabsContent value="berita">
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Berita Terkini</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center text-muted-foreground">Memuat berita...</p>
                  ) : news.length === 0 ? (
                    <p className="text-center text-muted-foreground">Belum ada berita tersedia</p>
                  ) : (
                    <div className="space-y-4">
                      {news.map((item) => (
                        <Card key={item.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                  {item.source && (
                                    <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                                      {item.source}
                                    </span>
                                  )}
                                  {item.published_at && (
                                    <span>
                                      {format(new Date(item.published_at), "dd MMMM yyyy", { locale: id })}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {item.url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(item.url!, "_blank")}
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Baca Selengkapnya
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Event Mendatang</CardTitle>
                </CardHeader>
                <CardContent>
                  {eventsLoading ? (
                    <p className="text-center text-muted-foreground">Memuat event...</p>
                  ) : events.length === 0 ? (
                    <p className="text-center text-muted-foreground">Tidak ada event mendatang</p>
                  ) : (
                    <div className="space-y-4">
                      {events.map((event) => (
                        <Card key={event.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                              )}
                              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded">
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(event.event_date), "dd MMMM yyyy", { locale: id })}
                                </span>
                                {event.event_time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {event.event_time}
                                  </span>
                                )}
                                {event.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {event.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="on-air">
              <OnAirTab />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
