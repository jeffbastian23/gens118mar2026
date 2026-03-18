import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, Plus, Edit, Trash2, FileText, FileDown, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import PeminjamanArsipForm from "./PeminjamanArsipForm";
import PeminjamanArsipEditDialog from "./PeminjamanArsipEditDialog";
import { generateBeritaAcaraPeminjaman } from "@/utils/beritaAcaraPeminjamanGenerator";

interface PeminjamanArsip {
  id: string;
  no_urut: number;
  nama_dokumen: string;
  kode_klasifikasi: string;
  nomor_boks: string;
  tahun_dokumen: string;
  pemilik_dokumen: string;
  no_rak: string;
  sub_rak: string;
  susun: string;
  baris: string;
  status_dokumen: string;
  keperluan: string;
  tanggal_peminjaman: string;
  status_pengembalian: boolean;
  tanggal_pengembalian: string | null;
  nama_peminjam: string;
  foto_peminjam?: string | null;
}

export default function PeminjamanArsipTable() {
  const { user, fullName, role } = useAuth();
  const isAdmin = role === "admin";
  const canEdit = role !== "overview";
  const [data, setData] = useState<PeminjamanArsip[]>([]);
  const [filteredData, setFilteredData] = useState<PeminjamanArsip[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPeminjaman, setEditingPeminjaman] = useState<PeminjamanArsip | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = data.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [searchTerm, data]);

  const fetchData = async () => {
    const { data: peminjaman, error } = await supabase
      .from("peminjaman_arsip")
      .select("*")
      .order("tanggal_peminjaman", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data peminjaman",
        variant: "destructive",
      });
      return;
    }

    setData((peminjaman || []) as PeminjamanArsip[]);
  };

  const handleKembalikan = async (id: string) => {
    const { error } = await supabase
      .from("peminjaman_arsip")
      .update({
        status_pengembalian: true,
        tanggal_pengembalian: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal mengupdate status pengembalian",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: "Dokumen berhasil dikembalikan",
    });

    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("peminjaman_arsip")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus data peminjaman",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: "Data peminjaman berhasil dihapus",
    });

    setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    fetchData();
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    fetchData();
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredData.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleGenerateBeritaAcara = async (item: PeminjamanArsip) => {
    try {
      const pihakPertamaNama = fullName || "Petugas Arsip";
      const pihakPertamaEmail = user?.email || "arsip@kemenkeu.go.id";

      // Get all selected items or just the current item
      let itemsToInclude: PeminjamanArsip[] = [];
      
      if (selectedItems.includes(item.id)) {
        // If this item is selected, include all selected items
        itemsToInclude = data.filter(d => selectedItems.includes(d.id));
      } else {
        // Otherwise just this single item
        itemsToInclude = [item];
      }

      await generateBeritaAcaraPeminjaman({
        pihakPertamaNama,
        pihakPertamaEmail,
        pihakKeduaNama: item.nama_peminjam,
        items: itemsToInclude.map(i => ({
          no_urut: i.no_urut,
          nama_dokumen: i.nama_dokumen,
          kode_klasifikasi: i.kode_klasifikasi,
          nomor_boks: i.nomor_boks,
          tahun_dokumen: i.tahun_dokumen,
          pemilik_dokumen: i.pemilik_dokumen,
        })),
      });

      toast({
        title: "Berhasil",
        description: "Berita Acara berhasil di-generate",
      });
    } catch (error) {
      console.error("Error generating berita acara:", error);
      toast({
        title: "Error",
        description: "Gagal generate Berita Acara",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-2 flex-wrap mb-4">
        <Input
          placeholder="Cari peminjaman arsip..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        {selectedItems.length > 0 && (
          <span className="text-sm text-muted-foreground self-center">
            {selectedItems.length} item dipilih
          </span>
        )}
      </div>
      <div className="flex justify-between items-center gap-2 flex-wrap">
        {isAdmin && (
          <>
            <Button onClick={() => setShowAddForm(!showAddForm)} variant="default" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {showAddForm ? "Tutup Form" : "Tambah Peminjaman"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const worksheet = XLSX.utils.json_to_sheet(
                  data.map((item) => ({
                    "No Urut": item.no_urut,
                    "Nama Dokumen": item.nama_dokumen,
                    "Kode Klasifikasi": item.kode_klasifikasi,
                    "Nomor Boks": item.nomor_boks,
                    "Tahun Dokumen": item.tahun_dokumen,
                    "Pemilik Dokumen": item.pemilik_dokumen,
                    "No Rak": item.no_rak,
                    "Sub Rak": item.sub_rak,
                    "Susun": item.susun,
                    "Baris": item.baris,
                    "Status Dokumen": item.status_dokumen,
                    "Keperluan": item.keperluan,
                    "Nama Peminjam": item.nama_peminjam,
                    "Tanggal Peminjaman": format(new Date(item.tanggal_peminjaman), "dd/MM/yyyy HH:mm"),
                    "Status Pengembalian": item.status_pengembalian ? "Sudah" : "Belum",
                    "Tanggal Pengembalian": item.tanggal_pengembalian ? format(new Date(item.tanggal_pengembalian), "dd/MM/yyyy HH:mm") : "-"
                  }))
                );
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Peminjaman Arsip");
                XLSX.writeFile(workbook, "peminjaman_arsip.xlsx");
              }}>
                <FileDown className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => document.getElementById("import-peminjaman")?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Import Excel
              </Button>
              <input
                id="import-peminjaman"
                type="file"
                accept=".xlsx,.xls"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async (evt) => {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: "binary" });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const jsonData = XLSX.utils.sheet_to_json(ws) as any[];
                    let imported = 0;
                    for (const row of jsonData) {
                      const { data: lastData } = await supabase
                        .from("peminjaman_arsip")
                        .select("no_urut")
                        .order("no_urut", { ascending: false })
                        .limit(1);
                      const nextNo = lastData && lastData.length > 0 ? (lastData[0] as any).no_urut + 1 : 1;
                      const { error } = await supabase.from("peminjaman_arsip").insert({
                        no_urut: nextNo,
                        nama_dokumen: row["Nama Dokumen"] || "",
                        kode_klasifikasi: row["Kode Klasifikasi"] || "",
                        nomor_boks: row["Nomor Boks"] || "",
                        tahun_dokumen: row["Tahun Dokumen"] || "",
                        pemilik_dokumen: row["Pemilik Dokumen"] || "",
                        no_rak: row["No Rak"] || "",
                        sub_rak: row["Sub Rak"] || "",
                        susun: row["Susun"] || "",
                        baris: row["Baris"] || "",
                        status_dokumen: row["Status Dokumen"] || "Aktif",
                        keperluan: row["Keperluan"] || "",
                        nama_peminjam: row["Nama Peminjam"] || "",
                      });
                      if (!error) imported++;
                    }
                    toast({ title: "Berhasil", description: `${imported} data berhasil diimport` });
                    fetchData();
                  };
                  reader.readAsBinaryString(file);
                  e.target.value = "";
                }}
                className="hidden"
              />
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={async () => {
                  if (!confirm("Yakin ingin menghapus SEMUA data peminjaman arsip? Tindakan ini tidak dapat dibatalkan.")) return;
                  const { error } = await supabase.from("peminjaman_arsip").delete().neq("id", "");
                  if (error) {
                    toast({ title: "Error", description: "Gagal menghapus semua data", variant: "destructive" });
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
          </>
        )}
      </div>

      {showAddForm && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <h3 className="text-lg font-semibold mb-4">Tambah Peminjaman Arsip Baru</h3>
          <PeminjamanArsipForm onSuccess={handleFormSuccess} />
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={filteredData.length > 0 && selectedItems.length === filteredData.length}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead>No Urut</TableHead>
              <TableHead>Nama Dokumen</TableHead>
              <TableHead>Kode Klasifikasi</TableHead>
              <TableHead>No Boks</TableHead>
              <TableHead>Tahun</TableHead>
              <TableHead>Pemilik</TableHead>
              <TableHead>No Rak</TableHead>
              <TableHead>Sub Rak</TableHead>
              <TableHead>Susun</TableHead>
              <TableHead>Baris</TableHead>
              <TableHead>Status Dok</TableHead>
              <TableHead>Keperluan</TableHead>
              <TableHead>Tgl Peminjaman</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} className="text-center text-muted-foreground">
                  {searchTerm ? "Tidak ada data yang cocok" : "Tidak ada data peminjaman"}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>{item.no_urut}</TableCell>
                  <TableCell>{item.nama_dokumen}</TableCell>
                  <TableCell>{item.kode_klasifikasi}</TableCell>
                  <TableCell>{item.nomor_boks}</TableCell>
                  <TableCell>{item.tahun_dokumen}</TableCell>
                  <TableCell>{item.pemilik_dokumen}</TableCell>
                  <TableCell>{item.no_rak}</TableCell>
                  <TableCell>{item.sub_rak}</TableCell>
                  <TableCell>{item.susun}</TableCell>
                  <TableCell>{item.baris}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.status_dokumen === "Aktif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {item.status_dokumen}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{item.keperluan}</TableCell>
                  <TableCell>{format(new Date(item.tanggal_peminjaman), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleGenerateBeritaAcara(item)}
                        title="Generate Berita Acara"
                        className="h-8 w-8"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleKembalikan(item.id)}
                            disabled={item.status_pengembalian}
                            title="Kembalikan"
                            className="h-8 w-8"
                          >
                            {item.status_pengembalian ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setEditingPeminjaman(item)}
                            title="Edit"
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            title="Hapus"
                            className="h-8 w-8"
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

      <PeminjamanArsipEditDialog
        peminjaman={editingPeminjaman}
        open={!!editingPeminjaman}
        onOpenChange={(open) => !open && setEditingPeminjaman(null)}
        onSuccess={fetchData}
      />
    </div>
  );
}
