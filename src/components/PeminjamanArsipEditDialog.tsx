import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CameraCapture from "./CameraCapture";

interface PeminjamanArsip {
  id: string;
  no_urut: number;
  nama_dokumen: string;
  kode_klasifikasi: string;
  nomor_boks: string;
  tahun_dokumen: string;
  pemilik_dokumen: string;
  no_rak: string;
  sub_rak: string;
  susun: string;
  baris: string;
  status_dokumen: string;
  keperluan: string;
  nama_peminjam: string;
  foto_peminjam?: string | null;
  tanggal_peminjaman: string;
  status_pengembalian: boolean;
  tanggal_pengembalian: string | null;
}

interface PeminjamanArsipEditDialogProps {
  peminjaman: PeminjamanArsip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function PeminjamanArsipEditDialog({ 
  peminjaman, 
  open, 
  onOpenChange, 
  onSuccess 
}: PeminjamanArsipEditDialogProps) {
  const { toast } = useToast();
  const [keperluan, setKeperluan] = useState("");
  const [namaPeminjam, setNamaPeminjam] = useState("");
  const [fotoPeminjam, setFotoPeminjam] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (peminjaman) {
      setKeperluan(peminjaman.keperluan || "");
      setNamaPeminjam(peminjaman.nama_peminjam || "");
      setFotoPeminjam(peminjaman.foto_peminjam || "");
    }
  }, [peminjaman]);

  const handleSubmit = async () => {
    if (!peminjaman) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from("peminjaman_arsip")
      .update({
        keperluan,
        nama_peminjam: namaPeminjam,
        foto_peminjam: fotoPeminjam || null,
      })
      .eq("id", peminjaman.id);

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal mengupdate data peminjaman",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: "Data peminjaman berhasil diupdate",
    });

    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Peminjaman Arsip</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <span className="text-sm font-medium">No Urut:</span>
              <p className="text-sm">{peminjaman?.no_urut}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Nama Dokumen:</span>
              <p className="text-sm">{peminjaman?.nama_dokumen}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Kode Klasifikasi:</span>
              <p className="text-sm">{peminjaman?.kode_klasifikasi}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Nomor Boks:</span>
              <p className="text-sm">{peminjaman?.nomor_boks}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nama_peminjam">Nama Lengkap Peminjam</Label>
            <Input
              id="nama_peminjam"
              value={namaPeminjam}
              onChange={(e) => setNamaPeminjam(e.target.value)}
              placeholder="Masukkan nama lengkap peminjam"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keperluan">Keperluan</Label>
            <Textarea
              id="keperluan"
              value={keperluan}
              onChange={(e) => setKeperluan(e.target.value)}
              placeholder="Masukkan keperluan peminjaman"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Foto Peminjam</Label>
            <CameraCapture onCapture={setFotoPeminjam} currentImage={fotoPeminjam} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
