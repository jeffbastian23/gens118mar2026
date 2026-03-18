import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Download, Upload, Database, Users, Trash2, Building2, PieChart, Award, Briefcase } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import EmployeeTable from "@/components/EmployeeTable";
import EmployeeDialog from "@/components/EmployeeDialog";
import ImportDialog from "@/components/ImportDialog";
import ExportDialog from "@/components/ExportDialog";
import EmployeeRekapDialog from "@/components/EmployeeRekapDialog";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SatuanKerjaTab from "@/components/SatuanKerjaTab";
import DemografiTab from "@/components/DemografiTab";
import GolonganTab from "@/components/GolonganTab";
import JabatanTab from "@/components/JabatanTab";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string;
  uraian_pangkat: string;
  uraian_jabatan: string;
  nm_unit_organisasi: string;
  jabatan_kategori?: string | null;
}

export default function DaftarPegawai() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const canEdit = role !== "overview";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dataPokokSearchTerm, setDataPokokSearchTerm] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [employeeRekapOpen, setEmployeeRekapOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("daftar-pegawai");

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchEmployees = async () => {
    try {
      // Fetch all employees without limit
      let allEmployees: any[] = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from("employees")
          .select("id, nm_pegawai, nip, uraian_pangkat, uraian_jabatan, nm_unit_organisasi, jabatan_kategori")
          .order("nm_pegawai", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allEmployees = [...allEmployees, ...data];
        
        if (data.length < pageSize) break;
        page++;
      }
      
      // Ensure all employees have nip field and match Employee interface
      const employeesWithNip: Employee[] = allEmployees.map(emp => ({
        id: emp.id,
        nm_pegawai: emp.nm_pegawai,
        nip: emp.nip || '',
        uraian_pangkat: emp.uraian_pangkat,
        uraian_jabatan: emp.uraian_jabatan,
        nm_unit_organisasi: emp.nm_unit_organisasi,
        jabatan_kategori: emp.jabatan_kategori,
      }));
      setEmployees(employeesWithNip);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter((emp) =>
    emp.nm_pegawai.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.uraian_jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.uraian_pangkat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nm_unit_organisasi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDataPokok = employees.filter((emp) =>
    emp.nm_pegawai.toLowerCase().includes(dataPokokSearchTerm.toLowerCase()) ||
    emp.nip.toLowerCase().includes(dataPokokSearchTerm.toLowerCase()) ||
    emp.uraian_jabatan.toLowerCase().includes(dataPokokSearchTerm.toLowerCase()) ||
    emp.uraian_pangkat.toLowerCase().includes(dataPokokSearchTerm.toLowerCase()) ||
    emp.nm_unit_organisasi.toLowerCase().includes(dataPokokSearchTerm.toLowerCase())
  );

  const handleDeleteEmployee = async () => {
    if (!deleteEmployeeId) return;
    
    try {
      const { error } = await supabase.from("employees").delete().eq("id", deleteEmployeeId);
      if (error) throw error;
      toast.success("Data pegawai berhasil dihapus!");
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus data");
    } finally {
      setDeleteEmployeeId(null);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeDialogOpen(true);
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setEmployeeDialogOpen(true);
  };

  const handleExportExcel = () => {
    const exportData = filteredEmployees.map((emp, index) => ({
      "No": index + 1,
      "Nama Pegawai": emp.nm_pegawai,
      "NIP": emp.nip,
      "Pangkat": emp.uraian_pangkat,
      "Jabatan": emp.uraian_jabatan,
      "Unit Organisasi": emp.nm_unit_organisasi
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Pegawai");
    XLSX.writeFile(workbook, `Daftar_Pegawai_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Berhasil export ${exportData.length} data pegawai`);
  };

  const handleExportDataPokok = () => {
    const exportData = filteredDataPokok.map((emp, index) => ({
      "No": index + 1,
      "Nama Pegawai": emp.nm_pegawai,
      "NIP": emp.nip,
      "Pangkat/Gol": emp.uraian_pangkat,
      "Uraian Jabatan": emp.uraian_jabatan,
      "Unit Organisasi": emp.nm_unit_organisasi
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pokok");
    XLSX.writeFile(workbook, `Data_Pokok_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Berhasil export ${exportData.length} data pokok pegawai`);
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isAdmin) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Transform data to match database schema
      const employeeData = jsonData.map((item: any) => ({
        nm_pegawai: item["Nama Pegawai"] || item.nm_pegawai,
        nip: String(item["NIP"] || item.nip || "").replace(/^'/, ""),
        uraian_pangkat: item["Pangkat"] || item.uraian_pangkat,
        uraian_jabatan: item["Jabatan"] || item.uraian_jabatan,
        nm_unit_organisasi: item["Unit Organisasi"] || item.nm_unit_organisasi,
      }));

      // Validate data
      const validData = employeeData.filter(item => item.nm_pegawai && item.nip);
      
      if (validData.length === 0) {
        toast.error("Tidak ada data valid untuk diimport. Pastikan kolom Nama Pegawai dan NIP terisi.");
        return;
      }

      // Insert in batches of 100
      const batchSize = 100;
      let successCount = 0;
      
      for (let i = 0; i < validData.length; i += batchSize) {
        const batch = validData.slice(i, i + batchSize);
        const { error } = await supabase
          .from("employees")
          .insert(batch);

        if (error) {
          console.error("Error importing batch:", error);
          toast.error(`Error pada batch ${i / batchSize + 1}: ${error.message}`);
        } else {
          successCount += batch.length;
        }
      }

      toast.success(`Berhasil import ${successCount} data pegawai`);
      await fetchEmployees();
    } catch (error: any) {
      console.error("Error importing data:", error);
      toast.error("Gagal import data: " + error);
    }
    
    // Reset file input
    event.target.value = '';
  };

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Administrasi SDM" }, { label: "Daftar Pegawai" }]}>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Memuat data pegawai...</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Administrasi SDM" }, { label: "Daftar Pegawai" }]}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="daftar-pegawai" className="gap-2">
            <Users className="h-4 w-4" />
            Daftar Pegawai
          </TabsTrigger>
          <TabsTrigger value="data-pokok" className="gap-2">
            <Database className="h-4 w-4" />
            Data Pokok
          </TabsTrigger>
          <TabsTrigger value="golongan" className="gap-2">
            <Award className="h-4 w-4" />
            Golongan
          </TabsTrigger>
          <TabsTrigger value="jabatan" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Jabatan
          </TabsTrigger>
          <TabsTrigger value="satuan-kerja" className="gap-2">
            <Building2 className="h-4 w-4" />
            Satuan Kerja
          </TabsTrigger>
          <TabsTrigger value="demografi" className="gap-2">
            <PieChart className="h-4 w-4" />
            Demografi
          </TabsTrigger>
        </TabsList>

        {/* Tab: Daftar Pegawai */}
        <TabsContent value="daftar-pegawai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  Daftar Pegawai
                  <span className="text-sm font-normal text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                    Total: {employees.length} pegawai
                  </span>
                </span>
                <div className="flex gap-2">
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportExcel}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export Excel
                    </Button>
                  )}
                  {isAdmin && (
                    <>
                      <div>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleImportExcel}
                          className="hidden"
                          id="import-employee-excel"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('import-employee-excel')?.click()}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Import Excel
                        </Button>
                      </div>
                      <Button onClick={handleAddEmployee} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Pegawai
                      </Button>
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari pegawai (nama, NIP, jabatan, pangkat, unit)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <EmployeeTable
                employees={filteredEmployees}
                onEdit={canEdit ? handleEditEmployee : undefined}
                onDelete={canEdit ? (id) => setDeleteEmployeeId(id) : undefined}
                onRefresh={fetchEmployees}
                isAdmin={isAdmin}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Data Pokok */}
        <TabsContent value="data-pokok">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Pokok Pegawai
                  <span className="text-sm font-normal text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                    Total: {employees.length} pegawai
                  </span>
                </span>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (employees.length === 0) {
                          toast.error("Tidak ada data untuk dihapus");
                          return;
                        }
                        if (!confirm(`Yakin ingin menghapus SEMUA ${employees.length} data pegawai?`)) return;
                        const { error } = await supabase.from("employees").delete().neq("id", "00000000-0000-0000-0000-000000000000");
                        if (error) {
                          toast.error("Gagal menghapus semua data");
                          return;
                        }
                        toast.success("Semua data berhasil dihapus");
                        fetchEmployees();
                      }}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus Semua
                    </Button>
                    <div>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          try {
                            const arrayBuffer = await file.arrayBuffer();
                            const workbook = XLSX.read(arrayBuffer, { type: "array" });
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const jsonData = XLSX.utils.sheet_to_json(worksheet);
                            const employeeData = jsonData.map((item: any) => ({
                              nm_pegawai: item["Nama Pegawai"] || item.nm_pegawai,
                              nip: String(item["NIP"] || item.nip || "").replace(/^'/, ""),
                              uraian_pangkat: item["Pangkat/Gol"] || item["Pangkat"] || item.uraian_pangkat,
                              uraian_jabatan: item["Uraian Jabatan"] || item["Jabatan"] || item.uraian_jabatan,
                              nm_unit_organisasi: item["Unit Organisasi"] || item.nm_unit_organisasi,
                            }));
                            const validData = employeeData.filter(item => item.nm_pegawai && item.nip);
                            if (validData.length === 0) {
                              toast.error("Tidak ada data valid untuk diimport");
                              return;
                            }
                            const batchSize = 100;
                            let successCount = 0;
                            for (let i = 0; i < validData.length; i += batchSize) {
                              const batch = validData.slice(i, i + batchSize);
                              const { error } = await supabase.from("employees").insert(batch);
                              if (!error) successCount += batch.length;
                            }
                            toast.success(`Berhasil import ${successCount} data`);
                            fetchEmployees();
                          } catch (error: any) {
                            toast.error("Gagal import data");
                          }
                          event.target.value = '';
                        }}
                        className="hidden"
                        id="import-data-pokok-excel"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('import-data-pokok-excel')?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Import Excel
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportDataPokok}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export Excel
                    </Button>
                  </div>
                )}
              </CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, NIP, pangkat, jabatan, unit organisasi..."
                  value={dataPokokSearchTerm}
                  onChange={(e) => setDataPokokSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Menampilkan {filteredDataPokok.length} dari {employees.length} data pegawai
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">No</TableHead>
                      <TableHead>Nama Pegawai</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Pangkat/Gol</TableHead>
                      <TableHead>Uraian Jabatan</TableHead>
                      <TableHead>Unit Organisasi</TableHead>
                      <TableHead>Jabatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDataPokok.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Tidak ada data yang ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDataPokok.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{item.nm_pegawai}</TableCell>
                          <TableCell>{item.nip}</TableCell>
                          <TableCell>{item.uraian_pangkat}</TableCell>
                          <TableCell>{item.uraian_jabatan}</TableCell>
                          <TableCell>{item.nm_unit_organisasi}</TableCell>
                          <TableCell>{item.jabatan_kategori || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Golongan */}
        <TabsContent value="golongan">
          <GolonganTab isAdmin={isAdmin} canEdit={canEdit} />
        </TabsContent>

        {/* Tab: Jabatan */}
        <TabsContent value="jabatan">
          <JabatanTab isAdmin={isAdmin} canEdit={canEdit} />
        </TabsContent>

        {/* Tab: Satuan Kerja */}
        <TabsContent value="satuan-kerja">
          <SatuanKerjaTab isAdmin={isAdmin} canEdit={canEdit} />
        </TabsContent>

        {/* Tab: Demografi */}
        <TabsContent value="demografi">
          <DemografiTab isAdmin={isAdmin} canEdit={canEdit} />
        </TabsContent>
      </Tabs>

      <EmployeeDialog
        open={employeeDialogOpen}
        onOpenChange={setEmployeeDialogOpen}
        employee={selectedEmployee}
        onSuccess={fetchEmployees}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={fetchEmployees}
      />

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
      />

      <EmployeeRekapDialog
        open={employeeRekapOpen}
        onOpenChange={setEmployeeRekapOpen}
      />

      <AlertDialog open={!!deleteEmployeeId} onOpenChange={() => setDeleteEmployeeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Data pegawai akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}