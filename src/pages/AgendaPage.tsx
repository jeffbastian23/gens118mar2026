import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Users, Coffee, LayoutGrid, Pencil, Check, FileSpreadsheet, Upload, Maximize2, Minimize2, Calendar as CalendarList, Building2, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSubMenuAccess } from "@/hooks/useSubMenuAccess";
import * as XLSX from "xlsx";
import { addDays } from "date-fns";
import AbsenManualTab from "@/components/AbsenManualTab";
import BankIssueTab from "@/components/BankIssueTab";
import MonitoringRuangKolaborasi from "@/components/MonitoringRuangKolaborasi";
import RundownTab from "@/components/RundownTab";

interface Agenda {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  room_name: string;
  seating_arrangement: string | null;
  total_attendees: number;
  consumption_needed: number;
  notes: string | null;
  nomor_surat: string | null;
  hal: string | null;
  konfirmasi: string | null;
  created_by: string;
  created_at: string;
  lokasi: string | null;
}

// Helper function to get konfirmasi color
const getKonfirmasiColor = (konfirmasi: string | null): string => {
  switch (konfirmasi?.toLowerCase()) {
    case "hadir":
      return "bg-green-500";
    case "dihadiri/diwakili":
    case "diwakili":
      return "bg-yellow-500";
    case "belum disposisi":
    case "belum dispo":
    default:
      return "bg-red-500";
  }
};

const ROOM_OPTIONS = [
  "Auditorium Bung Tomo - Aula Lt.1",
  "Auditorium Iswahjoedi - Aula Lt.1",
  "Ruang Kolaborasi Gubernur Suryo - Lt.2",
  "Ruang Kolaborasi M.T. Haryono - Lt.2",
  "Ruang Kolaborasi R.P Soeroso - Lt.3",
  "Ruang Kolaborasi Mas Mansoer - Lt.3",
  "Ruang Kolaborasi Harun Thohir - Lt.3",
  "Executive lounge - Lt.2",
  "Ruang Tamu - Lt.2",
  "Auditorium - Lt.1",
  "Lobby - Lt.1",
  "Ruang Podcast - Lt.1",
  "Lapangan Rumput",
  "Quiet Room 1.1",
  "Quiet Room 2.1",
  "Quiet Room 2.2",
  "Quiet Room 3.1",
  "Quiet Room 3.2",
  "Quiet Room 3.3",
  "Quiet Room 3.4",
  "Quiet Room 3.5",
  "Quiet Room 3.6",
  "Quiet Room 3.7",
  "Quiet Room 3.8",
  "Quiet Room 4.1"
];

const UNIT_OPTIONS = [
  "Bagian Umum",
  "Bidang KI",
  "Bidang P2",
  "Bidang Fasilitas",
  "Bidang KC",
  "Sub Unsur Audit",
  "Sub Unsur Keban"
];

const SEATING_OPTIONS = [
  "U-Shape",
  "Theater",
  "Classroom",
  "Boardroom",
  "Banquet"
];

