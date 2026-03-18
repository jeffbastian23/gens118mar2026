import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ImportDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
  const [loading, setLoading] = useState(false);

  const importExcel = async () => {
    setLoading(true);
    try {
      const XLSX = await import('xlsx');
      
      // Fetch the Excel file
      const response = await fetch("/data/data_pokok.xlsx");
      const arrayBuffer = await response.arrayBuffer();
      
      // Parse Excel
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet);
      
      const employees = data.map((row: any) => ({
        nm_pegawai: row['Nama Lengkap'] || row['nm_pegawai'] || row['Nama Pegawai'] || '',
        nip: String(row['NIP'] || row['nip'] || '').replace(/'/g, ''),
        uraian_pangkat: row['Uraian Pangkat'] || row['uraian_pangkat'] || '',
        uraian_jabatan: row['Jabatan'] || row['uraian_jabatan'] || '',
        nm_unit_organisasi: row['Nama Organisasi'] || row['nm_unit_organisasi'] || '',
      })).filter((emp: any) => emp.nm_pegawai && emp.nip);

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < employees.length; i += batchSize) {
        const batch = employees.slice(i, i + batchSize);
        const { error } = await supabase.from("employees").insert(batch);
        if (error) throw error;
      }

      toast.success(`Berhasil import ${employees.length} data pegawai!`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal import data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Data Pegawai</DialogTitle>
        </DialogHeader>
        <div className="py-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Klik tombol di bawah untuk import data pegawai dari file Excel yang sudah disiapkan.
            </p>
            <p className="text-sm font-medium">
              File: <span className="text-primary">data_pokok.xlsx</span>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={importExcel} disabled={loading}>
            {loading ? "Importing..." : "Import Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}