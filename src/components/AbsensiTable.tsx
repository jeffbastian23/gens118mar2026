import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Upload, Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import AbsensiDialog from "./AbsensiDialog";
import ImportAbsensiDialog from "./ImportAbsensiDialog";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { useAuth } from "@/hooks/useAuth";

export default function AbsensiTable() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedAbsensi, setSelectedAbsensi] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10000);
  const queryClient = useQueryClient();

  const { data: absensiData, isLoading } = useQuery({
    queryKey: ["absensi"],
    queryFn: async () => {
      const pageSize = 1000;
      let from = 0;
      let all: any[] = [];
      while (true) {
        const { data, error } = await supabase
          .from("absensi")
          .select("*")
          .order("tanggal", { ascending: false })
          .order("nama", { ascending: true })
          .range(from, from + pageSize - 1);

        if (error) throw error;
        all = all.concat(data || []);
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      return all;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("absensi").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absensi"] });
      toast.success("Data absensi berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(`Gagal menghapus data: ${error.message}`);
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      // Delete all records from absensi table
      const { error } = await supabase
        .from("absensi")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absensi"] });
      toast.success("Semua data absensi berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(`Gagal menghapus semua data: ${error.message}`);
    },
  });

  const handleEdit = (absensi: any) => {
    setSelectedAbsensi(absensi);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAdd = () => {
    setSelectedAbsensi(null);
    setDialogOpen(true);
  };

  const handleExportExcel = () => {
    if (!absensiData || absensiData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    // Prepare data for export
    const exportData = absensiData.map((item, index) => ({
      No: index + 1,
      Nama: item.nama,
      NIP: item.nip,
      Tanggal: item.tanggal ? format(new Date(item.tanggal), "dd/MM/yyyy") : "",
      "Jam Masuk": item.jam_masuk || "",
      "Jam Pulang": item.jam_pulang || "",
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Absensi");

    // Generate filename with current date
    const filename = `Rekap_Absensi_${format(new Date(), "ddMMyyyy_HHmmss")}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
    toast.success("Data berhasil diekspor ke Excel");
  };

  const handleExportIncomplete = () => {
    if (!absensiData || absensiData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    // Filter incomplete records using the same logic as dashboard
    const incompleteRecords = absensiData.filter((item) => {
      // Missing jam_masuk or jam_pulang
      if (!item.jam_masuk || !item.jam_pulang) {
        return true;
      }

      // Parse times
      const jamMasuk = item.jam_masuk.split(':');
      const jamPulang = item.jam_pulang.split(':');
      const masukMinutes = parseInt(jamMasuk[0]) * 60 + parseInt(jamMasuk[1]);
      const pulangMinutes = parseInt(jamPulang[0]) * 60 + parseInt(jamPulang[1]);

      // Standard work hours: 07:30 - 17:00
      const standardMasuk = 7 * 60 + 30; // 07:30 = 450 minutes
      const standardPulang = 17 * 60; // 17:00 = 1020 minutes

      // Calculate allowed range (90 minutes tolerance)
      const earliestMasuk = standardMasuk - 90; // 06:00
      const latestMasuk = standardMasuk + 90; // 09:00

      // Check if masuk is within allowed range
      if (masukMinutes < earliestMasuk || masukMinutes > latestMasuk) {
        return true;
      }

      // Calculate expected pulang based on actual masuk
      let expectedPulang = standardPulang;
      
      if (masukMinutes < standardMasuk) {
        // Came early: can leave early proportionally
        const earlyMinutes = standardMasuk - masukMinutes;
        expectedPulang = standardPulang - earlyMinutes;
      } else if (masukMinutes > standardMasuk) {
        // Came late: must stay late proportionally
        const lateMinutes = masukMinutes - standardMasuk;
        expectedPulang = standardPulang + lateMinutes;
      }

      // Allow 15 minutes tolerance for pulang
      const tolerance = 15;
      if (pulangMinutes < expectedPulang - tolerance) {
        return true; // Left too early
      }

      return false;
    });

    if (incompleteRecords.length === 0) {
      toast.error("Tidak ada data absensi tidak lengkap");
      return;
    }

    // Prepare data for export
    const exportData = incompleteRecords.map((item, index) => ({
      No: index + 1,
      Nama: item.nama,
      NIP: item.nip,
      Tanggal: item.tanggal ? format(new Date(item.tanggal), "dd/MM/yyyy") : "",
      "Jam Masuk": item.jam_masuk || "",
      "Jam Pulang": item.jam_pulang || "",
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Absensi Tidak Lengkap");

    // Generate filename with current date
    const filename = `Rekap_Absensi_Tidak_Lengkap_${format(new Date(), "ddMMyyyy_HHmmss")}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
    toast.success(`${incompleteRecords.length} data absensi tidak lengkap berhasil diekspor ke Excel`);
  };

  const handleDeleteAll = () => {
    if (confirm("PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data absensi? Tindakan ini tidak dapat dibatalkan!")) {
      if (confirm("Konfirmasi sekali lagi: Semua data akan dihapus permanen!")) {
        deleteAllMutation.mutate();
      }
    }
  };

  const filteredData = absensiData?.filter(
    (item) =>
      item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nip?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalItems = filteredData?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData?.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center justify-between">
        <Input
          placeholder="Cari nama atau NIP..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={() => setImportDialogOpen(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Excel
            </Button>
            <Button onClick={handleExportExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Semua
            </Button>
            <Button onClick={handleExportIncomplete} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Tidak Lengkap
            </Button>
            <Button onClick={handleDeleteAll} variant="destructive">
              <X className="h-4 w-4 mr-2" />
              Hapus Semua Data
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Data
            </Button>
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Menampilkan {startIndex + 1} - {Math.min(endIndex, totalItems)} dari {totalItems} data
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>NIP</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jam Masuk</TableHead>
              <TableHead>Jam Pulang</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData?.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>{startIndex + index + 1}</TableCell>
                <TableCell>{item.nama}</TableCell>
                <TableCell>{item.nip}</TableCell>
                <TableCell>
                  {item.tanggal ? format(new Date(item.tanggal), "dd/MM/yyyy") : "-"}
                </TableCell>
                <TableCell>{item.jam_masuk || "-"}</TableCell>
                <TableCell>{item.jam_pulang || "-"}</TableCell>
              <TableCell className="text-right">
                {isAdmin ? (
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">-</div>
                )}
              </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <AbsensiDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        absensi={selectedAbsensi}
      />

      <ImportAbsensiDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  );
}
