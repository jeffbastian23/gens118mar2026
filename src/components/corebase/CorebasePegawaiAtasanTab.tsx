 import { useState, useEffect } from "react";
import { useRef } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
import { Search, Download, Upload, RefreshCw, Trash2, Plus } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import * as XLSX from "xlsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
 
 interface PegawaiAtasanData {
   id: string;
  nama: string;
   nip: string | null;
  jabatan: string | null;
   eselon_iii: string | null;
   eselon_iv: string | null;
   atasan_langsung: string | null;
   atasan_dari_atasan: string | null;
 }
 
 interface CorebasePegawaiAtasanTabProps {
   isAdmin: boolean;
   canEdit: boolean;
 }
 
 export default function CorebasePegawaiAtasanTab({ isAdmin, canEdit }: CorebasePegawaiAtasanTabProps) {
   const [data, setData] = useState<PegawaiAtasanData[]>([]);
  const [displayData, setDisplayData] = useState<PegawaiAtasanData[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    jabatan: "",
    eselon_iii: "",
    eselon_iv: "",
    atasan_langsung: "",
    atasan_dari_atasan: "",
  });
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Helper function to clean NIP (remove leading apostrophe)
  const cleanNip = (nip: string | null | undefined): string | null => {
    if (!nip) return null;
    // Remove leading apostrophe and trim whitespace
    return String(nip).replace(/^'+/, '').trim() || null;
  };
 
   const fetchData = async () => {
     setLoading(true);
     try {
      // Fetch all data in batches to overcome Supabase 1000 row limit
      const allData: PegawaiAtasanData[] = [];
      const batchSize = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: batchData, error } = await supabase
          .from("pegawai_atasan")
          .select("*")
          .order("no_urut", { ascending: true })
          .range(offset, offset + batchSize - 1);

        if (error) throw error;

        if (batchData && batchData.length > 0) {
          allData.push(...batchData);
          offset += batchSize;
          // Continue if we got a full batch (might be more data)
          hasMore = batchData.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      setData(allData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data pegawai");
    } finally {
      setLoading(false);
    }
  };
 
  // Filter data for display
  useEffect(() => {
    const filtered = searchTerm
      ? data.filter(
          (item) =>
            item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.nip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.eselon_iii?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.eselon_iv?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : data;

    setDisplayData(filtered);
  }, [data, searchTerm]);
 
   useEffect(() => {
     fetchData();
   }, []);
 
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const { data: { user } } = await supabase.auth.getUser();

          const importData = jsonData.map((row: any) => ({
            nama: row["Nama"] || row["nama"] || "",
            nip: cleanNip(row["NIP"] || row["nip"]),
            jabatan: row["Jabatan"] || row["jabatan"] || null,
            eselon_iii: row["Eselon III"] || row["eselon_iii"] || null,
            eselon_iv: row["Eselon IV"] || row["eselon_iv"] || null,
            atasan_langsung: row["Atasan Langsung"] || row["atasan_langsung"] || null,
            atasan_dari_atasan: row["Atasan dari Atasan"] || row["atasan_dari_atasan"] || null,
            created_by_email: user?.email || null,
          })).filter((item: any) => item.nama);

          if (importData.length === 0) {
            toast.error("Tidak ada data valid untuk diimpor");
            return;
          }

          const { error } = await supabase
            .from("pegawai_atasan")
            .insert(importData);

          if (error) throw error;

          toast.success(`Berhasil mengimpor ${importData.length} data`);
          fetchData();
        } catch (err) {
          console.error("Error processing Excel:", err);
          toast.error("Gagal memproses file Excel");
        } finally {
          setImporting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error importing:", error);
      toast.error("Gagal mengimpor data");
      setImporting(false);
     }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("pegawai_atasan")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (error) throw error;

      toast.success("Semua data berhasil dihapus");
      fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Gagal menghapus data");
    } finally {
      setDeleting(false);
    }
  };
 
  const handleAddData = async () => {
    if (!formData.nama.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("pegawai_atasan").insert({
        nama: formData.nama,
        nip: cleanNip(formData.nip),
        jabatan: formData.jabatan || null,
        eselon_iii: formData.eselon_iii || null,
        eselon_iv: formData.eselon_iv || null,
        atasan_langsung: formData.atasan_langsung || null,
        atasan_dari_atasan: formData.atasan_dari_atasan || null,
        created_by_email: user?.email || null,
      });

      if (error) throw error;

      toast.success("Data berhasil ditambahkan");
      setShowAddDialog(false);
      setFormData({ nama: "", nip: "", jabatan: "", eselon_iii: "", eselon_iv: "", atasan_langsung: "", atasan_dari_atasan: "" });
      fetchData();
    } catch (error) {
      console.error("Error adding data:", error);
      toast.error("Gagal menambahkan data");
    } finally {
      setSaving(false);
    }
  };

   const handleExportExcel = () => {
    const exportData = displayData.map((item, index) => ({
       No: index + 1,
      Nama: item.nama,
       NIP: item.nip || "",
      Jabatan: item.jabatan || "",
       "Eselon III": item.eselon_iii || "",
       "Eselon IV": item.eselon_iv || "",
       "Atasan Langsung": item.atasan_langsung || "",
       "Atasan dari Atasan": item.atasan_dari_atasan || "",
     }));
 
     const ws = XLSX.utils.json_to_sheet(exportData);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Pegawai & Atasan");
     XLSX.writeFile(wb, "pegawai_atasan.xlsx");
     toast.success("Data berhasil diekspor");
   };

  // Calculate pagination
  const totalPages = Math.ceil(displayData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = displayData.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
 
   return (
     <Card>
       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
         <CardTitle className="flex items-center gap-2">
           Pegawai & Atasan
           <span className="text-sm font-normal text-muted-foreground">
            Total: {displayData.length}
           </span>
         </CardTitle>
         <div className="flex items-center gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Data
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            className="hidden"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="h-4 w-4 mr-2" />
            {importing ? "Mengimpor..." : "Import Excel"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={deleting || data.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Semua
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Semua Data?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini akan menghapus semua {data.length} data pegawai. Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground">
                  Hapus Semua
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
           <Button variant="outline" size="sm" onClick={handleExportExcel}>
             <Download className="h-4 w-4 mr-2" />
             Export Excel
           </Button>
           <Button variant="outline" size="sm" onClick={fetchData}>
             <RefreshCw className="h-4 w-4 mr-2" />
             Refresh
           </Button>
           <div className="relative">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder="Cari nama/NIP..."
               className="pl-8 w-[200px]"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
         </div>
       </CardHeader>
       <CardContent>
        {/* Add Data Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tambah Data Pegawai</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nama">Nama <span className="text-destructive">*</span></Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nip">NIP</Label>
                <Input
                  id="nip"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="Masukkan NIP"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jabatan">Jabatan</Label>
                <Input
                  id="jabatan"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  placeholder="Masukkan jabatan"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="eselon_iii">Eselon III</Label>
                <Input
                  id="eselon_iii"
                  value={formData.eselon_iii}
                  onChange={(e) => setFormData({ ...formData, eselon_iii: e.target.value })}
                  placeholder="Masukkan Eselon III"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="eselon_iv">Eselon IV</Label>
                <Input
                  id="eselon_iv"
                  value={formData.eselon_iv}
                  onChange={(e) => setFormData({ ...formData, eselon_iv: e.target.value })}
                  placeholder="Masukkan Eselon IV"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="atasan_langsung">Atasan Langsung</Label>
                <Input
                  id="atasan_langsung"
                  value={formData.atasan_langsung}
                  onChange={(e) => setFormData({ ...formData, atasan_langsung: e.target.value })}
                  placeholder="Masukkan Atasan Langsung"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="atasan_dari_atasan">Atasan dari Atasan</Label>
                <Input
                  id="atasan_dari_atasan"
                  value={formData.atasan_dari_atasan}
                  onChange={(e) => setFormData({ ...formData, atasan_dari_atasan: e.target.value })}
                  placeholder="Masukkan Atasan dari Atasan"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleAddData} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

         <div className="rounded-md border overflow-x-auto">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead className="w-[60px]">No</TableHead>
                 <TableHead>Nama</TableHead>
                 <TableHead>NIP</TableHead>
                <TableHead>Jabatan</TableHead>
                 <TableHead>Eselon III</TableHead>
                 <TableHead>Eselon IV</TableHead>
                 <TableHead>Atasan Langsung</TableHead>
                 <TableHead>Atasan dari Atasan</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {loading ? (
                 <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                     Memuat data...
                   </TableCell>
                 </TableRow>
              ) : displayData.length === 0 ? (
                 <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Belum ada data. Klik "Import Excel" untuk menambah data.
                   </TableCell>
                 </TableRow>
               ) : (
                paginatedData.map((item, index) => (
                   <TableRow key={item.id}>
                      <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium">{item.nama}</TableCell>
                      <TableCell>{cleanNip(item.nip) || "-"}</TableCell>
                    <TableCell>{item.jabatan || "-"}</TableCell>
                     <TableCell>{item.eselon_iii || "-"}</TableCell>
                     <TableCell>{item.eselon_iv || "-"}</TableCell>
                     <TableCell>{item.atasan_langsung || "-"}</TableCell>
                     <TableCell>{item.atasan_dari_atasan || "-"}</TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </div>

          {/* Pagination */}
          {displayData.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Menampilkan {startIndex + 1} - {Math.min(endIndex, displayData.length)} dari {displayData.length} data</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[80px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="250">250</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="1000">1000</SelectItem>
                    <SelectItem value="1500">1500</SelectItem>
                    <SelectItem value="2000">2000</SelectItem>
                  </SelectContent>
                </Select>
                <span>per halaman</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
       </CardContent>
     </Card>
   );
 }