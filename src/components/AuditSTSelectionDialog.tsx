import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText } from "lucide-react";

interface AuditRow {
  id: string;
  no: number;
  npwp: string;
  nama_perusahaan: string;
  [key: string]: any;
}

interface AuditSTSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: AuditRow[];
  title: string;
  onGenerate: (selectedRows: any[]) => void;
}

export default function AuditSTSelectionDialog({
  open,
  onOpenChange,
  rows,
  title,
  onGenerate,
}: AuditSTSelectionDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState("");
  const [filterBy, setFilterBy] = useState<"no" | "nama">("nama");

  const filteredRows = useMemo(() => {
    if (!filterText.trim()) return rows;
    const q = filterText.toLowerCase();
    if (filterBy === "no") {
      return rows.filter(r => String(r.no).includes(q));
    }
    return rows.filter(r => r.nama_perusahaan?.toLowerCase().includes(q));
  }, [rows, filterText, filterBy]);

  const toggleAll = () => {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map(r => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = () => {
    const selected = rows.filter(r => selectedIds.has(r.id));
    if (selected.length === 0) return;
    onGenerate(selected);
    onOpenChange(false);
    setSelectedIds(new Set());
    setFilterText("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSelectedIds(new Set()); setFilterText(""); } }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 items-center">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={filterBy === "nama" ? "default" : "outline"}
              className="text-xs h-7"
              onClick={() => setFilterBy("nama")}
            >
              By Nama
            </Button>
            <Button
              size="sm"
              variant={filterBy === "no" ? "default" : "outline"}
              className="text-xs h-7"
              onClick={() => setFilterBy("no")}
            >
              By No
            </Button>
          </div>
          <Input
            placeholder={filterBy === "no" ? "Cari nomor..." : "Cari nama perusahaan..."}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-8 text-xs flex-1"
          />
        </div>

        <div className="border rounded-md overflow-auto flex-1 min-h-0">
          <div className="p-2 border-b bg-muted/50">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox
                checked={filteredRows.length > 0 && selectedIds.size === filteredRows.length}
                onCheckedChange={toggleAll}
              />
              <span className="font-medium">Pilih Semua ({filteredRows.length})</span>
            </label>
          </div>
          <div className="divide-y">
            {filteredRows.map(row => (
              <label key={row.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer">
                <Checkbox
                  checked={selectedIds.has(row.id)}
                  onCheckedChange={() => toggleOne(row.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {row.no}. {row.nama_perusahaan || "(Belum diisi)"}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    NPWP: {row.npwp || "-"}
                  </div>
                </div>
              </label>
            ))}
            {filteredRows.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-4">
                Tidak ada data ditemukan
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-muted-foreground">
              {selectedIds.size} dipilih
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button size="sm" onClick={handleGenerate} disabled={selectedIds.size === 0}>
                <FileText className="h-3 w-3 mr-1" />
                Generate ({selectedIds.size})
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
