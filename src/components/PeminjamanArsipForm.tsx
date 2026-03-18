import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CameraCapture from "./CameraCapture";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight } from "lucide-react";

const formSchema = z.object({
  keperluan: z.string().min(1, "Keperluan wajib diisi"),
  nama_peminjam: z.string().min(1, "Nama peminjam wajib diisi"),
});

type FormValues = z.infer<typeof formSchema>;

interface PeminjamanArsipFormProps {
  onSuccess: () => void;
}

interface IsiBerkas {
  id: string;
  no_berkas: number;
  kode_klasifikasi: string;
  uraian_informasi_arsip: string;
  kurun_waktu: string;
  no_urut: number;
  nama_pic: string | null;
  tingkat_perkembangan: string;
  nomor_surat_naskah: string | null;
}

interface GroupedIsiBerkas {
  no_berkas: number;
  kode_klasifikasi: string;
  items: IsiBerkas[];
}

export default function PeminjamanArsipForm({ onSuccess }: PeminjamanArsipFormProps) {
  const { toast } = useToast();
  const [fotoPeminjam, setFotoPeminjam] = useState<string>("");
  const [noUrut, setNoUrut] = useState<number>(1);
  const [profiles, setProfiles] = useState<{ id: string; nama_lengkap: string }[]>([]);
  const [isiBerkasList, setIsiBerkasList] = useState<IsiBerkas[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [useCustomName, setUseCustomName] = useState<boolean>(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keperluan: "",
      nama_peminjam: "",
    },
  });

  useEffect(() => {
    fetchNextNoUrut();
    fetchProfiles();
    fetchIsiBerkas();
  }, []);

  const fetchNextNoUrut = async () => {
    const { data, error } = await supabase
      .from("peminjaman_arsip")
      .select("no_urut")
      .order("no_urut", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching no_urut:", error);
      return;
    }

    if (data && data.length > 0) {
      setNoUrut((data[0] as any).no_urut + 1);
    } else {
      setNoUrut(1);
    }
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .not("full_name", "is", null)
      .order("full_name", { ascending: true });

    if (!error && data) {
      setProfiles(data.filter(p => p.full_name).map(p => ({ id: p.id, nama_lengkap: p.full_name || '' })));
    }
  };

  const fetchIsiBerkas = async () => {
    const { data, error } = await supabase
      .from("isi_berkas")
      .select("*")
      .order("no_berkas", { ascending: false });

    if (!error && data) {
      setIsiBerkasList(data as IsiBerkas[]);
    }
  };

  // Group isi_berkas by no_berkas (box)
  const groupedIsiBerkas = useMemo(() => {
    const groups: Map<number, GroupedIsiBerkas> = new Map();
    
    isiBerkasList.forEach(item => {
      if (!groups.has(item.no_berkas)) {
        groups.set(item.no_berkas, {
          no_berkas: item.no_berkas,
          kode_klasifikasi: item.kode_klasifikasi,
          items: []
        });
      }
      groups.get(item.no_berkas)!.items.push(item);
    });

    return Array.from(groups.values()).sort((a, b) => b.no_berkas - a.no_berkas);
  }, [isiBerkasList]);

  // Filter groups based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedIsiBerkas;
    
    const query = searchQuery.toLowerCase();
    return groupedIsiBerkas.filter(group => 
      group.no_berkas.toString().includes(query) ||
      group.kode_klasifikasi.toLowerCase().includes(query) ||
      group.items.some(item => 
        item.uraian_informasi_arsip?.toLowerCase().includes(query)
      )
    );
  }, [groupedIsiBerkas, searchQuery]);

  // Get all IDs for a group
  const getGroupIds = (group: GroupedIsiBerkas): string[] => {
    return group.items.map(item => item.id);
  };

  // Check if all items in a group are selected
  const isGroupSelected = (group: GroupedIsiBerkas): boolean => {
    return group.items.every(item => selectedIds.has(item.id));
  };

  // Check if some items in a group are selected
  const isGroupPartiallySelected = (group: GroupedIsiBerkas): boolean => {
    const selectedCount = group.items.filter(item => selectedIds.has(item.id)).length;
    return selectedCount > 0 && selectedCount < group.items.length;
  };

  // Toggle group selection
  const toggleGroup = (group: GroupedIsiBerkas) => {
    const groupIds = getGroupIds(group);
    const newSelected = new Set(selectedIds);
    
    if (isGroupSelected(group)) {
      groupIds.forEach(id => newSelected.delete(id));
    } else {
      groupIds.forEach(id => newSelected.add(id));
    }
    
    setSelectedIds(newSelected);
  };

  // Toggle individual item
  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Toggle expand group
  const toggleExpand = (noBerkas: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(noBerkas)) {
      newExpanded.delete(noBerkas);
    } else {
      newExpanded.add(noBerkas);
    }
    setExpandedGroups(newExpanded);
  };

  // Select all
  const selectAll = () => {
    const allIds = filteredGroups.flatMap(group => getGroupIds(group));
    setSelectedIds(new Set(allIds));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Check if all filtered items are selected
  const isAllSelected = useMemo(() => {
    const allIds = filteredGroups.flatMap(group => getGroupIds(group));
    return allIds.length > 0 && allIds.every(id => selectedIds.has(id));
  }, [filteredGroups, selectedIds]);

  const onSubmit = async (values: FormValues) => {
    if (selectedIds.size === 0) {
      toast({
        title: "Error",
        description: "Pilih minimal satu dokumen",
        variant: "destructive",
      });
      return;
    }

    const selectedItems = isiBerkasList.filter(item => selectedIds.has(item.id));

    // Map nama_pic to valid pemilik_dokumen values
    const pemilikDokumenMap: Record<string, string> = {
      "Bagian Umum": "Umum",
      "Bidang P2": "P2",
      "Bidang KI": "KI",
      "Bidang KC": "KC",
      "Bidang Fasilitas": "Fasilitas",
      "Sub Unsur Audit": "Audit",
      "Sub Unsur Keban": "Keban"
    };

    let currentNoUrut = noUrut;
    let successCount = 0;
    let errorCount = 0;

    for (const item of selectedItems) {
      // Find corresponding pendataan_masuk for location info
      const { data: pendataan } = await supabase
        .from("pendataan_masuk")
        .select("*")
        .eq("no_berkas", item.no_berkas)
        .maybeSingle();

      const pemilikDokumen = item.nama_pic 
        ? pemilikDokumenMap[item.nama_pic] || "Umum"
        : "Umum";

      const { error } = await supabase.from("peminjaman_arsip").insert([
        {
          no_urut: currentNoUrut,
          nama_dokumen: item.uraian_informasi_arsip,
          kode_klasifikasi: item.kode_klasifikasi,
          nomor_boks: item.no_berkas.toString(),
          tahun_dokumen: item.kurun_waktu || new Date().getFullYear().toString(),
          pemilik_dokumen: pemilikDokumen,
          no_rak: pendataan?.nomor_rak || "-",
          sub_rak: pendataan?.sub_rak || "-",
          susun: pendataan?.susun || "-",
          baris: pendataan?.baris || "-",
          status_dokumen: "Aktif",
          keperluan: values.keperluan,
          nama_peminjam: values.nama_peminjam,
          foto_peminjam: fotoPeminjam || null,
          isi_berkas_id: item.id,
        }
      ] as any);

      if (error) {
        console.error("Insert error:", error);
        errorCount++;
      } else {
        successCount++;
        currentNoUrut++;
      }
    }

    if (errorCount > 0) {
      toast({
        title: "Perhatian",
        description: `${successCount} data berhasil disimpan, ${errorCount} gagal`,
        variant: "default",
      });
    } else {
      toast({
        title: "Berhasil",
        description: `${successCount} data peminjaman berhasil disimpan`,
      });
    }

    form.reset();
    setFotoPeminjam("");
    setSelectedIds(new Set());
    fetchNextNoUrut();
    onSuccess();
  };

  const selectedCount = selectedIds.size;
  const selectedItems = isiBerkasList.filter(item => selectedIds.has(item.id));

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

          <FormItem className="md:col-span-2">
            <FormLabel>Cari Dokumen</FormLabel>
            <FormControl>
              <Input 
                placeholder="Cari berdasarkan uraian, kode klasifikasi, atau nomor berkas..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </FormControl>
          </FormItem>

          <div className="md:col-span-2">
            <FormLabel>Pilih Dokumen dari Pendataan Masuk</FormLabel>
            <div className="mt-2 flex items-center gap-4 mb-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="select-all"
                  checked={isAllSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      selectAll();
                    } else {
                      deselectAll();
                    }
                  }}
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Pilih Semua
                </label>
              </div>
              {selectedCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({selectedCount} dokumen dipilih)
                </span>
              )}
            </div>
            
            <ScrollArea className="h-[300px] border rounded-md p-2">
              <div className="space-y-2">
                {filteredGroups.map((group) => (
                  <div key={group.no_berkas} className="border rounded-md">
                    <div 
                      className="flex items-center gap-2 p-2 bg-muted/50 hover:bg-muted cursor-pointer"
                      onClick={() => toggleExpand(group.no_berkas)}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="p-0 h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(group.no_berkas);
                        }}
                      >
                        {expandedGroups.has(group.no_berkas) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                      <Checkbox 
                        checked={isGroupSelected(group)}
                        ref={(el) => {
                          if (el && isGroupPartiallySelected(group)) {
                            el.dataset.state = "indeterminate";
                          }
                        }}
                        onCheckedChange={() => toggleGroup(group)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="font-medium text-sm">
                        Berkas #{group.no_berkas} - {group.kode_klasifikasi} ({group.items.length} dokumen)
                      </span>
                    </div>
                    
                    {expandedGroups.has(group.no_berkas) && (
                      <div className="p-2 pl-10 space-y-1 bg-background">
                        {group.items.map((item) => (
                          <div 
                            key={item.id} 
                            className="flex items-center gap-2 p-1 hover:bg-muted/30 rounded cursor-pointer"
                            onClick={() => toggleItem(item.id)}
                          >
                            <Checkbox 
                              checked={selectedIds.has(item.id)}
                              onCheckedChange={() => toggleItem(item.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-sm">
                              {item.uraian_informasi_arsip} - {item.kode_klasifikasi}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredGroups.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    {searchQuery ? "Tidak ada dokumen yang cocok" : "Tidak ada dokumen"}
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {selectedCount > 0 && (
            <div className="md:col-span-2 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Dokumen Terpilih ({selectedCount}):</h4>
              <div className="max-h-[150px] overflow-y-auto space-y-1">
                {selectedItems.slice(0, 10).map((item) => (
                  <div key={item.id} className="text-sm flex justify-between">
                    <span>{item.uraian_informasi_arsip}</span>
                    <span className="text-muted-foreground">Berkas #{item.no_berkas}</span>
                  </div>
                ))}
                {selectedCount > 10 && (
                  <p className="text-sm text-muted-foreground">
                    ... dan {selectedCount - 10} dokumen lainnya
                  </p>
                )}
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="keperluan"
            render={({ field }) => (
              <FormItem className="md:col-span-2 lg:col-span-1">
                <FormLabel>Keperluan</FormLabel>
                <FormControl>
                  <Textarea placeholder="Masukkan keperluan peminjaman" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nama_peminjam"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Lengkap Peminjam</FormLabel>
                {!useCustomName && profiles.length > 0 ? (
                  <>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih nama peminjam" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background z-50">
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.nama_lengkap}>
                            {profile.nama_lengkap}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="mt-1 h-auto p-0"
                      onClick={() => {
                        setUseCustomName(true);
                        field.onChange("");
                      }}
                    >
                      Nama tidak terdaftar? Ketik manual
                    </Button>
                  </>
                ) : (
                  <>
                    <FormControl>
                      <Input placeholder="Masukkan nama lengkap" {...field} />
                    </FormControl>
                    {profiles.length > 0 && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="mt-1 h-auto p-0"
                        onClick={() => {
                          setUseCustomName(false);
                          field.onChange("");
                        }}
                      >
                        Pilih dari daftar peminjam
                      </Button>
                    )}
                  </>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Foto Peminjam</FormLabel>
            <FormControl>
              <CameraCapture onCapture={setFotoPeminjam} currentImage={fotoPeminjam} />
            </FormControl>
          </FormItem>
        </div>

        <Button type="submit" className="w-full md:w-auto" disabled={selectedCount === 0}>
          Simpan Data Peminjaman ({selectedCount} dokumen)
        </Button>
      </form>
    </Form>
  );
}
