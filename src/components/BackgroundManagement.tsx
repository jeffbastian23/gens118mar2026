import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Image, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";

interface BackgroundItem {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export default function BackgroundManagement() {
  const [backgrounds, setBackgrounds] = useState<BackgroundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<BackgroundItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    image_url: "",
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBackgrounds();
  }, []);

  const fetchBackgrounds = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("login_backgrounds")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBackgrounds(data || []);
    } catch (error: any) {
      console.error("Error fetching backgrounds:", error);
      // Table might not exist yet
      setBackgrounds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diizinkan");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    setUploadedFile(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!uploadedFile) return formData.image_url || null;

    try {
      setUploading(true);
      const fileExt = uploadedFile.name.split(".").pop();
      const fileName = `background-${Date.now()}.${fileExt}`;
      const filePath = `login-backgrounds/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("public-assets")
        .upload(filePath, uploadedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("public-assets")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Gagal mengupload gambar");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Nama background wajib diisi");
      return;
    }

    try {
      let imageUrl = formData.image_url;

      if (uploadedFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          // Upload failed, don't continue
          return;
        }
      }

      // Validate that image_url is a valid URL
      if (!imageUrl || (!imageUrl.startsWith('http') && !imageUrl.startsWith('/'))) {
        toast.error("URL gambar wajib diisi dengan format yang benar atau upload gambar");
        return;
      }

      if (editItem) {
        const { error } = await (supabase as any)
          .from("login_backgrounds")
          .update({
            name: formData.name,
            image_url: imageUrl,
          })
          .eq("id", editItem.id);

        if (error) throw error;
        toast.success("Background berhasil diperbarui");
      } else {
        const { error } = await (supabase as any).from("login_backgrounds").insert({
          name: formData.name,
          image_url: imageUrl,
          is_active: false,
        });

        if (error) throw error;
        toast.success("Background berhasil ditambahkan");
      }

      setDialogOpen(false);
      setEditItem(null);
      setFormData({ name: "", image_url: "" });
      setUploadedFile(null);
      fetchBackgrounds();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan background");
    }
  };

  const handleToggleActive = async (item: BackgroundItem) => {
    try {
      // If activating, deactivate all others first
      if (!item.is_active) {
        await (supabase as any)
          .from("login_backgrounds")
          .update({ is_active: false })
          .neq("id", item.id);
      }

      const { error } = await (supabase as any)
        .from("login_backgrounds")
        .update({ is_active: !item.is_active })
        .eq("id", item.id);

      if (error) throw error;
      toast.success(item.is_active ? "Background dinonaktifkan" : "Background diaktifkan");
      fetchBackgrounds();
    } catch (error: any) {
      toast.error("Gagal mengubah status background");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await (supabase as any)
        .from("login_backgrounds")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Background berhasil dihapus");
      setDeleteId(null);
      fetchBackgrounds();
    } catch (error: any) {
      toast.error("Gagal menghapus background");
    }
  };

  const openEditDialog = (item: BackgroundItem) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      image_url: item.image_url,
    });
    setUploadedFile(null);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditItem(null);
    setFormData({ name: "", image_url: "" });
    setUploadedFile(null);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Kelola Background Login
          </CardTitle>
          <Button onClick={openAddDialog} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Background
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Atur gambar latar belakang untuk halaman login. Hanya 1 background yang bisa aktif pada satu waktu.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead className="w-24">Preview</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="text-center">Aktif</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className="w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backgrounds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Belum ada background. Klik "Tambah Background" untuk menambahkan.
                  </TableCell>
                </TableRow>
              ) : (
                backgrounds.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div className="w-20 h-12 rounded overflow-hidden border">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleActive(item)}
                        />
                        {item.is_active && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Background" : "Tambah Background"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Background *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Gedung Bea Cukai"
              />
            </div>
            <div>
              <Label htmlFor="image">Upload Gambar</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {uploadedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  File terpilih: {uploadedFile.name}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="image_url">Atau URL Gambar</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            {(formData.image_url || uploadedFile) && (
              <div className="border rounded-lg p-2">
                <Label className="text-sm mb-2 block">Preview:</Label>
                <img
                  src={uploadedFile ? URL.createObjectURL(uploadedFile) : formData.image_url}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSubmit} disabled={uploading}>
                {uploading ? "Mengupload..." : editItem ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Background?</AlertDialogTitle>
            <AlertDialogDescription>
              Background yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
