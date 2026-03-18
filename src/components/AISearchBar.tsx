import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, Loader2, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AISearchBarProps {
  placeholder?: string;
  onResultsFound?: (results: any) => void;
  externalQuery?: string;
}

export default function AISearchBar({ placeholder = "Cari dengan AI di seluruh database...", onResultsFound, externalQuery }: AISearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [aiAnswer, setAiAnswer] = useState<{ question: string; answer: string } | null>(null);

  // Handle external query trigger (from voice commands)
  useEffect(() => {
    if (externalQuery && externalQuery.trim()) {
      setSearchQuery(externalQuery);
      handleAISearch(externalQuery);
    }
  }, [externalQuery]);

  const handleAISearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) {
      toast.error("Masukkan kata kunci pencarian");
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: { query: searchTerm }
      });

      if (error) throw error;

      // Set AI answer for display in header
      if (data.answer) {
        setAiAnswer({
          question: searchTerm,
          answer: data.answer
        });
      }

      setSearchResults(data);
      setShowResults(true);
      
      if (onResultsFound) {
        onResultsFound(data);
      }

      const total = (data.employees?.length || 0) + (data.assignments?.length || 0) + (data.plhKepala?.length || 0);
      if (total > 0) {
        toast.success(`Ditemukan ${total} hasil pencarian`);
      }
    } catch (error: any) {
      console.error('AI Search error:', error);
      toast.error(error.message || "Gagal melakukan pencarian AI");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAISearch();
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setAiAnswer(null);
    setSearchResults(null);
    setShowResults(false);
    toast.info("Pencarian direset");
  };

  return (
    <>
      <div className="space-y-3">
        <div className="relative flex gap-2 isolate">
          <div className="relative flex-1 isolate">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
            <Input
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-10 bg-white border-0 text-gray-900 placeholder:text-gray-500 relative z-0"
              disabled={isSearching}
          />
          <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-pulse z-10 pointer-events-none" />
        </div>
        {(searchQuery || aiAnswer) && (
          <Button 
            onClick={handleReset}
            variant="outline"
            size="icon"
            className="flex-shrink-0"
            title="Reset pencarian"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
        <Button 
          onClick={() => handleAISearch()}
          disabled={isSearching}
          className="gap-2 flex-shrink-0"
        >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mencari...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Cari AI
              </>
            )}
          </Button>
        </div>

        {aiAnswer && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 space-y-2 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setAiAnswer(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-start gap-2 pr-8">
              <div className="text-sm font-bold text-white bg-primary px-2 py-0.5 rounded">Pertanyaan:</div>
              <div className="text-sm flex-1 font-medium">{aiAnswer.question}</div>
            </div>
            <div className="flex items-start gap-2 pr-8">
              <div className="text-sm font-bold text-white bg-primary px-2 py-0.5 rounded">Jawaban:</div>
              <div className="text-sm flex-1 font-medium">{aiAnswer.answer}</div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Hasil Pencarian AI</DialogTitle>
            <DialogDescription>
              {searchResults?.summary || "Hasil pencarian untuk: " + searchQuery}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Pegawai Results */}
              {searchResults?.employees && searchResults.employees.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    Pegawai
                    <Badge>{searchResults.employees.length}</Badge>
                  </h3>
                  <div className="space-y-2">
                    {searchResults.employees.map((emp: any) => (
                      <div key={emp.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="font-medium">{emp.nm_pegawai}</div>
                        <div className="text-sm text-muted-foreground">
                          NIP: {emp.nip} | {emp.uraian_pangkat}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {emp.uraian_jabatan}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {emp.nm_unit_organisasi}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignments Results */}
              {searchResults?.assignments && searchResults.assignments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    Penugasan
                    <Badge>{searchResults.assignments.length}</Badge>
                  </h3>
                  <div className="space-y-2">
                    {searchResults.assignments.map((assignment: any) => (
                      <div key={assignment.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="font-medium">{assignment.perihal}</div>
                          <Badge variant="outline">#{assignment.agenda_number}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {assignment.tempat_penugasan} • {assignment.tanggal_mulai_kegiatan && new Date(assignment.tanggal_mulai_kegiatan).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PLH Kepala Results */}
              {searchResults?.plhKepala && searchResults.plhKepala.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    PLH Kepala
                    <Badge>{searchResults.plhKepala.length}</Badge>
                  </h3>
                  <div className="space-y-2">
                    {searchResults.plhKepala.map((plh: any) => (
                      <div key={plh.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="font-medium">{plh.perihal}</div>
                        <div className="text-sm text-muted-foreground">
                          {plh.nomor_naskah_dinas} • {new Date(plh.tanggal).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {(!searchResults?.employees || searchResults.employees.length === 0) &&
               (!searchResults?.assignments || searchResults.assignments.length === 0) &&
               (!searchResults?.plhKepala || searchResults.plhKepala.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada hasil yang ditemukan
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
