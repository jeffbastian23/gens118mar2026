import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import CameraCapture from "./CameraCapture";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const BAGIAN_OPTIONS = [
  "Bagian Umum",
  "Bidang P2",
  "Bidang KI",
  "Bidang KC",
  "Bidang Fasilitas",
  "Bidang Audit",
  "Sub Unsur Audit",
  "Sub Unsur Keban"
];

interface BukuBambuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: any;
}

export default function BukuBambuDialog({ open, onOpenChange, onSuccess, editData }: BukuBambuDialogProps) {
  const { user, fullName } = useAuth();
  const [existingUsers, setExistingUsers] = useState<string[]>([]);
  const [customNameInput, setCustomNameInput] = useState("");
  const [selectedNameOption, setSelectedNameOption] = useState<"existing" | "custom">("existing");
  const [formData, setFormData] = useState({
    no_urut: "",
    dari_unit: "",
    ke_unit: "",
    nama_penerima: "",
    nomor_surat: "",
    hal: "",
    catatan: "",
    foto_absen: "",
    pdf_dokumen: "",
    created_by_name: ""
  });

  useEffect(() => {
    fetchExistingUsers();
  }, []);

  useEffect(() => {
    if (open && !editData) {
      fetchNextNoUrut();
    }
  }, [open, editData]);

  const fetchExistingUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .not("full_name", "is", null)
      .order("full_name");
    
    if (!error && data) {
      const uniqueNames = [...new Set(data.map(p => p.full_name!))];
      setExistingUsers(uniqueNames);
    }
  };

  const fetchNextNoUrut = async () => {
    const { data, error } = await supabase
      .from("buku_bambu")
      .select("no_urut")
      .order("no_urut", { ascending: false })
      .limit(1);
    
    if (!error) {
      const nextNo = data && data.length > 0 ? (data[0].no_urut || 0) + 1 : 1;
      setFormData(prev => ({ ...prev, no_urut: nextNo.toString() }));
    }
  };

  useEffect(() => {
    if (editData) {
      const isExistingUser = existingUsers.includes(editData.nama_penerima);
      setFormData({
        no_urut: editData.no_urut?.toString() || "",
        dari_unit: editData.dari_unit || "",
        ke_unit: editData.ke_unit || "",
        nama_penerima: isExistingUser ? editData.nama_penerima : "",
        nomor_surat: (editData as any).nomor_surat || "",
        hal: (editData as any).hal || "",
        catatan: editData.catatan || "",
        foto_absen: editData.foto_absen || "",
        pdf_dokumen: (editData as any).pdf_dokumen || "",
        created_by_name: editData.created_by_name || ""
      });
      if (!isExistingUser) {
        setSelectedNameOption("custom");
        setCustomNameInput(editData.nama_penerima);
      } else {
        setSelectedNameOption("existing");
      }
    } else {
      // Reset for new entry
      setFormData({
        no_urut: "",
        dari_unit: "",
        ke_unit: "",
        nama_penerima: "",
        nomor_surat: "",
        hal: "",
        catatan: "",
        foto_absen: "",
        pdf_dokumen: "",
        created_by_name: fullName || ""
      });
      setSelectedNameOption("existing");
      setCustomNameInput("");
    }
  }, [editData, fullName, open, existingUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalNamaPenerima = selectedNameOption === "custom" ? customNameInput : formData.nama_penerima;
    
    if (!finalNamaPenerima) {
      toast.error("Nama penerima harus diisi");
      return;
    }

    const dataToSave = {
      no_urut: parseInt(formData.no_urut) || 0,
      dari_unit: formData.dari_unit,
      ke_unit: formData.ke_unit,
      nama_penerima: finalNamaPenerima,
      nomor_surat: formData.nomor_surat || null,
      hal: formData.hal || null,
      catatan: formData.catatan || null,
      foto_absen: formData.foto_absen || null,
      pdf_dokumen: formData.pdf_dokumen || null,
      created_by_name: formData.created_by_name || fullName || null,
      created_by_email: user?.email || null,
      surat_masuk_id: null
    };

    if (editData) {
      const { error } = await supabase
        .from("buku_bambu")
        .update(dataToSave)
        .eq("id", editData.id);

      if (error) {
        toast.error("Gagal mengubah data");
        return;
      }
      toast.success("Data berhasil diubah");
    } else {
      const { error } = await supabase
        .from("buku_bambu")
        .insert(dataToSave);

      if (error) {
        toast.error("Gagal menyimpan data");
        return;
      }
      toast.success("Data berhasil ditambahkan");
    }

    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit" : "Tambah"} Buku Bambu</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>No. Urut *</Label>
            <Input
              type="number"
              value={formData.no_urut}
              onChange={(e) => setFormData({ ...formData, no_urut: e.target.value })}
              required
              disabled={!editData}
            />
            {!editData && (
              <p className="text-xs text-muted-foreground">
                Nomor urut otomatis dimulai dari urutan terakhir
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nomor Surat</Label>
            <Input
              value={formData.nomor_surat}
              onChange={(e) => setFormData({ ...formData, nomor_surat: e.target.value })}
              placeholder="Masukkan nomor surat"
            />
          </div>

          <div className="space-y-2">
            <Label>Hal</Label>
            <Input
              value={formData.hal}
              onChange={(e) => setFormData({ ...formData, hal: e.target.value })}
              placeholder="Masukkan hal surat"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dari Unit *</Label>
              <Select value={formData.dari_unit} onValueChange={(v) => setFormData({ ...formData, dari_unit: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit" />
                </SelectTrigger>
                <SelectContent>
                  {BAGIAN_OPTIONS.map((bagian) => (
                    <SelectItem key={bagian} value={bagian}>{bagian}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ke Unit *</Label>
              <Select value={formData.ke_unit} onValueChange={(v) => setFormData({ ...formData, ke_unit: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit" />
                </SelectTrigger>
                <SelectContent>
                  {BAGIAN_OPTIONS.map((bagian) => (
                    <SelectItem key={bagian} value={bagian}>{bagian}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nama Penerima *</Label>
            <RadioGroup value={selectedNameOption} onValueChange={(v: "existing" | "custom") => setSelectedNameOption(v)} className="mb-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing" className="font-normal cursor-pointer">Pilih dari user yang ada</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="font-normal cursor-pointer">Masukkan nama manual</Label>
              </div>
            </RadioGroup>
            
            {selectedNameOption === "existing" ? (
              <Select value={formData.nama_penerima} onValueChange={(v) => setFormData({ ...formData, nama_penerima: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih nama penerima" />
                </SelectTrigger>
                <SelectContent>
                  {existingUsers.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={customNameInput}
                onChange={(e) => setCustomNameInput(e.target.value)}
                placeholder="Masukkan nama penerima"
                required
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Nama Pengirim</Label>
            <Input
              value={formData.created_by_name}
              onChange={(e) => setFormData({ ...formData, created_by_name: e.target.value })}
              placeholder={fullName || "Masukkan nama"}
            />
            <p className="text-xs text-muted-foreground">
              Terisi otomatis dari profil Anda, atau ketik manual
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ambil Foto (Dokumentasi)</Label>
              <CameraCapture
                onCapture={(imageData) => setFormData({ ...formData, foto_absen: imageData })}
                currentImage={formData.foto_absen}
              />
            </div>

            <div className="space-y-2">
              <Label>Upload Dokumen PDF (Opsional)</Label>
              {formData.pdf_dokumen ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">PDF telah diupload</p>
                  <Button type="button" variant="outline" onClick={() => setFormData({ ...formData, pdf_dokumen: "" })}>
                    Hapus PDF
                  </Button>
                </div>
              ) : (
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({ ...formData, pdf_dokumen: reader.result as string });
                        toast.success("PDF berhasil diupload");
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Simpan</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
