import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, isAdminRole } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageCircle, 
  Send, 
  HelpCircle, 
  Users, 
  Phone,
  Mail,
  Clock,
  CheckCircle,
  User,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Bot,
  UserRound,
  Mic,
  Square,
  PhoneCall
} from "lucide-react";

// Daftar tema kepegawaian
const TEMA_KEPEGAWAIAN = [
  "Kebutuhan Pegawai",
  "Pengadaan Pegawai", 
  "Pengenalan Budaya & Institusi",
  "Pangkat & Jabatan",
  "Perkawinan",
  "Perceraian",
  "Pengembangan Kompetensi",
  "Talenta & Promosi",
  "Mutasi",
  "Penghargaan",
  "Pembinaan",
  "Pemberhentian",
  "Grading",
  "Kenaikan Pangkat",
  "Absen",
  "Pengelolaan Kinerja",
  "P2KP",
  "Learning Organization",
  "Survey Kepuasan Pengguna Jasa",
  "Manajemen Risiko",
  "Layanan Perkantoran",
  "Kenaikan Gaji Berkala",
  "Aplikasi Kepegawaian",
  "Pembinaan Jabatan Fungsional",
  "KARIS/KARSU"
];

interface TimUpk {
  id: string;
  name: string;
  email: string;
  tugas: string | null;
  telepon: string | null;
  assignment_count: number;
}

interface FaqItem {
  id: string;
  kategori: string;
  pertanyaan: string;
  jawaban: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "agent" | "ai";
  message: string;
  timestamp: Date;
  agentName?: string;
}

