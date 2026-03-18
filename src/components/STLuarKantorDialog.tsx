import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { validateFileSizeWithToast, MAX_FILE_SIZE_KB } from "@/utils/fileValidation";

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string;
  uraian_pangkat: string;
  uraian_jabatan: string;
}

interface STLuarKantorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onSuccess: () => void;
  stData?: any;
}

export default function STLuarKantorDialog({
  open,
  onOpenChange,
  employees,
  onSuccess,
  stData,
}: STLuarKantorDialogProps) {
  const [dasarPenugasan, setDasarPenugasan] = useState("");
  const [hal, setHal] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string>("");
  const [tanggalMulai, setTanggalMulai] = useState<Date>();
  const [tanggalSelesai, setTanggalSelesai] = useState<Date>();
  const [waktuPenugasan, setWaktuPenugasan] = useState("");
  const [lokasiPenugasan, setLokasiPenugasan] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (stData) {
      setDasarPenugasan(stData.dasar_penugasan || "");
      setHal(stData.hal || "");
      setSelectedEmployees(stData.employee_ids || []);
      setPdfBase64(stData.pdf_dokumen || "");
      setTanggalMulai(stData.tanggal_mulai ? new Date(stData.tanggal_mulai) : undefined);
      setTanggalSelesai(stData.tanggal_selesai ? new Date(stData.tanggal_selesai) : undefined);
      setWaktuPenugasan(stData.waktu_penugasan || "");
      setLokasiPenugasan(stData.lokasi_penugasan || "");
    } else {
      resetForm();
    }
  }, [stData, open]);

  const resetForm = () => {
    setDasarPenugasan("");
    setHal("");
    setSelectedEmployees([]);
    setPdfFile(null);
    setPdfBase64("");
    setTanggalMulai(undefined);
    setTanggalSelesai(undefined);
    setWaktuPenugasan("");
    setLokasiPenugasan("");
    setSearchTerm("");
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("File harus berformat PDF");
        return;
      }
      
      // Validate file size (max 600KB)
      if (!validateFileSizeWithToast(file)) {
        e.target.value = "";
        return;
      }
      
      setPdfFile(file);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!dasarPenugasan || !hal || selectedEmployees.length === 0 || !tanggalMulai || !tanggalSelesai || !lokasiPenugasan) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || "";

      const payload = {
        dasar_penugasan: dasarPenugasan,
        hal: hal,
        employee_ids: selectedEmployees,
        pdf_dokumen: pdfBase64 || null,
        tanggal_mulai: format(tanggalMulai, "yyyy-MM-dd"),
        tanggal_selesai: format(tanggalSelesai, "yyyy-MM-dd"),
        waktu_penugasan: waktuPenugasan || null,
        lokasi_penugasan: lokasiPenugasan,
        ...(stData ? { updated_by_email: email } : { created_by_email: email }),
      };

      if (stData) {
        const { error } = await supabase
          .from("st_luar_kantor")
          .update(payload)
          .eq("id", stData.id);

        if (error) throw error;
        toast.success("Data ST Luar Kantor berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("st_luar_kantor")
          .insert(payload);

        if (error) throw error;
        toast.success("Data ST Luar Kantor berhasil ditambahkan");
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving ST Luar Kantor:", error);
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.nm_pegawai.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stData ? "Edit" : "Tambah"} ST Luar Kantor</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="dasar">Dasar Penugasan *</Label>
            <Textarea
              id="dasar"
              value={dasarPenugasan}
              onChange={(e) => setDasarPenugasan(e.target.value)}
              placeholder="Tuliskan dasar penugasan..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="hal">Hal *</Label>
            <Input
              id="hal"
              value={hal}
              onChange={(e) => setHal(e.target.value)}
              placeholder="Tuliskan hal/perihal..."
            />
          </div>

          <div>
            <Label>Nama Pegawai * ({selectedEmployees.length} dipilih)</Label>
            <Input
              placeholder="Cari pegawai..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={employee.id}
                    checked={selectedEmployees.includes(employee.id)}
                    onCheckedChange={() => handleEmployeeToggle(employee.id)}
                  />
                  <label
                    htmlFor={employee.id}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {employee.nm_pegawai} - {employee.nip}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="pdf">Upload Dokumen PDF (Opsional, maks {MAX_FILE_SIZE_KB} KB)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="pdf"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="flex-1"
              />
              {(pdfFile || pdfBase64) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setPdfFile(null);
                    setPdfBase64("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {pdfBase64 && (
              <p className="text-xs text-muted-foreground mt-1">
                PDF sudah diunggah
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Periode Penugasan Mulai *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !tanggalMulai && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tanggalMulai ? format(tanggalMulai, "PPP", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tanggalMulai}
                    onSelect={setTanggalMulai}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Periode Penugasan Selesai *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !tanggalSelesai && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tanggalSelesai ? format(tanggalSelesai, "PPP", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tanggalSelesai}
                    onSelect={setTanggalSelesai}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="waktu">Waktu Penugasan (Opsional)</Label>
            <Input
              id="waktu"
              value={waktuPenugasan}
              onChange={(e) => setWaktuPenugasan(e.target.value)}
              placeholder="Contoh: 08:00 - 16:00"
            />
          </div>

          <div>
            <Label htmlFor="lokasi">Lokasi Penugasan *</Label>
            <Input
              id="lokasi"
              value={lokasiPenugasan}
              onChange={(e) => setLokasiPenugasan(e.target.value)}
              placeholder="Tuliskan lokasi penugasan..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Menyimpan..." : stData ? "Update" : "Simpan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
