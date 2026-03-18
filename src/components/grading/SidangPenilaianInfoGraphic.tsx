import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle2, 
  ClipboardCheck, 
  Users, 
  Building2, 
  UserCog,
  Scale,
  ChevronRight,
  FileCheck,
  Gavel
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoItemProps {
  number: string;
  text: string;
  subItems?: { code: string; text: string }[];
}

function InfoItem({ number, text, subItems }: InfoItemProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30 hover:border-primary/30 transition-colors">
        <Badge variant="outline" className="shrink-0 bg-primary/10 text-primary border-primary/20 font-semibold">
          {number}
        </Badge>
        <p className="text-sm leading-relaxed text-foreground/90">{text}</p>
      </div>
      {subItems && subItems.length > 0 && (
        <div className="ml-8 space-y-2">
          {subItems.map((sub, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border border-border/20">
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {sub.code}
                </Badge>
                <p className="text-xs leading-relaxed text-muted-foreground">{sub.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  items: InfoItemProps[];
  colorScheme: {
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
  };
}

function SectionCard({ title, icon, items, colorScheme }: SectionCardProps) {
  return (
    <Card className={cn("border-2", colorScheme.border)}>
      <CardHeader className={cn("border-b", colorScheme.bg, colorScheme.border)}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-lg",
            colorScheme.iconBg
          )}>
            <div className={colorScheme.iconColor}>{icon}</div>
          </div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {items.map((item, idx) => (
          <InfoItem key={idx} {...item} />
        ))}
      </CardContent>
    </Card>
  );
}

interface KehadiranSectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: { code: string; text: string; role?: string }[];
  colorScheme: {
    bg: string;
    border: string;
    badge: string;
  };
}

function KehadiranSection({ title, subtitle, icon, items, colorScheme }: KehadiranSectionProps) {
  return (
    <div className={cn(
      "rounded-xl border-2 overflow-hidden",
      colorScheme.border
    )}>
      <div className={cn("p-4 border-b", colorScheme.bg, colorScheme.border)}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background/50">
            {icon}
          </div>
          <div>
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {items.map((item, idx) => (
          <div 
            key={idx} 
            className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30 hover:shadow-sm transition-shadow"
          >
            <Badge className={cn("shrink-0", colorScheme.badge)}>
              {item.code}
            </Badge>
            <div className="flex-1">
              {item.role && (
                <Badge variant="outline" className="mb-1 text-xs">
                  {item.role}
                </Badge>
              )}
              <p className="text-sm leading-relaxed text-foreground/90">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SidangPenilaianInfoGraphic() {
  const persyaratanItems: InfoItemProps[] = [
    {
      number: "1",
      text: "Telah diangkat menjadi PNS lebih dari 6 (enam) bulan dalam tahun berjalan."
    },
    {
      number: "2",
      text: "Telah melaksanakan tugas dalam Jabatan Pelaksana lebih dari 6 (enam) bulan dalam tahun berjalan."
    },
    {
      number: "3",
      text: "Pada saat sidang penilaian, Pelaksana yang bersangkutan berstatus Pelaksana Umum."
    },
    {
      number: "4",
      text: "Ketentuan sebagaimana dimaksud pada angka (1) sampai dengan angka (3) berlaku juga bagi Pelaksana Umum yang sedang menjalani hukuman disiplin."
    }
  ];

  const pelaksanaanItems: InfoItemProps[] = [
    {
      number: "1",
      text: "Evaluasi dilakukan oleh Atasan Langsung pejabat pelaksana yang bersangkutan paling lambat tanggal 31 Maret tahun berikutnya."
    },
    {
      number: "2",
      text: "Dalam hal Atasan Langsung berhalangan tetap atau sementara, maka Evaluasi dilakukan oleh Pelaksana Tugas atau Pelaksana Harian dari Atasan Langsung pejabat pelaksana yang bersangkutan, dengan jabatan yang setingkat dengan atau lebih tinggi dari Atasan Langsung."
    },
    {
      number: "3",
      text: "Dalam hal Pelaksana Tugas atau Pelaksana Harian tidak memenuhi ketentuan sebagaimana dimaksud pada angka (2), maka Evaluasi dilakukan oleh pejabat lain yang ditugaskan oleh atasan dari Atasan Langsung, dengan ketentuan:",
      subItems: [
        { code: "a", text: "Setingkat dengan Atasan Langsung Pelaksana Umum yang bersangkutan." },
        { code: "b", text: "Memiliki atasan yang sama dengan atasan dari Atasan Langsung Pelaksana Umum yang bersangkutan." }
      ]
    },
    {
      number: "4",
      text: "Dalam hal ketentuan sebagaimana dimaksud pada angka (2) dan (3) tidak terpenuhi, maka Evaluasi dilakukan oleh pejabat dengan jabatan yang lebih tinggi dari Atasan Langsung Pelaksana Umum yang bersangkutan secara berjenjang."
    }
  ];

  const kehadiranJPTP = [
    {
      code: "a",
      role: "Pimpinan Sidang",
      text: "Pejabat Pimpinan Tinggi Pratama di lingkungan instansi vertikal atau unit pelaksana teknis setingkat unit Jabatan Pimpinan Tinggi Pratama yang bersangkutan."
    },
    {
      code: "b",
      role: "Anggota",
      text: "Pejabat administrator di lingkungan instansi vertikal atau unit pelaksana teknis setingkat unit Jabatan Pimpinan Tinggi Pratama yang bersangkutan."
    },
    {
      code: "c",
      role: "Anggota (Kepegawaian)",
      text: "Pejabat pengawas yang menangani bidang kepegawaian di lingkungan instansi vertikal atau unit pelaksana teknis setingkat unit Jabatan Pimpinan Tinggi Pratama yang bersangkutan."
    }
  ];

  const kehadiranAdmin = [
    {
      code: "a",
      role: "Pimpinan Sidang",
      text: "Pejabat administrator di instansi vertikal atau unit pelaksana teknis setingkat unit jabatan administrator yang bersangkutan."
    },
    {
      code: "b",
      role: "Anggota",
      text: "Pejabat pengawas di instansi vertikal atau unit pelaksana teknis setingkat unit jabatan administrator yang bersangkutan."
    },
    {
      code: "c",
      role: "Anggota (Kepegawaian)",
      text: "Pejabat pengawas yang menangani bidang kepegawaian di lingkungan instansi vertikal atau unit pelaksana teknis setingkat unit Jabatan Pimpinan Tinggi Pratama yang membawahi instansi vertikal setingkat unit jabatan administrator yang bersangkutan."
    }
  ];

  return (
    <Card className="mt-6 border-2 border-amber-200 dark:border-amber-800">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <Gavel className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg text-amber-700 dark:text-amber-400">
              Sidang Penilaian Pelaksana Umum
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Mekanisme penetapan berdasarkan sidang penilaian
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* Persyaratan Evaluasi */}
        <SectionCard
          title="Persyaratan Evaluasi Pelaksana Umum"
          icon={<CheckCircle2 className="h-5 w-5" />}
          items={persyaratanItems}
          colorScheme={{
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            border: "border-emerald-200 dark:border-emerald-800",
            iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
            iconColor: "text-emerald-600 dark:text-emerald-400"
          }}
        />

        {/* Pelaksanaan Evaluasi */}
        <SectionCard
          title="Pelaksanaan Evaluasi"
          icon={<ClipboardCheck className="h-5 w-5" />}
          items={pelaksanaanItems}
          colorScheme={{
            bg: "bg-blue-50 dark:bg-blue-950/30",
            border: "border-blue-200 dark:border-blue-800",
            iconBg: "bg-blue-100 dark:bg-blue-900/50",
            iconColor: "text-blue-600 dark:text-blue-400"
          }}
        />

        {/* Kehadiran dalam Sidang */}
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader className="bg-purple-50 dark:bg-purple-950/30 border-b border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Kehadiran dalam Sidang</CardTitle>
                <p className="text-xs text-muted-foreground">Pejabat Penilai berdasarkan tingkat jabatan</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Jabatan Pimpinan Tinggi Pratama */}
            <KehadiranSection
              title="Jabatan Pimpinan Tinggi Pratama"
              subtitle="Instansi vertikal dan unit pelaksana teknis setingkat JPT Pratama"
              icon={<Building2 className="h-5 w-5 text-indigo-500" />}
              items={kehadiranJPTP}
              colorScheme={{
                bg: "bg-indigo-50 dark:bg-indigo-950/30",
                border: "border-indigo-200 dark:border-indigo-800",
                badge: "bg-indigo-500 text-white hover:bg-indigo-600"
              }}
            />

            {/* Jabatan Administrator */}
            <KehadiranSection
              title="Jabatan Administrator"
              subtitle="Instansi vertikal dan unit pelaksana teknis setingkat Administrator"
              icon={<UserCog className="h-5 w-5 text-rose-500" />}
              items={kehadiranAdmin}
              colorScheme={{
                bg: "bg-rose-50 dark:bg-rose-950/30",
                border: "border-rose-200 dark:border-rose-800",
                badge: "bg-rose-500 text-white hover:bg-rose-600"
              }}
            />
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
