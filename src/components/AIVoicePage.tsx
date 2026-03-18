import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mic, 
  MicOff, 
  FileText, 
  ClipboardList, 
  File, 
  Building2,
  Space,
  CornerDownLeft,
  ChevronsUp,
  Keyboard,
  Sparkles,
  Trash2,
  Copy,
  Download,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

type DocumentFormat = 'nota-dinas' | 'surat-tugas' | 'surat-keterangan' | 'custom';

// Check for Web Speech API support
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

const DOCUMENT_FORMATS = [
  { id: 'nota-dinas', label: 'Nota Dinas', icon: FileText },
  { id: 'surat-tugas', label: 'Surat Tugas', icon: ClipboardList },
  { id: 'surat-keterangan', label: 'Surat Keterangan', icon: File },
  { id: 'custom', label: 'Custom', icon: Keyboard },
] as const;

const KOP_OPTIONS = [
  { id: 'kemenkeu', label: 'Kementerian Keuangan' },
  { id: 'djbc', label: 'Direktorat Jenderal Bea dan Cukai' },
  { id: 'kanwil', label: 'Kanwil DJBC Jatim I' },
];

export default function AIVoicePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<DocumentFormat>('custom');
  const [selectedKop, setSelectedKop] = useState<string>('kemenkeu');
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);

  // Check for Web Speech API support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Browser tidak mendukung Web Speech API. Gunakan Chrome atau Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.lang = 'id-ID';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        toast.info("Mulai merekam... Bicara sekarang!");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          const newText = isCapsLock ? finalTranscript.toUpperCase() : finalTranscript;
          setTranscribedText(prev => prev + (prev ? ' ' : '') + newText);
          setInterimText("");
        } else {
          setInterimText(isCapsLock ? interimTranscript.toUpperCase() : interimTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          toast.error("Izin mikrofon ditolak. Mohon aktifkan izin mikrofon.");
        } else if (event.error === 'no-speech') {
          toast.warning("Tidak ada suara terdeteksi");
        } else {
          toast.error(`Error: ${event.error}`);
        }
        setIsRecording(false);
        setInterimText("");
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimText("");
        // Auto-restart if still recording flag is true (for continuous mode)
        if (recognitionRef.current && isRecording) {
          try {
            recognition.start();
          } catch (e) {
            console.log("Recognition ended");
          }
        }
      };

      recognition.start();
    } catch (error) {
      console.error("Error starting recognition:", error);
      toast.error("Gagal memulai pengenalan suara");
    }
  }, [isCapsLock, isRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimText("");
    toast.success("Rekaman dihentikan");
  }, []);

  const handleAICleanup = async () => {
    if (!transcribedText.trim()) {
      toast.warning("Tidak ada teks untuk dirapikan");
      return;
    }

    setIsAIProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('transcribe-voice', {
        body: { 
          text: transcribedText,
          action: 'cleanup'
        }
      });

      if (error) {
        // Check for specific error codes
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast.error("Rate limit tercapai. Coba lagi nanti.");
          return;
        }
        if (error.message?.includes('402') || error.message?.includes('credits')) {
          toast.error("Kredit AI habis. Silakan tambah kredit.");
          return;
        }
        throw error;
      }
      
      if (data?.cleanedText) {
        setTranscribedText(data.cleanedText);
        toast.success("Teks berhasil dirapikan dengan AI!");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (error: any) {
      console.error("Error cleaning text with AI:", error);
      toast.error(error.message || "Gagal merapikan teks dengan AI");
    } finally {
      setIsAIProcessing(false);
    }
  };

  const insertText = (text: string) => {
    setTranscribedText(prev => prev + text);
  };

  const clearText = () => {
    setTranscribedText("");
    setInterimText("");
    toast.info("Teks dihapus");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcribedText);
      toast.success("Teks disalin ke clipboard");
    } catch (error) {
      toast.error("Gagal menyalin teks");
    }
  };

  const downloadAsText = () => {
    const blob = new Blob([transcribedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dokumen_${selectedFormat}_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("File berhasil diunduh");
  };

  if (!isSupported) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Browser Anda tidak mendukung Web Speech API. Mohon gunakan Google Chrome atau Microsoft Edge untuk menggunakan fitur ini.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Voice to Text</h2>
          <p className="text-muted-foreground">
            Fitur aksesibilitas untuk mengkonversi suara menjadi teks secara real-time
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          AI Powered
        </Badge>
      </div>

      {/* Main Recording Section */}
      <Card className="border-2 border-dashed">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className={cn(
                "h-24 w-24 rounded-full transition-all",
                isRecording && "animate-pulse"
              )}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? (
                <MicOff className="h-10 w-10" />
              ) : (
                <Mic className="h-10 w-10" />
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              {isRecording 
                ? "Klik untuk berhenti merekam" 
                : "Klik untuk mulai merekam"}
            </p>
            {interimText && (
              <p className="text-sm text-muted-foreground italic animate-pulse">
                {interimText}...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Format Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Format Dokumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {DOCUMENT_FORMATS.map((format) => {
              const Icon = format.icon;
              return (
                <Button
                  key={format.id}
                  variant={selectedFormat === format.id ? "default" : "outline"}
                  className="flex flex-col h-auto py-3 gap-1"
                  onClick={() => setSelectedFormat(format.id)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{format.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* KOP Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Pilihan KOP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {KOP_OPTIONS.map((kop) => (
              <Button
                key={kop.id}
                variant={selectedKop === kop.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedKop(kop.id)}
              >
                {kop.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Mode Keyboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => insertText(" ")}
              className="flex items-center gap-1"
            >
              <Space className="h-4 w-4" />
              Spasi
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => insertText("\n")}
              className="flex items-center gap-1"
            >
              <CornerDownLeft className="h-4 w-4" />
              Enter
            </Button>
            <Button
              variant={isCapsLock ? "default" : "outline"}
              size="sm"
              onClick={() => setIsCapsLock(!isCapsLock)}
              className="flex items-center gap-1"
            >
              <ChevronsUp className="h-4 w-4" />
              Caps Lock {isCapsLock ? "(ON)" : "(OFF)"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => insertText("\n\n")}
            >
              Paragraf Baru
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => insertText("- ")}
            >
              Bullet Point
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => insertText("1. ")}
            >
              Numbering
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transcribed Text Area */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Hasil Transkripsi</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAICleanup}
                disabled={isAIProcessing || !transcribedText.trim()}
                className="flex items-center gap-1"
              >
                {isAIProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Rapikan dengan AI
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={!transcribedText.trim()}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAsText}
                disabled={!transcribedText.trim()}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearText}
                disabled={!transcribedText.trim()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={transcribedText}
            onChange={(e) => setTranscribedText(e.target.value)}
            placeholder="Hasil transkripsi akan muncul di sini..."
            className="min-h-[300px] font-mono"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {transcribedText.length} karakter • {transcribedText.split(/\s+/).filter(Boolean).length} kata
          </p>
        </CardContent>
      </Card>

      {/* Quick Phrases */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Frasa Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => insertText("Yang bertanda tangan di bawah ini:")}
            >
              Yang bertanda tangan...
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => insertText("Dengan hormat,")}
            >
              Dengan hormat,
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => insertText("Demikian disampaikan, atas perhatian dan kerjasamanya diucapkan terima kasih.")}
            >
              Demikian disampaikan...
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => insertText("Berdasarkan Peraturan Menteri Keuangan Nomor")}
            >
              Berdasarkan PMK...
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => insertText("Sehubungan dengan hal tersebut di atas,")}
            >
              Sehubungan dengan...
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
