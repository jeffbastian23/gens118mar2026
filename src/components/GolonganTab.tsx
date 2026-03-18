import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string;
  uraian_pangkat: string;
  uraian_jabatan: string;
  nm_unit_organisasi: string;
}

// Golongan mapping - complete list
const GOLONGAN_MAP: Record<string, string> = {
  // Golongan I
  "I/a": "Juru Muda",
  "I/b": "Juru Muda Tingkat I",
  "I/c": "Juru",
  "I/d": "Juru Tingkat I",
  // Golongan II
  "II/a": "Pengatur Muda",
  "II/b": "Pengatur Muda Tingkat I",
  "II/c": "Pengatur",
  "II/d": "Pengatur Tingkat I",
  // Golongan III
  "III/a": "Penata Muda",
  "III/b": "Penata Muda Tingkat I",
  "III/c": "Penata",
  "III/d": "Penata Tingkat I",
  // Golongan IV
  "IV/a": "Pembina",
  "IV/b": "Pembina Tingkat I",
  "IV/c": "Pembina Utama Muda",
  "IV/d": "Pembina Utama Madya",
  "IV/e": "Pembina Utama",
};

// Function to extract golongan from uraian_pangkat
function extractGolongan(uraianPangkat: string): { golongan: string; pangkat: string; uraianLengkap: string } | null {
  if (!uraianPangkat) return null;
  
  // Try to find golongan pattern (e.g., III/a, II/b, IV/d)
  const golonganPattern = /([IViv]{1,3})\/([a-eA-E])/i;
  const match = uraianPangkat.match(golonganPattern);
  
  if (match) {
    const golongan = `${match[1].toUpperCase()}/${match[2].toLowerCase()}`;
    const pangkat = GOLONGAN_MAP[golongan] || uraianPangkat;
    const uraianLengkap = `${pangkat} / ${golongan}`;
    return { golongan, pangkat, uraianLengkap };
  }
  
  // Try to extract from full text like "Penata Muda Tk.I (III/b)"
  const fullPattern = /\(([IViv]{1,3})\/([a-eA-E])\)/i;
  const fullMatch = uraianPangkat.match(fullPattern);
  
  if (fullMatch) {
    const golongan = `${fullMatch[1].toUpperCase()}/${fullMatch[2].toLowerCase()}`;
    const pangkat = GOLONGAN_MAP[golongan] || uraianPangkat.replace(fullPattern, '').trim();
    const uraianLengkap = `${pangkat} / ${golongan}`;
    return { golongan, pangkat, uraianLengkap };
  }
  
  return null;
}

// Get badge color based on golongan group
function getGolonganColor(golongan: string): string {
  if (golongan.startsWith("I/")) return "bg-rose-100 text-rose-800 border-rose-200";
  if (golongan.startsWith("II/")) return "bg-blue-100 text-blue-800 border-blue-200";
  if (golongan.startsWith("III/")) return "bg-green-100 text-green-800 border-green-200";
  if (golongan.startsWith("IV/")) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

interface GolonganTabProps {
  isAdmin: boolean;
  canEdit: boolean;
}

export default function GolonganTab({ isAdmin, canEdit }: GolonganTabProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      let allEmployees: any[] = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .order("nm_pegawai", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allEmployees = [...allEmployees, ...data];
        
        if (data.length < pageSize) break;
        page++;
      }
      
      const employeesWithNip: Employee[] = allEmployees.map(emp => ({
        id: emp.id,
        nm_pegawai: emp.nm_pegawai,
        nip: emp.nip || '',
        uraian_pangkat: emp.uraian_pangkat,
        uraian_jabatan: emp.uraian_jabatan,
        nm_unit_organisasi: emp.nm_unit_organisasi,
      }));
      setEmployees(employeesWithNip);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  // Process employees with golongan info
  const employeesWithGolongan = useMemo(() => {
    return employees.map(emp => {
      const golonganInfo = extractGolongan(emp.uraian_pangkat);
      return {
        ...emp,
        golongan: golonganInfo?.golongan || "-",
        uraianPangkatLengkap: golonganInfo?.uraianLengkap || emp.uraian_pangkat,
      };
    });
  }, [employees]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return employeesWithGolongan.filter(emp =>
      emp.nm_pegawai.toLowerCase().includes(term) ||
      emp.nip.toLowerCase().includes(term) ||
      emp.golongan.toLowerCase().includes(term) ||
      emp.uraianPangkatLengkap.toLowerCase().includes(term) ||
      emp.nm_unit_organisasi.toLowerCase().includes(term)
    );
  }, [employeesWithGolongan, searchTerm]);

  // Group summary by golongan
  const golonganSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    employeesWithGolongan.forEach(emp => {
      if (emp.golongan && emp.golongan !== "-") {
        summary[emp.golongan] = (summary[emp.golongan] || 0) + 1;
      }
    });
    return summary;
  }, [employeesWithGolongan]);

  // Group by roman numeral for display
  const groupedSummary = useMemo(() => {
    const groups: Record<string, { total: number; items: Record<string, number> }> = {
      "Golongan I": { total: 0, items: {} },
      "Golongan II": { total: 0, items: {} },
      "Golongan III": { total: 0, items: {} },
      "Golongan IV": { total: 0, items: {} },
    };

    Object.entries(golonganSummary).forEach(([gol, count]) => {
      if (gol.startsWith("I/")) {
        groups["Golongan I"].items[gol] = count;
        groups["Golongan I"].total += count;
      } else if (gol.startsWith("II/")) {
        groups["Golongan II"].items[gol] = count;
        groups["Golongan II"].total += count;
      } else if (gol.startsWith("III/")) {
        groups["Golongan III"].items[gol] = count;
        groups["Golongan III"].total += count;
      } else if (gol.startsWith("IV/")) {
        groups["Golongan IV"].items[gol] = count;
        groups["Golongan IV"].total += count;
      }
    });

    return groups;
  }, [golonganSummary]);

  const getGroupColor = (group: string): string => {
    if (group === "Golongan I") return "bg-rose-500";
    if (group === "Golongan II") return "bg-blue-500";
    if (group === "Golongan III") return "bg-green-500";
    if (group === "Golongan IV") return "bg-amber-500";
    return "bg-gray-500";
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(groupedSummary).map(([group, data]) => (
          <Card key={group} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${getGroupColor(group)}`}></div>
                {group}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{data.total}</div>
              <div className="space-y-1">
                {Object.entries(data.items)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([gol, count]) => (
                    <div key={gol} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{gol} → {GOLONGAN_MAP[gol]}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Pangkat / Golongan Ruang
              <span className="text-sm font-normal text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                Total: {employees.length} pegawai
              </span>
            </span>
          </CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NIP, golongan, pangkat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Menampilkan {filteredEmployees.length} dari {employees.length} data pegawai
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
                  <TableHead>Golongan</TableHead>
                  <TableHead>Uraian Pangkat</TableHead>
                  <TableHead>Unit Organisasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada data yang ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item.nm_pegawai}</TableCell>
                      <TableCell className="font-mono text-sm">{item.nip}</TableCell>
                      <TableCell>
                        {item.golongan !== "-" ? (
                          <Badge variant="outline" className={getGolonganColor(item.golongan)}>
                            {item.golongan}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{item.uraianPangkatLengkap}</TableCell>
                      <TableCell>{item.nm_unit_organisasi}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
