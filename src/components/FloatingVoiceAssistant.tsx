import { useState } from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Voicebot from "./Voicebot";

export default function FloatingVoiceAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl z-50"
        size="icon"
        title="Asisten Suara AI"
      >
        <Mic className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asisten Suara AI</DialogTitle>
          </DialogHeader>
          <Voicebot />
        </DialogContent>
      </Dialog>
    </>
  );
}
