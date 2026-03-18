import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, LogOut, ChevronLeft, ChevronRight, Download, ExternalLink, BookOpen, Maximize2, Minimize2, Volume2, VolumeX, Loader2 } from "lucide-react";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import NotificationBell from "@/components/NotificationBell";
import FloatingVoiceAssistant from "@/components/FloatingVoiceAssistant";
import { Document, Page, pdfjs } from 'react-pdf';
import { toast } from "sonner";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const books = [
  {
    id: 1,
    title: "Buku Manajemen ASN",
    description: "Rangkuman lengkap berdasarkan UU ASN 2023 & PP 11 Tahun 2017",
    file: "/documents/Buku_Manajemen_ASN.pdf",
    cover: "📘"
  },
  {
    id: 2,
    title: "Tutorial Uang Makan",
    description: "Panduan langkah-langkah pengajuan uang makan pegawai",
    file: "/documents/Langkah_Uang_Makan.pdf",
    cover: "🍽️"
  }
];

const references = [
  {
    title: "UU Nomor 20 Tahun 2023",
    subtitle: "Undang-Undang tentang Aparatur Sipil Negara",
    file: "/documents/UU_Nomor_20_Tahun_2023.pdf",
    icon: "📜"
  },
  {
    title: "PP 11 Tahun 2017",
    subtitle: "Peraturan Pemerintah tentang Manajemen PNS",
    file: "/documents/PP_11_TAHUN_2017.pdf",
    icon: "📋"
  }
];

