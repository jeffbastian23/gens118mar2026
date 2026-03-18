import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, FileDown, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PendataanMasuk {
  id: string;
  no_berkas: number;
  kode_klasifikasi: string;
  uraian_informasi_berkas: string;
  jenis_berkas: string;
  nomor_rak: string;
  sub_rak: string;
  susun: string;
  baris: string;
  geotag: string;
}

const JENIS_BERKAS_OPTIONS = [
  "Dokumen Perizinan",
  "Dokumen Pengangkutan",
  "Dokumen Impor Barang",
  "Dokumen Ekspor Barang",
  "Dokumen Pemasukan dan Pengeluaran Barang ke dan dari Kawasan Perdagangan Bebas dan Pelabuhan Bebas",
  "Dokumen Klasifikasi dan Nilai Pabean",
  "Dokumen Pemasukan ke Tempat Penimbunan Berikat (TPB)",
  "Dokumen Pengeluaran dari Tempat Penimbunan Berikat (TPB)",
  "Dokumen Barang Tidak Dikuasai (BTD), Barang Dikuasai Negara (BDN), Barang Milik Negara (BMN)",
  "Dokumen Fasilitas Pembebasan dan/atau Keringanan Bea Masuk",
  "Dokumen Fasilitas Kepabeanan di Bidang Pertambangan",
  "Dokumen Fasilitas Kepabeanan di Bidang Tempat Penimbunan Berikat",
  "Dokumen Faslitas Kepabeanan di Bidang Pembebasan dan Pengembalian Bea Masuk",
  "Laporan",
  "Dokumen Penagihan dan Penyitaan Kepabeanan",
  "Dokumen Pengembalian Kepabeanan",
];

const NOMOR_RAK_OPTIONS = [
  "P1", "P2", "P22", "P23", "P24", "P3", "P4", "P5", "P6", "P7",
  "R10", "R11", "R12", "R13", "R1K", "R2", "R23", "R2K", "R3",
  "R31", "R32", "R3K", "R4", "R8", "R9", "RL1K"
];

const SUB_RAK_OPTIONS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
const SUSUN_OPTIONS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const BARIS_OPTIONS = Array.from({ length: 30 }, (_, i) => (i + 1).toString());

