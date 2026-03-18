import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Building2, TrendingUp, Calendar, ArrowRightLeft, LogIn, LogOut, ChevronDown, ChevronUp, Filter, Maximize2, Minimize2, X, Search, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface Mutasi {
  id: string;
  nomor_kep: string;
  tanggal_kep: string;
  nama_lengkap: string;
  nip: string | null;
  pangkat_golongan: string | null;
  jabatan: string | null;
  unit_lama: string;
  unit_baru: string;
  created_at: string;
}

// Jabatan categories for summary table
const JABATAN_CATEGORIES = [
  "Pengawas",
  "PBC Madya",
  "PBC Muda",
  "PBC Pertama",
  "PBC Mahir",
  "PBC Terampil",
  "Pelaksana"
];

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];

interface EmployeeDetail {
  nama_lengkap: string;
  nip: string | null;
  pangkat_golongan: string | null;
  status: "in" | "out";
}

// Kanwil DJBC Jawa Timur regional offices
const KANWIL_UNITS = [
  "Kantor Wilayah DJBC Jawa Timur I",
  "KPPBC TMP Tanjung Perak",
  "KPPBC TMP Juanda",
  "KPPBC TMP A Pasuruan",
  "KPPBC TMP B Sidoarjo",
  "KPPBC TMP B Gresik",
  "KPPBC TMP C Bojonegoro",
  "KPPBC TMP C Madura",
  "Balai Laboratorium Kelas I Surabaya"
];

const UNIT_COLORS: Record<string, string> = {
  "Kantor Wilayah DJBC Jawa Timur I": "#3B82F6",
  "KPPBC TMP Tanjung Perak": "#10B981",
  "KPPBC TMP Juanda": "#F59E0B",
  "KPPBC TMP A Pasuruan": "#EF4444",
  "KPPBC TMP B Sidoarjo": "#8B5CF6",
  "KPPBC TMP B Gresik": "#EC4899",
  "KPPBC TMP C Bojonegoro": "#06B6D4",
  "KPPBC TMP C Madura": "#84CC16",
  "Balai Laboratorium Kelas I Surabaya": "#F97316"
};

