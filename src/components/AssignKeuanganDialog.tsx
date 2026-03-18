import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TimKeuangan {
  id: string;
  name: string;
  email: string;
}

interface AssignKeuanganDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  timKeuanganList: TimKeuangan[];
  onSuccess: () => void;
}

export default function AssignKeuanganDialog({
  open,
  onOpenChange,
  assignmentId,
  timKeuanganList,
  onSuccess
}: AssignKeuanganDialogProps) {
  const [selectedKeuanganId, setSelectedKeuanganId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedKeuanganId) {
      toast.error("Pilih anggota Tim Keuangan terlebih dahulu");
      return;
    }

    try {
      setLoading(true);
      const selectedKeuangan = timKeuanganList.find(k => k.id === selectedKeuanganId);
      
      const { error } = await supabase
        .from("assignments")
        .update({
          verifikasi_keuangan_by: selectedKeuangan?.name || null,
        })
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success(`Berhasil assign ke ${selectedKeuangan?.name}`);
      
      onOpenChange(false);
      setSelectedKeuanganId("");
      onSuccess();
    } catch (error: any) {
      console.error("Error assigning:", error);
      toast.error(error.message || "Gagal assign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign ke Anggota Tim Keuangan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="keuangan-member">Pilih Anggota Tim Keuangan *</Label>
            <Select value={selectedKeuanganId} onValueChange={setSelectedKeuanganId}>
              <SelectTrigger id="keuangan-member">
                <SelectValue placeholder="Pilih anggota..." />
              </SelectTrigger>
              <SelectContent>
                {timKeuanganList.map((keuangan) => (
                  <SelectItem key={keuangan.id} value={keuangan.id}>
                    {keuangan.name} ({keuangan.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
