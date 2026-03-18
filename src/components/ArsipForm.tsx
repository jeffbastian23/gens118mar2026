import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import OCRScanner from "./OCRScanner";

const kodeKlasifikasiOptions = [
  "DL01", "DL03", "DL04", "DL13", "KA40", "KP03", "KP10", "KP101", "KP201", 
  "KP30", "KP31", "KP40", "KP42", "KP43", "KP50", "KP60", "KP7", "KU01", 
  "KU11", "KU14", "OT4", "PB14", "PN50", "RT0", "RT11", "AG1", "DL10"
];

const uraianInformasiOptions = [
  "Pendidikan di luar kedinasan",
  "Konsultasi dan asistensi",
  "Sosialisasi dan bimbingan teknis",
  "Pelaksanaan pelatihan",
  "Pemindahan arsip inaktif",
  "Penetapan CPNS menjadi PNS",
  "Pengembangan kompetensi",
  "Assessment center",
  "Mutasi dan promosi",
  "Disiplin pegawai",
  "Sanksi dan hukuman",
  "Mutasi keluarga",
  "Layanan kesehatan/kesejahteraan pegawai",
  "Penghargaan dan tanda jasa",
  "Perjalanan dinas dalam jabatan",
  "Pemberhentian pegawai hak pensiun",
  "Personal file pegawai",
  "Penganggaran",
  "LPP TKTT",
  "Belanja/pengeluaran anggaran",
  "Manajemen risiko",
  "Pertanggungjawaban bendahara",
  "Penugasan audit",
  "Penggunaan gedung dan fasilitas kantor",
  "Peralatan operasional",
  "Perencanaan anggaran",
  "Perencanaan dan pengembangan program pelatihan"
];

const lokasiOptions = ["Almari Bagian Umum", "Nadine Bagian Umum"];
const picOptions = ["Umum", "Fasilitas", "Pabean", "P2", "KI", "Audit", "Keban"];
const keteranganOptions = ["Digital", "Tekstual"];


const formSchema = z.object({
  kode_klasifikasi: z.string().min(1, "Kode klasifikasi wajib diisi"),
  uraian_informasi_berkas: z.string().min(1, "Uraian informasi berkas wajib diisi"),
  kurun_waktu: z.string().min(1, "Kurun waktu wajib diisi"),
  tingkat_perkembangan: z.enum(["Asli", "Copy"]),
  jumlah: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
  lokasi: z.string().min(1, "Lokasi wajib diisi"),
  pic: z.string().min(1, "PIC wajib diisi"),
  keterangan: z.string().min(1, "Keterangan wajib diisi"),
  jenis_arsip: z.enum(["Arsip Umum", "Arsip Vital"]),
});

type FormValues = z.infer<typeof formSchema>;

interface ArsipFormProps {
  initialData?: {
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
    
  };
  onSuccess?: () => void;
  isEdit?: boolean;
}

