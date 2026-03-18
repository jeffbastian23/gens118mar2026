import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Frown, Meh, Smile, Laugh } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisitorFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRating?: number | null;
  currentComment?: string | null;
  onSubmit: (rating: number, comment?: string, surveyData?: SurveyData) => void;
  visitorData?: {
    jenis_kelamin?: string | null;
    pilihan_kantor?: string | null;
    id?: string;
  };
}

interface SurveyData {
  pendidikan: string;
  layanan: string;
  jenis_kelamin: string;
  pilihan_kantor: string;
  survey_responses: Record<string, number>;
}

const PENDIDIKAN_OPTIONS = ["SD", "SLTP", "SLTA", "DI", "DIII", "S1", "S2", "S3"];

const LAYANAN_OPTIONS = [
  "Layanan KITE",
  "Layanan Tempat Penimbunan Berikat",
  "Layanan Kepabeanan Lainnya",
  "Layanan Cukai",
  "Layanan Umum Lainnya"
];

const SURVEY_QUESTIONS = [
  { id: "q1", text: "a. Terdapat kejelasan persyaratan (kelengkapan dokumen yang dipersyaratkan) atas jenis layanan yang Anda ajukan." },
  { id: "q2", text: "b. Prosedur atas jenis layanan yang Anda ajukan, mudah dipahami." },
  { id: "q3", text: "c. Petugas layanan sigap dan cepat tanggap dalam memberikan layanan yang Anda ajukan." },
  { id: "q4", text: "d. Petugas layanan kompeten dan profesional dalam memberikan pelayanan." },
  { id: "q5", text: "e. Petugas layanan sopan dan ramah dalam memberikan pelayanan." },
  { id: "q6", text: "f. Sarana dan Prasarana (Toilet, Ruang Tunggu, Area Parkir, dsb) sangat baik dan mendukung layanan." },
  { id: "q7", text: "g. Tidak terdapat biaya yang dipungut atas jenis layanan yang Anda ajukan. (Seluruh Layanan pada Kanwil DJBC Jawa Timur I/ KPPBC TMP B Sidoarjo pada dasarnya tidak dipungut biaya, terkecuali yang telah diatur melalui Ketentuan Terkait)." },
  { id: "q8", text: "h. Produk layanan (output) yang tercantum dalam standar pelayanan sesuai dengan hasil (kenyataan) layanan yang diberikan." },
  { id: "q9", text: "i. Informasi mengenai pelayanan pengaduan dapat diakses dengan baik." }
];

const RATING_OPTIONS = [
  { value: 1, label: "1. Sangat Tidak Setuju Sekali" },
  { value: 2, label: "2. Sangat Tidak Setuju" },
  { value: 3, label: "3. Tidak Setuju" },
  { value: 4, label: "4. Ragu – Ragu" },
  { value: 5, label: "5. Cukup Setuju" },
  { value: 6, label: "6. Setuju" },
  { value: 7, label: "7. Sangat Setuju" },
  { value: 8, label: "8. Sangat Setuju Sekali" }
];

const ratingOptions = [
  { value: 2, icon: Frown, label: "Buruk", color: "text-orange-500 hover:bg-orange-50" },
  { value: 3, icon: Meh, label: "Cukup", color: "text-yellow-500 hover:bg-yellow-50" },
  { value: 4, icon: Smile, label: "Baik", color: "text-lime-500 hover:bg-lime-50" },
  { value: 5, icon: Laugh, label: "Sangat Baik", color: "text-green-500 hover:bg-green-50" },
];

