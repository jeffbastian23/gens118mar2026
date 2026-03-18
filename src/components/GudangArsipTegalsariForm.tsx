import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const NOMOR_RAK_OPTIONS = [
  "P1", "P2", "P22", "P23", "P24", "P3", "P4", "P5", "P6", "P7",
  "R10", "R11", "R12", "R13", "R1K", "R2", "R23", "R2K", "R3", "R31", 
  "R32", "R3K", "R4", "R8", "R9", "RL1K"
];

const formSchema = z.object({
  nomor_rak: z.string().min(1, "Nomor rak wajib diisi"),
  jenis_rak: z.enum(["Tipe 1", "Tipe 2", "Tipe 3"], { required_error: "Jenis rak wajib dipilih" }),
  jumlah_rak: z.coerce.number().min(1, "Jumlah rak harus lebih dari 0"),
  jumlah_terisi_box: z.coerce.number().min(0, "Jumlah terisi tidak boleh negatif"),
});

type FormValues = z.infer<typeof formSchema>;

interface GudangArsipTegalsariFormProps {
  onSuccess: () => void;
  editData?: any;
}

export default function GudangArsipTegalsariForm({ onSuccess, editData }: GudangArsipTegalsariFormProps) {
  const { toast } = useToast();
  const [jumlahTerisiAuto, setJumlahTerisiAuto] = useState(0);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: editData ? {
      nomor_rak: editData.nomor_rak,
      jenis_rak: editData.jenis_rak,
      jumlah_rak: editData.jumlah_rak,
      jumlah_terisi_box: editData.jumlah_terisi_box,
    } : {
      nomor_rak: "",
      jenis_rak: "Tipe 1" as const,
      jumlah_rak: 0,
      jumlah_terisi_box: 0,
    },
  });

  // Watch jenis_rak and jumlah_rak for automatic calculations
  const jenisRak = form.watch("jenis_rak");
  const jumlahRak = form.watch("jumlah_rak");
  const nomorRak = form.watch("nomor_rak");

  // Fetch jumlah terisi from pendataan_masuk
  useEffect(() => {
    const fetchJumlahTerisi = async () => {
      if (!nomorRak) {
        setJumlahTerisiAuto(0);
        return;
      }

      const { data, error } = await supabase
        .from("pendataan_masuk")
        .select("id", { count: "exact" })
        .eq("nomor_rak", nomorRak);

      if (!error && data) {
        const count = data.length;
        setJumlahTerisiAuto(count);
        form.setValue("jumlah_terisi_box", count);
      }
    };

    fetchJumlahTerisi();
  }, [nomorRak, form]);

  const onSubmit = async (values: FormValues) => {
    // Calculate based on jenis_rak
    const kapasitasBoxPerRak = values.jenis_rak === "Tipe 1" ? 20 : values.jenis_rak === "Tipe 2" ? 40 : 56;
    const kapasitas = values.jumlah_rak * kapasitasBoxPerRak;
    const sisaKapasitas = kapasitas - values.jumlah_terisi_box;

    const dataToSave = {
      nomor_rak: values.nomor_rak,
      jenis_rak: values.jenis_rak,
      kapasitas_box_per_rak: kapasitasBoxPerRak,
      jumlah_rak: values.jumlah_rak,
      kapasitas: kapasitas,
      jumlah_terisi_box: values.jumlah_terisi_box,
      sisa_kapasitas_box: sisaKapasitas,
    };

    if (editData) {
      const { error } = await supabase
        .from("gudang_arsip_tegalsari")
        .update(dataToSave)
        .eq("id", editData.id);

      if (error) {
        toast({
          title: "Error",
          description: "Gagal mengupdate data gudang arsip",
          variant: "destructive",
        });
        return;
      }
    } else {
      const { error } = await supabase.from("gudang_arsip_tegalsari").insert([dataToSave]);

      if (error) {
        toast({
          title: "Error",
          description: "Gagal menyimpan data gudang arsip",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Berhasil",
      description: `Data gudang arsip berhasil ${editData ? "diupdate" : "disimpan"}`,
    });

    form.reset();
    onSuccess();
  };

  // Calculate kapasitas box per rak based on jenis_rak
  const kapasitasBoxPerRak = jenisRak === "Tipe 1" ? 20 : jenisRak === "Tipe 2" ? 40 : 56;
  const totalKapasitas = jumlahRak * kapasitasBoxPerRak;
  const sisaKapasitas = totalKapasitas - jumlahTerisiAuto;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="nomor_rak"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Rak *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Nomor Rak" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {NOMOR_RAK_OPTIONS.map((option) => (
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
            name="jenis_rak"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Rak *</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    <option value="Tipe 1">Tipe 1 (20 Box)</option>
                    <option value="Tipe 2">Tipe 2 (40 Box)</option>
                    <option value="Tipe 3">Tipe 3 (56 Box)</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jumlah_rak"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jumlah Rak *</FormLabel>
                <FormControl>
                  <Input type="number" min="1" placeholder="Jumlah rak" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jumlah_terisi_box"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jumlah Terisi (Box) *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    value={jumlahTerisiAuto}
                    disabled
                    className="bg-muted"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">Otomatis dari Pendataan Masuk</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2 space-y-2 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-sm">Informasi Otomatis:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Kapasitas Box/Rak:</p>
                <p className="font-semibold">{kapasitasBoxPerRak} Box</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Kapasitas:</p>
                <p className="font-semibold">{totalKapasitas} Box</p>
              </div>
              <div>
                <p className="text-muted-foreground">Jumlah Terisi:</p>
                <p className="font-semibold">{jumlahTerisiAuto} Box</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sisa Kapasitas:</p>
                <p className="font-semibold">{sisaKapasitas} Box</p>
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full md:w-auto">
          {editData ? "Update Data" : "Simpan Data"}
        </Button>
      </form>
    </Form>
  );
}
