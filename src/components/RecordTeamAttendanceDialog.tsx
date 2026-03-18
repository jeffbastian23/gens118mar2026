import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, MapPin, Search } from "lucide-react";
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

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
}

interface RecordTeamAttendanceDialogProps {
  onSuccess: () => void;
}

export default function RecordTeamAttendanceDialog({ onSuccess }: RecordTeamAttendanceDialogProps) {
  const { role, fullName, user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const isAdmin = role === "admin";

  const loadData = async () => {
    try {
      const [eventsRes, profilesRes] = await Promise.all([
        supabase
          .from("qr_presensi_events")
          .select("id, nama_kegiatan, latitude, longitude, radius_meter")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("id, user_id, full_name, email")
          .order("full_name", { ascending: true })
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      
      setEvents(eventsRes.data || []);
      setProfiles(profilesRes.data || []);
    } catch (error: any) {
      toast({
        title: "Gagal memuat data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filter profiles based on search term
  const filteredProfiles = useMemo(() => {
    if (!employeeSearch.trim()) return profiles;
    const searchLower = employeeSearch.toLowerCase();
    return profiles.filter(
      (profile) =>
        (profile.full_name && profile.full_name.toLowerCase().includes(searchLower)) ||
        profile.email.toLowerCase().includes(searchLower)
    );
  }, [profiles, employeeSearch]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleRecordAttendance = async () => {
    if (!selectedEventId || !selectedProfileId) {
      toast({
        title: "Data Belum Lengkap",
        description: "Silakan pilih pegawai dan kegiatan",
        variant: "destructive",
      });
      return;
    }

    const selectedEvent = events.find((e) => e.id === selectedEventId);
    const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
    if (!selectedEvent || !selectedProfile) return;

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

          // Store admin info in device_info for team attendance
          const adminEmail = user?.email || "";
          const adminName = fullName || adminEmail.split("@")[0];
          const deviceInfoWithAdmin = `ADMIN:${adminName}:${adminEmail.split("@")[0]}|||${navigator.userAgent}`;
          
          const { error } = await supabase
            .from("qr_presensi_responses")
            .insert({
              event_id: selectedEventId,
              nama: selectedProfile.full_name || selectedProfile.email,
              nip: selectedProfile.email.split("@")[0] || null,
              latitude: userLat,
              longitude: userLon,
              distance_meter: distance,
              device_info: deviceInfoWithAdmin,
            });

          if (error) throw error;

          toast({
            title: "Berhasil",
            description: `Presensi untuk ${selectedProfile.full_name || selectedProfile.email} berhasil direkam. Jarak: ${distance.toFixed(2)}m`,
          });

          setOpen(false);
          setSelectedEventId("");
          setSelectedProfileId("");
          setEmployeeSearch("");
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

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) {
        loadData();
        setEmployeeSearch("");
        setSelectedProfileId("");
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Rekam Presensi Teman
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rekam Presensi Teman</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="employee_search">Cari Pegawai</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="employee_search"
                placeholder="Ketik nama atau email pegawai..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="profile">Pilih Pegawai</Label>
            <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
              <SelectTrigger id="profile">
                <SelectValue placeholder="Pilih pegawai..." />
              </SelectTrigger>
              <SelectContent>
                {filteredProfiles.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    {employeeSearch ? "Tidak ditemukan pegawai" : "Tidak ada data pegawai"}
                  </div>
                ) : (
                  filteredProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name || profile.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedProfileId && (
            <div>
              <Label>Email</Label>
              <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                {profiles.find(p => p.id === selectedProfileId)?.email || "-"}
              </div>
            </div>
          )}

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
            disabled={loading || gettingLocation || !selectedEventId || !selectedProfileId}
          >
            {gettingLocation ? "Mendapatkan Lokasi..." : loading ? "Menyimpan..." : "Simpan Presensi"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
