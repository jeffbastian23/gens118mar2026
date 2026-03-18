import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import paktaIntegritasPoster from "@/assets/pakta-integritas-poster.png";

interface PaktaIntegritasDialogProps {
  open: boolean;
  onAccept: () => void;
}

export function PaktaIntegritasDialog({ open, onAccept }: PaktaIntegritasDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-4xl p-0 overflow-hidden border-0 bg-transparent shadow-2xl [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative">
          <img 
            src={paktaIntegritasPoster} 
            alt="Pakta Integritas - Saya Berkomitmen" 
            className="w-full h-auto max-h-[85vh] object-contain"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4">
            <Button 
              onClick={onAccept}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 shadow-lg"
            >
              Saya, bersedia
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
