import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, CalendarIcon, Clock, Users, Search, FileText, Pencil, Download, Upload, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface Rundown {
  id: string;
  judul: string;
  tanggal_kegiatan: string;
  created_at: string;
  created_by_email: string | null;
}

interface RundownItem {
  id: string;
  rundown_id: string;
  no_urut: number;
  mulai: string | null;
  akhir: string | null;
  durasi: string | null;
  kegiatan: string;
  uraian: string | null;
  pic_ids: string[];
  pic_names: string[];
}

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string | null;
  nm_unit_organisasi: string;
}

export default function RundownTab() {
  const { user, role } = useAuth();
  const canEdit = role !== "overview";
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [rundowns, setRundowns] = useState<Rundown[]>([]);
  const [selectedRundown, setSelectedRundown] = useState<Rundown | null>(null);
  const [rundownItems, setRundownItems] = useState<RundownItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<RundownItem | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [picSearch, setPicSearch] = useState("");
  const [showPicDropdown, setShowPicDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    judul: "",
    tanggal_kegiatan: new Date()
  });
  
  const [itemFormData, setItemFormData] = useState({
    mulai: "",
    akhir: "",
    durasi: "",
    kegiatan: "",
    uraian: "",
    pic_ids: [] as string[],
    pic_names: [] as string[],
    pic_manual: [] as string[],
    pic_manual_input: ""
  });

  useEffect(() => {
    fetchRundowns();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedRundown) {
      fetchRundownItems(selectedRundown.id);
    }
  }, [selectedRundown]);

  // Close PIC dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.pic-dropdown-container')) {
        setShowPicDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRundowns = async () => {
    const { data, error } = await supabase
      .from("rundown")
      .select("*")
      .order("tanggal_kegiatan", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data rundown");
      return;
    }
    setRundowns(data || []);
  };

  const fetchRundownItems = async (rundownId: string) => {
    const { data, error } = await supabase
      .from("rundown_items")
      .select("*")
      .eq("rundown_id", rundownId)
      .order("no_urut", { ascending: true });

    if (error) {
      toast.error("Gagal memuat item rundown");
      return;
    }
    setRundownItems(data || []);
  };

  const fetchEmployees = async () => {
    // Supabase has default limit of 1000 rows, so we need to fetch all with pagination
    let allEmployees: Employee[] = [];
    let start = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("employees")
        .select("id, nm_pegawai, nip, nm_unit_organisasi")
        .order("nm_pegawai", { ascending: true })
        .range(start, start + pageSize - 1);

      if (error) {
        console.error("Error fetching employees:", error);
        return;
      }

      if (data && data.length > 0) {
        allEmployees = [...allEmployees, ...data];
        start += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    setEmployees(allEmployees);
  };

  const handleAddRundown = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from("rundown").insert({
      judul: formData.judul,
      tanggal_kegiatan: format(formData.tanggal_kegiatan, "yyyy-MM-dd"),
      created_by_email: user?.email
    });

    if (error) {
      toast.error("Gagal menambah rundown");
      return;
    }

    toast.success("Rundown berhasil ditambahkan");
    setShowAddDialog(false);
    resetForm();
    fetchRundowns();
  };

  const handleEditRundown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRundown) return;
    
    const { error } = await supabase
      .from("rundown")
      .update({
        judul: formData.judul,
        tanggal_kegiatan: format(formData.tanggal_kegiatan, "yyyy-MM-dd")
      })
      .eq("id", selectedRundown.id);

    if (error) {
      toast.error("Gagal mengubah rundown");
      return;
    }

    toast.success("Rundown berhasil diubah");
    setShowEditDialog(false);
    fetchRundowns();
  };

  const handleDeleteRundown = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus rundown ini?")) return;
    
    const { error } = await supabase.from("rundown").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus rundown");
      return;
    }

    toast.success("Rundown berhasil dihapus");
    setSelectedRundown(null);
    setRundownItems([]);
    fetchRundowns();
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRundown) return;

    const maxOrder = rundownItems.length > 0 
      ? Math.max(...rundownItems.map(i => i.no_urut)) 
      : 0;

    const { error } = await supabase.from("rundown_items").insert({
      rundown_id: selectedRundown.id,
      no_urut: maxOrder + 1,
      mulai: itemFormData.mulai || null,
      akhir: itemFormData.akhir || null,
      durasi: itemFormData.durasi || null,
      kegiatan: itemFormData.kegiatan,
      uraian: itemFormData.uraian || null,
      pic_ids: itemFormData.pic_ids,
      pic_names: itemFormData.pic_names,
      pic_manual: itemFormData.pic_manual
    });

    if (error) {
      toast.error("Gagal menambah item");
      return;
    }

    toast.success("Item berhasil ditambahkan");
    setShowItemDialog(false);
    resetItemForm();
    fetchRundownItems(selectedRundown.id);
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const { error } = await supabase
      .from("rundown_items")
      .update({
        mulai: itemFormData.mulai || null,
        akhir: itemFormData.akhir || null,
        durasi: itemFormData.durasi || null,
        kegiatan: itemFormData.kegiatan,
        uraian: itemFormData.uraian || null,
        pic_ids: itemFormData.pic_ids,
        pic_names: itemFormData.pic_names,
        pic_manual: itemFormData.pic_manual
      })
      .eq("id", editingItem.id);

    if (error) {
      toast.error("Gagal mengubah item");
      return;
    }

    toast.success("Item berhasil diubah");
    setShowItemDialog(false);
    setEditingItem(null);
    resetItemForm();
    if (selectedRundown) fetchRundownItems(selectedRundown.id);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Hapus item ini?")) return;
    
    const { error } = await supabase.from("rundown_items").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus item");
      return;
    }

    toast.success("Item berhasil dihapus");
    if (selectedRundown) fetchRundownItems(selectedRundown.id);
  };

  const openEditItem = (item: RundownItem) => {
    setEditingItem(item);
    setItemFormData({
      mulai: item.mulai || "",
      akhir: item.akhir || "",
      durasi: item.durasi || "",
      kegiatan: item.kegiatan,
      uraian: item.uraian || "",
      pic_ids: item.pic_ids || [],
      pic_names: item.pic_names || [],
      pic_manual: (item as any).pic_manual || [],
      pic_manual_input: ""
    });
    setShowItemDialog(true);
  };

  // Get the last item's end time (akhir) for auto-fill
  const getLastItemEndTime = (): string => {
    if (rundownItems.length === 0) return "";
    
    // Calculate the actual end time of the last item
    let currentMulai = rundownItems[0].mulai || "";
    for (let i = 0; i < rundownItems.length; i++) {
      const item = rundownItems[i];
      if (i === 0) {
        if (item.mulai && item.durasi) {
          currentMulai = calculateEndTime(item.mulai, item.durasi);
        }
      } else {
        if (item.durasi && currentMulai) {
          currentMulai = calculateEndTime(currentMulai, item.durasi);
        }
      }
    }
    return currentMulai;
  };

  // Open add item dialog with auto-fill from last item's end time
  const openAddItemDialog = () => {
    resetItemForm();
    setEditingItem(null);
    
    // Auto-fill mulai from last item's akhir
    const lastEndTime = getLastItemEndTime();
    if (lastEndTime) {
      setItemFormData(prev => ({ ...prev, mulai: lastEndTime }));
    }
    
    setShowItemDialog(true);
  };

  const openEditRundown = (rundown: Rundown) => {
    setFormData({
      judul: rundown.judul,
      tanggal_kegiatan: new Date(rundown.tanggal_kegiatan)
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      judul: "",
      tanggal_kegiatan: new Date()
    });
  };

  const resetItemForm = () => {
    setItemFormData({
      mulai: "",
      akhir: "",
      durasi: "",
      kegiatan: "",
      uraian: "",
      pic_ids: [],
      pic_names: [],
      pic_manual: [],
      pic_manual_input: ""
    });
    setPicSearch("");
    setShowPicDropdown(false);
  };

  const togglePic = (emp: Employee) => {
    const isSelected = itemFormData.pic_ids.includes(emp.id);
    if (isSelected) {
      setItemFormData(prev => ({
        ...prev,
        pic_ids: prev.pic_ids.filter(id => id !== emp.id),
        pic_names: prev.pic_names.filter(name => name !== emp.nm_pegawai)
      }));
    } else {
      setItemFormData(prev => ({
        ...prev,
        pic_ids: [...prev.pic_ids, emp.id],
        pic_names: [...prev.pic_names, emp.nm_pegawai]
      }));
    }
  };

  const filteredEmployees = useMemo(() => {
    const search = picSearch.toLowerCase().trim();
    
    // Filter by search term if provided
    const filtered = employees.filter(e => 
      !search || 
      e.nm_pegawai.toLowerCase().includes(search) ||
      (e.nip && e.nip.toLowerCase().includes(search)) ||
      e.nm_unit_organisasi.toLowerCase().includes(search)
    );
    
    // Sort: selected employees first, then alphabetically
    const selected = filtered.filter(e => itemFormData.pic_ids.includes(e.id));
    const unselected = filtered.filter(e => !itemFormData.pic_ids.includes(e.id));
    
    return [...selected, ...unselected];
  }, [employees, picSearch, itemFormData.pic_ids]);

  const filteredRundowns = useMemo(() => {
    if (!searchTerm) return rundowns;
    const search = searchTerm.toLowerCase();
    return rundowns.filter(r => 
      r.judul.toLowerCase().includes(search)
    );
  }, [rundowns, searchTerm]);

  // Calculate duration from mulai and akhir
  const calculateDuration = (mulai: string, akhir: string): string => {
    if (!mulai || !akhir) return "";
    const [mHour, mMin] = mulai.split(":").map(Number);
    const [aHour, aMin] = akhir.split(":").map(Number);
    const mTotal = mHour * 60 + mMin;
    const aTotal = aHour * 60 + aMin;
    const diff = aTotal - mTotal;
    if (diff <= 0) return "";
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  // Calculate end time from mulai and durasi
  const calculateEndTime = (mulai: string, durasi: string): string => {
    if (!mulai || !durasi) return "";
    const [mHour, mMin] = mulai.split(":").map(Number);
    const [dHour, dMin] = durasi.split(":").map(Number);
    if (isNaN(mHour) || isNaN(mMin) || isNaN(dHour) || isNaN(dMin)) return "";
    
    let totalMins = mHour * 60 + mMin + dHour * 60 + dMin;
    const endHour = Math.floor(totalMins / 60) % 24;
    const endMin = totalMins % 60;
    return `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;
  };

  // Handle mulai change - auto calculate duration if akhir exists
  const handleMulaiChange = (newMulai: string) => {
    const durasi = calculateDuration(newMulai, itemFormData.akhir);
    setItemFormData(prev => ({ ...prev, mulai: newMulai, durasi }));
  };

  // Handle akhir change - auto calculate duration
  const handleAkhirChange = (newAkhir: string) => {
    const durasi = calculateDuration(itemFormData.mulai, newAkhir);
    setItemFormData(prev => ({ ...prev, akhir: newAkhir, durasi }));
  };

  // Handle durasi change - auto calculate akhir if mulai exists
  const handleDurasiChange = (newDurasi: string) => {
    const akhir = calculateEndTime(itemFormData.mulai, newDurasi);
    setItemFormData(prev => ({ ...prev, durasi: newDurasi, akhir: akhir || prev.akhir }));
  };

  // Generate PDF for rundown
  const generatePDF = () => {
    if (!selectedRundown) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RUNDOWN KEGIATAN", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text(selectedRundown.judul, pageWidth / 2, 30, { align: "center" });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(format(new Date(selectedRundown.tanggal_kegiatan), "EEEE, dd MMMM yyyy", { locale: id }), pageWidth / 2, 38, { align: "center" });

    let yPos = 50;
    
    // Table header
    const colWidths = [15, 25, 25, 20, 50, 55];
    const headers = ["No", "Mulai", "Akhir", "Durasi", "Kegiatan", "PIC"];
    
    doc.setFillColor(66, 139, 202);
    doc.rect(10, yPos, 190, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    
    let xPos = 12;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos + 7);
      xPos += colWidths[i];
    });

    yPos += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    rundownItems.forEach((item, idx) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const rowHeight = Math.max(10, Math.ceil((item.pic_names?.length || 0) / 2) * 5 + 8);
      
      if (idx % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(10, yPos - 4, 190, rowHeight, "F");
      }
      
      xPos = 12;
      doc.text((idx + 1).toString(), xPos, yPos);
      xPos += colWidths[0];
      doc.text(item.mulai || "-", xPos, yPos);
      xPos += colWidths[1];
      doc.text(item.akhir || "-", xPos, yPos);
      xPos += colWidths[2];
      doc.text(item.durasi || "-", xPos, yPos);
      xPos += colWidths[3];
      doc.text(item.kegiatan.substring(0, 30), xPos, yPos);
      xPos += colWidths[4];
      doc.text((item.pic_names || []).join(", ").substring(0, 35), xPos, yPos);
      
      yPos += rowHeight;
    });

    doc.save(`Rundown_${selectedRundown.judul.replace(/\s+/g, "_")}.pdf`);
    toast.success("PDF berhasil diunduh");
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!selectedRundown) return;

    const data = rundownItems.map((item, idx) => ({
      "No": idx + 1,
      "Mulai": item.mulai || "",
      "Akhir": item.akhir || "",
      "Durasi": item.durasi || "",
      "Kegiatan": item.kegiatan,
      "Uraian": item.uraian || "",
      "PIC": (item.pic_names || []).join(", ")
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rundown");
    
    // Set column widths
    ws["!cols"] = [
      { wch: 5 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 30 },
      { wch: 40 },
      { wch: 30 }
    ];

    XLSX.writeFile(wb, `Rundown_${selectedRundown.judul.replace(/\s+/g, "_")}.xlsx`);
    toast.success("Excel berhasil diunduh");
  };

  // Import from Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRundown) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        let successCount = 0;
        const maxOrder = rundownItems.length > 0 
          ? Math.max(...rundownItems.map(i => i.no_urut)) 
          : 0;

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i] as any;
          const kegiatan = row["Kegiatan"] || row["kegiatan"];
          if (!kegiatan) continue;

          // Find PICs by name
          const picString = row["PIC"] || row["pic"] || "";
          const picNamesList = picString.split(",").map((n: string) => n.trim()).filter(Boolean);
          const matchedPics = employees.filter(emp => 
            picNamesList.some((name: string) => 
              emp.nm_pegawai.toLowerCase().includes(name.toLowerCase())
            )
          );

          const { error } = await supabase.from("rundown_items").insert({
            rundown_id: selectedRundown.id,
            no_urut: maxOrder + i + 1,
            mulai: row["Mulai"] || row["mulai"] || null,
            akhir: row["Akhir"] || row["akhir"] || null,
            durasi: row["Durasi"] || row["durasi"] || null,
            kegiatan: kegiatan,
            uraian: row["Uraian"] || row["uraian"] || null,
            pic_ids: matchedPics.map(p => p.id),
            pic_names: matchedPics.map(p => p.nm_pegawai)
          });

          if (!error) successCount++;
        }

        toast.success(`${successCount} item berhasil diimpor`);
        fetchRundownItems(selectedRundown.id);
      } catch (error) {
        toast.error("Gagal mengimpor file Excel");
        console.error(error);
      }
    };
    reader.readAsBinaryString(file);
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Rundown Kegiatan</h2>
          <p className="text-muted-foreground">Kelola rundown acara dan kegiatan</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Rundown
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Rundown List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Daftar Rundown
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari rundown..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredRundowns.map((rundown) => (
                  <div
                    key={rundown.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRundown?.id === rundown.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedRundown(rundown)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium line-clamp-2">{rundown.judul}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <CalendarIcon className="h-3 w-3 shrink-0" />
                          {format(new Date(rundown.tanggal_kegiatan), "dd MMM yyyy", { locale: id })}
                        </p>
                      </div>
      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRundown(rundown.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredRundowns.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada rundown
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Panel - Rundown Details */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            {selectedRundown ? (
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div>
                  <CardTitle className="text-xl">{selectedRundown.judul}</CardTitle>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <CalendarIcon className="h-4 w-4" />
                    {format(new Date(selectedRundown.tanggal_kegiatan), "EEEE, dd MMMM yyyy", { locale: id })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={generatePDF}>
                    <FileDown className="h-4 w-4 mr-1" />
                    Unduh PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToExcel}>
                    <Download className="h-4 w-4 mr-1" />
                    Ekspor Excel
                  </Button>
                  {canEdit && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-1" />
                        Impor Excel
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleImportExcel}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditRundown(selectedRundown)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={openAddItemDialog}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Tambah Item
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <CardTitle className="text-lg text-muted-foreground">
                Pilih rundown untuk melihat detail
              </CardTitle>
            )}
          </CardHeader>
          <CardContent>
            {selectedRundown ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/5">
                      <TableHead className="w-[50px] text-center">No</TableHead>
                      <TableHead className="w-[80px]">Mulai</TableHead>
                      <TableHead className="w-[80px]">Akhir</TableHead>
                      <TableHead className="w-[80px]">Durasi</TableHead>
                      <TableHead>Kegiatan</TableHead>
                      <TableHead className="w-[200px]">Uraian</TableHead>
                      <TableHead className="w-[150px]">PIC</TableHead>
                      {canEdit && <TableHead className="w-[80px]">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rundownItems.map((item, idx) => {
                      // Calculate auto times based on previous items
                      let displayMulai = item.mulai || "";
                      let displayAkhir = item.akhir || "";
                      
                      if (idx === 0) {
                        // First item uses its own mulai
                        displayMulai = item.mulai || "";
                        // Calculate akhir from mulai + durasi
                        if (item.mulai && item.durasi) {
                          displayAkhir = calculateEndTime(item.mulai, item.durasi);
                        }
                      } else {
                        // For subsequent items, calculate mulai from previous item's akhir
                        const prevItem = rundownItems[idx - 1];
                        let prevAkhir = prevItem.akhir || "";
                        
                        // If previous item has mulai and durasi, calculate its akhir
                        if (prevItem.mulai && prevItem.durasi) {
                          prevAkhir = calculateEndTime(prevItem.mulai, prevItem.durasi);
                        }
                        
                        // Chain calculation: use calculated akhir from all previous items
                        let currentMulai = rundownItems[0].mulai || "";
                        for (let i = 0; i < idx; i++) {
                          const prevIt = rundownItems[i];
                          if (prevIt.durasi && currentMulai) {
                            currentMulai = calculateEndTime(currentMulai, prevIt.durasi);
                          }
                        }
                        displayMulai = currentMulai || item.mulai || "";
                        
                        // Calculate akhir from this item's calculated mulai + durasi
                        if (displayMulai && item.durasi) {
                          displayAkhir = calculateEndTime(displayMulai, item.durasi);
                        }
                      }
                      
                      return (
                        <TableRow key={item.id} className="hover:bg-muted/30">
                          <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {displayMulai || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{displayAkhir || "-"}</TableCell>
                          <TableCell>
                            <span className="text-sm bg-primary/10 px-2 py-0.5 rounded">
                              {item.durasi || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{item.kegiatan}</TableCell>
                          <TableCell>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.uraian || "-"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.pic_names?.map((name, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-secondary px-2 py-0.5 rounded-full"
                                >
                                  {name}
                                </span>
                              ))}
                              {(!item.pic_names || item.pic_names.length === 0) && (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          {canEdit && (
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => openEditItem(item)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                    {rundownItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={canEdit ? 8 : 7} className="text-center py-8 text-muted-foreground">
                          Belum ada item rundown
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p>Pilih rundown dari daftar di sebelah kiri</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Rundown Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Rundown Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddRundown} className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Kegiatan</Label>
              <Input
                value={formData.judul}
                onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                placeholder="Masukkan judul kegiatan"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Kegiatan</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.tanggal_kegiatan, "dd MMMM yyyy", { locale: id })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.tanggal_kegiatan}
                    onSelect={(date) => date && setFormData({ ...formData, tanggal_kegiatan: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Rundown Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Rundown</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditRundown} className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Kegiatan</Label>
              <Input
                value={formData.judul}
                onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                placeholder="Masukkan judul kegiatan"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Kegiatan</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.tanggal_kegiatan, "dd MMMM yyyy", { locale: id })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.tanggal_kegiatan}
                    onSelect={(date) => date && setFormData({ ...formData, tanggal_kegiatan: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={(open) => {
        setShowItemDialog(open);
        if (!open) {
          setShowPicDropdown(false);
          setEditingItem(null);
          resetItemForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item Rundown" : "Tambah Item Rundown"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editingItem ? handleEditItem : handleAddItem} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Mulai</Label>
                <Input
                  type="time"
                  value={itemFormData.mulai}
                  onChange={(e) => handleMulaiChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Akhir</Label>
                <Input
                  type="time"
                  value={itemFormData.akhir}
                  onChange={(e) => handleAkhirChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Durasi (jam:menit)</Label>
                <Input
                  value={itemFormData.durasi}
                  onChange={(e) => handleDurasiChange(e.target.value)}
                  placeholder="00:30"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Kegiatan *</Label>
              <Input
                value={itemFormData.kegiatan}
                onChange={(e) => setItemFormData({ ...itemFormData, kegiatan: e.target.value })}
                placeholder="Nama kegiatan"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Uraian</Label>
              <Textarea
                value={itemFormData.uraian}
                onChange={(e) => setItemFormData({ ...itemFormData, uraian: e.target.value })}
                placeholder="Detail uraian kegiatan"
                rows={3}
              />
            </div>
            
            <div className="space-y-2 pic-dropdown-container">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                PIC (Person In Charge)
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari pegawai..."
                  value={picSearch}
                  onChange={(e) => setPicSearch(e.target.value)}
                  onFocus={() => setShowPicDropdown(true)}
                  className="pl-9"
                />
                {showPicDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
                    <div className="px-3 py-2 border-b bg-muted/30">
                      <p className="text-xs text-muted-foreground">
                        {picSearch 
                          ? `Ditemukan ${filteredEmployees.length} dari ${employees.length} pegawai`
                          : `Total ${employees.length} pegawai tersedia`
                        }
                        {itemFormData.pic_ids.length > 0 && ` • ${itemFormData.pic_ids.length} dipilih`}
                      </p>
                    </div>
                    <ScrollArea className="h-72">
                      <div className="p-1">
                        {filteredEmployees.map((emp) => {
                          const isChecked = itemFormData.pic_ids.includes(emp.id);
                          return (
                            <div
                              key={emp.id}
                              className={`flex items-center gap-2 p-2 hover:bg-muted cursor-pointer rounded ${isChecked ? 'bg-primary/5' : ''}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                togglePic(emp);
                              }}
                            >
                              <Checkbox 
                                checked={isChecked}
                                onCheckedChange={() => togglePic(emp)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{emp.nm_pegawai}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {emp.nip && `NIP: ${emp.nip} • `}{emp.nm_unit_organisasi}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        {filteredEmployees.length === 0 && (
                          <p className="p-4 text-sm text-muted-foreground text-center">Tidak ditemukan</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
              
              {/* Preview PIC yang dipilih */}
              {itemFormData.pic_ids.length > 0 && (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">
                      PIC Terpilih ({itemFormData.pic_ids.length} orang)
                    </p>
                    <button
                      type="button"
                      onClick={() => setItemFormData(prev => ({ ...prev, pic_ids: [], pic_names: [] }))}
                      className="text-xs text-destructive hover:underline"
                    >
                      Hapus Semua
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {itemFormData.pic_names.map((name, i) => {
                      const emp = employees.find(e => e.nm_pegawai === name);
                      return (
                        <div
                          key={i}
                          className="inline-flex items-center gap-1 bg-background border px-2 py-1 rounded-md text-sm shadow-sm"
                        >
                          <span className="truncate max-w-[150px]">{name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (emp) togglePic(emp);
                            }}
                            className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Ketik Manual PIC */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Ketik Manual PIC (untuk nama di luar daftar pegawai)
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ketik nama PIC manual, tekan Enter atau klik Tambah..."
                  value={itemFormData.pic_manual_input}
                  onChange={(e) => setItemFormData(prev => ({ ...prev, pic_manual_input: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const name = itemFormData.pic_manual_input.trim();
                      if (name && !itemFormData.pic_manual.includes(name)) {
                        setItemFormData(prev => ({
                          ...prev,
                          pic_manual: [...prev.pic_manual, name],
                          pic_manual_input: ""
                        }));
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const name = itemFormData.pic_manual_input.trim();
                    if (name && !itemFormData.pic_manual.includes(name)) {
                      setItemFormData(prev => ({
                        ...prev,
                        pic_manual: [...prev.pic_manual, name],
                        pic_manual_input: ""
                      }));
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Preview PIC Manual yang ditambahkan */}
              {itemFormData.pic_manual.length > 0 && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      PIC Manual ({itemFormData.pic_manual.length} orang)
                    </p>
                    <button
                      type="button"
                      onClick={() => setItemFormData(prev => ({ ...prev, pic_manual: [] }))}
                      className="text-xs text-destructive hover:underline"
                    >
                      Hapus Semua
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {itemFormData.pic_manual.map((name, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 px-2 py-1 rounded-md text-sm"
                      >
                        <span className="truncate max-w-[150px]">{name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setItemFormData(prev => ({
                              ...prev,
                              pic_manual: prev.pic_manual.filter((_, idx) => idx !== i)
                            }));
                          }}
                          className="ml-1 text-amber-600 hover:text-destructive transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowItemDialog(false);
                  setEditingItem(null);
                  resetItemForm();
                }}
              >
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}