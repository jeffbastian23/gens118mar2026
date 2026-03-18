import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, Trash2, Download, Upload, Save, CalendarIcon, ChevronsUpDown, Copy, FileText, ChevronDown } from "lucide-react";
import { format, parse } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import {
  generateNDRencanaPenugasan,
  generateNDKakanwilDirAudit,
  generateNDPengajuanSTPeklap,
  generateLampiranRencanaPenugasan,
  generateLampiranKakanwilDirAudit,
  generateLampiranPengajuanSTPeklap,
  generateSTInduk,
  generateSTPekerjaanLapangan,
} from "@/utils/auditDocumentGenerator";
import AuditSTSelectionDialog from "@/components/AuditSTSelectionDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AuditRow {
  id: string;
  no: number;
  npwp: string;
  nama_perusahaan: string;
  bentuk_kantor: string;
  alamat: string;
  fasilitas: string;
  npa: string;
  tanggal_awal_periode: string;
  tanggal_akhir_periode: string;
  tanggal_awal_peklap: string;
  tanggal_akhir_peklap: string;
  nama_pma: string;
  pangkat_gol_pma: string;
  jabatan_pma: string;
  nama_pta: string;
  pangkat_gol_pta: string;
  jabatan_pta: string;
  nama_katim: string;
  pangkat_gol_katim: string;
  jabatan_katim: string;
  nama_a1: string;
  pangkat_gol_a1: string;
  jabatan_a1: string;
  nama_a2: string;
  pangkat_gol_a2: string;
  jabatan_a2: string;
  nama_a3: string;
  pangkat_gol_a3: string;
  jabatan_a3: string;
  no_st_induk: string;
  tanggal_st_induk: string;
  tahap_pelaksanaan_st_ke: string;
  dipa: string;
  periode_ke: string;
  isNew?: boolean;
  isDirty?: boolean;
}

interface Employee {
  id: string;
  nm_pegawai: string;
  uraian_pangkat: string;
  uraian_jabatan: string;
}

const COLUMNS = [
  { key: "no", label: "No", width: "w-16" },
  { key: "npwp", label: "NPWP", width: "w-40" },
  { key: "nama_perusahaan", label: "Nama Perusahaan", width: "w-48" },
  { key: "bentuk_kantor", label: "Bentuk Kantor", width: "w-44" },
  { key: "alamat", label: "Alamat", width: "w-48" },
  { key: "fasilitas", label: "Fasilitas", width: "w-44" },
  { key: "npa", label: "NPA", width: "w-28" },
  { key: "tanggal_awal_periode", label: "Tgl Awal Periode", width: "w-40" },
  { key: "tanggal_akhir_periode", label: "Tgl Akhir Periode", width: "w-40" },
  { key: "tanggal_awal_peklap", label: "Tgl Awal Peklap", width: "w-40" },
  { key: "tanggal_akhir_peklap", label: "Tgl Akhir Peklap", width: "w-40" },
  { key: "nama_pma", label: "Nama PMA", width: "w-48" },
  { key: "pangkat_gol_pma", label: "Pangkat/Gol PMA", width: "w-36" },
  { key: "jabatan_pma", label: "Jabatan PMA", width: "w-36" },
  { key: "nama_pta", label: "Nama PTA", width: "w-48" },
  { key: "pangkat_gol_pta", label: "Pangkat/Gol PTA", width: "w-36" },
  { key: "jabatan_pta", label: "Jabatan PTA", width: "w-36" },
  { key: "nama_katim", label: "Nama Katim", width: "w-48" },
  { key: "pangkat_gol_katim", label: "Pangkat/Gol Katim", width: "w-36" },
  { key: "jabatan_katim", label: "Jabatan Katim", width: "w-36" },
  { key: "nama_a1", label: "Nama A1", width: "w-48" },
  { key: "pangkat_gol_a1", label: "Pangkat/Gol A1", width: "w-36" },
  { key: "jabatan_a1", label: "Jabatan A1", width: "w-36" },
  { key: "nama_a2", label: "Nama A2", width: "w-48" },
  { key: "pangkat_gol_a2", label: "Pangkat/Gol A2", width: "w-36" },
  { key: "jabatan_a2", label: "Jabatan A2", width: "w-36" },
  { key: "nama_a3", label: "Nama A3", width: "w-48" },
  { key: "pangkat_gol_a3", label: "Pangkat/Gol A3", width: "w-36" },
  { key: "jabatan_a3", label: "Jabatan A3", width: "w-36" },
  { key: "no_st_induk", label: "No. ST Induk", width: "w-40" },
  { key: "tanggal_st_induk", label: "Tgl ST Induk", width: "w-40" },
  { key: "tahap_pelaksanaan_st_ke", label: "Tahap ST Ke", width: "w-28" },
  { key: "dipa", label: "DIPA", width: "w-28" },
  { key: "periode_ke", label: "Periode Ke", width: "w-28" },
];

