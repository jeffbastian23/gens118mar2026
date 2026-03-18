import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toProperCase } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";
import logoKemenkeu from "@/assets/logo-kemenkeu-pdf.png";

interface Employee {
  id: string;
  nm_pegawai: string;
  uraian_pangkat: string;
  uraian_jabatan: string;
  nm_unit_organisasi: string;
}

interface AbsenNamaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AbsenNamaDialog({ open, onOpenChange, onSuccess }: AbsenNamaDialogProps) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [employeeUnitFilter, setEmployeeUnitFilter] = useState("");
  const [employeeJabatanFilter, setEmployeeJabatanFilter] = useState("");
  const [unitSearchTerm, setUnitSearchTerm] = useState("");
  const [jabatanSearchTerm, setJabatanSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    nama_kegiatan: "",
    tanggal: new Date(),
    tempat: "",
    employee_ids: [] as string[]
  });

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
    let allEmployees: Employee[] = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from("employees")
        .select("id, nm_pegawai, uraian_pangkat, uraian_jabatan, nm_unit_organisasi")
        .order("nm_pegawai")
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) break;
      if (!data || data.length === 0) break;
      
      allEmployees = [...allEmployees, ...data];
      
      if (data.length < pageSize) break;
      page++;
    }
    
    setEmployees(allEmployees);
  };

  const resetForm = () => {
    setFormData({
      nama_kegiatan: "",
      tanggal: new Date(),
      tempat: "",
      employee_ids: []
    });
    setEmployeeSearchTerm("");
    setEmployeeUnitFilter("");
    setEmployeeJabatanFilter("");
  };

  const toggleEmployee = (empId: string) => {
    setFormData(prev => ({
      ...prev,
      employee_ids: prev.employee_ids.includes(empId)
        ? prev.employee_ids.filter(id => id !== empId)
        : [...prev.employee_ids, empId]
    }));
  };

  // Get unique units and jabatan
  const uniqueUnits = [...new Set(employees.map(e => e.nm_unit_organisasi))].filter(Boolean).sort();
  const uniqueJabatan = [...new Set(employees.map(e => e.uraian_jabatan))].filter(Boolean).sort();

  // Filter units by search
  const searchedUnits = uniqueUnits.filter(unit => 
    unit.toLowerCase().includes(unitSearchTerm.toLowerCase())
  );

  // Filter jabatan by search
  const searchedJabatan = uniqueJabatan.filter(jabatan =>
    jabatan.toLowerCase().includes(jabatanSearchTerm.toLowerCase())
  );

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const searchMatch = employeeSearchTerm === "" || 
      emp.nm_pegawai.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      emp.uraian_pangkat.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      emp.uraian_jabatan.toLowerCase().includes(employeeSearchTerm.toLowerCase());
    
    const unitMatch = !employeeUnitFilter || employeeUnitFilter === " " || 
      emp.nm_unit_organisasi === employeeUnitFilter;
    
    const jabatanMatch = !employeeJabatanFilter || employeeJabatanFilter === " " ||
      emp.uraian_jabatan === employeeJabatanFilter;
    
    return searchMatch && unitMatch && jabatanMatch;
  });

  const calculatePages = () => {
    const rowsPerPage = 20;
    return Math.ceil(formData.employee_ids.length / rowsPerPage) || 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama_kegiatan || !formData.tempat) {
      toast.error("Nama kegiatan dan tempat harus diisi");
      return;
    }

    if (formData.employee_ids.length === 0) {
      toast.error("Pilih minimal 1 pegawai");
      return;
    }

    setLoading(true);

    try {
      // Save to database
      const { error } = await supabase
        .from("absen_manual")
        .insert({
          nama_kegiatan: formData.nama_kegiatan,
          tanggal: format(formData.tanggal, "yyyy-MM-dd"),
          tempat: formData.tempat,
          jumlah_page: calculatePages(),
          created_by_email: user?.email
        });

      if (error) throw error;

      // Generate PDF with employee names
      await generatePDFWithNames();

      toast.success("Data berhasil ditambahkan dan PDF di-generate");
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const generatePDFWithNames = async () => {
    const selectedEmployees = employees.filter(emp => formData.employee_ids.includes(emp.id));
    const rowsPerPage = 20;
    const totalPages = calculatePages();
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    
    const colNo = 12;
    const colNama = (contentWidth - colNo) * 0.4;
    const colUnit = (contentWidth - colNo) * 0.35;
    const colTTD = (contentWidth - colNo) * 0.25;
    
    // Load logo image
    const loadImage = (src: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => resolve("");
        img.src = src;
      });
    };
    
    const logoBase64 = await loadImage(logoKemenkeu);
    
    const drawHeader = () => {
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", margin, 8, 22, 22);
      }
      
      const textCenterX = (pageWidth + margin + 22) / 2;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("KEMENTERIAN KEUANGAN REPUBLIK INDONESIA", textCenterX, 12, { align: "center" });
      
      doc.setFontSize(9);
      doc.text("DIREKTORAT JENDERAL BEA DAN CUKAI", textCenterX, 17, { align: "center" });
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("KANTOR WILAYAH DIREKTORAT JENDERAL BEA DAN CUKAI JAWA TIMUR I", textCenterX, 22, { align: "center" });
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("JALAN RAYA BANDARA JUANDA NOMOR 39, DESA SEMAMBUNG, SIDOARJO 61254", textCenterX, 27, { align: "center" });
      doc.text("TELEPON (031) 8675356; FAKSIMILE (031) 8675335; LAMAN kanwiljatim1.beacukai.go.id", textCenterX, 31, { align: "center" });
      doc.text("PUSAT KONTAK LAYANAN 1500225; SUREL kwbcjatim1@customs.go.id", textCenterX, 35, { align: "center" });
      
      doc.setLineWidth(0.5);
      doc.line(margin, 38, pageWidth - margin, 38);
      doc.setLineWidth(0.2);
      doc.line(margin, 39, pageWidth - margin, 39);
    };
    
    let employeeIndex = 0;
    
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      
      drawHeader();
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(formData.nama_kegiatan, pageWidth / 2, 50, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Tanggal : ${format(formData.tanggal, "EEEE, d MMMM yyyy", { locale: id })}`, margin, 60);
      doc.text(`Tempat : ${formData.tempat}`, margin, 66);
      
      let y = 75;
      const headerHeight = 9;
      const rowHeight = 9;
      
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, contentWidth, headerHeight, "F");
      doc.setDrawColor(0);
      doc.rect(margin, y, contentWidth, headerHeight);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      let x = margin;
      
      doc.rect(x, y, colNo, headerHeight);
      doc.text("No", x + colNo / 2, y + 6, { align: "center" });
      x += colNo;
      
      doc.rect(x, y, colNama, headerHeight);
      doc.text("Nama", x + colNama / 2, y + 6, { align: "center" });
      x += colNama;
      
      doc.rect(x, y, colUnit, headerHeight);
      doc.text("Unit Kerja", x + colUnit / 2, y + 6, { align: "center" });
      x += colUnit;
      
      doc.rect(x, y, colTTD, headerHeight);
      doc.text("Tanda Tangan", x + colTTD / 2, y + 6, { align: "center" });
      
      y += headerHeight;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      
      for (let row = 0; row < rowsPerPage && employeeIndex < selectedEmployees.length; row++) {
        const emp = selectedEmployees[employeeIndex];
        x = margin;
        
        doc.rect(x, y, colNo, rowHeight);
        doc.text(String(employeeIndex + 1), x + colNo / 2, y + 6, { align: "center" });
        x += colNo;
        
        doc.rect(x, y, colNama, rowHeight);
        const namaText = toProperCase(emp.nm_pegawai);
        doc.text(namaText.substring(0, 35), x + 2, y + 6);
        x += colNama;
        
        doc.rect(x, y, colUnit, rowHeight);
        const unitText = emp.nm_unit_organisasi || "-";
        doc.text(unitText.substring(0, 30), x + 2, y + 6);
        x += colUnit;
        
        doc.rect(x, y, colTTD, rowHeight);
        
        y += rowHeight;
        employeeIndex++;
      }
      
      doc.setFontSize(8);
      doc.text(`Halaman ${page + 1} dari ${totalPages}`, pageWidth / 2, 285, { align: "center" });
    }
    
    doc.save(`Absen_Nama_${formData.nama_kegiatan.replace(/\s+/g, "_")}_${format(formData.tanggal, "yyyyMMdd")}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Absen Nama
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 px-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Kegiatan *</Label>
              <Input
                value={formData.nama_kegiatan}
                onChange={(e) => setFormData({ ...formData, nama_kegiatan: e.target.value })}
                placeholder="Contoh: Jam Pimpinan DJBC"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tempat *</Label>
              <Input
                value={formData.tempat}
                onChange={(e) => setFormData({ ...formData, tempat: e.target.value })}
                placeholder="Contoh: Auditorium Bung Tomo"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.tanggal, "PPP", { locale: id })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.tanggal}
                  onSelect={(date) => date && setFormData({ ...formData, tanggal: date })}
                  locale={id}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label>Identitas Pegawai yang Hadir *</Label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-[50%] -translate-y-[52%] h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Cari nama, pangkat, atau jabatan..."
                  value={employeeSearchTerm}
                  onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="space-y-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    placeholder="Cari unit..."
                    value={unitSearchTerm}
                    onChange={(e) => setUnitSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={employeeUnitFilter} onValueChange={setEmployeeUnitFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Unit Organisasi" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] max-w-[500px]">
                    <SelectItem value=" ">Semua Unit</SelectItem>
                    {searchedUnits.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    placeholder="Cari jabatan..."
                    value={jabatanSearchTerm}
                    onChange={(e) => setJabatanSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={employeeJabatanFilter} onValueChange={setEmployeeJabatanFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Jabatan" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] max-w-[500px]">
                    <SelectItem value=" ">Semua Jabatan</SelectItem>
                    {searchedJabatan.map(jabatan => (
                      <SelectItem key={jabatan} value={jabatan}>{jabatan}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const allFilteredIds = filteredEmployees.map(emp => emp.id);
                  setFormData(prev => ({
                    ...prev,
                    employee_ids: allFilteredIds
                  }));
                }}
              >
                Check All ({filteredEmployees.length})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    employee_ids: []
                  }));
                }}
              >
                Unchecked
              </Button>
            </div>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
              {filteredEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada pegawai yang sesuai dengan pencarian
                </p>
              ) : (
                filteredEmployees.map(emp => (
                  <div key={emp.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.employee_ids.includes(emp.id)}
                      onCheckedChange={() => toggleEmployee(emp.id)}
                    />
                    <label className="text-sm cursor-pointer flex-1">
                      {toProperCase(emp.nm_pegawai)} - {toProperCase(emp.uraian_pangkat)} - {toProperCase(emp.uraian_jabatan)}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p>
              <strong>Pegawai dipilih:</strong> {formData.employee_ids.length} orang
            </p>
            <p>
              <strong>Jumlah halaman:</strong> {calculatePages()} halaman (20 baris per halaman)
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan & Generate PDF"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
