import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Search, FileSpreadsheet, Pencil, Upload, DollarSign, TrendingUp, PiggyBank, Percent, Copy, GripVertical } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

const SATKER_OPTIONS = [
  "Bagian Umum",
  "Bidang Kepabeanan dan Cukai",
  "Bidang Penindakan dan Penyidikan",
  "Bidang Kepatuhan Internal",
  "Bidang Fasilitas Kepabeanan dan Cukai",
  "Sub Unsur Keberatan dan Banding",
  "Sub Unsur Audit Kepabeanan dan Cukai",
];

interface RekapRealisasi {
  id: string;
  jenis_spd: string;
  satker: string[];
  pagu: number;
  efisiensi: number;
  pagu_tersedia: number | null;
  realisasi: number;
  persentase: number | null;
  saldo: number | null;
  created_at: string;
  updated_at: string;
  created_by_email: string | null;
}

export default function RekapRealisasiPerjadinDashboard() {
  const { user, role } = useAuth();
  const isAdmin = role === "admin" || role === "super";
  const canEdit = isAdmin; // Only admin and super can edit
  const canDelete = role === "admin" || role === "super"; // Admin and super can delete
  const [data, setData] = useState<RekapRealisasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<RekapRealisasi | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [formData, setFormData] = useState({
    jenis_spd: "",
    satker: [] as string[],
    pagu: 0,
    efisiensi: 0,
    realisasi: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: result, error } = await supabase
      .from("rekap_realisasi_perjadin")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data");
    } else {
      setData((result || []) as RekapRealisasi[]);
    }
    setLoading(false);
  };

  // Calculate statistics
  const totalPagu = data.reduce((sum, item) => sum + (item.pagu || 0), 0);
  const totalRealisasi = data.reduce((sum, item) => sum + (item.realisasi || 0), 0);
  const totalEfisiensi = data.reduce((sum, item) => sum + (item.efisiensi || 0), 0);
  const totalPaguTersedia = totalPagu - totalEfisiensi;
  const totalSaldo = totalPaguTersedia - totalRealisasi;
  const persentaseRealisasi = totalPaguTersedia > 0 ? (totalRealisasi / totalPaguTersedia) * 100 : 0;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number | null): string => {
    if (value === null) return "-";
    return `${value.toFixed(2)}%`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.jenis_spd.trim()) {
      toast.error("Jenis SPD harus diisi");
      return;
    }

    try {
      const { error } = await supabase.from("rekap_realisasi_perjadin").insert({
        jenis_spd: formData.jenis_spd,
        satker: formData.satker,
        pagu: formData.pagu,
        efisiensi: formData.efisiensi,
        realisasi: formData.realisasi,
        created_by_email: user?.email || null
      });

      if (error) throw error;

      toast.success("Data berhasil ditambahkan");
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error creating data:", error);
      toast.error("Gagal menyimpan data");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from("rekap_realisasi_perjadin")
        .update({
          jenis_spd: formData.jenis_spd,
          satker: formData.satker,
          pagu: formData.pagu,
          efisiensi: formData.efisiensi,
          realisasi: formData.realisasi
        })
        .eq("id", editingItem.id);

      if (error) throw error;

      // CRITICAL: Immediately update local state for instant UI feedback
      setData(prevData => prevData.map(item => 
        item.id === editingItem.id 
          ? {
              ...item,
              jenis_spd: formData.jenis_spd,
              satker: formData.satker,
              pagu: formData.pagu,
              efisiensi: formData.efisiensi,
              realisasi: formData.realisasi,
              pagu_tersedia: formData.pagu - formData.efisiensi,
              persentase: (formData.pagu - formData.efisiensi) > 0 
                ? (formData.realisasi / (formData.pagu - formData.efisiensi)) * 100 
                : 0,
              saldo: (formData.pagu - formData.efisiensi) - formData.realisasi
            }
          : item
      ));

      setShowEditDialog(false);
      setEditingItem(null);
      resetForm();
      
      toast.success("Data berhasil diperbarui");
      
      // Also refetch to ensure sync with database
      await fetchData();
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Gagal memperbarui data");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    const { error } = await supabase.from("rekap_realisasi_perjadin").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus data");
      return;
    }

    toast.success("Data berhasil dihapus");
    fetchData();
  };

  const handleDuplicate = async (item: RekapRealisasi) => {
    if (isDuplicating) {
      return; // Prevent double-click
    }
    
    setIsDuplicating(true);
    
    try {
      // Insert duplicate with same jenis_spd
      const { data: insertedData, error } = await supabase.from("rekap_realisasi_perjadin").insert({
        jenis_spd: `${item.jenis_spd}`,
        satker: item.satker,
        pagu: item.pagu,
        efisiensi: item.efisiensi,
        realisasi: item.realisasi,
        created_by_email: user?.email || null
      }).select();

      if (error) {
        console.error("Error duplicating:", error);
        toast.error("Gagal menduplikasi data");
        return;
      }

      toast.success(`Data "${item.jenis_spd}" berhasil diduplikasi`);
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Error duplicating data:", error);
      toast.error("Gagal menduplikasi data");
    } finally {
      setIsDuplicating(false);
    }
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(filteredData);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update the full data array with the new order
    const newData = [...data];
    const sourceIndex = data.findIndex(d => d.id === reorderedItem.id);
    const destItem = items[result.destination.index === 0 ? 1 : result.destination.index - 1];
    const destIndex = destItem ? data.findIndex(d => d.id === destItem.id) : 0;
    
    if (sourceIndex !== -1) {
      newData.splice(sourceIndex, 1);
      newData.splice(destIndex, 0, reorderedItem);
    }
    
    setData(newData);
  };

  const openEdit = (item: RekapRealisasi) => {
    setEditingItem(item);
    setFormData({
      jenis_spd: item.jenis_spd,
      satker: item.satker || [],
      pagu: item.pagu,
      efisiensi: item.efisiensi,
      realisasi: item.realisasi
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      jenis_spd: "",
      satker: [],
      pagu: 0,
      efisiensi: 0,
      realisasi: 0
    });
  };

  const handleSatkerChange = (satkerName: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, satker: [...formData.satker, satkerName] });
    } else {
      setFormData({ ...formData, satker: formData.satker.filter(s => s !== satkerName) });
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    const exportData = data.map((item, index) => ({
      "No": index + 1,
      "Jenis SPD": item.jenis_spd,
      "Satker": item.satker?.join(", ") || "-",
      "Pagu": item.pagu,
      "Efisiensi": item.efisiensi,
      "Pagu Tersedia": item.pagu_tersedia || (item.pagu - item.efisiensi),
      "Realisasi": item.realisasi,
      "%": item.persentase !== null ? `${item.persentase.toFixed(2)}%` : "-",
      "Saldo": item.saldo || ((item.pagu - item.efisiensi) - item.realisasi)
    }));

    // Add total row
    exportData.push({
      "No": data.length + 1,
      "Jenis SPD": "TOTAL",
      "Satker": "",
      "Pagu": totalPagu,
      "Efisiensi": totalEfisiensi,
      "Pagu Tersedia": totalPaguTersedia,
      "Realisasi": totalRealisasi,
      "%": `${persentaseRealisasi.toFixed(2)}%`,
      "Saldo": totalSaldo
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Realisasi Perjadin");
    XLSX.writeFile(wb, `Rekap_Realisasi_Perjadin_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data berhasil diexport");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        let successCount = 0;
        for (const row of jsonData as any[]) {
          const jenisSPD = row["Jenis SPD"] || row["JENIS SPD"] || row["jenis_spd"];
          const satkerRaw = row["Satker"] || row["SATKER"] || row["satker"] || "";
          const satkerArray = typeof satkerRaw === 'string' && satkerRaw.trim() 
            ? satkerRaw.split(",").map((s: string) => s.trim()).filter(Boolean)
            : [];
          const pagu = parseFloat(String(row["Pagu"] || row["PAGU"] || row["pagu"] || 0).replace(/[^\d.-]/g, '')) || 0;
          const efisiensi = parseFloat(String(row["Efisiensi"] || row["EFISIENSI"] || row["efisiensi"] || 0).replace(/[^\d.-]/g, '')) || 0;
          const realisasi = parseFloat(String(row["Realisasi"] || row["REALISASI"] || row["realisasi"] || 0).replace(/[^\d.-]/g, '')) || 0;

          if (jenisSPD && jenisSPD !== "TOTAL") {
            const { error } = await supabase.from("rekap_realisasi_perjadin").insert({
              jenis_spd: jenisSPD,
              satker: satkerArray,
              pagu: pagu,
              efisiensi: efisiensi,
              realisasi: realisasi,
              created_by_email: user?.email || null
            });

            if (!error) successCount++;
          }
        }

        toast.success(`${successCount} data berhasil diimport`);
        fetchData();
      } catch (error) {
        console.error("Error importing:", error);
        toast.error("Gagal mengimport data");
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const filteredData = data.filter(item =>
    item.jenis_spd.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Rekap Realisasi Perjadin Per Rincian Output (RO)</h2>
        <p className="text-muted-foreground">Monitoring dan laporan ketersediaan dana</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pagu</p>
                <p className="text-xl font-bold text-blue-600">Rp {formatCurrency(totalPagu)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Realisasi</p>
                <p className="text-xl font-bold text-green-600">Rp {formatCurrency(totalRealisasi)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <PiggyBank className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sisa Anggaran</p>
                <p className="text-xl font-bold text-orange-600">Rp {formatCurrency(totalSaldo)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Percent className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Persentase Realisasi</p>
                <p className="text-xl font-bold text-purple-600">{persentaseRealisasi.toFixed(2)}%</p>
                <div className="w-full bg-purple-100 rounded-full h-2 mt-1">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min(persentaseRealisasi, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari jenis SPD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={handleExport}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <label htmlFor="import-file" className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Excel
                  </span>
                </Button>
              </label>
              <input
                id="import-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
              />
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Data
              </Button>
            </>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={async () => {
              if (data.length === 0) {
                toast.error("Tidak ada data untuk dihapus");
                return;
              }
              if (!confirm(`Yakin ingin menghapus SEMUA ${data.length} data rekap realisasi?`)) return;
              const { error } = await supabase.from("rekap_realisasi_perjadin").delete().neq("id", "00000000-0000-0000-0000-000000000000");
              if (error) {
                toast.error("Gagal menghapus semua data");
                return;
              }
              toast.success("Semua data berhasil dihapus");
              fetchData();
            }}>
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Semua
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-800">
                {canEdit && <TableHead className="text-white font-semibold text-center w-12"></TableHead>}
                <TableHead className="text-white font-semibold text-center">JENIS SPD</TableHead>
                <TableHead className="text-white font-semibold text-center">SATKER</TableHead>
                <TableHead className="text-white font-semibold text-center">PAGU</TableHead>
                <TableHead className="text-white font-semibold text-center">EFISIENSI</TableHead>
                <TableHead className="text-white font-semibold text-center">PAGU TERSEDIA</TableHead>
                <TableHead className="text-white font-semibold text-center">REALISASI</TableHead>
                <TableHead className="text-white font-semibold text-center">%</TableHead>
                <TableHead className="text-white font-semibold text-center">SALDO</TableHead>
                {canEdit && <TableHead className="text-white font-semibold text-center">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <Droppable droppableId="rekap-table">
              {(provided) => (
                <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={canEdit ? 10 : 8} className="text-center py-8">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canEdit ? 10 : 8} className="text-center py-8 text-muted-foreground">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredData.map((item, index) => {
                        const paguTersedia = item.pagu - item.efisiensi;
                        const persentase = paguTersedia > 0 ? (item.realisasi / paguTersedia) * 100 : 0;
                        const saldo = paguTersedia - item.realisasi;
                        const isOverBudget = persentase > 100;

                        return (
                          <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={!canEdit}>
                            {(provided, snapshot) => (
                              <TableRow 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`hover:bg-muted/50 ${snapshot.isDragging ? "bg-muted shadow-lg" : ""}`}
                              >
                                {canEdit && (
                                  <TableCell className="text-center w-12">
                                    <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                      <GripVertical className="h-4 w-4 text-muted-foreground mx-auto" />
                                    </div>
                                  </TableCell>
                                )}
                                <TableCell className="font-medium">{item.jenis_spd}</TableCell>
                                <TableCell className="text-xs">
                                  {item.satker && item.satker.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {item.satker.map((s, idx) => (
                                        <span key={idx} className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px]">
                                          {s.replace("Bidang ", "").replace("Sub Unsur ", "").replace("Bagian ", "")}
                                        </span>
                                      ))}
                                    </div>
                                  ) : "-"}
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(item.pagu)}</TableCell>
                                <TableCell className="text-right">{item.efisiensi > 0 ? formatCurrency(item.efisiensi) : "-"}</TableCell>
                                <TableCell className="text-right">{formatCurrency(paguTersedia)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.realisasi)}</TableCell>
                                <TableCell className={`text-right font-medium ${isOverBudget ? "text-red-600" : ""}`}>
                                  {persentase.toFixed(2)}%
                                </TableCell>
                                <TableCell className={`text-right font-medium ${saldo < 0 ? "text-red-600" : ""}`}>
                                  {formatCurrency(saldo)}
                                </TableCell>
                                {canEdit && (
                                  <TableCell className="text-center">
                                    <div className="flex justify-center gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleDuplicate(item)}
                                        disabled={isDuplicating}
                                        title="Duplikat data"
                                      >
                                        <Copy className="h-4 w-4 text-blue-600" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      {canDelete && (
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      {/* Total Row */}
                      <TableRow className="bg-slate-700 text-white font-bold">
                        {canEdit && <TableCell />}
                        <TableCell>TOTAL</TableCell>
                        <TableCell />
                        <TableCell className="text-right">{formatCurrency(totalPagu)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalEfisiensi)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalPaguTersedia)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalRealisasi)}</TableCell>
                        <TableCell className="text-right">{persentaseRealisasi.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalSaldo)}</TableCell>
                        {canEdit && <TableCell />}
                      </TableRow>
                    </>
                  )}
                </TableBody>
              )}
            </Droppable>
          </Table>
        </DragDropContext>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Data Realisasi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jenis_spd">Jenis SPD</Label>
              <Input
                id="jenis_spd"
                value={formData.jenis_spd}
                onChange={(e) => setFormData({ ...formData, jenis_spd: e.target.value })}
                placeholder="Masukkan jenis SPD"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Satker</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded p-2">
                {SATKER_OPTIONS.map((satker) => (
                  <div key={satker} className="flex items-center space-x-2">
                    <Checkbox
                      id={`satker-${satker}`}
                      checked={formData.satker.includes(satker)}
                      onCheckedChange={(checked) => handleSatkerChange(satker, !!checked)}
                    />
                    <label htmlFor={`satker-${satker}`} className="text-xs cursor-pointer">
                      {satker}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pagu">Pagu</Label>
              <Input
                id="pagu"
                type="number"
                value={formData.pagu}
                onChange={(e) => setFormData({ ...formData, pagu: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="efisiensi">Efisiensi</Label>
              <Input
                id="efisiensi"
                type="number"
                value={formData.efisiensi}
                onChange={(e) => setFormData({ ...formData, efisiensi: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="realisasi">Realisasi</Label>
              <Input
                id="realisasi"
                type="number"
                value={formData.realisasi}
                onChange={(e) => setFormData({ ...formData, realisasi: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data Realisasi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_jenis_spd">Jenis SPD</Label>
              <Input
                id="edit_jenis_spd"
                value={formData.jenis_spd}
                onChange={(e) => setFormData({ ...formData, jenis_spd: e.target.value })}
                placeholder="Masukkan jenis SPD"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Satker</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded p-2">
                {SATKER_OPTIONS.map((satker) => (
                  <div key={satker} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-satker-${satker}`}
                      checked={formData.satker.includes(satker)}
                      onCheckedChange={(checked) => handleSatkerChange(satker, !!checked)}
                    />
                    <label htmlFor={`edit-satker-${satker}`} className="text-xs cursor-pointer">
                      {satker}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_pagu">Pagu</Label>
              <Input
                id="edit_pagu"
                type="number"
                value={formData.pagu}
                onChange={(e) => setFormData({ ...formData, pagu: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_efisiensi">Efisiensi</Label>
              <Input
                id="edit_efisiensi"
                type="number"
                value={formData.efisiensi}
                onChange={(e) => setFormData({ ...formData, efisiensi: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_realisasi">Realisasi</Label>
              <Input
                id="edit_realisasi"
                type="number"
                value={formData.realisasi}
                onChange={(e) => setFormData({ ...formData, realisasi: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
