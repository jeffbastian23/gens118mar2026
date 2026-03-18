import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Filter, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GradingData {
  id: string;
  nama_lengkap: string;
  nip: string;
  pendidikan: string | null;
  grade: string | null;
  grade_baru: string | null;
  jabatan: string | null;
  jabatan_baru: string | null;
  pangkat_golongan: string | null;
  eselon_iii: string | null;
  eselon_iv: string | null;
  kemampuan_kerja: string | null;
  rekomendasi: string | null;
  jenis: string | null;
}

interface BigDataFilterSectionProps {
  gradingData: GradingData[];
}

export default function BigDataFilterSection({ gradingData }: BigDataFilterSectionProps) {
  const [filterRekomendasi, setFilterRekomendasi] = useState<string>("all");
  const [filterKemampuanKerja, setFilterKemampuanKerja] = useState<string>("all");
  const [filterGolongan, setFilterGolongan] = useState<string>("all");
  const [filterPendidikan, setFilterPendidikan] = useState<string>("all");

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const rekomendasiSet = new Set<string>();
    const kemampuanKerjaSet = new Set<string>();
    const golonganSet = new Set<string>();
    const pendidikanSet = new Set<string>();

    gradingData.forEach(d => {
      if (d.rekomendasi) rekomendasiSet.add(d.rekomendasi);
      if (d.kemampuan_kerja) kemampuanKerjaSet.add(d.kemampuan_kerja);
      if (d.pangkat_golongan) golonganSet.add(d.pangkat_golongan);
      if (d.pendidikan) pendidikanSet.add(d.pendidikan);
    });

    const sortGolongan = (a: string, b: string) => {
      const order = ["I/a","I/b","I/c","I/d","II/a","II/b","II/c","II/d","III/a","III/b","III/c","III/d","IV/a","IV/b","IV/c","IV/d","IV/e"];
      const extractGol = (s: string) => {
        const m = s.match(/([IV]+\/[a-e])/i);
        return m ? m[1] : s;
      };
      return order.indexOf(extractGol(a)) - order.indexOf(extractGol(b));
    };

    return {
      rekomendasi: Array.from(rekomendasiSet).sort(),
      kemampuanKerja: Array.from(kemampuanKerjaSet).sort(),
      golongan: Array.from(golonganSet).sort(sortGolongan),
      pendidikan: Array.from(pendidikanSet).sort(),
    };
  }, [gradingData]);

  // Filter data
  const filteredData = useMemo(() => {
    return gradingData.filter(d => {
      if (filterRekomendasi !== "all" && d.rekomendasi !== filterRekomendasi) return false;
      if (filterKemampuanKerja !== "all" && d.kemampuan_kerja !== filterKemampuanKerja) return false;
      if (filterGolongan !== "all" && d.pangkat_golongan !== filterGolongan) return false;
      if (filterPendidikan !== "all" && d.pendidikan !== filterPendidikan) return false;
      return true;
    });
  }, [gradingData, filterRekomendasi, filterKemampuanKerja, filterGolongan, filterPendidikan]);

  const hasActiveFilter = filterRekomendasi !== "all" || filterKemampuanKerja !== "all" || filterGolongan !== "all" || filterPendidikan !== "all";

  const resetFilters = () => {
    setFilterRekomendasi("all");
    setFilterKemampuanKerja("all");
    setFilterGolongan("all");
    setFilterPendidikan("all");
  };

  // Summary stats for filtered data
  const summary = useMemo(() => {
    const rekCounts: Record<string, number> = {};
    const kemCounts: Record<string, number> = {};
    filteredData.forEach(d => {
      if (d.rekomendasi) rekCounts[d.rekomendasi] = (rekCounts[d.rekomendasi] || 0) + 1;
      if (d.kemampuan_kerja) kemCounts[d.kemampuan_kerja] = (kemCounts[d.kemampuan_kerja] || 0) + 1;
    });
    return { rekCounts, kemCounts };
  }, [filteredData]);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Statistik Big Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Rekomendasi</label>
              <Select value={filterRekomendasi} onValueChange={setFilterRekomendasi}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {filterOptions.rekomendasi.map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Kemampuan Kerja</label>
              <Select value={filterKemampuanKerja} onValueChange={setFilterKemampuanKerja}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {filterOptions.kemampuanKerja.map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Golongan</label>
              <Select value={filterGolongan} onValueChange={setFilterGolongan}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {filterOptions.golongan.map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Pendidikan</label>
              <Select value={filterPendidikan} onValueChange={setFilterPendidikan}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {filterOptions.pendidikan.map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Badge variant="outline">Hasil Filter: {filteredData.length} pegawai</Badge>
            {Object.entries(summary.rekCounts).map(([k, v]) => (
              <Badge key={k} variant="secondary" className="text-xs">
                {k}: {v}
              </Badge>
            ))}
            {Object.entries(summary.kemCounts).map(([k, v]) => (
              <Badge key={k} variant="outline" className="text-xs">
                {k}: {v}
              </Badge>
            ))}
            {hasActiveFilter && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
                <X className="h-3 w-3 mr-1" />
                Reset Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filtered Employee Details */}
      {hasActiveFilter && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Detail Pegawai ({filteredData.length} data)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Pendidikan</TableHead>
                    <TableHead>Golongan</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Kemampuan Kerja</TableHead>
                    <TableHead>Rekomendasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        Tidak ada data yang sesuai filter
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((emp, idx) => (
                      <TableRow key={emp.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">{emp.nama_lengkap}</TableCell>
                        <TableCell>{emp.nip}</TableCell>
                        <TableCell>{emp.pendidikan || "-"}</TableCell>
                        <TableCell>{emp.pangkat_golongan || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{emp.jabatan || "-"}</TableCell>
                        <TableCell>{emp.grade || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={emp.kemampuan_kerja === "Memenuhi" ? "default" : "destructive"} className="text-xs">
                            {emp.kemampuan_kerja || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              emp.rekomendasi === "Naik" ? "border-green-500 text-green-700" :
                              emp.rekomendasi === "Turun" ? "border-red-500 text-red-700" :
                              "border-blue-500 text-blue-700"
                            }`}
                          >
                            {emp.rekomendasi || "-"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
