import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Upload, Check, Circle, Video, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserAvatarWithStatusProps {
  userId: string;
  avatarUrl?: string;
  fullName?: string;
  email?: string;
  status?: "available" | "busy" | "away" | "in_meeting";
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  onAvatarChange?: (url: string) => void;
  onStatusChange?: (status: string) => void;
  onLiveCameraStart?: (stream: MediaStream) => void;
  onLiveCameraStop?: () => void;
}

const STATUS_CONFIG = {
  available: { label: "Available", color: "bg-green-500", borderColor: "border-green-400" },
  busy: { label: "Busy", color: "bg-yellow-500", borderColor: "border-yellow-400" },
  away: { label: "Away", color: "bg-red-500", borderColor: "border-red-400" },
  in_meeting: { label: "In Meeting", color: "bg-blue-500", borderColor: "border-blue-400" },
};

const SIZE_CONFIG = {
  sm: { avatar: "w-10 h-10", status: "w-3 h-3", text: "text-sm" },
  md: { avatar: "w-16 h-16 sm:w-20 sm:h-20", status: "w-5 h-5", text: "text-2xl sm:text-3xl" },
  lg: { avatar: "w-24 h-24", status: "w-6 h-6", text: "text-4xl" },
};

export default function UserAvatarWithStatus({
  userId,
  avatarUrl,
  fullName,
  email,
  status = "available",
  size = "md",
  editable = false,
  onAvatarChange,
  onStatusChange,
  onLiveCameraStart,
  onLiveCameraStop,
}: UserAvatarWithStatusProps) {
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [liveCameraOpen, setLiveCameraOpen] = useState(false);
  const [liveCameraInline, setLiveCameraInline] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveCameraRef = useRef<HTMLVideoElement>(null);
  const inlineVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = SIZE_CONFIG[size];
  const statusConfig = STATUS_CONFIG[currentStatus];

  useEffect(() => {
    setCurrentAvatar(avatarUrl);
  }, [avatarUrl]);

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  const startCamera = async () => {
    try {
      let mediaStream: MediaStream | null = null;
      
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } }
        });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
      }
      
      setStream(mediaStream);
      setCameraDialogOpen(true);
      
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Tidak dapat mengakses kamera");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraDialogOpen(false);
  };

  const startLiveCamera = async () => {
    try {
      let mediaStream: MediaStream | null = null;
      
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
      }
      
      setStream(mediaStream);
      setLiveCameraInline(true);
      
      // Notify parent about live camera start
      onLiveCameraStart?.(mediaStream);
      
      setTimeout(() => {
        if (inlineVideoRef.current && mediaStream) {
          inlineVideoRef.current.srcObject = mediaStream;
          inlineVideoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Tidak dapat mengakses kamera");
    }
  };

  const stopLiveCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setLiveCameraOpen(false);
    setLiveCameraInline(false);
    onLiveCameraStop?.();
  };

  const captureLivePhoto = async () => {
    if (!liveCameraRef.current) return;

    const canvas = document.createElement("canvas");
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    const video = liveCameraRef.current;
    const minDim = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - minDim) / 2;
    const sy = (video.videoHeight - minDim) / 2;
    
    ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, size, size);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await uploadAvatar(blob);
      stopLiveCamera();
    }, "image/jpeg", 0.9);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create circular clip
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    const video = videoRef.current;
    const minDim = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - minDim) / 2;
    const sy = (video.videoHeight - minDim) / 2;
    
    ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, size, size);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await uploadAvatar(blob);
      stopCamera();
    }, "image/jpeg", 0.9);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Pilih file gambar");
      return;
    }

    // Create circular crop from uploaded image
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await uploadAvatar(blob);
      }, "image/jpeg", 0.9);
    };
    img.src = URL.createObjectURL(file);
  };

  const uploadAvatar = async (blob: Blob) => {
    try {
      const fileName = `${userId}-${Date.now()}.jpg`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { upsert: true });

      if (uploadError) {
        // If bucket doesn't exist, save as base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          await updateProfile(base64);
        };
        reader.readAsDataURL(blob);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      await updateProfile(publicUrl);
    } catch (error) {
      console.error("Upload error:", error);
      // Fallback to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await updateProfile(base64);
      };
      reader.readAsDataURL(blob);
    }
  };

  const updateProfile = async (avatarUrl: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", userId);

      if (error) throw error;

      setCurrentAvatar(avatarUrl);
      onAvatarChange?.(avatarUrl);
      toast.success("Foto profil berhasil diperbarui");
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Gagal memperbarui foto profil");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ user_status: newStatus })
        .eq("user_id", userId);

      if (error) throw error;

      setCurrentStatus(newStatus as typeof status);
      onStatusChange?.(newStatus);
      toast.success(`Status diubah ke ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG].label}`);
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Gagal mengubah status");
    }
  };

  const initials = (fullName || email || "U").charAt(0).toUpperCase();

  return (
    <>
      <div className="relative inline-block">
        {liveCameraInline ? (
          // Show live camera feed directly in avatar
          <div className="relative">
            <div className={`${sizeClasses.avatar} rounded-full overflow-hidden border-4 border-red-500 animate-pulse`}>
              <video
                ref={inlineVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>
            <button
              onClick={stopLiveCamera}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              title="Tutup Kamera"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
              LIVE
            </div>
          </div>
        ) : editable ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none focus:ring-2 focus:ring-primary rounded-full">
                <Avatar className={`${sizeClasses.avatar} border-4 border-white/30 cursor-pointer hover:opacity-90 transition-opacity`}>
                  <AvatarImage src={currentAvatar} alt={fullName || "Avatar"} className="object-cover" />
                  <AvatarFallback className="bg-white/20 text-white">
                    <span className={`font-bold ${sizeClasses.text}`}>{initials}</span>
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={startCamera}>
                <Camera className="w-4 h-4 mr-2" />
                Ambil Foto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Foto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={startLiveCamera}>
                <Video className="w-4 h-4 mr-2" />
                Kamera On
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Circle className={`w-3 h-3 fill-current ${config.color.replace("bg-", "text-")}`} />
                    {config.label}
                  </div>
                  {currentStatus === key && <Check className="w-4 h-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Avatar className={`${sizeClasses.avatar} border-4 border-white/30`}>
            <AvatarImage src={currentAvatar} alt={fullName || "Avatar"} className="object-cover" />
            <AvatarFallback className="bg-white/20 text-white">
              <span className={`font-bold ${sizeClasses.text}`}>{initials}</span>
            </AvatarFallback>
          </Avatar>
        )}
        
        {/* Status indicator - hide when camera is live */}
        {!liveCameraInline && (
          <div 
            className={`absolute -bottom-1 -right-1 ${sizeClasses.status} ${statusConfig.color} rounded-full border-2 border-white`}
            title={statusConfig.label}
          />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Camera Dialog */}
      <Dialog open={cameraDialogOpen} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ambil Foto Profil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative rounded-full overflow-hidden mx-auto w-64 h-64 bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={capturePhoto}>
                <Camera className="w-4 h-4 mr-2" />
                Ambil Foto
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Camera Dialog */}
      <Dialog open={liveCameraOpen} onOpenChange={(open) => !open && stopLiveCamera()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-red-500 animate-pulse" />
              Kamera Live
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              <video
                ref={liveCameraRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">LIVE</span>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={captureLivePhoto}>
                <Camera className="w-4 h-4 mr-2" />
                Ambil Foto Profil
              </Button>
              <Button variant="outline" onClick={stopLiveCamera}>
                <X className="w-4 h-4 mr-2" />
                Tutup Kamera
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
