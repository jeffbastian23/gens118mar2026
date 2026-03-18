import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database, Plus, Pencil, Trash2, Search, RefreshCw } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { ExcelToolbar, exportToExcel } from "./CorebaseExcelUtils";
import { fetchAllRows, cleanNama, cleanNip, calculateTmtCpnsFromNip, calculateTmtPnsFromNip, determineGenderFromNip } from "./CorebaseFetchUtils";
interface CorebaseDbPokok {
  id: string;
  no_reg: number;
  nama: string;
  nip: string;
  tempat_lahir: string | null;
  tgl_lahir: string | null;
  tmt_cpns: string | null;
  cek_tmt_cpns: string | null;
  automasi_cek_tmt_cpns: string | null;
  tmt_pns: string | null;
  agama: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
}

interface CorebaseDbPokokTabProps {
  isAdmin: boolean;
  canEdit: boolean;
}

export default function CorebaseDbPokokTab({ isAdmin, canEdit }: CorebaseDbPokokTabProps) {
  const [data, setData] = useState<CorebaseDbPokok[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUsiaMin, setFilterUsiaMin] = useState("");
  const [filterUsiaMax, setFilterUsiaMax] = useState("");
  const [filterCpnsMin, setFilterCpnsMin] = useState("");
  const [filterCpnsMax, setFilterCpnsMax] = useState("");
  const [filterPnsMin, setFilterPnsMin] = useState("");
  const [filterPnsMax, setFilterPnsMax] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterAgama, setFilterAgama] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CorebaseDbPokok | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    tempat_lahir: "",
    tgl_lahir: "",
    tmt_cpns: "",
    tmt_pns: "",
    agama: "",
    gender: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const result = await fetchAllRows<CorebaseDbPokok>("corebase_db_pokok", "nama", true);
      setData(result);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data DB Pokok");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      let synced = 0;
      for (const item of data) {
        const cleanedNama = cleanNama(item.nama);
        const cleanedNip = cleanNip(item.nip);
        const tmtCpns = calculateTmtCpnsFromNip(cleanedNip);
        const tmtPns = calculateTmtPnsFromNip(cleanedNip);
        const gender = determineGenderFromNip(cleanedNip);

        // Convert tempat_lahir to Proper Case
        const toProperCase = (text: string | null): string | null => {
          if (!text) return text;
          return text.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        };
        const properTempatLahir = toProperCase(item.tempat_lahir);

        const updates: any = {};
        if (cleanedNama !== item.nama) updates.nama = cleanedNama;
        if (cleanedNip !== item.nip) updates.nip = cleanedNip;
        if (tmtCpns && tmtCpns !== item.tmt_cpns) updates.tmt_cpns = tmtCpns;
        if (tmtPns && tmtPns !== item.tmt_pns) updates.tmt_pns = tmtPns;
        if (gender && gender !== item.gender) updates.gender = gender;
        if (properTempatLahir && properTempatLahir !== item.tempat_lahir) updates.tempat_lahir = properTempatLahir;

        // Also update cek_tmt_cpns
        if (cleanedNip.length >= 14) {
          const cekTmt = checkTmtCpns(cleanedNip);
          if (cekTmt !== item.cek_tmt_cpns) {
            updates.cek_tmt_cpns = cekTmt;
            updates.automasi_cek_tmt_cpns = cekTmt;
          }
        }

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase.from("corebase_db_pokok").update(updates).eq("id", item.id);
          if (!error) synced++;
        }
      }
      toast.success(`Sync selesai! ${synced} data diperbarui.`);
      await fetchData();
    } catch (error: any) {
      console.error("Sync error:", error);
      toast.error("Gagal melakukan sync");
    } finally {
      setSyncing(false);
    }
  };

  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), new Date(birthDate));
  };


  const checkTmtCpns = (nip: string): string => {
    if (nip.length >= 8) {
      const tmtPart = nip.substring(8, 14);
      const year = parseInt("19" + tmtPart.substring(0, 2));
      const month = parseInt(tmtPart.substring(2, 4));
      const tmtDate = new Date(year > 50 ? year : year + 100, month - 1, 1);
      const cutoffDate = new Date(2020, 1, 1);
      return tmtDate < cutoffDate ? "< 1 Feb 2020" : ">= 1 Feb 2020";
    }
    return "-";
  };

  const handleSubmit = async () => {
    try {
      const cleanedNip = cleanNip(formData.nip);
      const gender = formData.gender || determineGenderFromNip(cleanedNip);
      const cekTmt = checkTmtCpns(cleanedNip);
      const tmtCpns = formData.tmt_cpns || calculateTmtCpnsFromNip(cleanedNip);
      const tmtPns = formData.tmt_pns || calculateTmtPnsFromNip(cleanedNip);

      const payload = {
        nama: formData.nama,
        nip: cleanedNip,
        tempat_lahir: formData.tempat_lahir || null,
        tgl_lahir: formData.tgl_lahir || null,
        tmt_cpns: tmtCpns || null,
        cek_tmt_cpns: cekTmt,
        automasi_cek_tmt_cpns: cekTmt,
        tmt_pns: tmtPns || null,
        agama: formData.agama || null,
        gender: gender || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("corebase_db_pokok")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("corebase_db_pokok")
          .insert(payload);
        if (error) throw error;
        toast.success("Data berhasil ditambahkan");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error saving data:", error);
      toast.error(error.message || "Gagal menyimpan data");
    }
  };

  const handleEdit = (item: CorebaseDbPokok) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama,
      nip: item.nip,
      tempat_lahir: item.tempat_lahir || "",
      tgl_lahir: item.tgl_lahir || "",
      tmt_cpns: item.tmt_cpns || "",
      tmt_pns: item.tmt_pns || "",
      agama: item.agama || "",
      gender: item.gender || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      const { error } = await supabase.from("corebase_db_pokok").delete().eq("id", id);
      if (error) throw error;
      toast.success("Data berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menghapus data");
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      nama: "",
      nip: "",
      tempat_lahir: "",
      tgl_lahir: "",
      tmt_cpns: "",
      tmt_pns: "",
      agama: "",
      gender: "",
    });
  };

  const handleExport = () => {
    const columns = [
      { key: "no_reg", label: "No Reg" },
      { key: "nama", label: "Nama" },
      { key: "nip", label: "NIP" },
      { key: "tempat_lahir", label: "Tempat Lahir" },
      { key: "tgl_lahir", label: "Tanggal Lahir" },
      { key: "tmt_cpns", label: "TMT CPNS" },
      { key: "cek_tmt_cpns", label: "Cek TMT CPNS" },
      { key: "tmt_pns", label: "TMT PNS" },
      { key: "agama", label: "Agama" },
      { key: "gender", label: "Gender" },
    ];
    exportToExcel(data, columns, "db_pokok");
  };

  const handleImport = async (jsonData: any[]) => {
    try {
      // Build all records with auto-numbered no_reg
      const records = jsonData.map((row, index) => {
        const rawNip = String(row["NIP"] || "");
        const nipClean = cleanNip(rawNip);
        const gender = determineGenderFromNip(nipClean);
        const tmtCpns = calculateTmtCpnsFromNip(nipClean);
        const tmtPns = calculateTmtPnsFromNip(nipClean);
        return {
          no_reg: index + 1,
          nama: row["Nama"] || "",
          nip: nipClean,
          tempat_lahir: row["Tempat Lahir"] || null,
          tgl_lahir: row["Tanggal Lahir"] || null,
          tmt_cpns: row["TMT CPNS"] || tmtCpns || null,
          cek_tmt_cpns: row["Cek TMT CPNS"] || (nipClean.length >= 14 ? checkTmtCpns(nipClean) : null),
          tmt_pns: row["TMT PNS"] || tmtPns || null,
          agama: row["Agama"] || null,
          gender: row["Gender"] || gender || null,
        };
      });

      // Insert in batches of 100 for performance
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from("corebase_db_pokok").upsert(batch, { onConflict: "nip" });
        if (error) throw error;
      }

      toast.success(`${records.length} data berhasil diimpor`);
      fetchData();
    } catch (error: any) {
      console.error("Error importing data:", error);
      toast.error("Gagal mengimpor data: " + (error.message || ""));
    }
  };

  const handleDeleteAll = async () => {
    try {
      const { error } = await supabase.from("corebase_db_pokok").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("Semua data berhasil dihapus");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting all data:", error);
      toast.error("Gagal menghapus semua data");
    }
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || item.nip.includes(searchTerm);
    if (!matchSearch) return false;

    // Usia filter
    const age = calculateAge(item.tgl_lahir);
    if (filterUsiaMin && (age === null || age < parseInt(filterUsiaMin))) return false;
    if (filterUsiaMax && (age === null || age > parseInt(filterUsiaMax))) return false;

    // Tahun CPNS filter
    if (filterCpnsMin || filterCpnsMax) {
      const cpnsYear = item.tmt_cpns ? new Date(item.tmt_cpns).getFullYear() : null;
      if (filterCpnsMin && (cpnsYear === null || cpnsYear < parseInt(filterCpnsMin))) return false;
      if (filterCpnsMax && (cpnsYear === null || cpnsYear > parseInt(filterCpnsMax))) return false;
    }

    // Tahun PNS filter
    if (filterPnsMin || filterPnsMax) {
      const pnsYear = item.tmt_pns ? new Date(item.tmt_pns).getFullYear() : null;
      if (filterPnsMin && (pnsYear === null || pnsYear < parseInt(filterPnsMin))) return false;
      if (filterPnsMax && (pnsYear === null || pnsYear > parseInt(filterPnsMax))) return false;
    }

    // Gender filter
    if (filterGender && filterGender !== "all" && item.gender !== filterGender) return false;

    // Agama filter
    if (filterAgama && filterAgama !== "all" && item.agama !== filterAgama) return false;

    return true;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            DB Pokok
            <Badge variant="secondary" className="ml-2">Total: {data.length}</Badge>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync"}
              </Button>
            )}
            <ExcelToolbar
              onExport={handleExport}
              onImport={handleImport}
              onDeleteAll={handleDeleteAll}
              canEdit={canEdit}
              tableName="DB Pokok"
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama/NIP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            {canEdit && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? "Edit Data" : "Tambah Data Baru"}</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Nama *</Label>
                      <Input
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>NIP *</Label>
                      <Input
                        value={formData.nip}
                        onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tempat Lahir</Label>
                      <Input
                        value={formData.tempat_lahir}
                        onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Lahir</Label>
                      <Input
                        type="date"
                        value={formData.tgl_lahir}
                        onChange={(e) => setFormData({ ...formData, tgl_lahir: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>TMT CPNS</Label>
                      <Input
                        type="date"
                        value={formData.tmt_cpns}
                        onChange={(e) => setFormData({ ...formData, tmt_cpns: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>TMT PNS</Label>
                      <Input
                        type="date"
                        value={formData.tmt_pns}
                        onChange={(e) => setFormData({ ...formData, tmt_pns: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Agama</Label>
                      <Select value={formData.agama} onValueChange={(v) => setFormData({ ...formData, agama: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih agama" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Islam">Islam</SelectItem>
                          <SelectItem value="Kristen">Kristen</SelectItem>
                          <SelectItem value="Katolik">Katolik</SelectItem>
                          <SelectItem value="Hindu">Hindu</SelectItem>
                          <SelectItem value="Buddha">Buddha</SelectItem>
                          <SelectItem value="Konghucu">Konghucu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Otomatis dari NIP" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pria">Pria</SelectItem>
                          <SelectItem value="Wanita">Wanita</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                    <Button onClick={handleSubmit}>Simpan</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Row */}
        <div className="flex flex-wrap items-end gap-3 mb-4 p-3 bg-muted/30 rounded-lg border">
          <div className="space-y-1">
            <Label className="text-xs">Usia (Min-Max)</Label>
            <div className="flex gap-1">
              <Input type="number" placeholder="Min" value={filterUsiaMin} onChange={(e) => setFilterUsiaMin(e.target.value)} className="w-16 h-8 text-xs" />
              <Input type="number" placeholder="Max" value={filterUsiaMax} onChange={(e) => setFilterUsiaMax(e.target.value)} className="w-16 h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tahun CPNS (Min-Max)</Label>
            <div className="flex gap-1">
              <Input type="number" placeholder="Min" value={filterCpnsMin} onChange={(e) => setFilterCpnsMin(e.target.value)} className="w-20 h-8 text-xs" />
              <Input type="number" placeholder="Max" value={filterCpnsMax} onChange={(e) => setFilterCpnsMax(e.target.value)} className="w-20 h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tahun PNS (Min-Max)</Label>
            <div className="flex gap-1">
              <Input type="number" placeholder="Min" value={filterPnsMin} onChange={(e) => setFilterPnsMin(e.target.value)} className="w-20 h-8 text-xs" />
              <Input type="number" placeholder="Max" value={filterPnsMax} onChange={(e) => setFilterPnsMax(e.target.value)} className="w-20 h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Gender</Label>
            <Select value={filterGender} onValueChange={setFilterGender}>
              <SelectTrigger className="w-24 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="Pria">Pria</SelectItem>
                <SelectItem value="Wanita">Wanita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Agama</Label>
            <Select value={filterAgama} onValueChange={setFilterAgama}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="Islam">Islam</SelectItem>
                <SelectItem value="Kristen">Kristen</SelectItem>
                <SelectItem value="Katolik">Katolik</SelectItem>
                <SelectItem value="Hindu">Hindu</SelectItem>
                <SelectItem value="Buddha">Buddha</SelectItem>
                <SelectItem value="Konghucu">Konghucu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterUsiaMin(""); setFilterUsiaMax(""); setFilterCpnsMin(""); setFilterCpnsMax(""); setFilterPnsMin(""); setFilterPnsMax(""); setFilterGender(""); setFilterAgama(""); }}>
            Reset Filter
          </Button>
          <Badge variant="outline" className="h-8 flex items-center text-xs">Hasil: {filteredData.length}</Badge>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">No Reg</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>TTL</TableHead>
                <TableHead className="text-center">Usia</TableHead>
                <TableHead>TMT CPNS</TableHead>
                <TableHead>Cek TMT</TableHead>
                <TableHead>TMT PNS</TableHead>
                <TableHead>Agama</TableHead>
                <TableHead>Gender</TableHead>
                {canEdit && <TableHead className="text-center">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 11 : 10} className="text-center py-8 text-muted-foreground">
                    Belum ada data.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.no_reg}</TableCell>
                    <TableCell className="font-medium">{item.nama}</TableCell>
                    <TableCell className="font-mono text-sm">{item.nip}</TableCell>
                    <TableCell className="text-sm">
                      {item.tempat_lahir && item.tgl_lahir
                        ? `${item.tempat_lahir}, ${format(new Date(item.tgl_lahir), "dd/MM/yyyy")}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {calculateAge(item.tgl_lahir) ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.tmt_cpns ? format(new Date(item.tmt_cpns), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.cek_tmt_cpns?.includes("<") ? "default" : "secondary"}>
                        {item.cek_tmt_cpns || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.tmt_pns ? format(new Date(item.tmt_pns), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell>{item.agama || "-"}</TableCell>
                    <TableCell>{item.gender || "-"}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
