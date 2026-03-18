import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, FileSpreadsheet, Pencil, Trash2 } from "lucide-react";
import RecordAttendanceDialog from "./RecordAttendanceDialog";
import RecordTeamAttendanceDialog from "./RecordTeamAttendanceDialog";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AttendanceResponse {
  id: string;
  event_id: string;
  nama: string;
  nip: string | null;
  latitude: number;
  longitude: number;
  distance_meter: number;
  waktu_absen: string;
  foto_absen: string | null;
  device_info: string | null;
  qr_presensi_events: {
    nama_kegiatan: string;
  };
}

export default function QRAttendanceResponses() {
  const { role } = useAuth();
  const canEdit = role !== "overview";
  const { toast } = useToast();
  const [responses, setResponses] = useState<AttendanceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [events, setEvents] = useState<{ id: string; nama_kegiatan: string }[]>([]);
  const isAdmin = role === "admin";

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<AttendanceResponse | null>(null);
  const [editFormData, setEditFormData] = useState({
    nama: "",
    nip: "",
  });

  useEffect(() => {
    fetchEvents();
    fetchResponses();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("qr_presensi_events")
        .select("id, nama_kegiatan")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchResponses = async () => {
    try {
      let query = supabase
        .from("qr_presensi_responses")
        .select(`
          *,
          qr_presensi_events (
            nama_kegiatan
          )
        `)
        .order("waktu_absen", { ascending: false });

      if (eventFilter !== "all") {
        query = query.eq("event_id", eventFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setResponses(data || []);
    } catch (error: any) {
      toast({
        title: "Gagal memuat data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [eventFilter]);

  const filteredResponses = responses.filter((response) =>
    response.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (response.nip && response.nip.includes(searchTerm))
  );

  // Helper function to parse admin info from device_info
  const parseAdminInfo = (deviceInfo: string | null) => {
    if (!deviceInfo || !deviceInfo.startsWith("ADMIN:")) {
      return null;
    }
    const parts = deviceInfo.split("|||")[0].split(":");
    if (parts.length >= 3) {
      return {
        name: parts[1],
        email: parts[2]
      };
    }
    return null;
  };

  const handleEdit = (response: AttendanceResponse) => {
    setEditingResponse(response);
    setEditFormData({
      nama: response.nama,
      nip: response.nip || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingResponse) return;

    try {
      const { error } = await supabase
        .from("qr_presensi_responses")
        .update({
          nama: editFormData.nama,
          nip: editFormData.nip || null,
        })
        .eq("id", editingResponse.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data absensi berhasil diperbarui",
      });

      setEditDialogOpen(false);
      setEditingResponse(null);
      fetchResponses();
    } catch (error: any) {
      toast({
        title: "Gagal memperbarui data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data absensi ini?")) return;

    try {
      const { error } = await supabase
        .from("qr_presensi_responses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data absensi berhasil dihapus",
      });
      fetchResponses();
    } catch (error: any) {
      toast({
        title: "Gagal menghapus",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    const exportData = filteredResponses.map((response, index) => {
      const adminInfo = parseAdminInfo(response.device_info);
      return {
        "No": index + 1,
        "Nama Kegiatan": response.qr_presensi_events.nama_kegiatan,
        "Nama": response.nama,
        "Email Kemenkeu": response.nip || "-",
        "Role Admin": adminInfo?.name || "-",
        "Email Admin": adminInfo?.email || "-",
        "Waktu Absen": format(new Date(response.waktu_absen), "dd/MM/yyyy HH:mm:ss"),
        "Jarak (meter)": response.distance_meter.toFixed(2),
        "Status": response.distance_meter <= 5 ? "Valid" : "Di luar radius",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Absensi");
    XLSX.writeFile(workbook, `absensi_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);

    toast({
      title: "Berhasil",
      description: "Data absensi berhasil diekspor ke Excel",
    });
  };

  if (loading) {
    return <div className="text-center py-8">Memuat data...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-2 flex-1">
            {canEdit && <RecordAttendanceDialog onSuccess={fetchResponses} />}
            {isAdmin && <RecordTeamAttendanceDialog onSuccess={fetchResponses} />}
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Filter Kegiatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kegiatan</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.nama_kegiatan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1 md:w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari nama atau NIP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {isAdmin && (
              <Button onClick={exportToExcel} className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama Kegiatan</TableHead>
                <TableHead>Nama & Email Kemenkeu</TableHead>
                <TableHead>Role Admin</TableHead>
                <TableHead>Waktu Absen</TableHead>
                <TableHead>Jarak (m)</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-left">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResponses.length === 0 ? (
              <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    Belum ada data absensi
                  </TableCell>
                </TableRow>
              ) : (
                filteredResponses.map((response, index) => {
                  const adminInfo = parseAdminInfo(response.device_info);
                  return (
                    <TableRow key={response.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {response.qr_presensi_events.nama_kegiatan}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{response.nama}</span>
                          <span className="text-sm text-muted-foreground">{response.nip || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {adminInfo ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{adminInfo.name}</span>
                            <span className="text-sm text-muted-foreground">{adminInfo.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(response.waktu_absen), "dd/MM/yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell>{response.distance_meter.toFixed(2)}</TableCell>
                      <TableCell>
                        {response.distance_meter <= 5 ? (
                          <span className="text-green-600 font-medium">✓ Valid</span>
                        ) : (
                          <span className="text-amber-600 font-medium">⚠ Di luar radius</span>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-left">
                          <div className="flex gap-2 justify-start">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(response)}
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(response.id)}
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Total: {filteredResponses.length} data absensi
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data Absensi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_nama">Nama</Label>
              <Input
                id="edit_nama"
                value={editFormData.nama}
                onChange={(e) => setEditFormData({ ...editFormData, nama: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_nip">NIP/Email Kemenkeu</Label>
              <Input
                id="edit_nip"
                value={editFormData.nip}
                onChange={(e) => setEditFormData({ ...editFormData, nip: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditSubmit}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