export default function EbookPage() {
  const { user, fullName, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedBook, setSelectedBook] = useState<typeof books[0] | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState<boolean>(false);
  const [extractedText, setExtractedText] = useState<{ [key: number]: string }>({});
  const pdfDocRef = useRef<any>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset * 2;
      return Math.max(1, Math.min(newPage, numPages));
    });
  };

  const goToFirstPage = () => setPageNumber(1);
  const goToLastPage = () => setPageNumber(numPages - 1);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Text-to-Speech function using browser's Speech Synthesis API
  const handleTextToSpeech = async () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setIsLoadingTTS(true);

    try {
      // Get the PDF document
      const loadingTask = pdfjs.getDocument(selectedBook?.file || '');
      const pdf = await loadingTask.promise;
      
      // Extract text from current pages (left and right)
      let fullText = '';
      
      const leftPage = await pdf.getPage(pageNumber);
      const leftTextContent = await leftPage.getTextContent();
      fullText += leftTextContent.items.map((item: any) => item.str).join(' ');
      
      if (pageNumber + 1 <= numPages) {
        const rightPage = await pdf.getPage(pageNumber + 1);
        const rightTextContent = await rightPage.getTextContent();
        fullText += ' ' + rightTextContent.items.map((item: any) => item.str).join(' ');
      }

      if (!fullText.trim()) {
        toast.error("Tidak ada teks yang dapat dibaca pada halaman ini");
        setIsLoadingTTS(false);
        return;
      }

      // Use browser's Speech Synthesis API
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      // Get Indonesian voice if available
      const voices = window.speechSynthesis.getVoices();
      const indonesianVoice = voices.find(voice => voice.lang.includes('id'));
      if (indonesianVoice) {
        utterance.voice = indonesianVoice;
      }

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        toast.error("Gagal memutar audio");
      };

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      toast.success("Memulai Text-to-Speech untuk halaman ini");
    } catch (error) {
      console.error('TTS error:', error);
      toast.error("Gagal mengekstrak teks dari halaman");
    } finally {
      setIsLoadingTTS(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-lg">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <img src={logoKemenkeu} alt="Kementerian Keuangan" className="h-14 w-auto drop-shadow-lg" />
              <img src={logoCustoms} alt="Customs" className="h-12 w-auto drop-shadow-lg" />
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  eBook Manajemen ASN
                </h1>
                <p className="text-sm text-blue-100">Perpustakaan Digital Peraturan ASN</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{fullName}</p>
                <p className="text-xs text-blue-100">{role === "admin" ? "Administrator" : role === "overview" ? "Overview" : "Pengguna"}</p>
              </div>
              <NotificationBell />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/")}
                className="text-white hover:bg-white/20 gap-2"
              >
                <Home className="h-5 w-5" />
                Beranda
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={signOut}
                className="text-white hover:bg-white/20"
                title="Keluar"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {!selectedBook ? (
          <div className="space-y-6">
            {/* Main Books Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📚 Koleksi eBook</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book) => (
                  <Card 
                    key={book.id}
                    className="hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200"
                    onClick={() => setSelectedBook(book)}
                  >
                    <CardContent className="p-6">
                      <div className="text-6xl mb-4 text-center">{book.cover}</div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{book.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{book.description}</p>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">
                        Baca Sekarang
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* References Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📖 Referensi Peraturan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {references.map((ref, index) => (
                  <Card 
                    key={index}
                    className="hover:shadow-lg transition-all duration-300 bg-white border border-gray-200"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{ref.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 mb-1">{ref.title}</h3>
                          <p className="text-sm text-gray-600 mb-4">{ref.subtitle}</p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = ref.file;
                                link.download = ref.file.split('/').pop() || 'download.pdf';
                                link.click();
                              }}
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                            <Button 
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                // Find the book object for this reference
                                const bookForRef = {
                                  id: 999,
                                  title: ref.title,
                                  description: ref.subtitle,
                                  file: ref.file,
                                  cover: ref.icon
                                };
                                setSelectedBook(bookForRef);
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                              Buka
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back Button */}
            <Button 
              variant="outline"
              onClick={() => setSelectedBook(null)}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali ke Daftar
            </Button>

            {/* Book-style PDF Viewer */}
            <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-stone-800 p-4' : ''}`}>
              {/* Controls Header */}
              <div className={`flex items-center justify-between mb-4 ${isFullscreen ? 'text-white' : ''}`}>
                <h2 className={`text-xl font-serif italic ${isFullscreen ? 'text-amber-100' : 'text-amber-900'}`}>
                  {selectedBook.title}
                </h2>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-serif ${isFullscreen ? 'text-amber-200' : 'text-amber-800'}`}>
                    Halaman {pageNumber}-{Math.min(pageNumber + 1, numPages)} dari {numPages}
                  </span>
                  <Button
                    size="sm"
                    variant={isFullscreen ? "secondary" : "outline"}
                    onClick={toggleFullscreen}
                    className="gap-2"
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize2 className="w-4 h-4" />
                        Keluar
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-4 h-4" />
                        Fullscreen
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className={`flex items-center justify-center gap-4 mb-4 p-3 rounded-lg ${isFullscreen ? 'bg-stone-700' : 'bg-amber-100/50'}`}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToFirstPage}
                  disabled={pageNumber <= 1}
                  className="font-serif"
                >
                  Pertama
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => changePage(-1)}
                  disabled={pageNumber <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setScale(Math.max(0.6, scale - 0.1))}
                  >
                    -
                  </Button>
                  <span className={`text-sm font-serif min-w-[60px] text-center ${isFullscreen ? 'text-amber-200' : ''}`}>
                    {Math.round(scale * 100)}%
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setScale(Math.min(2, scale + 0.1))}
                  >
                    +
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => changePage(1)}
                  disabled={pageNumber >= numPages - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToLastPage}
                  disabled={pageNumber >= numPages - 1}
                  className="font-serif"
                >
                  Terakhir
                </Button>
                <div className="border-l border-amber-300 h-6 mx-2" />
                <Button
                  size="sm"
                  variant={isSpeaking ? "default" : "outline"}
                  onClick={handleTextToSpeech}
                  disabled={isLoadingTTS}
                  className={`gap-2 ${isSpeaking ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                  title={isSpeaking ? "Hentikan Audio" : "Text-to-Voice AI"}
                >
                  {isLoadingTTS ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSpeaking ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  {isSpeaking ? "Stop" : "Voice AI"}
                </Button>
              </div>

              {/* Book Container */}
              <div className={`flex justify-center items-center ${isFullscreen ? 'h-[calc(100vh-160px)]' : 'max-h-[75vh]'} overflow-auto`}>
                <div className="relative perspective-[2000px]">
                  {/* Book wrapper with 3D effect */}
                  <div 
                    className="relative flex shadow-2xl"
                    style={{
                      background: 'linear-gradient(90deg, #8B4513 0%, #654321 2%, #8B4513 3%, transparent 3%)',
                    }}
                  >
                    {/* Book spine shadow */}
                    <div 
                      className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 z-10 pointer-events-none"
                      style={{
                        background: 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.3) 100%)',
                      }}
                    />
                    
                    <Document
                      file={selectedBook.file}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={
                        <div className="flex items-center justify-center h-96 w-[600px] bg-amber-50">
                          <p className="text-amber-800 font-serif italic">Membuka buku...</p>
                        </div>
                      }
                      error={
                        <div className="flex items-center justify-center h-96 w-[600px] bg-amber-50">
                          <p className="text-red-800 font-serif">Gagal memuat buku. Silakan coba lagi.</p>
                        </div>
                      }
                    >
                      <div className="flex">
                        {/* Left Page */}
                        <div 
                          className="relative overflow-hidden"
                          style={{
                            background: 'linear-gradient(to right, #f5f0e6 0%, #faf6ed 10%, #fdfbf7 100%)',
                            boxShadow: 'inset -10px 0 30px -10px rgba(0,0,0,0.15)',
                          }}
                        >
                          {/* Paper texture overlay */}
                          <div 
                            className="absolute inset-0 pointer-events-none opacity-30"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
                            }}
                          />
                          <div className="p-2">
                            <Page 
                              pageNumber={pageNumber} 
                              scale={scale}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                              className="[&_canvas]:!bg-transparent"
                            />
                          </div>
                          {/* Page edge effect */}
                          <div 
                            className="absolute right-0 top-0 bottom-0 w-2"
                            style={{
                              background: 'linear-gradient(to left, rgba(0,0,0,0.1), transparent)',
                            }}
                          />
                        </div>
                        
                        {/* Right Page */}
                        {pageNumber < numPages && (
                          <div 
                            className="relative overflow-hidden"
                            style={{
                              background: 'linear-gradient(to left, #f5f0e6 0%, #faf6ed 10%, #fdfbf7 100%)',
                              boxShadow: 'inset 10px 0 30px -10px rgba(0,0,0,0.15)',
                            }}
                          >
                            {/* Paper texture overlay */}
                            <div 
                              className="absolute inset-0 pointer-events-none opacity-30"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
                              }}
                            />
                            <div className="p-2">
                              <Page 
                                pageNumber={pageNumber + 1} 
                                scale={scale}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="[&_canvas]:!bg-transparent"
                              />
                            </div>
                            {/* Page edge effect */}
                            <div 
                              className="absolute left-0 top-0 bottom-0 w-2"
                              style={{
                                background: 'linear-gradient(to right, rgba(0,0,0,0.1), transparent)',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </Document>
                    
                    {/* Book binding decoration - top */}
                    <div 
                      className="absolute left-1/2 -ml-1 top-0 w-2 h-full pointer-events-none"
                      style={{
                        background: 'linear-gradient(90deg, #5D4037 0%, #795548 50%, #5D4037 100%)',
                      }}
                    />
                  </div>
                  
                  {/* Book shadow */}
                  <div 
                    className="absolute -bottom-4 left-4 right-4 h-6 -z-10"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%)',
                      filter: 'blur(4px)',
                    }}
                  />
                </div>
              </div>

              {/* Page indicator at bottom */}
              <div className={`text-center mt-4 font-serif italic text-sm ${isFullscreen ? 'text-amber-200' : 'text-amber-700'}`}>
                "Ilmu adalah cahaya yang menerangi jalan kebijaksanaan"
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Voice Assistant */}
      <FloatingVoiceAssistant />
    </div>
  );
}