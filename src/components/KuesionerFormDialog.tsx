import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import type { Json } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface KuesionerData {
  id: string;
  nama_lengkap: string;
  nip: string | null;
  jenis_kuesioner: string | null;
  jawaban: Json | null;
  status: string | null;
  grading_id: string | null;
}

interface KuesionerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kuesionerData: KuesionerData | null;
  onSuccess: () => void;
}

type KuesionerType = "4-5/5-6" | "6-7/7-8" | "8-9/9-10" | "10-11/11-12";

// Kuesioner templates based on grade transitions
const KUESIONER_TEMPLATES = {
  "4-5/5-6": {
    title: "KUESIONER UNTUK PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 4 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 5, ATAU PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 5 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 6",
    indicators: [
      {
        no: 1,
        text: "Kemampuan memahami peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas dan menjadikannya sebagai acuan kerja",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas" },
          { level: 2, text: "Mampu menggunakan peraturan terkait, proses bisnis dan SOP sebagai acuan kerja dalam menyelesaikan pekerjaan" },
          { level: 3, text: "Mampu menganalisis dan mengevaluasi permasalahan pada peraturan terkait, proses bisnis dan SOP yang menjadi acuan kerja" },
        ],
      },
      {
        no: 2,
        text: "Kemampuan menyusun rencana kerja sesuai bidang tugasnya dan memastikan rencana kerja terlaksana",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi tugas-tugas yang harus diselesaikan" },
          { level: 2, text: "Mampu menentukan prioritas atas pekerjaan berdasarkan tingkat kepentingan dan memastikan rencana kerja terlaksana" },
          { level: 3, text: "Mampu melakukan penyesuaian rencana kerja berdasarkan hasil analisis dan evaluasi terhadap kebutuhan organisasi" },
        ],
      },
      {
        no: 3,
        text: "Kemampuan untuk melakukan kerja sama dalam rangka koordinasi dengan atasan, rekan kerja, dan stakeholders",
        levels: [
          { level: 1, text: "Mampu memahami pentingnya kerja sama dengan atasan, rekan kerja, dan stakeholders" },
          { level: 2, text: "Mampu menggunakan kemampuan kerja sama untuk kepentingan tugas jabatan" },
          { level: 3, text: "Mampu menggunakan kemampuan kerja sama untuk kepentingan organisasi" },
        ],
      },
    ],
    keputusanText: "Memenuhi Kemampuan Kerja Pelaksana Umum (3 dari 3 indikator penilaian Kemampuan Kerja Pelaksana bernilai sekurang-kurangnya 2)",
    tidakMemenuhiText: "Tidak memenuhi Kemampuan Kerja Pelaksana Umum (salah satu atau lebih indikator penilaian Kemampuan Kerja Pelaksana bernilai kurang dari 2)",
    minIndicators: 3,
    minLevel: 2,
  },
  "6-7/7-8": {
    title: "KUESIONER UNTUK PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 6 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 7, ATAU PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 7 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 8",
    indicators: [
      {
        no: 1,
        text: "Kemampuan memahami peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas dan menjadikannya sebagai acuan kerja",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas" },
          { level: 2, text: "Mampu menggunakan peraturan terkait, proses bisnis dan SOP sebagai acuan kerja dalam menyelesaikan pekerjaan" },
          { level: 3, text: "Mampu menganalisis dan mengevaluasi permasalahan pada peraturan terkait, proses bisnis dan SOP yang menjadi acuan kerja" },
        ],
      },
      {
        no: 2,
        text: "Kemampuan menggunakan metode/aplikasi/peralatan umum (misal: aplikasi MS Office, komputer, printer, dll)",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi metode/aplikasi/peralatan umum yang dibutuhkan untuk menyelesaikan pekerjaan" },
          { level: 2, text: "Mampu menggunakan metode/aplikasi/peralatan umum yang dibutuhkan untuk menyelesaikan pekerjaan" },
          { level: 3, text: "Mampu menganalisis dan mengevaluasi metode/aplikasi/peralatan umum sesuai bidang tugasnya" },
        ],
      },
      {
        no: 3,
        text: "Kemampuan menyusun rencana kerja sesuai bidang tugasnya dan memastikan rencana kerja terlaksana",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi tugas-tugas yang harus diselesaikan" },
          { level: 2, text: "Mampu menentukan prioritas atas pekerjaan berdasarkan tingkat kepentingan dan memastikan rencana kerja terlaksana" },
          { level: 3, text: "Mampu melakukan penyesuaian rencana kerja berdasarkan hasil analisis dan evaluasi terhadap kebutuhan organisasi" },
        ],
      },
      {
        no: 4,
        text: "Kemampuan untuk melakukan kerja sama dalam rangka koordinasi dengan atasan, rekan kerja, dan stakeholders",
        levels: [
          { level: 1, text: "Mampu memahami pentingnya kerja sama dengan atasan, rekan kerja, dan stakeholders" },
          { level: 2, text: "Mampu menggunakan kemampuan kerja sama untuk kepentingan tugas jabatan" },
          { level: 3, text: "Mampu menggunakan kemampuan kerja sama untuk kepentingan organisasi" },
        ],
      },
    ],
    keputusanText: "Memenuhi Kemampuan Kerja Pelaksana Umum (4 dari 4 indikator penilaian Kemampuan Kerja Pelaksana bernilai sekurang-kurangnya 2)",
    tidakMemenuhiText: "Tidak memenuhi Kemampuan Kerja Pelaksana Umum (salah satu atau lebih indikator penilaian Kemampuan Kerja Pelaksana bernilai kurang dari 2)",
    minIndicators: 4,
    minLevel: 2,
  },
  "8-9/9-10": {
    title: "KUESIONER UNTUK PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 8 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 9, ATAU PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 9 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 10",
    indicators: [
      {
        no: 1,
        text: "Kemampuan memahami peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas dan menjadikannya sebagai acuan kerja",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas" },
          { level: 2, text: "Mampu menggunakan peraturan terkait, proses bisnis dan SOP sebagai acuan kerja dalam menyelesaikan pekerjaan" },
          { level: 3, text: "Mampu menganalisis dan mengevaluasi permasalahan pada peraturan terkait, proses bisnis dan SOP yang menjadi acuan kerja" },
        ],
      },
      {
        no: 2,
        text: "Kemampuan menggunakan metode/aplikasi/peralatan khusus (misal: aplikasi SPAN, ABK, SIMAK BMN, APPROWEB, dll)",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi metode/aplikasi/peralatan khusus yang dibutuhkan untuk menyelesaikan pekerjaan" },
          { level: 2, text: "Mampu menggunakan metode/aplikasi/peralatan khusus yang dibutuhkan untuk menyelesaikan pekerjaan" },
          { level: 3, text: "Mampu menganalisis dan mengevaluasi metode/aplikasi/peralatan khusus sesuai bidang tugasnya" },
        ],
      },
      {
        no: 3,
        text: "Kemampuan menyusun rencana kerja sesuai bidang tugasnya dan memastikan rencana kerja terlaksana",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi tugas-tugas yang harus diselesaikan" },
          { level: 2, text: "Mampu menentukan prioritas atas pekerjaan berdasarkan tingkat kepentingan dan memastikan rencana kerja terlaksana" },
          { level: 3, text: "Mampu melakukan penyesuaian rencana kerja berdasarkan hasil analisis dan evaluasi terhadap kebutuhan organisasi" },
        ],
      },
      {
        no: 4,
        text: "Kemampuan untuk melakukan kerja sama dalam rangka koordinasi dengan atasan, rekan kerja, dan stakeholders",
        levels: [
          { level: 1, text: "Mampu memahami pentingnya kerja sama dengan atasan, rekan kerja, dan stakeholders" },
          { level: 2, text: "Mampu menggunakan kemampuan kerja sama untuk kepentingan tugas jabatan" },
          { level: 3, text: "Mampu menggunakan kemampuan kerja sama untuk kepentingan organisasi" },
        ],
      },
    ],
    keputusanText: "Memenuhi Kemampuan Kerja Pelaksana Umum (4 dari 4 indikator penilaian Kemampuan Kerja Pelaksana bernilai sekurang-kurangnya 2)",
    tidakMemenuhiText: "Tidak memenuhi Kemampuan Kerja Pelaksana Umum (salah satu atau lebih indikator penilaian Kemampuan Kerja Pelaksana bernilai kurang dari 2)",
    minIndicators: 4,
    minLevel: 2,
  },
  "10-11/11-12": {
    title: "KUESIONER UNTUK PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 10 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 11, ATAU PELAKSANA UMUM YANG SAAT INI MEMILIKI PERINGKAT JABATAN 11 YANG DIUSULKAN KENAIKAN PERINGKAT JABATAN 12",
    indicators: [
      {
        no: 1,
        text: "Kemampuan memahami peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas dan menjadikannya sebagai acuan kerja",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi peraturan terkait, proses bisnis dan SOP sesuai dengan bidang tugas" },
          { level: 2, text: "Mampu menggunakan peraturan terkait, proses bisnis dan SOP sebagai acuan kerja dalam menyelesaikan pekerjaan" },
          { level: 3, text: "Mampu menganalisis dan mengevaluasi permasalahan pada peraturan terkait, proses bisnis dan SOP yang menjadi acuan kerja" },
        ],
      },
      {
        no: 2,
        text: "Kemampuan menganalisis masalah dan menemukan solusi terbaik",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi dan memperhatikan inti permasalahan sesuai bidang tugasnya" },
          { level: 2, text: "Mampu menemukan solusi atas permasalahan sesuai bidang tugasnya" },
          { level: 3, text: "Mampu menganalisis dampak permasalahan terhadap tugas lain yang berkaitan" },
        ],
      },
      {
        no: 3,
        text: "Kemampuan menyusun rencana kerja sesuai bidang tugasnya dan memastikan rencana kerja terlaksana",
        levels: [
          { level: 1, text: "Mampu mengidentifikasi tugas-tugas yang harus diselesaikan" },
          { level: 2, text: "Mampu menentukan prioritas atas pekerjaan berdasarkan tingkat kepentingan dan memastikan rencana kerja terlaksana" },
          { level: 3, text: "Mampu melakukan penyesuaian rencana kerja berdasarkan hasil analisis dan evaluasi terhadap kebutuhan organisasi" },
        ],
      },
      {
        no: 4,
        text: "Kemampuan untuk melakukan kerja sama dalam rangka koordinasi dengan atasan, rekan kerja, dan stakeholders",
        levels: [
          { level: 1, text: "Mampu memahami pentingnya kerjasama dengan atasan, rekan kerja, dan stakeholders" },
          { level: 2, text: "Mampu menggunakan kemampuan kerjasama untuk kepentingan tugas jabatan" },
          { level: 3, text: "Mampu menggunakan kemampuan kerjasama untuk kepentingan organisasi" },
        ],
      },
    ],
    keputusanText: "Memenuhi Kemampuan Kerja Pelaksana Umum (4 dari 4 indikator penilaian Kemampuan Kerja Pelaksana bernilai sekurang-kurangnya 2)",
    tidakMemenuhiText: "Tidak memenuhi Kemampuan Kerja Pelaksana Umum (salah satu atau lebih indikator penilaian Kemampuan Kerja Pelaksana bernilai kurang dari 2)",
    minIndicators: 4,
    minLevel: 2,
  },
};

