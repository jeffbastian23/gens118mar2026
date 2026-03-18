import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { toProperCase } from "@/lib/utils";

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string;
  uraian_pangkat: string;
  uraian_jabatan: string;
}

interface STLuarKantorRecord {
  id: string;
  dasar_penugasan: string;
  hal: string | null;
  employee_ids: string[];
  pdf_dokumen: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
  waktu_penugasan: string | null;
  lokasi_penugasan: string;
  created_at: string;
  created_by_email?: string | null;
  created_by_name?: string | null;
}

interface STLuarKantorTableProps {
  records: STLuarKantorRecord[];
  employees: Employee[];
  onEdit: (record: STLuarKantorRecord) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
}

export default function STLuarKantorTable({
  records,
  employees,
  onEdit,
  onDelete,
  isAdmin = false,
}: STLuarKantorTableProps) {
  const handleDownloadPDF = (record: STLuarKantorRecord) => {
    if (!record.pdf_dokumen) {
      toast.error("Tidak ada PDF yang tersedia");
      return;
    }

    try {
      // Extract base64 data
      const base64Data = record.pdf_dokumen.includes("base64,")
        ? record.pdf_dokumen.split("base64,")[1]
        : record.pdf_dokumen;

      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ST_LK_${format(new Date(record.tanggal_mulai), "yyyyMMdd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("PDF berhasil diunduh");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Gagal mengunduh PDF");
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-48">Dasar Penugasan</TableHead>
            <TableHead className="w-48">Hal</TableHead>
            <TableHead className="w-32">Nama Pegawai</TableHead>
            <TableHead className="w-40">Periode</TableHead>
            <TableHead className="w-48">Lokasi</TableHead>
            <TableHead className="w-32">Waktu</TableHead>
            <TableHead className="w-32">Nama Perekam</TableHead>
            <TableHead className="w-24 text-center">PDF</TableHead>
            <TableHead className="w-40 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                Tidak ada data ST Luar Kantor
              </TableCell>
            </TableRow>
          ) : (
            records.map((record) => {
              const employeeNames = record.employee_ids
                .map(empId => employees.find(emp => emp.id === empId)?.nm_pegawai)
                .filter(Boolean);
              
              return (
                <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="text-sm">
                    {record.dasar_penugasan || "-"}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {record.hal || "-"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {employeeNames.length > 0 ? (
                      <div className="space-y-1">
                        {employeeNames.slice(0, 2).map((name, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{toProperCase(name || "")}</span>
                            {idx === 0 && (
                              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                                {record.employee_ids.length}
                              </Badge>
                            )}
                          </div>
                        ))}
                        {employeeNames.length > 2 && (
                          <div className="text-xs text-muted-foreground pl-4">
                            +{employeeNames.length - 2} lainnya
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="secondary">{record.employee_ids.length} orang</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(record.tanggal_mulai), "dd MMM", { locale: id })} -{" "}
                    {format(new Date(record.tanggal_selesai), "dd MMM yyyy", { locale: id })}
                  </TableCell>
                  <TableCell className="text-sm">{record.lokasi_penugasan}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {record.waktu_penugasan || "-"}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="italic">
                      {record.created_by_name || record.created_by_email || "-"}
                    </span>
                  </TableCell>
                <TableCell className="text-center">
                  {record.pdf_dokumen ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDownloadPDF(record)}
                      title="Download PDF"
                    >
                      <Download className="h-3.5 w-3.5 text-green-600" />
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isAdmin && (
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onEdit(record)}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => onDelete(record.id)}
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
