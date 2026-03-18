import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VoiceCommandSystemProps {
  onCommand: (command: string, params: any) => void;
  onSearch?: (query: string) => void;
}

export default function VoiceCommandSystem({ onCommand, onSearch }: VoiceCommandSystemProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast.error("Browser Anda tidak mendukung transkripsi suara");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        toast.info("Mendengarkan suara Anda...");
      };

      recognition.onresult = async (event: any) => {
        const transcribedText = event.results[0][0].transcript;
        setIsProcessing(true);
        
        if (!transcribedText) {
          toast.error("Tidak ada suara terdeteksi");
          setIsProcessing(false);
          return;
        }

        // Check for specific commands first
        const lowerTranscript = transcribedText.toLowerCase();
        let commandHandled = false;

        if (lowerTranscript.includes("buka dashboard") || lowerTranscript.includes("tampilkan dashboard")) {
          onCommand("navigate", { path: "/dashboard" });
          commandHandled = true;
        } else if (lowerTranscript.includes("buat penugasan") || lowerTranscript.includes("tambah penugasan")) {
          onCommand("open_assignment_dialog", {});
          commandHandled = true;
        } else if (lowerTranscript.includes("tambah pegawai") || lowerTranscript.includes("buat pegawai")) {
          onCommand("open_employee_dialog", {});
          commandHandled = true;
        } else if (lowerTranscript.includes("ekspor data") || lowerTranscript.includes("download data")) {
          onCommand("export_data", {});
          commandHandled = true;
        } else if (lowerTranscript.includes("cari")) {
          const searchTerm = lowerTranscript.replace(/cari|carikan|tolong cari/g, "").trim();
          if (onSearch) {
            onSearch(searchTerm);
          } else {
            onCommand("search", { term: searchTerm });
          }
          commandHandled = true;
        }

        // If no specific command, use AI assistant
        if (!commandHandled) {
          try {
            const { data: chatData, error: chatError } = await supabase.functions.invoke('voice-chat', {
              body: { message: transcribedText }
            });

            if (chatError) throw chatError;

            const aiResponse = chatData?.response || 'Maaf, saya tidak dapat memproses permintaan Anda.';
            speakResponse(aiResponse);
            toast.success("Asisten menjawab: " + aiResponse.substring(0, 100) + (aiResponse.length > 100 ? "..." : ""));
          } catch (error: any) {
            toast.error("Gagal mendapatkan respon AI");
          }
        }
        
        setIsProcessing(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast.error("Gagal mentranskripsikan audio");
        setIsRecording(false);
        setIsProcessing(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error: any) {
      toast.error("Gagal mengakses mikrofon: " + error.message);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
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

  return (
    <Button
      variant={isRecording ? "destructive" : "outline"}
      size="icon"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50"
      title="Asisten Suara AI"
    >
      {isProcessing ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : isRecording ? (
        <Square className="h-6 w-6 animate-pulse" />
      ) : (
        <Mic className="h-6 w-6" />
      )}
    </Button>
  );
}
