import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  currentImage?: string;
}

export default function CameraCapture({ onCapture, currentImage }: CameraCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      // Try environment camera first, then fall back to user camera
      let mediaStream: MediaStream | null = null;
      
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch {
        // Fallback to front camera if back camera fails
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      }
      
      setStream(mediaStream);
      setIsOpen(true);
      
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        title: "Error",
        description: "Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg");
        onCapture(imageData);
        stopCamera();
        
        toast({
          title: "Berhasil",
          description: "Foto berhasil diambil",
        });
      }
    }
  };

  return (
    <div className="space-y-2">
      {currentImage && (
        <div className="relative">
          <img src={currentImage} alt="Captured" className="w-32 h-32 object-cover rounded border" />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2"
            onClick={() => onCapture("")}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {!currentImage && !isOpen && (
        <Button type="button" variant="outline" onClick={startCamera}>
          <Camera className="w-4 h-4 mr-2" />
          Ambil Foto
        </Button>
      )}

      {isOpen && (
        <div className="space-y-2">
          <div className="relative rounded border overflow-hidden bg-black" style={{ minHeight: "240px" }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              muted
              className="w-full max-w-md h-auto"
              style={{ transform: "scaleX(1)" }}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={capturePhoto}>
              <Camera className="w-4 h-4 mr-2" />
              Ambil Foto
            </Button>
            <Button type="button" variant="outline" onClick={stopCamera}>
              Tutup Kamera
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