export default function VisitorFeedbackDialog({ 
  open, 
  onOpenChange, 
  currentRating, 
  currentComment, 
  onSubmit,
  visitorData 
}: VisitorFeedbackDialogProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(currentRating || null);
  const [comment, setComment] = useState<string>(currentComment || "");
  const [pendidikan, setPendidikan] = useState<string>("");
  const [layanan, setLayanan] = useState<string>("");
  const [surveyResponses, setSurveyResponses] = useState<Record<string, number>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedRating(currentRating || null);
      setComment(currentComment || "");
      setPendidikan("");
      setLayanan("");
      setSurveyResponses({});
    }
  }, [open, currentRating, currentComment]);

  const handleApplyRataRata = (rataValue: number) => {
    const newResponses: Record<string, number> = {};
    SURVEY_QUESTIONS.forEach(q => {
      newResponses[q.id] = rataValue;
    });
    setSurveyResponses(newResponses);
  };

  const handleSurveyChange = (questionId: string, value: number) => {
    setSurveyResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateAverageRating = (): number => {
    const values = Object.values(surveyResponses);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / values.length);
  };

  const handleSubmit = () => {
    if (selectedRating) {
      const surveyData: SurveyData = {
        pendidikan,
        layanan,
        jenis_kelamin: visitorData?.jenis_kelamin || "",
        pilihan_kantor: visitorData?.pilihan_kantor || "",
        survey_responses: surveyResponses
      };
      onSubmit(selectedRating, comment || undefined, surveyData);
      onOpenChange(false);
    }
  };

  const allSurveyAnswered = SURVEY_QUESTIONS.every(q => surveyResponses[q.id] !== undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Feedback Kunjungan</DialogTitle>
          <DialogDescription>Berikan penilaian terhadap layanan kunjungan</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 max-h-[calc(90vh-180px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
          <div className="py-4 space-y-6">
            {/* Quick Rating Section */}
            <div>
              <p className="text-center text-muted-foreground mb-4">Bagaimana pengalaman kunjungan Anda?</p>
              <div className="flex justify-center gap-2">
                {ratingOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedRating(option.value)}
                      className={cn(
                        "p-3 rounded-full transition-all border-2",
                        selectedRating === option.value
                          ? "border-primary bg-primary/10 scale-110"
                          : "border-transparent hover:scale-105",
                        option.color
                      )}
                      title={option.label}
                    >
                      <Icon className="w-8 h-8" />
                    </button>
                  );
                })}
              </div>
              {selectedRating && (
                <p className="text-center mt-4 font-medium">
                  {ratingOptions.find(r => r.value === selectedRating)?.label}
                </p>
              )}
            </div>

            {/* Kritik dan Saran */}
            <div className="space-y-2">
              <Label htmlFor="feedback-comment" className="text-sm text-muted-foreground">
                Kritik dan Saran (Opsional)
              </Label>
              <Textarea
                id="feedback-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Berikan kritik dan saran Anda..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Additional Survey Fields */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium text-sm">Informasi Tambahan (Opsional)</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pendidikan</Label>
                  <Select value={pendidikan} onValueChange={setPendidikan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Pendidikan" />
                    </SelectTrigger>
                    <SelectContent>
                      {PENDIDIKAN_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Layanan</Label>
                  <Select value={layanan} onValueChange={setLayanan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Layanan" />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYANAN_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Auto-filled fields display */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-2 bg-muted rounded">
                  <span className="text-muted-foreground">L/P: </span>
                  <span className="font-medium">
                    {visitorData?.jenis_kelamin === "L" ? "Laki-laki" : 
                     visitorData?.jenis_kelamin === "P" ? "Perempuan" : "-"}
                  </span>
                </div>
                <div className="p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Kantor: </span>
                  <span className="font-medium">{visitorData?.pilihan_kantor || "-"}</span>
                </div>
              </div>
            </div>

            {/* Survey Questions Section */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Penilaian Layanan (9 Butir)</h4>
                <div className="flex gap-1 flex-wrap">
                  {[8, 7, 6, 5, 4, 3, 2, 1].map(val => (
                    <Button
                      key={val}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleApplyRataRata(val)}
                    >
                      Rata {val}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {SURVEY_QUESTIONS.map((question) => (
                  <div key={question.id} className="space-y-2 p-3 border rounded-lg">
                    <p className="text-sm">{question.text}</p>
                    <Select 
                      value={surveyResponses[question.id]?.toString() || ""} 
                      onValueChange={(val) => handleSurveyChange(question.id, parseInt(val))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih jawaban" />
                      </SelectTrigger>
                      <SelectContent>
                        {RATING_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {allSurveyAnswered && (
                <div className="p-3 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Rata-rata Penilaian</p>
                  <p className="text-2xl font-bold text-primary">{calculateAverageRating()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!selectedRating}>Simpan Feedback</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}