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

interface PlhKepala {
  id: string;
  agenda_number: number;
  unit_pemohon: string;
  unit_penerbit: string;
  dasar_penugasan: string;
  nomor_naskah_dinas: string;
  tanggal: string;
  perihal: string;
  employee_id: string;
  tanggal_plh_mulai?: string;
  tanggal_plh_selesai?: string;
  pejabat_unit_pemohon_id: string;
  pejabat_unit_penerbit_id: string;
  jenis_plh_plt?: string;
  created_at: string;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [plhKepalaList, setPlhKepalaList] = useState<PlhKepala[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();
  const [filterJenis, setFilterJenis] = useState<string>("all");
  const [filterUnitPemohon, setFilterUnitPemohon] = useState<string>("all");

  useEffect(() => {
    if (open) {
      fetchPlhKepala();
    }
  }, [open]);

  const fetchPlhKepala = async () => {
    try {
      const { data, error } = await supabase
        .from("plh_kepala")
        .select("*")
        .order("agenda_number", { ascending: false });

      if (error) throw error;
      setPlhKepalaList(data || []);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data");
    }
  };

  const togglePlhKepala = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredPlhKepala.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPlhKepala.map(a => a.id));
    }
  };

  const getFilteredPlhKepala = () => {
    return plhKepalaList.filter(p => {
      // Filter by date range
      if (filterStartDate && p.tanggal_plh_mulai) {
        const plhDate = new Date(p.tanggal_plh_mulai);
        if (plhDate < filterStartDate) {
          return false;
        }
      }
      
      if (filterEndDate && p.tanggal_plh_mulai) {
        const plhDate = new Date(p.tanggal_plh_mulai);
        if (plhDate > filterEndDate) {
          return false;
        }
      }

      // Filter by jenis PLH/PLT
      if (filterJenis !== "all" && p.jenis_plh_plt !== filterJenis) {
        return false;
      }

      // Filter by unit pemohon
      if (filterUnitPemohon !== "all" && p.unit_pemohon !== filterUnitPemohon) {
        return false;
      }
      
      return true;
    });
  };

  const filteredPlhKepala = getFilteredPlhKepala();
  
  // Get unique unit pemohon for filter dropdown
  const uniqueUnitPemohon = Array.from(new Set(plhKepalaList.map(p => p.unit_pemohon))).sort();

  const handleExport = async () => {
    if (selectedIds.length === 0) {
      toast.error("Pilih minimal satu data untuk di-export");
      return;
    }

    setLoading(true);
    try {
      const selectedPlhKepala = filteredPlhKepala.filter(p => selectedIds.includes(p.id));
      
      // Collect all unique employee IDs
      const allEmployeeIds = Array.from(
        new Set(
          selectedPlhKepala.flatMap(p => [
            p.employee_id,
            p.pejabat_unit_pemohon_id,
            p.pejabat_unit_penerbit_id
          ]).filter(Boolean)
        )
      );

      // Fetch only needed employees
      const { data: employeeData, error: empError } = await supabase
        .from("employees")
        .select("*")
        .in("id", allEmployeeIds);

      if (empError) throw empError;

      // Create employee map for faster lookup
      const employeeMap = new Map();
      employeeData?.forEach(emp => {
        employeeMap.set(emp.id, emp);
      });
      
      // Prepare detailed data for Excel
      const excelData: any[] = [];
      
      selectedPlhKepala.forEach(plh => {
        // Get employee PLH
        const plhEmployee = employeeMap.get(plh.employee_id);
        
        // Debug log
        if (!plhEmployee && plh.employee_id) {
          console.warn(`Employee not found for PLH ID: ${plh.employee_id} in agenda ${plh.agenda_number}`);
        }
        
        // Get signing officials
        const pemohonOfficial = employeeMap.get(plh.pejabat_unit_pemohon_id);
        const penerbitOfficial = employeeMap.get(plh.pejabat_unit_penerbit_id);

        excelData.push({
          "No Agenda": plh.agenda_number,
          "Jenis": plh.jenis_plh_plt || "PLH",
          "Unit Pemohon": plh.unit_pemohon,
          "Unit Penerbit": plh.unit_penerbit,
          "Dasar Penugasan": plh.dasar_penugasan,
          "Nomor Naskah Dinas": plh.nomor_naskah_dinas,
          "Tanggal Naskah": plh.tanggal,
          "Perihal": plh.perihal,
          "Pejabat PLH": plhEmployee?.nm_pegawai ? toProperCase(plhEmployee.nm_pegawai) : "-",
          "Pangkat/Golongan": plhEmployee?.uraian_pangkat ? toProperCase(plhEmployee.uraian_pangkat) : "-",
          "Jabatan": plhEmployee?.uraian_jabatan ? toProperCase(plhEmployee.uraian_jabatan) : "-",
          "Tanggal PLH Mulai": plh.tanggal_plh_mulai || "-",
          "Tanggal PLH Selesai": plh.tanggal_plh_selesai || "-",
          "Pejabat Penandatangan Pemohon": pemohonOfficial?.nm_pegawai ? toProperCase(pemohonOfficial.nm_pegawai) : "-",
          "Pejabat Penandatangan Penerbit": penerbitOfficial?.nm_pegawai ? toProperCase(penerbitOfficial.nm_pegawai) : "-",
          "Tanggal Dibuat": plh.created_at,
        });
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data PLH-PLT");

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
      XLSX.writeFile(wb, `Data_PLH_PLT_${new Date().toISOString().split('T')[0]}.xlsx`);
      
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
                <Label className="text-sm font-medium">Tanggal Mulai</Label>
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
                <Label className="text-sm font-medium">Tanggal Akhir</Label>
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
                <Label className="text-sm font-medium">Jenis PLH/PLT</Label>
                <Select value={filterJenis} onValueChange={setFilterJenis}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="PLH">PLH (Pelaksana Harian)</SelectItem>
                    <SelectItem value="PLT">PLT (Pelaksana Tugas)</SelectItem>
                  </SelectContent>
                </Select>
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
          </div>

          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedIds.length === filteredPlhKepala.length && filteredPlhKepala.length > 0}
                onCheckedChange={toggleAll}
              />
              <label className="text-sm font-medium cursor-pointer">
                Pilih Semua ({filteredPlhKepala.length} data)
              </label>
            </div>
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} dipilih
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredPlhKepala.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Tidak ada data PLH/PLT yang sesuai dengan filter
              </p>
            ) : (
              filteredPlhKepala.map(plh => (
                <div
                  key={plh.id}
                  className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => togglePlhKepala(plh.id)}
                >
                  <Checkbox
                    checked={selectedIds.includes(plh.id)}
                    onCheckedChange={() => togglePlhKepala(plh.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">#{plh.agenda_number}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm">{plh.perihal}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {plh.unit_pemohon} → {plh.tanggal_plh_mulai || plh.tanggal}
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
