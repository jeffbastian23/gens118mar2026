import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface GradingData {
  id: string;
  nama_lengkap: string;
  nip: string;
  pangkat_golongan: string;
  pendidikan: string;
  eselon_iii: string;
  eselon_iv: string;
  jabatan: string;
  grade: string;
  rekomendasi: string;
  atasan_langsung_nama?: string;
  atasan_dari_atasan_nama?: string;
}

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string | null;
  uraian_jabatan: string;
}

interface TambahKuesionerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gradingData: GradingData[];
  onSuccess: () => void;
  existingKuesionerNIPs?: string[]; // NIPs that already have kuesioner
}

// Kuesioner type definitions based on grade transitions
type KuesionerType = "4-5/5-6" | "6-7/7-8" | "8-9/9-10" | "10-11/11-12";

const getKuesionerType = (gradeStr: string): KuesionerType | null => {
  const grade = parseInt(gradeStr);
  if (isNaN(grade)) return null;
  
  if (grade === 4 || grade === 5) return "4-5/5-6";
  if (grade === 6 || grade === 7) return "6-7/7-8";
  if (grade === 8 || grade === 9) return "8-9/9-10";
  if (grade === 10 || grade === 11) return "10-11/11-12";
  
  return null;
};

const getKuesionerLabel = (type: KuesionerType): string => {
  switch (type) {
    case "4-5/5-6":
      return "Kuesioner Grade 4→5 / 5→6";
    case "6-7/7-8":
      return "Kuesioner Grade 6→7 / 7→8";
    case "8-9/9-10":
      return "Kuesioner Grade 8→9 / 9→10";
    case "10-11/11-12":
      return "Kuesioner Grade 10→11 / 11→12";
  }
};

const getKuesionerTitle = (type: KuesionerType): string => {
  switch (type) {
    case "4-5/5-6":
      return "KUESIONER UNTUK PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 4 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 5, ATAU PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 5 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 6";
    case "6-7/7-8":
      return "KUESIONER UNTUK PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 6 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 7, ATAU PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 7 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 8";
    case "8-9/9-10":
      return "KUESIONER UNTUK PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 8 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 9, ATAU PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 9 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 10";
    case "10-11/11-12":
      return "KUESIONER UNTUK PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 10 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 11, ATAU PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 11 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 12";
  }
};

