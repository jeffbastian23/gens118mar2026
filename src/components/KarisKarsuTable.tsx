import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Download, Upload, Search, Loader2, Users, Filter } from "lucide-react";
import * as XLSX from "xlsx";

interface KarisKarsuData {
  id: string;
  no: number;
  nama: string;
  nip: string;
  satuan_kerja: string;
  nama_pasangan: string | null;
  nomor_nd_pengajuan: string | null;
  tanggal_pengajuan: string | null;
  tanggal_input_si_asn: string | null;
  tanggal_karis_karsu_terbit: string | null;
  pic: string | null;
  created_at: string;
}

export default function KarisKarsuTable() {
  const { role } = useAuth();
  const isAdmin = role === "admin" || role === "super";
  const [data, setData] = useState<KarisKarsuData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPic, setFilterPic] = useState("all");
  const [filterSatker, setFilterSatker] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KarisKarsuData | null>(null);
  const [form, setForm] = useState({
    nama: "", nip: "", satuan_kerja: "", nama_pasangan: "",
    nomor_nd_pengajuan: "", tanggal_pengajuan: "", tanggal_input_si_asn: "",
    tanggal_karis_karsu_terbit: "", pic: "",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: result, error } = await supabase
      .from("karis_karsu")
      .select("*")
      .order("tanggal_karis_karsu_terbit", { ascending: true, nullsFirst: false });
    if (error) { toast.error("Gagal memuat data"); console.error(error); }
    else setData(result || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.nama || !form.nip || !form.satuan_kerja) {
      toast.error("Nama, NIP, dan Satuan Kerja wajib diisi");
      return;
    }
    const payload = {
      nama: form.nama, nip: form.nip, satuan_kerja: form.satuan_kerja,
      nama_pasangan: form.nama_pasangan || null,
      nomor_nd_pengajuan: form.nomor_nd_pengajuan || null,
      tanggal_pengajuan: form.tanggal_pengajuan || null,
      tanggal_input_si_asn: form.tanggal_input_si_asn || null,
      tanggal_karis_karsu_terbit: form.tanggal_karis_karsu_terbit || null,
      pic: form.pic || null,
    };
    if (selectedItem) {
      const { error } = await supabase.from("karis_karsu").update(payload).eq("id", selectedItem.id);
      if (error) { toast.error("Gagal mengupdate data"); return; }
      toast.success("Data berhasil diupdate");
    } else {
      const { error } = await supabase.from("karis_karsu").insert(payload);
      if (error) { toast.error("Gagal menambah data"); return; }
      toast.success("Data berhasil ditambahkan");
    }
    setShowDialog(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    const { error } = await supabase.from("karis_karsu").delete().eq("id", selectedItem.id);
    if (error) { toast.error("Gagal menghapus data"); return; }
    toast.success("Data berhasil dihapus");
    setShowDeleteDialog(false);
    setSelectedItem(null);
    fetchData();
  };

  const handleDeleteAll = async () => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk dihapus");
      return;
    }
    const { error } = await supabase.from("karis_karsu").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) { toast.error("Gagal menghapus semua data"); return; }
    toast.success("Semua data berhasil dihapus");
    fetchData();
  };

  const resetForm = () => {
    setForm({ nama: "", nip: "", satuan_kerja: "", nama_pasangan: "", nomor_nd_pengajuan: "", tanggal_pengajuan: "", tanggal_input_si_asn: "", tanggal_karis_karsu_terbit: "", pic: "" });
    setSelectedItem(null);
  };

  const openEdit = (item: KarisKarsuData) => {
    setSelectedItem(item);
    setForm({
      nama: item.nama, nip: item.nip, satuan_kerja: item.satuan_kerja,
      nama_pasangan: item.nama_pasangan || "", nomor_nd_pengajuan: item.nomor_nd_pengajuan || "",
      tanggal_pengajuan: item.tanggal_pengajuan || "", tanggal_input_si_asn: item.tanggal_input_si_asn || "",
      tanggal_karis_karsu_terbit: item.tanggal_karis_karsu_terbit || "", pic: item.pic || "",
    });
    setShowDialog(true);
  };

  // Unique values for filters
  const uniquePics = [...new Set(data.map(d => d.pic).filter(Boolean))] as string[];
  const uniqueSatkers = [...new Set(data.map(d => d.satuan_kerja).filter(Boolean))].sort();

  const filtered = data.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.nama.toLowerCase().includes(q) || d.nip.includes(q) || d.satuan_kerja.toLowerCase().includes(q) || (d.nama_pasangan?.toLowerCase().includes(q));
    const matchPic = filterPic === "all" || d.pic === filterPic;
    const matchSatker = filterSatker === "all" || d.satuan_kerja === filterSatker;
    let matchDate = true;
    if (dateFrom && d.tanggal_karis_karsu_terbit) {
      matchDate = d.tanggal_karis_karsu_terbit >= dateFrom;
    } else if (dateFrom && !d.tanggal_karis_karsu_terbit) {
      matchDate = false;
    }
    if (dateTo && d.tanggal_karis_karsu_terbit) {
      matchDate = matchDate && d.tanggal_karis_karsu_terbit <= dateTo;
    } else if (dateTo && !d.tanggal_karis_karsu_terbit) {
      matchDate = false;
    }
    return matchSearch && matchPic && matchSatker && matchDate;
  });

  const handleExport = () => {
    const exportData = filtered.map((d, i) => ({
      No: i + 1, Nama: d.nama, NIP: d.nip, "Satuan Kerja": d.satuan_kerja,
      "Nama Pasangan": d.nama_pasangan || "", "Nomor ND Pengajuan": d.nomor_nd_pengajuan || "",
      "Tanggal Pengajuan": d.tanggal_pengajuan || "", "Tanggal Input pada SI ASN": d.tanggal_input_si_asn || "",
      "Tanggal KARIS/KARSU terbit": d.tanggal_karis_karsu_terbit || "", PIC: d.pic || "",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Karis Karsu");
    XLSX.writeFile(wb, "data_karis_karsu.xlsx");
    toast.success("Data berhasil diekspor");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(ws);
      let count = 0;
      for (const row of jsonData) {
        const nama = row["Nama"]?.toString().trim();
        const nip = row["NIP"]?.toString().trim();
        const satuan_kerja = row["Satuan Kerja"]?.toString().trim();
        if (!nama || !nip || !satuan_kerja) continue;
        const { error } = await supabase.from("karis_karsu").insert({
          nama, nip, satuan_kerja,
          nama_pasangan: row["Nama Pasangan"]?.toString().trim() || null,
          nomor_nd_pengajuan: row["Nomor ND Pengajuan"]?.toString().trim() || null,
          tanggal_pengajuan: row["Tanggal Pengajuan"]?.toString().trim() || null,
          tanggal_input_si_asn: row["Tanggal Input pada SI ASN"]?.toString().trim() || null,
          tanggal_karis_karsu_terbit: row["Tanggal KARIS/KARSU terbit"]?.toString().trim() || null,
          pic: row["PIC"]?.toString().trim() || null,
        });
        if (!error) count++;
      }
      toast.success(`${count} data berhasil diimport`);
      fetchData();
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return d;
      return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    } catch { return d; }
  };

  const getStatusPelaporan = (item: KarisKarsuData) => {
    // If already completed, show green "Selesai"
    if (item.tanggal_karis_karsu_terbit) {
      return { label: "Selesai", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", dot: "bg-green-500" };
    }
    // Use tanggal_pengajuan as reference date for marriage reporting timeline
    if (!item.tanggal_pengajuan) {
      return { label: "Belum ada data", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" };
    }
    const pengajuan = new Date(item.tanggal_pengajuan);
    const now = new Date();
    const diffMs = now.getTime() - pengajuan.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);

    if (diffMonths <= 4) {
      return { label: `${Math.floor(diffMonths)} bln - Aman`, color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", dot: "bg-green-500" };
    } else if (diffMonths <= 7) {
      return { label: `${Math.floor(diffMonths)} bln - Perhatian`, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", dot: "bg-yellow-500" };
    } else if (diffMonths <= 12) {
      return { label: `${Math.floor(diffMonths)} bln - Mendesak`, color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" };
    } else {
      return { label: `${Math.floor(diffMonths)} bln - Terlewat!`, color: "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300", dot: "bg-red-600" };
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Data Karis/Karsu
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari nama, NIP..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-[200px]" />
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export</Button>
            {isAdmin && (
              <>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteAllDialog(true)}><Trash2 className="h-4 w-4 mr-1" />Hapus Semua</Button>
                <div className="relative">
                  <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" />Import</Button>
                </div>
                <Button size="sm" onClick={() => { resetForm(); setShowDialog(true); }}><Plus className="h-4 w-4 mr-1" />Tambah</Button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 mt-4">
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          </div>
          <div className="w-[180px]">
            <Label className="text-xs text-muted-foreground">PIC</Label>
            <Select value={filterPic} onValueChange={setFilterPic}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Semua PIC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua PIC</SelectItem>
                {uniquePics.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[200px]">
            <Label className="text-xs text-muted-foreground">Satuan Kerja</Label>
            <Select value={filterSatker} onValueChange={setFilterSatker}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Semua Satuan Kerja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Satuan Kerja</SelectItem>
                {uniqueSatkers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tgl Terbit Dari</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs w-[140px]" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tgl Terbit Sampai</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs w-[140px]" />
          </div>
          {(filterPic !== "all" || filterSatker !== "all" || dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterPic("all"); setFilterSatker("all"); setDateFrom(""); setDateTo(""); }}>
              Reset Filter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Satuan Kerja</TableHead>
                  <TableHead>Nama Pasangan</TableHead>
                  <TableHead>Status Pelaporan</TableHead>
                  <TableHead>Nomor ND Pengajuan</TableHead>
                  <TableHead>Tgl Pengajuan</TableHead>
                  <TableHead>Tgl Input SI ASN</TableHead>
                  <TableHead>Tgl KARIS/KARSU Terbit</TableHead>
                  <TableHead>PIC</TableHead>
                  {isAdmin && <TableHead className="text-center">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={isAdmin ? 12 : 11} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
                ) : filtered.map((item, idx) => {
                  const status = getStatusPelaporan(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{item.nama}</TableCell>
                      <TableCell>{item.nip}</TableCell>
                      <TableCell>{item.satuan_kerja}</TableCell>
                      <TableCell>{item.nama_pasangan || "-"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell>{item.nomor_nd_pengajuan || "-"}</TableCell>
                      <TableCell>{formatDate(item.tanggal_pengajuan)}</TableCell>
                      <TableCell>{formatDate(item.tanggal_input_si_asn)}</TableCell>
                      <TableCell>{formatDate(item.tanggal_karis_karsu_terbit)}</TableCell>
                      <TableCell>{item.pic || "-"}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(item); setShowDeleteDialog(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedItem ? "Edit Data" : "Tambah Data"} Karis/Karsu</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div><Label>Nama *</Label><Input value={form.nama} onChange={(e) => setForm(f => ({ ...f, nama: e.target.value }))} /></div>
            <div><Label>NIP *</Label><Input value={form.nip} onChange={(e) => setForm(f => ({ ...f, nip: e.target.value }))} /></div>
            <div><Label>Satuan Kerja *</Label><Input value={form.satuan_kerja} onChange={(e) => setForm(f => ({ ...f, satuan_kerja: e.target.value }))} /></div>
            <div><Label>Nama Pasangan</Label><Input value={form.nama_pasangan} onChange={(e) => setForm(f => ({ ...f, nama_pasangan: e.target.value }))} /></div>
            <div><Label>Nomor ND Pengajuan</Label><Input value={form.nomor_nd_pengajuan} onChange={(e) => setForm(f => ({ ...f, nomor_nd_pengajuan: e.target.value }))} /></div>
            <div><Label>Tanggal Pengajuan</Label><Input type="date" value={form.tanggal_pengajuan} onChange={(e) => setForm(f => ({ ...f, tanggal_pengajuan: e.target.value }))} /></div>
            <div><Label>Tanggal Input pada SI ASN</Label><Input type="date" value={form.tanggal_input_si_asn} onChange={(e) => setForm(f => ({ ...f, tanggal_input_si_asn: e.target.value }))} /></div>
            <div><Label>Tanggal KARIS/KARSU Terbit</Label><Input type="date" value={form.tanggal_karis_karsu_terbit} onChange={(e) => setForm(f => ({ ...f, tanggal_karis_karsu_terbit: e.target.value }))} /></div>
            <div>
              <Label>PIC</Label>
              <Select value={form.pic} onValueChange={(val) => setForm(f => ({ ...f, pic: val }))}>
                <SelectTrigger><SelectValue placeholder="Pilih PIC" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Duana Jerry Pahlawan">Duana Jerry Pahlawan</SelectItem>
                  <SelectItem value="Fakhrunnisa">Fakhrunnisa</SelectItem>
                  <SelectItem value="Izdhihar Rayhanah">Izdhihar Rayhanah</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave}>{selectedItem ? "Update" : "Simpan"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin menghapus data {selectedItem?.nama}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin menghapus SEMUA {data.length} data Karis/Karsu? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus Semua</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
