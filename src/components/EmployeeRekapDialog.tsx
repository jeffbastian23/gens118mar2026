import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Download, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toProperCase } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployeeRekapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EmployeeRekapDialog({ open, onOpenChange }: EmployeeRekapDialogProps) {
  const [loading, setLoading] = useState(false);
  const [filterSumber, setFilterSumber] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();

  const handleExport = async () => {
    setLoading(true);
    try {
      // Fetch all assignments with filters
      let query = supabase
        .from("assignments")
        .select("*")
        .order("tanggal_mulai_kegiatan", { ascending: true });

      // Apply sumber filter
      if (filterSumber !== "all") {
        query = query.eq("sumber", filterSumber);
      }

      const { data: assignments, error: assignmentError } = await query;

      if (assignmentError) throw assignmentError;

      // Apply date range filter
      const filteredAssignments = assignments?.filter(a => {
        if (!a.tanggal_mulai_kegiatan) return false;
        
        const assignmentDate = new Date(a.tanggal_mulai_kegiatan);
        
        if (filterStartDate && assignmentDate < filterStartDate) {
          return false;
        }
        
        if (filterEndDate && assignmentDate > filterEndDate) {
          return false;
        }
        
        return true;
      });

      // Fetch all employees
      const { data: employees, error: employeeError } = await supabase
        .from("employees")
        .select("*");

      if (employeeError) throw employeeError;

      // Bangun peta lookup pegawai dan pastikan seluruh ID tersedia
      const employeesById = new Map<string, any>((employees || []).map((e: any) => [e.id, e]));
      const allEmployeeIds = new Set<string>();
      filteredAssignments?.forEach((a) => a.employee_ids?.forEach((id: string) => allEmployeeIds.add(id)));
      const missingIds = Array.from(allEmployeeIds).filter((id) => !employeesById.has(id));
      if (missingIds.length > 0) {
        const { data: missingEmployees } = await supabase
          .from("employees")
          .select("*")
          .in("id", missingIds);
        missingEmployees?.forEach((e: any) => employeesById.set(e.id, e));
      }

      // Create a map of employee assignments with breakdown by sumber
      const employeeMap = new Map<string, {
        name: string;
        dates: string[];
        totalDays: number;
        dipa: { dates: string[], total: number };
        nonDipa: { dates: string[], total: number };
        dbhcht: { dates: string[], total: number };
        dokppn: { dates: string[], total: number };
        kontrakPengadaan: { dates: string[], total: number };
        isManual: boolean;
      }>();
      
      filteredAssignments?.forEach(assignment => {
        // Process database employees
        assignment.employee_ids.forEach((empId: string) => {
          const employee = employeesById.get(empId);
          
          // Selalu buat entri untuk setiap pegawai pada assignment
          if (!employeeMap.has(empId)) {
            employeeMap.set(empId, {
              name: employee ? employee.nm_pegawai : `Pegawai ${empId.slice(0, 8)}`,
              dates: [],
              totalDays: 0,
              dipa: { dates: [], total: 0 },
              nonDipa: { dates: [], total: 0 },
              dbhcht: { dates: [], total: 0 },
              dokppn: { dates: [], total: 0 },
              kontrakPengadaan: { dates: [], total: 0 },
              isManual: false
            });
          }

          const empData = employeeMap.get(empId)!;
          processAssignmentDates(empData, assignment);
        });
        
        // Process manual employees
        const manualEmps = (assignment as any).manual_employees || [];
        manualEmps.forEach((manualEmp: { nama: string; pangkat: string; jabatan: string }, idx: number) => {
          const manualKey = `manual_${manualEmp.nama}_${idx}`;
          
          if (!employeeMap.has(manualKey)) {
            employeeMap.set(manualKey, {
              name: manualEmp.nama,
              dates: [],
              totalDays: 0,
              dipa: { dates: [], total: 0 },
              nonDipa: { dates: [], total: 0 },
              dbhcht: { dates: [], total: 0 },
              dokppn: { dates: [], total: 0 },
              kontrakPengadaan: { dates: [], total: 0 },
              isManual: true
            });
          }
          
          const empData = employeeMap.get(manualKey)!;
          processAssignmentDates(empData, assignment);
        });
      });
      
      // Helper function to process assignment dates
      function processAssignmentDates(empData: any, assignment: any) {
        // Add assignment dates
        if (assignment.tanggal_mulai_kegiatan) {
          const startDate = new Date(assignment.tanggal_mulai_kegiatan);
          const dateStr = `${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear().toString().slice(-2)}`;
          
          let daysCount = 1; // Default to 1 day
          let finalDateStr = dateStr;
          
          // If there's an end date and it's different, show range and calculate days
          if (assignment.tanggal_selesai_kegiatan && 
              assignment.tanggal_mulai_kegiatan !== assignment.tanggal_selesai_kegiatan) {
            const endDate = new Date(assignment.tanggal_selesai_kegiatan);
            const endDateStr = `${endDate.getDate()}/${endDate.getMonth() + 1}/${endDate.getFullYear().toString().slice(-2)}`;
            finalDateStr = `${dateStr}-${endDateStr}`;
            
            // Calculate days difference (inclusive)
            const diffTime = endDate.getTime() - startDate.getTime();
            daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          }
          
          // Add to overall dates
          empData.dates.push(finalDateStr);
          empData.totalDays += daysCount;
          
          // Add to sumber-specific arrays
          const sumber = assignment.sumber || "";
          if (sumber === "DIPA") {
            empData.dipa.dates.push(dateStr);
            empData.dipa.total += 1;
          } else if (sumber === "Non DIPA") {
            empData.nonDipa.dates.push(dateStr);
            empData.nonDipa.total += 1;
          } else if (sumber === "DBHCHT") {
            empData.dbhcht.dates.push(dateStr);
            empData.dbhcht.total += 1;
          } else if (sumber === "DOKPPN") {
            empData.dokppn.dates.push(dateStr);
            empData.dokppn.total += 1;
          } else if (sumber === "Kontak Pengadaan") {
            empData.kontrakPengadaan.dates.push(dateStr);
            empData.kontrakPengadaan.total += 1;
          }
        }
      }

      // Convert to Excel format
      const excelData = Array.from(employeeMap.values()).map(emp => {
        const totalSumber = emp.dipa.total + emp.nonDipa.total + emp.dbhcht.total + emp.dokppn.total + emp.kontrakPengadaan.total;
        
        return {
          "Nama Lengkap": toProperCase(emp.name),
          "Tipe Pegawai": emp.isManual ? "Manual" : "Database",
          "Tanggal Penugasan": emp.dates.join(", "),
          "Total Penugasan": emp.totalDays,
          "Total Sumber": totalSumber,
          "Tanggal DIPA": emp.dipa.dates.join(", ") || "-",
          "Total DIPA": emp.dipa.total,
          "Tanggal Non Dipa": emp.nonDipa.dates.join(", ") || "-",
          "Total Non DIPA": emp.nonDipa.total,
          "Tanggal DBHCHT": emp.dbhcht.dates.join(", ") || "-",
          "Total DBHCHT": emp.dbhcht.total,
          "Tanggal DOKPPN": emp.dokppn.dates.join(", ") || "-",
          "Total DOKPPN": emp.dokppn.total,
          "Tanggal Kontrak Pengadaan": emp.kontrakPengadaan.dates.join(", ") || "-",
          "Total Kontrak Pengadaan": emp.kontrakPengadaan.total
        };
      });

      if (excelData.length === 0) {
        toast.error("Tidak ada data untuk di-export");
        return;
      }

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rekap ST Pegawai");

      // Auto-size columns
      const maxWidth = excelData.reduce((w: any, r: any) => {
        Object.keys(r).forEach(k => {
          const colWidth = Math.max(
            w[k] || 10,
            String(r[k]).length + 2
          );
          w[k] = Math.min(colWidth, 80);
        });
        return w;
      }, {});

      ws['!cols'] = Object.keys(excelData[0] || {}).map(k => ({
        wch: maxWidth[k] || 10
      }));

      // Generate and download
      XLSX.writeFile(wb, `Rekap_ST_Pegawai_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success("Rekap ST Pegawai berhasil di-export!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal export data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Rekap ST Pegawai</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export akan menghasilkan file Excel berisi daftar pegawai beserta tanggal-tanggal penugasan mereka.
          </p>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-t pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filter Sumber Dana</Label>
              <Select value={filterSumber} onValueChange={setFilterSumber}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Sumber" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Sumber</SelectItem>
                  <SelectItem value="DIPA">DIPA</SelectItem>
                  <SelectItem value="Non DIPA">Non DIPA</SelectItem>
                  <SelectItem value="DBHCHT">DBHCHT</SelectItem>
                  <SelectItem value="DOKPPN">DOKPPN</SelectItem>
                  <SelectItem value="Kontak Pengadaan">Kontak Pengadaan</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={loading}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {loading ? "Exporting..." : "Export Rekap"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
