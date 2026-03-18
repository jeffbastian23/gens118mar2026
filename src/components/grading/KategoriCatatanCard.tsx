import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

// Kategori Catatan data untuk kolom keterangan
const KATEGORI_CATATAN = {
  tetap: [
    { no: 1, catatan: "Peringkat maksimal pd pangkat/gol ruang; PKTP 2023 digunakan bersama dg PKTP 2024 sbg dasar penilaian pd sidang penilaian di th.2025", label: "Mentok Pangkat" },
    { no: 2, catatan: "Peringkat maksimal pd pendidikan; PKTP 2023 digunakan bersama dg PKTP 2024 sbg dasar penilaian pd sidang penilaian di th.2025", label: "Mentok Pendidikan" },
    { no: 3, catatan: "Baru memiliki 1 PKT th.2023", label: "Regular" },
    { no: 4, catatan: "Belum memiliki PKT untuk dievaluasi; Sedang menjalani Hukuman Disiplin", label: "Hukdis" },
    { no: 5, catatan: "Masa kerja kurang dari 2th; memiliki PKT th.2023 \"Sangat Baik\"", label: "Sekretaris" },
    { no: 6, catatan: "-masa kerja kurang dari 2th\n-tetap dapat menduduki jabatan dengan peringkat pada tugas jabatan yang sama sebagaimana penetapan awal menjadi Pelaksana Khusus, meskipun belum memenuhi syarat akumulasi masa kerja\n-tidak dapat diberikan kenaikan peringkat jabatan pada Jabatan Pelaksana Khusus dengan tugas jabatan yang sama sampai dipenuhinya akumulasi masa kerja", label: "Masa Kerja <2th" },
    { no: 7, catatan: "Peringkat maksimal pd formasi jabatan maupun pangkat/gol ruang; PKTP 2023 digunakan bersama dg PKTP 2024 sbg dasar penilaian pd sidang penilaian di th.2025", label: "Mentok Formasi" },
  ],
  naik: [
    { no: 1, catatan: "Naik pangkat TMT 1 April 2024 karena lulus Tugas Belajar, jika PKTP th.2024 min.\"baik\" dan PKP \"memenuhi\" maka dpt diusulkan naik satu peringkat pd sidang penilaian di th.2025", label: "Lulus Tubel" },
    { no: 2, catatan: "Naik pangkat TMT 1 Februari 2024 karena lulus UPKP, jika PKTP th.2024 min.\"baik\" dan PKP \"memenuhi\" maka dpt diusulkan naik satu peringkat pd sidang penilaian di th.2025", label: "Lulus UPKP" },
    { no: 3, catatan: "Naik satu peringkat di sidang th.2024 karena memenuhi masa kerja minimal 2th; memiliki PKT 2023 \"Sangat Baik\"", label: "Sekre" },
    { no: 4, catatan: "Naik satu peringkat di sidang th,2024 karena PKT 2022 dan PKT 2023 minimal \"baik\"", label: "dalam tubel" },
    { no: 5, catatan: "Naik satu peringkat di sidang th.2024 karena naik pangkat TMT 1 April 2022 karena lulus UPKP, memiliki 1 PKT 2023 minimal \"Baik\", dan PKP \"Memenuhi\", Naik satu peringkat di sidang th.2024 karena naik pangkat TMT 1 Februari 2024 karena lulus UPKP, memiliki 1 PKT 2023 minimal \"Baik\", dan PKP \"Memenuhi\"", label: "selesai UPKP" },
    { no: 6, catatan: "Naik satu peringkat di sidang th.2024 karena naik pangkat TMT 1 April 2022 karena lulus Tugas Belajar, memiliki 1 PKT 2023 minimal \"Baik\", dan PKP \"Memenuhi\".", label: "Selesai Tubel" },
  ],
};

export default function KategoriCatatanCard() {
  return (
    <Card className="mt-6">
      <CardHeader className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Kategori Catatan Keterangan</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Jenis catatan yang digunakan untuk kolom keterangan pada lampiran SK Penetapan
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Edisi Tetap */}
          <div className="border rounded-lg p-4 bg-amber-50/50 dark:bg-amber-900/10">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-amber-300">
                Edisi Tetap
              </Badge>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3 pr-3">
                {KATEGORI_CATATAN.tetap.map((item) => (
                  <div key={item.no} className="p-3 bg-background rounded-md border shadow-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded px-1.5 py-0.5 shrink-0">
                        {item.no}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                          {item.catatan}
                        </p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {item.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Edisi Naik */}
          <div className="border rounded-lg p-4 bg-green-50/50 dark:bg-green-900/10">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-300">
                Edisi Naik
              </Badge>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3 pr-3">
                {KATEGORI_CATATAN.naik.map((item) => (
                  <div key={item.no} className="p-3 bg-background rounded-md border shadow-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded px-1.5 py-0.5 shrink-0">
                        {item.no}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                          {item.catatan}
                        </p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {item.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