const emptyRow = (): Omit<AuditRow, "id" | "no"> => ({
  npwp: "", nama_perusahaan: "", bentuk_kantor: "", alamat: "", fasilitas: "",
  npa: "", tanggal_awal_periode: "", tanggal_akhir_periode: "",
  tanggal_awal_peklap: "", tanggal_akhir_peklap: "",
  nama_pma: "", pangkat_gol_pma: "", jabatan_pma: "",
  nama_pta: "", pangkat_gol_pta: "", jabatan_pta: "",
  nama_katim: "", pangkat_gol_katim: "", jabatan_katim: "",
  nama_a1: "", pangkat_gol_a1: "", jabatan_a1: "",
  nama_a2: "", pangkat_gol_a2: "", jabatan_a2: "",
  nama_a3: "", pangkat_gol_a3: "", jabatan_a3: "",
  no_st_induk: "", tanggal_st_induk: "", tahap_pelaksanaan_st_ke: "",
  dipa: "", periode_ke: "",
});

const DATE_FIELDS = [
  "tanggal_awal_periode", "tanggal_akhir_periode",
  "tanggal_awal_peklap", "tanggal_akhir_peklap",
  "tanggal_st_induk",
];

const BENTUK_KANTOR_OPTIONS = ["Alamat Kantor", "Pabrik"];
const FASILITAS_OPTIONS = ["KB", "MITA", "PLB", "KITE B", "KITE K", "NON FAS"];

// Fix #3: Jabatan options per role (not auto)
const JABATAN_OPTIONS_ALL = ["Pengawas Mutu Audit", "Pengendali Teknis Audit", "Ketua Auditor", "Auditor"];
const JABATAN_OPTIONS_MAP: Record<string, string[]> = {
  jabatan_pma: JABATAN_OPTIONS_ALL,
  jabatan_pta: JABATAN_OPTIONS_ALL,
  jabatan_katim: JABATAN_OPTIONS_ALL,
  jabatan_a1: JABATAN_OPTIONS_ALL,
  jabatan_a2: JABATAN_OPTIONS_ALL,
  jabatan_a3: JABATAN_OPTIONS_ALL,
};

const JABATAN_FIELDS = Object.keys(JABATAN_OPTIONS_MAP);

const NAME_TO_PANGKAT_MAP: Record<string, { pangkat: string; jabatan: string }> = {
  nama_pma: { pangkat: "pangkat_gol_pma", jabatan: "jabatan_pma" },
  nama_pta: { pangkat: "pangkat_gol_pta", jabatan: "jabatan_pta" },
  nama_katim: { pangkat: "pangkat_gol_katim", jabatan: "jabatan_katim" },
  nama_a1: { pangkat: "pangkat_gol_a1", jabatan: "jabatan_a1" },
  nama_a2: { pangkat: "pangkat_gol_a2", jabatan: "jabatan_a2" },
  nama_a3: { pangkat: "pangkat_gol_a3", jabatan: "jabatan_a3" },
};

