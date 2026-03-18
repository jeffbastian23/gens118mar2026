import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MigrateNIPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function MigrateNIPDialog({ open, onOpenChange, onSuccess }: MigrateNIPDialogProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ updated: 0, skipped: 0, errors: 0 });

  const migrateNIPData = async () => {
    setLoading(true);
    setProgress(0);
    setStats({ updated: 0, skipped: 0, errors: 0 });

    try {
      const XLSX = await import('xlsx');
      
      // Fetch the Excel file
      const response = await fetch("/data/employees_rows_supabase.xlsx");
      const arrayBuffer = await response.arrayBuffer();
      
      // Parse Excel
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet);
      
      const totalRecords = data.length;
      let updated = 0;
      let skipped = 0;
      let errors = 0;

      // Process in batches
      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        
        try {
          // Skip if no NIP
          if (!row.nip) {
            skipped++;
            continue;
          }

          // Update the record by ID
          const { error } = await supabase
            .from("employees")
            .update({ nip: String(row.nip) })
            .eq("id", row.id);

          if (error) {
            console.error(`Error updating ${row.id}:`, error);
            errors++;
          } else {
            updated++;
          }
        } catch (err) {
          console.error(`Error processing row ${i}:`, err);
          errors++;
        }

        // Update progress
        setProgress(((i + 1) / totalRecords) * 100);
        setStats({ updated, skipped, errors });
      }

      if (errors > 0) {
        toast.warning(`Migrasi selesai dengan ${errors} error. ${updated} data berhasil diupdate.`);
      } else {
        toast.success(`Berhasil update ${updated} data NIP!`);
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal migrasi data");
      console.error("Migration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Migrasi Data NIP ke Supabase</DialogTitle>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {loading ? (
                <Upload className="w-8 h-8 text-primary animate-pulse" />
              ) : (
                <Upload className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Proses ini akan mengupdate data NIP dari file Excel ke database Supabase.
            </p>
            <p className="text-sm font-medium">
              File: <span className="text-primary">employees_rows_supabase.xlsx</span>
            </p>
          </div>

          {loading && (
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Updated</span>
                  <span className="font-semibold">{stats.updated}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-muted-foreground">Skipped</span>
                  <span className="font-semibold">{stats.skipped}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-muted-foreground">Errors</span>
                  <span className="font-semibold">{stats.errors}</span>
                </div>
              </div>
            </div>
          )}
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
          <Button onClick={migrateNIPData} disabled={loading}>
            {loading ? "Memproses..." : "Mulai Migrasi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
