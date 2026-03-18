import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export default function VoiceInput({ onTranscript, className }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const getErrorMessage = (errorType: string): string => {
    switch (errorType) {
      case 'no-speech':
        return "Tidak ada suara terdeteksi. Silakan coba lagi.";
      case 'audio-capture':
        return "Mikrofon tidak tersedia. Pastikan mikrofon terhubung.";
      case 'not-allowed':
        return "Akses mikrofon ditolak. Izinkan akses mikrofon di pengaturan browser.";
      case 'network':
        return "Koneksi jaringan bermasalah. Periksa internet Anda.";
      case 'aborted':
        return "Perekaman dibatalkan.";
      case 'language-not-supported':
        return "Bahasa tidak didukung.";
      case 'service-not-allowed':
        return "Layanan transkripsi tidak tersedia.";
      default:
        return "Gagal mentranskripsi audio. Silakan coba lagi.";
    }
  };

  const startRecording = async () => {
    try {
      // Request microphone permission first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permErr: any) {
        if (permErr.name === 'NotAllowedError') {
          toast.error("Akses mikrofon ditolak. Izinkan akses mikrofon di pengaturan browser.");
        } else if (permErr.name === 'NotFoundError') {
          toast.error("Mikrofon tidak ditemukan. Pastikan perangkat terhubung.");
        } else {
          toast.error("Gagal mengakses mikrofon: " + permErr.message);
        }
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast.error("Browser Anda tidak mendukung transkripsi suara. Gunakan Chrome, Edge, atau Safari.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        toast.info("🎤 Mendengarkan...", { duration: 2000 });
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          if (transcript && transcript.trim()) {
            onTranscript(transcript);
            toast.success("Transkripsi berhasil!");
          } else {
            toast.warning("Tidak ada teks terdeteksi. Silakan coba lagi.");
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error, event);
        const errorMessage = getErrorMessage(event.error);
        toast.error(errorMessage);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onnomatch = () => {
        toast.warning("Tidak dapat mengenali ucapan. Silakan bicara lebih jelas.");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error: any) {
      console.error('Voice input error:', error);
      toast.error("Gagal memulai perekaman: " + error.message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
      setIsRecording(false);
    }
  };

  if (!isSupported) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={className}
        disabled
        title="Browser tidak mendukung transkripsi suara"
      >
        <Mic className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={className}
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      title={isRecording ? "Klik untuk berhenti" : "Klik untuk mulai bicara"}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <Square className="h-4 w-4 text-red-500 animate-pulse" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
