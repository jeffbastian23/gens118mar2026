import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (noSatuKemenkeu: string, tanggalSatuKemenkeu: Date) => void;
  currentNo?: string;
  currentDate?: Date;
}

export default function FeedbackDialog({
  open,
  onOpenChange,
  onSubmit,
  currentNo = "",
  currentDate,
}: FeedbackDialogProps) {
  const [noSatuKemenkeu, setNoSatuKemenkeu] = useState(currentNo);
  const [tanggalSatuKemenkeu, setTanggalSatuKemenkeu] = useState<Date | undefined>(currentDate);

  const handleSubmit = () => {
    if (!noSatuKemenkeu || !tanggalSatuKemenkeu) {
      return;
    }
    onSubmit(noSatuKemenkeu, tanggalSatuKemenkeu);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Input Nomor Booking ST</DialogTitle>
        </DialogHeader>
        
        {/* Alert E-Perjadin */}
        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium text-left">
          Laporan E-perjadin Maksimal 3 hari
        </p>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="no-satu-kemenkeu">Nomor Booking ST</Label>
            <Input
              id="no-satu-kemenkeu"
              value={noSatuKemenkeu}
              onChange={(e) => setNoSatuKemenkeu(e.target.value)}
              placeholder="Masukkan nomor booking ST"
            />
          </div>

          <div className="space-y-2">
            <Label>Tanggal Booking ST</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !tanggalSatuKemenkeu && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tanggalSatuKemenkeu ? (
                    format(tanggalSatuKemenkeu, "dd MMMM yyyy", { locale: id })
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={tanggalSatuKemenkeu}
                  onSelect={setTanggalSatuKemenkeu}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!noSatuKemenkeu || !tanggalSatuKemenkeu}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
