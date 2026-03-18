import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputWithVoice } from "@/components/ui/input-with-voice";
import { TextareaWithVoice } from "@/components/ui/textarea-with-voice";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface Employee {
  id?: string;
  nm_pegawai: string;
  nip: string;
  uraian_pangkat: string;
  uraian_jabatan: string;
  nm_unit_organisasi: string;
}

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSuccess: () => void;
}

const employeeSchema = z.object({
  nm_pegawai: z.string().trim().min(1, "Nama pegawai wajib diisi").max(100, "Nama pegawai maksimal 100 karakter"),
  nip: z.string().regex(/^\d{18}$/, "NIP harus 18 digit angka"),
  uraian_pangkat: z.string().trim().min(1, "Uraian pangkat wajib diisi").max(100, "Uraian pangkat maksimal 100 karakter"),
  uraian_jabatan: z.string().trim().min(1, "Uraian jabatan wajib diisi").max(500, "Uraian jabatan maksimal 500 karakter"),
  nm_unit_organisasi: z.string().trim().min(1, "Nama unit organisasi wajib diisi").max(200, "Nama unit organisasi maksimal 200 karakter"),
});

export default function EmployeeDialog({ open, onOpenChange, employee, onSuccess }: EmployeeDialogProps) {
  const [formData, setFormData] = useState<Employee>({
    nm_pegawai: "",
    nip: "",
    uraian_pangkat: "",
    uraian_jabatan: "",
    nm_unit_organisasi: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      // Apply toProperCase to display data in proper case in the form
      setFormData({
        ...employee,
        nm_pegawai: employee.nm_pegawai,
        nip: employee.nip,
        uraian_pangkat: employee.uraian_pangkat,
        uraian_jabatan: employee.uraian_jabatan,
        nm_unit_organisasi: employee.nm_unit_organisasi,
      });
    } else {
      setFormData({
        nm_pegawai: "",
        nip: "",
        uraian_pangkat: "",
        uraian_jabatan: "",
        nm_unit_organisasi: "",
      });
    }
  }, [employee, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input data
      const validationResult = employeeSchema.safeParse(formData);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast.error(firstError.message);
        setLoading(false);
        return;
      }

      // Convert to proper case (capitalize first letter of each word)
      const toProperCase = (str: string) => {
        return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
      };

      const properCaseData = {
        nm_pegawai: toProperCase(validationResult.data.nm_pegawai),
        nip: validationResult.data.nip,
        uraian_pangkat: toProperCase(validationResult.data.uraian_pangkat),
        uraian_jabatan: toProperCase(validationResult.data.uraian_jabatan),
        nm_unit_organisasi: validationResult.data.nm_unit_organisasi,
      };

      if (employee?.id) {
        // Update existing employee
        const { error } = await supabase
          .from("employees")
          .update(properCaseData)
          .eq("id", employee.id);

        if (error) throw error;
        toast.success("Data pegawai berhasil diperbarui!");
      } else {
        // Insert new employee
        const { error } = await supabase
          .from("employees")
          .insert([properCaseData]);

        if (error) throw error;
        toast.success("Pegawai baru berhasil ditambahkan!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Edit Data Pegawai" : "Tambah Pegawai Baru"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nm_pegawai">Nama Pegawai *</Label>
              <InputWithVoice
                id="nm_pegawai"
                value={formData.nm_pegawai}
                onChange={(e) => setFormData({ ...formData, nm_pegawai: e.target.value })}
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nip">NIP *</Label>
              <InputWithVoice
                id="nip"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                placeholder="Masukkan NIP (18 digit)"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uraian_pangkat">Uraian Pangkat *</Label>
              <InputWithVoice
                id="uraian_pangkat"
                value={formData.uraian_pangkat}
                onChange={(e) => setFormData({ ...formData, uraian_pangkat: e.target.value })}
                placeholder="Contoh: Penata Muda Tk.I - III/b"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uraian_jabatan">Uraian Jabatan *</Label>
              <TextareaWithVoice
                id="uraian_jabatan"
                value={formData.uraian_jabatan}
                onChange={(e) => setFormData({ ...formData, uraian_jabatan: e.target.value })}
                placeholder="Masukkan uraian jabatan lengkap"
                required
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nm_unit_organisasi">Nama Unit Organisasi *</Label>
              <TextareaWithVoice
                id="nm_unit_organisasi"
                value={formData.nm_unit_organisasi}
                onChange={(e) => setFormData({ ...formData, nm_unit_organisasi: e.target.value })}
                placeholder="Masukkan nama unit organisasi lengkap"
                required
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : employee ? "Perbarui" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}