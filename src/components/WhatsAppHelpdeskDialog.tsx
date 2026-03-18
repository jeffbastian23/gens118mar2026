import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface WhatsAppHelpdeskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WhatsAppHelpdeskDialog({ open, onOpenChange }: WhatsAppHelpdeskDialogProps) {
  const phoneNumber = "6282245793560";
  const waLink = `https://wa.me/${phoneNumber}`;
  
  // Generate QR code URL using QR Code API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(waLink)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Helpdesk WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <img 
              src={qrCodeUrl} 
              alt="QR Code WhatsApp Helpdesk" 
              className="w-48 h-48"
            />
          </div>
          
          {/* WhatsApp Link */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Scan QR code atau klik link di bawah:</p>
            <Button
              variant="link"
              className="text-primary font-medium"
              onClick={() => window.open(waLink, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {waLink}
            </Button>
          </div>
          
          {/* Action Button */}
          <Button
            onClick={() => window.open(waLink, "_blank")}
            className="w-full"
          >
            Buka WhatsApp Helpdesk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
