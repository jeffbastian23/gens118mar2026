import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toProperCase } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualEmployee {
  nama: string;
  pangkat: string;
  jabatan: string;
}

interface Assignment {
  id: string;
  agenda_number: number;
  unit_pemohon: string;
  unit_penerbit: string;
  dasar_penugasan: string;
  nomor_naskah_dinas: string;
  tanggal_naskah: string;
  perihal: string;
  employee_ids: string[];
  manual_employees?: ManualEmployee[] | any;
  tujuan: string;
  tanggal_mulai_kegiatan?: string;
  tanggal_selesai_kegiatan?: string;
  waktu_penugasan: string;
  lokasi_penugasan_detail: string;
  tempat_penugasan: string;
  sumber?: string;
  sumber_satuan_kerja?: string;
  sumber_satuan_kerja_custom?: string;
  jenis_penugasan?: string;
  created_at: string;
}

interface AssignmentExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AssignmentExportDialog({ open, onOpenChange }: AssignmentExportDialogProps) {
  const [assignmentList, setAssignmentList] = useState<Assignment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();
  const [filterUnitPemohon, setFilterUnitPemohon] = useState<string>("all");
  const [filterJenisSurat, setFilterJenisSurat] = useState<string>("all");

  useEffect(() => {
    if (open) {
      fetchAssignments();
    }
  }, [open]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .order("agenda_number", { ascending: false });

      if (error) throw error;
      setAssignmentList(data || []);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data");
    }
  };

  const toggleAssignment = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredAssignments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAssignments.map(a => a.id));
    }
  };

  const getFilteredAssignments = () => {
    return assignmentList.filter(a => {
      // Filter by date range using tanggal_mulai_kegiatan and tanggal_selesai_kegiatan
      // An assignment matches if its date range overlaps with the filter range
      if (filterStartDate || filterEndDate) {
        const assignmentStart = a.tanggal_mulai_kegiatan ? new Date(a.tanggal_mulai_kegiatan) : null;
        const assignmentEnd = a.tanggal_selesai_kegiatan ? new Date(a.tanggal_selesai_kegiatan) : null;
        
        // If assignment has no dates, exclude it when filters are applied
        if (!assignmentStart && !assignmentEnd) {
          return false;
        }

        // Check if assignment's date range overlaps with filter range
        if (filterStartDate && assignmentEnd) {
          // Assignment ends before filter start - exclude
          if (assignmentEnd < filterStartDate) {
            return false;
          }
        }
        
        if (filterEndDate && assignmentStart) {
          // Assignment starts after filter end - exclude
          if (assignmentStart > filterEndDate) {
            return false;
          }
        }
      }

      // Filter by unit pemohon
      if (filterUnitPemohon !== "all" && a.unit_pemohon !== filterUnitPemohon) {
        return false;
      }

      // Filter by jenis surat (SPP/SPSA/SPKTNP) - check in nomor_naskah_dinas or jenis_penugasan
      if (filterJenisSurat !== "all") {
        const matchInNomor = a.nomor_naskah_dinas?.toUpperCase().includes(filterJenisSurat);
        const matchInJenis = a.jenis_penugasan?.toUpperCase().includes(filterJenisSurat);
        if (!matchInNomor && !matchInJenis) {
          return false;
        }
      }
      
      return true;
    });
  };

  const filteredAssignments = getFilteredAssignments();
  
  // Get unique unit pemohon for filter dropdown
  const uniqueUnitPemohon = Array.from(new Set(assignmentList.map(a => a.unit_pemohon))).sort();

  const handleExport = async () => {
    if (selectedIds.length === 0) {
      toast.error("Pilih minimal satu data untuk di-export");
      return;
    }

    setLoading(true);
    try {
      const selectedAssignments = filteredAssignments.filter(a => selectedIds.includes(a.id));
      
      // Collect all unique employee IDs from selected assignments
      const allEmployeeIds = Array.from(
        new Set(
          selectedAssignments
            .flatMap(a => a.employee_ids || [])
            .filter(Boolean)
        )
      );

      // Fetch only the employees we need
      const { data: employeeData, error: empError } = await supabase
        .from("employees")
        .select("*")
        .in("id", allEmployeeIds);

      if (empError) throw empError;

      // Create a map for faster lookup
      const employeeMap = new Map();
      employeeData?.forEach(emp => {
        employeeMap.set(emp.id, emp);
      });
      
      // Prepare detailed data for Excel
      const excelData: any[] = [];
      
      selectedAssignments.forEach(assignment => {
        // Format tanggal kegiatan
        let tanggalKegiatan = "-";
        if (assignment.tanggal_mulai_kegiatan && assignment.tanggal_selesai_kegiatan) {
          if (assignment.tanggal_mulai_kegiatan === assignment.tanggal_selesai_kegiatan) {
            tanggalKegiatan = format(new Date(assignment.tanggal_mulai_kegiatan), "dd MMMM yyyy", { locale: idLocale });
          } else {
            tanggalKegiatan = `${format(new Date(assignment.tanggal_mulai_kegiatan), "dd MMMM yyyy", { locale: idLocale })} - ${format(new Date(assignment.tanggal_selesai_kegiatan), "dd MMMM yyyy", { locale: idLocale })}`;
          }
        }

        // Create rows for database employees
        if (assignment.employee_ids && assignment.employee_ids.length > 0) {
          assignment.employee_ids.forEach(empId => {
            const emp = employeeMap.get(empId);
            
            // Debug log if employee not found
            if (!emp) {
              console.warn(`Employee not found for ID: ${empId} in assignment ${assignment.agenda_number}`);
            }
            
            excelData.push({
              "No Agenda": assignment.agenda_number,
              "Unit Pemohon": assignment.unit_pemohon,
              "Unit Penerbit": assignment.unit_penerbit,
              "Nomor Naskah Dinas": assignment.nomor_naskah_dinas,
              "Tanggal Naskah": assignment.tanggal_naskah,
              "Perihal": assignment.perihal,
              "Jenis Penugasan": assignment.jenis_penugasan || "-",
              "Sumber": assignment.sumber || "-",
              "Sumber Satuan Kerja": assignment.sumber_satuan_kerja === "Lainnya" && assignment.sumber_satuan_kerja_custom
                ? assignment.sumber_satuan_kerja_custom
                : assignment.sumber_satuan_kerja || "-",
              "Tempat Penugasan": assignment.tempat_penugasan,
              "Lokasi Detail": assignment.lokasi_penugasan_detail,
              "Tanggal Kegiatan": tanggalKegiatan,
              "Waktu Penugasan": assignment.waktu_penugasan,
              "Tujuan": assignment.tujuan,
              "Nama Pegawai": emp?.nm_pegawai ? toProperCase(emp.nm_pegawai) : "-",
              "Pangkat/Golongan": emp?.uraian_pangkat ? toProperCase(emp.uraian_pangkat) : "-",
              "Jabatan": emp?.uraian_jabatan ? toProperCase(emp.uraian_jabatan) : "-",
              "Tipe Pegawai": "Database",
              "Jumlah Pegawai": (assignment.employee_ids?.length || 0) + (assignment.manual_employees?.length || 0),
              "Tanggal Dibuat": assignment.created_at,
            });
          });
        }
        
        // Create rows for manual employees
        const manualEmps = assignment.manual_employees || [];
        if (manualEmps.length > 0) {
          manualEmps.forEach((manualEmp: ManualEmployee) => {
            excelData.push({
              "No Agenda": assignment.agenda_number,
              "Unit Pemohon": assignment.unit_pemohon,
              "Unit Penerbit": assignment.unit_penerbit,
              "Nomor Naskah Dinas": assignment.nomor_naskah_dinas,
              "Tanggal Naskah": assignment.tanggal_naskah,
              "Perihal": assignment.perihal,
              "Jenis Penugasan": assignment.jenis_penugasan || "-",
              "Sumber": assignment.sumber || "-",
              "Sumber Satuan Kerja": assignment.sumber_satuan_kerja === "Lainnya" && assignment.sumber_satuan_kerja_custom
                ? assignment.sumber_satuan_kerja_custom
                : assignment.sumber_satuan_kerja || "-",
              "Tempat Penugasan": assignment.tempat_penugasan,
              "Lokasi Detail": assignment.lokasi_penugasan_detail,
              "Tanggal Kegiatan": tanggalKegiatan,
              "Waktu Penugasan": assignment.waktu_penugasan,
              "Tujuan": assignment.tujuan,
              "Nama Pegawai": manualEmp.nama ? toProperCase(manualEmp.nama) : "-",
              "Pangkat/Golongan": manualEmp.pangkat ? toProperCase(manualEmp.pangkat) : "-",
              "Jabatan": manualEmp.jabatan ? toProperCase(manualEmp.jabatan) : "-",
              "Tipe Pegawai": "Manual",
              "Jumlah Pegawai": (assignment.employee_ids?.length || 0) + (assignment.manual_employees?.length || 0),
              "Tanggal Dibuat": assignment.created_at,
            });
          });
        }
        
        // If no employees at all, create one row with empty employee data
        if ((!assignment.employee_ids || assignment.employee_ids.length === 0) && manualEmps.length === 0) {
          excelData.push({
            "No Agenda": assignment.agenda_number,
            "Unit Pemohon": assignment.unit_pemohon,
            "Unit Penerbit": assignment.unit_penerbit,
            "Nomor Naskah Dinas": assignment.nomor_naskah_dinas,
            "Tanggal Naskah": assignment.tanggal_naskah,
            "Perihal": assignment.perihal,
            "Jenis Penugasan": assignment.jenis_penugasan || "-",
            "Sumber": assignment.sumber || "-",
            "Sumber Satuan Kerja": assignment.sumber_satuan_kerja === "Lainnya" && assignment.sumber_satuan_kerja_custom
              ? assignment.sumber_satuan_kerja_custom
              : assignment.sumber_satuan_kerja || "-",
            "Tempat Penugasan": assignment.tempat_penugasan,
            "Lokasi Detail": assignment.lokasi_penugasan_detail,
            "Tanggal Kegiatan": tanggalKegiatan,
            "Waktu Penugasan": assignment.waktu_penugasan,
            "Tujuan": assignment.tujuan,
            "Nama Pegawai": "-",
            "Pangkat/Golongan": "-",
            "Jabatan": "-",
            "Tipe Pegawai": "-",
            "Jumlah Pegawai": 0,
            "Tanggal Dibuat": assignment.created_at,
          });
        }
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Penugasan");

      // Auto-size columns
      const maxWidth = excelData.reduce((w: any, r: any) => {
        Object.keys(r).forEach(k => {
          const colWidth = Math.max(
            w[k] || 10,
            String(r[k]).length + 2
          );
          w[k] = Math.min(colWidth, 50);
        });
        return w;
      }, {});

      ws['!cols'] = Object.keys(excelData[0] || {}).map(k => ({
        wch: maxWidth[k] || 10
      }));

      // Generate and download
      XLSX.writeFile(wb, `Data_Penugasan_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success(`${selectedIds.length} data berhasil di-export!`);
      onOpenChange(false);
      setSelectedIds([]);
    } catch (error: any) {
      toast.error(error.message || "Gagal export data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Data ke Excel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Filters */}
          <div className="space-y-4 pb-4 border-b">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tanggal Penugasan Mulai</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filterStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterStartDate ? format(filterStartDate, "dd/MM/yyyy") : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterStartDate}
                      onSelect={setFilterStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Tanggal Penugasan Akhir</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filterEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterEndDate ? format(filterEndDate, "dd/MM/yyyy") : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterEndDate}
                      onSelect={setFilterEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Unit Pemohon</Label>
                <Select value={filterUnitPemohon} onValueChange={setFilterUnitPemohon}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Unit" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">Semua Unit</SelectItem>
                    {uniqueUnitPemohon.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Jenis Surat</Label>
                <Select value={filterJenisSurat} onValueChange={setFilterJenisSurat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="SPP">SPP</SelectItem>
                    <SelectItem value="SPSA">SPSA</SelectItem>
                    <SelectItem value="SPKTNP">SPKTNP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedIds.length === filteredAssignments.length && filteredAssignments.length > 0}
                onCheckedChange={toggleAll}
              />
              <label className="text-sm font-medium cursor-pointer">
                Pilih Semua ({filteredAssignments.length} data)
              </label>
            </div>
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} dipilih
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Tidak ada data penugasan yang sesuai dengan filter
              </p>
            ) : (
              filteredAssignments.map(assignment => (
                <div
                  key={assignment.id}
                  className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => toggleAssignment(assignment.id)}
                >
                  <Checkbox
                    checked={selectedIds.includes(assignment.id)}
                    onCheckedChange={() => toggleAssignment(assignment.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">#{assignment.agenda_number}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm">{assignment.perihal}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {assignment.unit_pemohon} → {assignment.tanggal_naskah}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={loading || selectedIds.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              {loading ? "Exporting..." : `Export ${selectedIds.length} Data`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