export default function PendataanMasukTable() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const canEdit = role !== "overview";
  const [data, setData] = useState<PendataanMasuk[]>([]);
  const [filteredData, setFilteredData] = useState<PendataanMasuk[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [daftarBerkas, setDaftarBerkas] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editData, setEditData] = useState<PendataanMasuk | null>(null);
  const [formData, setFormData] = useState({
    daftar_berkas_id: "",
    jenis_berkas: "",
    nomor_rak: "",
    sub_rak: "",
    susun: "",
    baris: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    fetchDaftarBerkas();
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
    const { data: pendataan, error } = await supabase
      .from("pendataan_masuk")
      .select("*")
      .order("no_berkas", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data pendataan masuk",
        variant: "destructive",
      });
      return;
    }

    setData((pendataan || []) as PendataanMasuk[]);
  };

  const fetchDaftarBerkas = async () => {
    const { data: berkas, error } = await supabase
      .from("daftar_berkas")
      .select("*")
      .order("no_berkas", { ascending: true });

    if (!error) {
      setDaftarBerkas(berkas || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedBerkas = daftarBerkas.find(b => b.id === formData.daftar_berkas_id);
    if (!selectedBerkas) {
      toast({
        title: "Error",
        description: "Pilih berkas terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const dataToSave = {
      daftar_berkas_id: formData.daftar_berkas_id,
      no_berkas: selectedBerkas.no_berkas,
      kode_klasifikasi: selectedBerkas.kode_klasifikasi,
      uraian_informasi_berkas: selectedBerkas.uraian_informasi_berkas,
      jenis_berkas: formData.jenis_berkas,
      nomor_rak: formData.nomor_rak,
      sub_rak: formData.sub_rak,
      susun: formData.susun,
      baris: formData.baris,
    };

    if (editData) {
      const { error } = await supabase
        .from("pendataan_masuk")
        .update(dataToSave)
        .eq("id", editData.id);

      if (error) {
        toast({
          title: "Error",
          description: "Gagal mengupdate data",
          variant: "destructive",
        });
        return;
      }
    } else {
      const { error } = await supabase.from("pendataan_masuk").insert([dataToSave]);

      if (error) {
        toast({
          title: "Error",
          description: "Gagal menyimpan data",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Berhasil",
      description: `Data berhasil ${editData ? "diupdate" : "disimpan"}`,
    });

    setShowDialog(false);
    setEditData(null);
    setFormData({
      daftar_berkas_id: "",
      jenis_berkas: "",
      nomor_rak: "",
      sub_rak: "",
      susun: "",
      baris: "",
    });
    fetchData();
  };

  const handleEdit = (item: PendataanMasuk) => {
    setEditData(item);
    const berkas = daftarBerkas.find(b => b.no_berkas === item.no_berkas);
    setFormData({
      daftar_berkas_id: berkas?.id || "",
      jenis_berkas: item.jenis_berkas,
      nomor_rak: item.nomor_rak,
      sub_rak: item.sub_rak,
      susun: item.susun,
      baris: item.baris,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("pendataan_masuk").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus data",
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

  const selectedBerkas = daftarBerkas.find(b => b.id === formData.daftar_berkas_id);

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-2 flex-wrap mb-4">
        <Input
          placeholder="Cari pendataan masuk..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="flex justify-between gap-2 flex-wrap">
        {isAdmin && (
          <>
            <Button onClick={() => { setEditData(null); setShowDialog(true); }} variant="default" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pendataan Masuk
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const worksheet = XLSX.utils.json_to_sheet(
                  data.map((item) => ({
                    "No Berkas": item.no_berkas,
                    "Kode Klasifikasi": item.kode_klasifikasi,
                    "Uraian Informasi Berkas": item.uraian_informasi_berkas,
                    "Jenis Berkas": item.jenis_berkas,
                    "Nomor Rak": item.nomor_rak,
                    "Sub Rak": item.sub_rak,
                    "Susun": item.susun,
                    "Baris": item.baris,
                    "Geotag": item.geotag,
                  }))
                );
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Pendataan Masuk");
                XLSX.writeFile(workbook, "pendataan_masuk.xlsx");
              }}>
                <FileDown className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => document.getElementById("import-pendataan")?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Import Excel
              </Button>
              <Input
                id="import-pendataan"
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
                      const berkas = daftarBerkas.find(b => b.no_berkas === row["No Berkas"]);
                      const { error } = await supabase.from("pendataan_masuk").insert({
                        daftar_berkas_id: berkas?.id || null,
                        no_berkas: row["No Berkas"] || 0,
                        kode_klasifikasi: row["Kode Klasifikasi"] || "",
                        uraian_informasi_berkas: row["Uraian Informasi Berkas"] || "",
                        jenis_berkas: row["Jenis Berkas"] || "",
                        nomor_rak: row["Nomor Rak"] || "",
                        sub_rak: row["Sub Rak"] || "",
                        susun: row["Susun"] || "",
                        baris: row["Baris"] || "",
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
                  if (!confirm("Yakin ingin menghapus SEMUA data pendataan masuk? Tindakan ini tidak dapat dibatalkan.")) return;
                  const { error } = await supabase.from("pendataan_masuk").delete().neq("id", "");
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No Berkas</TableHead>
              <TableHead>Kode Klasifikasi</TableHead>
              <TableHead>Uraian Informasi Berkas</TableHead>
              <TableHead>Jenis Berkas</TableHead>
              <TableHead>Nomor Rak</TableHead>
              <TableHead>Sub Rak</TableHead>
              <TableHead>Susun</TableHead>
              <TableHead>Baris</TableHead>
              <TableHead>Geotag</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  {searchTerm ? "Tidak ada data yang cocok" : "Tidak ada data"}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.no_berkas}</TableCell>
                  <TableCell>{item.kode_klasifikasi}</TableCell>
                  <TableCell>{item.uraian_informasi_berkas}</TableCell>
                  <TableCell>{item.jenis_berkas}</TableCell>
                  <TableCell>{item.nomor_rak}</TableCell>
                  <TableCell>{item.sub_rak}</TableCell>
                  <TableCell>{item.susun}</TableCell>
                  <TableCell>{item.baris}</TableCell>
                  <TableCell className="font-mono font-bold">{item.geotag}</TableCell>
                  <TableCell>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Edit className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editData ? "Edit" : "Tambah"} Pendataan Masuk</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Berkas *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.daftar_berkas_id}
                onChange={(e) => setFormData({ ...formData, daftar_berkas_id: e.target.value })}
                required
              >
                <option value="">Pilih berkas...</option>
                {daftarBerkas.map((berkas) => (
                  <option key={berkas.id} value={berkas.id}>
                    {berkas.no_berkas} - {berkas.kode_klasifikasi} - {berkas.uraian_informasi_berkas}
                  </option>
                ))}
              </select>
            </div>

            {selectedBerkas && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h3 className="font-semibold">Informasi Berkas (Terkunci):</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">No Berkas:</p>
                    <p className="font-semibold">{selectedBerkas.no_berkas}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kode Klasifikasi:</p>
                    <p className="font-semibold">{selectedBerkas.kode_klasifikasi}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-muted-foreground">Uraian:</p>
                    <p className="font-semibold">{selectedBerkas.uraian_informasi_berkas}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jenis Berkas *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.jenis_berkas}
                  onChange={(e) => setFormData({ ...formData, jenis_berkas: e.target.value })}
                  required
                >
                  <option value="">Pilih jenis berkas...</option>
                  {JENIS_BERKAS_OPTIONS.map((jenis) => (
                    <option key={jenis} value={jenis}>{jenis}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Nomor Rak *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.nomor_rak}
                  onChange={(e) => setFormData({ ...formData, nomor_rak: e.target.value })}
                  required
                >
                  <option value="">Pilih nomor rak...</option>
                  {NOMOR_RAK_OPTIONS.map((rak) => (
                    <option key={rak} value={rak}>{rak}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Sub Rak *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.sub_rak}
                  onChange={(e) => setFormData({ ...formData, sub_rak: e.target.value })}
                  required
                >
                  <option value="">Pilih sub rak...</option>
                  {SUB_RAK_OPTIONS.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Susun *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.susun}
                  onChange={(e) => setFormData({ ...formData, susun: e.target.value })}
                  required
                >
                  <option value="">Pilih susun...</option>
                  {SUSUN_OPTIONS.map((susun) => (
                    <option key={susun} value={susun}>{susun}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Baris *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.baris}
                  onChange={(e) => setFormData({ ...formData, baris: e.target.value })}
                  required
                >
                  <option value="">Pilih baris...</option>
                  {BARIS_OPTIONS.map((baris) => (
                    <option key={baris} value={baris}>{baris}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Geotag (Otomatis)</Label>
                <Input
                  value={`${formData.nomor_rak}${formData.sub_rak}${formData.susun}${formData.baris}`}
                  readOnly
                  className="font-mono font-bold bg-muted"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editData ? "Update" : "Simpan"} Data
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
