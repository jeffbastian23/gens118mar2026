import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Download, FileSpreadsheet } from "lucide-react";
import { format, differenceInDays } from "date-fns";
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
  no_satu_kemenkeu?: string;
  tanggal_satu_kemenkeu?: string;
  pejabat_unit_penerbit_id?: string;
}

interface SPDExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SPDExportDialog({ open, onOpenChange }: SPDExportDialogProps) {
  const [assignmentList, setAssignmentList] = useState<Assignment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();
  const [filterUnitPemohon, setFilterUnitPemohon] = useState<string>("all");

  useEffect(() => {
    if (open) {
      fetchAssignments();
    }
  }, [open]);

  const fetchAssignments = async () => {
    try {
      // Only fetch assignments that have no_satu_kemenkeu filled
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .not("no_satu_kemenkeu", "is", null)
        .neq("no_satu_kemenkeu", "")
        .order("tanggal_satu_kemenkeu", { ascending: false });

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
      // Filter by date range using tanggal_mulai_kegiatan and tanggal_selesai_kegiatan (tanggal penugasan)
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

      // Collect all pejabat unit penerbit IDs
      const pejabatIds = selectedAssignments
        .map(a => a.pejabat_unit_penerbit_id)
        .filter(Boolean);

      // Fetch only the employees we need
      const { data: employeeData, error: empError } = await supabase
        .from("employees")
        .select("*")
        .in("id", [...allEmployeeIds, ...pejabatIds]);

      if (empError) throw empError;

      // Create a map for faster lookup
      const employeeMap = new Map();
      employeeData?.forEach(emp => {
        employeeMap.set(emp.id, emp);
      });
      
      // Prepare detailed data for Excel
      const excelData: any[] = [];
      let rowNumber = 1;
      
      selectedAssignments.forEach(assignment => {
        // Calculate jumlah hari
        let jumlahHari = 0;
        if (assignment.tanggal_mulai_kegiatan && assignment.tanggal_selesai_kegiatan) {
          const startDate = new Date(assignment.tanggal_mulai_kegiatan);
          const endDate = new Date(assignment.tanggal_selesai_kegiatan);
          jumlahHari = differenceInDays(endDate, startDate) + 1; // Include both start and end date
        }

        // Get pejabat unit penerbit name
        const pejabatPenerbit = assignment.pejabat_unit_penerbit_id 
          ? employeeMap.get(assignment.pejabat_unit_penerbit_id)
          : null;

        // Get DIPA value from sumber_satuan_kerja
        const dipa = assignment.sumber_satuan_kerja === "Lain-lain" && assignment.sumber_satuan_kerja_custom
          ? assignment.sumber_satuan_kerja_custom
          : assignment.sumber_satuan_kerja || "-";

        // Create rows for database employees
        if (assignment.employee_ids && assignment.employee_ids.length > 0) {
          assignment.employee_ids.forEach(empId => {
            const emp = employeeMap.get(empId);
            
            excelData.push({
              "No": rowNumber++,
              "Tanggal SPD": assignment.tanggal_satu_kemenkeu 
                ? format(new Date(assignment.tanggal_satu_kemenkeu), "dd MMMM yyyy", { locale: idLocale })
                : "-",
              "Nama": emp?.nm_pegawai ? toProperCase(emp.nm_pegawai) : "-",
              "Uraian Pangkat": emp?.uraian_pangkat ? toProperCase(emp.uraian_pangkat) : "-",
              "Jabatan": emp?.uraian_jabatan ? toProperCase(emp.uraian_jabatan) : "-",
              "Unit Organisasi": emp?.nm_unit_organisasi ? toProperCase(emp.nm_unit_organisasi) : "-",
              "No ST": assignment.no_satu_kemenkeu || "-",
              "Maksud Perjalanan Dinas": assignment.tujuan || "-",
              "Tujuan Perjalanan Dinas": assignment.tempat_penugasan || "-",
              "Berangkat": assignment.tanggal_mulai_kegiatan 
                ? format(new Date(assignment.tanggal_mulai_kegiatan), "dd MMMM yyyy", { locale: idLocale })
                : "-",
              "Pulang": assignment.tanggal_selesai_kegiatan 
                ? format(new Date(assignment.tanggal_selesai_kegiatan), "dd MMMM yyyy", { locale: idLocale })
                : "-",
              "Jumlah Hari": jumlahHari,
              "Nama Pejabat": pejabatPenerbit?.nm_pegawai 
                ? toProperCase(pejabatPenerbit.nm_pegawai) 
                : "-",
              "DIPA": dipa,
              "Tipe Pegawai": "Database",
            });
          });
        }
        
        // Create rows for manual employees
        const manualEmps = (assignment.manual_employees || []) as ManualEmployee[];
        if (manualEmps.length > 0) {
          manualEmps.forEach((manualEmp: ManualEmployee) => {
            excelData.push({
              "No": rowNumber++,
              "Tanggal SPD": assignment.tanggal_satu_kemenkeu 
                ? format(new Date(assignment.tanggal_satu_kemenkeu), "dd MMMM yyyy", { locale: idLocale })
                : "-",
              "Nama": manualEmp.nama ? toProperCase(manualEmp.nama) : "-",
              "Uraian Pangkat": manualEmp.pangkat ? toProperCase(manualEmp.pangkat) : "-",
              "Jabatan": manualEmp.jabatan ? toProperCase(manualEmp.jabatan) : "-",
              "Unit Organisasi": "-",
              "No ST": assignment.no_satu_kemenkeu || "-",
              "Maksud Perjalanan Dinas": assignment.tujuan || "-",
              "Tujuan Perjalanan Dinas": assignment.tempat_penugasan || "-",
              "Berangkat": assignment.tanggal_mulai_kegiatan 
                ? format(new Date(assignment.tanggal_mulai_kegiatan), "dd MMMM yyyy", { locale: idLocale })
                : "-",
              "Pulang": assignment.tanggal_selesai_kegiatan 
                ? format(new Date(assignment.tanggal_selesai_kegiatan), "dd MMMM yyyy", { locale: idLocale })
                : "-",
              "Jumlah Hari": jumlahHari,
              "Nama Pejabat": pejabatPenerbit?.nm_pegawai 
                ? toProperCase(pejabatPenerbit.nm_pegawai) 
                : "-",
              "DIPA": dipa,
              "Tipe Pegawai": "Manual",
            });
          });
        }
        
        // If no employees at all, create one row with empty employee data
        if ((!assignment.employee_ids || assignment.employee_ids.length === 0) && manualEmps.length === 0) {
          excelData.push({
            "No": rowNumber++,
            "Tanggal SPD": assignment.tanggal_satu_kemenkeu 
              ? format(new Date(assignment.tanggal_satu_kemenkeu), "dd MMMM yyyy", { locale: idLocale })
              : "-",
            "Nama": "-",
            "Uraian Pangkat": "-",
            "Jabatan": "-",
            "Unit Organisasi": "-",
            "No ST": assignment.no_satu_kemenkeu || "-",
            "Maksud Perjalanan Dinas": assignment.tujuan || "-",
            "Tujuan Perjalanan Dinas": assignment.tempat_penugasan || "-",
            "Berangkat": assignment.tanggal_mulai_kegiatan 
              ? format(new Date(assignment.tanggal_mulai_kegiatan), "dd MMMM yyyy", { locale: idLocale })
              : "-",
            "Pulang": assignment.tanggal_selesai_kegiatan 
              ? format(new Date(assignment.tanggal_selesai_kegiatan), "dd MMMM yyyy", { locale: idLocale })
              : "-",
            "Jumlah Hari": jumlahHari,
            "Nama Pejabat": pejabatPenerbit?.nm_pegawai 
              ? toProperCase(pejabatPenerbit.nm_pegawai) 
              : "-",
            "DIPA": dipa,
            "Tipe Pegawai": "-",
          });
        }
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data SPD");

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
      XLSX.writeFile(wb, `Data_SPD_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success(`${selectedIds.length} data SPD berhasil di-export!`);
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
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export Data SPD ke Excel
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export data penugasan yang sudah memiliki No. Satu Kemenkeu (SPD).
          </p>

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
                Tidak ada data penugasan dengan No. Satu Kemenkeu yang sesuai dengan filter
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
                      <span className="text-sm text-primary font-medium">{assignment.no_satu_kemenkeu}</span>
                    </div>
                    <div className="text-sm">{assignment.perihal || assignment.tujuan}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {assignment.tanggal_satu_kemenkeu 
                        ? format(new Date(assignment.tanggal_satu_kemenkeu), "dd MMM yyyy", { locale: idLocale })
                        : "-"
                      } • {assignment.tempat_penugasan}
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
              {loading ? "Exporting..." : `Export ${selectedIds.length} Data SPD`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