const NAME_FIELDS = Object.keys(NAME_TO_PANGKAT_MAP);

function parseDateStr(str: string): Date | undefined {
  if (!str) return undefined;
  try {
    const d = parse(str, "d MMMM yyyy", new Date(), { locale: idLocale });
    if (!isNaN(d.getTime())) return d;
    const d2 = new Date(str);
    if (!isNaN(d2.getTime())) return d2;
  } catch {}
  return undefined;
}

function formatDateId(date: Date): string {
  return format(date, "d MMMM yyyy", { locale: idLocale });
}

// --- Sub-components ---

function CheckboxMultiSelect({
  value,
  options,
  onChange,
  formatResult,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  formatResult?: (selected: string[]) => string;
}) {
  const selected = value ? value.split("/").map(s => s.trim()).filter(Boolean) : [];

  const toggle = (opt: string) => {
    let next: string[];
    if (selected.includes(opt)) {
      next = selected.filter(s => s !== opt);
    } else {
      next = [...selected, opt];
    }
    const result = formatResult ? formatResult(next) : next.join("/");
    onChange(result);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="w-full text-left px-2 py-1 h-8 text-xs truncate bg-transparent hover:bg-muted/50 transition-colors">
          {value || <span className="text-muted-foreground">Pilih...</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="start">
        <div className="space-y-2">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox
                checked={selected.includes(opt)}
                onCheckedChange={() => toggle(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BentukKantorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hasKantor = value.includes("Alamat Kantor");
  const hasPabrik = value.includes("Pabrik");
  const selected: string[] = [];
  if (hasKantor) selected.push("Alamat Kantor");
  if (hasPabrik) selected.push("Pabrik");

  const formatBentukKantor = (sel: string[]) => {
    if (sel.length === 2) return "Alamat Kantor dan Pabrik";
    return sel.join("");
  };

  return (
    <CheckboxMultiSelect
      value={value}
      options={BENTUK_KANTOR_OPTIONS}
      onChange={onChange}
      formatResult={formatBentukKantor}
    />
  );
}

function DateCellPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const dateVal = parseDateStr(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="w-full text-left px-2 py-1 h-8 text-xs truncate bg-transparent hover:bg-muted/50 flex items-center gap-1">
          {value || <span className="text-muted-foreground">Pilih tanggal...</span>}
          <CalendarIcon className="h-3 w-3 ml-auto text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateVal}
          onSelect={(d) => { if (d) onChange(formatDateId(d)); }}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

// Fix #3: Jabatan select with predefined options
function JabatanSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="w-full text-left px-2 py-1 h-8 text-xs truncate bg-transparent hover:bg-muted/50 flex items-center gap-1">
          {value || <span className="text-muted-foreground">Pilih jabatan...</span>}
          <ChevronsUpDown className="h-3 w-3 ml-auto text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        {options.map(opt => (
          <button
            key={opt}
            className={cn(
              "w-full text-left px-3 py-1.5 text-xs rounded hover:bg-muted transition-colors",
              value === opt && "bg-primary/10 font-medium"
            )}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// Fix #2: Employee combobox with virtualized/paginated list supporting 1000+ employees
function EmployeeCombobox({
  value,
  employees,
  onChange,
}: {
  value: string;
  employees: Employee[];
  onChange: (name: string, pangkat: string, jabatan: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter locally but show up to 100 at a time for performance
  const filtered = search.trim()
    ? employees.filter(e =>
        e.nm_pegawai.toLowerCase().includes(search.toLowerCase()) ||
        e.uraian_jabatan.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 100)
    : employees.slice(0, 100);

  const totalFiltered = search.trim()
    ? employees.filter(e =>
        e.nm_pegawai.toLowerCase().includes(search.toLowerCase()) ||
        e.uraian_jabatan.toLowerCase().includes(search.toLowerCase())
      ).length
    : employees.length;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }}>
      <PopoverTrigger asChild>
        <button className="w-full text-left px-2 py-1 h-8 text-xs truncate bg-transparent hover:bg-muted/50 flex items-center gap-1">
          {value || <span className="text-muted-foreground">Pilih pegawai...</span>}
          <ChevronsUpDown className="h-3 w-3 ml-auto text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="flex items-center border-b px-2">
          <input
            className="flex-1 py-2 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
            placeholder="Cari nama pegawai..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-auto">
          {filtered.length === 0 ? (
            <div className="text-xs p-3 text-muted-foreground text-center">Tidak ditemukan</div>
          ) : (
            <>
              {totalFiltered > 100 && (
                <div className="text-[10px] px-3 py-1 bg-muted/50 text-muted-foreground">
                  Menampilkan 100 dari {totalFiltered} pegawai. Ketik untuk mempersempit pencarian.
                </div>
              )}
              {filtered.map(emp => (
                <button
                  key={emp.id}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                  onClick={() => {
                    onChange(emp.nm_pegawai, emp.uraian_pangkat, emp.uraian_jabatan);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <div className="font-medium truncate">{emp.nm_pegawai}</div>
                  <div className="text-muted-foreground text-[10px] truncate">{emp.uraian_pangkat} - {emp.uraian_jabatan}</div>
                </button>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- Main Component ---

interface AuditPenugasanTableProps {
  isAdmin: boolean;
  canEdit?: boolean;
}

export default function AuditPenugasanTable({ isAdmin, canEdit: canEditProp }: AuditPenugasanTableProps) {
  const canEdit = canEditProp ?? isAdmin;
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [nomorND, setNomorND] = useState("");
  const [tanggalND, setTanggalND] = useState("");
  const [stIndukDialogOpen, setStIndukDialogOpen] = useState(false);
  const [stPeklapDialogOpen, setStPeklapDialogOpen] = useState(false);
  // Use a ref to prevent double-fetching on mount
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchData();
      fetchEmployees();
    }
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_penugasan")
        .select("*")
        .order("no", { ascending: true });
      if (error) throw error;
      setRows((data || []).map((r: any) => ({ ...r, isNew: false, isDirty: false })));
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat data audit");
    } finally {
      setLoading(false);
    }
  };

  // Fix #2: Fetch ALL employees with pagination to support 1000+ records
  const fetchEmployees = async () => {
    try {
      let allEmployees: Employee[] = [];
      let page = 0;
      const pageSize = 1000;

      while (true) {
        const { data, error } = await supabase
          .from("employees")
          .select("id, nm_pegawai, uraian_pangkat, uraian_jabatan")
          .order("nm_pegawai", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        allEmployees = [...allEmployees, ...data];
        if (data.length < pageSize) break;
        page++;
      }

      setEmployees(allEmployees);
    } catch {}
  };

  const handleCellChange = (rowIndex: number, key: string, value: string) => {
    setRows(prev => prev.map((r, i) => i === rowIndex ? { ...r, [key]: value, isDirty: true } : r));
  };

  const handleEmployeeSelect = (rowIndex: number, nameField: string, name: string, pangkat: string, jabatan: string) => {
    const mapping = NAME_TO_PANGKAT_MAP[nameField];
    if (!mapping) return;
    // Get the preset jabatan option for this role
    const jabatanOptions = JABATAN_OPTIONS_MAP[mapping.jabatan];
    const presetJabatan = jabatanOptions ? jabatanOptions[0] : jabatan;
    setRows(prev => prev.map((r, i) =>
      i === rowIndex
        ? { ...r, [nameField]: name, [mapping.pangkat]: pangkat, [mapping.jabatan]: presetJabatan, isDirty: true }
        : r
    ));
  };

  const addRow = () => {
    const nextNo = rows.length > 0 ? Math.max(...rows.map(r => r.no)) + 1 : 1;
    setRows(prev => [...prev, { id: crypto.randomUUID(), no: nextNo, ...emptyRow(), isNew: true, isDirty: true }]);
  };

  // Duplicate row with new no and auto-save to Supabase
  const duplicateRow = async (index: number) => {
    const row = rows[index];
    const nextNo = rows.length > 0 ? Math.max(...rows.map(r => r.no)) + 1 : 1;
    const newRow: AuditRow = {
      ...row,
      id: crypto.randomUUID(),
      no: nextNo,
      isNew: true,
      isDirty: true,
    };
    const updatedRows = [...rows, newRow];
    setRows(updatedRows);
    // Auto-save the duplicated row to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload: any = {};
      COLUMNS.forEach(c => { if (c.key !== "no") payload[c.key] = (newRow as any)[c.key] || null; });
      payload.id = newRow.id;
      payload.no = newRow.no;
      payload.created_by_email = user?.email || null;
      const { error } = await supabase.from("audit_penugasan").insert(payload);
      if (error) throw error;
      setRows(prev => prev.map(r => r.id === newRow.id ? { ...r, isNew: false, isDirty: false } : r));
      toast.success(`Baris ${row.no} diduplikasi menjadi baris ${nextNo}`);
    } catch (err: any) {
      toast.error("Gagal menyimpan duplikat: " + (err.message || ""));
    }
  };

  const deleteRow = async (index: number) => {
    const row = rows[index];
    if (!row.isNew) {
      const { error } = await supabase.from("audit_penugasan").delete().eq("id", row.id);
      if (error) { toast.error("Gagal menghapus"); return; }
    }
    setRows(prev => prev.filter((_, i) => i !== index));
    toast.success("Baris dihapus");
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const dirtyRows = rows.filter(r => r.isDirty);
      for (const row of dirtyRows) {
        const payload: any = {};
        COLUMNS.forEach(c => { if (c.key !== "no") payload[c.key] = (row as any)[c.key] || null; });
        payload.no = row.no;
        payload.created_by_email = user?.email || null;

        if (row.isNew) {
          payload.id = row.id;
          const { error } = await supabase.from("audit_penugasan").insert(payload);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("audit_penugasan").update(payload).eq("id", row.id);
          if (error) throw error;
        }
      }
      toast.success(`${dirtyRows.length} baris disimpan`);
      hasFetched.current = false;
      await fetchData();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const exportExcel = () => {
    const exportData = rows.map((r) => {
      const obj: any = {};
      COLUMNS.forEach(c => { obj[c.label] = (r as any)[c.key] ?? ""; });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit Penugasan");
    XLSX.writeFile(wb, `Audit_Penugasan_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Data berhasil diekspor");
  };

  // Auto-save rows to Supabase for persistence across tab navigation
  const autoSaveRows = async (rowsToSave: AuditRow[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Delete existing rows first, then insert all new ones
      await supabase.from("audit_penugasan").delete().neq("id", "");
      const payloads = rowsToSave.map(row => {
        const payload: any = {};
        COLUMNS.forEach(c => { if (c.key !== "no") payload[c.key] = (row as any)[c.key] || null; });
        payload.id = row.id;
        payload.no = row.no;
        payload.created_by_email = user?.email || null;
        return payload;
      });
      if (payloads.length > 0) {
        const { error } = await supabase.from("audit_penugasan").insert(payloads);
        if (error) throw error;
      }
      // Mark all rows as saved
      setRows(prev => prev.map(r => ({ ...r, isNew: false, isDirty: false })));
    } catch (err: any) {
      console.error("Auto-save failed:", err);
    }
  };

  const importExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws) as any[];
      const newRows: AuditRow[] = jsonData.map((row, i) => ({
        id: crypto.randomUUID(),
        no: i + 1,
        npwp: String(row["NPWP"] || row["npwp"] || ""),
        nama_perusahaan: String(row["Nama Perusahaan"] || ""),
        bentuk_kantor: String(row["Bentuk Kantor"] || ""),
        alamat: String(row["Alamat"] || ""),
        fasilitas: String(row["Fasilitas"] || ""),
        npa: String(row["NPA"] || ""),
        tanggal_awal_periode: String(row["Tgl Awal Periode"] || ""),
        tanggal_akhir_periode: String(row["Tgl Akhir Periode"] || ""),
        tanggal_awal_peklap: String(row["Tgl Awal Peklap"] || ""),
        tanggal_akhir_peklap: String(row["Tgl Akhir Peklap"] || ""),
        nama_pma: String(row["Nama PMA"] || ""),
        pangkat_gol_pma: String(row["Pangkat/Gol PMA"] || ""),
        jabatan_pma: String(row["Jabatan PMA"] || ""),
        nama_pta: String(row["Nama PTA"] || ""),
        pangkat_gol_pta: String(row["Pangkat/Gol PTA"] || ""),
        jabatan_pta: String(row["Jabatan PTA"] || ""),
        nama_katim: String(row["Nama Katim"] || ""),
        pangkat_gol_katim: String(row["Pangkat/Gol Katim"] || ""),
        jabatan_katim: String(row["Jabatan Katim"] || ""),
        nama_a1: String(row["Nama A1"] || ""),
        pangkat_gol_a1: String(row["Pangkat/Gol A1"] || ""),
        jabatan_a1: String(row["Jabatan A1"] || ""),
        nama_a2: String(row["Nama A2"] || ""),
        pangkat_gol_a2: String(row["Pangkat/Gol A2"] || ""),
        jabatan_a2: String(row["Jabatan A2"] || ""),
        nama_a3: String(row["Nama A3"] || ""),
        pangkat_gol_a3: String(row["Pangkat/Gol A3"] || ""),
        jabatan_a3: String(row["Jabatan A3"] || ""),
        no_st_induk: String(row["No. ST Induk"] || ""),
        tanggal_st_induk: String(row["Tgl ST Induk"] || ""),
        tahap_pelaksanaan_st_ke: String(row["Tahap ST Ke"] || ""),
        dipa: String(row["DIPA"] || ""),
        periode_ke: String(row["Periode Ke"] || ""),
        isNew: true,
        isDirty: true,
      }));
      setRows(newRows);
      await autoSaveRows(newRows);
      toast.success(`${newRows.length} baris diimport dan disimpan ke database.`);
    };
    reader.readAsArrayBuffer(file);
  };

  const renderCell = (row: AuditRow, rowIdx: number, colKey: string) => {
    if (colKey === "no") {
      return <span className="px-2 py-1 block text-center">{row.no}</span>;
    }

    if (!canEdit) {
      return <span className="px-2 py-1 block truncate">{(row as any)[colKey] || "-"}</span>;
    }

    // Bentuk Kantor - checkbox multi-select
    if (colKey === "bentuk_kantor") {
      return (
        <BentukKantorSelect
          value={(row as any)[colKey] || ""}
          onChange={(v) => handleCellChange(rowIdx, colKey, v)}
        />
      );
    }

    // Fasilitas - checkbox multi-select
    if (colKey === "fasilitas") {
      return (
        <CheckboxMultiSelect
          value={(row as any)[colKey] || ""}
          options={FASILITAS_OPTIONS}
          onChange={(v) => handleCellChange(rowIdx, colKey, v)}
        />
      );
    }

    // Date fields - calendar picker
    if (DATE_FIELDS.includes(colKey)) {
      return (
        <DateCellPicker
          value={(row as any)[colKey] || ""}
          onChange={(v) => handleCellChange(rowIdx, colKey, v)}
        />
      );
    }

    // Name fields - employee combobox with auto-fill
    if (NAME_FIELDS.includes(colKey)) {
      return (
        <EmployeeCombobox
          value={(row as any)[colKey] || ""}
          employees={employees}
          onChange={(name, pangkat, jabatan) => handleEmployeeSelect(rowIdx, colKey, name, pangkat, jabatan)}
        />
      );
    }

    // Fix #3: Jabatan fields - predefined dropdown options (not auto)
    if (JABATAN_FIELDS.includes(colKey)) {
      return (
        <JabatanSelect
          value={(row as any)[colKey] || ""}
          options={JABATAN_OPTIONS_MAP[colKey]}
          onChange={(v) => handleCellChange(rowIdx, colKey, v)}
        />
      );
    }

    // Pangkat/Gol fields - auto-filled but editable
    if (colKey.startsWith("pangkat_gol_")) {
      return (
        <Input
          value={(row as any)[colKey] || ""}
          onChange={(e) => handleCellChange(rowIdx, colKey, e.target.value)}
          className="border-0 rounded-none h-8 text-xs focus-visible:ring-1 focus-visible:ring-inset bg-muted/30"
          placeholder="Auto"
        />
      );
    }

    // Default text input
    return (
      <Input
        value={(row as any)[colKey] || ""}
        onChange={(e) => handleCellChange(rowIdx, colKey, e.target.value)}
        className="border-0 rounded-none h-8 text-xs focus-visible:ring-1 focus-visible:ring-inset"
      />
    );
  };

  const hasDirty = rows.some(r => r.isDirty);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <h3 className="text-xl font-bold">Audit Penugasan</h3>
        <div className="flex gap-2 flex-wrap">
          {canEdit && (
            <Button size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" /> Tambah Baris
            </Button>
          )}
          {canEdit && hasDirty && (
            <Button size="sm" variant="default" onClick={saveAll} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          )}
          {canEdit && (
            <Button size="sm" variant="outline" onClick={exportExcel}>
              <Download className="h-4 w-4 mr-1" /> Export Excel
            </Button>
          )}
          {canEdit && (
            <label>
              <Button size="sm" variant="outline" asChild>
                <span><Upload className="h-4 w-4 mr-1" /> Import Excel</span>
              </Button>
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importExcel(file);
                e.target.value = "";
              }} />
            </label>
          )}
          {canEdit && rows.length > 0 && (
            <Button size="sm" variant="destructive" onClick={async () => {
              if (!confirm("Yakin ingin menghapus SEMUA data audit?")) return;
              const { error } = await supabase.from("audit_penugasan").delete().neq("id", "");
              if (error) { toast.error("Gagal menghapus"); return; }
              setRows([]);
              toast.success("Semua data dihapus");
            }}>
              <Trash2 className="h-4 w-4 mr-1" /> Hapus Semua
            </Button>
          )}
        </div>
      </div>

      {/* Generate ND & Lampiran Section */}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 mr-2">
            <Input
              placeholder="Nomor ND"
              value={nomorND}
              onChange={(e) => setNomorND(e.target.value)}
              className="h-8 text-xs w-36"
            />
            <Input
              placeholder="Tanggal ND"
              value={tanggalND}
              onChange={(e) => setTanggalND(e.target.value)}
              className="h-8 text-xs w-36"
            />
          </div>

          {/* 1. Rencana Penugasan */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs">
                <FileText className="h-3 w-3 mr-1" /> Rencana Penugasan <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => generateNDRencanaPenugasan(nomorND, tanggalND, rows.length)}>
                <FileText className="h-3 w-3 mr-2" /> Generate ND
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => generateLampiranRencanaPenugasan(nomorND, tanggalND, rows)}>
                <FileText className="h-3 w-3 mr-2" /> Generate Lampiran
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 2. Kakanwil - Dir. Audit */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs">
                <FileText className="h-3 w-3 mr-1" /> Kakanwil - Dir. Audit <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => generateNDKakanwilDirAudit(nomorND, tanggalND, rows.length)}>
                <FileText className="h-3 w-3 mr-2" /> Generate ND
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => generateLampiranKakanwilDirAudit(nomorND, tanggalND, rows)}>
                <FileText className="h-3 w-3 mr-2" /> Generate Lampiran
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 3. Pengajuan ST Peklap Tahap I */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs">
                <FileText className="h-3 w-3 mr-1" /> ST Peklap Tahap I <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => generateNDPengajuanSTPeklap(nomorND, tanggalND, 1)}>
                <FileText className="h-3 w-3 mr-2" /> Generate ND
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => generateLampiranPengajuanSTPeklap(nomorND, tanggalND, rows, 1)}>
                <FileText className="h-3 w-3 mr-2" /> Generate Lampiran
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 4. Pengajuan ST Peklap Tahap II */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs">
                <FileText className="h-3 w-3 mr-1" /> ST Peklap Tahap II <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => generateNDPengajuanSTPeklap(nomorND, tanggalND, 2)}>
                <FileText className="h-3 w-3 mr-2" /> Generate ND
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => generateLampiranPengajuanSTPeklap(nomorND, tanggalND, rows, 2)}>
                <FileText className="h-3 w-3 mr-2" /> Generate Lampiran
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 5. ST Induk */}
          <Button size="sm" variant="outline" className="text-xs" onClick={() => setStIndukDialogOpen(true)}>
            <FileText className="h-3 w-3 mr-1" /> ST Induk
          </Button>

          {/* 6. ST Pekerjaan Lapangan */}
          <Button size="sm" variant="outline" className="text-xs" onClick={() => setStPeklapDialogOpen(true)}>
            <FileText className="h-3 w-3 mr-1" /> ST Pekerjaan Lapangan
          </Button>
        </div>
      )}

      {/* ST Selection Dialogs */}
      <AuditSTSelectionDialog
        open={stIndukDialogOpen}
        onOpenChange={setStIndukDialogOpen}
        rows={rows}
        title="Generate ST Induk"
        onGenerate={(selectedRows) => {
          generateSTInduk(nomorND, tanggalND, selectedRows);
          toast.success(`ST Induk berhasil di-generate untuk ${selectedRows.length} perusahaan`);
        }}
      />
      <AuditSTSelectionDialog
        open={stPeklapDialogOpen}
        onOpenChange={setStPeklapDialogOpen}
        rows={rows}
        title="Generate ST Pekerjaan Lapangan"
        onGenerate={(selectedRows) => {
          generateSTPekerjaanLapangan(nomorND, tanggalND, selectedRows);
          toast.success(`ST Pekerjaan Lapangan berhasil di-generate untuk ${selectedRows.length} perusahaan`);
        }}
      />

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
      ) : (
        <div className="border rounded-lg overflow-auto max-h-[70vh]">
          <table className="text-xs border-collapse">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                {COLUMNS.map(col => (
                  <th key={col.key} className={`${col.width} px-2 py-2 text-left font-medium border border-border whitespace-nowrap`}>
                    {col.label}
                  </th>
                ))}
                {canEdit && <th className="w-24 px-2 py-2 border border-border text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + (canEdit ? 1 : 0)} className="text-center py-8 text-muted-foreground border">
                    Belum ada data. Klik "Tambah Baris" untuk menambahkan.
                  </td>
                </tr>
              ) : (
                rows.map((row, rowIdx) => (
                  <tr key={row.id} className={row.isDirty ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
                    {COLUMNS.map(col => (
                      <td key={col.key} className={`${col.width} border border-border p-0`}>
                        {renderCell(row, rowIdx, col.key)}
                      </td>
                    ))}
                    {canEdit && (
                      <td className="w-24 border border-border text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-primary hover:text-primary"
                            title="Duplikat baris"
                            onClick={() => duplicateRow(rowIdx)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive"
                            title="Hapus baris"
                            onClick={() => deleteRow(rowIdx)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
