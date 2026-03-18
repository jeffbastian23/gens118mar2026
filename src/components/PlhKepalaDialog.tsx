import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputWithVoice } from "@/components/ui/input-with-voice";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toProperCase } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string;
  uraian_pangkat: string;
  uraian_jabatan: string;
}

interface PlhKepala {
  id?: string;
  unit_pemohon: string;
  unit_penerbit: string;
  dasar_penugasan: string;
  nomor_naskah_dinas: string;
  tanggal: string;
  perihal: string;
  employee_id: string;
  document_path?: string;
  tanggal_plh_mulai?: string;
  tanggal_plh_selesai?: string;
  pejabat_unit_pemohon_id?: string;
  pejabat_unit_penerbit_id?: string;
  agenda_number?: number;
}

interface PlhKepalaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plhKepala: PlhKepala | null;
  onSuccess: () => void;
}

const UNIT_OPTIONS = [
  "Kantor Wilayah Direktorat Jenderal Bea dan Cukai Jawa Timur I",
  "Bagian Umum",
  "Bidang Kepabeanan dan Cukai",
  "Bidang Fasilitas Kepabeanan dan Cukai",
  "Bidang Penindakan dan Penyidikan",
  "Bidang Kepatuhan Internal",
  "Sub Unsur Keberatan & Banding",
  "Sub Unsur Audit",
  "KPPBC TMP Tanjung Perak",
  "KPPBC TMP Juanda",
  "KPPBC TMP A Pasuruan",
  "KPPBC TMP B Gresik",
  "KPPBC TMP B Sidoarjo",
  "KPPBC TMP C Madura",
  "KPPBC TMP C Bojonegoro",
  "BLBC Kelas II Surabaya"
];

