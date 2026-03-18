import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  perihal: string;
  currentRating?: number | null;
  currentSaran?: string | null;
  onSuccess: () => void;
}

export default function RatingDialog({
  open,
  onOpenChange,
  assignmentId,
  perihal,
  currentRating,
  currentSaran,
  onSuccess,
}: RatingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<number>(currentRating || 0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [saran, setSaran] = useState(currentSaran || "");

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Silakan pilih rating terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || "unknown";

      const { error } = await supabase
        .from("assignments")
        .update({
          rating_penilaian: rating,
          saran_feedback: saran || null,
          rating_by: email,
          rating_at: new Date().toISOString(),
        })
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("Penilaian berhasil disimpan");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error saving rating:", error);
      toast.error(error.message || "Gagal menyimpan penilaian");
    } finally {
      setLoading(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            Penilaian
          </DialogTitle>
          <DialogDescription>
            Berikan penilaian untuk penugasan:
            <span className="block font-medium text-foreground mt-1">{perihal}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Rating (1-5 bintang)</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      star <= displayRating
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-muted-foreground/40"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {rating === 1 && "Kurang"}
              {rating === 2 && "Cukup"}
              {rating === 3 && "Baik"}
              {rating === 4 && "Sangat Baik"}
              {rating === 5 && "Istimewa"}
            </p>
          </div>

          {/* Feedback/Saran */}
          <div className="space-y-2">
            <Label htmlFor="saran">Saran / Komentar (Opsional)</Label>
            <Textarea
              id="saran"
              placeholder="Tulis saran atau komentar Anda..."
              value={saran}
              onChange={(e) => setSaran(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading || rating === 0}>
            {loading ? "Menyimpan..." : "Simpan Penilaian"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
