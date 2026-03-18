import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Download, Plus, Trash2, Search, Database, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface KenaikanPangkatRow {
  id: string;
  nama_pegawai: string;
  uraian_pangkat: string | null;
  nip: string | null;
  unit: string | null;
  jenis: string | null;
  tmt_pangkat: string | null;
  created_at: string;
}

interface OlahDataKenaikanPangkatTabProps {
  isAdmin: boolean;
  canEdit: boolean;
}

export default function OlahDataKenaikanPangkatTab({ isAdmin, canEdit }: OlahDataKenaikanPangkatTabProps) {
  const [data, setData] = useState<KenaikanPangkatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({ nama_pegawai: "", uraian_pangkat: "", nip: "", unit: "", jenis: "", tmt_pangkat: "" });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: result, error } = await supabase
        .from("kenaikan_pangkat_data")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setData(result || []);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.nama_pegawai.trim()) { toast.error("Nama pegawai wajib diisi"); return; }
    try {
      const { error } = await supabase.from("kenaikan_pangkat_data").insert([{
        nama_pegawai: formData.nama_pegawai,
        uraian_pangkat: formData.uraian_pangkat || null,
        nip: formData.nip || null,
        unit: formData.unit || null,
        jenis: formData.jenis || null,
        tmt_pangkat: formData.tmt_pangkat || null,
      }]);
      if (error) throw error;
      toast.success("Data berhasil ditambahkan");
      setShowAddDialog(false);
      setFormData({ nama_pegawai: "", uraian_pangkat: "", nip: "", unit: "", jenis: "", tmt_pangkat: "" });
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menambah data: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) { toast.error("Pilih data yang akan dihapus"); return; }
    if (!confirm(`Hapus ${selectedIds.length} data terpilih?`)) return;
    try {
      const { error } = await supabase.from("kenaikan_pangkat_data").delete().in("id", selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} data berhasil dihapus`);
      setSelectedIds([]);
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menghapus data");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any>(ws);

        const rows = jsonData.map((row: any) => ({
          nama_pegawai: row["NmPegawai"] || row["nama_pegawai"] || "",
          uraian_pangkat: row["UraianPangkat"] || row["uraian_pangkat"] || null,
          nip: row["Nip"] || row["nip"] || null,
          unit: row["NmUnitOrganisasi"] || row["unit"] || null,
          jenis: row["NmJenisJabatan"] || row["jenis"] || null,
          tmt_pangkat: row["TmtPangkat"] || row["tmt_pangkat"] || null,
        })).filter((r: any) => r.nama_pegawai);

        if (rows.length === 0) { toast.error("Tidak ada data valid ditemukan"); return; }

        // Insert in batches of 100
        for (let i = 0; i < rows.length; i += 100) {
          const batch = rows.slice(i, i + 100);
          const { error } = await supabase.from("kenaikan_pangkat_data").insert(batch);
          if (error) throw error;
        }

        toast.success(`${rows.length} data berhasil diimport`);
        fetchData();
      } catch (error: any) {
        toast.error("Gagal import: " + error.message);
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExport = () => {
    const exportData = filteredData.map((row, i) => ({
      "No": i + 1,
      "NmPegawai": row.nama_pegawai,
      "UraianPangkat": row.uraian_pangkat || "",
      "Nip": row.nip || "",
      "NmUnitOrganisasi": row.unit || "",
      "NmJenisJabatan": row.jenis || "",
      "TmtPangkat": row.tmt_pangkat || "",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Kenaikan Pangkat");
    XLSX.writeFile(wb, "Data_Kenaikan_Pangkat.xlsx");
    toast.success("Data berhasil diexport");
  };

  const filteredData = data.filter(row =>
    !search || [row.nama_pegawai, row.nip, row.unit, row.jenis, row.uraian_pangkat]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === filteredData.length ? [] : filteredData.map(r => r.id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Olah Data Kenaikan Pangkat
          <Badge variant="secondary" className="ml-2">Total: {data.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari nama, NIP, unit..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {canEdit && (
              <>
                <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
                  <Plus className="h-4 w-4" /> Tambah
                </Button>
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-1">
                  <Upload className="h-4 w-4" /> Import Excel
                </Button>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
              </>
            )}
            <Button size="sm" variant="outline" onClick={handleExport} className="gap-1">
              <Download className="h-4 w-4" /> Export Excel
            </Button>
            {canEdit && selectedIds.length > 0 && (
              <Button size="sm" variant="destructive" onClick={handleDelete} className="gap-1">
                <Trash2 className="h-4 w-4" /> Hapus ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-md border overflow-auto max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                {canEdit && (
                  <TableHead className="w-10">
                    <input type="checkbox" checked={selectedIds.length === filteredData.length && filteredData.length > 0} onChange={toggleSelectAll} />
                  </TableHead>
                )}
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama Pegawai</TableHead>
                <TableHead>Uraian Pangkat</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>TMT Pangkat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Memuat data...</TableCell></TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Belum ada data.</TableCell></TableRow>
              ) : (
                filteredData.map((row, idx) => (
                  <TableRow key={row.id}>
                    {canEdit && (
                      <TableCell>
                        <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} />
                      </TableCell>
                    )}
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{row.nama_pegawai}</TableCell>
                    <TableCell>{row.uraian_pangkat || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{row.nip || "-"}</TableCell>
                    <TableCell className="text-sm">{row.unit || "-"}</TableCell>
                    <TableCell>{row.jenis || "-"}</TableCell>
                    <TableCell>{row.tmt_pangkat || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Data Kenaikan Pangkat</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Nama Pegawai *</Label><Input value={formData.nama_pegawai} onChange={e => setFormData(p => ({ ...p, nama_pegawai: e.target.value }))} /></div>
              <div><Label>Uraian Pangkat</Label><Input value={formData.uraian_pangkat} onChange={e => setFormData(p => ({ ...p, uraian_pangkat: e.target.value }))} /></div>
              <div><Label>NIP</Label><Input value={formData.nip} onChange={e => setFormData(p => ({ ...p, nip: e.target.value }))} /></div>
              <div><Label>Unit</Label><Input value={formData.unit} onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))} /></div>
              <div><Label>Jenis Jabatan</Label><Input value={formData.jenis} onChange={e => setFormData(p => ({ ...p, jenis: e.target.value }))} /></div>
              <div><Label>TMT Pangkat</Label><Input value={formData.tmt_pangkat} onChange={e => setFormData(p => ({ ...p, tmt_pangkat: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Batal</Button>
              <Button onClick={handleAdd}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