export default function TambahKuesionerDialog({
  open,
  onOpenChange,
  gradingData,
  onSuccess,
  existingKuesionerNIPs = [],
}: TambahKuesionerDialogProps) {
  const [selectedGradingId, setSelectedGradingId] = useState<string>("");
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nip: "",
    peringkat_saat_ini: "",
    jabatan_saat_ini: "",
    pangkat_golongan: "",
    pendidikan_saat_ini: "",
    unit_organisasi: "",
    jenis_kuesioner: "" as KuesionerType | "",
    lokasi: "",
    tanggal: null as Date | null,
    atasan_langsung_id: "",
    atasan_langsung_nama: "",
    atasan_langsung_nip: "",
    atasan_dari_atasan_id: "",
    atasan_dari_atasan_nama: "",
    atasan_dari_atasan_nip: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [atasanLangsungOpen, setAtasanLangsungOpen] = useState(false);
  const [atasanDariAtasanOpen, setAtasanDariAtasanOpen] = useState(false);
  const [atasanLangsungSearch, setAtasanLangsungSearch] = useState("");
  const [atasanDariAtasanSearch, setAtasanDariAtasanSearch] = useState("");
  const [namaLengkapOpen, setNamaLengkapOpen] = useState(false);
  const [namaLengkapSearch, setNamaLengkapSearch] = useState("");

  // Fetch employees for atasan selection
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, nm_pegawai, nip, uraian_jabatan")
        .order("nm_pegawai");
      
      if (!error && data) {
        setEmployees(data);
      }
    };

    if (open) {
      fetchEmployees();
    }
  }, [open]);

  // Filter grading data to only show those with rekomendasi "Naik" and not already have kuesioner
  const eligibleGradingData = gradingData.filter(
    (data) => data.rekomendasi === "Naik" && !existingKuesionerNIPs.includes(data.nip)
  );
  
  // Filter eligible data by search term for nama lengkap dropdown
  const filteredEligibleData = eligibleGradingData.filter(
    (data) =>
      data.nama_lengkap.toLowerCase().includes(namaLengkapSearch.toLowerCase()) ||
      data.nip.includes(namaLengkapSearch)
  );

  // Filter employees for search
  const filteredAtasanLangsung = employees.filter((emp) =>
    emp.nm_pegawai.toLowerCase().includes(atasanLangsungSearch.toLowerCase()) ||
    (emp.nip && emp.nip.includes(atasanLangsungSearch))
  );

  const filteredAtasanDariAtasan = employees.filter((emp) =>
    emp.nm_pegawai.toLowerCase().includes(atasanDariAtasanSearch.toLowerCase()) ||
    (emp.nip && emp.nip.includes(atasanDariAtasanSearch))
  );

  // Auto-fill form when a name is selected - including atasan from big data
  useEffect(() => {
    if (selectedGradingId) {
      const selected = gradingData.find((d) => d.id === selectedGradingId);
      if (selected) {
        const unitOrganisasi = [selected.eselon_iv, selected.eselon_iii]
          .filter(Boolean)
          .join(" - ");
        
        const kuesionerType = getKuesionerType(selected.grade);
        
        // Find atasan langsung and atasan dari atasan from employees based on big data
        const atasanLangsung = employees.find(emp => emp.nm_pegawai === selected.atasan_langsung_nama);
        const atasanDariAtasan = employees.find(emp => emp.nm_pegawai === selected.atasan_dari_atasan_nama);
        
        setFormData((prev) => ({
          ...prev,
          nama_lengkap: selected.nama_lengkap,
          nip: selected.nip || "",
          peringkat_saat_ini: selected.grade || "",
          jabatan_saat_ini: selected.jabatan || "",
          pangkat_golongan: selected.pangkat_golongan || "",
          pendidikan_saat_ini: selected.pendidikan || "",
          unit_organisasi: unitOrganisasi,
          jenis_kuesioner: kuesionerType || "",
          // Auto-fill atasan langsung from big data
          atasan_langsung_id: atasanLangsung?.id || "",
          atasan_langsung_nama: selected.atasan_langsung_nama || "",
          atasan_langsung_nip: atasanLangsung?.nip || "",
          // Auto-fill atasan dari atasan from big data
          atasan_dari_atasan_id: atasanDariAtasan?.id || "",
          atasan_dari_atasan_nama: selected.atasan_dari_atasan_nama || "",
          atasan_dari_atasan_nip: atasanDariAtasan?.nip || "",
        }));
      }
    } else {
      setFormData({
        nama_lengkap: "",
        nip: "",
        peringkat_saat_ini: "",
        jabatan_saat_ini: "",
        pangkat_golongan: "",
        pendidikan_saat_ini: "",
        unit_organisasi: "",
        jenis_kuesioner: "",
        lokasi: "",
        tanggal: null,
        atasan_langsung_id: "",
        atasan_langsung_nama: "",
        atasan_langsung_nip: "",
        atasan_dari_atasan_id: "",
        atasan_dari_atasan_nama: "",
        atasan_dari_atasan_nip: "",
      });
    }
  }, [selectedGradingId, gradingData, employees]);

  const handleSubmit = async () => {
    if (!selectedGradingId || !formData.jenis_kuesioner) {
      toast.error("Pilih nama pegawai dan jenis kuesioner");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      const { error } = await supabase.from("grading_kuesioner").insert({
        grading_id: selectedGradingId,
        nama_lengkap: formData.nama_lengkap,
        nip: formData.nip,
        jenis_kuesioner: formData.jenis_kuesioner,
        status: "Belum Diisi",
        jawaban: {
          peringkat_saat_ini: formData.peringkat_saat_ini,
          jabatan_saat_ini: formData.jabatan_saat_ini,
          pangkat_golongan: formData.pangkat_golongan,
          pendidikan_saat_ini: formData.pendidikan_saat_ini,
          unit_organisasi: formData.unit_organisasi,
          kuesioner_title: getKuesionerTitle(formData.jenis_kuesioner as KuesionerType),
          lokasi: formData.lokasi,
          tanggal: formData.tanggal ? format(formData.tanggal, "yyyy-MM-dd") : null,
          atasan_langsung_id: formData.atasan_langsung_id,
          atasan_langsung_nama: formData.atasan_langsung_nama,
          atasan_langsung_nip: formData.atasan_langsung_nip,
          atasan_dari_atasan_id: formData.atasan_dari_atasan_id,
          atasan_dari_atasan_nama: formData.atasan_dari_atasan_nama,
          atasan_dari_atasan_nip: formData.atasan_dari_atasan_nip,
        },
        created_by_email: userEmail,
      });

      if (error) throw error;

      toast.success("Kuesioner berhasil ditambahkan");
      onOpenChange(false);
      setSelectedGradingId("");
      onSuccess();
    } catch (error: any) {
      console.error("Error adding kuesioner:", error);
      toast.error("Gagal menambahkan kuesioner");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedGradingId("");
    setFormData({
      nama_lengkap: "",
      nip: "",
      peringkat_saat_ini: "",
      jabatan_saat_ini: "",
      pangkat_golongan: "",
      pendidikan_saat_ini: "",
      unit_organisasi: "",
      jenis_kuesioner: "",
      lokasi: "",
      tanggal: null,
      atasan_langsung_id: "",
      atasan_langsung_nama: "",
      atasan_langsung_nip: "",
      atasan_dari_atasan_id: "",
      atasan_dari_atasan_nama: "",
      atasan_dari_atasan_nip: "",
    });
    setAtasanLangsungSearch("");
    setAtasanDariAtasanSearch("");
    setNamaLengkapSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Tambah Kuesioner</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4 py-2">
            {/* Nama Lengkap (Select from Big Data with Search) */}
            <div className="space-y-2">
              <Label htmlFor="nama_lengkap">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Popover open={namaLengkapOpen} onOpenChange={setNamaLengkapOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={namaLengkapOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedGradingId 
                      ? `${gradingData.find(d => d.id === selectedGradingId)?.nama_lengkap} - Grade ${gradingData.find(d => d.id === selectedGradingId)?.grade}`
                      : "Pilih pegawai dari Big Data"}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Cari nama atau NIP..."
                      value={namaLengkapSearch}
                      onValueChange={setNamaLengkapSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {eligibleGradingData.length === 0 
                          ? "Tidak ada pegawai dengan rekomendasi 'Naik' atau sudah memiliki kuesioner"
                          : "Tidak ditemukan"}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredEligibleData.slice(0, 50).map((data) => (
                          <CommandItem
                            key={data.id}
                            value={`${data.nama_lengkap} ${data.nip}`}
                            onSelect={() => {
                              setSelectedGradingId(data.id);
                              setNamaLengkapOpen(false);
                              setNamaLengkapSearch("");
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{data.nama_lengkap}</span>
                              <span className="text-xs text-muted-foreground">NIP: {data.nip} - Grade {data.grade}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Menampilkan pegawai dengan rekomendasi "Naik" yang belum memiliki kuesioner
              </p>
            </div>

            {/* NIP (Auto-filled) */}
            <div className="space-y-2">
              <Label htmlFor="nip">NIP</Label>
              <Input
                id="nip"
                value={formData.nip}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Peringkat Saat Ini (Auto-filled) */}
            <div className="space-y-2">
              <Label htmlFor="peringkat_saat_ini">Peringkat Saat Ini</Label>
              <Input
                id="peringkat_saat_ini"
                value={formData.peringkat_saat_ini}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Jabatan Saat Ini (Auto-filled) */}
            <div className="space-y-2">
              <Label htmlFor="jabatan_saat_ini">Jabatan Saat Ini</Label>
              <Input
                id="jabatan_saat_ini"
                value={formData.jabatan_saat_ini}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Pangkat/Golongan (Auto-filled) */}
            <div className="space-y-2">
              <Label htmlFor="pangkat_golongan">Pangkat/Golongan Saat Ini</Label>
              <Input
                id="pangkat_golongan"
                value={formData.pangkat_golongan}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Pendidikan Saat Ini (Auto-filled) */}
            <div className="space-y-2">
              <Label htmlFor="pendidikan_saat_ini">Pendidikan Saat Ini</Label>
              <Input
                id="pendidikan_saat_ini"
                value={formData.pendidikan_saat_ini}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Unit Organisasi (Auto-filled) */}
            <div className="space-y-2">
              <Label htmlFor="unit_organisasi">Unit Organisasi</Label>
              <Input
                id="unit_organisasi"
                value={formData.unit_organisasi}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Jenis Kuesioner (Auto-determined but can be changed) */}
            <div className="space-y-2">
              <Label htmlFor="jenis_kuesioner">
                Jenis Format Kuesioner <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.jenis_kuesioner}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    jenis_kuesioner: value as KuesionerType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis format kuesioner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4-5/5-6">
                    {getKuesionerLabel("4-5/5-6")}
                  </SelectItem>
                  <SelectItem value="6-7/7-8">
                    {getKuesionerLabel("6-7/7-8")}
                  </SelectItem>
                  <SelectItem value="8-9/9-10">
                    {getKuesionerLabel("8-9/9-10")}
                  </SelectItem>
                  <SelectItem value="10-11/11-12">
                    {getKuesionerLabel("10-11/11-12")}
                  </SelectItem>
                </SelectContent>
              </Select>
              {formData.jenis_kuesioner && (
                <p className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded-md">
                  {getKuesionerTitle(formData.jenis_kuesioner as KuesionerType)}
                </p>
              )}
            </div>

            {/* Lokasi */}
            <div className="space-y-2">
              <Label htmlFor="lokasi">Lokasi</Label>
              <Input
                id="lokasi"
                placeholder="Masukkan lokasi"
                value={formData.lokasi}
                onChange={(e) => setFormData((prev) => ({ ...prev, lokasi: e.target.value }))}
              />
            </div>

            {/* Tanggal */}
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.tanggal && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.tanggal ? format(formData.tanggal, "d MMMM yyyy", { locale: localeId }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.tanggal || undefined}
                    onSelect={(date) => setFormData((prev) => ({ ...prev, tanggal: date || null }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Atasan Langsung with NIP */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Atasan Langsung</Label>
                <Popover open={atasanLangsungOpen} onOpenChange={setAtasanLangsungOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={atasanLangsungOpen}
                      className="w-full justify-between font-normal"
                    >
                      {formData.atasan_langsung_nama || "Pilih atasan langsung"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Cari nama atau NIP..."
                        value={atasanLangsungSearch}
                        onValueChange={setAtasanLangsungSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Tidak ditemukan</CommandEmpty>
                        <CommandGroup>
                          {filteredAtasanLangsung.slice(0, 50).map((emp) => (
                            <CommandItem
                              key={emp.id}
                              value={emp.id}
                              onSelect={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  atasan_langsung_id: emp.id,
                                  atasan_langsung_nama: emp.nm_pegawai,
                                  atasan_langsung_nip: emp.nip || "",
                                }));
                                setAtasanLangsungOpen(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{emp.nm_pegawai}</span>
                                <span className="text-xs text-muted-foreground">{emp.nip || "-"}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>NIP Atasan Langsung</Label>
                <Input
                  value={formData.atasan_langsung_nip}
                  readOnly
                  className="bg-muted"
                  placeholder="Otomatis dari pilihan"
                />
              </div>
            </div>

            {/* Atasan dari Atasan Langsung with NIP */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Atasan dari Atasan Langsung</Label>
                <Popover open={atasanDariAtasanOpen} onOpenChange={setAtasanDariAtasanOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={atasanDariAtasanOpen}
                      className="w-full justify-between font-normal"
                    >
                      {formData.atasan_dari_atasan_nama || "Pilih atasan dari atasan"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Cari nama atau NIP..."
                        value={atasanDariAtasanSearch}
                        onValueChange={setAtasanDariAtasanSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Tidak ditemukan</CommandEmpty>
                        <CommandGroup>
                          {filteredAtasanDariAtasan.slice(0, 50).map((emp) => (
                            <CommandItem
                              key={emp.id}
                              value={emp.id}
                              onSelect={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  atasan_dari_atasan_id: emp.id,
                                  atasan_dari_atasan_nama: emp.nm_pegawai,
                                  atasan_dari_atasan_nip: emp.nip || "",
                                }));
                                setAtasanDariAtasanOpen(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{emp.nm_pegawai}</span>
                                <span className="text-xs text-muted-foreground">{emp.nip || "-"}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>NIP Atasan dari Atasan Langsung</Label>
                <Input
                  value={formData.atasan_dari_atasan_nip}
                  readOnly
                  className="bg-muted"
                  placeholder="Otomatis dari pilihan"
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Menyimpan..." : "Simpan Kuesioner"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
