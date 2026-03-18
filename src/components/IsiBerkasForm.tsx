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

const formSchema = z.object({
  no_berkas: z.coerce.number().min(1, "Nomor berkas wajib diisi"),
  kode_klasifikasi: z.string().min(1, "Kode klasifikasi wajib diisi"),
  uraian_informasi_arsip: z.string().min(1, "Uraian informasi arsip wajib diisi"),
  nomor_surat_naskah: z.string().optional(),
  nama_pic: z.string().optional(),
  kurun_waktu: z.string().min(1, "Tanggal naskah wajib diisi"),
  tingkat_perkembangan: z.enum(["Asli", "Copy"]),
  jumlah: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
  keterangan: z.string().optional(),
  klasifikasi_keamanan: z.string().optional(),
  hak_akses: z.string().optional(),
  usia_retensi: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface IsiBerkasFormProps {
  onSuccess?: () => void;
  editData?: any;
  isEdit?: boolean;
}

export default function IsiBerkasForm({ onSuccess, editData, isEdit }: IsiBerkasFormProps) {
  const { toast } = useToast();
  const [noUrut, setNoUrut] = useState<number>(1);
  const [daftarBerkas, setDaftarBerkas] = useState<any[]>([]);
  const [selectedKodeKlasifikasi, setSelectedKodeKlasifikasi] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      no_berkas: editData?.no_berkas || 1,
      kode_klasifikasi: editData?.kode_klasifikasi || "",
      uraian_informasi_arsip: editData?.uraian_informasi_arsip || "",
      nomor_surat_naskah: editData?.nomor_surat_naskah || "",
      nama_pic: editData?.nama_pic || "",
      kurun_waktu: editData?.kurun_waktu || "",
      tingkat_perkembangan: editData?.tingkat_perkembangan || "Asli",
      jumlah: editData?.jumlah || 1,
      keterangan: editData?.keterangan || "",
      klasifikasi_keamanan: editData?.klasifikasi_keamanan || "",
      hak_akses: editData?.hak_akses || "",
      usia_retensi: editData?.usia_retensi || "5 tahun",
    },
  });

  useEffect(() => {
    if (!isEdit) {
      fetchNextNoUrut();
    }
    fetchDaftarBerkas();
  }, [isEdit]);

  useEffect(() => {
    if (selectedKodeKlasifikasi) {
      const berkas = daftarBerkas.find(b => b.kode_klasifikasi === selectedKodeKlasifikasi);
      if (berkas) {
        form.setValue("no_berkas", berkas.no_berkas);
      }
    }
  }, [selectedKodeKlasifikasi, daftarBerkas]);

  const fetchDaftarBerkas = async () => {
    const { data, error } = await supabase
      .from("daftar_berkas")
      .select("no_berkas, kode_klasifikasi, uraian_informasi_berkas")
      .order("no_berkas", { ascending: true });

    if (!error && data) {
      setDaftarBerkas(data);
    }
  };

  const fetchNextNoUrut = async () => {
    const { data, error } = await supabase
      .from("isi_berkas")
      .select("no_urut")
      .order("no_urut", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching no_urut:", error);
      return;
    }

    if (data && data.length > 0) {
      setNoUrut((data[0] as any).no_urut + 1);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (isEdit && editData) {
      const { error } = await supabase
        .from("isi_berkas")
        .update({
          no_berkas: values.no_berkas,
          kode_klasifikasi: values.kode_klasifikasi,
          uraian_informasi_arsip: values.uraian_informasi_arsip,
          nomor_surat_naskah: values.nomor_surat_naskah || null,
          nama_pic: values.nama_pic || null,
          kurun_waktu: values.kurun_waktu,
          tingkat_perkembangan: values.tingkat_perkembangan,
          jumlah: values.jumlah,
          keterangan: values.keterangan || null,
          klasifikasi_keamanan: values.klasifikasi_keamanan || null,
          hak_akses: values.hak_akses || null,
          usia_retensi: values.usia_retensi || "5 tahun",
        } as any)
        .eq("id", editData.id);

      if (error) {
        console.error("Update error:", error);
        toast({
          title: "Error",
          description: `Gagal mengupdate data: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Berhasil",
        description: "Data isi berkas berhasil diupdate",
      });
    } else {
      const { error } = await supabase.from("isi_berkas").insert([
        {
          no_urut: noUrut,
          no_berkas: values.no_berkas,
          kode_klasifikasi: values.kode_klasifikasi,
          uraian_informasi_arsip: values.uraian_informasi_arsip,
          nomor_surat_naskah: values.nomor_surat_naskah || null,
          nama_pic: values.nama_pic || null,
          kurun_waktu: values.kurun_waktu,
          tingkat_perkembangan: values.tingkat_perkembangan,
          jumlah: values.jumlah,
          keterangan: values.keterangan || null,
          klasifikasi_keamanan: values.klasifikasi_keamanan || null,
          hak_akses: values.hak_akses || null,
          usia_retensi: values.usia_retensi || "5 tahun",
        },
      ] as any);

      if (error) {
        console.error("Insert error:", error);
        toast({
          title: "Error",
          description: `Gagal menyimpan data: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Berhasil",
        description: "Data isi berkas berhasil disimpan",
      });

      form.reset();
      fetchNextNoUrut();
    }

    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormItem>
            <FormLabel>No Urut</FormLabel>
            <FormControl>
              <Input value={noUrut} disabled className="bg-muted" />
            </FormControl>
          </FormItem>

          <FormItem>
            <FormLabel>Nomor Berkas</FormLabel>
            <FormControl>
              <Input 
                value={form.watch("no_berkas")} 
                disabled 
                className="bg-muted" 
              />
            </FormControl>
            <p className="text-sm text-muted-foreground">
              Nomor berkas otomatis terisi berdasarkan kode klasifikasi yang dipilih
            </p>
          </FormItem>

          <FormField
            control={form.control}
            name="kode_klasifikasi"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Kode Klasifikasi</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                        {field.value ? `${field.value} - No Berkas ${daftarBerkas.find(b => b.kode_klasifikasi === field.value)?.no_berkas || ''}` : "Pilih kode klasifikasi"}
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
                          {daftarBerkas.map((berkas) => (
                            <CommandItem key={berkas.no_berkas} value={`${berkas.kode_klasifikasi} - No Berkas ${berkas.no_berkas}`} onSelect={() => { field.onChange(berkas.kode_klasifikasi); setSelectedKodeKlasifikasi(berkas.kode_klasifikasi); }}>
                              <Check className={cn("mr-2 h-4 w-4", field.value === berkas.kode_klasifikasi ? "opacity-100" : "opacity-0")} />
                              {berkas.kode_klasifikasi} - No Berkas {berkas.no_berkas}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="uraian_informasi_arsip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Uraian Informasi Arsip</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nomor_surat_naskah"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Surat/Naskah</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Masukkan nomor surat/naskah" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nama_pic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama PIC</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Nama PIC" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="Bagian Umum">Bagian Umum</SelectItem>
                      <SelectItem value="Bidang P2">Bidang P2</SelectItem>
                      <SelectItem value="Bidang KI">Bidang KI</SelectItem>
                      <SelectItem value="Bidang KC">Bidang KC</SelectItem>
                      <SelectItem value="Bidang Fasilitas">Bidang Fasilitas</SelectItem>
                      <SelectItem value="Sub Unsur Audit">Sub Unsur Audit</SelectItem>
                      <SelectItem value="Sub Unsur Keban">Sub Unsur Keban</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kurun_waktu"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Naskah</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                <FormLabel>Tingkat Pengembangan</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tingkat pengembangan" />
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
            name="keterangan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keterangan</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih keterangan" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="Digital">Digital</SelectItem>
                      <SelectItem value="Tekstual">Tekstual</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="klasifikasi_keamanan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Klasifikasi Keamanan</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih klasifikasi keamanan" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="Rahasia">Rahasia</SelectItem>
                      <SelectItem value="Terbatas">Terbatas</SelectItem>
                      <SelectItem value="Biasa">Biasa</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hak_akses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hak Akses</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih hak akses" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="Eselon 3">Eselon 3</SelectItem>
                      <SelectItem value="Eselon 4">Eselon 4</SelectItem>
                      <SelectItem value="Fungsional">Fungsional</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="usia_retensi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usia Retensi</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih usia retensi" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="1 tahun">1 tahun</SelectItem>
                      <SelectItem value="2 tahun">2 tahun</SelectItem>
                      <SelectItem value="3 tahun">3 tahun</SelectItem>
                      <SelectItem value="5 tahun">5 tahun</SelectItem>
                      <SelectItem value="10 tahun">10 tahun</SelectItem>
                      <SelectItem value="Permanen">Permanen</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          <Button type="submit" className="w-full md:w-auto">
            {isEdit ? "Update Data Isi Berkas" : "Simpan Data Isi Berkas"}
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
