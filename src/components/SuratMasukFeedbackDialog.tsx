import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Frown, Meh, Smile, Laugh } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuratMasukFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number, comment?: string) => void;
}

const ratingOptions = [
  { value: 2, icon: Frown, label: "Buruk", color: "text-red-500 hover:bg-red-50" },
  { value: 3, icon: Meh, label: "Cukup", color: "text-yellow-500 hover:bg-yellow-50" },
  { value: 4, icon: Smile, label: "Baik", color: "text-lime-500 hover:bg-lime-50" },
  { value: 5, icon: Laugh, label: "Sangat Baik", color: "text-green-500 hover:bg-green-50" },
];

export default function SuratMasukFeedbackDialog({ open, onOpenChange, onSubmit }: SuratMasukFeedbackDialogProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>("");

  const handleSubmit = () => {
    if (selectedRating) {
      onSubmit(selectedRating, comment || undefined);
      setSelectedRating(null);
      setComment("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Feedback Layanan Surat Masuk</DialogTitle>
          <DialogDescription>Berikan penilaian terhadap layanan penerimaan surat</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <p className="text-center text-muted-foreground mb-4">Bagaimana pengalaman Anda?</p>
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
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!selectedRating}>Simpan Feedback</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
