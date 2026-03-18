import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

interface BukuBambu {
  id: string;
  surat_masuk_id: string | null;
  dari_unit: string;
  ke_unit: string;
  nama_penerima: string;
  tanggal_kirim: string;
  catatan: string | null;
  foto_absen: string | null;
  pdf_dokumen?: string | null;
  no_urut: number;
  created_by_name: string | null;
  created_by_email: string | null;
}

interface BukuBambuCardProps {
  entry: BukuBambu;
  onEdit: (entry: BukuBambu) => void;
  onDelete: (id: string) => void;
}

export default function BukuBambuCard({ entry, onEdit, onDelete, isAdmin = false }: BukuBambuCardProps & { isAdmin?: boolean }) {
  const [showPhoto, setShowPhoto] = useState(false);

  return (
    <Card className="border">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold bg-primary/10 px-2 py-1 rounded">
                #{entry.no_urut}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Dari: </span>
                <span className="font-medium">{entry.dari_unit}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Ke: </span>
                <span className="font-medium">{entry.ke_unit}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Penerima: </span>
                <span className="font-medium">{entry.nama_penerima}</span>
              </div>
              {entry.catatan && (
                <div>
                  <span className="text-muted-foreground">Catatan: </span>
                  <span className="text-xs italic">{entry.catatan}</span>
                </div>
              )}
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-1 ml-2">
              <Button variant="ghost" size="icon" onClick={() => onEdit(entry)}>
                <Pencil className="w-4 h-4" />
              </Button>
              {entry.pdf_dokumen && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = entry.pdf_dokumen!;
                    link.download = `BukuBambu_${entry.no_urut}.pdf`;
                    link.click();
                    toast.success("PDF berhasil diunduh");
                  }}
                  title="Unduh PDF"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => onDelete(entry.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {entry.foto_absen && (
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowPhoto(!showPhoto)}
              className="text-xs"
            >
              {showPhoto ? "Sembunyikan" : "Lihat"} Foto
            </Button>
            {showPhoto && (
              <div className="mt-2">
                <img 
                  src={entry.foto_absen} 
                  alt="Foto dokumentasi" 
                  className="w-full h-32 object-cover rounded border"
                />
              </div>
            )}
          </div>
        )}

        <div className="border-t pt-2 text-xs text-muted-foreground space-y-1">
          {entry.created_by_name && (
            <div>
              <span className="font-medium">{entry.created_by_name}</span>
            </div>
          )}
          {entry.created_by_email && (
            <div>{entry.created_by_email}</div>
          )}
          <div>
            {format(new Date(entry.tanggal_kirim), "dd MMM yyyy HH:mm:ss", { locale: id })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
