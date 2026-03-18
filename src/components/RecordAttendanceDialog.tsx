import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Event {
  id: string;
  nama_kegiatan: string;
  latitude: number;
  longitude: number;
  radius_meter: number;
}

interface RecordAttendanceDialogProps {
  onSuccess: () => void;
}

export default function RecordAttendanceDialog({ onSuccess }: RecordAttendanceDialogProps) {
  const { user, fullName } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("qr_presensi_events")
        .select("id, nama_kegiatan, latitude, longitude, radius_meter")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Gagal memuat kegiatan",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const handleRecordAttendance = async () => {
    if (!selectedEventId) {
      toast({
        title: "Pilih Kegiatan",
        description: "Silakan pilih kegiatan terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const selectedEvent = events.find((e) => e.id === selectedEventId);
    if (!selectedEvent) return;

    setGettingLocation(true);

    if (!navigator.geolocation) {
      toast({
        title: "Geolocation tidak didukung",
        description: "Browser Anda tidak mendukung geolocation",
        variant: "destructive",
      });
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setLoading(true);
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;

          const distance = calculateDistance(
            selectedEvent.latitude,
            selectedEvent.longitude,
            userLat,
            userLon
          );

          const { error } = await supabase
            .from("qr_presensi_responses")
            .insert({
              event_id: selectedEventId,
              nama: fullName || user?.email || "Pengguna",
              nip: user?.email?.split("@")[0] || null,
              latitude: userLat,
              longitude: userLon,
              distance_meter: distance,
              device_info: navigator.userAgent,
            });

          if (error) throw error;

          toast({
            title: "Berhasil",
            description: `Presensi berhasil direkam. Jarak: ${distance.toFixed(2)}m`,
          });

          setOpen(false);
          setSelectedEventId("");
          onSuccess();
        } catch (error: any) {
          toast({
            title: "Gagal merekam presensi",
            description: error.message,
            variant: "destructive",
          });
        } finally {
          setLoading(false);
          setGettingLocation(false);
        }
      },
      (error) => {
        toast({
          title: "Gagal mendapatkan lokasi",
          description: error.message,
          variant: "destructive",
        });
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) loadEvents();
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Rekam Presensi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rekam Presensi Manual</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nama Lengkap</Label>
            <div className="mt-1 p-2 bg-muted rounded-md text-sm">
              {fullName || user?.email || "Pengguna"}
            </div>
          </div>
          
          <div>
            <Label>Email</Label>
            <div className="mt-1 p-2 bg-muted rounded-md text-sm">
              {user?.email || "-"}
            </div>
          </div>

          <div>
            <Label htmlFor="event">Pilih Kegiatan</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger id="event">
                <SelectValue placeholder="Pilih kegiatan..." />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.nama_kegiatan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex gap-2 text-sm text-blue-800">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Sistem akan otomatis:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Mencatat waktu presensi saat ini</li>
                  <li>• Mendeteksi lokasi Anda saat ini</li>
                  <li>• Menghitung jarak dari titik kegiatan</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleRecordAttendance} 
            className="w-full"
            disabled={loading || gettingLocation || !selectedEventId}
          >
            {gettingLocation ? "Mendapatkan Lokasi..." : loading ? "Menyimpan..." : "Simpan Presensi"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
