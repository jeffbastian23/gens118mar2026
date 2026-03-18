import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Plus, Trash2, FileDown, Upload, Edit, Search, Check, X as XIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExistingData {
  id: string;
  no_urut: number | null;
  nip: string | null;
  nama_lengkap: string;
  agama: string | null;
  jabatan: string | null;
  eselon_iii: string | null;
  domain_kemenkeu: string | null;
  kontak: string | null;
  check_wag_kanwil: string | null;
  check_wa_info: string | null;
  check_wa_bintal: string | null;
  check_teams_kanwil: string | null;
}

interface JapriTemanExistingTabProps {
  isAdmin: boolean;
  isSuper?: boolean;
}

export default function JapriTemanExistingTab({ isAdmin, isSuper }: JapriTemanExistingTabProps) {
  const canManage = isAdmin || isSuper;
  const { toast } = useToast();
  const [data, setData] = useState<ExistingData[]>([]);
  const [filteredData, setFilteredData] = useState<ExistingData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEselonIII, setFilterEselonIII] = useState("");
  const [filterAgama, setFilterAgama] = useState("");
  const [filterJabatan, setFilterJabatan] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<ExistingData | null>(null);
  const [formData, setFormData] = useState({
    nip: "", nama_lengkap: "", agama: "", jabatan: "", eselon_iii: "",
    domain_kemenkeu: "", kontak: "", check_wag_kanwil: "", check_wa_info: "",
    check_wa_bintal: "", check_teams_kanwil: "",
  });

  useEffect(() => { fetchData(); }, []);

  // Compute unique filter options
  const filterOptions = useMemo(() => ({
    eselonIII: [...new Set(data.map(d => d.eselon_iii).filter(Boolean))].sort() as string[],
    agama: [...new Set(data.map(d => d.agama).filter(Boolean))].sort() as string[],
    jabatan: [...new Set(data.map(d => d.jabatan).filter(Boolean))].sort() as string[],
  }), [data]);

  useEffect(() => {
    let filtered = data;
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        Object.values(item).some((v) => String(v || "").toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterEselonIII) {
      filtered = filtered.filter(item => item.eselon_iii === filterEselonIII);
    }
    if (filterAgama) {
      filtered = filtered.filter(item => item.agama === filterAgama);
    }
    if (filterJabatan) {
      filtered = filtered.filter(item => item.jabatan === filterJabatan);
    }
    setFilteredData(filtered);
  }, [searchTerm, data, filterEselonIII, filterAgama, filterJabatan]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let allData: ExistingData[] = [];
      let page = 0;
      const pageSize = 1000;
      while (true) {
        const { data: d, error } = await (supabase as any)
          .from("japri_teman_existing")
          .select("*")
          .order("no_urut", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw error;
        if (!d || d.length === 0) break;
        allData = [...allData, ...d];
        if (d.length < pageSize) break;
        page++;
      }
      setData(allData);
    } catch (error) {
      console.error("Error fetching:", error);
      toast({ title: "Error", description: "Gagal memuat data existing", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      data.map((item, idx) => ({
        "No": idx + 1,
        "NIP": item.nip || "",
        "Nama Lengkap": item.nama_lengkap,
        "Agama": item.agama || "",
        "Jabatan": item.jabatan || "",
        "Eselon III": item.eselon_iii || "",
        "Domain Kemenkeu": item.domain_kemenkeu || "",
        "Kontak": item.kontak || "",
        "Check WAG Kanwil": item.check_wag_kanwil || "",
        "Check WA INFO": item.check_wa_info || "",
        "Check WA Bintal": item.check_wa_bintal || "",
        "Check Teams Kanwil": item.check_teams_kanwil || "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Existing");
    XLSX.writeFile(wb, "japri_teman_existing.xlsx");
    toast({ title: "Berhasil", description: `${data.length} data berhasil diexport` });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws) as any[];

        let successCount = 0, errorCount = 0;
        const { data: maxData } = await (supabase as any)
          .from("japri_teman_existing").select("no_urut").order("no_urut", { ascending: false }).limit(1).single();
        let nextNoUrut = (maxData?.no_urut || 0) + 1;

        const batchSize = 50;
        for (let i = 0; i < jsonData.length; i += batchSize) {
          const batch = jsonData.slice(i, i + batchSize).map((row: any) => ({
            no_urut: nextNoUrut++,
            nip: String(row["NIP"] || "").replace(/^'/, "").trim() || null,
            nama_lengkap: String(row["Nama Lengkap"] || "").trim(),
            agama: String(row["Agama"] || "").trim() || null,
            jabatan: String(row["Jabatan"] || "").trim() || null,
            eselon_iii: String(row["Eselon III"] || "").trim() || null,
            domain_kemenkeu: String(row["Domain Kemenkeu"] || "").trim() || null,
            kontak: String(row["Kontak"] || "").trim() || null,
            check_wag_kanwil: String(row["Check WAG Kanwil"] || "").trim() || null,
            check_wa_info: String(row["Check WA INFO"] || "").trim() || null,
            check_wa_bintal: String(row["Check WA Bintal"] || "").trim() || null,
            check_teams_kanwil: String(row["Check Teams Kanwil"] || "").trim() || null,
          })).filter((r: any) => r.nama_lengkap);

          const { error } = await (supabase as any).from("japri_teman_existing").insert(batch);
          if (error) { errorCount += batch.length; } else { successCount += batch.length; }
        }

        toast({ title: "Import Selesai", description: `${successCount} data ditambahkan, ${errorCount} gagal` });
        fetchData();
      } catch (error) {
        console.error("Import error:", error);
        toast({ title: "Error", description: "Gagal mengimport data", variant: "destructive" });
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleDeleteAll = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus SEMUA data existing?")) return;
    const { error } = await (supabase as any)
      .from("japri_teman_existing").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) { toast({ title: "Error", description: "Gagal menghapus data", variant: "destructive" }); return; }
    toast({ title: "Berhasil", description: "Semua data berhasil dihapus" });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    const { error } = await (supabase as any).from("japri_teman_existing").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: "Gagal menghapus data", variant: "destructive" }); return; }
    toast({ title: "Berhasil", description: "Data berhasil dihapus" });
    fetchData();
  };

  const handleAdd = () => {
    setEditingData(null);
    setFormData({ nip: "", nama_lengkap: "", agama: "", jabatan: "", eselon_iii: "", domain_kemenkeu: "", kontak: "", check_wag_kanwil: "", check_wa_info: "", check_wa_bintal: "", check_teams_kanwil: "" });
    setDialogOpen(true);
  };

  const handleEdit = (item: ExistingData) => {
    setEditingData(item);
    setFormData({
      nip: item.nip || "", nama_lengkap: item.nama_lengkap, agama: item.agama || "",
      jabatan: item.jabatan || "", eselon_iii: item.eselon_iii || "", domain_kemenkeu: item.domain_kemenkeu || "",
      kontak: item.kontak || "", check_wag_kanwil: item.check_wag_kanwil || "", check_wa_info: item.check_wa_info || "",
      check_wa_bintal: item.check_wa_bintal || "", check_teams_kanwil: item.check_teams_kanwil || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nama_lengkap) {
      toast({ title: "Error", description: "Nama Lengkap wajib diisi", variant: "destructive" });
      return;
    }
    try {
      if (editingData) {
        const { error } = await (supabase as any).from("japri_teman_existing").update({
          nip: formData.nip || null, nama_lengkap: formData.nama_lengkap, agama: formData.agama || null,
          jabatan: formData.jabatan || null, eselon_iii: formData.eselon_iii || null,
          domain_kemenkeu: formData.domain_kemenkeu || null, kontak: formData.kontak || null,
          check_wag_kanwil: formData.check_wag_kanwil || null, check_wa_info: formData.check_wa_info || null,
          check_wa_bintal: formData.check_wa_bintal || null, check_teams_kanwil: formData.check_teams_kanwil || null,
        }).eq("id", editingData.id);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Data berhasil diupdate" });
      } else {
        const { data: maxData } = await (supabase as any)
          .from("japri_teman_existing").select("no_urut").order("no_urut", { ascending: false }).limit(1).single();
        const nextNoUrut = (maxData?.no_urut || 0) + 1;
        const { error } = await (supabase as any).from("japri_teman_existing").insert({
          no_urut: nextNoUrut, nip: formData.nip || null, nama_lengkap: formData.nama_lengkap,
          agama: formData.agama || null, jabatan: formData.jabatan || null, eselon_iii: formData.eselon_iii || null,
          domain_kemenkeu: formData.domain_kemenkeu || null, kontak: formData.kontak || null,
          check_wag_kanwil: formData.check_wag_kanwil || null, check_wa_info: formData.check_wa_info || null,
          check_wa_bintal: formData.check_wa_bintal || null, check_teams_kanwil: formData.check_teams_kanwil || null,
        });
        if (error) throw error;
        toast({ title: "Berhasil", description: "Data berhasil ditambahkan" });
      }
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Error", description: "Gagal menyimpan data", variant: "destructive" });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Data Existing Pegawai</CardTitle>
          <CardDescription>Data kanal komunikasi pegawai yang sudah ada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari nama, NIP, atau jabatan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full sm:w-80" />
                </div>
                <Select value={filterEselonIII || "all"} onValueChange={(v) => setFilterEselonIII(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Eselon III" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50 max-h-60">
                    <SelectItem value="all">Semua Eselon III</SelectItem>
                    {filterOptions.eselonIII.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterAgama || "all"} onValueChange={(v) => setFilterAgama(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Agama" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">Semua Agama</SelectItem>
                    {filterOptions.agama.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterJabatan || "all"} onValueChange={(v) => setFilterJabatan(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Jabatan" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50 max-h-60">
                    <SelectItem value="all">Semua Jabatan</SelectItem>
                    {filterOptions.jabatan.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 flex-wrap">
                {canManage && (
                  <Button onClick={handleAdd} size="sm"><Plus className="w-4 h-4 mr-2" />Tambah Data</Button>
                )}
                {isAdmin && (
                  <Button variant="destructive" size="sm" onClick={handleDeleteAll}><Trash2 className="w-4 h-4 mr-2" />Hapus Data</Button>
                )}
                {canManage && (
                  <Button onClick={handleExport} variant="outline" size="sm"><FileDown className="w-4 h-4 mr-2" />Export Excel</Button>
                )}
                {isAdmin && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => document.getElementById("import-existing")?.click()} disabled={isImporting}>
                      <Upload className="w-4 h-4 mr-2" />{isImporting ? "Importing..." : "Import Excel"}
                    </Button>
                    <Input id="import-existing" type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
                  </>
                )}
              </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Agama</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Eselon III</TableHead>
                    <TableHead>Domain Kemenkeu</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>WAG Kanwil</TableHead>
                    <TableHead>WA INFO</TableHead>
                    <TableHead>WA Bintal</TableHead>
                    <TableHead>Teams Kanwil</TableHead>
                    {canManage && <TableHead className="w-24">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={canManage ? 13 : 12} className="text-center py-8">Memuat data...</TableCell></TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow><TableCell colSpan={canManage ? 13 : 12} className="text-center py-8 text-muted-foreground">{searchTerm ? "Tidak ada data yang cocok" : "Tidak ada data"}</TableCell></TableRow>
                  ) : (
                    filteredData.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-blue-600 font-medium">{idx + 1}</TableCell>
                        <TableCell className="text-blue-600">{item.nip || "-"}</TableCell>
                        <TableCell>{item.nama_lengkap}</TableCell>
                        <TableCell>{item.agama || "-"}</TableCell>
                        <TableCell>{item.jabatan || "-"}</TableCell>
                        <TableCell>{item.eselon_iii || "-"}</TableCell>
                        <TableCell>{item.domain_kemenkeu ? <a href={`mailto:${item.domain_kemenkeu}`} className="text-blue-600 hover:underline">{item.domain_kemenkeu}</a> : "-"}</TableCell>
                        <TableCell>{item.kontak ? <a href={`tel:${item.kontak}`} className="text-blue-600 hover:underline">{item.kontak}</a> : "-"}</TableCell>
                        {["check_wag_kanwil", "check_wa_info", "check_wa_bintal", "check_teams_kanwil"].map((field) => {
                          const val = (item as any)[field];
                          const isChecked = val && val.toLowerCase() !== "x" && val !== "-";
                          return (
                            <TableCell key={field} className="text-center">
                              {canManage ? (
                                <div className="flex justify-center gap-1">
                                  <Button
                                    variant={isChecked ? "default" : "outline"}
                                    size="sm"
                                    className={`h-7 w-7 p-0 ${isChecked ? "bg-green-600 hover:bg-green-700" : ""}`}
                                    onClick={async () => {
                                      await (supabase as any).from("japri_teman_existing").update({ [field]: "v" }).eq("id", item.id);
                                      setData(prev => prev.map(d => d.id === item.id ? { ...d, [field]: "v" } : d));
                                    }}
                                    title="Centang"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant={!isChecked && val ? "default" : "outline"}
                                    size="sm"
                                    className={`h-7 w-7 p-0 ${!isChecked && val ? "bg-red-600 hover:bg-red-700" : ""}`}
                                    onClick={async () => {
                                      await (supabase as any).from("japri_teman_existing").update({ [field]: "x" }).eq("id", item.id);
                                      setData(prev => prev.map(d => d.id === item.id ? { ...d, [field]: "x" } : d));
                                    }}
                                    title="Silang"
                                  >
                                    <XIcon className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                isChecked ? <span className="text-green-600 font-medium">✓</span> : <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                        {canManage && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(item)} title="Edit"><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} title="Hapus"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {filteredData.length} data {searchTerm && `(dari ${data.length} total)`}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingData ? "Edit Data" : "Tambah Data"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {[
              { id: "nama_lengkap", label: "Nama Lengkap *" },
              { id: "nip", label: "NIP" },
              { id: "agama", label: "Agama" },
              { id: "jabatan", label: "Jabatan" },
              { id: "eselon_iii", label: "Eselon III" },
              { id: "domain_kemenkeu", label: "Domain Kemenkeu" },
              { id: "kontak", label: "Kontak" },
            ].map((field) => (
              <div key={field.id} className="grid gap-1">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  value={(formData as any)[field.id]}
                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                />
              </div>
            ))}
            {[
              { id: "check_wag_kanwil", label: "Check WAG Kanwil" },
              { id: "check_wa_info", label: "Check WA INFO" },
              { id: "check_wa_bintal", label: "Check WA Bintal" },
              { id: "check_teams_kanwil", label: "Check Teams Kanwil" },
            ].map((field) => (
              <div key={field.id} className="grid gap-1">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Select
                  value={(formData as any)[field.id] || ""}
                  onValueChange={(v) => setFormData({ ...formData, [field.id]: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="v">✓ Centang</SelectItem>
                    <SelectItem value="x">✗ Silang</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