export default function PlhKepalaDialog({ open, onOpenChange, plhKepala, onSuccess }: PlhKepalaDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [pemohonSearchTerm, setPemohonSearchTerm] = useState("");
  const [penerbitSearchTerm, setPenerbitSearchTerm] = useState("");
  const [pemohonOpen, setPemohonOpen] = useState(false);
  const [penerbitOpen, setPenerbitOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    unit_pemohon: "",
    unit_penerbit: "",
    dasar_penugasan: "",
    nomor_naskah_dinas: "",
    tanggal: new Date(),
    perihal: "",
    employee_id: "",
    document_path: "",
    tanggal_plh_mulai: null as Date | null,
    tanggal_plh_selesai: null as Date | null,
    pejabat_unit_pemohon_id: "",
    pejabat_unit_penerbit_id: "",
    jenis_plh_plt: "PLH" as "PLH" | "PLT"
  });

  useEffect(() => {
    if (open) {
      fetchEmployees();
      if (plhKepala) {
        setFormData({
          unit_pemohon: plhKepala.unit_pemohon,
          unit_penerbit: plhKepala.unit_penerbit,
          dasar_penugasan: plhKepala.dasar_penugasan,
          nomor_naskah_dinas: plhKepala.nomor_naskah_dinas,
          tanggal: new Date(plhKepala.tanggal),
          perihal: plhKepala.perihal,
          employee_id: plhKepala.employee_id || "",
          document_path: plhKepala.document_path || "",
          tanggal_plh_mulai: plhKepala.tanggal_plh_mulai ? new Date(plhKepala.tanggal_plh_mulai) : null,
          tanggal_plh_selesai: plhKepala.tanggal_plh_selesai ? new Date(plhKepala.tanggal_plh_selesai) : null,
          pejabat_unit_pemohon_id: plhKepala.pejabat_unit_pemohon_id || "",
          pejabat_unit_penerbit_id: plhKepala.pejabat_unit_penerbit_id || "",
          jenis_plh_plt: (plhKepala as any).jenis_plh_plt || "PLH"
        });
      } else {
        resetForm();
      }
    }
  }, [open, plhKepala]);

  const fetchEmployees = async () => {
    let allEmployees: Employee[] = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from("employees")
        .select("id, nm_pegawai, nip, uraian_pangkat, uraian_jabatan")
        .order("nm_pegawai")
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) break;
      if (!data || data.length === 0) break;
      
      allEmployees = [...allEmployees, ...data];
      
      if (data.length < pageSize) break;
      page++;
    }
    
    // Filter out "Pelaksana" and "Pemeriksa" positions
    const filteredEmployees = allEmployees.filter(emp => {
      const jabatan = emp.uraian_jabatan.toLowerCase();
      return !jabatan.includes('pelaksana') && !jabatan.includes('pemeriksa');
    });
    
    setEmployees(filteredEmployees);
  };

  const resetForm = () => {
    setFormData({
      unit_pemohon: "",
      unit_penerbit: "",
      dasar_penugasan: "",
      nomor_naskah_dinas: "",
      tanggal: new Date(),
      perihal: "",
      employee_id: "",
      document_path: "",
      tanggal_plh_mulai: null,
      tanggal_plh_selesai: null,
      pejabat_unit_pemohon_id: "",
      pejabat_unit_penerbit_id: "",
      jenis_plh_plt: "PLH"
    });
    setUploadedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10485760) { // 10MB
        toast.error("Ukuran file maksimal 10MB");
        return;
      }
      if (file.type !== "application/pdf") {
        toast.error("Hanya file PDF yang diizinkan");
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let documentPath = formData.document_path;

      // Upload file if new file is selected
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('konsideran-documents')
          .upload(filePath, uploadedFile);

        if (uploadError) throw uploadError;
        documentPath = filePath;
      }

      // Get current user email for tracking
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || "unknown";

      // Check if this is a new entry (KONSEP MASUK stage)
      const isNewEntry = !plhKepala;

      const payload = {
        unit_pemohon: formData.unit_pemohon,
        unit_penerbit: formData.unit_penerbit,
        dasar_penugasan: formData.dasar_penugasan,
        nomor_naskah_dinas: formData.nomor_naskah_dinas,
        tanggal: format(formData.tanggal, "yyyy-MM-dd"),
        perihal: formData.perihal,
        employee_id: formData.employee_id || null,
        employee_ids: [], // Keep for backward compatibility
        document_path: documentPath,
        tanggal_plh_mulai: formData.tanggal_plh_mulai ? format(formData.tanggal_plh_mulai, "yyyy-MM-dd") : null,
        tanggal_plh_selesai: formData.tanggal_plh_selesai ? format(formData.tanggal_plh_selesai, "yyyy-MM-dd") : null,
        pejabat_unit_pemohon_id: formData.pejabat_unit_pemohon_id || null,
        pejabat_unit_penerbit_id: formData.pejabat_unit_penerbit_id || null,
        jenis_plh_plt: formData.jenis_plh_plt,
        // Add tracking for new entries
        ...(!plhKepala && {
          konsep_masuk_at: new Date().toISOString(),
          konsep_masuk_by: userEmail
        })
      };

      if (plhKepala) {
        const { error } = await supabase
          .from("plh_kepala")
          .update(payload)
          .eq("id", plhKepala.id);
        if (error) throw error;
        toast.success("Data PLH Kepala berhasil diperbarui!");
      } else {
        const { data: insertedData, error } = await supabase
          .from("plh_kepala")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        
        // Create notifications for all admins when KONSEP MASUK (new entry)
        if (isNewEntry && insertedData) {
          // Get all admin users from user_roles
          const { data: adminRoles } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin");
          
          if (adminRoles && adminRoles.length > 0) {
            const notifications = adminRoles
              .filter((role: any) => role.user_id !== user?.id) // Don't notify creator
              .map((role: any) => ({
                user_id: role.user_id,
                title: `Konsep Masuk - PLH/PLT Agenda #${insertedData.agenda_number}`,
                message: `Permohonan ${payload.jenis_plh_plt} baru dengan perihal "${payload.perihal}" telah masuk dan perlu ditinjau.`,
                is_read: false,
              }));
            
            if (notifications.length > 0) {
              await supabase.from("notifications").insert(notifications);
            }
          }
        }
        
        toast.success("Data PLH Kepala berhasil ditambahkan!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.nm_pegawai.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    emp.nip?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    emp.uraian_jabatan.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    emp.uraian_pangkat.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  const filteredPemohon = employees.filter(emp =>
    emp.nm_pegawai.toLowerCase().includes(pemohonSearchTerm.toLowerCase()) ||
    emp.uraian_jabatan.toLowerCase().includes(pemohonSearchTerm.toLowerCase())
  );

  const filteredPenerbit = employees.filter(emp =>
    emp.nm_pegawai.toLowerCase().includes(penerbitSearchTerm.toLowerCase()) ||
    emp.uraian_jabatan.toLowerCase().includes(penerbitSearchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{plhKepala ? "Edit Data PLH/PLT Kepala" : "Data PLH/PLT"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div className="space-y-2">
            <Label>Jenis PLH/PLT *</Label>
            <RadioGroup
              value={formData.jenis_plh_plt}
              onValueChange={(v: "PLH" | "PLT") => setFormData({...formData, jenis_plh_plt: v})}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PLH" id="plh" />
                <Label htmlFor="plh" className="font-normal cursor-pointer">PLH (Pelaksana Harian)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PLT" id="plt" />
                <Label htmlFor="plt" className="font-normal cursor-pointer">PLT (Pelaksana Tugas)</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit Pemohon *</Label>
              <Select value={formData.unit_pemohon} onValueChange={(v) => setFormData({...formData, unit_pemohon: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit pemohon" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unit Penerbit *</Label>
              <Select value={formData.unit_penerbit} onValueChange={(v) => setFormData({...formData, unit_penerbit: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit penerbit" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Konsideran</Label>
            <div className="space-y-3 pl-4">
              <div className="space-y-2">
                <Label>Dasar Penugasan/Cuti *</Label>
                <p className="text-sm italic text-muted-foreground">1. Tuliskan Nomor, Tanggal, dan Hal Dokumen Dasar Diperlukannya Penugasan. Contoh : UND-01/BPD/2025 tanggal 10 November 2025 hal Kunjungan Lapangan; atau 2. Hal Kedinasan lainnya sehingga diperlukan adanya penugasan. Contoh : Dalam rangka kunjungan kerja menteri keuangan. atau 3. Cuti Sakit/Cuti Tahunan/Cuti Besar dsb</p>
                <InputWithVoice
                  value={formData.dasar_penugasan}
                  onChange={(e) => setFormData({...formData, dasar_penugasan: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nomor Naskah Dinas *</Label>
                <p className="text-sm italic text-muted-foreground">Tuliskan Nomor, tanggal, hal Nota Dinas Masing masing bidang/unit terkait Permohonan Penerbitan PRIN atau Surat Izin Cuti Terbit</p>
                <InputWithVoice
                  value={formData.nomor_naskah_dinas}
                  onChange={(e) => setFormData({...formData, nomor_naskah_dinas: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.tanggal, "dd MMMM yyyy", { locale: id })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.tanggal}
                      onSelect={(date) => date && setFormData({...formData, tanggal: date})}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Perihal *</Label>
                <InputWithVoice
                  value={formData.perihal}
                  onChange={(e) => setFormData({...formData, perihal: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Upload ND (Opsional)</Label>
                <p className="text-sm italic text-muted-foreground">ND upload adalah Konsideran Naskah Dinas Dasar yang terbit pertama kali bisa internal/eksternal</p>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                />
                {uploadedFile && (
                  <p className="text-sm text-muted-foreground">File terpilih: {uploadedFile.name}</p>
                )}
                {formData.document_path && !uploadedFile && (
                  <p className="text-sm text-muted-foreground">Dokumen sudah diupload</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pejabat Penandatangan Pemohon *</Label>
              <Popover open={pemohonOpen} onOpenChange={setPemohonOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {formData.pejabat_unit_pemohon_id ? (
                      <span className="truncate">
                        {toProperCase(employees.find(e => e.id === formData.pejabat_unit_pemohon_id)?.nm_pegawai || "")} - {toProperCase(employees.find(e => e.id === formData.pejabat_unit_pemohon_id)?.uraian_jabatan || "")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Pilih pejabat pemohon</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Cari nama atau jabatan..." 
                      value={pemohonSearchTerm}
                      onValueChange={setPemohonSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>Tidak ada pejabat ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {filteredPemohon.map(emp => (
                          <CommandItem
                            key={emp.id}
                            onSelect={() => {
                              setFormData({...formData, pejabat_unit_pemohon_id: emp.id});
                              setPemohonOpen(false);
                            }}
                          >
                            {toProperCase(emp.nm_pegawai)} - {toProperCase(emp.uraian_jabatan)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Pejabat Penandatangan Penerbit *</Label>
              <Popover open={penerbitOpen} onOpenChange={setPenerbitOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {formData.pejabat_unit_penerbit_id ? (
                      <span className="truncate">
                        {toProperCase(employees.find(e => e.id === formData.pejabat_unit_penerbit_id)?.nm_pegawai || "")} - {toProperCase(employees.find(e => e.id === formData.pejabat_unit_penerbit_id)?.uraian_jabatan || "")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Pilih pejabat penerbit</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Cari nama atau jabatan..." 
                      value={penerbitSearchTerm}
                      onValueChange={setPenerbitSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>Tidak ada pejabat ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {filteredPenerbit.map(emp => (
                          <CommandItem
                            key={emp.id}
                            onSelect={() => {
                              setFormData({...formData, pejabat_unit_penerbit_id: emp.id});
                              setPenerbitOpen(false);
                            }}
                          >
                            {toProperCase(emp.nm_pegawai)} - {toProperCase(emp.uraian_jabatan)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pejabat PLH *</Label>
            <p className="text-sm italic text-muted-foreground">Pilih 1 pejabat yang akan menjadi PLH (selain pelaksana dan pemeriksa)</p>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIP, pangkat, atau jabatan..."
                value={employeeSearchTerm}
                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <RadioGroup value={formData.employee_id} onValueChange={(v) => setFormData({...formData, employee_id: v})}>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {filteredEmployees.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Tidak ada pegawai yang sesuai dengan pencarian
                  </p>
                ) : (
                  filteredEmployees.map(emp => (
                    <div key={emp.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={emp.id} id={emp.id} />
                      <label htmlFor={emp.id} className="text-sm cursor-pointer flex-1">
                        {toProperCase(emp.nm_pegawai)} - {emp.nip?.trim() || 'N/A'} - {toProperCase(emp.uraian_pangkat)} - {toProperCase(emp.uraian_jabatan)}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.tanggal_plh_mulai ? format(formData.tanggal_plh_mulai, "dd MMMM yyyy", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.tanggal_plh_mulai || undefined}
                    onSelect={(date) => setFormData({...formData, tanggal_plh_mulai: date || null})}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Selesai</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.tanggal_plh_selesai ? format(formData.tanggal_plh_selesai, "dd MMMM yyyy", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.tanggal_plh_selesai || undefined}
                    onSelect={(date) => setFormData({...formData, tanggal_plh_selesai: date || null})}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4 flex-shrink-0 bg-background">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
