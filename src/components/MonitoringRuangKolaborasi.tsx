import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isWithinInterval, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon, Search, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Agenda {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  room_name: string;
  created_by: string;
}

interface MonitoringRuangKolaborasiProps {
  agendas: Agenda[];
  selectedDate: Date;
}

export default function MonitoringRuangKolaborasi({ agendas, selectedDate: initialSelectedDate }: MonitoringRuangKolaborasiProps) {
  const [startDate, setStartDate] = useState<Date>(initialSelectedDate);
  const [endDate, setEndDate] = useState<Date>(initialSelectedDate);
  const [searchTerm, setSearchTerm] = useState("");
  const [uniqueRooms, setUniqueRooms] = useState<string[]>([]);
  
  // Get unique rooms from database bookings
  useEffect(() => {
    const fetchUniqueRooms = async () => {
      const { data, error } = await supabase
        .from("agenda")
        .select("room_name")
        .not("room_name", "eq", "")
        .not("room_name", "is", null);
      
      if (!error && data) {
        const rooms = [...new Set(data.map(d => d.room_name).filter(Boolean))];
        setUniqueRooms(rooms);
      }
    };
    
    fetchUniqueRooms();
  }, [agendas]);

  const dateRangeText = startDate.getTime() === endDate.getTime()
    ? format(startDate, "dd MMM yyyy", { locale: id })
    : `${format(startDate, "dd MMM yyyy", { locale: id })} - ${format(endDate, "dd MMM yyyy", { locale: id })}`;
  
  // Get bookings for date range and room
  const getBookingsForRoom = (roomName: string) => {
    return agendas.filter(a => {
      if (!a.room_name || a.room_name !== roomName) return false;
      const eventDate = parseISO(a.event_date);
      return isWithinInterval(eventDate, { start: startDate, end: endDate });
    });
  };

  // Filter rooms based on search
  const filteredRooms = uniqueRooms.filter(room => {
    if (!searchTerm) return true;
    
    // Search in room name
    if (room.toLowerCase().includes(searchTerm.toLowerCase())) return true;
    
    // Search in event titles
    const roomBookings = getBookingsForRoom(room);
    return roomBookings.some(b => 
      b.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Get room card color based on index
  const getRoomCardColor = (index: number) => {
    const colors = ['kemenkeu-room-blue', 'kemenkeu-room-gold', 'kemenkeu-room-purple', 'kemenkeu-room-orange'];
    return colors[index % colors.length];
  };

  const getRoomHeaderColor = (index: number) => {
    const colors = [
      'bg-gradient-to-r from-blue-500/20 to-blue-400/10 border border-blue-400/30',
      'bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 border border-yellow-400/30',
      'bg-gradient-to-r from-purple-500/20 to-purple-400/10 border border-purple-400/30',
      'bg-gradient-to-r from-orange-500/20 to-orange-400/10 border border-orange-400/30'
    ];
    return colors[index % colors.length];
  };

  const getRoomTitleColor = (index: number) => {
    const colors = ['text-blue-700 dark:text-blue-300', 'text-yellow-700 dark:text-yellow-300', 'text-purple-700 dark:text-purple-300', 'text-orange-700 dark:text-orange-300'];
    return colors[index % colors.length];
  };

  const RoomCard = ({ roomName, index }: { roomName: string; index: number }) => {
    const bookings = getBookingsForRoom(roomName);
    const hasBooking = bookings.length > 0;
    
    return (
      <Card className={`${getRoomCardColor(index)} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}>
        <CardContent className="p-4 space-y-3">
          <div className={`rounded-lg p-3 text-center shadow-sm ${getRoomHeaderColor(index)}`}>
            <h4 className={`font-bold text-sm ${getRoomTitleColor(index)}`}>{roomName}</h4>
          </div>
          <div className="min-h-[80px]">
            {hasBooking ? (
              <div className="space-y-2">
                {bookings.map((booking, idx) => (
                  <div key={idx} className="text-xs p-2 bg-primary/10 rounded border-l-2 border-primary">
                    <p className="font-medium text-primary">{booking.title}</p>
                    <p className="text-muted-foreground">
                      {format(new Date(booking.event_date), "dd MMM yyyy", { locale: id })}
                    </p>
                    {(booking.start_time || booking.end_time) && (
                      <p className="text-muted-foreground">
                        {booking.start_time || '-'} - {booking.end_time || '-'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground italic py-4">Tidak ada kegiatan</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="mt-6 kemenkeu-card-gradient">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <img 
              src="/logo-customs.png" 
              alt="Logo Bea Cukai" 
              className="h-16 object-contain"
            />
            <div>
              <h2 className="text-2xl md:text-3xl font-bold italic text-center md:text-left">
                MONITORING RUANG KOLABORASI
              </h2>
              <p className="text-center md:text-left text-muted-foreground">
                Kantor Wilayah DJBC Jawa Timur I & KPPBC TMP B Sidoarjo
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => window.open("https://lookerstudio.google.com/u/0/reporting/39b2038d-0600-41ba-8331-fdbc11bdb56c/page/p_lflzzdsdkd", "_blank")}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Arsip
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(startDate, "dd MMM yyyy", { locale: id })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      setStartDate(date);
                      if (date > endDate) setEndDate(date);
                    }
                  }}
                  locale={id}
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">-</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(endDate, "dd MMM yyyy", { locale: id })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (date) {
                      setEndDate(date);
                      if (date < startDate) setStartDate(date);
                    }
                  }}
                  locale={id}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari nama kegiatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Rooms Grid */}
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Tidak ada ruangan yang ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRooms.map((room, index) => (
              <RoomCard key={room} roomName={room} index={index} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
