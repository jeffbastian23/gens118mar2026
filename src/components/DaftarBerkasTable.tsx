import { useEffect, useState, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, FileDown, Upload, FileText, ChevronDown, ChevronRight, Edit, QrCode, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ArsipForm from "@/components/ArsipForm";

interface DaftarBerkas {
  id: string;
  no_berkas: number;
  kode_klasifikasi: string;
  uraian_informasi_berkas: string;
  kurun_waktu: string;
  tingkat_perkembangan: string;
  jumlah: number;
  lokasi: string;
  pic: string;
  keterangan: string;
  jenis_arsip: string;
}

interface IsiBerkas {
  id: string;
  no_urut: number;
  no_berkas: number;
  kode_klasifikasi: string;
  uraian_informasi_arsip: string;
  kurun_waktu: string;
  tingkat_perkembangan: string;
  jumlah: number;
  keterangan: string | null;
  dokumen_scan: string | null;
  nomor_surat_naskah: string | null;
  nama_pic: string | null;
}

export default function DaftarBerkasTable() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const canEdit = role !== "overview";
  const [data, setData] = useState<DaftarBerkas[]>([]);
  const [filteredData, setFilteredData] = useState<DaftarBerkas[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isiBerkasMap, setIsiBerkasMap] = useState<Record<number, IsiBerkas[]>>({});
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [loadingIsi, setLoadingIsi] = useState<Set<number>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBerkas, setEditingBerkas] = useState<DaftarBerkas | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [kodeKlasifikasiSearch, setKodeKlasifikasiSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = data;
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    if (kodeKlasifikasiSearch) {
      filtered = filtered.filter((item) =>
        item.kode_klasifikasi.toLowerCase().includes(kodeKlasifikasiSearch.toLowerCase())
      );
    }
    setFilteredData(filtered);
  }, [searchTerm, kodeKlasifikasiSearch, data]);

  const fetchData = async () => {
    const { data: berkas, error } = await supabase
      .from("daftar_berkas")
      .select("*")
      .order("uraian_informasi_berkas", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data daftar berkas",
        variant: "destructive",
      });
      return;
    }

    setData((berkas || []) as DaftarBerkas[]);
  };

  const fetchIsiBerkas = async (noBerkas: number) => {
    if (isiBerkasMap[noBerkas]) return;

    setLoadingIsi(prev => new Set(prev).add(noBerkas));
    
    const { data: isiBerkas, error } = await supabase
      .from("isi_berkas")
      .select("*")
      .eq("no_berkas", noBerkas)
      .order("no_urut", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat isi berkas",
        variant: "destructive",
      });
    } else {
      setIsiBerkasMap(prev => ({
        ...prev,
        [noBerkas]: (isiBerkas || []) as unknown as IsiBerkas[]
      }));
    }
    
    setLoadingIsi(prev => {
      const newSet = new Set(prev);
      newSet.delete(noBerkas);
      return newSet;
    });
  };

  const toggleRow = async (noBerkas: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(noBerkas)) {
      newExpanded.delete(noBerkas);
    } else {
      newExpanded.add(noBerkas);
      await fetchIsiBerkas(noBerkas);
    }
    setExpandedRows(newExpanded);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("daftar_berkas").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus data",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: "Data berhasil dihapus",
    });

    fetchData();
  };

  const handleEdit = (berkas: DaftarBerkas) => {
    setEditingBerkas(berkas);
    setEditDialogOpen(true);
  };

  const handleUpdate = async (formData: any) => {
    if (!editingBerkas) return;

    const { error } = await supabase
      .from("daftar_berkas")
      .update({
        no_berkas: formData.no_berkas,
        kode_klasifikasi: formData.kode_klasifikasi,
        uraian_informasi_berkas: formData.uraian_informasi_berkas,
        kurun_waktu: formData.kurun_waktu,
        tingkat_perkembangan: formData.tingkat_perkembangan,
        jumlah: formData.jumlah,
        lokasi: formData.lokasi,
        pic: formData.pic,
        keterangan: formData.keterangan,
      })
      .eq("id", editingBerkas.id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal mengupdate data",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: "Data berhasil diupdate",
    });

    setEditDialogOpen(false);
    setEditingBerkas(null);
    fetchData();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws) as any[];

      for (const row of jsonData) {
        const { error } = await supabase.from("daftar_berkas").insert({
          no_berkas: row["No Berkas"],
          kode_klasifikasi: row["Kode Klasifikasi"] || row["Kode<br/>Klasifikasi"],
          uraian_informasi_berkas: row["Uraian Informasi Berkas"],
          kurun_waktu: row["Kurun Waktu"],
          tingkat_perkembangan: row["Tingkat Perkembangan"],
          jumlah: row["Jumlah"],
          lokasi: row["Lokasi"],
          pic: row["PIC"],
          keterangan: row["Keterangan"],
        } as any);

        if (error) {
          console.error("Import error:", error);
        }
      }

      toast({
        title: "Berhasil",
        description: "Data berhasil diimpor",
      });

      fetchData();
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((item) => ({
        "No Berkas": item.no_berkas,
        "Kode Klasifikasi": item.kode_klasifikasi,
        "Uraian Informasi Berkas": item.uraian_informasi_berkas,
        "Kurun Waktu": item.kurun_waktu,
        "Tingkat Perkembangan": item.tingkat_perkembangan,
        Jumlah: item.jumlah,
        Lokasi: item.lokasi,
        PIC: item.pic,
        Keterangan: item.keterangan,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Berkas");
    XLSX.writeFile(workbook, "daftar_berkas.xlsx");
  };

  const generateQRLink = (berkas: DaftarBerkas) => {
    // Generate a direct PDF download link
    const baseUrl = window.location.origin;
    return `${baseUrl}/arsip?download=pdf&berkas=${berkas.no_berkas}`;
  };

  const generateLabelPDF = async (berkas: DaftarBerkas) => {
    try {
      const { data: isiBerkas, error } = await supabase
        .from("isi_berkas")
        .select("*")
        .eq("no_berkas", berkas.no_berkas)
        .order("no_urut", { ascending: true });

      if (error) throw error;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Generate QR Code
      const qrLink = generateQRLink(berkas);
      const qrDataUrl = await QRCode.toDataURL(qrLink, { width: 100, margin: 1 });

      // Load logos
      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
      };

      // Import logos from assets
      const logoKemenkeuUrl = await import("@/assets/logo-kemenkeu-pdf.png");
      const logoBeacukaiUrl = await import("@/assets/logo-beacukai-pdf.png");

      let logoKemenkeu: HTMLImageElement | null = null;
      let logoBeacukai: HTMLImageElement | null = null;
      
      try {
        logoKemenkeu = await loadImage(logoKemenkeuUrl.default);
        logoBeacukai = await loadImage(logoBeacukaiUrl.default);
      } catch (e) {
        console.log("Could not load logos, proceeding without them");
      }

      // Header background
      doc.setFillColor(30, 100, 200);
      doc.rect(0, 0, 210, 35, "F");

      // Logos - Kemenkeu (kiri) dan DJBC (kanan) - same size for consistency
      if (logoKemenkeu) {
        doc.addImage(logoKemenkeu, "PNG", 15, 5, 22, 25);
      }
      if (logoBeacukai) {
        doc.addImage(logoBeacukai, "PNG", 173, 5, 22, 25);
      }

      // Header text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Arsip", 105, 15, { align: "center" });
      doc.setFontSize(12);
      doc.text("Kanwil DJBC Jawa Timur I", 105, 25, { align: "center" });

      // Content area
      let yPos = 50;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      
      // Info fields in a structured layout
      const drawField = (label: string, value: string, x: number, y: number, labelWidth: number = 50) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, x, y);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(value, 100);
        doc.text(lines, x + labelWidth, y);
        return Math.max(1, lines.length) * 6;
      };

      // Draw fields
      yPos += drawField("JENIS ARSIP:", berkas.uraian_informasi_berkas, 20, yPos);
      yPos += 4;
      yPos += drawField("KODE KLASIFIKASI:", berkas.kode_klasifikasi, 20, yPos);
      yPos += 4;
      yPos += drawField("TAHUN:", berkas.kurun_waktu, 20, yPos);
      yPos += 4;
      yPos += drawField("TINGKAT:", berkas.tingkat_perkembangan, 20, yPos);
      yPos += 4;
      yPos += drawField("JUMLAH:", String(berkas.jumlah), 20, yPos);
      yPos += 4;
      yPos += drawField("LOKASI:", berkas.lokasi, 20, yPos);
      yPos += 4;
      yPos += drawField("PIC:", berkas.pic, 20, yPos);
      yPos += 4;
      yPos += drawField("KETERANGAN:", berkas.keterangan || "-", 20, yPos);

      // Nomor Boks box on the right
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(145, 45, 45, 30);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("NOMOR BOKS", 167.5, 55, { align: "center" });
      doc.setFontSize(20);
      doc.text(String(berkas.no_berkas), 167.5, 68, { align: "center" });

      // QR Code below Nomor Boks
      doc.addImage(qrDataUrl, "PNG", 152, 80, 30, 30);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Scan untuk detail", 167, 115, { align: "center" });

      // If there are isi_berkas, add content list
      if (isiBerkas && isiBerkas.length > 0) {
        yPos += 20;
        
        // Line separator
        doc.setLineWidth(0.3);
        doc.line(20, yPos - 5, 190, yPos - 5);
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("DAFTAR ISI BERKAS", 105, yPos, { align: "center" });
        yPos += 10;

        // Table header
        doc.setFillColor(240, 240, 240);
        doc.rect(20, yPos - 5, 170, 8, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("No", 25, yPos);
        doc.text("Uraian Informasi Arsip", 40, yPos);
        doc.text("Kurun Waktu", 130, yPos);
        doc.text("Jumlah", 165, yPos);
        yPos += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        (isiBerkas as unknown as IsiBerkas[]).forEach((isi) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          doc.text(String(isi.no_urut), 25, yPos);
          const uraianLines = doc.splitTextToSize(isi.uraian_informasi_arsip || "", 85);
          doc.text(uraianLines, 40, yPos);
          doc.text(isi.kurun_waktu || "", 130, yPos);
          doc.text(String(isi.jumlah), 165, yPos);

          yPos += Math.max(6, uraianLines.length * 4);
        });
      }

      doc.save(`Label-Berkas-${berkas.no_berkas}.pdf`);
      
      toast({
        title: "Berhasil",
        description: "Label PDF berhasil diunduh",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Gagal membuat label PDF",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap mb-4">
        <Input
          placeholder="Cari daftar berkas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Cari kode klasifikasi..."
          value={kodeKlasifikasiSearch}
          onChange={(e) => setKodeKlasifikasiSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="flex justify-between gap-2 flex-wrap">
        {canEdit && (
          <Button onClick={() => setShowAddForm(!showAddForm)} variant="default" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {showAddForm ? "Tutup Form" : "Tambah Form Daftar Berkas"}
          </Button>
        )}
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <FileDown className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => document.getElementById("import-daftar")?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Import Excel
            </Button>
            <Input
              id="import-daftar"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={async () => {
                if (!confirm("Yakin ingin menghapus SEMUA data daftar berkas? Tindakan ini tidak dapat dibatalkan.")) return;
                const { error } = await supabase.from("daftar_berkas").delete().not("id", "is", null);
                if (error) {
                  toast({ title: "Error", description: "Gagal menghapus semua data", variant: "destructive" });
                  return;
                }
                toast({ title: "Berhasil", description: "Semua data berhasil dihapus" });
                fetchData();
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Semua
            </Button>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <h3 className="text-lg font-semibold mb-4">Tambah Daftar Berkas Baru</h3>
          <ArsipForm onSuccess={handleFormSuccess} />
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>No Berkas</TableHead>
              <TableHead>Kode Klasifikasi</TableHead>
              <TableHead>Uraian Informasi Berkas</TableHead>
              <TableHead>Kurun Waktu</TableHead>
              <TableHead>Tingkat</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>PIC Arsip</TableHead>
              <TableHead>Jenis Arsip</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground">
                  {searchTerm ? "Tidak ada data yang cocok" : "Tidak ada data"}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <Fragment key={item.id}>
                  <TableRow className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(item.no_berkas)}
                        className="p-0 h-6 w-6"
                      >
                        {expandedRows.has(item.no_berkas) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>{item.no_berkas}</TableCell>
                    <TableCell>{item.kode_klasifikasi}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{item.uraian_informasi_berkas}</TableCell>
                    <TableCell>{item.kurun_waktu}</TableCell>
                    <TableCell>{item.tingkat_perkembangan}</TableCell>
                    <TableCell>{item.jumlah}</TableCell>
                    <TableCell>{item.lokasi}</TableCell>
                    <TableCell>{item.pic}</TableCell>
                    <TableCell>{item.jenis_arsip || "Arsip Umum"}</TableCell>
                    <TableCell>{item.keterangan}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {isAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateLabelPDF(item)}
                          title="Cetak Label PDF dengan QR"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(item.no_berkas) && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={12} className="p-0">
                        <div className="p-4">
                          <h4 className="font-semibold text-sm mb-3">Isi Berkas #{item.no_berkas}</h4>
                          {loadingIsi.has(item.no_berkas) ? (
                            <p className="text-sm text-muted-foreground">Memuat...</p>
                          ) : isiBerkasMap[item.no_berkas]?.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Tidak ada isi berkas</p>
                          ) : (
                            <div className="rounded border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted">
                                    <TableHead className="text-xs">No Urut</TableHead>
                                    <TableHead className="text-xs">Kode Klasifikasi</TableHead>
                                    <TableHead className="text-xs">No Surat/Naskah</TableHead>
                                    <TableHead className="text-xs">Uraian Informasi Arsip</TableHead>
                                    <TableHead className="text-xs">Tanggal Naskah</TableHead>
                                    <TableHead className="text-xs">Nama PIC</TableHead>
                                    <TableHead className="text-xs">Tingkat</TableHead>
                                    <TableHead className="text-xs">Jumlah</TableHead>
                                    <TableHead className="text-xs">Keterangan</TableHead>
                                    <TableHead className="text-xs">Aksi</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {isiBerkasMap[item.no_berkas]?.map((isi) => (
                                    <TableRow key={isi.id}>
                                      <TableCell className="text-xs">{isi.no_urut}</TableCell>
                                      <TableCell className="text-xs">{isi.kode_klasifikasi}</TableCell>
                                      <TableCell className="text-xs">{isi.nomor_surat_naskah || "-"}</TableCell>
                                      <TableCell className="text-xs">{isi.uraian_informasi_arsip}</TableCell>
                                      <TableCell className="text-xs">{isi.kurun_waktu}</TableCell>
                                      <TableCell className="text-xs">{isi.nama_pic || "-"}</TableCell>
                                      <TableCell className="text-xs">{isi.tingkat_perkembangan}</TableCell>
                                      <TableCell className="text-xs">{isi.jumlah}</TableCell>
                                      <TableCell className="text-xs">{isi.keterangan || "-"}</TableCell>
                                      <TableCell className="text-xs">
                                        {isi.dokumen_scan ? (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const link = document.createElement("a");
                                              link.href = isi.dokumen_scan!;
                                              link.download = `dokumen_${isi.no_urut}_${isi.kode_klasifikasi}.pdf`;
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                            }}
                                            title="Unduh Dokumen"
                                            className="h-7 px-2"
                                          >
                                            <FileDown className="w-3 h-3 mr-1" />
                                            Unduh
                                          </Button>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Daftar Berkas</DialogTitle>
          </DialogHeader>
          {editingBerkas && (
            <ArsipForm 
              initialData={editingBerkas} 
              onSuccess={() => {
                setEditDialogOpen(false);
                fetchData();
              }}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
