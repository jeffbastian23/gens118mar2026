import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, Copy, X, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import Tesseract from "tesseract.js";
import { Textarea } from "@/components/ui/textarea";
import * as mammoth from "mammoth";

interface OCRScannerProps {
  onTextExtracted: (text: string) => void;
}

export default function OCRScanner({ onTextExtracted }: OCRScannerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = async () => {
    try {
      let stream: MediaStream | null = null;
      
      // Try environment camera first, then fall back to user camera
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch {
        // Fallback to front camera if back camera fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      }
      
      streamRef.current = stream;
      setCameraActive(true);
      
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Gagal mengakses kamera. Pastikan izin kamera diaktifkan.");
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Wait for video to be ready
      if (video.readyState < 2) {
        toast.error("Kamera belum siap, tunggu sebentar...");
        return;
      }
      
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        
        // Convert data URL to blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        stopCamera();
        const file = new File([blob], "captured.jpg", { type: "image/jpeg" });
        await processImage(file);
      }
    }
  };

  const processImage = async (file: File) => {
    try {
      setLoading(true);
      setPreviewImage(URL.createObjectURL(file));
      
      const result = await Tesseract.recognize(file, 'ind+eng', {
        logger: (m) => console.log(m)
      });

      const text = result.data.text;
      setExtractedText(text);
      toast.success("Teks berhasil diekstrak");
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("Gagal mengekstrak teks dari gambar");
    } finally {
      setLoading(false);
    }
  };

  const processPDF = async (file: File) => {
    try {
      setLoading(true);
      const arrayBuffer = await file.arrayBuffer();
      
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }
      
      setExtractedText(fullText);
      setPreviewImage(null);
      toast.success("Teks berhasil diekstrak dari PDF");
    } catch (error) {
      console.error("PDF Error:", error);
      toast.error("Gagal mengekstrak teks dari PDF");
    } finally {
      setLoading(false);
    }
  };

  const processWord = async (file: File) => {
    try {
      setLoading(true);
      const arrayBuffer = await file.arrayBuffer();
      
      const result = await mammoth.extractRawText({ arrayBuffer });
      setExtractedText(result.value);
      setPreviewImage(null);
      toast.success("Teks berhasil diekstrak dari dokumen Word");
    } catch (error) {
      console.error("Word Error:", error);
      toast.error("Gagal mengekstrak teks dari dokumen Word");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType.startsWith("image/")) {
      await processImage(file);
    } else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      await processPDF(file);
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileType === "application/msword" ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".doc")
    ) {
      await processWord(file);
    } else {
      toast.error("Format file tidak didukung. Gunakan gambar, PDF, atau Word.");
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopyText = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText);
      toast.success("Teks berhasil disalin");
      onTextExtracted(extractedText);
      setOpen(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setOpen(false);
    setPreviewImage(null);
    setExtractedText("");
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full md:w-auto"
      >
        <Camera className="w-4 h-4 mr-2" />
        Scan Dokumen (OCR)
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scan Dokumen dengan OCR</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!cameraActive && !previewImage && !loading && (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={startCamera}
                  className="h-32 flex flex-col items-center justify-center gap-2 border-2 hover:border-primary hover:bg-muted/50 transition-colors"
                >
                  <Camera className="w-10 h-10" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 flex flex-col items-center justify-center gap-2 border-2 hover:border-primary hover:bg-muted/50 transition-colors"
                >
                  <Upload className="w-10 h-10" />
                </Button>
              </div>
            )}

            <p className="text-sm text-center text-muted-foreground">Gambar, PDF, Word</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Live Camera Preview */}
            {cameraActive && (
              <div className="space-y-4">
                <div className="relative border rounded-lg overflow-hidden bg-black aspect-video" style={{ minHeight: "300px" }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(1)" }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={capturePhoto} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Ambil Foto
                  </Button>
                  <Button variant="outline" onClick={stopCamera}>
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm text-muted-foreground">Memproses dokumen...</p>
              </div>
            )}

            {(previewImage || extractedText) && !loading && !cameraActive && (
              <div className="space-y-4">
                {previewImage && (
                  <div className="border rounded-lg overflow-hidden">
                    <img src={previewImage} alt="Preview" className="w-full h-auto max-h-64 object-contain" />
                  </div>
                )}

                {!previewImage && extractedText && (
                  <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Dokumen berhasil diproses</span>
                  </div>
                )}

                {extractedText && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hasil Ekstraksi Teks:</label>
                    <Textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleCopyText} className="flex-1">
                        <Copy className="w-4 h-4 mr-2" />
                        Salin & Gunakan Teks
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPreviewImage(null);
                          setExtractedText("");
                        }}
                      >
                        Scan Ulang
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
