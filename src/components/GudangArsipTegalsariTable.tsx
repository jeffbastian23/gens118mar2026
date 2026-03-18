import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileDown, Upload, Trash2, Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import GudangArsipTegalsariForm from "./GudangArsipTegalsariForm";

interface GudangArsip {
  id: string;
  no_urut: number;
  nomor_rak: string;
  jenis_rak: string;
  kapasitas_box_per_rak: number;
  jumlah_rak: number;
  kapasitas: number;
  jumlah_terisi_box: number;
  sisa_kapasitas_box: number;
}

export default function GudangArsipTegalsariTable() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const canEdit = role !== "overview";
  const [data, setData] = useState<GudangArsip[]>([]);
  const [filteredData, setFilteredData] = useState<GudangArsip[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editData, setEditData] = useState<GudangArsip | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = data.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [searchTerm, data]);

  const fetchData = async () => {
    const { data: gudang, error } = await supabase
      .from("gudang_arsip_tegalsari")
      .select("*")
      .order("no_urut", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data gudang arsip",
        variant: "destructive",
      });
      return;
    }

    if (gudang) {
      // Fetch counts from pendataan_masuk for each nomor_rak
      const updatedData = await Promise.all(
        gudang.map(async (item) => {
          const { data: countData } = await supabase
            .from("pendataan_masuk")
            .select("id", { count: "exact" })
            .eq("nomor_rak", item.nomor_rak);

          const jumlahTerisi = countData?.length || 0;
          const kapasitas = item.jumlah_rak * item.kapasitas_box_per_rak;
          const sisaKapasitas = kapasitas - jumlahTerisi;

          // Update the database with the calculated values
          await supabase
            .from("gudang_arsip_tegalsari")
            .update({
              jumlah_terisi_box: jumlahTerisi,
              sisa_kapasitas_box: sisaKapasitas,
            })
            .eq("id", item.id);

          return {
            ...item,
            jumlah_terisi_box: jumlahTerisi,
            sisa_kapasitas_box: sisaKapasitas,
          };
        })
      );

      setData(updatedData as GudangArsip[]);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("gudang_arsip_tegalsari").delete().eq("id", id);

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
        const jenisRak = row["Jenis Rak"] || "Tipe 1";
        const jumlahRak = row["Jumlah Rak"] || 0;
        const jumlahTerisiBox = row["Jumlah Terisi (Box)"] || 0;
        const kapasitasBoxPerRak = jenisRak === "Tipe 1" ? 20 : jenisRak === "Tipe 2" ? 40 : 56;
        const kapasitas = jumlahRak * kapasitasBoxPerRak;
        const sisaKapasitas = kapasitas - jumlahTerisiBox;

        const { error } = await supabase.from("gudang_arsip_tegalsari").insert({
          nomor_rak: row["Nomor Rak"],
          jenis_rak: jenisRak,
          kapasitas_box_per_rak: kapasitasBoxPerRak,
          jumlah_rak: jumlahRak,
          kapasitas: kapasitas,
          jumlah_terisi_box: jumlahTerisiBox,
          sisa_kapasitas_box: sisaKapasitas,
        });

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
        "No Urut": item.no_urut,
        "Nomor Rak": item.nomor_rak,
        "Jenis Rak": item.jenis_rak,
        "Kapasitas Box/Rak": item.kapasitas_box_per_rak,
        "Jumlah Rak": item.jumlah_rak,
        "Kapasitas": item.kapasitas,
        "Jumlah Terisi (Box)": item.jumlah_terisi_box,
        "Sisa Kapasitas (Box)": item.sisa_kapasitas_box,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gudang Arsip");
    XLSX.writeFile(workbook, "gudang_arsip_tegalsari.xlsx");
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditData(null);
    fetchData();
  };

  const handleEdit = (item: GudangArsip) => {
    setEditData(item);
    setShowAddForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-2 flex-wrap mb-4">
        <Input
          placeholder="Cari gudang arsip..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="flex justify-between gap-2 flex-wrap">
        {isAdmin && (
          <Button onClick={() => { setEditData(null); setShowAddForm(!showAddForm); }} variant="default" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {showAddForm ? "Tutup Form" : "Tambah Data Gudang"}
          </Button>
        )}
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <FileDown className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => document.getElementById("import-gudang")?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Import Excel
            </Button>
            <Input
              id="import-gudang"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
            <Button variant="destructive" size="sm" onClick={async () => {
              if (data.length === 0) {
                toast({ title: "Error", description: "Tidak ada data untuk dihapus", variant: "destructive" });
                return;
              }
              if (!confirm(`Yakin ingin menghapus SEMUA ${data.length} data gudang arsip?`)) return;
              const { error } = await supabase.from("gudang_arsip_tegalsari").delete().neq("id", "00000000-0000-0000-0000-000000000000");
              if (error) {
                toast({ title: "Error", description: "Gagal menghapus semua data", variant: "destructive" });
                return;
              }
              toast({ title: "Berhasil", description: "Semua data berhasil dihapus" });
              fetchData();
            }}>
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Semua
            </Button>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <h3 className="text-lg font-semibold mb-4">{editData ? "Edit Data Gudang Arsip" : "Tambah Data Gudang Arsip"}</h3>
          <GudangArsipTegalsariForm onSuccess={handleFormSuccess} editData={editData} />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No Urut</TableHead>
              <TableHead>Nomor Rak</TableHead>
              <TableHead>Jenis Rak</TableHead>
              <TableHead>Kapasitas Box/Rak</TableHead>
              <TableHead>Jumlah Rak</TableHead>
              <TableHead>Kapasitas</TableHead>
              <TableHead>Jumlah Terisi (Box)</TableHead>
              <TableHead>Sisa Kapasitas (Box)</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  {searchTerm ? "Tidak ada data yang cocok" : "Tidak ada data"}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.no_urut}</TableCell>
                  <TableCell>{item.nomor_rak}</TableCell>
                  <TableCell>{item.jenis_rak}</TableCell>
                  <TableCell>{item.kapasitas_box_per_rak}</TableCell>
                  <TableCell>{item.jumlah_rak}</TableCell>
                  <TableCell>{item.kapasitas}</TableCell>
                  <TableCell>{item.jumlah_terisi_box}</TableCell>
                  <TableCell>{item.sisa_kapasitas_box}</TableCell>
                  <TableCell>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
