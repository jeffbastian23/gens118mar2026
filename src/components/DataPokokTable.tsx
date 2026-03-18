import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Database, FileDown, Upload, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import MigrateNIPDialog from "@/components/MigrateNIPDialog";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataPokok {
  "Nama Lengkap": string;
  "NIP": string;
  "Uraian Pangkat": string;
}

export default function DataPokokTable() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [data, setData] = useState<DataPokok[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [migrateOpen, setMigrateOpen] = useState(false);

  useEffect(() => {
    loadExcelData();
  }, []);

  const loadExcelData = async () => {
    try {
      const response = await fetch("/data/data_pokok.xlsx");
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<DataPokok>(worksheet);
      setData(jsonData);
    } catch (error) {
      console.error("Error loading Excel file:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );


  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Memuat data pokok...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span>Data Pokok Pegawai</span>
            <div className="flex gap-2 flex-wrap">
              {isAdmin && (
                <>
                  <Button 
                    onClick={() => setMigrateOpen(true)} 
                    size="sm"
                    variant="outline"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Migrasi NIP ke Supabase
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const worksheet = XLSX.utils.json_to_sheet(data);
                      const workbook = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pokok");
                      XLSX.writeFile(workbook, "data_pokok_pegawai.xlsx");
                    }}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  <label>
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Excel
                      </span>
                    </Button>
                    <input type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async (evt) => {
                        const bstr = evt.target?.result;
                        const wb = XLSX.read(bstr, { type: "binary" });
                        const wsname = wb.SheetNames[0];
                        const ws = wb.Sheets[wsname];
                        const jsonData = XLSX.utils.sheet_to_json(ws) as any[];
                        let imported = 0;
                        for (const row of jsonData) {
                          const { error } = await supabase.from("employees").insert({
                            nm_pegawai: row["Nama Lengkap"] || "",
                            nip: String(row["NIP"]).replace(/^'/, "") || "",
                            uraian_pangkat: row["Uraian Pangkat"] || "",
                            uraian_jabatan: "",
                            nm_unit_organisasi: "Kanwil DJBC Jawa Timur I"
                          });
                          if (!error) imported++;
                        }
                        alert(`${imported} data berhasil diimport`);
                        loadExcelData();
                      };
                      reader.readAsBinaryString(file);
                      e.target.value = "";
                    }} />
                  </label>
                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (!confirm("Yakin ingin menghapus SEMUA data employees dari Supabase? Tindakan ini tidak dapat dibatalkan.")) return;
                      const { error } = await supabase.from("employees").delete().neq("id", "");
                      if (error) {
                        alert("Gagal menghapus semua data: " + error.message);
                        return;
                      }
                      alert("Semua data employees berhasil dihapus");
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus Semua
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NIP, pangkat, organisasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Menampilkan {filteredData.length} dari {data.length} data pegawai
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>Uraian Pangkat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Tidak ada data yang ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{item["Nama Lengkap"]}</TableCell>
                    <TableCell>{String(item["NIP"]).replace(/^'/, "")}</TableCell>
                    <TableCell>{item["Uraian Pangkat"]}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>

    <MigrateNIPDialog
      open={migrateOpen}
      onOpenChange={setMigrateOpen}
      onSuccess={loadExcelData}
    />
    </div>
  );
}
