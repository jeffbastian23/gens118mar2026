import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ImportAbsensiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportAbsensiDialog({
  open,
  onOpenChange,
}: ImportAbsensiDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: any[]) => {
      // Split data into chunks of 1000 to avoid Supabase limits
      const chunkSize = 1000;
      const chunks = [];
      
      for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push(data.slice(i, i + chunkSize));
      }
      
      // Insert each chunk sequentially
      for (let i = 0; i < chunks.length; i++) {
        const { error } = await supabase.from("absensi").insert(chunks[i]);
        if (error) throw error;
        
        // Show progress
        toast.info(`Mengimport chunk ${i + 1} dari ${chunks.length}...`);
      }
      
      return data.length;
    },
    onSuccess: (totalImported) => {
      queryClient.invalidateQueries({ queryKey: ["absensi"] });
      toast.success(`Berhasil mengimport ${totalImported} data absensi`);
      onOpenChange(false);
      setFile(null);
    },
    onError: (error: any) => {
      toast.error(`Gagal mengimport data: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseExcelDate = (excelDate: any): string | null => {
    // Handle empty or invalid values
    if (!excelDate || excelDate === '' || excelDate === '--' || excelDate === '-') {
      return null;
    }
    
    if (typeof excelDate === "string") {
      // If it's already a string like "04/11/2025", convert to YYYY-MM-DD
      const parts = excelDate.split("/");
      if (parts.length === 3) {
        const year = parts[2];
        const month = parts[1].padStart(2, "0");
        const day = parts[0].padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
      
      // Try to parse as ISO date
      const isoDate = new Date(excelDate);
      if (!isNaN(isoDate.getTime())) {
        const year = isoDate.getFullYear();
        const month = String(isoDate.getMonth() + 1).padStart(2, "0");
        const day = String(isoDate.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }
    
    // If it's an Excel serial date number
    if (typeof excelDate === "number") {
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }
    
    return null;
  };

  const parseExcelTime = (excelTime: any): string | null => {
    if (!excelTime || excelTime === '--' || excelTime === '-' || excelTime === '') return null;
    
    if (typeof excelTime === "string") {
      // If it's already formatted like "8:14:43 AM"
      if (excelTime.includes("AM") || excelTime.includes("PM")) {
        const [time, period] = excelTime.split(" ");
        const [hours, minutes] = time.split(":");
        let hour = parseInt(hours);
        
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;
        
        return `${String(hour).padStart(2, "0")}:${minutes.padStart(2, "0")}`;
      }
      return excelTime;
    }
    
    // If it's an Excel time fraction (0.0 to 1.0)
    if (typeof excelTime === "number") {
      const totalMinutes = Math.round(excelTime * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
    
    return null;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Pilih file Excel terlebih dahulu");
      return;
    }

    try {
      toast.info("Membaca file Excel...");
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Read data with raw option to handle dates better
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            defval: "",
            raw: false // Convert to string for better handling
          });

          console.log("Raw Excel data sample:", jsonData.slice(0, 3));

          const formattedData = [];
          
          for (const row of jsonData as any[]) {
            // Support multiple column name variations
            const nama = row.Nama || row.nama || row.NAMA || "";
            const nip = String(row.NIP || row.nip || "").trim();
            const tanggal = row.Tanggal || row.tanggal || row.TANGGAL;
            const jamMasuk = row["Jam Masuk"] || row.jam_masuk || row["JAM MASUK"];
            const jamPulang = row["Jam Pulang"] || row.jam_pulang || row["JAM PULANG"];

            const formatted = {
              nama: String(nama).trim(),
              nip: nip,
              tanggal: parseExcelDate(tanggal),
              jam_masuk: parseExcelTime(jamMasuk),
              jam_pulang: parseExcelTime(jamPulang),
            };
            
            // Validate row
            if (formatted.nama && formatted.nip && formatted.tanggal) {
              formattedData.push(formatted);
            }
          }

          console.log("Total rows to import:", formattedData.length);

          if (formattedData.length === 0) {
            toast.error("Tidak ada data valid untuk diimport. Pastikan format Excel sesuai.");
            return;
          }

          mutation.mutate(formattedData);
        } catch (parseError: any) {
          console.error("Parse error:", parseError);
          toast.error(`Gagal memproses data: ${parseError.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast.error(`Gagal membaca file: ${error.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Import Data Absensi dari Excel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Format Excel: Nama, NIP, Tanggal, Jam Masuk, Jam Pulang
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setFile(null);
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || mutation.isPending}
            >
              {mutation.isPending ? "Mengimport..." : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