export default function MutasiDashboard() {
  const [data, setData] = useState<Mutasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Filter states
  const [selectedKEPs, setSelectedKEPs] = useState<Set<string>>(new Set());
  const [filterNama, setFilterNama] = useState<string>("");
  const [filterSatker, setFilterSatker] = useState<string>("all");
  const [filterUnitLama, setFilterUnitLama] = useState<string>("all");
  const [filterUnitBaru, setFilterUnitBaru] = useState<string>("all");
  
  // Search states for dropdowns
  const [searchKEP, setSearchKEP] = useState<string>("");
  const [searchSatker, setSearchSatker] = useState<string>("");
  const [searchUnitLama, setSearchUnitLama] = useState<string>("");
  const [searchUnitBaru, setSearchUnitBaru] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: mutasiData, error } = await supabase
        .from("mutasi")
        .select("*")
        .order("tanggal_kep", { ascending: false });

      if (error) throw error;
      setData(mutasiData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filter dropdowns
  const uniqueKEPs = useMemo(() => [...new Set(data.map(d => d.nomor_kep))].sort(), [data]);
  const uniqueSatkers = useMemo(() => {
    const satkers = new Set<string>();
    data.forEach(d => {
      satkers.add(d.unit_lama);
      satkers.add(d.unit_baru);
    });
    return [...satkers].sort();
  }, [data]);
  const uniqueUnitLama = useMemo(() => [...new Set(data.map(d => d.unit_lama))].sort(), [data]);
  const uniqueUnitBaru = useMemo(() => [...new Set(data.map(d => d.unit_baru))].sort(), [data]);

  // Filtered dropdown options based on search
  const filteredKEPs = useMemo(() => 
    uniqueKEPs.filter(kep => kep.toLowerCase().includes(searchKEP.toLowerCase())), 
    [uniqueKEPs, searchKEP]
  );
  const filteredSatkers = useMemo(() => 
    uniqueSatkers.filter(s => s.toLowerCase().includes(searchSatker.toLowerCase())), 
    [uniqueSatkers, searchSatker]
  );
  const filteredUnitLamaOptions = useMemo(() => 
    uniqueUnitLama.filter(u => u.toLowerCase().includes(searchUnitLama.toLowerCase())), 
    [uniqueUnitLama, searchUnitLama]
  );
  const filteredUnitBaruOptions = useMemo(() => 
    uniqueUnitBaru.filter(u => u.toLowerCase().includes(searchUnitBaru.toLowerCase())), 
    [uniqueUnitBaru, searchUnitBaru]
  );

  // Toggle KEP selection
  const toggleKEPSelection = (kep: string) => {
    const newSelected = new Set(selectedKEPs);
    if (newSelected.has(kep)) {
      newSelected.delete(kep);
    } else {
      newSelected.add(kep);
    }
    setSelectedKEPs(newSelected);
  };

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (selectedKEPs.size > 0 && !selectedKEPs.has(item.nomor_kep)) return false;
      if (filterNama && !item.nama_lengkap.toLowerCase().includes(filterNama.toLowerCase())) return false;
      if (filterSatker !== "all" && item.unit_lama !== filterSatker && item.unit_baru !== filterSatker) return false;
      if (filterUnitLama !== "all" && item.unit_lama !== filterUnitLama) return false;
      if (filterUnitBaru !== "all" && item.unit_baru !== filterUnitBaru) return false;
      return true;
    });
  }, [data, selectedKEPs, filterNama, filterSatker, filterUnitLama, filterUnitBaru]);

  // Toggle unit expansion
  const toggleUnitExpansion = (unit: string) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unit)) {
      newExpanded.delete(unit);
    } else {
      newExpanded.add(unit);
    }
    setExpandedUnits(newExpanded);
  };

  // Get employees for a specific unit with their in/out status
  const getEmployeesForUnit = (unit: string): EmployeeDetail[] => {
    const employees: EmployeeDetail[] = [];
    
    // Employees coming IN (unit_baru matches)
    filteredData
      .filter(item => 
        item.unit_baru.toLowerCase().includes(unit.toLowerCase()) ||
        unit.toLowerCase().includes(item.unit_baru.toLowerCase())
      )
      .forEach(item => {
        employees.push({
          nama_lengkap: item.nama_lengkap,
          nip: item.nip,
          pangkat_golongan: item.pangkat_golongan,
          status: "in"
        });
      });
    
    // Employees going OUT (unit_lama matches)
    filteredData
      .filter(item => 
        item.unit_lama.toLowerCase().includes(unit.toLowerCase()) ||
        unit.toLowerCase().includes(item.unit_lama.toLowerCase())
      )
      .forEach(item => {
        employees.push({
          nama_lengkap: item.nama_lengkap,
          nip: item.nip,
          pangkat_golongan: item.pangkat_golongan,
          status: "out"
        });
      });
    
    return employees;
  };

  // Calculate regional statistics for Kanwil DJBC Jawa Timur
  const calculateRegionalStats = () => {
    const stats: { unit: string; masuk: number; keluar: number; net: number }[] = [];
    
    KANWIL_UNITS.forEach(unit => {
      // Count employees going OUT (unit_lama matches this unit)
      const keluar = filteredData.filter(item => 
        item.unit_lama.toLowerCase().includes(unit.toLowerCase()) ||
        unit.toLowerCase().includes(item.unit_lama.toLowerCase())
      ).length;
      
      // Count employees coming IN (unit_baru matches this unit)
      const masuk = filteredData.filter(item => 
        item.unit_baru.toLowerCase().includes(unit.toLowerCase()) ||
        unit.toLowerCase().includes(item.unit_baru.toLowerCase())
      ).length;
      
      stats.push({
        unit,
        masuk,
        keluar,
        net: masuk - keluar
      });
    });
    
    return stats;
  };

  const regionalStats = calculateRegionalStats();
  const totalMasuk = regionalStats.reduce((sum, s) => sum + s.masuk, 0);
  const totalKeluar = regionalStats.reduce((sum, s) => sum + s.keluar, 0);

  // Calculate statistics using filtered data
  const totalMutasi = filteredData.length;
  
  // Group by unit_baru (destination unit)
  const unitBaruCounts: Record<string, number> = {};
  filteredData.forEach(item => {
    const unit = item.unit_baru || "Tidak Diketahui";
    unitBaruCounts[unit] = (unitBaruCounts[unit] || 0) + 1;
  });
  
  // Group by unit_lama (origin unit)
  const unitLamaCounts: Record<string, number> = {};
  filteredData.forEach(item => {
    const unit = item.unit_lama || "Tidak Diketahui";
    unitLamaCounts[unit] = (unitLamaCounts[unit] || 0) + 1;
  });

  // Group by month for bar chart
  const monthlyData: Record<string, number> = {};
  filteredData.forEach(item => {
    const date = new Date(item.tanggal_kep);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
  });

  const barChartData = Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([month, count]) => ({
      month: month,
      jumlah: count
    }));

  // Pie chart data for unit_baru
  const pieChartData = Object.entries(unitBaruCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([unit, count]) => ({
      name: unit.length > 20 ? unit.substring(0, 20) + "..." : unit,
      fullName: unit,
      value: count
    }));

  // Get unique units count
  const uniqueUnitBaruCount = Object.keys(unitBaruCounts).length;
  const uniqueUnitLamaCount = Object.keys(unitLamaCounts).length;

  // Get current year data
  const currentYear = new Date().getFullYear();
  const currentYearData = filteredData.filter(item => 
    new Date(item.tanggal_kep).getFullYear() === currentYear
  ).length;

  // Calculate Jabatan Summary
  const jabatanSummary = useMemo(() => {
    const summary: Record<string, { keluarMutasi: number; keluarPromosi: number; masukMutasi: number; masukPromosi: number }> = {};
    
    JABATAN_CATEGORIES.forEach(jab => {
      summary[jab] = { keluarMutasi: 0, keluarPromosi: 0, masukMutasi: 0, masukPromosi: 0 };
    });
    
    filteredData.forEach(item => {
      if (!item.jabatan) return;
      
      // Find the base jabatan category
      const baseJabatan = JABATAN_CATEGORIES.find(jab => 
        item.jabatan?.startsWith(jab)
      );
      
      if (!baseJabatan) return;
      
      // Check if coming INTO Kanwil units
      const isKanwilUnitBaru = KANWIL_UNITS.some(unit => 
        item.unit_baru.toLowerCase().includes(unit.toLowerCase()) ||
        unit.toLowerCase().includes(item.unit_baru.toLowerCase())
      );
      
      // Check if leaving FROM Kanwil units
      const isKanwilUnitLama = KANWIL_UNITS.some(unit => 
        item.unit_lama.toLowerCase().includes(unit.toLowerCase()) ||
        unit.toLowerCase().includes(item.unit_lama.toLowerCase())
      );
      
      if (item.jabatan.includes("(Mutasi)")) {
        if (isKanwilUnitLama) {
          summary[baseJabatan].keluarMutasi++;
        }
        if (isKanwilUnitBaru) {
          summary[baseJabatan].masukMutasi++;
        }
      } else if (item.jabatan.includes("(Promosi)")) {
        if (isKanwilUnitLama) {
          summary[baseJabatan].keluarPromosi++;
        }
        if (isKanwilUnitBaru) {
          summary[baseJabatan].masukPromosi++;
        }
      } else if (item.jabatan === "Pelaksana") {
        if (isKanwilUnitLama && !isKanwilUnitBaru) {
          summary[baseJabatan].keluarMutasi++;
        }
        if (isKanwilUnitBaru && !isKanwilUnitLama) {
          summary[baseJabatan].masukMutasi++;
        }
      }
    });
    
    return summary;
  }, [filteredData]);

  // Pie chart data for satuan kerja population
  const satkerPieData = useMemo(() => {
    const satkerCounts: Record<string, number> = {};
    
    KANWIL_UNITS.forEach(unit => {
      const count = filteredData.filter(item => 
        item.unit_baru.toLowerCase().includes(unit.toLowerCase()) ||
        unit.toLowerCase().includes(item.unit_baru.toLowerCase())
      ).length;
      if (count > 0) {
        satkerCounts[unit] = count;
      }
    });
    
    return Object.entries(satkerCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name: name.length > 25 ? name.substring(0, 25) + "..." : name,
        fullName: name,
        value
      }));
  }, [filteredData]);

  // Export filtered data to Excel
  const handleExportFilteredExcel = () => {
    const exportData = filteredData.map((item, index) => ({
      No: index + 1,
      "Nomor KEP": item.nomor_kep,
      "Tanggal KEP": format(new Date(item.tanggal_kep), "dd/MM/yyyy"),
      "Nama Lengkap": item.nama_lengkap,
      "NIP": item.nip || "",
      "Jabatan": item.jabatan || "",
      "Unit Lama": item.unit_lama,
      "Unit Baru": item.unit_baru
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Mutasi");
    XLSX.writeFile(wb, `Data_Mutasi_Filtered_${format(new Date(), "yyyyMMdd")}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Data
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open("https://excelsakti.netlify.app/", "_blank")}
              className="flex items-center gap-2"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Konverter Mutasi
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* No. KEP - Checkbox Multi-Select with Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">No. KEP</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-left font-normal">
                    <span className="truncate">
                      {selectedKEPs.size === 0 
                        ? "Semua KEP" 
                        : `${selectedKEPs.size} KEP dipilih`}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 bg-background border z-50" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari No. KEP..."
                        value={searchKEP}
                        onChange={(e) => setSearchKEP(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="p-2 space-y-1">
                      {selectedKEPs.size > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setSelectedKEPs(new Set())}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Hapus Semua Filter
                        </Button>
                      )}
                      {filteredKEPs.map(kep => (
                        <div
                          key={kep}
                          className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                          onClick={() => toggleKEPSelection(kep)}
                        >
                          <Checkbox
                            checked={selectedKEPs.has(kep)}
                            onCheckedChange={() => toggleKEPSelection(kep)}
                          />
                          <span className="text-sm truncate">{kep}</span>
                        </div>
                      ))}
                      {filteredKEPs.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Tidak ada data ditemukan
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filter-nama" className="text-sm font-medium">Nama</Label>
              <Input
                id="filter-nama"
                placeholder="Cari nama..."
                value={filterNama}
                onChange={(e) => setFilterNama(e.target.value)}
              />
            </div>
            
            {/* Satuan Kerja - With Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Satuan Kerja</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-left font-normal">
                    <span className="truncate">
                      {filterSatker === "all" ? "Semua Satker" : filterSatker}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 bg-background border z-50" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari Satker..."
                        value={searchSatker}
                        onChange={(e) => setSearchSatker(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="p-2 space-y-1">
                      <div
                        className={`p-2 hover:bg-muted rounded cursor-pointer ${filterSatker === "all" ? "bg-muted" : ""}`}
                        onClick={() => { setFilterSatker("all"); setSearchSatker(""); }}
                      >
                        <span className="text-sm">Semua Satker</span>
                      </div>
                      {filteredSatkers.map(satker => (
                        <div
                          key={satker}
                          className={`p-2 hover:bg-muted rounded cursor-pointer ${filterSatker === satker ? "bg-muted" : ""}`}
                          onClick={() => { setFilterSatker(satker); setSearchSatker(""); }}
                        >
                          <span className="text-sm truncate block">{satker}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Unit Lama - With Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Unit Lama</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-left font-normal">
                    <span className="truncate">
                      {filterUnitLama === "all" ? "Semua Unit Lama" : filterUnitLama}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 bg-background border z-50" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari Unit Lama..."
                        value={searchUnitLama}
                        onChange={(e) => setSearchUnitLama(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="p-2 space-y-1">
                      <div
                        className={`p-2 hover:bg-muted rounded cursor-pointer ${filterUnitLama === "all" ? "bg-muted" : ""}`}
                        onClick={() => { setFilterUnitLama("all"); setSearchUnitLama(""); }}
                      >
                        <span className="text-sm">Semua Unit Lama</span>
                      </div>
                      {filteredUnitLamaOptions.map(unit => (
                        <div
                          key={unit}
                          className={`p-2 hover:bg-muted rounded cursor-pointer ${filterUnitLama === unit ? "bg-muted" : ""}`}
                          onClick={() => { setFilterUnitLama(unit); setSearchUnitLama(""); }}
                        >
                          <span className="text-sm truncate block">{unit}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Unit Baru - With Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Unit Baru</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-left font-normal">
                    <span className="truncate">
                      {filterUnitBaru === "all" ? "Semua Unit Baru" : filterUnitBaru}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 bg-background border z-50" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari Unit Baru..."
                        value={searchUnitBaru}
                        onChange={(e) => setSearchUnitBaru(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="p-2 space-y-1">
                      <div
                        className={`p-2 hover:bg-muted rounded cursor-pointer ${filterUnitBaru === "all" ? "bg-muted" : ""}`}
                        onClick={() => { setFilterUnitBaru("all"); setSearchUnitBaru(""); }}
                      >
                        <span className="text-sm">Semua Unit Baru</span>
                      </div>
                      {filteredUnitBaruOptions.map(unit => (
                        <div
                          key={unit}
                          className={`p-2 hover:bg-muted rounded cursor-pointer ${filterUnitBaru === unit ? "bg-muted" : ""}`}
                          onClick={() => { setFilterUnitBaru(unit); setSearchUnitBaru(""); }}
                        >
                          <span className="text-sm truncate block">{unit}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Mutasi</p>
                <p className="text-2xl font-bold">{totalMutasi}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mutasi {currentYear}</p>
                <p className="text-2xl font-bold">{currentYearData}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unit Asal</p>
                <p className="text-2xl font-bold">{uniqueUnitLamaCount}</p>
              </div>
              <Building2 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unit Tujuan</p>
                <p className="text-2xl font-bold">{uniqueUnitBaruCount}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Statistik Wilayah (left) & Tren Mutasi (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Kanwil DJBC Jawa Timur Regional Statistics */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Statistik Wilayah Kanwil DJBC Jawa Timur I
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(true)}
              className="h-8 w-8"
              title="Tampilkan Layar Penuh"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-1">
                  <LogIn className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">Total Masuk</span>
                </div>
                <p className="text-xl font-bold text-green-600 mt-1">{totalMasuk}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-1">
                  <LogOut className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-medium text-red-700 dark:text-red-300">Total Keluar</span>
                </div>
                <p className="text-xl font-bold text-red-600 mt-1">{totalKeluar}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800 col-span-2">
                <div className="flex items-center gap-1">
                  <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Net Movement</span>
                </div>
                <p className={`text-xl font-bold mt-1 ${totalMasuk - totalKeluar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalMasuk - totalKeluar >= 0 ? '+' : ''}{totalMasuk - totalKeluar}
                </p>
              </div>
            </div>
            
            {/* Detail Per Satuan Kerja Preview */}
            <div className="flex-1 mt-2 flex flex-col min-h-0">
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Detail Per Satuan Kerja</h4>
              {/* Column Headers */}
              <div className="flex items-center justify-between text-xs font-semibold p-2 bg-muted/50 rounded-t border-b">
                <span className="flex-1">Satuan Kerja</span>
                <div className="flex gap-2 md:gap-4">
                  <span className="text-white bg-green-600 px-2 py-1 rounded text-center min-w-[65px] text-xs">Masuk (In)</span>
                  <span className="text-white bg-red-600 px-2 py-1 rounded text-center min-w-[65px] text-xs">Keluar (Out)</span>
                  <span className="text-muted-foreground bg-muted px-2 py-1 rounded text-center min-w-[45px] text-xs">Net</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[250px] space-y-0">
                {regionalStats.map((stat, index) => {
                  const employees = getEmployeesForUnit(stat.unit);
                  const hasEmployees = employees.length > 0;
                  const isExpanded = expandedUnits.has(stat.unit);
                  
                  return (
                    <div key={index} className="border-b last:border-b-0">
                      <div 
                        className={`flex items-center justify-between text-sm p-2 bg-muted/30 hover:bg-muted/50 transition-colors ${hasEmployees ? 'cursor-pointer' : ''}`}
                        onClick={() => hasEmployees && toggleUnitExpansion(stat.unit)}
                      >
                        <div className="flex items-center gap-2 truncate flex-1">
                          <div 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: UNIT_COLORS[stat.unit] }}
                          />
                          <span className="truncate text-xs">{stat.unit}</span>
                          {hasEmployees && (
                            isExpanded 
                              ? <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" />
                              : <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        <div className="flex gap-2 md:gap-4 text-xs">
                          <span className="text-green-600 dark:text-green-400 font-medium text-center min-w-[65px]">{stat.masuk}</span>
                          <span className="text-red-600 dark:text-red-400 font-medium text-center min-w-[65px]">{stat.keluar}</span>
                          <span className={`font-medium text-center min-w-[45px] ${stat.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {stat.net > 0 ? '+' : ''}{stat.net}
                          </span>
                        </div>
                      </div>
                      
                      {/* Dropdown detail pegawai */}
                      {isExpanded && hasEmployees && (
                        <div className="bg-muted/20 px-3 py-2 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Detail Pegawai ({employees.length} orang)
                          </p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {employees.map((emp, empIndex) => (
                              <div 
                                key={empIndex} 
                                className="flex items-center justify-between bg-background rounded px-2 py-1.5 border text-xs"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{emp.nama_lengkap}</p>
                                  <p className="text-muted-foreground text-[10px]">
                                    {emp.nip || '-'} • {emp.pangkat_golongan || '-'}
                                  </p>
                                </div>
                                <Badge 
                                  variant={emp.status === "in" ? "default" : "destructive"}
                                  className={`ml-2 text-[10px] px-1.5 py-0.5 ${emp.status === "in" 
                                    ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200" 
                                    : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200"
                                  }`}
                                >
                                  {emp.status === "in" ? (
                                    <><LogIn className="h-2.5 w-2.5 mr-0.5" /> IN</>
                                  ) : (
                                    <><LogOut className="h-2.5 w-2.5 mr-0.5" /> OUT</>
                                  )}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Monthly Trend */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tren Mutasi per Bulan
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="h-full min-h-[300px]">
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={10} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="jumlah" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Belum ada data mutasi
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Row 2: Distribusi Unit Tujuan (left) & Tabel Satker (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Distribution by Unit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Distribusi Unit Tujuan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pieChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={10} angle={-45} textAnchor="end" height={80} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="Jumlah" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Belum ada data mutasi
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Satker Percentage Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Tabel Satuan Kerja
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left py-3 px-3 font-semibold">Satuan Kerja</th>
                      <th className="text-center py-3 px-3 font-semibold">Jumlah</th>
                      <th className="text-center py-3 px-3 font-semibold">Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pieChartData.map((item, index) => (
                      <tr key={index} className="border-b last:border-b-0 hover:bg-muted/30">
                        <td className="py-2 px-3" title={item.fullName}>{item.name}</td>
                        <td className="text-center py-2 px-3">{item.value}</td>
                        <td className="text-center py-2 px-3">
                          {totalMutasi > 0 ? ((item.value / totalMutasi) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Belum ada data mutasi
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Jabatan Summary Table with Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rekapitulasi Jabatan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th rowSpan={2} className="border border-gray-300 px-4 py-2 bg-muted">Jabatan</th>
                    <th colSpan={2} className="border border-gray-300 px-4 py-2 bg-muted text-center">Keluar</th>
                    <th colSpan={2} className="border border-gray-300 px-4 py-2 bg-muted text-center">Masuk</th>
                  </tr>
                  <tr>
                    <th className="border border-gray-300 px-3 py-1 bg-muted/70">Mutasi</th>
                    <th className="border border-gray-300 px-3 py-1 bg-muted/70">Promosi</th>
                    <th className="border border-gray-300 px-3 py-1 bg-muted/70">Mutasi</th>
                    <th className="border border-gray-300 px-3 py-1 bg-muted/70">Promosi</th>
                  </tr>
                </thead>
                <tbody>
                  {JABATAN_CATEGORIES.map((jabatan) => {
                    const summary = jabatanSummary[jabatan];
                    return (
                      <tr key={jabatan} className="hover:bg-muted/50">
                        <td className="border border-gray-300 px-4 py-2">{jabatan}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{summary.keluarMutasi || ""}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{summary.keluarPromosi || ""}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{summary.masukMutasi || ""}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{summary.masukPromosi || ""}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-bold bg-muted/50">
                    <td className="border border-gray-300 px-4 py-2"></td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {Object.values(jabatanSummary).reduce((sum, s) => sum + s.keluarMutasi, 0)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {Object.values(jabatanSummary).reduce((sum, s) => sum + s.keluarPromosi, 0)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {Object.values(jabatanSummary).reduce((sum, s) => sum + s.masukMutasi, 0)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {Object.values(jabatanSummary).reduce((sum, s) => sum + s.masukPromosi, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Pie Chart for Satuan Kerja */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Populasi per Satuan Kerja</h4>
              <div className="h-[280px]">
                {satkerPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={satkerPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {satkerPieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Belum ada data
                  </div>
                )}
              </div>
              {/* Legend */}
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                {satkerPieData.slice(0, 6).map((item, index) => (
                  <div key={index} className="flex items-center gap-1 truncate">
                    <div 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="truncate" title={item.fullName}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Mutations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Data Mutasi Terbaru</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportFilteredExcel}
              className="gap-2"
              disabled={filteredData.length === 0}
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Nomor</th>
                  <th className="text-left py-2 px-2">No. KEP</th>
                  <th className="text-left py-2 px-2">Tanggal</th>
                  <th className="text-left py-2 px-2">Nama</th>
                  <th className="text-left py-2 px-2">NIP</th>
                  <th className="text-left py-2 px-2">Jabatan</th>
                  <th className="text-left py-2 px-2">Unit Lama</th>
                  <th className="text-left py-2 px-2">Unit Baru</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{index + 1}</td>
                    <td className="py-2 px-2">{item.nomor_kep}</td>
                    <td className="py-2 px-2">{new Date(item.tanggal_kep).toLocaleDateString('id-ID')}</td>
                    <td className="py-2 px-2">{item.nama_lengkap}</td>
                    <td className="py-2 px-2">{item.nip || "-"}</td>
                    <td className="py-2 px-2">{item.jabatan || "-"}</td>
                    <td className="py-2 px-2">{item.unit_lama}</td>
                    <td className="py-2 px-2">{item.unit_baru}</td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      Belum ada data mutasi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Dialog for Statistik Wilayah */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Statistik Wilayah Kanwil DJBC Jawa Timur I
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(false)}
              className="h-8 w-8"
              title="Keluar dari Layar Penuh"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <LogIn className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Total Masuk</span>
                </div>
                <p className="text-3xl font-bold text-green-600 mt-2">{totalMasuk}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <LogOut className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">Total Keluar</span>
                </div>
                <p className="text-3xl font-bold text-red-600 mt-2">{totalKeluar}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Net Movement</span>
                </div>
                <p className={`text-3xl font-bold mt-2 ${totalMasuk - totalKeluar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalMasuk - totalKeluar >= 0 ? '+' : ''}{totalMasuk - totalKeluar}
                </p>
              </div>
            </div>
            
            {/* Detail Per Satuan Kerja */}
            <div>
              <h4 className="font-semibold text-lg text-muted-foreground mb-3">Detail Per Satuan Kerja</h4>
              {/* Column Headers */}
              <div className="flex items-center justify-between text-sm font-semibold p-3 bg-muted/50 rounded-t border-b">
                <span className="flex-1">Satuan Kerja</span>
                <div className="flex gap-4 md:gap-8">
                  <span className="text-white bg-green-600 px-3 py-1 rounded text-center min-w-[80px]">Masuk (In)</span>
                  <span className="text-white bg-red-600 px-3 py-1 rounded text-center min-w-[80px]">Keluar (Out)</span>
                  <span className="text-muted-foreground bg-muted px-3 py-1 rounded text-center min-w-[60px]">Net</span>
                </div>
              </div>
              <div className="space-y-0 max-h-[calc(95vh-350px)] overflow-y-auto">
                {regionalStats.map((stat, index) => {
                  const employees = getEmployeesForUnit(stat.unit);
                  const hasEmployees = employees.length > 0;
                  const isExpanded = expandedUnits.has(stat.unit);
                  
                  return (
                    <div key={index} className="border-b last:border-b-0">
                      <div 
                        className={`flex items-center justify-between text-base p-3 bg-muted/30 hover:bg-muted/50 transition-colors ${hasEmployees ? 'cursor-pointer' : ''}`}
                        onClick={() => hasEmployees && toggleUnitExpansion(stat.unit)}
                      >
                        <div className="flex items-center gap-3 truncate flex-1">
                          <div 
                            className="w-3 h-3 rounded-full shrink-0" 
                            style={{ backgroundColor: UNIT_COLORS[stat.unit] }}
                          />
                          <span className="truncate">{stat.unit}</span>
                          {hasEmployees && (
                            isExpanded 
                              ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        <div className="flex gap-4 md:gap-8">
                          <span className="text-green-600 dark:text-green-400 font-semibold text-center min-w-[80px]">{stat.masuk}</span>
                          <span className="text-red-600 dark:text-red-400 font-semibold text-center min-w-[80px]">{stat.keluar}</span>
                          <span className={`font-semibold text-center min-w-[60px] ${stat.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {stat.net > 0 ? '+' : ''}{stat.net}
                          </span>
                        </div>
                      </div>
                      
                      {/* Dropdown detail pegawai - expanded in fullscreen */}
                      {isExpanded && hasEmployees && (
                        <div className="bg-muted/20 px-4 py-3 border-t">
                          <p className="text-sm font-medium text-muted-foreground mb-3">
                            Detail Pegawai ({employees.length} orang)
                          </p>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {employees.map((emp, empIndex) => (
                              <div 
                                key={empIndex} 
                                className="flex items-center justify-between bg-background rounded px-3 py-2 border"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{emp.nama_lengkap}</p>
                                  <p className="text-muted-foreground text-sm">
                                    {emp.nip || '-'} • {emp.pangkat_golongan || '-'}
                                  </p>
                                </div>
                                <Badge 
                                  variant={emp.status === "in" ? "default" : "destructive"}
                                  className={`ml-2 ${emp.status === "in" 
                                    ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200" 
                                    : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200"
                                  }`}
                                >
                                  {emp.status === "in" ? (
                                    <><LogIn className="h-3 w-3 mr-1" /> IN</>
                                  ) : (
                                    <><LogOut className="h-3 w-3 mr-1" /> OUT</>
                                  )}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