export default function KuesionerFormDialog({
  open,
  onOpenChange,
  kuesionerData,
  onSuccess,
}: KuesionerFormDialogProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [buktiKerja, setBuktiKerja] = useState<Record<number, string>>({});
  const [keputusan, setKeputusan] = useState<"memenuhi" | "tidak_memenuhi" | "">("");
  const [submitting, setSubmitting] = useState(false);

  const kuesionerType = kuesionerData?.jenis_kuesioner as KuesionerType;
  const template = kuesionerType ? KUESIONER_TEMPLATES[kuesionerType] : null;
  
  // Parse jawaban from JSON
  const jawabanData = kuesionerData?.jawaban as Record<string, any> | null;

  useEffect(() => {
    if (kuesionerData && jawabanData) {
      // Restore previous answers if exists
      if (jawabanData.indicator_answers) {
        setAnswers(jawabanData.indicator_answers);
      }
      if (jawabanData.bukti_kerja) {
        setBuktiKerja(jawabanData.bukti_kerja);
      }
      if (jawabanData.keputusan) {
        setKeputusan(jawabanData.keputusan);
      }
    }
  }, [kuesionerData]);

  const handleLevelChange = (indicatorNo: number, level: number) => {
    setAnswers((prev) => ({
      ...prev,
      [indicatorNo]: level,
    }));
  };

  const handleBuktiKerjaChange = (indicatorNo: number, value: string) => {
    setBuktiKerja((prev) => ({
      ...prev,
      [indicatorNo]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!kuesionerData || !template) return;

    // Validate all indicators have answers
    const indicatorCount = template.indicators.length;
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < indicatorCount) {
      toast.error("Semua indikator harus diisi");
      return;
    }

    if (!keputusan) {
      toast.error("Pilih keputusan penilaian");
      return;
    }

    setSubmitting(true);
    try {
      const updatedJawaban = {
        ...jawabanData,
        indicator_answers: answers,
        bukti_kerja: buktiKerja,
        keputusan: keputusan,
        filled_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("grading_kuesioner")
        .update({
          jawaban: updatedJawaban as unknown as Json,
          status: "Sudah Diisi",
        })
        .eq("id", kuesionerData.id);

      if (error) throw error;

      toast.success("Kuesioner berhasil disimpan");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error saving kuesioner:", error);
      toast.error("Gagal menyimpan kuesioner");
    } finally {
      setSubmitting(false);
    }
  };

  if (!template || !kuesionerData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">
            {template.title}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh] pr-4">
          <div className="space-y-4 py-2">
            {/* Header Information */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
              <div className="space-y-1">
                <p><span className="font-medium">Lokasi:</span> {jawabanData?.lokasi || "-"}</p>
                <p><span className="font-medium">Tanggal:</span> {jawabanData?.tanggal ? format(new Date(jawabanData.tanggal), "d MMMM yyyy", { locale: localeId }) : "-"}</p>
              </div>
              <div></div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
              <div className="space-y-1">
                <p><span className="font-medium">Nama Pelaksana:</span> {kuesionerData.nama_lengkap}</p>
                <p><span className="font-medium">NIP Pelaksana:</span> {kuesionerData.nip || "-"}</p>
                <p><span className="font-medium">Peringkat Saat Ini:</span> {jawabanData?.peringkat_saat_ini || "-"}</p>
                <p><span className="font-medium">Jabatan Saat Ini:</span> {jawabanData?.jabatan_saat_ini || "-"}</p>
              </div>
              <div className="space-y-1">
                <p><span className="font-medium">Pangkat/Golongan Saat Ini:</span> {jawabanData?.pangkat_golongan || "-"}</p>
                <p><span className="font-medium">Pendidikan Saat Ini:</span> {jawabanData?.pendidikan_saat_ini || "-"}</p>
                <p><span className="font-medium">Unit Organisasi:</span> {jawabanData?.unit_organisasi || "-"}</p>
              </div>
            </div>

            <Separator />

            {/* Indicators Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="border p-2 w-10 text-center">No.</th>
                    <th className="border p-2 w-1/4">Indikator Penilaian Kemampuan Kerja Pelaksana Umum</th>
                    <th className="border p-2" colSpan={3}>Level Kemampuan Kerja Pelaksana Umum</th>
                    <th className="border p-2 w-24">Bukti Kerja</th>
                  </tr>
                  <tr className="bg-muted/50">
                    <th className="border p-2"></th>
                    <th className="border p-2"></th>
                    <th className="border p-2 text-center">Level 1</th>
                    <th className="border p-2 text-center">Level 2</th>
                    <th className="border p-2 text-center">Level 3</th>
                    <th className="border p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {template.indicators.map((indicator) => (
                    <tr key={indicator.no}>
                      <td className="border p-2 text-center align-top">{indicator.no}.</td>
                      <td className="border p-2 align-top">{indicator.text}</td>
                      {indicator.levels.map((level) => (
                        <td key={level.level} className="border p-2 align-top">
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={answers[indicator.no] === level.level}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleLevelChange(indicator.no, level.level);
                                }
                              }}
                              className="mt-1"
                            />
                            <span className="text-xs">{level.text}</span>
                          </div>
                        </td>
                      ))}
                      <td className="border p-2 align-top">
                        <Input
                          placeholder="Bukti"
                          value={buktiKerja[indicator.no] || ""}
                          onChange={(e) => handleBuktiKerjaChange(indicator.no, e.target.value)}
                          className="text-xs h-8"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Separator />

            {/* Keputusan Section */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <Label className="font-medium">Keputusan penilaian Kemampuan Kerja Pelaksana*:</Label>
              <RadioGroup
                value={keputusan}
                onValueChange={(value) => setKeputusan(value as "memenuhi" | "tidak_memenuhi")}
                className="space-y-2"
              >
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="memenuhi" id="memenuhi" className="mt-1" />
                  <Label htmlFor="memenuhi" className="text-sm font-normal cursor-pointer">
                    {template.keputusanText}
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="tidak_memenuhi" id="tidak_memenuhi" className="mt-1" />
                  <Label htmlFor="tidak_memenuhi" className="text-sm font-normal cursor-pointer">
                    {template.tidakMemenuhiText}
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">* berikan tanda silang pada salah satu pilihan</p>
            </div>

            {/* Signature Section (Display Only) */}
            <div className="grid grid-cols-2 gap-8 p-4 text-sm">
              <div className="text-center space-y-4">
                <p className="font-medium">Mengetahui:</p>
                <p className="mt-8">Atasan dari Atasan Langsung</p>
                {/* 7 line spacing */}
                <div className="h-28"></div>
                <p className="text-gray-400 text-xs italic">Ditandatangani secara elektronik</p>
                <div className="mt-2">
                  <p className="font-medium">{jawabanData?.atasan_dari_atasan_nama || "................................."}</p>
                  <div className="border-b border-foreground w-48 mx-auto mt-1"></div>
                </div>
                <p>NIP {jawabanData?.atasan_dari_atasan_nip || "................................."}</p>
              </div>
              <div className="text-center space-y-4">
                <p>{jawabanData?.lokasi || "....................."}, {jawabanData?.tanggal ? format(new Date(jawabanData.tanggal), "d MMMM yyyy", { locale: localeId }) : ".................20XX"}</p>
                <p className="mt-8">Atasan Langsung</p>
                {/* 7 line spacing */}
                <div className="h-28"></div>
                <p className="text-gray-400 text-xs italic">Ditandatangani secara elektronik</p>
                <div className="mt-2">
                  <p className="font-medium">{jawabanData?.atasan_langsung_nama || "................................."}</p>
                  <div className="border-b border-foreground w-48 mx-auto mt-1"></div>
                </div>
                <p>NIP {jawabanData?.atasan_langsung_nip || "................................."}</p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Menyimpan..." : "Simpan Kuesioner"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