export default function ArsipForm({ initialData, onSuccess, isEdit }: ArsipFormProps) {
  const { toast } = useToast();
  const [noBerkas, setNoBerkas] = useState<number>(initialData?.no_berkas || 1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kode_klasifikasi: initialData?.kode_klasifikasi || "",
      uraian_informasi_berkas: initialData?.uraian_informasi_berkas || "",
      kurun_waktu: initialData?.kurun_waktu || "",
      tingkat_perkembangan: (initialData?.tingkat_perkembangan as "Asli" | "Copy") || "Asli",
      jumlah: initialData?.jumlah || 1,
      lokasi: initialData?.lokasi || "",
      pic: initialData?.pic || "",
      keterangan: initialData?.keterangan || "",
      jenis_arsip: "Arsip Umum",
    },
  });

  useEffect(() => {
    if (!isEdit) {
      fetchNextNoBerkas();
    }
  }, [isEdit]);

  const fetchNextNoBerkas = async () => {
    const { data, error } = await supabase
      .from("daftar_berkas")
      .select("no_berkas")
      .order("no_berkas", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching no_berkas:", error);
      return;
    }

    if (data && data.length > 0) {
      setNoBerkas((data[0] as any).no_berkas + 1);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (isEdit && initialData) {
      const { error } = await supabase
        .from("daftar_berkas")
        .update({
          kode_klasifikasi: values.kode_klasifikasi,
          uraian_informasi_berkas: values.uraian_informasi_berkas,
          kurun_waktu: values.kurun_waktu,
          tingkat_perkembangan: values.tingkat_perkembangan,
          jumlah: values.jumlah,
          lokasi: values.lokasi,
          pic: values.pic,
          keterangan: values.keterangan,
          jenis_arsip: values.jenis_arsip,
        } as any)
        .eq("id", initialData.id);

      if (error) {
        toast({
          title: "Error",
          description: "Gagal mengupdate data arsip",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Berhasil",
        description: "Data arsip berhasil diupdate",
      });
    } else {
      const { error } = await supabase.from("daftar_berkas").insert([
        {
          no_berkas: noBerkas,
          kode_klasifikasi: values.kode_klasifikasi,
          uraian_informasi_berkas: values.uraian_informasi_berkas,
          kurun_waktu: values.kurun_waktu,
          tingkat_perkembangan: values.tingkat_perkembangan,
          jumlah: values.jumlah,
          lokasi: values.lokasi,
          pic: values.pic,
          keterangan: values.keterangan,
          jenis_arsip: values.jenis_arsip,
        },
      ] as any);

      if (error) {
        toast({
          title: "Error",
          description: "Gagal menyimpan data arsip",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Berhasil",
        description: "Data arsip berhasil disimpan",
      });

      form.reset();
      fetchNextNoBerkas();
    }

    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormItem>
            <FormLabel>No Berkas</FormLabel>
            <FormControl>
              <Input value={noBerkas} disabled className="bg-muted" />
            </FormControl>
          </FormItem>

          <FormField
            control={form.control}
            name="kode_klasifikasi"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Kode Klasifikasi</FormLabel>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                          {field.value || "Pilih kode klasifikasi"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 z-50">
                      <Command>
                        <CommandInput placeholder="Cari kode klasifikasi..." />
                        <CommandList>
                          <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {kodeKlasifikasiOptions.map((option) => (
                              <CommandItem key={option} value={option} onSelect={() => { field.onChange(option); }}>
                                <Check className={cn("mr-2 h-4 w-4", field.value === option ? "opacity-100" : "opacity-0")} />
                                {option}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <Input
                  placeholder="Atau ketik manual kode klasifikasi..."
                  value={field.value && !kodeKlasifikasiOptions.includes(field.value) ? field.value : ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="mt-1"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="uraian_informasi_berkas"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Uraian Informasi Berkas</FormLabel>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                          {field.value || "Pilih uraian informasi"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 z-50">
                      <Command>
                        <CommandInput placeholder="Cari uraian informasi..." />
                        <CommandList>
                          <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {uraianInformasiOptions.map((option) => (
                              <CommandItem key={option} value={option} onSelect={() => { field.onChange(option); }}>
                                <Check className={cn("mr-2 h-4 w-4", field.value === option ? "opacity-100" : "opacity-0")} />
                                {option}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <Input
                  placeholder="Atau ketik manual uraian informasi..."
                  value={field.value && !uraianInformasiOptions.includes(field.value) ? field.value : ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="mt-1"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kurun_waktu"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kurun Waktu</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: 2020-2021" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tingkat_perkembangan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tingkat Perkembangan</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tingkat perkembangan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="Asli">Asli</SelectItem>
                    <SelectItem value="Copy">Copy</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jumlah"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jumlah</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lokasi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lokasi</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih lokasi" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background z-50">
                    {lokasiOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PIC Arsip</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih PIC Arsip" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background z-50">
                    {picOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="keterangan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keterangan</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih keterangan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background z-50">
                    {keteranganOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jenis_arsip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Arsip</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis arsip" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="Arsip Umum">Arsip Umum</SelectItem>
                    <SelectItem value="Arsip Vital">Arsip Vital</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        <div className="flex gap-4 flex-wrap">
          <Button type="submit" className="w-full md:w-auto">
            {isEdit ? "Update Data Arsip" : "Simpan Data Arsip"}
          </Button>
          {!isEdit && (
            <OCRScanner onTextExtracted={(text) => {
              console.log("Extracted text:", text);
            }} />
          )}
        </div>
      </form>
    </Form>
  );
}
