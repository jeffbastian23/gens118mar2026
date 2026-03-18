import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, Volume2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Voicebot() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  
  const recognitionRef = useRef<any>(null);

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
        toast.info("🎤 Mendengarkan suara Anda...", { duration: 2000 });
      };

      recognition.onresult = async (event: any) => {
        if (event.results && event.results.length > 0) {
          const transcribedText = event.results[0][0].transcript;
          
          if (!transcribedText || !transcribedText.trim()) {
            toast.warning("Tidak ada teks terdeteksi. Silakan coba lagi.");
            setIsProcessing(false);
            return;
          }

          setTranscript(transcribedText);
          setIsProcessing(true);

          // Send to LLM for response
          try {
            const { data: chatData, error: chatError } = await supabase.functions.invoke('voice-chat', {
              body: { message: transcribedText }
            });

            if (chatError) throw chatError;

            const aiResponse = chatData?.response || 'Maaf, saya tidak dapat memproses permintaan Anda.';
            setResponse(aiResponse);
            speakResponse(aiResponse);
            toast.success("Selesai!");
          } catch (error: any) {
            console.error("Voice chat error:", error);
            toast.error("Gagal mendapatkan respon AI. Coba lagi nanti.");
          } finally {
            setIsProcessing(false);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error, event);
        const errorMessage = getErrorMessage(event.error);
        toast.error(errorMessage);
        setIsRecording(false);
        setIsProcessing(false);
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
      console.error('Voice recording error:', error);
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

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🎤 Voicebot Asisten</h2>
        {isSpeaking && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={stopSpeaking}
            className="gap-2"
          >
            <Volume2 className="h-4 w-4 animate-pulse" />
            Hentikan Suara
          </Button>
        )}
      </div>

      <div className="flex justify-center py-8">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          size="lg"
          className={`h-24 w-24 rounded-full ${
            isRecording 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-primary hover:bg-primary/90"
          }`}
        >
          {isProcessing ? (
            <Loader2 className="h-12 w-12 animate-spin" />
          ) : isRecording ? (
            <Square className="h-12 w-12" />
          ) : (
            <Mic className="h-12 w-12" />
          )}
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {isRecording && "🎙️ Sedang merekam... Klik untuk berhenti"}
        {isProcessing && "⚙️ Memproses audio Anda..."}
        {!isRecording && !isProcessing && "Klik mikrofon untuk mulai berbicara"}
      </div>

      {(transcript || response) && (
        <Card className="p-4 space-y-3 bg-muted/50">
          {transcript && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Anda berkata:</p>
              <p className="text-sm">{transcript}</p>
            </div>
          )}
          
          {transcript && response && (
            <div className="border-t border-border/50 my-2" />
          )}
          
          {response && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Asisten menjawab:</p>
              <p className="text-sm">{response}</p>
            </div>
          )}
        </Card>
      )}
    </Card>
  );
}
