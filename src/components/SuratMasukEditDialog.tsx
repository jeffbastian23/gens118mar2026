import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SuratMasuk {
  id: string;
  nomor_agenda: number;
  nomor_dokumen: string;
  hal: string;
  tujuan_bagian: string[];
  nama_pengirim: string;
  instansi_pengirim: string | null;
  nama_penerima: string;
  petugas_bc_penerima: string;
  foto_penerima: string | null;
  tanggal_terima: string;
}

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

interface SuratMasukEditDialogProps {
  surat: SuratMasuk | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function SuratMasukEditDialog({ surat, open, onOpenChange, onSuccess }: SuratMasukEditDialogProps) {
  const [formData, setFormData] = useState({
    nomor_dokumen: "",
    hal: "",
    tujuan_bagian: [] as string[],
    nama_pengirim: "",
    instansi_pengirim: "",
    nama_penerima: "",
    foto_penerima: "",
    pdf_dokumen: ""
  });
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (surat) {
      setFormData({
        nomor_dokumen: surat.nomor_dokumen,
        hal: surat.hal,
        tujuan_bagian: surat.tujuan_bagian,
        nama_pengirim: surat.nama_pengirim,
        instansi_pengirim: surat.instansi_pengirim || "",
        nama_penerima: surat.nama_penerima,
        foto_penerima: surat.foto_penerima || "",
        pdf_dokumen: (surat as any).pdf_dokumen || ""
      });
    }
  }, [surat]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play()
          .then(() => setIsVideoReady(true))
          .catch(console.error);
      };
    }
  }, [stream, showCamera]);

  const startCamera = async () => {
    try {
      setIsVideoReady(false);
      let mediaStream: MediaStream | null = null;
      
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      }
      
      setStream(mediaStream);
      setShowCamera(true);
    } catch (error) {
      toast.error("Gagal mengakses kamera");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && isVideoReady) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setFormData({ ...formData, foto_penerima: dataUrl });
        stopCamera();
        toast.success("Foto berhasil diambil");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setIsVideoReady(false);
  };

  const handleTujuanChange = (bagian: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, tujuan_bagian: [...formData.tujuan_bagian, bagian] });
    } else {
      setFormData({ ...formData, tujuan_bagian: formData.tujuan_bagian.filter(b => b !== bagian) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surat) return;

    if (formData.tujuan_bagian.length === 0) {
      toast.error("Pilih minimal satu tujuan bagian");
      return;
    }

    const { error } = await supabase
      .from("surat_masuk")
      .update({
        nomor_dokumen: formData.nomor_dokumen,
        hal: formData.hal,
        tujuan_bagian: formData.tujuan_bagian,
        nama_pengirim: formData.nama_pengirim,
        instansi_pengirim: formData.instansi_pengirim || null,
        nama_penerima: formData.nama_penerima,
        foto_penerima: formData.foto_penerima || null,
        pdf_dokumen: formData.pdf_dokumen || null
      })
      .eq("id", surat.id);

    if (error) {
      toast.error("Gagal mengubah data");
      return;
    }

    toast.success("Data berhasil diubah");
    stopCamera();
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Surat Masuk</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nomor Dokumen *</Label>
              <Input
                value={formData.nomor_dokumen}
                onChange={(e) => setFormData({ ...formData, nomor_dokumen: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Hal *</Label>
              <Input
                value={formData.hal}
                onChange={(e) => setFormData({ ...formData, hal: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tujuan Bagian *</Label>
            <div className="grid grid-cols-2 gap-2">
              {BAGIAN_OPTIONS.map((bagian) => (
                <div key={bagian} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${bagian}`}
                    checked={formData.tujuan_bagian.includes(bagian)}
                    onCheckedChange={(checked) => handleTujuanChange(bagian, checked as boolean)}
                  />
                  <label htmlFor={`edit-${bagian}`} className="text-sm">{bagian}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Pengirim *</Label>
              <Input
                value={formData.nama_pengirim}
                onChange={(e) => setFormData({ ...formData, nama_pengirim: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Instansi Pengirim</Label>
              <Input
                value={formData.instansi_pengirim}
                onChange={(e) => setFormData({ ...formData, instansi_pengirim: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nama Penerima *</Label>
            <Input
              value={formData.nama_penerima}
              onChange={(e) => setFormData({ ...formData, nama_penerima: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Foto Penerima</Label>
              {showCamera ? (
                <div className="space-y-2">
                  <div className="relative rounded border overflow-hidden bg-black" style={{ minHeight: "240px" }}>
                    {!isVideoReady && (
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <p>Memuat kamera...</p>
                      </div>
                    )}
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline
                      muted
                      className="w-full max-w-sm h-auto" 
                      style={{ display: isVideoReady ? "block" : "none" }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={capturePhoto} disabled={!isVideoReady}>
                      <Camera className="w-4 h-4 mr-2" />
                      Ambil Foto
                    </Button>
                    <Button type="button" variant="outline" onClick={stopCamera}>Batal</Button>
                  </div>
                </div>
              ) : formData.foto_penerima ? (
                <div className="space-y-2">
                  <img src={formData.foto_penerima} alt="Foto Penerima" className="w-32 h-32 object-cover rounded border" />
                  <Button type="button" variant="outline" onClick={() => setFormData({ ...formData, foto_penerima: "" })}>
                    Hapus Foto
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={startCamera}>
                  <Camera className="w-4 h-4 mr-2" />
                  Ambil Foto
                </Button>
              )}
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

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Simpan</Button>
            <Button type="button" variant="outline" onClick={() => { stopCamera(); onOpenChange(false); }}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
