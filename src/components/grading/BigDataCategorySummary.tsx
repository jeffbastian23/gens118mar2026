import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Users, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Category mapping to filter grading_big_data
const CATEGORY_FILTER_MAP: Record<string, { jenis: string[]; rekomendasi: string[] | null }> = {
  PU_NAIK_TURUN_TETAP: { jenis: ["PU"], rekomendasi: ["Naik", "Turun", "Tetap"] },
  PU_BELUM_REKOMENDASI: { jenis: ["PU"], rekomendasi: null }, // null or empty rekomendasi
  PK_NAIK_TETAP: { jenis: ["PK"], rekomendasi: ["Naik", "Tetap"] },
  PK_BELUM_REKOMENDASI: { jenis: ["PK"], rekomendasi: null },
  PTB_NAIK_TURUN_TETAP: { jenis: ["PTB", "Pelaksana Tertentu"], rekomendasi: ["Naik", "Turun", "Tetap"] },
  PTB_BELUM_REKOMENDASI: { jenis: ["PTB", "Pelaksana Tertentu"], rekomendasi: null },
};

// Field labels for detail display
const FIELD_LABELS: Record<string, string> = {
  lokasi: "Bagian/Satuan Kerja",
  eselon_iii: "Eselon III",
  eselon_iv: "Subbagian/Seksi",
  pangkat: "Pangkat",
  pangkat_golongan: "Golongan",
  tmt_pangkat: "TMT Golongan",
  pendidikan: "Pendidikan",
  jabatan: "Jabatan Lama",
  grade: "Peringkat Lama",
  tmt_terakhir: "TMT Peringkat Terakhir",
  pkt_2024: "Predikat Kinerja I",
  pkt_2025: "Predikat Kinerja II",
  kemampuan_kerja: "Kemampuan Kerja",
  rekomendasi: "Rekomendasi",
  jabatan_baru: "Jabatan Baru",
  grade_baru: "Peringkat Baru",
  akumulasi_masa_kerja: "Akumulasi Masa Kerja",
  akumulasi_terakhir: "Akumulasi Masa Kerja Akhir",
};

// Fields to show based on category
const CATEGORY_DETAIL_FIELDS: Record<string, string[]> = {
  PU_NAIK_TURUN_TETAP: [
    "lokasi", "eselon_iv", "pangkat", "pangkat_golongan", "tmt_pangkat",
    "pendidikan", "jabatan", "grade", "tmt_terakhir",
    "pkt_2024", "pkt_2025", "kemampuan_kerja", 
    "rekomendasi", "jabatan_baru", "grade_baru"
  ],
  PU_BELUM_REKOMENDASI: [
    "lokasi", "eselon_iv", "pangkat", "pangkat_golongan", "tmt_pangkat",
    "pendidikan", "jabatan", "grade", "tmt_terakhir", "pkt_2024"
  ],
  PK_NAIK_TETAP: [
    "lokasi", "eselon_iv", "pangkat", "pangkat_golongan", "tmt_pangkat",
    "pendidikan", "jabatan", "grade", "akumulasi_masa_kerja",
    "tmt_terakhir", "pkt_2024", "akumulasi_terakhir",
    "rekomendasi", "jabatan_baru", "grade_baru"
  ],
  PK_BELUM_REKOMENDASI: [
    "lokasi", "eselon_iv", "pangkat", "pangkat_golongan", "tmt_pangkat",
    "pendidikan", "jabatan", "grade", "akumulasi_masa_kerja",
    "tmt_terakhir", "pkt_2024", "akumulasi_terakhir"
  ],
  PTB_NAIK_TURUN_TETAP: [
    "lokasi", "eselon_iv", "pangkat", "pangkat_golongan", "tmt_pangkat",
    "pendidikan", "jabatan", "grade", "tmt_terakhir",
    "pkt_2024", "pkt_2025", "rekomendasi", 
    "jabatan_baru", "grade_baru"
  ],
  PTB_BELUM_REKOMENDASI: [
    "lokasi", "eselon_iv", "pangkat", "pangkat_golongan", "tmt_pangkat",
    "pendidikan", "jabatan", "grade", "tmt_terakhir", "pkt_2024"
  ],
};

