import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputWithVoice } from "@/components/ui/input-with-voice";
import { TextareaWithVoice } from "@/components/ui/textarea-with-voice";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, Archive, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { toProperCase } from "@/lib/utils";
import { z } from "zod";
import { validateFileSizeWithToast, MAX_FILE_SIZE_KB } from "@/utils/fileValidation";

interface Employee {
  id: string;
  nm_pegawai: string;
  uraian_pangkat: string;
  uraian_jabatan: string;
  nm_unit_organisasi: string;
}

interface Assignment {
  id?: string;
  agenda_number: number;
  unit_pemohon: string;
  unit_penerbit: string;
  dasar_penugasan: string;
  nomor_naskah_dinas: string;
  tanggal_naskah: string;
  perihal: string;
  employee_ids: string[];
  tujuan: string;
  tanggal_mulai_kegiatan?: string;
  tanggal_selesai_kegiatan?: string;
  waktu_penugasan: string;
  lokasi_penugasan_detail: string;
  tempat_penugasan: string;
  pejabat_unit_pemohon_id: string;
  pejabat_unit_penerbit_id: string;
  nota_dinas_downloaded?: boolean;
  surat_tugas_downloaded?: boolean;
  sumber?: string;
  sumber_satuan_kerja?: string;
  sumber_satuan_kerja_custom?: string;
  jenis_penugasan?: string;
  document_path?: string;
  konsep_masuk_at?: string;
  konsep_masuk_by?: string;
  selesai_at?: string;
  selesai_by?: string;
  assigned_upk_id?: string;
  assigned_upk_at?: string;
  verifikasi_keuangan_at?: string;
  verifikasi_keuangan_by?: string;
  verifikasi_keuangan_status?: string;
}

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment | null;
  onSuccess: () => void;
}

const UNIT_OPTIONS = [
  "Kepala Kantor Wilayah DJBC Jawa Timur I",
  "Kepala Bagian Umum",
  "Kepala Bidang Kepabeanan dan Cukai",
  "Kepala Bidang Fasilitas Kepabeanan dan Cukai",
  "Kepala Bidang Penindakan dan Penyidikan",
  "Kepala Bidang Kepatuhan Internal",
  "Fungsional PBC Ahli Madya Sub Unsur Keberatan dan Banding",
  "Fungsional PBC Ahli Madya Sub Unsur Audit Kepabeanan dan Cukai",
  "Ketua BAPORS"
];

const CITY_OPTIONS = [
  "Sidoarjo",
  "Surabaya",
  "Gresik",
  "Pasuruan",
  "Bojonegoro",
  "Madura",
  "Malang",
  "Lamongan",
  "Lain-lain"
];

const assignmentSchema = z.object({
  unit_pemohon: z.string().trim().min(1, "Unit pemohon wajib diisi"),
  unit_penerbit: z.string().trim().min(1, "Unit penerbit wajib diisi"),
  dasar_penugasan: z.string().trim().min(1, "Dasar penugasan wajib diisi").max(500, "Dasar penugasan maksimal 500 karakter"),
  nomor_naskah_dinas: z.string().trim().max(100, "Nomor naskah dinas maksimal 100 karakter").optional(),
  perihal: z.string().trim().max(500, "Perihal maksimal 500 karakter").optional(),
  employee_ids: z.array(z.string()), // Allow empty if manual employees exist
  tujuan: z.string().trim().min(1, "Tujuan wajib diisi").max(500, "Tujuan maksimal 500 karakter"),
  waktu_penugasan: z.string().trim().max(200, "Waktu penugasan maksimal 200 karakter").optional(),
  lokasi_penugasan_detail: z.string().max(500, "Lokasi penugasan maksimal 500 karakter").optional(),
  tempat_penugasan: z.string().optional(),
  pejabat_unit_pemohon_id: z.string().min(1, "Pejabat unit pemohon wajib dipilih"),
  pejabat_unit_penerbit_id: z.string().min(1, "Pejabat unit penerbit wajib dipilih"),
  sumber: z.string().optional(),
  sumber_satuan_kerja: z.string().optional(),
  sumber_satuan_kerja_custom: z.string().optional(),
  jenis_penugasan: z.string().optional(),
  manual_employees_count: z.number().optional(), // For validation
});

function AuditDraftPrompt({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);

  if (answer === "yes") {
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-4">
        <p className="text-sm font-medium text-green-800">
          ✅ Draft Konsep Naskah Dinas Audit sudah siap. Silakan lanjutkan pengisian Konsideran di bawah.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3">
      <p className="text-sm font-semibold text-amber-900">
        Apakah sudah melakukan draft Konsep Naskah Dinas Audit?
      </p>
      <div className="flex gap-3">
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => setAnswer("yes")}
        >
          Ya, Sudah
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            onClose();
            navigate("/surat-tugas?tab=audit");
          }}
        >
          Belum, Buat Draft
        </Button>
      </div>
    </div>
  );
}