export default function LiveChatSDM() {
  const { user, fullName, loading: authLoading, role } = useAuth();
  const isAdmin = isAdminRole(role);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedTema, setSelectedTema] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [chatMode, setChatMode] = useState<"ai" | "agent">("ai");

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceTranscriptions, setVoiceTranscriptions] = useState<{transcription: string; aiResponse?: string; timestamp: Date}[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Tim UPK state
  const [timUpkList, setTimUpkList] = useState<TimUpk[]>([]);
  const [loadingTimUpk, setLoadingTimUpk] = useState(true);
  const [showTimUpkDialog, setShowTimUpkDialog] = useState(false);
  const [editingTimUpk, setEditingTimUpk] = useState<TimUpk | null>(null);
  const [timUpkForm, setTimUpkForm] = useState({ name: "", email: "", tugas: "", telepon: "" });
  const [savingTimUpk, setSavingTimUpk] = useState(false);
  const [showDeleteTimUpkDialog, setShowDeleteTimUpkDialog] = useState(false);
  const [deletingTimUpkId, setDeletingTimUpkId] = useState<string | null>(null);

  // FAQ state
  const [faqList, setFaqList] = useState<FaqItem[]>([]);
  const [loadingFaq, setLoadingFaq] = useState(true);
  const [showFaqDialog, setShowFaqDialog] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqForm, setFaqForm] = useState({ kategori: "", pertanyaan: "", jawaban: "" });
  const [savingFaq, setSavingFaq] = useState(false);
  const [showDeleteFaqDialog, setShowDeleteFaqDialog] = useState(false);
  const [deletingFaqId, setDeletingFaqId] = useState<string | null>(null);

  // Fetch Tim UPK from database
  useEffect(() => {
    fetchTimUpk();
    fetchFaq();
  }, []);

  const fetchTimUpk = async () => {
    try {
      setLoadingTimUpk(true);
      const { data, error } = await supabase
        .from("tim_upk")
        .select("*")
        .order("name");
      
      if (error) throw error;
      setTimUpkList(data || []);
    } catch (error: any) {
      console.error("Error fetching tim_upk:", error);
      toast.error("Gagal memuat data Tim UPK");
    } finally {
      setLoadingTimUpk(false);
    }
  };

  const fetchFaq = async () => {
    try {
      setLoadingFaq(true);
      const { data, error } = await supabase
        .from("faq_sdm")
        .select("*")
        .order("kategori");
      
      if (error) throw error;
      setFaqList(data || []);
    } catch (error: any) {
      console.error("Error fetching faq:", error);
      toast.error("Gagal memuat data FAQ");
    } finally {
      setLoadingFaq(false);
    }
  };

  // Tim UPK CRUD handlers
  const handleAddTimUpk = () => {
    setEditingTimUpk(null);
    setTimUpkForm({ name: "", email: "", tugas: "", telepon: "" });
    setShowTimUpkDialog(true);
  };

  const handleEditTimUpk = (upk: TimUpk) => {
    setEditingTimUpk(upk);
    setTimUpkForm({
      name: upk.name,
      email: upk.email,
      tugas: upk.tugas || "",
      telepon: upk.telepon || ""
    });
    setShowTimUpkDialog(true);
  };

  const handleSaveTimUpk = async () => {
    if (!timUpkForm.name || !timUpkForm.email) {
      toast.error("Nama dan email wajib diisi");
      return;
    }

    try {
      setSavingTimUpk(true);
      
      if (editingTimUpk) {
        const { error } = await supabase
          .from("tim_upk")
          .update({
            name: timUpkForm.name,
            email: timUpkForm.email,
            tugas: timUpkForm.tugas || null,
            telepon: timUpkForm.telepon || null
          })
          .eq("id", editingTimUpk.id);
        
        if (error) throw error;
        toast.success("Data Tim UPK berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("tim_upk")
          .insert({
            name: timUpkForm.name,
            email: timUpkForm.email,
            tugas: timUpkForm.tugas || null,
            telepon: timUpkForm.telepon || null
          });
        
        if (error) throw error;
        toast.success("Anggota Tim UPK berhasil ditambahkan");
      }

      setShowTimUpkDialog(false);
      fetchTimUpk();
    } catch (error: any) {
      console.error("Error saving tim_upk:", error);
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setSavingTimUpk(false);
    }
  };

  const handleDeleteTimUpk = async () => {
    if (!deletingTimUpkId) return;

    try {
      const { error } = await supabase
        .from("tim_upk")
        .delete()
        .eq("id", deletingTimUpkId);
      
      if (error) throw error;
      toast.success("Anggota Tim UPK berhasil dihapus");
      setShowDeleteTimUpkDialog(false);
      setDeletingTimUpkId(null);
      fetchTimUpk();
    } catch (error: any) {
      console.error("Error deleting tim_upk:", error);
      toast.error(error.message || "Gagal menghapus data");
    }
  };

  // FAQ CRUD handlers
  const handleAddFaq = () => {
    setEditingFaq(null);
    setFaqForm({ kategori: "", pertanyaan: "", jawaban: "" });
    setShowFaqDialog(true);
  };

  const handleEditFaq = (faq: FaqItem) => {
    setEditingFaq(faq);
    setFaqForm({
      kategori: faq.kategori,
      pertanyaan: faq.pertanyaan,
      jawaban: faq.jawaban
    });
    setShowFaqDialog(true);
  };

  const handleSaveFaq = async () => {
    if (!faqForm.kategori || !faqForm.pertanyaan || !faqForm.jawaban) {
      toast.error("Semua field wajib diisi");
      return;
    }

    try {
      setSavingFaq(true);
      
      if (editingFaq) {
        const { error } = await supabase
          .from("faq_sdm")
          .update({
            kategori: faqForm.kategori,
            pertanyaan: faqForm.pertanyaan,
            jawaban: faqForm.jawaban
          })
          .eq("id", editingFaq.id);
        
        if (error) throw error;
        toast.success("FAQ berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("faq_sdm")
          .insert({
            kategori: faqForm.kategori,
            pertanyaan: faqForm.pertanyaan,
            jawaban: faqForm.jawaban
          });
        
        if (error) throw error;
        toast.success("FAQ berhasil ditambahkan");
      }

      setShowFaqDialog(false);
      fetchFaq();
    } catch (error: any) {
      console.error("Error saving faq:", error);
      toast.error(error.message || "Gagal menyimpan FAQ");
    } finally {
      setSavingFaq(false);
    }
  };

  const handleDeleteFaq = async () => {
    if (!deletingFaqId) return;

    try {
      const { error } = await supabase
        .from("faq_sdm")
        .delete()
        .eq("id", deletingFaqId);
      
      if (error) throw error;
      toast.success("FAQ berhasil dihapus");
      setShowDeleteFaqDialog(false);
      setDeletingFaqId(null);
      fetchFaq();
    } catch (error: any) {
      console.error("Error deleting faq:", error);
      toast.error(error.message || "Gagal menghapus FAQ");
    }
  };

  // Group FAQ by kategori
  const groupedFaq = faqList.reduce((acc, faq) => {
    if (!acc[faq.kategori]) {
      acc[faq.kategori] = [];
    }
    acc[faq.kategori].push(faq);
    return acc;
  }, {} as Record<string, FaqItem[]>);

  // Voice recording functions
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processVoiceRecording(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Perekaman dimulai...");
    } catch (error: any) {
      console.error("Error starting recording:", error);
      toast.error("Gagal mengakses mikrofon: " + error.message);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceRecording = async (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('transcribe-voice', {
          body: { audio: base64Audio, action: 'respond' }
        });

        if (error) throw error;

        if (data.transcription) {
          setVoiceTranscriptions(prev => [...prev, {
            transcription: data.transcription,
            aiResponse: data.aiResponse,
            timestamp: new Date()
          }]);
          toast.success("Transkripsi berhasil!");
        } else if (data.error) {
          toast.error(data.error);
        }
      };
    } catch (error: any) {
      console.error("Error processing voice:", error);
      toast.error("Gagal memproses rekaman suara");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Redirect if not logged in
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const getAssignedAgent = (tema: string) => {
    const agent = timUpkList.find(p => 
      p.tugas && tema.toLowerCase().includes(p.tugas.toLowerCase())
    );
    return agent || timUpkList[0]; 
  };

  const getFaqContext = () => {
    const relevantFaqs = faqList.filter(faq => 
      faq.kategori.toLowerCase().includes(selectedTema.toLowerCase()) ||
      selectedTema.toLowerCase().includes(faq.kategori.toLowerCase())
    );
    
    if (relevantFaqs.length === 0) return "";
    
    return relevantFaqs.map(faq => 
      `Q: ${faq.pertanyaan}\nA: ${faq.jawaban}`
    ).join("\n\n");
  };

  const handleStartChat = () => {
    if (!selectedTema) {
      toast.error("Pilih tema terlebih dahulu");
      return;
    }

    setChatStarted(true);
    setChatMode("ai");
    
    const welcomeMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "ai",
      message: `Halo! Saya adalah Asisten AI Tim UPK. Saya siap membantu menjawab pertanyaan Anda seputar ${selectedTema}. Jika jawaban saya kurang memuaskan, Anda dapat langsung terhubung dengan Agent kami.`,
      timestamp: new Date(),
      agentName: "AI Assistant"
    };
    setMessages([welcomeMsg]);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    setIsSending(true);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      message: chatMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    const messageToSend = chatMessage;
    setChatMessage("");

    if (chatMode === "ai") {
      try {
        const { data, error } = await supabase.functions.invoke('sdm-chat', {
          body: { 
            message: messageToSend, 
            tema: selectedTema,
            faqContext: getFaqContext()
          }
        });

        if (error) throw error;

        if (data.needsAgent) {
          switchToAgent();
        } else {
          const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: "ai",
            message: data.response,
            timestamp: new Date(),
            agentName: "AI Assistant"
          };
          setMessages(prev => [...prev, aiMsg]);
        }
      } catch (error: any) {
        console.error("AI chat error:", error);
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          message: "Maaf, terjadi kesalahan. Saya akan menghubungkan Anda dengan Agent.",
          timestamp: new Date(),
          agentName: "AI Assistant"
        };
        setMessages(prev => [...prev, errorMsg]);
        setTimeout(() => switchToAgent(), 1500);
      }
    } else {
      // Agent mode - simulate response
      setTimeout(() => {
        const agent = getAssignedAgent(selectedTema);
        const agentMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "agent",
          message: `Terima kasih atas pertanyaan Anda. Saya akan segera memproses permintaan terkait ${selectedTema}.${agent?.telepon ? ` Hubungi saya di ${agent.telepon} untuk respon lebih cepat.` : ''}`,
          timestamp: new Date(),
          agentName: agent?.name
        };
        setMessages(prev => [...prev, agentMsg]);
        setIsSending(false);
      }, 1500);
      return;
    }

    setIsSending(false);
  };

  const switchToAgent = () => {
    setChatMode("agent");
    const agent = getAssignedAgent(selectedTema);
    const switchMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "agent",
      message: `Anda sekarang terhubung dengan ${agent?.name || 'Agent Tim UPK'}${agent?.tugas ? ` (${agent.tugas})` : ''}. Silakan sampaikan pertanyaan Anda.`,
      timestamp: new Date(),
      agentName: agent?.name
    };
    setMessages(prev => [...prev, switchMsg]);
    toast.info(`Terhubung dengan Agent: ${agent?.name || 'Tim UPK'}`);
  };

  const handleResetChat = () => {
    setChatStarted(false);
    setMessages([]);
    setSelectedTema("");
    setChatMode("ai");
  };

  return (
    <AppLayout breadcrumbs={[{ label: "Beranda", path: "/" }, { label: "Live Chat SDM" }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Live Chat SDM</h1>
          <p className="text-muted-foreground">Hubungi Tim UPK untuk pertanyaan seputar kepegawaian</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat">
              <MessageCircle className="w-4 h-4 mr-2" />
              Live Chat
            </TabsTrigger>
            <TabsTrigger value="voice">
              <PhoneCall className="w-4 h-4 mr-2" />
              Voice Call
            </TabsTrigger>
            <TabsTrigger value="faq">
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="tim-upk">
              <Users className="w-4 h-4 mr-2" />
              Pembagian Tugas
            </TabsTrigger>
          </TabsList>

          {/* Live Chat Tab */}
          <TabsContent value="chat" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat Area */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Chat dengan Tim UPK
                  </CardTitle>
                  <CardDescription>
                    Pertanyaan akan dijawab oleh AI, jika tidak puas bisa langsung ke Agent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!chatStarted ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Pilih Tema Kepegawaian *</Label>
                        <Select value={selectedTema} onValueChange={setSelectedTema}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tema..." />
                          </SelectTrigger>
                          <SelectContent>
                            {TEMA_KEPEGAWAIAN.map(tema => (
                              <SelectItem key={tema} value={tema}>{tema}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedTema && (
                        <div className="p-4 bg-muted rounded-lg space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Bot className="h-4 w-4 text-primary" />
                            <span>AI Assistant akan menjawab pertanyaan Anda terlebih dahulu</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <UserRound className="h-4 w-4" />
                            <span>Jika tidak puas, akan dihubungkan ke Agent: {getAssignedAgent(selectedTema)?.name || 'Tim UPK'}</span>
                          </div>
                        </div>
                      )}

                      <Button onClick={handleStartChat} className="w-full" disabled={!selectedTema || timUpkList.length === 0}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Mulai Chat
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Chat Header */}
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${chatMode === 'ai' ? 'bg-blue-500/20' : 'bg-primary/20'}`}>
                            {chatMode === 'ai' ? (
                              <Bot className="h-5 w-5 text-blue-500" />
                            ) : (
                              <User className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {chatMode === 'ai' ? 'AI Assistant' : getAssignedAgent(selectedTema)?.name}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {selectedTema}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {chatMode === 'ai' && (
                            <Button variant="outline" size="sm" onClick={switchToAgent}>
                              <UserRound className="h-4 w-4 mr-1" />
                              Hubungi Agent
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={handleResetChat}>
                            Akhiri Chat
                          </Button>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="h-[400px] overflow-y-auto border rounded-lg p-4 space-y-4">
                        {messages.map(msg => (
                          <div 
                            key={msg.id} 
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div 
                              className={`max-w-[80%] p-3 rounded-lg ${
                                msg.sender === "user" 
                                  ? "bg-primary text-primary-foreground" 
                                  : msg.sender === "ai"
                                    ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                    : "bg-muted"
                              }`}
                            >
                              {msg.sender !== "user" && (
                                <div className="flex items-center gap-1 mb-1">
                                  {msg.sender === "ai" ? (
                                    <Bot className="h-3 w-3 text-blue-500" />
                                  ) : (
                                    <User className="h-3 w-3" />
                                  )}
                                  <p className="text-xs font-medium">{msg.agentName}</p>
                                </div>
                              )}
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {msg.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))}
                        {isSending && (
                          <div className="flex justify-start">
                            <div className="bg-muted p-3 rounded-lg">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Input */}
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Ketik pesan..." 
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        />
                        <Button onClick={handleSendMessage} disabled={isSending || !chatMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sidebar Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Layanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Jam Layanan</p>
                      <p className="text-xs text-muted-foreground">Senin - Jumat: 08:00 - 16:00</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Status</p>
                      <p className="text-xs text-green-600">Tim UPK Online</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Kontak Alternatif:</p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> (031) 1234567
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> upk@djbc.go.id
                      </p>
                    </div>
                  </div>
                  
                  {/* Tim UPK Members */}
                  {timUpkList.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-3">Anggota Tim UPK:</p>
                      <div className="space-y-3 max-h-[200px] overflow-y-auto">
                        {timUpkList.slice(0, 5).map((upk) => (
                          <div key={upk.id} className="flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-xs truncate">{upk.name}</p>
                              {upk.tugas && (
                                <Badge variant="outline" className="text-[10px] px-1">
                                  {upk.tugas}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        {timUpkList.length > 5 && (
                          <p className="text-xs text-muted-foreground">
                            + {timUpkList.length - 5} anggota lainnya
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Voice Call Tab */}
          <TabsContent value="voice" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PhoneCall className="h-5 w-5" />
                  Transkripsi Panggilan Suara
                </CardTitle>
                <CardDescription>
                  Rekam suara panggilan telepon dan dapatkan transkripsi serta jawaban AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Recording Control */}
                  <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                      isRecording ? 'bg-red-500 animate-pulse' : 'bg-primary/20'
                    }`}>
                      {isProcessingVoice ? (
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      ) : isRecording ? (
                        <Mic className="h-10 w-10 text-white" />
                      ) : (
                        <Mic className="h-10 w-10 text-primary" />
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className="font-medium">
                        {isProcessingVoice ? 'Memproses rekaman...' : isRecording ? 'Merekam...' : 'Siap merekam'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isRecording ? 'Klik tombol untuk berhenti' : 'Klik tombol untuk mulai merekam'}
                      </p>
                    </div>

                    <Button 
                      size="lg"
                      variant={isRecording ? "destructive" : "default"}
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      disabled={isProcessingVoice}
                    >
                      {isRecording ? (
                        <>
                          <Square className="h-5 w-5 mr-2" />
                          Berhenti Merekam
                        </>
                      ) : (
                        <>
                          <Mic className="h-5 w-5 mr-2" />
                          Mulai Merekam
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Transcription Results */}
                  {voiceTranscriptions.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-medium">Hasil Transkripsi</h3>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {voiceTranscriptions.map((item, index) => (
                          <Card key={index} className="border">
                            <CardContent className="pt-4 space-y-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Mic className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {item.timestamp.toLocaleTimeString("id-ID")}
                                  </span>
                                </div>
                                <p className="text-sm bg-muted p-2 rounded">{item.transcription}</p>
                              </div>
                              {item.aiResponse && (
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Bot className="h-4 w-4 text-blue-500" />
                                    <span className="text-xs text-blue-500">Jawaban AI</span>
                                  </div>
                                  <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
                                    {item.aiResponse}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5" />
                      Frequently Asked Questions
                    </CardTitle>
                    <CardDescription>
                      Temukan jawaban untuk pertanyaan umum seputar kepegawaian
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <Button onClick={handleAddFaq}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah FAQ
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingFaq ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : faqList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada FAQ</p>
                    {isAdmin && (
                      <Button variant="outline" className="mt-4" onClick={handleAddFaq}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah FAQ Pertama
                      </Button>
                    )}
                  </div>
                ) : (
                  Object.entries(groupedFaq).map(([kategori, faqs], idx) => (
                    <div key={idx} className="mb-6">
                      <h3 className="font-semibold text-lg mb-3">{kategori}</h3>
                      <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, faqIdx) => (
                          <AccordionItem key={faq.id} value={faq.id}>
                            <AccordionTrigger className="text-left">
                              <div className="flex-1 pr-4">{faq.pertanyaan}</div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="pb-2">
                                {faq.jawaban}
                              </div>
                              {isAdmin && (
                                <div className="flex gap-2 pt-2 border-t">
                                  <Button size="sm" variant="outline" onClick={() => handleEditFaq(faq)}>
                                    <Pencil className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={() => {
                                      setDeletingFaqId(faq.id);
                                      setShowDeleteFaqDialog(true);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Hapus
                                  </Button>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tim UPK Tab */}
          <TabsContent value="tim-upk" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Pembagian Tugas Tim UPK
                    </CardTitle>
                    <CardDescription>
                      Daftar petugas dan bidang tugas masing-masing
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <Button onClick={handleAddTimUpk}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Tugas Tim UPK
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingTimUpk ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : timUpkList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada data Tim UPK</p>
                    {isAdmin && (
                      <Button variant="outline" className="mt-4" onClick={handleAddTimUpk}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Anggota Pertama
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {timUpkList.map((petugas) => (
                      <Card key={petugas.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="h-7 w-7 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{petugas.name}</h4>
                              {petugas.tugas && (
                                <Badge variant="secondary">{petugas.tugas}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" /> {petugas.email}
                            </p>
                            {petugas.telepon && (
                              <p className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4" /> {petugas.telepon}
                              </p>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="flex gap-2 mt-4 pt-4 border-t">
                              <Button size="sm" variant="outline" onClick={() => handleEditTimUpk(petugas)}>
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => {
                                  setDeletingTimUpkId(petugas.id);
                                  setShowDeleteTimUpkDialog(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Hapus
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Tim UPK Dialog */}
      <Dialog open={showTimUpkDialog} onOpenChange={setShowTimUpkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTimUpk ? "Edit Anggota Tim UPK" : "Tambah Anggota Tim UPK"}</DialogTitle>
            <DialogDescription>
              {editingTimUpk ? "Perbarui data anggota Tim UPK" : "Tambahkan anggota baru ke Tim UPK"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="upk-name">Nama *</Label>
              <Input
                id="upk-name"
                value={timUpkForm.name}
                onChange={(e) => setTimUpkForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Masukkan nama"
              />
            </div>
            <div>
              <Label htmlFor="upk-email">Email *</Label>
              <Input
                id="upk-email"
                type="email"
                value={timUpkForm.email}
                onChange={(e) => setTimUpkForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@kemenkeu.go.id"
              />
            </div>
            <div>
              <Label htmlFor="upk-tugas">Bidang Tugas</Label>
              <Select 
                value={timUpkForm.tugas} 
                onValueChange={(value) => setTimUpkForm(prev => ({ ...prev, tugas: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bidang tugas..." />
                </SelectTrigger>
                <SelectContent>
                  {TEMA_KEPEGAWAIAN.map(tema => (
                    <SelectItem key={tema} value={tema}>{tema}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="upk-telepon">Telepon</Label>
              <Input
                id="upk-telepon"
                value={timUpkForm.telepon}
                onChange={(e) => setTimUpkForm(prev => ({ ...prev, telepon: e.target.value }))}
                placeholder="081234567890"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimUpkDialog(false)} disabled={savingTimUpk}>
              Batal
            </Button>
            <Button onClick={handleSaveTimUpk} disabled={savingTimUpk}>
              {savingTimUpk ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingTimUpk ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ Dialog */}
      <Dialog open={showFaqDialog} onOpenChange={setShowFaqDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFaq ? "Edit FAQ" : "Tambah FAQ"}</DialogTitle>
            <DialogDescription>
              {editingFaq ? "Perbarui pertanyaan dan jawaban" : "Tambahkan pertanyaan baru yang sering ditanyakan"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="faq-kategori">Kategori *</Label>
              <Select 
                value={faqForm.kategori} 
                onValueChange={(value) => setFaqForm(prev => ({ ...prev, kategori: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori..." />
                </SelectTrigger>
                <SelectContent>
                  {TEMA_KEPEGAWAIAN.map(tema => (
                    <SelectItem key={tema} value={tema}>{tema}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="faq-pertanyaan">Pertanyaan *</Label>
              <Textarea
                id="faq-pertanyaan"
                value={faqForm.pertanyaan}
                onChange={(e) => setFaqForm(prev => ({ ...prev, pertanyaan: e.target.value }))}
                placeholder="Masukkan pertanyaan yang sering ditanyakan"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="faq-jawaban">Jawaban *</Label>
              <Textarea
                id="faq-jawaban"
                value={faqForm.jawaban}
                onChange={(e) => setFaqForm(prev => ({ ...prev, jawaban: e.target.value }))}
                placeholder="Masukkan jawaban untuk pertanyaan tersebut"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFaqDialog(false)} disabled={savingFaq}>
              Batal
            </Button>
            <Button onClick={handleSaveFaq} disabled={savingFaq}>
              {savingFaq ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingFaq ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tim UPK Confirmation Dialog */}
      <Dialog open={showDeleteTimUpkDialog} onOpenChange={setShowDeleteTimUpkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus anggota Tim UPK ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteTimUpkDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteTimUpk}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete FAQ Confirmation Dialog */}
      <Dialog open={showDeleteFaqDialog} onOpenChange={setShowDeleteFaqDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus FAQ</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus FAQ ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteFaqDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteFaq}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