interface BigDataEmployee {
  id: string;
  nama_lengkap: string;
  nip: string;
  lokasi: string | null;
  eselon_iii: string | null;
  eselon_iv: string | null;
  pangkat: string | null;
  pangkat_golongan: string | null;
  tmt_pangkat: string | null;
  pendidikan: string | null;
  jabatan: string | null;
  grade: string | null;
  tmt_terakhir: string | null;
  pkt_2024: string | null;
  pkt_2025: string | null;
  kemampuan_kerja: string | null;
  rekomendasi: string | null;
  jabatan_baru: string | null;
  grade_baru: string | null;
  akumulasi_masa_kerja: string | null;
  akumulasi_terakhir: string | null;
  jenis: string | null;
}

interface BigDataCategorySummaryProps {
  kategori: string;
  onAddPeserta: (employees: { nama: string; nip: string }[]) => void;
  onSelectedEmployeesChange?: (employees: BigDataEmployee[]) => void;
}

export default function BigDataCategorySummary({ kategori, onAddPeserta, onSelectedEmployeesChange }: BigDataCategorySummaryProps) {
  const [employees, setEmployees] = useState<BigDataEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (kategori) {
      loadBigDataByCategory();
    } else {
      setEmployees([]);
    }
    setSelectedIds(new Set());
    setExpandedIds(new Set());
    setSearchTerm("");
  }, [kategori]);

  const loadBigDataByCategory = async () => {
    if (!kategori || !CATEGORY_FILTER_MAP[kategori]) {
      setEmployees([]);
      return;
    }

    setLoading(true);
    try {
      const filter = CATEGORY_FILTER_MAP[kategori];
      let query = supabase
        .from("grading_big_data")
        .select("id, nama_lengkap, nip, lokasi, eselon_iii, eselon_iv, pangkat, pangkat_golongan, tmt_pangkat, pendidikan, jabatan, grade, tmt_terakhir, pkt_2024, pkt_2025, kemampuan_kerja, rekomendasi, jabatan_baru, grade_baru, akumulasi_masa_kerja, akumulasi_terakhir, jenis")
        .in("jenis", filter.jenis);

      if (filter.rekomendasi) {
        query = query.in("rekomendasi", filter.rekomendasi);
      } else {
        // For "Belum Rekomendasi" - get those without rekomendasi or null
        query = query.or("rekomendasi.is.null,rekomendasi.eq.");
      }

      const { data, error } = await query.order("nama_lengkap");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error("Error loading big data:", error);
      toast.error("Gagal memuat data pegawai");
    } finally {
      setLoading(false);
    }
  };

  // Filter employees by search term
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const term = searchTerm.toLowerCase();
    return employees.filter(emp => 
      emp.nama_lengkap.toLowerCase().includes(term) ||
      emp.nip?.toLowerCase().includes(term) ||
      emp.lokasi?.toLowerCase().includes(term) ||
      emp.eselon_iv?.toLowerCase().includes(term) ||
      emp.pangkat?.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

  // Get selected employees data for preview
  const selectedEmployees = useMemo(() => {
    return employees.filter(emp => selectedIds.has(emp.id));
  }, [employees, selectedIds]);

  // Notify parent of selected employees change
  useEffect(() => {
    if (onSelectedEmployeesChange) {
      onSelectedEmployeesChange(selectedEmployees);
    }
  }, [selectedEmployees, onSelectedEmployeesChange]);

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredEmployees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmployees.map(e => e.id)));
    }
  };

  const handleAddSelected = () => {
    const selectedEmps = employees
      .filter(e => selectedIds.has(e.id))
      .map(e => ({ nama: e.nama_lengkap, nip: e.nip }));
    
    if (selectedEmps.length === 0) {
      toast.error("Pilih minimal 1 pegawai");
      return;
    }

    onAddPeserta(selectedEmps);
    setSelectedIds(new Set());
    toast.success(`${selectedEmps.length} pegawai ditambahkan ke lampiran`);
  };

  const handleRemoveFromPreview = (id: string) => {
    const newSelected = new Set(selectedIds);
    newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    } catch {
      return dateString;
    }
  };

  const getFieldValue = (employee: BigDataEmployee, field: string): string => {
    const value = employee[field as keyof BigDataEmployee];
    if (value === null || value === undefined || value === "") return "-";
    if (field.includes("tmt") || field === "tmt_terakhir" || field === "tmt_pangkat") {
      return formatDate(value as string);
    }
    return String(value);
  };

  if (!kategori) {
    return null;
  }

  const detailFields = CATEGORY_DETAIL_FIELDS[kategori] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Daftar Pegawai - {kategori.replace(/_/g, " ")}
          <Badge variant="outline" className="ml-2">
            {filteredEmployees.length} / {employees.length} pegawai
          </Badge>
        </Label>
        <div className="flex gap-2">
          {employees.length > 0 && (
            <>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedIds.size === filteredEmployees.length && filteredEmployees.length > 0 ? "Batal Pilih Semua" : "Pilih Semua"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search Field */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama, NIP, bagian, seksi, pangkat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Klik baris pegawai untuk melihat detail data dari Big Data. Data akan otomatis terisi pada lampiran yang di-generate.
      </p>

      {loading ? (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center">Memuat data...</p>
        </Card>
      ) : filteredEmployees.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            {searchTerm ? "Tidak ada pegawai yang sesuai dengan pencarian" : "Tidak ada data pegawai untuk kategori ini"}
          </p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <ScrollArea className="h-[300px]">
            <div className="divide-y pr-3">
              {filteredEmployees.map((emp, idx) => (
                <Collapsible
                  key={emp.id}
                  open={expandedIds.has(emp.id)}
                  onOpenChange={() => handleToggleExpand(emp.id)}
                >
                  <div 
                    className={cn(
                      "transition-colors",
                      selectedIds.has(emp.id) && "bg-primary/5"
                    )}
                  >
                    <CollapsibleTrigger asChild>
                      <div 
                        className={cn(
                          "flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer",
                          expandedIds.has(emp.id) && "bg-muted/30 border-l-2 border-l-primary"
                        )}
                      >
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(emp.id)}
                            onCheckedChange={() => handleToggleSelect(emp.id)}
                          />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground w-8">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{emp.nama_lengkap}</div>
                          <div className="text-sm text-muted-foreground">{emp.nip}</div>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {emp.rekomendasi || "Belum Rekomendasi"}
                        </Badge>
                        {expandedIds.has(emp.id) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 bg-muted/20 border-l-2 border-l-primary">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {detailFields.map((field) => (
                            <div key={field} className="space-y-1">
                              <Label className="text-xs text-muted-foreground">
                                {FIELD_LABELS[field] || field}
                              </Label>
                              <div className="text-sm font-medium bg-background rounded px-2 py-1 border">
                                {getFieldValue(emp, field)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddPeserta([{ nama: emp.nama_lengkap, nip: emp.nip }]);
                              toast.success("Pegawai ditambahkan ke lampiran");
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Tambahkan Pegawai Ini
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Preview of Selected Employees - This is Klaster II preview for lampiran */}
      {selectedEmployees.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 pb-2 border-b-2 border-amber-500/30">
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 font-semibold px-3 py-1">
              PREVIEW LAMPIRAN
            </Badge>
            <span className="text-sm font-medium text-muted-foreground">
              Pegawai Terpilih untuk Lampiran ({selectedEmployees.length})
            </span>
          </div>
          
          <Card className="p-0 overflow-hidden">
            <ScrollArea className="h-[250px]">
              <div className="divide-y pr-3">
                {selectedEmployees.map((emp, idx) => (
                  <div key={emp.id} className="p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-bold text-primary min-w-6">({idx + 1})</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{emp.nama_lengkap}</div>
                        <div className="text-sm text-muted-foreground">{emp.nip}</div>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                          {detailFields.slice(0, 8).map((field) => (
                            <div key={field} className="truncate">
                              <span className="text-muted-foreground">{FIELD_LABELS[field]}: </span>
                              <span className="font-medium">{getFieldValue(emp, field)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFromPreview(emp.id)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      )}
    </div>
  );
}