export default function AgendaPage() {
  const { user, fullName, role } = useAuth();
  const { hasSubMenuAccess, isAdmin } = useSubMenuAccess("agenda");
  const canEdit = role !== "overview";
  const canManageAgenda = isAdmin || role === "super" || user?.email?.toLowerCase().includes("kwbcjatim1");
  const canManageBooking = isAdmin || role === "super";
  const [agendas, setAgendas] = useState<Agenda[]>([]);

  // Determine which tabs are accessible
  const tabs = [
    { value: "dashboard", label: "Dashboard", subMenuId: "agenda:dashboard" },
    { value: "agenda", label: "Agenda", subMenuId: "agenda:agenda" },
    { value: "booking", label: "Book Room", subMenuId: "agenda:booking-ruangan" },
    { value: "absen-manual", label: "Absen", subMenuId: "agenda:absen-manual" },
    { value: "issue", label: "Issue", subMenuId: "agenda:issue" },
    { value: "rundown", label: "Rundown", subMenuId: "agenda:rundown" },
  ];

  const accessibleTabs = tabs.filter(tab => hasSubMenuAccess(tab.subMenuId));
  const defaultTab = accessibleTabs.length > 0 ? accessibleTabs[0].value : "dashboard";
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddBookingDialog, setShowAddBookingDialog] = useState(false);
  const [showAddAgendaDialog, setShowAddAgendaDialog] = useState(false);
  const [showEditBookingDialog, setShowEditBookingDialog] = useState(false);
  const [showEditAgendaDialog, setShowEditAgendaDialog] = useState(false);
  
  // WiFi Info Component
  const WifiInfoBadge = () => (
    <div className="absolute top-4 right-4 text-right">
      <p className="text-sm italic text-muted-foreground font-serif">
        <span className="font-medium">Wifi:</span> Kanwil DJBC Jatim I; <span className="font-medium">Passcode:</span> kanwilbcjatim1
      </p>
    </div>
  );
  const [editingItem, setEditingItem] = useState<Agenda | null>(null);
  const [bookingFormData, setBookingFormData] = useState({
    title: "",
    description: "",
    event_date: new Date(),
    start_time: "",
    end_time: "",
    room_name: "",
    seating_arrangement: "",
    total_attendees: 0,
    consumption_needed: 0,
    notes: "",
    perekam: "",
    perekam_custom: "",
    unit_perekam: ""
  });
  const [agendaFormData, setAgendaFormData] = useState({
    title: "",
    description: "",
    event_date: new Date(),
    end_date: undefined as Date | undefined,
    start_time: "",
    end_time: "",
    nomor_surat: "",
    konfirmasi: "",
    tujuan_dispo: [] as string[],
    notes: ""
  });
  const [bookingFilters, setBookingFilters] = useState({
    title: "",
    room_name: "",
    seating_arrangement: "",
    start_date: "",
    end_date: "",
    approved: "",
    selectedRooms: [] as string[]
  });
  const [agendaFilters, setAgendaFilters] = useState({
    title: "",
    nomor_surat: "",
    hal: "",
    konfirmasi: "",
    start_date: "",
    end_date: ""
  });
  const [agendaRoomCustom, setAgendaRoomCustom] = useState("");
  const [dashboardKonfirmasiFilter, setDashboardKonfirmasiFilter] = useState<string>("all");
  const [dashboardSumberFilter, setDashboardSumberFilter] = useState<string>("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [users, setUsers] = useState<{id: string, full_name: string | null, email: string}[]>([]);

  useEffect(() => {
    fetchAgendas();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name", { ascending: true });
    
    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchAgendas = async () => {
    const { data, error } = await supabase
      .from("agenda")
      .select("*")
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      toast.error("Gagal memuat data agenda");
      return;
    }

    setAgendas(data || []);
  };

  const getUserInfo = (perekamName?: string, perekamUnit?: string) => {
    const name = fullName || user?.email || "Unknown";
    const email = user?.email || "";
    const timestamp = format(new Date(), "dd MMM yyyy HH:mm:ss", { locale: id });
    let info = `${name}\n${email}\n${timestamp}`;
    if (perekamName) {
      info += `\nPerekam: ${perekamName}`;
    }
    if (perekamUnit) {
      info += `\nUnit: ${perekamUnit}`;
    }
    return info;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const perekamName = bookingFormData.perekam === "custom" ? bookingFormData.perekam_custom : bookingFormData.perekam;
    const { error } = await supabase.from("agenda").insert({
      title: bookingFormData.title,
      description: bookingFormData.description || null,
      event_date: format(bookingFormData.event_date, "yyyy-MM-dd"),
      start_time: bookingFormData.start_time || null,
      end_time: bookingFormData.end_time || null,
      room_name: bookingFormData.room_name,
      seating_arrangement: bookingFormData.seating_arrangement || null,
      total_attendees: bookingFormData.total_attendees,
      consumption_needed: bookingFormData.consumption_needed,
      notes: `${bookingFormData.notes || ""}\n\n--- Direkam oleh ---\n${getUserInfo(perekamName, bookingFormData.unit_perekam)}`.trim(),
      created_by: user?.email || "Unknown"
    });

    if (error) {
      toast.error("Gagal menyimpan booking ruangan");
      return;
    }

    toast.success("Booking ruangan berhasil ditambahkan");
    setShowAddBookingDialog(false);
    resetBookingForm();
    fetchAgendas();
  };

  const handleAgendaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("agenda").insert({
      title: agendaFormData.title,
      description: agendaFormData.description || null,
      event_date: format(agendaFormData.event_date, "yyyy-MM-dd"),
      start_time: agendaFormData.start_time || null,
      end_time: agendaFormData.end_time || null,
      nomor_surat: agendaFormData.nomor_surat || null,
      konfirmasi: agendaFormData.konfirmasi || null,
      tujuan_dispo: agendaFormData.tujuan_dispo,
      notes: `${agendaFormData.notes || ""}\n\n--- Direkam oleh ---\n${getUserInfo()}`.trim(),
      room_name: "",
      total_attendees: 0,
      consumption_needed: 0,
      created_by: user?.email || "Unknown"
    });

    if (error) {
      toast.error("Gagal menyimpan agenda");
      return;
    }

    toast.success("Agenda berhasil ditambahkan");
    setShowAddAgendaDialog(false);
    resetAgendaForm();
    fetchAgendas();
  };

  const handleEditBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const existingNotes = editingItem.notes || "";
    const updatedNotes = `${bookingFormData.notes || ""}\n\n--- Diubah oleh ---\n${getUserInfo()}`.trim();

    const { error } = await supabase
      .from("agenda")
      .update({
        title: bookingFormData.title,
        description: bookingFormData.description || null,
        event_date: format(bookingFormData.event_date, "yyyy-MM-dd"),
        start_time: bookingFormData.start_time || null,
        end_time: bookingFormData.end_time || null,
        room_name: bookingFormData.room_name,
        seating_arrangement: bookingFormData.seating_arrangement || null,
        total_attendees: bookingFormData.total_attendees,
        consumption_needed: bookingFormData.consumption_needed,
        notes: updatedNotes
      })
      .eq("id", editingItem.id);

    if (error) {
      toast.error("Gagal mengubah booking ruangan");
      return;
    }

    toast.success("Booking ruangan berhasil diubah");
    setShowEditBookingDialog(false);
    setEditingItem(null);
    resetBookingForm();
    fetchAgendas();
  };

  const handleEditAgendaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updatedNotes = `${agendaFormData.notes || ""}\n\n--- Diubah oleh ---\n${getUserInfo()}`.trim();

    const { error } = await supabase
      .from("agenda")
      .update({
        title: agendaFormData.title,
        description: agendaFormData.description || null,
        event_date: format(agendaFormData.event_date, "yyyy-MM-dd"),
        start_time: agendaFormData.start_time || null,
        end_time: agendaFormData.end_time || null,
        nomor_surat: agendaFormData.nomor_surat || null,
        konfirmasi: agendaFormData.konfirmasi || null,
        tujuan_dispo: agendaFormData.tujuan_dispo,
        notes: updatedNotes
      })
      .eq("id", editingItem.id);

    if (error) {
      toast.error("Gagal mengubah agenda");
      return;
    }

    toast.success("Agenda berhasil diubah");
    setShowEditAgendaDialog(false);
    setEditingItem(null);
    resetAgendaForm();
    fetchAgendas();
  };

  const openEditBooking = (booking: Agenda) => {
    setEditingItem(booking);
    setBookingFormData({
      title: booking.title,
      description: booking.description || "",
      event_date: new Date(booking.event_date),
      start_time: booking.start_time || "",
      end_time: booking.end_time || "",
      room_name: booking.room_name,
      seating_arrangement: booking.seating_arrangement || "",
      total_attendees: booking.total_attendees,
      consumption_needed: booking.consumption_needed,
      notes: booking.notes?.split("\n\n--- ")[0] || "",
      perekam: "",
      perekam_custom: "",
      unit_perekam: ""
    });
    setShowEditBookingDialog(true);
  };

  const openEditAgenda = (agenda: Agenda) => {
    setEditingItem(agenda);
    setAgendaFormData({
      title: agenda.title,
      description: agenda.description || "",
      event_date: new Date(agenda.event_date),
      end_date: undefined,
      start_time: agenda.start_time || "",
      end_time: agenda.end_time || "",
      nomor_surat: agenda.nomor_surat || "",
      konfirmasi: agenda.konfirmasi || "",
      tujuan_dispo: (agenda as any).tujuan_dispo || [],
      notes: agenda.notes?.split("\n\n--- ")[0] || ""
    });
    setShowEditAgendaDialog(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("agenda").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus agenda");
      return;
    }

    toast.success("Agenda berhasil dihapus");
    fetchAgendas();
  };

  const resetBookingForm = () => {
    setBookingFormData({
      title: "",
      description: "",
      event_date: new Date(),
      start_time: "",
      end_time: "",
      room_name: "",
      seating_arrangement: "",
      total_attendees: 0,
      consumption_needed: 0,
      notes: "",
      perekam: "",
      perekam_custom: "",
      unit_perekam: ""
    });
  };

  const resetAgendaForm = () => {
    setAgendaFormData({
      title: "",
      description: "",
      event_date: new Date(),
      end_date: undefined,
      start_time: "",
      end_time: "",
      nomor_surat: "",
      konfirmasi: "",
      tujuan_dispo: [],
      notes: ""
    });
  };

  // Helper to filter by konfirmasi and sumber
  const filterByKonfirmasi = (items: Agenda[]) => {
    let filtered = items;
    
    // Filter by sumber
    if (dashboardSumberFilter === "agenda") {
      filtered = filtered.filter(a => !a.room_name || a.room_name.trim() === "");
    } else if (dashboardSumberFilter === "booking") {
      filtered = filtered.filter(a => a.room_name && a.room_name.trim() !== "");
    }
    
    // Filter by konfirmasi
    if (dashboardKonfirmasiFilter === "all") return filtered;
    return filtered.filter(a => {
      const konfirmasi = a.konfirmasi?.toLowerCase() || "";
      if (dashboardKonfirmasiFilter === "hadir") {
        return konfirmasi === "hadir";
      } else if (dashboardKonfirmasiFilter === "diwakili") {
        return konfirmasi.includes("diwakili") || konfirmasi.includes("dihadiri");
      } else if (dashboardKonfirmasiFilter === "belum") {
        return !konfirmasi || konfirmasi.includes("belum") || (!konfirmasi.includes("hadir") && !konfirmasi.includes("diwakili") && !konfirmasi.includes("dihadiri"));
      }
      return true;
    });
  };

  const getAgendasForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return agendas.filter(a => a.event_date === dateStr);
  };

  const todayAgendas = filterByKonfirmasi(getAgendasForDate(new Date()));
  const tomorrowAgendas = filterByKonfirmasi(getAgendasForDate(addDays(new Date(), 1)));
  const selectedDateAgendas = filterByKonfirmasi(getAgendasForDate(selectedDate));

  // Filter bookings (entries with room_name)
  const bookings = agendas.filter(a => a.room_name && a.room_name.trim() !== "");
  const agendaItems = agendas.filter(a => !a.room_name || a.room_name.trim() === "");

  // Calculate statistics
  const agendaStats = {
    total: agendaItems.length,
    hadir: agendaItems.filter(a => a.konfirmasi?.toLowerCase() === "hadir").length,
    diwakili: agendaItems.filter(a => {
      const k = a.konfirmasi?.toLowerCase() || "";
      return k.includes("diwakili") || k.includes("dihadiri");
    }).length,
    belumDispo: agendaItems.filter(a => {
      const k = a.konfirmasi?.toLowerCase() || "";
      return !k || k.includes("belum") || (!k.includes("hadir") && !k.includes("diwakili") && !k.includes("dihadiri"));
    }).length
  };

  const bookingStats = {
    total: bookings.length,
    approved: bookings.filter(b => {
      const k = b.konfirmasi?.toLowerCase() || "";
      return k.includes("disetujui") || k.includes("approved");
    }).length,
    pending: bookings.filter(b => {
      const k = b.konfirmasi?.toLowerCase() || "";
      return !k || (!k.includes("disetujui") && !k.includes("approved"));
    }).length,
    byRoom: ROOM_OPTIONS.map(room => ({
      room,
      count: bookings.filter(b => b.room_name === room).length
    })).filter(r => r.count > 0)
  };

  // Check if booking is approved (has "approved" or "disetujui" in konfirmasi)
  const isBookingApproved = (booking: Agenda): boolean => {
    const konfirmasi = booking.konfirmasi?.toLowerCase() || "";
    return konfirmasi.includes("disetujui") || konfirmasi.includes("approved");
  };

  // Handle approve booking
  const handleApproveBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from("agenda")
      .update({ konfirmasi: "Disetujui" })
      .eq("id", bookingId);

    if (error) {
      toast.error("Gagal menyetujui booking");
      return;
    }

    toast.success("Booking berhasil disetujui");
    fetchAgendas();
  };

  // Apply filters for bookings
  const filteredBookings = bookings.filter(booking => {
    if (bookingFilters.title && !booking.title.toLowerCase().includes(bookingFilters.title.toLowerCase())) return false;
    // If selectedRooms has items, filter by selected rooms
    if (bookingFilters.selectedRooms.length > 0 && !bookingFilters.selectedRooms.includes(booking.room_name)) return false;
    if (bookingFilters.seating_arrangement && booking.seating_arrangement && !booking.seating_arrangement.toLowerCase().includes(bookingFilters.seating_arrangement.toLowerCase())) return false;
    if (bookingFilters.start_date && booking.event_date < bookingFilters.start_date) return false;
    if (bookingFilters.end_date && booking.event_date > bookingFilters.end_date) return false;
    if (bookingFilters.approved === "approved" && !isBookingApproved(booking)) return false;
    if (bookingFilters.approved === "pending" && isBookingApproved(booking)) return false;
    return true;
  });

  // Apply filters for agenda items
  const filteredAgendaItems = agendaItems.filter(item => {
    if (agendaFilters.title && !item.title.toLowerCase().includes(agendaFilters.title.toLowerCase())) return false;
    if (agendaFilters.nomor_surat && item.nomor_surat && !item.nomor_surat.toLowerCase().includes(agendaFilters.nomor_surat.toLowerCase())) return false;
    if (agendaFilters.hal && item.hal && !item.hal.toLowerCase().includes(agendaFilters.hal.toLowerCase())) return false;
    if (agendaFilters.konfirmasi) {
      const k = item.konfirmasi?.toLowerCase() || "";
      if (agendaFilters.konfirmasi === "hadir" && k !== "hadir") return false;
      if (agendaFilters.konfirmasi === "diwakili" && !k.includes("diwakili") && !k.includes("dihadiri")) return false;
      if (agendaFilters.konfirmasi === "belum" && k && !k.includes("belum") && (k.includes("hadir") || k.includes("diwakili") || k.includes("dihadiri"))) return false;
    }
    if (agendaFilters.start_date && item.event_date < agendaFilters.start_date) return false;
    if (agendaFilters.end_date && item.event_date > agendaFilters.end_date) return false;
    return true;
  });

  // Helper to get day name from date
  const getDayName = (dateStr: string) => {
    return format(new Date(dateStr), "EEEE", { locale: id });
  };

  // Extract timestamp info from notes
  const getCreatedInfo = (notes: string | null) => {
    if (!notes) return null;
    const match = notes.match(/--- Direkam oleh ---\n([\s\S]+?)(?:\n\n--- |$)/);
    return match ? match[1].trim() : null;
  };

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Beranda", path: "/" },
        { label: "Agenda" }
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between relative">
          <div>
            <h1 className="text-3xl font-bold">Agenda & Booking Ruangan</h1>
            <p className="text-muted-foreground">Kelola jadwal kegiatan dan booking ruangan rapat</p>
          </div>
          {/* WiFi Info Badge */}
          <WifiInfoBadge />
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="flex flex-wrap justify-start gap-2 h-auto p-2 bg-muted/50">
            {accessibleTabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="px-4 py-2">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {hasSubMenuAccess("agenda:dashboard") && (
          <TabsContent value="dashboard" className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6 overflow-auto' : ''}`}>
            {/* Fullscreen Toggle Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="gap-2"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                {isFullscreen ? "Keluar Fullscreen" : "Fullscreen"}
              </Button>
            </div>

            {/* Show filters only in non-fullscreen mode */}
            {!isFullscreen && (
              <>
                {/* Konfirmasi Filter */}
            <div className="flex items-center gap-4 flex-wrap">
              <Label className="font-medium">Filter Konfirmasi:</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={dashboardKonfirmasiFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDashboardKonfirmasiFilter("all")}
                >
                  Semua
                </Button>
                <Button
                  variant={dashboardKonfirmasiFilter === "hadir" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDashboardKonfirmasiFilter("hadir")}
                  className={dashboardKonfirmasiFilter === "hadir" ? "" : "border-green-500 text-green-600 hover:bg-green-50"}
                >
                  Hadir
                </Button>
                <Button
                  variant={dashboardKonfirmasiFilter === "diwakili" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDashboardKonfirmasiFilter("diwakili")}
                  className={dashboardKonfirmasiFilter === "diwakili" ? "" : "border-yellow-500 text-yellow-600 hover:bg-yellow-50"}
                >
                  Dihadiri/Diwakili
                </Button>
                <Button
                  variant={dashboardKonfirmasiFilter === "belum" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDashboardKonfirmasiFilter("belum")}
                  className={dashboardKonfirmasiFilter === "belum" ? "" : "border-red-500 text-red-600 hover:bg-red-50"}
                >
                  Belum Dispo
                </Button>
              </div>
            </div>

            {/* Sumber Filter */}
            <div className="flex items-center gap-4 flex-wrap">
              <Label className="font-medium">Filter Sumber:</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={dashboardSumberFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDashboardSumberFilter("all")}
                >
                  Semua
                </Button>
                <Button
                  variant={dashboardSumberFilter === "agenda" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDashboardSumberFilter("agenda")}
                  className={dashboardSumberFilter === "agenda" ? "" : "border-purple-500 text-purple-600 hover:bg-purple-50"}
                >
                  Agenda
                </Button>
                <Button
                  variant={dashboardSumberFilter === "booking" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDashboardSumberFilter("booking")}
                  className={dashboardSumberFilter === "booking" ? "" : "border-blue-500 text-blue-600 hover:bg-blue-50"}
                >
                  Book Room
                </Button>
              </div>
            </div>
              </>
            )}

            {/* Agenda Hari Ini & Besok - Combined in one row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Agenda Hari Ini */}
              <Card className="kemenkeu-agenda-today shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold">Agenda Hari Ini</h3>
                    <p className="text-sm opacity-90">{format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}</p>
                  </div>
                  {todayAgendas.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4 border rounded-lg bg-muted/20">Tidak ada agenda hari ini</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {todayAgendas.map((agenda) => (
                        <div key={agenda.id} className={`border-l-4 pl-3 py-2 ${
                          agenda.room_name 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                            : agenda.konfirmasi?.toLowerCase() === "hadir" 
                              ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                              : agenda.konfirmasi?.toLowerCase().includes("diwakili") || agenda.konfirmasi?.toLowerCase().includes("dihadiri")
                                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'
                                : 'border-red-500 bg-red-50 dark:bg-red-950/30'
                        } rounded-r-lg`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-sm">{agenda.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {agenda.start_time && agenda.end_time && `${agenda.start_time} - ${agenda.end_time}`}
                              </p>
                            </div>
                            {canManageAgenda && (
                              <div className="flex gap-0.5">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => agenda.room_name ? openEditBooking(agenda) : openEditAgenda(agenda)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(agenda.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {agenda.konfirmasi && !agenda.room_name && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
                              agenda.konfirmasi.toLowerCase() === "hadir" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                              agenda.konfirmasi.toLowerCase().includes("diwakili") || agenda.konfirmasi.toLowerCase().includes("dihadiri") ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                              "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}>
                              {agenda.konfirmasi}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Agenda Besok */}
              <Card className="kemenkeu-agenda-tomorrow shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold">Agenda Besok</h3>
                    <p className="text-sm opacity-90">{format(addDays(new Date(), 1), "EEEE, dd MMMM yyyy", { locale: id })}</p>
                  </div>
                  {tomorrowAgendas.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4 border rounded-lg bg-muted/20">Tidak ada agenda besok</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {tomorrowAgendas.map((agenda) => (
                        <div key={agenda.id} className={`border-l-4 pl-3 py-2 ${
                          agenda.room_name 
                            ? 'border-blue-500 bg-blue-50' 
                            : agenda.konfirmasi?.toLowerCase() === "hadir" 
                              ? 'border-green-500 bg-green-50' 
                              : agenda.konfirmasi?.toLowerCase().includes("diwakili") || agenda.konfirmasi?.toLowerCase().includes("dihadiri")
                                ? 'border-yellow-500 bg-yellow-50'
                                : 'border-red-500 bg-red-50'
                        } rounded-r-lg`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-sm">{agenda.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {agenda.start_time && agenda.end_time && `${agenda.start_time} - ${agenda.end_time}`}
                              </p>
                            </div>
                            {canManageAgenda && (
                              <div className="flex gap-0.5">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => agenda.room_name ? openEditBooking(agenda) : openEditAgenda(agenda)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(agenda.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {agenda.konfirmasi && !agenda.room_name && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
                              agenda.konfirmasi.toLowerCase() === "hadir" ? "bg-green-100 text-green-800" :
                              agenda.konfirmasi.toLowerCase().includes("diwakili") || agenda.konfirmasi.toLowerCase().includes("dihadiri") ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {agenda.konfirmasi}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="kemenkeu-calendar-gradient shadow-md">
              <CardHeader>
                <CardTitle className="text-white">Kalender Agenda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold">
                      Agenda {format(selectedDate, "dd MMMM yyyy", { locale: id })}
                    </h3>
                    {selectedDateAgendas.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Tidak ada agenda</p>
                    ) : (
                      selectedDateAgendas.map((agenda) => (
                        <div key={agenda.id} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                          <p className="font-medium text-primary">{agenda.title}</p>
                          {agenda.description && (
                            <p className="text-sm text-muted-foreground">{agenda.description}</p>
                          )}
                          <div className="space-y-1 text-sm">
                            {(agenda.start_time || agenda.end_time) && (
                              <p className="flex items-center gap-2">
                                <span className="font-medium text-muted-foreground">Jam:</span>
                                <span>{agenda.start_time || '-'} - {agenda.end_time || '-'}</span>
                              </p>
                            )}
                            {agenda.lokasi && (
                              <p className="flex items-center gap-2">
                                <span className="font-medium text-muted-foreground">Lokasi:</span>
                                <span>{agenda.lokasi}</span>
                              </p>
                            )}
                            {agenda.room_name && (
                              <p className="flex items-center gap-2">
                                <span className="font-medium text-muted-foreground">Ruangan:</span>
                                <span>{agenda.room_name}</span>
                              </p>
                            )}
                            {(agenda as any).tujuan_dispo && (agenda as any).tujuan_dispo.length > 0 && (
                              <p className="flex items-center gap-2">
                                <span className="font-medium text-muted-foreground">Unit Pendamping:</span>
                                <span>{(agenda as any).tujuan_dispo.join(', ')}</span>
                              </p>
                            )}
                            {agenda.total_attendees > 0 && (
                              <p className="flex items-center gap-2">
                                <span className="font-medium text-muted-foreground">Jumlah Peserta:</span>
                                <span>{agenda.total_attendees} orang</span>
                              </p>
                            )}
                            {agenda.consumption_needed > 0 && (
                              <p className="flex items-center gap-2">
                                <span className="font-medium text-muted-foreground">Konsumsi:</span>
                                <span>{agenda.consumption_needed} porsi</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex justify-center items-start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      locale={id}
                      className="rounded-md border pointer-events-auto p-4"
                      classNames={{
                        day_selected: "bg-primary text-primary-foreground font-bold hover:bg-primary focus:bg-primary",
                      }}
                      modifiers={{
                        hasAgenda: (date) => {
                          const dateStr = format(date, "yyyy-MM-dd");
                          return agendas.some(a => a.event_date === dateStr);
                        }
                      }}
                      components={{
                        DayContent: ({ date }) => {
                          const dateStr = format(date, "yyyy-MM-dd");
                          const hasAgenda = agendas.some(a => a.event_date === dateStr);
                          const isSelected = selectedDate && format(selectedDate, "yyyy-MM-dd") === dateStr;
                          return (
                            <div className="relative flex flex-col items-center justify-center w-full h-full">
                              <span className={`${isSelected ? 'font-bold' : ''}`}>{date.getDate()}</span>
                              {hasAgenda && (
                                <div className={`absolute -bottom-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-blue-600'}`} />
                              )}
                            </div>
                          );
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Section */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Agenda Statistics */}
              <Card className="kemenkeu-stat-agenda shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <CalendarList className="w-5 h-5" />
                    Statistik Agenda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 [&>div]:kemenkeu-stat-card [&>div]:transition-all [&>div]:hover:scale-105">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{agendaStats.total}</p>
                      <p className="text-sm text-muted-foreground">Total Agenda</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-2xl font-bold text-green-600">{agendaStats.hadir}</p>
                      <p className="text-sm text-green-700">Hadir</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-2xl font-bold text-yellow-600">{agendaStats.diwakili}</p>
                      <p className="text-sm text-yellow-700">Dihadiri/Diwakili</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-2xl font-bold text-red-600">{agendaStats.belumDispo}</p>
                      <p className="text-sm text-red-700">Belum Dispo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Statistics */}
              <Card className="kemenkeu-stat-booking shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <Building2 className="w-5 h-5" />
                    Statistik Booking Ruangan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 [&>div]:kemenkeu-stat-card [&>div]:transition-all [&>div]:hover:scale-105">
                      <div className="text-center p-3 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{bookingStats.total}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-2xl font-bold text-green-600">{bookingStats.approved}</p>
                        <p className="text-xs text-green-700">Disetujui</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-2xl font-bold text-orange-600">{bookingStats.pending}</p>
                        <p className="text-xs text-orange-700">Pending</p>
                      </div>
                    </div>
                    {bookingStats.byRoom.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Per Ruangan:</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {bookingStats.byRoom.map(({ room, count }) => (
                            <div key={room} className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded">
                              <span className="truncate">{room}</span>
                              <span className="font-semibold text-primary">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monitoring Ruang Kolaborasi */}
            <MonitoringRuangKolaborasi agendas={agendas} selectedDate={selectedDate} />
          </TabsContent>
          )}

          {hasSubMenuAccess("agenda:agenda") && (
          <TabsContent value="agenda" className="space-y-4">
            <Card className="kemenkeu-card-gradient shadow-md">
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <CardTitle>Daftar Agenda</CardTitle>
                    <CardDescription>Semua agenda kegiatan</CardDescription>
                  </div>
                  {canManageAgenda && (
                     <div className="flex gap-2 flex-wrap">
                       <Button onClick={() => setShowAddAgendaDialog(true)} variant="outline">
                         <Plus className="w-4 h-4 mr-2" />
                         Tambah Agenda
                      </Button>
                      <Button variant="outline" onClick={() => {
                        const exportData = filteredAgendaItems.map((a, i) => ({
                          "No": i + 1,
                          "Judul": a.title,
                          "Deskripsi": a.description || "-",
                          "Tanggal": format(new Date(a.event_date), "dd/MM/yyyy"),
                          "Jam Mulai": a.start_time || "-",
                          "Jam Selesai": a.end_time || "-",
                          "Nomor Surat": a.nomor_surat || "-",
                          "Konfirmasi": a.konfirmasi || "-",
                          "Dibuat Oleh": a.created_by
                        }));
                        const ws = XLSX.utils.json_to_sheet(exportData);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Agenda");
                        XLSX.writeFile(wb, `agenda_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
                        toast.success("Data berhasil diekspor");
                      }}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export Excel
                      </Button>
                      <label>
                        <Button variant="outline" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Import Excel
                          </span>
                        </Button>
                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async (evt) => {
                            const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                            const wb = XLSX.read(data, { type: "array" });
                            const ws = wb.Sheets[wb.SheetNames[0]];
                            const jsonData = XLSX.utils.sheet_to_json(ws);
                            let imported = 0;
                            for (const row of jsonData as any[]) {
                              const { error } = await supabase.from("agenda").insert({
                                title: row["Judul"] || "",
                                description: row["Deskripsi"] !== "-" ? row["Deskripsi"] : null,
                                event_date: row["Tanggal"] ? format(new Date(row["Tanggal"].split('/').reverse().join('-')), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
                                start_time: row["Jam Mulai"] !== "-" ? row["Jam Mulai"] : null,
                                end_time: row["Jam Selesai"] !== "-" ? row["Jam Selesai"] : null,
                                nomor_surat: row["Nomor Surat"] !== "-" ? row["Nomor Surat"] : null,
                                konfirmasi: row["Konfirmasi"] !== "-" ? row["Konfirmasi"] : null,
                                room_name: "",
                                total_attendees: 0,
                                consumption_needed: 0,
                                created_by: user?.email || "Unknown"
                              });
                              if (!error) imported++;
                            }
                            toast.success(`${imported} data berhasil diimport`);
                            fetchAgendas();
                          };
                          reader.readAsArrayBuffer(file);
                          e.target.value = "";
                        }} />
                      </label>
                      <Button variant="destructive" onClick={async () => {
                        if (agendas.length === 0) {
                          toast.error("Tidak ada data untuk dihapus");
                          return;
                        }
                        if (!confirm(`Yakin ingin menghapus SEMUA ${agendas.length} data agenda?`)) return;
                        const { error } = await supabase.from("agenda").delete().neq("id", "00000000-0000-0000-0000-000000000000");
                        if (error) {
                          toast.error("Gagal menghapus semua data");
                          return;
                        }
                        toast.success("Semua data berhasil dihapus");
                        fetchAgendas();
                      }}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus Semua
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Agenda Filters */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4 kemenkeu-filter-gradient rounded-lg">
                  <Input
                    placeholder="Cari judul..."
                    value={agendaFilters.title}
                    onChange={(e) => setAgendaFilters({ ...agendaFilters, title: e.target.value })}
                  />
                  <Input
                    placeholder="Nomor dokumen..."
                    value={agendaFilters.nomor_surat}
                    onChange={(e) => setAgendaFilters({ ...agendaFilters, nomor_surat: e.target.value })}
                  />
                  <Input
                    placeholder="Hal..."
                    value={agendaFilters.hal}
                    onChange={(e) => setAgendaFilters({ ...agendaFilters, hal: e.target.value })}
                  />
                  <Select
                    value={agendaFilters.konfirmasi}
                    onValueChange={(v) => setAgendaFilters({ ...agendaFilters, konfirmasi: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter Konfirmasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="hadir">Hadir</SelectItem>
                      <SelectItem value="diwakili">Dihadiri/Diwakili</SelectItem>
                      <SelectItem value="belum">Belum Disposisi</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    placeholder="Tanggal mulai"
                    value={agendaFilters.start_date}
                    onChange={(e) => setAgendaFilters({ ...agendaFilters, start_date: e.target.value })}
                  />
                  <Input
                    type="date"
                    placeholder="Tanggal akhir"
                    value={agendaFilters.end_date}
                    onChange={(e) => setAgendaFilters({ ...agendaFilters, end_date: e.target.value })}
                  />
                </div>

                {filteredAgendaItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada agenda</p>
                ) : (
                  <div className="overflow-y-auto max-h-[70vh]">
                    <table className="w-full border-collapse table-fixed">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-muted">
                          <th className="border p-2 text-left font-medium text-xs w-[8%]">Hari</th>
                          <th className="border p-2 text-left font-medium text-xs w-[10%]">Tanggal</th>
                          <th className="border p-2 text-left font-medium text-xs w-[10%]">Waktu</th>
                          <th className="border p-2 text-left font-medium text-xs w-[20%]">Acara</th>
                          <th className="border p-2 text-left font-medium text-xs w-[14%]">Tempat/Lokasi</th>
                          <th className="border p-2 text-left font-medium text-xs w-[14%]">Dasar Kegiatan</th>
                          <th className="border p-2 text-left font-medium text-xs w-[12%]">Unit Pendamping</th>
                          <th className="border p-2 text-left font-medium text-xs w-[8%]">Konfirmasi</th>
                          {canManageAgenda && <th className="border p-2 text-center font-medium text-xs w-[4%]">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAgendaItems.map((agenda) => (
                          <tr key={agenda.id} className={`border-l-4 hover:bg-muted/30 ${
                            agenda.konfirmasi?.toLowerCase() === "hadir" 
                              ? 'border-l-green-500' 
                              : agenda.konfirmasi?.toLowerCase().includes("diwakili") || agenda.konfirmasi?.toLowerCase().includes("dihadiri")
                                ? 'border-l-yellow-500'
                                : 'border-l-red-500'
                          }`}>
                            <td className="border p-2 text-xs">
                              {getDayName(agenda.event_date)}
                            </td>
                            <td className="border p-2 text-xs whitespace-nowrap">
                              {format(new Date(agenda.event_date), "dd/MM/yyyy")}
                            </td>
                            <td className="border p-2 text-xs whitespace-nowrap">
                              {agenda.start_time && agenda.end_time 
                                ? `${agenda.start_time.slice(0,5)} - ${agenda.end_time.slice(0,5)}` 
                                : agenda.start_time ? agenda.start_time.slice(0,5) : '-'
                              }
                            </td>
                            <td className="border p-2 text-xs">
                              <p className="font-medium truncate" title={agenda.title}>{agenda.title}</p>
                            </td>
                            <td className="border p-2 text-xs">
                              <p className="truncate" title={agenda.nomor_surat || agenda.lokasi || '-'}>
                                {agenda.nomor_surat || agenda.lokasi || '-'}
                              </p>
                            </td>
                            <td className="border p-2 text-xs">
                              <p className="truncate" title={agenda.description || '-'}>
                                {agenda.description || '-'}
                              </p>
                            </td>
                            <td className="border p-2 text-xs">
                              <p className="truncate" title={(agenda as any).tujuan_dispo?.join(', ') || '-'}>
                                {(agenda as any).tujuan_dispo?.length > 0 ? (agenda as any).tujuan_dispo.join(', ') : '-'}
                              </p>
                            </td>
                            <td className="border p-2">
                              {agenda.konfirmasi ? (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                  agenda.konfirmasi.toLowerCase() === "hadir" ? "bg-green-100 text-green-800" :
                                  agenda.konfirmasi.toLowerCase().includes("diwakili") || agenda.konfirmasi.toLowerCase().includes("dihadiri") ? "bg-yellow-100 text-yellow-800" :
                                  "bg-red-100 text-red-800"
                                }`}>
                                  {agenda.konfirmasi}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
                                  Belum Dispo
                                </span>
                              )}
                            </td>
                            {canManageAgenda && (
                              <td className="border p-2">
                                <div className="flex gap-0.5 justify-center">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditAgenda(agenda)}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(agenda.id)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {hasSubMenuAccess("agenda:booking-ruangan") && (
          <TabsContent value="booking" className="space-y-4">
            <Card className="kemenkeu-card-gradient shadow-md">
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <CardTitle>Daftar Booking Ruangan</CardTitle>
                    <CardDescription>Semua agenda booking ruangan</CardDescription>
                  </div>
                  {canManageBooking && (
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={() => setShowAddBookingDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Book Ruangan
                      </Button>
                      <Button variant="outline" onClick={() => {
                        const exportData = filteredBookings.map((b, i) => ({
                          "No": i + 1,
                          "Dasar Kegiatan": b.title,
                          "Nama Kegiatan": b.description || "-",
                          "Tanggal": format(new Date(b.event_date), "dd/MM/yyyy"),
                          "Jam Mulai": b.start_time || "-",
                          "Jam Selesai": b.end_time || "-",
                          "Ruangan": b.room_name,
                          "Tata Letak": b.seating_arrangement || "-",
                          "Jumlah Peserta": b.total_attendees,
                          "Jumlah Konsumsi": b.consumption_needed,
                          "Status": isBookingApproved(b) ? "Disetujui" : "Pending"
                        }));
                        const ws = XLSX.utils.json_to_sheet(exportData);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Booking Ruangan");
                        XLSX.writeFile(wb, `booking_ruangan_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
                        toast.success("Data berhasil diekspor");
                      }}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export Excel
                      </Button>
                      <label>
                        <Button variant="outline" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Import Excel
                          </span>
                        </Button>
                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async (evt) => {
                            const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                            const wb = XLSX.read(data, { type: "array" });
                            const ws = wb.Sheets[wb.SheetNames[0]];
                            const jsonData = XLSX.utils.sheet_to_json(ws);
                            let imported = 0;
                            for (const row of jsonData as any[]) {
                              const { error } = await supabase.from("agenda").insert({
                                title: row["Dasar Kegiatan"] || "",
                                description: row["Nama Kegiatan"] !== "-" ? row["Nama Kegiatan"] : null,
                                event_date: row["Tanggal"] ? format(new Date(row["Tanggal"].split('/').reverse().join('-')), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
                                start_time: row["Jam Mulai"] !== "-" ? row["Jam Mulai"] : null,
                                end_time: row["Jam Selesai"] !== "-" ? row["Jam Selesai"] : null,
                                room_name: row["Ruangan"] || "",
                                seating_arrangement: row["Tata Letak"] !== "-" ? row["Tata Letak"] : null,
                                total_attendees: parseInt(row["Jumlah Peserta"]) || 0,
                                consumption_needed: parseInt(row["Jumlah Konsumsi"]) || 0,
                                created_by: user?.email || "Unknown"
                              });
                              if (!error) imported++;
                            }
                            toast.success(`${imported} data berhasil diimport`);
                            fetchAgendas();
                          };
                          reader.readAsArrayBuffer(file);
                          e.target.value = "";
                        }} />
                      </label>
                      <Button variant="destructive" onClick={async () => {
                        if (bookings.length === 0) {
                          toast.error("Tidak ada data untuk dihapus");
                          return;
                        }
                        if (!confirm(`Yakin ingin menghapus SEMUA ${bookings.length} data booking ruangan?`)) return;
                        const { error } = await supabase.from("agenda").delete().in("id", bookings.map(b => b.id));
                        if (error) {
                          toast.error("Gagal menghapus semua data");
                          return;
                        }
                        toast.success("Semua data booking berhasil dihapus");
                        fetchAgendas();
                      }}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus Semua
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Booking Filters */}
                <div className="space-y-4 p-4 kemenkeu-filter-gradient rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      placeholder="Cari judul..."
                      value={bookingFilters.title}
                      onChange={(e) => setBookingFilters({ ...bookingFilters, title: e.target.value })}
                    />
                    <Input
                      placeholder="Tata letak..."
                      value={bookingFilters.seating_arrangement}
                      onChange={(e) => setBookingFilters({ ...bookingFilters, seating_arrangement: e.target.value })}
                    />
                    <Select
                      value={bookingFilters.approved}
                      onValueChange={(v) => setBookingFilters({ ...bookingFilters, approved: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter Approval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="approved">Sudah Disetujui</SelectItem>
                        <SelectItem value="pending">Belum Disetujui</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      placeholder="Tanggal mulai"
                      value={bookingFilters.start_date}
                      onChange={(e) => setBookingFilters({ ...bookingFilters, start_date: e.target.value })}
                    />
                    <Input
                      type="date"
                      placeholder="Tanggal akhir"
                      value={bookingFilters.end_date}
                      onChange={(e) => setBookingFilters({ ...bookingFilters, end_date: e.target.value })}
                    />
                  </div>
                  
                  {/* Room Checkbox Filter */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Filter Ruangan:</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Cari ruangan..."
                          value={bookingFilters.room_name}
                          onChange={(e) => setBookingFilters({ ...bookingFilters, room_name: e.target.value })}
                          className="w-48 h-8 text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setBookingFilters({ ...bookingFilters, selectedRooms: ROOM_OPTIONS })}
                        >
                          Pilih Semua
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setBookingFilters({ ...bookingFilters, selectedRooms: [] })}
                        >
                          Hapus Semua
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                      {ROOM_OPTIONS
                        .filter(room => room.toLowerCase().includes(bookingFilters.room_name.toLowerCase()))
                        .map((room) => (
                        <div key={room} className="flex items-center space-x-2">
                          <Checkbox
                            id={`room-${room}`}
                            checked={bookingFilters.selectedRooms.includes(room)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setBookingFilters({
                                  ...bookingFilters,
                                  selectedRooms: [...bookingFilters.selectedRooms, room]
                                });
                              } else {
                                setBookingFilters({
                                  ...bookingFilters,
                                  selectedRooms: bookingFilters.selectedRooms.filter(r => r !== room)
                                });
                              }
                            }}
                          />
                          <label
                            htmlFor={`room-${room}`}
                            className="text-xs leading-tight cursor-pointer hover:text-primary"
                          >
                            {room}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredBookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada booking ruangan</p>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Grid View: Dates on left, Rooms on top */}
                    {(() => {
                      // Get unique dates and rooms
                      const uniqueDates = [...new Set(filteredBookings.map(b => b.event_date))].sort();
                      const uniqueRooms = [...new Set(filteredBookings.map(b => b.room_name))].filter(r => r);
                      
                      // Group bookings by date and room
                      const getBookingsForDateAndRoom = (date: string, room: string) => {
                        return filteredBookings.filter(b => b.event_date === date && b.room_name === room);
                      };

                      return (
                        <table className="w-full border-collapse min-w-[800px]">
                          <thead>
                            <tr>
                              <th className="border bg-muted/50 p-2 text-left font-medium min-w-[150px] sticky left-0 bg-background z-10">Tanggal</th>
                              {uniqueRooms.map((room, roomIndex) => {
                                const headerColors = [
                                  'bg-gradient-to-b from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-950/20 text-blue-800 dark:text-blue-200',
                                  'bg-gradient-to-b from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-950/20 text-yellow-800 dark:text-yellow-200',
                                  'bg-gradient-to-b from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-950/20 text-orange-800 dark:text-orange-200',
                                  'bg-gradient-to-b from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-950/20 text-purple-800 dark:text-purple-200'
                                ];
                                return (
                                  <th key={room} className={`border p-2 text-center font-medium text-xs min-w-[180px] ${headerColors[roomIndex % headerColors.length]}`}>
                                    {room}
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {uniqueDates.map((date, dateIndex) => {
                              const rowColors = [
                                'kemenkeu-booking-row-blue',
                                'kemenkeu-booking-row-gold',
                                'kemenkeu-booking-row-orange',
                                'kemenkeu-booking-row-purple'
                              ];
                              return (
                              <tr key={date} className={rowColors[dateIndex % rowColors.length]}>
                                <td className="border p-2 font-medium sticky left-0 bg-background z-10">
                                  {format(new Date(date), "dd MMMM yyyy", { locale: id })}
                                </td>
                                {uniqueRooms.map((room) => {
                                  const cellBookings = getBookingsForDateAndRoom(date, room);
                                  return (
                                    <td key={`${date}-${room}`} className="border p-1 align-top">
                                      {cellBookings.map((booking) => (
                                        <div key={booking.id} className={`p-2 mb-1 rounded text-xs ${
                                          isBookingApproved(booking) ? 'bg-green-100' : 'bg-orange-100'
                                        }`}>
                                          <div className="flex justify-between items-start gap-1">
                                            <div className="flex-1 min-w-0">
                                              <p className="font-semibold truncate">{booking.title}</p>
                                              {booking.start_time && booking.end_time && (
                                                <p className="text-muted-foreground">{booking.start_time} - {booking.end_time}</p>
                                              )}
                                              <p className="text-muted-foreground flex items-center gap-1">
                                                <Users className="w-3 h-3" /> {booking.total_attendees} peserta
                                              </p>
                                              <p className="text-muted-foreground flex items-center gap-1">
                                                <Coffee className="w-3 h-3" /> {booking.consumption_needed} konsumsi
                                              </p>
                                              {booking.seating_arrangement && (
                                                <p className="text-muted-foreground">Tata Letak: {booking.seating_arrangement}</p>
                                              )}
                                              {isBookingApproved(booking) && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-200 text-green-800 mt-1">
                                                  <Check className="w-2.5 h-2.5 mr-0.5" /> Disetujui
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                              {!isBookingApproved(booking) && canManageBooking && (
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100"
                                                  onClick={() => handleApproveBooking(booking.id)}
                                                  title="Setujui"
                                                >
                                                  <Check className="w-3 h-3" />
                                                </Button>
                                              )}
                                              {canManageBooking && (
                                                <>
                                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditBooking(booking)}>
                                                    <Pencil className="w-3 h-3" />
                                                  </Button>
                                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(booking.id)}>
                                                    <Trash2 className="w-3 h-3" />
                                                  </Button>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                          {getCreatedInfo(booking.notes) && (
                                            <div className="text-[10px] text-muted-foreground border-t pt-1 mt-1 whitespace-pre-line">
                                              {getCreatedInfo(booking.notes)}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </td>
                                  );
                                })}
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {hasSubMenuAccess("agenda:absen-manual") && (
          <TabsContent value="absen-manual" className="space-y-4">
            <AbsenManualTab />
          </TabsContent>
          )}

          {hasSubMenuAccess("agenda:issue") && (
          <TabsContent value="issue" className="space-y-4">
            <BankIssueTab />
          </TabsContent>
          )}

          {hasSubMenuAccess("agenda:rundown") && (
          <TabsContent value="rundown" className="space-y-4">
            <RundownTab />
          </TabsContent>
          )}
        </Tabs>

        {/* Add Booking Dialog */}
        <Dialog open={showAddBookingDialog} onOpenChange={setShowAddBookingDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Book Ruangan Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Dasar Kegiatan *</Label>
                <Input
                  value={bookingFormData.title}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Nama Kegiatan</Label>
                <Textarea
                  value={bookingFormData.description}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(bookingFormData.event_date, "dd MMMM yyyy", { locale: id })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={bookingFormData.event_date}
                        onSelect={(date) => date && setBookingFormData({ ...bookingFormData, event_date: date })}
                        locale={id}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Ruangan *</Label>
                  <Select
                    value={ROOM_OPTIONS.includes(bookingFormData.room_name) ? bookingFormData.room_name : bookingFormData.room_name ? "lain-lain" : ""}
                    onValueChange={(v) => {
                      if (v === "lain-lain") {
                        setBookingFormData({ ...bookingFormData, room_name: "" });
                      } else {
                        setBookingFormData({ ...bookingFormData, room_name: v });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih ruangan" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_OPTIONS.map((room) => (
                        <SelectItem key={room} value={room}>{room}</SelectItem>
                      ))}
                      <SelectItem value="lain-lain">Lain-lain</SelectItem>
                    </SelectContent>
                  </Select>
                  {!ROOM_OPTIONS.includes(bookingFormData.room_name) && (bookingFormData.room_name !== "" || !ROOM_OPTIONS.includes(bookingFormData.room_name)) && (
                    <Input
                      placeholder="Masukkan nama ruangan..."
                      value={bookingFormData.room_name}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, room_name: e.target.value })}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jam Mulai</Label>
                  <Input
                    type="time"
                    value={bookingFormData.start_time}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, start_time: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jam Selesai</Label>
                  <Input
                    type="time"
                    value={bookingFormData.end_time}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tata Letak Kursi</Label>
                <Select
                  value={bookingFormData.seating_arrangement}
                  onValueChange={(v) => setBookingFormData({ ...bookingFormData, seating_arrangement: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tata letak" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEATING_OPTIONS.map((seating) => (
                      <SelectItem key={seating} value={seating}>{seating}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jumlah Peserta *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={bookingFormData.total_attendees}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, total_attendees: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jumlah Konsumsi *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={bookingFormData.consumption_needed}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, consumption_needed: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Catatan Tambahan</Label>
                <Textarea
                  value={bookingFormData.notes}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Perekam</Label>
                  <Select
                    value={bookingFormData.perekam}
                    onValueChange={(v) => setBookingFormData({ ...bookingFormData, perekam: v, perekam_custom: v === "custom" ? bookingFormData.perekam_custom : "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih perekam" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.full_name || u.email}>{u.full_name || u.email}</SelectItem>
                      ))}
                      <SelectItem value="custom">Lainnya (input manual)</SelectItem>
                    </SelectContent>
                  </Select>
                  {bookingFormData.perekam === "custom" && (
                    <Input
                      placeholder="Masukkan nama perekam"
                      value={bookingFormData.perekam_custom}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, perekam_custom: e.target.value })}
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Unit Mana</Label>
                  <Select
                    value={bookingFormData.unit_perekam}
                    onValueChange={(v) => setBookingFormData({ ...bookingFormData, unit_perekam: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Simpan Booking</Button>
                <Button type="button" variant="outline" onClick={() => { setShowAddBookingDialog(false); resetBookingForm(); }}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Booking Dialog */}
        <Dialog open={showEditBookingDialog} onOpenChange={(open) => { if (!open) { setEditingItem(null); resetBookingForm(); } setShowEditBookingDialog(open); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Booking Ruangan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditBookingSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Dasar Kegiatan *</Label>
                <Input
                  value={bookingFormData.title}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Nama Kegiatan</Label>
                <Textarea
                  value={bookingFormData.description}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(bookingFormData.event_date, "dd MMMM yyyy", { locale: id })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={bookingFormData.event_date}
                        onSelect={(date) => date && setBookingFormData({ ...bookingFormData, event_date: date })}
                        locale={id}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Ruangan *</Label>
                  <Select
                    value={ROOM_OPTIONS.includes(bookingFormData.room_name) ? bookingFormData.room_name : bookingFormData.room_name ? "lain-lain" : ""}
                    onValueChange={(v) => {
                      if (v === "lain-lain") {
                        setBookingFormData({ ...bookingFormData, room_name: "" });
                      } else {
                        setBookingFormData({ ...bookingFormData, room_name: v });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih ruangan" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_OPTIONS.map((room) => (
                        <SelectItem key={room} value={room}>{room}</SelectItem>
                      ))}
                      <SelectItem value="lain-lain">Lain-lain</SelectItem>
                    </SelectContent>
                  </Select>
                  {!ROOM_OPTIONS.includes(bookingFormData.room_name) && (bookingFormData.room_name !== "" || !ROOM_OPTIONS.includes(bookingFormData.room_name)) && (
                    <Input
                      placeholder="Masukkan nama ruangan..."
                      value={bookingFormData.room_name}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, room_name: e.target.value })}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jam Mulai</Label>
                  <Input
                    type="time"
                    value={bookingFormData.start_time}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, start_time: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jam Selesai</Label>
                  <Input
                    type="time"
                    value={bookingFormData.end_time}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tata Letak Kursi</Label>
                <Select
                  value={bookingFormData.seating_arrangement}
                  onValueChange={(v) => setBookingFormData({ ...bookingFormData, seating_arrangement: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tata letak" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEATING_OPTIONS.map((seating) => (
                      <SelectItem key={seating} value={seating}>{seating}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jumlah Peserta *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={bookingFormData.total_attendees}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, total_attendees: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jumlah Konsumsi *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={bookingFormData.consumption_needed}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, consumption_needed: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Catatan Tambahan</Label>
                <Textarea
                  value={bookingFormData.notes}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Perekam</Label>
                  <Select
                    value={bookingFormData.perekam}
                    onValueChange={(v) => setBookingFormData({ ...bookingFormData, perekam: v, perekam_custom: v === "custom" ? bookingFormData.perekam_custom : "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih perekam" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.full_name || u.email}>{u.full_name || u.email}</SelectItem>
                      ))}
                      <SelectItem value="custom">Lainnya (input manual)</SelectItem>
                    </SelectContent>
                  </Select>
                  {bookingFormData.perekam === "custom" && (
                    <Input
                      placeholder="Masukkan nama perekam"
                      value={bookingFormData.perekam_custom}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, perekam_custom: e.target.value })}
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Unit Mana</Label>
                  <Select
                    value={bookingFormData.unit_perekam}
                    onValueChange={(v) => setBookingFormData({ ...bookingFormData, unit_perekam: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Simpan Perubahan</Button>
                <Button type="button" variant="outline" onClick={() => { setShowEditBookingDialog(false); setEditingItem(null); resetBookingForm(); }}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Agenda Dialog */}
        <Dialog open={showAddAgendaDialog} onOpenChange={setShowAddAgendaDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Agenda Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAgendaSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Judul Agenda *</Label>
                <Input
                  value={agendaFormData.title}
                  onChange={(e) => setAgendaFormData({ ...agendaFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Dasar Kegiatan</Label>
                <Textarea
                  value={agendaFormData.description}
                  onChange={(e) => setAgendaFormData({ ...agendaFormData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal Mulai *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(agendaFormData.event_date, "dd MMMM yyyy", { locale: id })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="pointer-events-auto">
                      <Calendar
                        mode="single"
                        selected={agendaFormData.event_date}
                        onSelect={(date) => date && setAgendaFormData({ ...agendaFormData, event_date: date })}
                        locale={id}
                        className="pointer-events-auto"
                        disabled={(date) => date < startOfDay(new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Selesai</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {agendaFormData.end_date ? format(agendaFormData.end_date, "dd MMMM yyyy", { locale: id }) : "Pilih tanggal selesai"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="pointer-events-auto">
                      <Calendar
                        mode="single"
                        selected={agendaFormData.end_date}
                        onSelect={(date) => setAgendaFormData({ ...agendaFormData, end_date: date })}
                        locale={id}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ruangan</Label>
                  <Select
                    value={ROOM_OPTIONS.includes(agendaFormData.nomor_surat) ? agendaFormData.nomor_surat : (agendaRoomCustom !== "" || agendaFormData.nomor_surat !== "") ? "lain-lain" : ""}
                    onValueChange={(v) => {
                      if (v === "lain-lain") {
                        setAgendaRoomCustom("custom");
                        setAgendaFormData({ ...agendaFormData, nomor_surat: "" });
                      } else {
                        setAgendaFormData({ ...agendaFormData, nomor_surat: v });
                        setAgendaRoomCustom("");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih ruangan" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_OPTIONS.map((room) => (
                        <SelectItem key={room} value={room}>{room}</SelectItem>
                      ))}
                      <SelectItem value="lain-lain">Lain-Lain</SelectItem>
                    </SelectContent>
                  </Select>
                  {agendaRoomCustom !== "" && (
                    <Input
                      placeholder="Masukkan nama ruangan..."
                      value={agendaFormData.nomor_surat}
                      onChange={(e) => setAgendaFormData({ ...agendaFormData, nomor_surat: e.target.value })}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jam Mulai</Label>
                  <Input
                    type="time"
                    value={agendaFormData.start_time}
                    onChange={(e) => setAgendaFormData({ ...agendaFormData, start_time: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jam Selesai</Label>
                  <Input
                    type="time"
                    value={agendaFormData.end_time}
                    onChange={(e) => setAgendaFormData({ ...agendaFormData, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Konfirmasi / Petunjuk *</Label>
                <Select
                  value={agendaFormData.konfirmasi}
                  onValueChange={(v) => setAgendaFormData({ ...agendaFormData, konfirmasi: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status konfirmasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hadir">Hadir</SelectItem>
                    <SelectItem value="Dihadiri/Diwakili">Dihadiri/Diwakili</SelectItem>
                    <SelectItem value="Belum Disposisi">Belum Disposisi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Unit Pendamping</Label>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                  {UNIT_OPTIONS.map((unit) => (
                    <div key={unit} className="flex items-center space-x-2">
                      <Checkbox
                        id={`unit-${unit}`}
                        checked={agendaFormData.tujuan_dispo.includes(unit)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAgendaFormData({ ...agendaFormData, tujuan_dispo: [...agendaFormData.tujuan_dispo, unit] });
                          } else {
                            setAgendaFormData({ ...agendaFormData, tujuan_dispo: agendaFormData.tujuan_dispo.filter(u => u !== unit) });
                          }
                        }}
                      />
                      <label htmlFor={`unit-${unit}`} className="text-sm cursor-pointer">{unit}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Catatan Tambahan</Label>
                <Textarea
                  value={agendaFormData.notes}
                  onChange={(e) => setAgendaFormData({ ...agendaFormData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Simpan Agenda</Button>
                <Button type="button" variant="outline" onClick={() => { setShowAddAgendaDialog(false); resetAgendaForm(); }}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Agenda Dialog */}
        <Dialog open={showEditAgendaDialog} onOpenChange={(open) => { if (!open) { setEditingItem(null); resetAgendaForm(); } setShowEditAgendaDialog(open); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Agenda</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditAgendaSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Judul Agenda *</Label>
                <Input
                  value={agendaFormData.title}
                  onChange={(e) => setAgendaFormData({ ...agendaFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Dasar Kegiatan</Label>
                <Textarea
                  value={agendaFormData.description}
                  onChange={(e) => setAgendaFormData({ ...agendaFormData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(agendaFormData.event_date, "dd MMMM yyyy", { locale: id })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={agendaFormData.event_date}
                        onSelect={(date) => date && setAgendaFormData({ ...agendaFormData, event_date: date })}
                        locale={id}
                        disabled={(date) => date < startOfDay(new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Ruangan</Label>
                  <Select
                    value={ROOM_OPTIONS.includes(agendaFormData.nomor_surat) ? agendaFormData.nomor_surat : agendaFormData.nomor_surat ? "lain-lain" : ""}
                    onValueChange={(v) => {
                      if (v === "lain-lain") {
                        setAgendaFormData({ ...agendaFormData, nomor_surat: "" });
                      } else {
                        setAgendaFormData({ ...agendaFormData, nomor_surat: v });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih ruangan" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_OPTIONS.map((room) => (
                        <SelectItem key={room} value={room}>{room}</SelectItem>
                      ))}
                      <SelectItem value="lain-lain">Lain-Lain</SelectItem>
                    </SelectContent>
                  </Select>
                  {!ROOM_OPTIONS.includes(agendaFormData.nomor_surat) && (
                    <Input
                      placeholder="Masukkan nama ruangan..."
                      value={agendaFormData.nomor_surat}
                      onChange={(e) => setAgendaFormData({ ...agendaFormData, nomor_surat: e.target.value })}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jam Mulai</Label>
                  <Input
                    type="time"
                    value={agendaFormData.start_time}
                    onChange={(e) => setAgendaFormData({ ...agendaFormData, start_time: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jam Selesai</Label>
                  <Input
                    type="time"
                    value={agendaFormData.end_time}
                    onChange={(e) => setAgendaFormData({ ...agendaFormData, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Konfirmasi / Petunjuk *</Label>
                <Select
                  value={agendaFormData.konfirmasi}
                  onValueChange={(v) => setAgendaFormData({ ...agendaFormData, konfirmasi: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status konfirmasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hadir">Hadir</SelectItem>
                    <SelectItem value="Dihadiri/Diwakili">Dihadiri/Diwakili</SelectItem>
                    <SelectItem value="Belum Disposisi">Belum Disposisi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Unit Pendamping</Label>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                  {UNIT_OPTIONS.map((unit) => (
                    <div key={unit} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-unit-${unit}`}
                        checked={agendaFormData.tujuan_dispo.includes(unit)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAgendaFormData({ ...agendaFormData, tujuan_dispo: [...agendaFormData.tujuan_dispo, unit] });
                          } else {
                            setAgendaFormData({ ...agendaFormData, tujuan_dispo: agendaFormData.tujuan_dispo.filter(u => u !== unit) });
                          }
                        }}
                      />
                      <label htmlFor={`edit-unit-${unit}`} className="text-sm cursor-pointer">{unit}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Catatan Tambahan</Label>
                <Textarea
                  value={agendaFormData.notes}
                  onChange={(e) => setAgendaFormData({ ...agendaFormData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Simpan Perubahan</Button>
                <Button type="button" variant="outline" onClick={() => { setShowEditAgendaDialog(false); setEditingItem(null); resetAgendaForm(); }}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
