import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TimUpk {
  id: string;
  name: string;
  email: string;
}

interface AssignUpkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  assignmentType: "assignment" | "plh_kepala";
  timUpkList: TimUpk[];
  onSuccess: () => void;
}

export default function AssignUpkDialog({
  open,
  onOpenChange,
  assignmentId,
  assignmentType,
  timUpkList,
  onSuccess
}: AssignUpkDialogProps) {
  const [selectedUpkId, setSelectedUpkId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedUpkId) {
      toast.error("Pilih anggota Tim UPK terlebih dahulu");
      return;
    }

    try {
      setLoading(true);
      const tableName = assignmentType === "assignment" ? "assignments" : "plh_kepala";
      
      const { error } = await supabase
        .from(tableName)
        .update({
          assigned_upk_id: selectedUpkId,
          assigned_upk_at: new Date().toISOString(),
          assigned_upk_manually: true,
        })
        .eq("id", assignmentId);

      if (error) throw error;

      const selectedUpk = timUpkList.find(upk => upk.id === selectedUpkId);
      toast.success(`Berhasil assign ke ${selectedUpk?.name}`);
      
      onOpenChange(false);
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
          <DialogTitle>Assign ke Anggota Tim UPK</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="upk-member">Pilih Anggota Tim UPK *</Label>
            <Select value={selectedUpkId} onValueChange={setSelectedUpkId}>
              <SelectTrigger id="upk-member">
                <SelectValue placeholder="Pilih anggota..." />
              </SelectTrigger>
              <SelectContent>
                {timUpkList.map((upk) => (
                  <SelectItem key={upk.id} value={upk.id}>
                    {upk.name} ({upk.email})
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
          <Button onClick={handleAssign} disabled={loading}>
            {loading ? "Menyimpan..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
