import { Button } from "@/components/ui/button";
import { Download, Upload, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ExcelToolbarProps {
  onExport: () => void;
  onImport: (data: any[]) => Promise<void>;
  onDeleteAll: () => Promise<void>;
  canEdit: boolean;
  tableName: string;
}

export function ExcelToolbar({ onExport, onImport, onDeleteAll, canEdit, tableName }: ExcelToolbarProps) {
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        await onImport(jsonData);
      };
      reader.readAsBinaryString(file);
    } catch (error: any) {
      console.error("Error importing data:", error);
      toast.error("Gagal mengimpor data");
    }
    e.target.value = "";
  };

  if (!canEdit) return null;

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onExport}>
        <Download className="h-4 w-4 mr-2" />
        Export Excel
      </Button>
      <div className="relative">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImport}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import Excel
        </Button>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus Semua
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data {tableName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus semua data di {tableName}. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function exportToExcel(data: any[], columns: { key: string; label: string }[], filename: string) {
  const exportData = data.map((item) => {
    const row: Record<string, any> = {};
    columns.forEach((col) => {
      row[col.label] = item[col.key] || "";
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
  toast.success("Data berhasil diekspor");
}
