import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileDown, Upload, Trash2, Plus, Edit, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import IsiBerkasForm from "@/components/IsiBerkasForm";
import OCRScanner from "@/components/OCRScanner";

interface IsiBerkas {
  id: string;
  no_urut: number;
  no_berkas: number;
  kode_klasifikasi: string;
  uraian_informasi_arsip: string;
  kurun_waktu: string;
  tingkat_perkembangan: string;
  jumlah: number;
  keterangan: string | null;
  dokumen_scan: string | null;
  nomor_surat_naskah: string | null;
  nama_pic: string | null;
  status_dokumen: string | null;
  dimusnahkan: boolean | null;
  usia_retensi: string | null;
  klasifikasi_keamanan: string | null;
  hak_akses: string | null;
}

export default function IsiBerkasTable() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const canEdit = role !== "overview";
  const [data, setData] = useState<IsiBerkas[]>([]);
  const [filteredData, setFilteredData] = useState<IsiBerkas[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<IsiBerkas | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [kodeKlasifikasiSearch, setKodeKlasifikasiSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = data;
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    if (kodeKlasifikasiSearch) {
      filtered = filtered.filter((item) =>
        item.kode_klasifikasi.toLowerCase().includes(kodeKlasifikasiSearch.toLowerCase())
      );
    }
    setFilteredData(filtered);
  }, [searchTerm, kodeKlasifikasiSearch, data]);

  const calculateStatusDokumen = (kurunWaktu: string, usiaRetensi?: string | null): string => {
    try {
      const docDate = new Date(kurunWaktu);
      const now = new Date();
      const diffYears = now.getFullYear() - docDate.getFullYear();
      
      // Parse retention period, default to 5 years
      const retensiYears = usiaRetensi ? parseInt(usiaRetensi.split(" ")[0]) : 5;
      
      return diffYears >= retensiYears ? "Inaktif" : "Aktif";
    } catch {
      return "Aktif";
    }
  };

  const calculateDocumentAge = (kurunWaktu: string): string => {
    try {
      const docDate = new Date(kurunWaktu);
      const now = new Date();
      
      let years = now.getFullYear() - docDate.getFullYear();
      let months = now.getMonth() - docDate.getMonth();
      
      if (months < 0) {
        years--;
        months += 12;
      }
      
      return `${years} tahun ${months} bulan`;
    } catch {
      return "-";
    }
  };

  const fetchData = async () => {
    const { data: berkas, error } = await supabase
      .from("isi_berkas")
      .select("*")
      .order("uraian_informasi_arsip", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data isi berkas",
        variant: "destructive",
      });
      return;
    }

    const berkasWithStatus = (berkas || []).map((item: any) => ({
      ...item,
      status_dokumen: calculateStatusDokumen(item.kurun_waktu, item.usia_retensi),
    }));

    setData(berkasWithStatus as unknown as IsiBerkas[]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    
    // Check if referenced by peminjaman_arsip
    const { data: refs } = await supabase
      .from("peminjaman_arsip")
      .select("id")
      .eq("isi_berkas_id", id)
      .limit(1);

    if (refs && refs.length > 0) {
      toast({
        title: "Tidak dapat menghapus",
        description: "Data ini masih direferensikan oleh peminjaman arsip. Hapus peminjaman terkait terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("isi_berkas").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: `Gagal menghapus data: ${error.message}`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: "Data berhasil dihapus",
    });

    fetchData();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws) as any[];

        let successCount = 0;
        let errorCount = 0;

        for (const row of jsonData) {
          // Map various possible column names to support different Excel formats
          const no_urut = row["No Urut"] || row["Nomor Item Arsip"] || row["no_urut"] || null;
          const no_berkas = row["No Berkas"] || row["Nomor Berkas"] || row["no_berkas"] || 0;
          const kode_klasifikasi = row["Kode Klasifikasi"] || row["kode_klasifikasi"] || "";
          const uraian_informasi_arsip = row["Uraian Informasi Arsip"] || row["uraian_informasi_arsip"] || row["Uraian"] || "";
          const kurun_waktu = row["Tanggal"] || row["Kurun Waktu"] || row["Tanggal Naskah"] || row["kurun_waktu"] || "";
          const tingkat_perkembangan = row["Tingkat Perkembangan"] || row["tingkat_perkembangan"] || "Asli";
          const jumlah = row["Jumlah (naskah)"] || row["Jumlah"] || row["jumlah"] || 1;
          const keterangan = row["Keterangan"] || row["keterangan"] || null;
          const nomor_surat_naskah = row["Nomor Surat/Naskah"] || row["Nomor Surat"] || row["nomor_surat_naskah"] || null;
          const nama_pic = row["Nama PIC"] || row["PIC"] || row["nama_pic"] || null;
          const usia_retensi = row["Usia Retensi"] || row["usia_retensi"] || "5 tahun";
          const klasifikasi_keamanan = row["Klasifikasi Keamanan"] || row["klasifikasi_keamanan"] || null;
          const hak_akses = row["Hak Akses"] || row["hak_akses"] || null;

          // Get next no_urut if not provided
          let finalNoUrut = no_urut;
          if (!finalNoUrut) {
            const { data: lastData } = await supabase
              .from("isi_berkas")
              .select("no_urut")
              .order("no_urut", { ascending: false })
              .limit(1);
            finalNoUrut = lastData && lastData.length > 0 ? (lastData[0] as any).no_urut + 1 : 1;
          }

          const { error } = await supabase.from("isi_berkas").insert({
            no_urut: finalNoUrut,
            no_berkas: no_berkas,
            kode_klasifikasi: kode_klasifikasi,
            uraian_informasi_arsip: uraian_informasi_arsip,
            kurun_waktu: kurun_waktu,
            tingkat_perkembangan: tingkat_perkembangan,
            jumlah: jumlah,
            keterangan: keterangan,
            nomor_surat_naskah: nomor_surat_naskah,
            nama_pic: nama_pic,
            usia_retensi: usia_retensi,
            klasifikasi_keamanan: klasifikasi_keamanan,
            hak_akses: hak_akses,
          } as any);

          if (error) {
            console.error("Import error:", error);
            errorCount++;
          } else {
            successCount++;
          }
        }

        toast({
          title: "Berhasil",
          description: `Data berhasil diimpor: ${successCount} berhasil, ${errorCount} gagal`,
        });

        fetchData();
      } catch (err) {
        console.error("Import parse error:", err);
        toast({
          title: "Error",
          description: "Gagal membaca file Excel",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    e.target.value = "";
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((item) => ({
        "No Urut": item.no_urut,
        "No Berkas": item.no_berkas,
        "Kode Klasifikasi": item.kode_klasifikasi,
        "Uraian Informasi Arsip": item.uraian_informasi_arsip,
        "Kurun Waktu": item.kurun_waktu,
        "Tingkat Perkembangan": item.tingkat_perkembangan,
        Jumlah: item.jumlah,
        Keterangan: item.keterangan || "",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Isi Berkas");
    XLSX.writeFile(workbook, "isi_berkas.xlsx");
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setShowEditDialog(false);
    setEditData(null);
    fetchData();
  };

  const handleEdit = (item: IsiBerkas) => {
    setEditData(item);
    setShowEditDialog(true);
  };

  const handleDocumentUpload = async (id: string, file: File) => {
    setUploadingId(id);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      
      const { error } = await supabase
        .from("isi_berkas")
        .update({ dokumen_scan: base64Data } as any)
        .eq("id", id);

      if (error) {
        toast({
          title: "Error",
          description: "Gagal mengunggah dokumen",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Berhasil",
          description: "Dokumen berhasil diunggah",
        });
        fetchData();
      }
      setUploadingId(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadDocument = (item: IsiBerkas) => {
    if (!item.dokumen_scan) return;
    
    const link = document.createElement("a");
    link.href = item.dokumen_scan;
    link.download = `dokumen_${item.no_urut}_${item.kode_klasifikasi}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleDimusnahkan = async (id: string, currentStatus: boolean | null) => {
    try {
      const { error } = await supabase
        .from("isi_berkas")
        .update({ dimusnahkan: !currentStatus })
        .eq("id", id);

      if (error) {
        console.error("Toggle error:", error);
        toast({
          title: "Error",
          description: `Gagal mengupdate status dimusnahkan: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Berhasil",
        description: `Status dimusnahkan berhasil ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}`,
      });
      
      await fetchData();
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: "Terjadi kesalahan tidak terduga",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap mb-4">
        <Input
          placeholder="Cari berkas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Cari kode klasifikasi..."
          value={kodeKlasifikasiSearch}
          onChange={(e) => setKodeKlasifikasiSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="flex justify-between gap-2 flex-wrap">
        {canEdit && (
          <Button onClick={() => setShowAddForm(!showAddForm)} variant="default" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {showAddForm ? "Tutup Form" : "Tambah Form Isi Berkas"}
          </Button>
        )}
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <FileDown className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => document.getElementById("import-isi")?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Import Excel
            </Button>
            <Input
              id="import-isi"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={async () => {
                if (!confirm("Yakin ingin menghapus SEMUA data isi berkas? Tindakan ini tidak dapat dibatalkan.")) return;
                // First delete peminjaman_arsip references
                await supabase.from("peminjaman_arsip").delete().not("id", "is", null);
                const { error } = await supabase.from("isi_berkas").delete().not("id", "is", null);
                if (error) {
                  toast({ title: "Error", description: `Gagal menghapus semua data: ${error.message}`, variant: "destructive" });
                  return;
                }
                toast({ title: "Berhasil", description: "Semua data berhasil dihapus" });
                fetchData();
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Semua
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Data Isi Berkas</DialogTitle>
          </DialogHeader>
          <IsiBerkasForm onSuccess={handleFormSuccess} editData={editData} isEdit={true} />
        </DialogContent>
      </Dialog>

      {showAddForm && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <h3 className="text-lg font-semibold mb-4">Tambah Isi Berkas Baru</h3>
          <IsiBerkasForm onSuccess={handleFormSuccess} />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No Urut</TableHead>
              <TableHead>No Berkas</TableHead>
              <TableHead>Kode Klasifikasi</TableHead>
              <TableHead>Nomor Surat/Naskah</TableHead>
              <TableHead>Uraian Informasi Arsip</TableHead>
              <TableHead>Tanggal Naskah</TableHead>
              <TableHead>Nama PIC</TableHead>
              <TableHead>Tingkat Perkembangan</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead>Usia Retensi</TableHead>
              <TableHead>Usia Dokumen</TableHead>
              <TableHead>Status Dokumen</TableHead>
              <TableHead>Dimusnahkan</TableHead>
              <TableHead className="w-[180px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} className="text-center text-muted-foreground">
                  {searchTerm ? "Tidak ada data yang cocok" : "Tidak ada data"}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.no_urut}</TableCell>
                  <TableCell>{item.no_berkas}</TableCell>
                  <TableCell>{item.kode_klasifikasi}</TableCell>
                  <TableCell>{item.nomor_surat_naskah || "-"}</TableCell>
                  <TableCell>{item.uraian_informasi_arsip}</TableCell>
                  <TableCell>{item.kurun_waktu}</TableCell>
                  <TableCell>{item.nama_pic || "-"}</TableCell>
                  <TableCell>{item.tingkat_perkembangan}</TableCell>
                  <TableCell>{item.jumlah}</TableCell>
                  <TableCell>{item.keterangan || "-"}</TableCell>
                  <TableCell>{item.usia_retensi || "5 tahun"}</TableCell>
                  <TableCell>{calculateDocumentAge(item.kurun_waktu)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status_dokumen === "Aktif"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.status_dokumen || "Aktif"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.dimusnahkan || false}
                        onCheckedChange={() => toggleDimusnahkan(item.id, item.dimusnahkan)}
                        disabled={item.status_dokumen === "Aktif" || !canEdit}
                      />
                      <span className="text-xs">
                        {item.dimusnahkan ? "Sudah" : "Belum"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {item.dokumen_scan ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDownloadDocument(item)}
                          title="Unduh Dokumen"
                          className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white border-green-500"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      ) : (
                        <>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            id={`upload-${item.id}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocumentUpload(item.id, file);
                            }}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => document.getElementById(`upload-${item.id}`)?.click()}
                            disabled={uploadingId === item.id}
                            title="Upload Dokumen"
                            className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white border-red-500"
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="h-8 px-2"
                          >
                            <Edit className="w-4 h-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="h-8 px-2"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
