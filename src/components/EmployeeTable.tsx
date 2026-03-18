import { useState, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Pencil, Trash2, FileDown, Search, Upload, Trash } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { toProperCase } from "@/lib/utils";
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
}

interface EmployeeTableProps {
  employees: Employee[];
  onEdit?: (employee: Employee) => void;
  onDelete?: (id: string) => void;
  onRefresh: () => void;
  isAdmin?: boolean;
  canEdit?: boolean;
}

export default function EmployeeTable({ employees, onEdit, onDelete, onRefresh, isAdmin = true, canEdit = true }: EmployeeTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [officeFilter, setOfficeFilter] = useState<string>("all");
  const [rankFilter, setRankFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const [deleteAllDialog, setDeleteAllDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter employees based on search and all active filters
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.nm_pegawai.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.uraian_jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.uraian_pangkat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nm_unit_organisasi.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOffice = officeFilter === "all" || emp.nm_unit_organisasi === officeFilter;
    const matchesRank = rankFilter === "all" || emp.uraian_pangkat === rankFilter;
    const matchesPosition = positionFilter === "all" || emp.uraian_jabatan === positionFilter;

    return matchesSearch && matchesOffice && matchesRank && matchesPosition;
  });

  // Get unique values for filters based on currently filtered data
  // This creates cascading filters where each filter affects the options in other filters
  const getFilteredEmployeesForDropdown = (excludeFilter: 'office' | 'rank' | 'position') => {
    return employees.filter((emp) => {
      const matchesSearch = emp.nm_pegawai.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.uraian_jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.uraian_pangkat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.nm_unit_organisasi.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesOffice = excludeFilter === 'office' || officeFilter === "all" || emp.nm_unit_organisasi === officeFilter;
      const matchesRank = excludeFilter === 'rank' || rankFilter === "all" || emp.uraian_pangkat === rankFilter;
      const matchesPosition = excludeFilter === 'position' || positionFilter === "all" || emp.uraian_jabatan === positionFilter;

      return matchesSearch && matchesOffice && matchesRank && matchesPosition;
    });
  };

  const uniqueOffices = Array.from(new Set(getFilteredEmployeesForDropdown('office').map(emp => emp.nm_unit_organisasi))).filter(v => v && v.trim() !== '').sort();
  const uniqueRanks = Array.from(new Set(getFilteredEmployeesForDropdown('rank').map(emp => emp.uraian_pangkat))).filter(v => v && v.trim() !== '').sort();
  const uniquePositions = Array.from(new Set(getFilteredEmployeesForDropdown('position').map(emp => emp.uraian_jabatan))).filter(v => v && v.trim() !== '').sort();

  const generateDocument = async (employee: Employee, type: 'nota' | 'surat') => {
    toast.info(`Generating ${type === 'nota' ? 'Nota Dinas' : 'Surat Tugas'} untuk ${employee.nm_pegawai}...`);
    
    // Simulate document generation
    setTimeout(() => {
      toast.success(`${type === 'nota' ? 'Nota Dinas' : 'Surat Tugas'} berhasil dibuat!`);
    }, 1500);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const XLSX = await import('xlsx');
      
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet);
      
      const employeesData = data.map((row: any) => ({
        nm_pegawai: row['Nama Pegawai'] || row['nm_pegawai'] || '',
        nip: String(row['NIP'] || row['nip'] || '').replace(/'/g, ''),
        uraian_pangkat: row['Uraian Pangkat'] || row['uraian_pangkat'] || '',
        uraian_jabatan: row['Jabatan'] || row['uraian_jabatan'] || '',
        nm_unit_organisasi: row['Nama Organisasi'] || row['nm_unit_organisasi'] || '',
      })).filter((emp: any) => emp.nm_pegawai && emp.nip);

      if (employeesData.length === 0) {
        toast.error("Tidak ada data valid dalam file Excel");
        return;
      }

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < employeesData.length; i += batchSize) {
        const batch = employeesData.slice(i, i + batchSize);
        const { error } = await supabase.from("employees").insert(batch);
        if (error) throw error;
      }

      toast.success(`Berhasil mengupload ${employeesData.length} data pegawai!`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengupload data");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAll = async () => {
    try {
      const { error } = await supabase.from("employees").delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      
      toast.success("Semua data pegawai berhasil dihapus!");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus data");
    } finally {
      setDeleteAllDialog(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari pegawai berdasarkan nama, jabatan, pangkat, atau kantor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredEmployees.length} dari {employees.length} pegawai
        </div>
        {isAdmin && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Upload Data Pegawai"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteAllDialog(true)}
              title="Hapus Semua Data"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Select value={officeFilter} onValueChange={setOfficeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter Kantor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kantor</SelectItem>
            {uniqueOffices.map((office) => (
              <SelectItem key={office} value={office}>
                {office}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={rankFilter} onValueChange={setRankFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter Golongan/Pangkat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Golongan/Pangkat</SelectItem>
            {uniqueRanks.map((rank) => (
              <SelectItem key={rank} value={rank}>
                {rank}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter Jabatan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jabatan</SelectItem>
            {uniquePositions.map((position) => (
              <SelectItem key={position} value={position}>
                {position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead className="min-w-[200px]">Nama Pegawai</TableHead>
                <TableHead className="min-w-[180px]">NIP</TableHead>
                <TableHead className="min-w-[180px]">Pangkat/Gol</TableHead>
                <TableHead className="min-w-[350px]">Uraian Jabatan</TableHead>
                <TableHead className="min-w-[300px]">Unit Organisasi</TableHead>
                <TableHead className="w-[120px] text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Tidak ada data pegawai yang ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee, index) => (
                  <TableRow key={employee.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{toProperCase(employee.nm_pegawai)}</TableCell>
                    <TableCell>{employee.nip}</TableCell>
                    <TableCell>{toProperCase(employee.uraian_pangkat)}</TableCell>
                    <TableCell>{toProperCase(employee.uraian_jabatan)}</TableCell>
                    <TableCell className="text-sm">{employee.nm_unit_organisasi}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-center">
                        {canEdit && isAdmin && onEdit && onDelete && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEdit(employee)}
                              className="h-8 px-2"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDelete(employee.id)}
                              className="h-8 px-2 text-destructive hover:text-destructive"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
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

      <AlertDialog open={deleteAllDialog} onOpenChange={setDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data Pegawai?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus semua data pegawai ({employees.length} pegawai). 
              Data yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}