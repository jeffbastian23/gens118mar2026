import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEffect } from "react";

interface AbsensiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  absensi?: any;
}

export default function AbsensiDialog({
  open,
  onOpenChange,
  absensi,
}: AbsensiDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (absensi) {
      reset({
        nama: absensi.nama,
        nip: absensi.nip,
        tanggal: absensi.tanggal,
        jam_masuk: absensi.jam_masuk,
        jam_pulang: absensi.jam_pulang,
      });
    } else {
      reset({
        nama: "",
        nip: "",
        tanggal: "",
        jam_masuk: "",
        jam_pulang: "",
      });
    }
  }, [absensi, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (absensi) {
        const { error } = await supabase
          .from("absensi")
          .update(data)
          .eq("id", absensi.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("absensi").insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absensi"] });
      toast.success(
        absensi ? "Data absensi berhasil diupdate" : "Data absensi berhasil ditambahkan"
      );
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(`Gagal menyimpan data: ${error.message}`);
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {absensi ? "Edit Data Absensi" : "Tambah Data Absensi"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama</Label>
            <Input id="nama" {...register("nama")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nip">NIP</Label>
            <Input id="nip" {...register("nip")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tanggal">Tanggal</Label>
            <Input id="tanggal" type="date" {...register("tanggal")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jam_masuk">Jam Masuk</Label>
            <Input id="jam_masuk" type="time" {...register("jam_masuk")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jam_pulang">Jam Pulang</Label>
            <Input id="jam_pulang" type="time" {...register("jam_pulang")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
