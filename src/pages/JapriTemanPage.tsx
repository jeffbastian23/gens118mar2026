import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, LogOut, Settings, FileDown, Upload, Plus, Trash2, Edit, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JapriTemanExistingTab from "@/components/JapriTemanExistingTab";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import NotificationBell from "@/components/NotificationBell";
import FloatingVoiceAssistant from "@/components/FloatingVoiceAssistant";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface JapriTeman {
  id: string;
  no_urut: number;
  nama: string;
  nip: string | null;
  kontak: string | null;
  email: string | null;
}

export default function JapriTemanPage() {
  const { user, fullName, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = role === "admin" || role === "super";
  const isSuper = role === "super";
  const canEdit = role !== "overview";
  
  const [japriTeman, setJapriTeman] = useState<JapriTeman[]>([]);
  const [filteredData, setFilteredData] = useState<JapriTeman[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<JapriTeman | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    kontak: "",
    email: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchJapriTeman();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = japriTeman.filter((item) =>
        Object.values(item).some((value) =>
          String(value || "").toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(japriTeman);
    }
  }, [searchTerm, japriTeman]);

  const fetchJapriTeman = async () => {
    setIsLoading(true);
    try {
      // Fetch all data with pagination to handle >1000 rows
      let allData: JapriTeman[] = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from("japri_teman")
          .select("id, no_urut, nama, nip, kontak, email")
          .order("no_urut", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allData = [...allData, ...data as JapriTeman[]];
        
        if (data.length < pageSize) break;
        page++;
      }
      
      setJapriTeman(allData);
    } catch (error) {
      console.error("Error fetching japri_teman:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data japri teman",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      japriTeman.map((item) => ({
        "NIP": item.nip || "",
        "Nama": item.nama,
        "No. Handphone": item.kontak || "",
        "Alamat Surel": item.email || "",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Japri Teman");
    XLSX.writeFile(workbook, "japri_teman.xlsx");

    toast({
      title: "Berhasil",
      description: `${japriTeman.length} data berhasil diexport`,
    });
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
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws) as any[];

        let successCount = 0;
        let updateCount = 0;
        let errorCount = 0;

        // Get max no_urut first
        const { data: maxData } = await supabase
          .from("japri_teman")
          .select("no_urut")
          .order("no_urut", { ascending: false })
          .limit(1)
          .single();
        
        let nextNoUrut = (maxData?.no_urut || 0) + 1;

        // Process in batches for performance - handle large datasets
        const batchSize = 100;
        
        for (let i = 0; i < jsonData.length; i += batchSize) {
          const batch = jsonData.slice(i, i + batchSize);
          
          for (const row of batch) {
            const nip = String(row["NIP"] || "").trim();
            const nama = String(row["Nama"] || "").trim();
            const kontak = String(row["No. Handphone"] || row["Kontak"] || "").trim();
            const email = String(row["Alamat Surel"] || row["Email"] || "").trim();

            if (!nama) continue;

            try {
              if (nip) {
                // Check if NIP exists
                const { data: existing } = await supabase
                  .from("japri_teman")
                  .select("id")
                  .eq("nip", nip)
                  .maybeSingle();

                if (existing) {
                  // Update existing by NIP
                  const { error } = await supabase
                    .from("japri_teman")
                    .update({ 
                      nama,
                      kontak: kontak || null, 
                      email: email || null 
                    })
                    .eq("nip", nip);

                  if (error) {
                    errorCount++;
                  } else {
                    updateCount++;
                  }
                } else {
                  // Insert new
                  const { error } = await supabase
                    .from("japri_teman")
                    .insert({
                      no_urut: nextNoUrut++,
                      nama,
                      nip: nip || null,
                      kontak: kontak || null,
                      email: email || null,
                    });

                  if (error) {
                    errorCount++;
                  } else {
                    successCount++;
                  }
                }
              } else {
                // No NIP, insert as new
                const { error } = await supabase
                  .from("japri_teman")
                  .insert({
                    no_urut: nextNoUrut++,
                    nama,
                    nip: null,
                    kontak: kontak || null,
                    email: email || null,
                  });

                if (error) {
                  errorCount++;
                } else {
                  successCount++;
                }
              }
            } catch (err) {
              errorCount++;
            }
          }
        }

        toast({
          title: "Import Selesai",
          description: `${successCount} data baru ditambahkan, ${updateCount} data diupdate, ${errorCount} gagal`,
        });

        fetchJapriTeman();
      } catch (error) {
        console.error("Import error:", error);
        toast({
          title: "Error",
          description: "Gagal mengimport data",
          variant: "destructive",
        });
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleAdd = () => {
    setEditingData(null);
    setFormData({
      nama: "",
      nip: "",
      kontak: "",
      email: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: JapriTeman) => {
    setEditingData(item);
    setFormData({
      nama: item.nama,
      nip: item.nip || "",
      kontak: item.kontak || "",
      email: item.email || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    const { error } = await supabase.from("japri_teman").delete().eq("id", id);

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

    fetchJapriTeman();
  };

  const handleDeleteAll = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus SEMUA data kontak?")) return;
    
    const { error } = await supabase
      .from("japri_teman")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    
    if (error) {
      toast({ title: "Error", description: "Gagal menghapus data", variant: "destructive" });
      return;
    }
    
    toast({ title: "Berhasil", description: "Semua data berhasil dihapus" });
    fetchJapriTeman();
  };

  const handleSave = async () => {
    if (!formData.nama) {
      toast({
        title: "Error",
        description: "Nama wajib diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingData) {
        // Update existing
        const { error } = await supabase
          .from("japri_teman")
          .update({
            nama: formData.nama,
            nip: formData.nip || null,
            kontak: formData.kontak || null,
            email: formData.email || null,
          })
          .eq("id", editingData.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data berhasil diupdate",
        });
      } else {
        // Get next no_urut
        const { data: maxData } = await supabase
          .from("japri_teman")
          .select("no_urut")
          .order("no_urut", { ascending: false })
          .limit(1)
          .single();
        
        const nextNoUrut = (maxData?.no_urut || 0) + 1;

        // Create new
        const { error } = await supabase.from("japri_teman").insert({
          no_urut: nextNoUrut,
          nama: formData.nama,
          nip: formData.nip || null,
          kontak: formData.kontak || null,
          email: formData.email || null,
        });

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data berhasil ditambahkan",
        });
      }

      setDialogOpen(false);
      fetchJapriTeman();
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <img src={logoKemenkeu} alt="Kementerian Keuangan" className="h-14 w-auto drop-shadow-lg" />
              <img src={logoCustoms} alt="Customs" className="h-12 w-auto drop-shadow-lg" />
              <div>
                <h1 className="text-2xl font-bold">Japri Teman</h1>
                <p className="text-sm text-blue-100">Kanwil DJBC Jawa Timur I</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{fullName}</p>
                <p className="text-xs text-blue-100">{role === "admin" ? "Administrator" : role === "overview" ? "Overview" : "Pengguna"}</p>
              </div>
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/admin")}
                  className="text-white hover:bg-white/20 gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Panel Admin
                </Button>
              )}
              <NotificationBell />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/")}
                className="text-white hover:bg-white/20 gap-2"
              >
                <Home className="h-5 w-5" />
                Beranda
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={signOut}
                className="text-white hover:bg-white/20"
                title="Keluar"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="kontak" className="w-full">
          <TabsList>
            <TabsTrigger value="kontak">Daftar Kontak Pegawai</TabsTrigger>
            <TabsTrigger value="existing">Existing</TabsTrigger>
          </TabsList>

          <TabsContent value="kontak">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Kontak Pegawai</CardTitle>
                <CardDescription>Kelola data kontak pegawai untuk komunikasi tim</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search and Actions */}
                  <div className="flex flex-wrap gap-2 justify-between">
                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari nama, NIP, atau kontak..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-80"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {isAdmin && (
                        <Button onClick={handleAdd} size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Japri
                        </Button>
                      )}
                      {isAdmin && (
                        <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus Data
                        </Button>
                      )}
                      {isAdmin && (
                        <Button onClick={handleExport} variant="outline" size="sm">
                          <FileDown className="w-4 h-4 mr-2" />
                          Export Excel
                        </Button>
                      )}
                      {isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("import-japri")?.click()}
                            disabled={isImporting}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {isImporting ? "Importing..." : "Import Excel"}
                          </Button>
                          <Input
                            id="import-japri"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleImport}
                            className="hidden"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Table */}
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">No</TableHead>
                          <TableHead>NIP</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>Kontak</TableHead>
                          <TableHead>Email</TableHead>
                          {(isAdmin || isSuper) && <TableHead className="w-24">Aksi</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">Memuat data...</TableCell>
                          </TableRow>
                        ) : filteredData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              {searchTerm ? "Tidak ada data yang cocok" : "Tidak ada data"}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredData.map((item, idx) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{idx + 1}</TableCell>
                              <TableCell>{item.nip || "-"}</TableCell>
                              <TableCell>{item.nama}</TableCell>
                              <TableCell>
                                {item.kontak ? (
                                  <a href={`tel:${item.kontak}`} className="text-primary hover:underline">{item.kontak}</a>
                                ) : "-"}
                              </TableCell>
                              <TableCell>
                                {item.email ? (
                                  <a href={`mailto:${item.email}`} className="text-primary hover:underline">{item.email}</a>
                                ) : "-"}
                              </TableCell>
                              {(isAdmin || isSuper) && (
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(item)} title="Edit">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} title="Hapus">
                                      <Trash2 className="w-4 h-4 text-destructive" />
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

                  <div className="text-sm text-muted-foreground">
                    Total: {filteredData.length} data {searchTerm && `(dari ${japriTeman.length} total)`}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="existing">
            <JapriTemanExistingTab isAdmin={isAdmin} isSuper={role === "super"} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingData ? "Edit Japri" : "Tambah Japri"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nama">Nama *</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Masukkan nama"
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
              <Label htmlFor="kontak">Kontak</Label>
              <Input
                id="kontak"
                value={formData.kontak}
                onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                placeholder="Masukkan nomor telepon"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Masukkan alamat email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Voice Assistant */}
      <FloatingVoiceAssistant />
    </div>
  );
}
