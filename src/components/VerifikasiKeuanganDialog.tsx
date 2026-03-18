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
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VerifikasiKeuanganDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  perihal: string;
  createdByEmail?: string;
  onSuccess: () => void;
}

export default function VerifikasiKeuanganDialog({
  open,
  onOpenChange,
  assignmentId,
  perihal,
  createdByEmail,
  onSuccess,
}: VerifikasiKeuanganDialogProps) {
  const [loading, setLoading] = useState(false);
  const [catatan, setCatatan] = useState("");

  const handleVerifikasi = async (status: 'approved' | 'declined') => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || "unknown";

      // Update verification status and save catatan if declined
      const { error } = await supabase
        .from("assignments")
        .update({
          verifikasi_keuangan_at: new Date().toISOString(),
          verifikasi_keuangan_by: email,
          verifikasi_keuangan_status: status,
          verifikasi_keuangan_catatan: status === 'declined' ? catatan : null,
        } as any)
        .eq("id", assignmentId);

      if (error) throw error;

      // Send notification to the user who created the assignment
      if (createdByEmail) {
        try {
          // Find the user_id from profiles table based on the email
          const { data: profileData } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("email", createdByEmail)
            .single();

          if (profileData?.user_id) {
            const notificationTitle = status === 'approved' 
              ? "✅ Verifikasi Keuangan Disetujui" 
              : "❌ Verifikasi Keuangan Ditolak";
            
            const notificationMessage = status === 'approved'
              ? `Penugasan "${perihal}" telah disetujui verifikasi keuangannya. Silakan lanjutkan untuk Generate ND.`
              : `Penugasan "${perihal}" ditolak verifikasi keuangannya.${catatan ? ` Catatan: ${catatan}` : ''} Silakan perbaiki dan ajukan kembali.`;

            await supabase.from("notifications").insert({
              user_id: profileData.user_id,
              title: notificationTitle,
              message: notificationMessage,
              assignment_id: assignmentId,
              is_read: false,
            });
          }
        } catch (notifError) {
          console.error("Error sending notification:", notifError);
        }
      }

      toast.success(
        status === 'approved' 
          ? "Verifikasi keuangan disetujui" 
          : "Verifikasi keuangan ditolak"
      );
      
      setCatatan("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error updating verifikasi:", error);
      toast.error(error.message || "Gagal memperbarui verifikasi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Verifikasi Keuangan
          </DialogTitle>
          <DialogDescription>
            Verifikasi alokasi keuangan untuk penugasan:
            <span className="block font-medium text-foreground mt-1">{perihal}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan (Opsional)</Label>
            <Textarea
              id="catatan"
              placeholder="Tambahkan catatan verifikasi..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="destructive"
            onClick={() => handleVerifikasi('declined')}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Tolak
          </Button>
          <Button
            onClick={() => handleVerifikasi('approved')}
            disabled={loading}
            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Setujui
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
