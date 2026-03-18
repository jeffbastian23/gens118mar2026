import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Download, Upload, Printer, FileDown, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import logoKemenkeuPdf from "@/assets/logo-kemenkeu-pdf.png";
import logoBeacukaiPdf from "@/assets/logo-beacukai-pdf.png";
import { cn } from "@/lib/utils";

interface DosirIn {
  id: string;
  nama_lengkap: string;
  nip: string | null;
  is_spd_complete: boolean;
  is_dosir_complete: boolean;
  tim_upk_id: string | null;
  tim_upk_name: string | null;
  tanggal_input: string;
  created_at: string;
  created_by_email: string | null;
}

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string | null;
  uraian_jabatan: string;
}

interface TimUpk {
  id: string;
  name: string;
}

export default function DosirInTable() {
  const { user } = useAuth();
  const [data, setData] = useState<DosirIn[]>([]);
  const [employeesData, setEmployeesData] = useState<Employee[]>([]);
  const [timUpkData, setTimUpkData] = useState<TimUpk[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<DosirIn | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [employeeSelectOpen, setEmployeeSelectOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nip: "",
    jabatan: "",
    is_spd_complete: false,
    is_dosir_complete: false,
    tim_upk_id: "",
    tim_upk_name: ""
  });

  useEffect(() => {
    fetchData();
    fetchEmployeesData();
    fetchTimUpkData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: dosirData, error } = await supabase
        .from("dosir_in")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setData(dosirData || []);
    } catch (error) {
      console.error("Error fetching dosir_in:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesData = async () => {
    try {
      let allEmployees: Employee[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: employees, error } = await supabase
          .from("employees")
          .select("id, nm_pegawai, nip, uraian_jabatan")
          .order("nm_pegawai")
          .range(from, from + batchSize - 1);
        
        if (error) throw error;
        
        if (employees && employees.length > 0) {
          allEmployees = [...allEmployees, ...employees];
          from += batchSize;
          hasMore = employees.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      
      setEmployeesData(allEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchTimUpkData = async () => {
    try {
      const { data: upk, error } = await supabase
        .from("tim_upk")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setTimUpkData(upk || []);
    } catch (error) {
      console.error("Error fetching tim_upk:", error);
    }
  };

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch) return employeesData.slice(0, 100);
    const searchLower = employeeSearch.toLowerCase();
    return employeesData.filter(e => 
      e.nm_pegawai.toLowerCase().includes(searchLower) ||
      (e.nip && e.nip.includes(employeeSearch))
    ).slice(0, 100);
  }, [employeesData, employeeSearch]);

  const handleSelectEmployee = (nmPegawai: string) => {
    const employee = employeesData.find(e => e.nm_pegawai === nmPegawai);
    setFormData({
      ...formData,
      nama_lengkap: nmPegawai,
      nip: employee?.nip || "",
      jabatan: employee?.uraian_jabatan || ""
    });
    setEmployeeSelectOpen(false);
  };

  const handleSelectTimUpk = (timUpkId: string) => {
    const tim = timUpkData.find(t => t.id === timUpkId);
    setFormData({
      ...formData,
      tim_upk_id: timUpkId,
      tim_upk_name: tim?.name || ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const { error } = await supabase
          .from("dosir_in")
          .update({
            nama_lengkap: formData.nama_lengkap,
            nip: formData.nip || null,
            is_spd_complete: formData.is_spd_complete,
            is_dosir_complete: formData.is_dosir_complete,
            tim_upk_id: formData.tim_upk_id || null,
            tim_upk_name: formData.tim_upk_name || null
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const { error } = await supabase.from("dosir_in").insert({
          nama_lengkap: formData.nama_lengkap,
          nip: formData.nip || null,
          is_spd_complete: formData.is_spd_complete,
          is_dosir_complete: formData.is_dosir_complete,
          tim_upk_id: formData.tim_upk_id || null,
          tim_upk_name: formData.tim_upk_name || null,
          tanggal_input: new Date().toISOString(),
          created_by_email: user?.email
        });

        if (error) throw error;
        toast.success("Data berhasil ditambahkan");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Gagal menyimpan data");
    }
  };

  const resetForm = () => {
    setFormData({
      nama_lengkap: "",
      nip: "",
      jabatan: "",
      is_spd_complete: false,
      is_dosir_complete: false,
      tim_upk_id: "",
      tim_upk_name: ""
    });
    setEditingItem(null);
    setEmployeeSearch("");
  };

  const handleEdit = (item: DosirIn) => {
    setEditingItem(item);
    // Find employee jabatan
    const employee = employeesData.find(e => e.nm_pegawai === item.nama_lengkap);
    setFormData({
      nama_lengkap: item.nama_lengkap,
      nip: item.nip || "",
      jabatan: employee?.uraian_jabatan || "",
      is_spd_complete: item.is_spd_complete,
      is_dosir_complete: item.is_dosir_complete,
      tim_upk_id: item.tim_upk_id || "",
      tim_upk_name: item.tim_upk_name || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase.from("dosir_in").delete().eq("id", itemToDelete);
      if (error) throw error;
      toast.success("Data berhasil dihapus");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Gagal menghapus data");
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((item, index) => ({
      No: index + 1,
      "Nama Lengkap": item.nama_lengkap,
      NIP: item.nip || "",
      "SPD Lengkap": item.is_spd_complete ? "Ya" : "Tidak",
      "Dosir Lengkap": item.is_dosir_complete ? "Ya" : "Tidak",
      "Tim UPK": item.tim_upk_name || "",
      "Tanggal Input": format(new Date(item.tanggal_input), "dd/MM/yyyy HH:mm")
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dosir In");
    XLSX.writeFile(wb, `Dosir_In_${format(new Date(), "yyyyMMdd")}.xlsx`);
    toast.success("Data berhasil diekspor");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        const importedData = jsonData.map((row: any) => ({
          nama_lengkap: row["Nama Lengkap"] || "",
          nip: row["NIP"] || null,
          is_spd_complete: row["SPD Lengkap"]?.toLowerCase() === "ya",
          is_dosir_complete: row["Dosir Lengkap"]?.toLowerCase() === "ya",
          tim_upk_name: row["Tim UPK"] || null,
          tanggal_input: new Date().toISOString(),
          created_by_email: user?.email
        })).filter((item: any) => item.nama_lengkap);

        if (importedData.length === 0) {
          toast.error("Tidak ada data valid untuk diimpor");
          return;
        }

        const { error } = await supabase.from("dosir_in").insert(importedData);
        if (error) throw error;
        toast.success(`${importedData.length} data berhasil diimpor`);
        fetchData();
      } catch (error) {
        console.error("Import error:", error);
        toast.error("Gagal mengimpor data");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(item => item.id)));
    }
  };

  const handleDownloadSelectedPDF = () => {
    const selectedData = filteredData.filter(item => selectedIds.has(item.id));
    
    if (selectedData.length === 0) {
      toast.error("Pilih minimal satu data untuk diunduh");
      return;
    }

    // Create a single PDF with table format
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Add logos to header
    const logoWidth = 20;
    const logoHeight = 20;
    doc.addImage(logoKemenkeuPdf, 'PNG', 15, 8, logoWidth, logoHeight);
    doc.addImage(logoBeacukaiPdf, 'PNG', 262, 8, logoWidth, logoHeight);
    
    // Header text
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DAFTAR TANDA TERIMA DOSIR PEGAWAI MASUK", 148.5, 15, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("KANTOR WILAYAH DJBC JAWA TIMUR I", 148.5, 22, { align: "center" });
    
    doc.line(15, 30, 282, 30);
    
    // Table header
    const startY = 38;
    const colWidths = [12, 55, 50, 25, 25, 40, 35, 25];
    const headers = ["No", "Nama Lengkap", "NIP", "SPD", "Dosir", "Tim UPK", "Tanggal Input", "Tanda Tangan"];
    
    let xPos = 15;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    // Draw header row
    doc.rect(15, startY - 6, colWidths.reduce((a, b) => a + b, 0), 10);
    headers.forEach((header, i) => {
      doc.text(header, xPos + colWidths[i] / 2, startY, { align: "center" });
      if (i < headers.length - 1) {
        doc.line(xPos + colWidths[i], startY - 6, xPos + colWidths[i], startY + 4);
      }
      xPos += colWidths[i];
    });
    
    // Draw data rows
    doc.setFont("helvetica", "normal");
    let yPos = startY + 12;
    const rowHeight = 18;
    
    selectedData.forEach((item, index) => {
      xPos = 15;
      
      // Draw row border
      doc.rect(15, yPos - 6, colWidths.reduce((a, b) => a + b, 0), rowHeight);
      
      // Draw column separators
      let tempX = 15;
      colWidths.slice(0, -1).forEach(width => {
        tempX += width;
        doc.line(tempX, yPos - 6, tempX, yPos - 6 + rowHeight);
      });
      
      // Add row data
      doc.setFontSize(8);
      doc.text(String(index + 1), xPos + colWidths[0] / 2, yPos + 2, { align: "center" });
      xPos += colWidths[0];
      
      doc.text(item.nama_lengkap || '-', xPos + 2, yPos + 2);
      xPos += colWidths[1];
      
      doc.text(item.nip || '-', xPos + 2, yPos + 2);
      xPos += colWidths[2];
      
      doc.text(item.is_spd_complete ? '✓' : '-', xPos + colWidths[3] / 2, yPos + 2, { align: "center" });
      xPos += colWidths[3];
      
      doc.text(item.is_dosir_complete ? '✓' : '-', xPos + colWidths[4] / 2, yPos + 2, { align: "center" });
      xPos += colWidths[4];
      
      doc.text(item.tim_upk_name || '-', xPos + 2, yPos + 2);
      xPos += colWidths[5];
      
      doc.text(format(new Date(item.tanggal_input), "dd/MM/yy HH:mm"), xPos + colWidths[6] / 2, yPos + 2, { align: "center" });
      
      yPos += rowHeight;
      
      // Check if need new page
      if (yPos > 180 && index < selectedData.length - 1) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    doc.save(`Tanda_Terima_Dosir_In_${format(new Date(), "yyyyMMdd")}.pdf`);
    toast.success(`PDF berhasil diunduh dengan ${selectedData.length} data`);
    setSelectedIds(new Set());
  };

  const handlePrintSelected = () => {
    const selectedData = filteredData.filter(item => selectedIds.has(item.id));

    if (selectedData.length === 0) {
      toast.error("Pilih minimal satu data untuk dicetak");
      return;
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Dosir In</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
            .header { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>DAFTAR DOSIR IN</h2>
            <p>Kanwil DJBC Jawa Timur I</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Lengkap</th>
                <th>NIP</th>
                <th>SPD</th>
                <th>Dosir</th>
                <th>Tim UPK</th>
                <th>Tanggal Input</th>
              </tr>
            </thead>
            <tbody>
              ${selectedData.map((item, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${item.nama_lengkap}</td>
                  <td>${item.nip || '-'}</td>
                  <td>${item.is_spd_complete ? '✓' : '-'}</td>
                  <td>${item.is_dosir_complete ? '✓' : '-'}</td>
                  <td>${item.tim_upk_name || '-'}</td>
                  <td>${format(new Date(item.tanggal_input), "dd/MM/yyyy HH:mm")}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.nip && item.nip.includes(searchTerm));
    
    return matchesSearch;
  });

  if (loading) {
    return <div className="flex items-center justify-center p-8">Memuat data...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            Dosir In
            <span className="text-sm font-normal text-muted-foreground">
              (Total: {filteredData.length} data)
            </span>
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Data
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <label>
              <Button variant="outline" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Excel
                </span>
              </Button>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportExcel}
              />
            </label>
            <Button variant="outline" onClick={handlePrintSelected}>
              <Printer className="w-4 h-4 mr-2" />
              Cetak
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadSelectedPDF}
              disabled={selectedIds.size === 0}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Unduh ({selectedIds.size})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Cari nama/NIP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filterType} onValueChange={(v: "all" | "in" | "out") => setFilterType(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="in">Masuk</SelectItem>
              <SelectItem value="out">Keluar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox 
                    checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>No</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>SPD Lengkap</TableHead>
                <TableHead>Dosir Lengkap</TableHead>
                <TableHead>Tim UPK</TableHead>
                <TableHead>Tanggal Input</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleSelection(item.id)}
                    />
                  </TableCell>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.nama_lengkap}</TableCell>
                  <TableCell>{item.nip || "-"}</TableCell>
                  <TableCell>
                    <Checkbox checked={item.is_spd_complete} disabled />
                  </TableCell>
                  <TableCell>
                    <Checkbox checked={item.is_dosir_complete} disabled />
                  </TableCell>
                  <TableCell>{item.tim_upk_name || "-"}</TableCell>
                  <TableCell>{format(new Date(item.tanggal_input), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setItemToDelete(item.id); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Data" : "Tambah Data Dosir In"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap *</Label>
              <Popover open={employeeSelectOpen} onOpenChange={setEmployeeSelectOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={employeeSelectOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.nama_lengkap || "Pilih nama pegawai..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Cari nama atau NIP..." 
                      value={employeeSearch}
                      onValueChange={setEmployeeSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Tidak ada pegawai ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {filteredEmployees.map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={employee.nm_pegawai}
                            onSelect={() => handleSelectEmployee(employee.nm_pegawai)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.nama_lengkap === employee.nm_pegawai ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{employee.nm_pegawai}</span>
                              <span className="text-xs text-muted-foreground">{employee.nip || "-"}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Jabatan (Otomatis)</Label>
              <Input value={formData.jabatan} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>NIP (Otomatis)</Label>
              <Input value={formData.nip} readOnly className="bg-muted" />
            </div>
            <div className="space-y-3">
              <Label>Status Kelengkapan</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="spd"
                  checked={formData.is_spd_complete}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_spd_complete: checked === true })}
                />
                <label htmlFor="spd" className="text-sm">SPD sudah lengkap dan benar</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dosir"
                  checked={formData.is_dosir_complete}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_dosir_complete: checked === true })}
                />
                <label htmlFor="dosir" className="text-sm">Dosir sudah lengkap</label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tim UPK</Label>
              <Select 
                value={formData.tim_upk_id} 
                onValueChange={handleSelectTimUpk}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tim UPK" />
                </SelectTrigger>
                <SelectContent>
                  {timUpkData.map((tim) => (
                    <SelectItem key={tim.id} value={tim.id}>{tim.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingItem ? "Simpan Perubahan" : "Tambah"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Data yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}