export default function AssignmentDialog({ open, onOpenChange, assignment, onSuccess }: AssignmentDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [employeeUnitFilter, setEmployeeUnitFilter] = useState("");
  const [employeeJabatanFilter, setEmployeeJabatanFilter] = useState("");
  const [unitSearchTerm, setUnitSearchTerm] = useState("");
  const [jabatanSearchTerm, setJabatanSearchTerm] = useState("");
  const [signingOfficialSearchTerm, setSigningOfficialSearchTerm] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedKonsepFile, setUploadedKonsepFile] = useState<File | null>(null);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [customLocation, setCustomLocation] = useState("");
  const [manualEmployees, setManualEmployees] = useState<{ nama: string; pangkat: string; jabatan: string; }[]>([]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [formData, setFormData] = useState({
    unit_pemohon: "",
    unit_penerbit: "",
    dasar_penugasan: "",
    nomor_naskah_dinas: "",
    tanggal_naskah: new Date(),
    perihal: "",
    employee_ids: [] as string[],
    tujuan: "",
    tanggal_mulai_kegiatan: new Date(),
    tanggal_selesai_kegiatan: new Date(),
    waktu_penugasan: "",
    lokasi_penugasan_detail: "",
    tempat_penugasan: "",
    pejabat_unit_pemohon_id: "",
    pejabat_unit_penerbit_id: "",
    is_funded: "" as "" | "dibiayai" | "tidak_dibiayai",
    sumber: "",
    sumber_satuan_kerja: "",
    sumber_satuan_kerja_custom: "",
    sumber_satuan_kerja_category: "",
    non_dipa_category: "" as "" | "DBHCHT" | "lain-lain",
    non_dipa_custom: "",
    jenis_penugasan: "",
    document_path: "",
    konsep_path: ""
  });

  useEffect(() => {
    if (open) {
      fetchEmployees();
      if (assignment) {
        // Parse existing tempat_penugasan to selectedCities
        const existingCities = assignment.tempat_penugasan ? assignment.tempat_penugasan.split(", ") : [];
        const predefinedCities = CITY_OPTIONS.filter(c => c !== "Lain-lain");
        const matchedCities = existingCities.filter(c => predefinedCities.includes(c));
        const customCities = existingCities.filter(c => !predefinedCities.includes(c));
        
        if (customCities.length > 0) {
          setSelectedCities([...matchedCities, "Lain-lain"]);
          setCustomLocation(customCities.join(", "));
        } else {
          setSelectedCities(matchedCities);
          setCustomLocation("");
        }
        
        // Determine sumber_satuan_kerja_category based on saved sumber_satuan_kerja
        const savedSumberSatker = (assignment as any).sumber_satuan_kerja || "";
        const savedSumberSatkerCustom = (assignment as any).sumber_satuan_kerja_custom || "";
        let determinedCategory = "";
        
        if ((assignment as any).sumber === "DIPA") {
          if (savedSumberSatker === "Kanwil DJBC Jatim I" || 
              savedSumberSatker.startsWith("KPPBC") || 
              savedSumberSatker === "BLBC Kelas II Surabaya") {
            determinedCategory = "Kanwil DJBC Jawa Timur I";
          } else if (savedSumberSatker.includes("Sekretariat") || savedSumberSatker.includes("Direktorat")) {
            determinedCategory = "Kantor Pusat";
          } else if (savedSumberSatkerCustom) {
            determinedCategory = "Lain-lain";
          }
        }
        
        // Determine non_dipa_category based on saved sumber_satuan_kerja
        let nonDipaCategory: "" | "DBHCHT" | "lain-lain" = "";
        let nonDipaCustom = "";
        
        if ((assignment as any).sumber === "Non DIPA") {
          if (savedSumberSatker === "DBHCHT") {
            nonDipaCategory = "DBHCHT";
          } else if (savedSumberSatkerCustom) {
            nonDipaCategory = "lain-lain";
            nonDipaCustom = savedSumberSatkerCustom;
          }
        }
        
        // Load manual employees from assignment
        const savedManualEmployees = (assignment as any).manual_employees;
        if (savedManualEmployees && Array.isArray(savedManualEmployees) && savedManualEmployees.length > 0) {
          setManualEmployees(savedManualEmployees);
          setShowManualEntry(true);
        } else {
          setManualEmployees([]);
          setShowManualEntry(false);
        }
        
        setFormData({
          unit_pemohon: assignment.unit_pemohon,
          unit_penerbit: assignment.unit_penerbit,
          dasar_penugasan: assignment.dasar_penugasan,
          nomor_naskah_dinas: assignment.nomor_naskah_dinas || "",
          tanggal_naskah: new Date(assignment.tanggal_naskah),
          perihal: assignment.perihal || "",
          employee_ids: assignment.employee_ids,
          tujuan: assignment.tujuan,
          tanggal_mulai_kegiatan: assignment.tanggal_mulai_kegiatan ? new Date(assignment.tanggal_mulai_kegiatan) : new Date(),
          tanggal_selesai_kegiatan: assignment.tanggal_selesai_kegiatan ? new Date(assignment.tanggal_selesai_kegiatan) : new Date(),
          waktu_penugasan: assignment.waktu_penugasan,
          lokasi_penugasan_detail: assignment.lokasi_penugasan_detail || "",
          tempat_penugasan: assignment.tempat_penugasan,
          pejabat_unit_pemohon_id: assignment.pejabat_unit_pemohon_id,
          pejabat_unit_penerbit_id: assignment.pejabat_unit_penerbit_id,
          is_funded: (assignment as any).sumber ? "dibiayai" : "",
          sumber: (assignment as any).sumber || "",
          sumber_satuan_kerja: savedSumberSatker,
          sumber_satuan_kerja_custom: savedSumberSatkerCustom,
          sumber_satuan_kerja_category: determinedCategory,
          non_dipa_category: nonDipaCategory,
          non_dipa_custom: nonDipaCustom,
          jenis_penugasan: (assignment as any).jenis_penugasan || "",
          document_path: assignment.document_path || "",
          konsep_path: (assignment as any).konsep_path || ""
        });
      } else {
        resetForm();
      }
    }
  }, [open, assignment]);

  // Auto-set sumber to Non DIPA when unit_penerbit is not Kepala Kantor Wilayah
  useEffect(() => {
    if (formData.unit_penerbit && formData.unit_penerbit !== "Kepala Kantor Wilayah DJBC Jawa Timur I") {
      if (formData.sumber !== "Non DIPA") {
        setFormData(prev => ({
          ...prev,
          sumber: "Non DIPA",
          sumber_satuan_kerja_category: "",
          sumber_satuan_kerja: "",
          sumber_satuan_kerja_custom: ""
        }));
      }
    }
  }, [formData.unit_penerbit]);

  const fetchEmployees = async () => {
    // Fetch all employees without limit
    let allEmployees: Employee[] = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from("employees")
        .select("id, nm_pegawai, uraian_pangkat, uraian_jabatan, nm_unit_organisasi")
        .order("nm_pegawai")
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) break;
      if (!data || data.length === 0) break;
      
      allEmployees = [...allEmployees, ...data];
      
      if (data.length < pageSize) break;
      page++;
    }
    
    setEmployees(allEmployees);
  };

  const resetForm = () => {
    setFormData({
      unit_pemohon: "",
      unit_penerbit: "",
      dasar_penugasan: "",
      nomor_naskah_dinas: "",
      tanggal_naskah: new Date(),
      perihal: "",
      employee_ids: [],
      tujuan: "",
      tanggal_mulai_kegiatan: new Date(),
      tanggal_selesai_kegiatan: new Date(),
      waktu_penugasan: "",
      lokasi_penugasan_detail: "",
      tempat_penugasan: "",
      pejabat_unit_pemohon_id: "",
      pejabat_unit_penerbit_id: "",
      is_funded: "",
      sumber: "",
      sumber_satuan_kerja: "",
      sumber_satuan_kerja_custom: "",
      sumber_satuan_kerja_category: "",
      non_dipa_category: "",
      non_dipa_custom: "",
      jenis_penugasan: "",
      document_path: "",
      konsep_path: ""
    });
    setSelectedCities([]);
    setCustomLocation("");
    setUploadedFile(null);
    setUploadedKonsepFile(null);
    setManualEmployees([]);
    setShowManualEntry(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 600KB)
      if (!validateFileSizeWithToast(file)) {
        e.target.value = "";
        return;
      }
      if (file.type !== "application/pdf") {
        toast.error("Hanya file PDF yang diizinkan");
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleKonsepFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 600KB)
      if (!validateFileSizeWithToast(file)) {
        e.target.value = "";
        return;
      }
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel", // .xls
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/msword" // .doc
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Hanya file Excel (.xlsx, .xls) atau Word (.docx, .doc) yang diizinkan");
        return;
      }
      setUploadedKonsepFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Comprehensive required field validation
      const validationErrors: string[] = [];

      // 1. Unit Pemohon
      if (!formData.unit_pemohon) {
        validationErrors.push("Unit Pemohon wajib diisi");
      }

      // 2. Unit Penerbit
      if (!formData.unit_penerbit) {
        validationErrors.push("Unit Penerbit wajib diisi");
      }

      // 3. Dasar Penugasan
      if (!formData.dasar_penugasan || formData.dasar_penugasan.trim() === "") {
        validationErrors.push("Dasar Penugasan wajib diisi");
      }

      // 4. Identitas Pegawai (at least one employee from database or manual)
      const totalEmployees = formData.employee_ids.length + manualEmployees.length;
      if (totalEmployees === 0) {
        validationErrors.push("Minimal 1 pegawai harus dipilih atau ditambahkan secara manual");
      }

      // 5. Tujuan Penugasan
      if (!formData.tujuan || formData.tujuan.trim() === "") {
        validationErrors.push("Tujuan Penugasan wajib diisi");
      }

      // 6. Jenis Penugasan
      if (!formData.jenis_penugasan) {
        validationErrors.push("Jenis Penugasan wajib dipilih");
      }

      // 7. Opsi Pembiayaan
      if (!formData.is_funded) {
        validationErrors.push("Opsi Pembiayaan wajib dipilih");
      }

      // 8. Pejabat Unit Pemohon
      if (!formData.pejabat_unit_pemohon_id) {
        validationErrors.push("Pejabat Unit Pemohon wajib dipilih");
      }

      // 9. Pejabat Unit Penerbit
      if (!formData.pejabat_unit_penerbit_id) {
        validationErrors.push("Pejabat Unit Penerbit wajib dipilih");
      }

      // Conditional validations based on selections
      // 10. When Luar Kantor is selected
      if (formData.jenis_penugasan === "Luar Kantor") {
        // Lokasi Penugasan
        if (!formData.lokasi_penugasan_detail || formData.lokasi_penugasan_detail.trim() === "") {
          validationErrors.push("Lokasi Penugasan wajib diisi untuk penugasan Luar Kantor");
        }
        // Kota/Kabupaten
        if (selectedCities.length === 0) {
          validationErrors.push("Kota/Kabupaten wajib dipilih untuk penugasan Luar Kantor");
        }
        // Custom location validation when Lain-lain is selected
        if (selectedCities.includes("Lain-lain") && (!customLocation || customLocation.trim() === "")) {
          validationErrors.push("Lokasi Lain-lain wajib diisi");
        }
      }

      // 11. When Dibiayai is selected
      if (formData.is_funded === "dibiayai") {
        if (!formData.sumber) {
          validationErrors.push("Sumber wajib dipilih");
        }

        // When DIPA is selected
        if (formData.sumber === "DIPA") {
          if (!formData.sumber_satuan_kerja_category) {
            validationErrors.push("Sumber Dana wajib dipilih");
          }
          // When specific category is selected
          if (formData.sumber_satuan_kerja_category === "Kanwil DJBC Jawa Timur I" && !formData.sumber_satuan_kerja) {
            validationErrors.push("Pilihan Kantor wajib dipilih");
          }
          if (formData.sumber_satuan_kerja_category === "Kantor Pusat" && !formData.sumber_satuan_kerja) {
            validationErrors.push("Pilihan Direktorat wajib dipilih");
          }
          if (formData.sumber_satuan_kerja_category === "Lain-lain" && (!formData.sumber_satuan_kerja_custom || formData.sumber_satuan_kerja_custom.trim() === "")) {
            validationErrors.push("Nama Kantor Lain-lain wajib diisi");
          }
        }

        // When Non DIPA is selected
        if (formData.sumber === "Non DIPA") {
          if (!formData.non_dipa_category) {
            validationErrors.push("Kategori Non DIPA wajib dipilih");
          }
          if (formData.non_dipa_category === "lain-lain" && (!formData.non_dipa_custom || formData.non_dipa_custom.trim() === "")) {
            validationErrors.push("Keterangan Lain-lain Non DIPA wajib diisi");
          }
        }
      }

      // If there are validation errors, show them and stop
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]);
        setLoading(false);
        return;
      }

      // Get user email
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || "Unknown";

      let documentPath = formData.document_path;
      let konsepPath = formData.konsep_path;

      // Upload file if new file is selected
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('assignment-documents')
          .upload(filePath, uploadedFile);

        if (uploadError) throw uploadError;
        documentPath = filePath;
      }

      // Upload konsep file if new file is selected
      if (uploadedKonsepFile) {
        const fileExt = uploadedKonsepFile.name.split('.').pop();
        const fileName = `konsep-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('konsep-documents')
          .upload(filePath, uploadedKonsepFile);

        if (uploadError) throw uploadError;
        konsepPath = filePath;
      }

      // Check for duplicate assignments on the same date
      const { data: existingAssignments } = await supabase
        .from("assignments")
        .select("*")
        .eq("tanggal_mulai_kegiatan", format(formData.tanggal_mulai_kegiatan, "yyyy-MM-dd"));

      if (existingAssignments && existingAssignments.length > 0) {
        const duplicateEmployees = new Set<string>();
        existingAssignments.forEach(existing => {
          if (assignment && existing.id === assignment.id) return; // Skip current assignment when editing
          
          const overlap = formData.employee_ids.filter(empId => 
            existing.employee_ids.includes(empId)
          );
          overlap.forEach(empId => duplicateEmployees.add(empId));
        });

        if (duplicateEmployees.size > 0) {
          const duplicateNames = Array.from(duplicateEmployees)
            .map(id => employees.find(emp => emp.id === id)?.nm_pegawai)
            .filter(Boolean)
            .join(", ");
          
          toast.warning(
            `⚠️ Penugasan Ganda Terdeteksi: ${duplicateNames} sudah memiliki penugasan lain pada tanggal ${format(formData.tanggal_mulai_kegiatan, "dd MMMM yyyy", { locale: id })}`,
            { duration: 8000 }
          );

          // Create notification for ALL admins about duplicate assignment warning
          try {
            const { data: profiles } = await (supabase as any).from("profiles").select("user_id, email").eq("role", "admin");
            
            if (profiles && profiles.length > 0) {
              const notificationsList = profiles.map((p: { user_id: string; email: string }) => ({
                user_id: p.user_id,
                title: "⚠️ Penugasan Ganda Terdeteksi",
                message: `${duplicateNames} memiliki lebih dari 1 penugasan pada tanggal ${format(formData.tanggal_mulai_kegiatan, "dd MMMM yyyy", { locale: id })}. Mohon dipastikan tidak ada bentrokan jadwal.`,
                assignment_id: null,
                is_read: false,
              }));
              
              await supabase.from("notifications").insert(notificationsList);
            }
          } catch (notifError) {
            console.error("Error sending notifications:", notifError);
          }
        }
      }

      let agendaNumber = assignment?.agenda_number;
      
      if (!assignment) {
        const { data: maxData } = await supabase
          .from("assignments")
          .select("agenda_number")
          .order("agenda_number", { ascending: false })
          .limit(1)
          .single();
        
        agendaNumber = (maxData?.agenda_number || 0) + 1;
      }

      // Combine selected cities for tempat_penugasan
      const citiesWithoutLainLain = selectedCities.filter(c => c !== "Lain-lain");
      const combinedCities = selectedCities.includes("Lain-lain") && customLocation
        ? [...citiesWithoutLainLain, customLocation].join(", ")
        : citiesWithoutLainLain.join(", ");

      const payload = {
        agenda_number: agendaNumber,
        unit_pemohon: formData.unit_pemohon,
        unit_penerbit: formData.unit_penerbit,
        dasar_penugasan: formData.dasar_penugasan,
        nomor_naskah_dinas: formData.nomor_naskah_dinas || "",
        tanggal_naskah: format(formData.tanggal_naskah, "yyyy-MM-dd"),
        perihal: formData.perihal || "",
        employee_ids: formData.employee_ids,
        tujuan: formData.tujuan,
        tanggal_mulai_kegiatan: format(formData.tanggal_mulai_kegiatan, "yyyy-MM-dd"),
        tanggal_selesai_kegiatan: format(formData.tanggal_selesai_kegiatan, "yyyy-MM-dd"),
        waktu_penugasan: formData.waktu_penugasan,
        lokasi_penugasan_detail: formData.lokasi_penugasan_detail,
        tempat_penugasan: combinedCities || formData.tempat_penugasan || "-",
        pejabat_unit_pemohon_id: formData.pejabat_unit_pemohon_id,
        pejabat_unit_penerbit_id: formData.pejabat_unit_penerbit_id,
        sumber: formData.sumber,
        // For Non DIPA, store the category (DBHCHT or custom) in sumber_satuan_kerja
        sumber_satuan_kerja: formData.sumber === "Non DIPA" 
          ? (formData.non_dipa_category === "DBHCHT" ? "DBHCHT" : "")
          : (formData.sumber_satuan_kerja_category === "Lain-lain" 
              ? formData.sumber_satuan_kerja_custom 
              : formData.sumber_satuan_kerja),
        // For Non DIPA with lain-lain, store the custom text
        sumber_satuan_kerja_custom: formData.sumber === "Non DIPA" 
          ? (formData.non_dipa_category === "lain-lain" ? formData.non_dipa_custom : "")
          : formData.sumber_satuan_kerja_custom,
        jenis_penugasan: formData.jenis_penugasan,
        document_path: documentPath,
        konsep_path: konsepPath,
        created_by_email: assignment ? undefined : userEmail,
        updated_by_email: assignment ? userEmail : undefined,
        konsep_masuk_at: assignment?.konsep_masuk_at || new Date().toISOString(),
        konsep_masuk_by: assignment?.konsep_masuk_by || userEmail,
        manual_employees: manualEmployees.length > 0 ? manualEmployees : []
      } as any;

      // Auto-verification logic: 
      // If NOT (sumber === "DIPA" AND sumber_satuan_kerja === "Kanwil DJBC Jatim I"), auto-verify
      const actualSumberSatker = formData.sumber_satuan_kerja_category === "Lain-lain" 
        ? formData.sumber_satuan_kerja_custom 
        : formData.sumber_satuan_kerja;
      
      const requiresManualVerification = 
        formData.sumber === "DIPA" && actualSumberSatker === "Kanwil DJBC Jatim I";
      
      // Helper function to assign manual verifikator
      const assignManualVerifikator = async () => {
        try {
          const { data: keuanganMembers } = await supabase
            .from("tim_keuangan")
            .select("*")
            .order("name", { ascending: true });
          
          if (keuanganMembers && keuanganMembers.length > 0) {
            const freesia = keuanganMembers.find(k => k.name === "Freesia Putri Erwana");
            const hidayatul = keuanganMembers.find(k => k.name === "Hidayatul Lisnaini");
            
            let selectedVerifikator = freesia;
            if (freesia) {
              const { data: freesiaProfile } = await supabase
                .from("profiles")
                .select("user_status")
                .eq("email", freesia.email)
                .maybeSingle();
              
              if (freesiaProfile?.user_status === "away" && hidayatul) {
                selectedVerifikator = hidayatul;
              }
            } else if (hidayatul) {
              selectedVerifikator = hidayatul;
            } else {
              selectedVerifikator = keuanganMembers.sort((a, b) => 
                (a.assignment_count || 0) - (b.assignment_count || 0)
              )[0];
            }
            
            if (selectedVerifikator) {
              payload.verifikasi_keuangan_by = `${selectedVerifikator.name} (${selectedVerifikator.email})`;
              payload.verifikasi_keuangan_status = "pending";
              // Clear auto verification data
              payload.verifikasi_keuangan_at = null;
              
              await supabase
                .from("tim_keuangan")
                .update({
                  assignment_count: (selectedVerifikator.assignment_count || 0) + 1,
                  last_assigned_at: new Date().toISOString()
                })
                .eq("id", selectedVerifikator.id);
            }
          }
        } catch (keuanganError) {
          console.error("Error auto-assigning Tim Keuangan:", keuanganError);
        }
      };
      
      // For new assignments
      if (!assignment) {
        if (!requiresManualVerification) {
          // Auto-verify
          payload.verifikasi_keuangan_at = new Date().toISOString();
          payload.verifikasi_keuangan_by = "Auto System";
          payload.verifikasi_keuangan_status = "approved";
        } else {
          // Requires manual verification
          await assignManualVerifikator();
        }
      } else {
        // UPDATING existing assignment
        // Check if the sumber changed from non-Kanwil to Kanwil DJBC Jatim I
        const previousSumberSatker = assignment.sumber_satuan_kerja;
        const previousWasAutoVerified = assignment.verifikasi_keuangan_by === "Auto System";
        
        if (requiresManualVerification && previousWasAutoVerified) {
          // Was previously auto-verified (non-Kanwil DIPA), now changed to Kanwil DJBC Jatim I
          // Reset to manual verification
          await assignManualVerifikator();
        } else if (!assignment.verifikasi_keuangan_at) {
          // Assignment hasn't been verified yet
          if (!requiresManualVerification) {
            // Auto-verify
            payload.verifikasi_keuangan_at = new Date().toISOString();
            payload.verifikasi_keuangan_by = "Auto System";
            payload.verifikasi_keuangan_status = "approved";
          } else if (!assignment.verifikasi_keuangan_by) {
            // Needs manual verification but no verifier assigned yet
            await assignManualVerifikator();
          }
        }
      }

      if (assignment) {
        const { error } = await supabase
          .from("assignments")
          .update(payload)
          .eq("id", assignment.id);
        if (error) throw error;
        
        // Send email notification for update
        try {
          await supabase.functions.invoke("send-assignment-email", {
            body: {
              action: "updated",
              agendaNumber,
              perihal: formData.perihal,
              createdBy: userEmail,
              nomorNaskahDinas: formData.nomor_naskah_dinas
            }
          });
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }
        
        toast.success("Data penugasan berhasil diperbarui!");
      } else {
        const { data: insertedData, error } = await supabase
          .from("assignments")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        
        // Create notification for the user with reminder about LPT
        if (user && insertedData) {
          await supabase.from("notifications").insert([{
            user_id: user.id,
            title: "Penugasan Baru Dibuat - Konsep Masuk",
            message: `Penugasan baru dengan perihal "${formData.perihal}" telah berhasil dibuat untuk ${formData.employee_ids.length} pegawai. Untuk segera melaporkan Laporan Pelaksanaan Tugas Maksimal 10 hari sejak pelaksanaan ST.`,
            assignment_id: insertedData.id,
          }]);
        }
        
        // Send email notification for new assignment
        try {
          await supabase.functions.invoke("send-assignment-email", {
            body: {
              action: "created",
              agendaNumber,
              perihal: formData.perihal,
              createdBy: userEmail,
              nomorNaskahDinas: formData.nomor_naskah_dinas
            }
          });
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }
        
        toast.success("Data penugasan berhasil ditambahkan!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!assignment) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || "Unknown";
      
      await supabase
        .from("assignments")
        .update({
          selesai_at: new Date().toISOString(),
          selesai_by: userEmail,
        })
        .eq("id", assignment.id);
      
      toast.success("Data berhasil diarsipkan!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal mengarsipkan data");
    }
  };

  const toggleEmployee = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      employee_ids: prev.employee_ids.includes(employeeId)
        ? prev.employee_ids.filter(id => id !== employeeId)
        : [...prev.employee_ids, employeeId]
    }));
  };

  const filteredEmployees = employees.filter(emp => {
    const searchMatch = emp.nm_pegawai.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      emp.uraian_jabatan.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      emp.uraian_pangkat.toLowerCase().includes(employeeSearchTerm.toLowerCase());
    
    const unitMatch = !employeeUnitFilter || emp.nm_unit_organisasi.toLowerCase().includes(employeeUnitFilter.toLowerCase());
    const jabatanMatch = !employeeJabatanFilter || emp.uraian_jabatan.toLowerCase().includes(employeeJabatanFilter.toLowerCase());
    
    return searchMatch && unitMatch && jabatanMatch;
  });

  // Get unique units based on current jabatan filter
  const filteredUnitsForJabatan = employeeJabatanFilter 
    ? Array.from(new Set(employees
        .filter(emp => emp.uraian_jabatan.toLowerCase().includes(employeeJabatanFilter.toLowerCase()))
        .map(emp => emp.nm_unit_organisasi)))
        .sort()
    : Array.from(new Set(employees.map(emp => emp.nm_unit_organisasi))).sort();

  // Get unique jabatan based on current unit filter
  const filteredJabatanForUnit = employeeUnitFilter 
    ? Array.from(new Set(employees
        .filter(emp => emp.nm_unit_organisasi.toLowerCase().includes(employeeUnitFilter.toLowerCase()))
        .map(emp => emp.uraian_jabatan)))
        .sort()
    : Array.from(new Set(employees.map(emp => emp.uraian_jabatan))).sort();

  // Filter units based on search term
  const searchedUnits = filteredUnitsForJabatan.filter(unit => 
    unit.toLowerCase().includes(unitSearchTerm.toLowerCase())
  );

  // Filter jabatan based on search term
  const searchedJabatan = filteredJabatanForUnit.filter(jabatan => 
    jabatan.toLowerCase().includes(jabatanSearchTerm.toLowerCase())
  );

  // Show all employees for pejabat unit pemohon/penerbit (1323 employees total)
  // All employees are already fetched with pagination in fetchEmployees()
  const filteredSigningOfficials = employees.filter((emp) => {
    const searchMatch = 
      emp.nm_pegawai.toLowerCase().includes(signingOfficialSearchTerm.toLowerCase()) ||
      emp.uraian_jabatan.toLowerCase().includes(signingOfficialSearchTerm.toLowerCase());
    
    return searchMatch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[100dvh] max-h-[100dvh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-4 pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>{assignment ? "Edit Data Penugasan" : "Data Penugasan Baru"}</DialogTitle>
            {assignment && assignment.konsep_masuk_at && !assignment.selesai_at && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleArchive}
                title="Arsipkan"
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>
        <form id="assignment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-3 space-y-3">
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
                  <SelectItem key="Kepala Kantor Wilayah DJBC Jawa Timur I" value="Kepala Kantor Wilayah DJBC Jawa Timur I">
                    Kepala Kantor Wilayah DJBC Jawa Timur I
                  </SelectItem>
                  <SelectItem key="Kepala Bidang Penindakan dan Penyidikan" value="Kepala Bidang Penindakan dan Penyidikan">
                    Kepala Bidang Penindakan dan Penyidikan
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Audit Draft Prompt - shown when unit_pemohon is Audit */}
           {formData.unit_pemohon === "Fungsional PBC Ahli Madya Sub Unsur Audit Kepabeanan dan Cukai" && (
            <AuditDraftPrompt onClose={() => onOpenChange(false)} />
          )}

          <div className="space-y-2">
            <Label className="text-base font-semibold">Konsideran</Label>
            <div className="space-y-3 pl-4">
              <div className="space-y-2">
                <Label>Dasar Penugasan *</Label>
                <p className="text-sm text-muted-foreground italic">
                  1. Tuliskan Nomor, Tanggal, dan Hal Dokumen Dasar Diperlukannya Penugasan. Contoh : Undangan Kepala Badan Penerimaan Negara nomor UND-01/BPD/2025 tanggal 10 November 2025 hal Kunjungan Lapangan; <strong>atau</strong><br />
                  2. Hal Kedinasan lainnya sehingga diperlukan adanya penugasan. Contoh : Dalam rangka kunjungan kerja menteri keuangan
                </p>
                <TextareaWithVoice
                  value={formData.dasar_penugasan}
                  onChange={(e) => setFormData({...formData, dasar_penugasan: e.target.value})}
                  required
                />
              </div>
              <div className="border rounded-lg p-4 space-y-3">
                <p className="text-sm text-muted-foreground italic -mt-1">
                  Tuliskan Nomor, tanggal, hal Nota Dinas Masing masing bidang/unit terkait Permohonan Penerbitan ST. Apabila tidak ada Naskah Dinas, Nomor Naskah Dinas diisi "-" Tanggal & Perihal diisi sesuai Konsideran Awal
                </p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Perihal</Label>
                    <InputWithVoice
                      value={formData.perihal}
                      onChange={(e) => setFormData({...formData, perihal: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nomor Naskah Dinas</Label>
                      <InputWithVoice
                        value={formData.nomor_naskah_dinas}
                        onChange={(e) => setFormData({...formData, nomor_naskah_dinas: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(formData.tanggal_naskah, "dd MMMM yyyy", { locale: id })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.tanggal_naskah}
                            onSelect={(date) => date && setFormData({...formData, tanggal_naskah: date})}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Upload Dokumen PDF (Opsional, maks {MAX_FILE_SIZE_KB} KB)</Label>
                <p className="text-sm text-muted-foreground italic">Upload Dokumen Pendukung atas Permohonan ST</p>
                <p className="text-sm text-orange-600 font-medium">⚠️ WAJIB dicantumkan khusus apabila Konsideran dari Eksternal</p>
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

          <div className="space-y-2">
            <Label>Identitas Pegawai yang Ditugaskan *</Label>
            
            {/* Toggle between Existing and Manual entry */}
            <div className="flex gap-2 mb-3">
              <Button
                type="button"
                variant={!showManualEntry ? "default" : "outline"}
                size="sm"
                onClick={() => setShowManualEntry(false)}
              >
                Pilih dari Database
              </Button>
              <Button
                type="button"
                variant={showManualEntry ? "default" : "outline"}
                size="sm"
                onClick={() => setShowManualEntry(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Pengisian Manual
              </Button>
            </div>

            {/* Manual Entry Section */}
            {showManualEntry && (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <Label className="text-sm font-medium">Tambah Pegawai Manual</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Nama Lengkap</Label>
                    <Input
                      id="manual-nama"
                      placeholder="Nama lengkap..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Pangkat/Gol</Label>
                    <Input
                      id="manual-pangkat"
                      placeholder="Contoh: Penata Muda Tk.I (III/b)"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Jabatan</Label>
                    <Input
                      id="manual-jabatan"
                      placeholder="Jabatan..."
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const namaInput = document.getElementById("manual-nama") as HTMLInputElement;
                    const pangkatInput = document.getElementById("manual-pangkat") as HTMLInputElement;
                    const jabatanInput = document.getElementById("manual-jabatan") as HTMLInputElement;
                    
                    const nama = namaInput?.value?.trim();
                    const pangkat = pangkatInput?.value?.trim();
                    const jabatan = jabatanInput?.value?.trim();
                    
                    if (!nama) {
                      toast.error("Nama lengkap wajib diisi");
                      return;
                    }
                    
                    setManualEmployees(prev => [...prev, { nama, pangkat: pangkat || "-", jabatan: jabatan || "-" }]);
                    
                    // Clear inputs
                    if (namaInput) namaInput.value = "";
                    if (pangkatInput) pangkatInput.value = "";
                    if (jabatanInput) jabatanInput.value = "";
                    
                    toast.success(`${nama} ditambahkan ke daftar`);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Tambahkan
                </Button>
              </div>
            )}

            {/* Existing Employee Selection */}
            {!showManualEntry && (
              <>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-[50%] -translate-y-[52%] h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Cari nama, pangkat, atau jabatan..."
                      value={employeeSearchTerm}
                      onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        placeholder="Cari unit..."
                        value={unitSearchTerm}
                        onChange={(e) => setUnitSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                    <Select value={employeeUnitFilter} onValueChange={setEmployeeUnitFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter Unit Organisasi" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] max-w-[500px]">
                        <SelectItem value=" ">Semua Unit</SelectItem>
                        {searchedUnits.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        placeholder="Cari jabatan..."
                        value={jabatanSearchTerm}
                        onChange={(e) => setJabatanSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                    <Select value={employeeJabatanFilter} onValueChange={setEmployeeJabatanFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter Jabatan" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] max-w-[500px]">
                        <SelectItem value=" ">Semua Jabatan</SelectItem>
                        {searchedJabatan.map(jabatan => (
                          <SelectItem key={jabatan} value={jabatan}>{jabatan}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allFilteredIds = filteredEmployees.map(emp => emp.id);
                      setFormData(prev => ({
                        ...prev,
                        employee_ids: allFilteredIds
                      }));
                    }}
                  >
                    Check All ({filteredEmployees.length})
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        employee_ids: []
                      }));
                    }}
                  >
                    Unchecked
                  </Button>
                </div>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  {filteredEmployees.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Tidak ada pegawai yang sesuai dengan pencarian
                    </p>
                  ) : (
                    filteredEmployees.map(emp => (
                      <div key={emp.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.employee_ids.includes(emp.id)}
                          onCheckedChange={() => toggleEmployee(emp.id)}
                        />
                        <label className="text-sm cursor-pointer flex-1">
                          {toProperCase(emp.nm_pegawai)} - {toProperCase(emp.uraian_pangkat)} - {toProperCase(emp.uraian_jabatan)}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
            
            {/* Combined Preview - Both existing and manual employees */}
            {(formData.employee_ids.length > 0 || manualEmployees.length > 0) && (
              <div className="mt-3">
                <Label className="text-sm font-medium mb-2 block">
                  Preview Pegawai ({formData.employee_ids.length + manualEmployees.length})
                </Label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-1.5">
                  {/* Existing employees from database */}
                  {formData.employee_ids.map(empId => {
                    const emp = employees.find(e => e.id === empId);
                    if (!emp) return null;
                    return (
                      <div key={empId} className="flex items-center justify-between gap-2 p-2 bg-muted rounded text-sm">
                        <span className="flex-1 truncate">
                          {toProperCase(emp.nm_pegawai)} - {toProperCase(emp.uraian_pangkat)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => toggleEmployee(empId)}
                        >
                          ×
                        </Button>
                      </div>
                    );
                  })}
                  {/* Manual employees */}
                  {manualEmployees.map((emp, idx) => (
                    <div key={`manual-${idx}`} className="flex items-center justify-between gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm border border-blue-200 dark:border-blue-800">
                      <span className="flex-1 truncate">
                        {emp.nama} - {emp.pangkat} - {emp.jabatan}
                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Manual)</span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setManualEmployees(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tujuan Penugasan *</Label>
            <TextareaWithVoice
              value={formData.tujuan}
              onChange={(e) => setFormData({...formData, tujuan: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Periode Penugasan :</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mulai *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.tanggal_mulai_kegiatan, "dd MMMM yyyy", { locale: id })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.tanggal_mulai_kegiatan}
                      onSelect={(date) => date && setFormData({...formData, tanggal_mulai_kegiatan: date})}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Selesai *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.tanggal_selesai_kegiatan, "dd MMMM yyyy", { locale: id })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.tanggal_selesai_kegiatan}
                      onSelect={(date) => date && setFormData({...formData, tanggal_selesai_kegiatan: date})}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Waktu Penugasan</Label>
            <Input
              type="time"
              value={formData.waktu_penugasan}
              onChange={(e) => setFormData({...formData, waktu_penugasan: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>Jenis Penugasan *</Label>
            <Select 
              value={formData.jenis_penugasan} 
              onValueChange={(v) => {
                // Auto-fill with "-" for Dalam Kantor
                if (v === "Dalam Kantor") {
                  setFormData({
                    ...formData, 
                    jenis_penugasan: v,
                    tempat_penugasan: "-",
                    lokasi_penugasan_detail: "-"
                  });
                } else {
                  setFormData({...formData, jenis_penugasan: v});
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis penugasan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Luar Kantor">Luar Kantor</SelectItem>
                <SelectItem value="Dalam Kantor">Dalam Kantor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.jenis_penugasan === "Luar Kantor" && (
            <>
              <div className="space-y-2">
                <Label>Lokasi Penugasan *</Label>
                <p className="text-sm text-muted-foreground italic">
                  Tuliskan Lokasi Penugasan & Nama Tempat Penugasan. Misalkan : KPPBC TMP Tanjung Perak Jl Perak Timur 498 Kec Pabean Cantikan, Kota Surabaya, Jawa Timur
                </p>
                {/* Multi-location input - Full width like Tujuan Penugasan */}
                <div className="space-y-3">
                  {(formData.lokasi_penugasan_detail || "").split(" ; ").filter(Boolean).map((loc, index, arr) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <InputWithVoice
                          value={loc}
                          onChange={(e) => {
                            const locations = (formData.lokasi_penugasan_detail || "").split(" ; ").filter(Boolean);
                            locations[index] = e.target.value;
                            setFormData({...formData, lokasi_penugasan_detail: locations.join(" ; ")});
                          }}
                          placeholder={`Lokasi ${index + 1}`}
                          className="w-full"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                          const current = formData.lokasi_penugasan_detail || "";
                          const newValue = current ? `${current} ; ` : "";
                          setFormData({...formData, lokasi_penugasan_detail: newValue + " "});
                        }}
                      >
                        Tambah Lokasi
                      </Button>
                      {arr.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => {
                            const locations = (formData.lokasi_penugasan_detail || "").split(" ; ").filter(Boolean);
                            locations.splice(index, 1);
                            setFormData({...formData, lokasi_penugasan_detail: locations.join(" ; ")});
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {/* Initial empty input if no locations */}
                  {(!(formData.lokasi_penugasan_detail) || formData.lokasi_penugasan_detail === "") && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <InputWithVoice
                          value=""
                          onChange={(e) => {
                            setFormData({...formData, lokasi_penugasan_detail: e.target.value});
                          }}
                          placeholder="Lokasi 1"
                          className="w-full"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                          const current = formData.lokasi_penugasan_detail || "";
                          const newValue = current ? `${current} ; ` : "";
                          setFormData({...formData, lokasi_penugasan_detail: newValue + " "});
                        }}
                      >
                        Tambah Lokasi
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kota/Kabupaten *</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-x-4 gap-y-2">
                    {CITY_OPTIONS.map(city => (
                      <div key={city} className="flex items-center space-x-2">
                        <Checkbox
                          id={`city-${city}`}
                          checked={selectedCities.includes(city)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCities([...selectedCities, city]);
                            } else {
                              setSelectedCities(selectedCities.filter(c => c !== city));
                              if (city === "Lain-lain") {
                                setCustomLocation("");
                              }
                            }
                          }}
                        />
                        <label htmlFor={`city-${city}`} className="text-sm cursor-pointer">
                          {city}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedCities.includes("Lain-lain") && (
                  <div className="mt-2">
                    <Label className="text-sm">Lokasi Lain-lain</Label>
                    <Input
                      placeholder="Masukkan nama kota/kabupaten lain..."
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
                {selectedCities.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Dipilih: {selectedCities.filter(c => c !== "Lain-lain").join(", ")}
                    {selectedCities.includes("Lain-lain") && customLocation ? `, ${customLocation}` : ""}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Opsi Dibiayai / Tidak Dibiayai - OUTSIDE of Luar Kantor block */}
          <div className="space-y-2">
            <Label>Opsi Pembiayaan *</Label>
            <Select 
              value={formData.is_funded} 
              onValueChange={(v: "" | "dibiayai" | "tidak_dibiayai") => {
                setFormData({
                  ...formData, 
                  is_funded: v,
                  sumber: v === "tidak_dibiayai" ? "" : formData.sumber,
                  sumber_satuan_kerja_category: "",
                  sumber_satuan_kerja: "",
                  sumber_satuan_kerja_custom: "",
                  non_dipa_category: "",
                  non_dipa_custom: ""
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih opsi pembiayaan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dibiayai">Dibiayai</SelectItem>
                <SelectItem value="tidak_dibiayai">Tidak Dibiayai</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Show Sumber and Sumber Dana only when "Dibiayai" is selected */}
          {formData.is_funded === "dibiayai" && (
            <>
              <div className="space-y-2">
                <Label>Sumber *</Label>
                <p className="text-xs text-muted-foreground italic mb-1">
                  {formData.sumber === "DIPA" 
                    ? "(Dibiayai Pemerintah baik Pusat/Daerah/KL)" 
                    : formData.sumber === "Non DIPA" 
                      ? "(Diluar Pembiayaan Pemerintah misalnya DBHCHT)" 
                      : ""}
                </p>
                {/* If unit_penerbit is NOT Kepala Kantor Wilayah, only show Non DIPA */}
                {formData.unit_penerbit !== "Kepala Kantor Wilayah DJBC Jawa Timur I" && formData.unit_penerbit !== "" ? (
                  <Select value={formData.sumber || "Non DIPA"} onValueChange={(v) => setFormData({...formData, sumber: v, sumber_satuan_kerja_category: "", sumber_satuan_kerja: "", sumber_satuan_kerja_custom: "", non_dipa_category: "", non_dipa_custom: ""})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih sumber" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Non DIPA">Non DIPA (Diluar Pembiayaan Pemerintah)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={formData.sumber} onValueChange={(v) => setFormData({...formData, sumber: v, sumber_satuan_kerja_category: "", sumber_satuan_kerja: "", sumber_satuan_kerja_custom: "", non_dipa_category: "", non_dipa_custom: ""})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih sumber" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIPA">DIPA (Dibiayai Pemerintah)</SelectItem>
                      <SelectItem value="Non DIPA">Non DIPA (Diluar Pembiayaan Pemerintah)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Non DIPA category selection */}
              {formData.sumber === "Non DIPA" && (
                <div className="space-y-2">
                  <Label>Kategori Non DIPA *</Label>
                  <Select 
                    value={formData.non_dipa_category} 
                    onValueChange={(v: "" | "DBHCHT" | "lain-lain") => {
                      setFormData({
                        ...formData, 
                        non_dipa_category: v,
                        non_dipa_custom: ""
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DBHCHT">DBHCHT</SelectItem>
                      <SelectItem value="lain-lain">Lain-lain</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {formData.non_dipa_category === "lain-lain" && (
                    <div className="space-y-2 mt-2">
                      <Label className="text-sm">Keterangan Lain-lain *</Label>
                      <InputWithVoice
                        value={formData.non_dipa_custom}
                        onChange={(e) => setFormData({...formData, non_dipa_custom: e.target.value})}
                        placeholder="Tuliskan sumber dana lainnya..."
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {formData.sumber === "DIPA" && (
                <div className="space-y-2">
                  <Label>Sumber Dana *</Label>
                  <Select 
                    value={formData.sumber_satuan_kerja_category} 
                    onValueChange={(v) => {
                      setFormData({
                        ...formData, 
                        sumber_satuan_kerja_category: v,
                        sumber_satuan_kerja: "",
                        sumber_satuan_kerja_custom: ""
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori sumber satuan kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kanwil DJBC Jawa Timur I">Kanwil DJBC Jawa Timur I</SelectItem>
                      <SelectItem value="Kantor Pusat">Kantor Pusat</SelectItem>
                      <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                    </SelectContent>
                  </Select>

                  {formData.sumber_satuan_kerja_category === "Kanwil DJBC Jawa Timur I" && (
                    <div className="space-y-2 mt-2">
                      <Label className="text-sm">Pilih Kantor *</Label>
                      <Select 
                        value={formData.sumber_satuan_kerja} 
                        onValueChange={(v) => setFormData({...formData, sumber_satuan_kerja: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kantor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kanwil DJBC Jatim I">Kanwil DJBC Jatim I</SelectItem>
                          <SelectItem value="KPPBC TMP Tanjung Perak">KPPBC TMP Tanjung Perak</SelectItem>
                          <SelectItem value="KPPBC TMP A Pasuruan">KPPBC TMP A Pasuruan</SelectItem>
                          <SelectItem value="KPPBC TMP Juanda">KPPBC TMP Juanda</SelectItem>
                          <SelectItem value="KPPBC TMP B Gresik">KPPBC TMP B Gresik</SelectItem>
                          <SelectItem value="KPPBC TMP B Sidoarjo">KPPBC TMP B Sidoarjo</SelectItem>
                          <SelectItem value="KPPBC TMP C Madura">KPPBC TMP C Madura</SelectItem>
                          <SelectItem value="KPPBC TMP C Bojonegoro">KPPBC TMP C Bojonegoro</SelectItem>
                          <SelectItem value="BLBC Kelas II Surabaya">BLBC Kelas II Surabaya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.sumber_satuan_kerja_category === "Kantor Pusat" && (
                    <div className="space-y-2 mt-2">
                      <Select 
                        value={formData.sumber_satuan_kerja} 
                        onValueChange={(v) => setFormData({...formData, sumber_satuan_kerja: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih direktorat" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sekretariat DJBC">Sekretariat DJBC</SelectItem>
                          <SelectItem value="Direktorat Teknis Kepabeanan">Direktorat Teknis Kepabeanan</SelectItem>
                          <SelectItem value="Direktorat Fasilitas Kepabeanan">Direktorat Fasilitas Kepabeanan</SelectItem>
                          <SelectItem value="Direktorat Teknis dan Fasilitas Cukai">Direktorat Teknis dan Fasilitas Cukai</SelectItem>
                          <SelectItem value="Direktorat Keberatan Banding dan Peraturan">Direktorat Keberatan Banding dan Peraturan</SelectItem>
                          <SelectItem value="Direktorat Informasi Kepabeanan dan Cukai">Direktorat Informasi Kepabeanan dan Cukai</SelectItem>
                          <SelectItem value="Direktorat Kepatuhan Internal">Direktorat Kepatuhan Internal</SelectItem>
                          <SelectItem value="Direktorat Audit Kepabeanan dan Cukai">Direktorat Audit Kepabeanan dan Cukai</SelectItem>
                          <SelectItem value="Direktorat Penindakan dan Penyidikan">Direktorat Penindakan dan Penyidikan</SelectItem>
                          <SelectItem value="Direktorat Penerimaan dan Perencanaan Strategis">Direktorat Penerimaan dan Perencanaan Strategis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.sumber_satuan_kerja_category === "Lain-lain" && (
                    <div className="space-y-2 mt-2">
                      <p className="text-sm text-muted-foreground italic">Input kantor diluar dari Kanwil DJBC Jatim I dan Kantor Pusat DJBC</p>
                      <InputWithVoice
                        value={formData.sumber_satuan_kerja_custom}
                        onChange={(e) => setFormData({...formData, sumber_satuan_kerja_custom: e.target.value})}
                        placeholder="Tuliskan nama kantor"
                        required
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label>Pejabat Unit Pemohon *</Label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                placeholder="Cari nama atau jabatan..."
                value={signingOfficialSearchTerm}
                onChange={(e) => setSigningOfficialSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select 
              value={formData.pejabat_unit_pemohon_id} 
              onValueChange={(v) => {
                setFormData({...formData, pejabat_unit_pemohon_id: v});
                setSigningOfficialSearchTerm("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih pejabat unit pemohon" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {filteredSigningOfficials.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Tidak ada pejabat yang sesuai dengan pencarian
                  </div>
                ) : (
                  filteredSigningOfficials.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nm_pegawai} - {emp.uraian_jabatan}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pejabat Unit Penerbit *</Label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                placeholder="Cari nama atau jabatan..."
                value={signingOfficialSearchTerm}
                onChange={(e) => setSigningOfficialSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select 
              value={formData.pejabat_unit_penerbit_id} 
              onValueChange={(v) => {
                setFormData({...formData, pejabat_unit_penerbit_id: v});
                setSigningOfficialSearchTerm("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih pejabat unit penerbit" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {filteredSigningOfficials.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Tidak ada pejabat yang sesuai dengan pencarian
                  </div>
                ) : (
                  filteredSigningOfficials.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nm_pegawai} - {emp.uraian_jabatan}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Upload Konsep (Opsional, maks {MAX_FILE_SIZE_KB} KB)</Label>
            <p className="text-sm text-muted-foreground italic">Upload file konsep dalam format Excel (.xlsx, .xls) atau Word (.docx, .doc)</p>
            <Input
              type="file"
              accept=".xlsx,.xls,.docx,.doc,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
              onChange={handleKonsepFileChange}
            />
            {uploadedKonsepFile && (
              <p className="text-sm text-muted-foreground">File terpilih: {uploadedKonsepFile.name}</p>
            )}
            {formData.konsep_path && !uploadedKonsepFile && (
              <p className="text-sm text-muted-foreground">Konsep sudah diupload</p>
            )}
          </div>

        </form>
        
        <div className="flex flex-col gap-2 px-6 py-3 border-t bg-background flex-shrink-0">
          <Button type="submit" form="assignment-form" disabled={loading} className="w-full">
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
