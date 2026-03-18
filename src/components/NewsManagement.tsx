import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Upload, X, Loader2, Image } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface News {
  id: string;
  title: string;
  url: string | null;
  source: string | null;
  is_active: boolean | null;
  published_at: string | null;
  created_at: string;
  image_url: string | null;
}

export default function NewsManagement() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    source: "Kemenkeu",
    is_active: true,
    image_url: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error: any) {
      console.error("Error fetching news:", error);
      toast.error("Gagal memuat data berita");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("File harus berupa gambar");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `news_${Date.now()}.${fileExt}`;
      const filePath = `news/${fileName}`;

      const { data, error } = await supabase.storage
        .from('news-images')
        .upload(filePath, file, { upsert: true });

      if (error) {
        // If bucket doesn't exist, try creating it first or use public URL
        console.error("Upload error:", error);
        
        // Fallback: convert to base64 and store as data URL (not ideal but works)
        const base64Reader = new FileReader();
        base64Reader.onloadend = () => {
          const base64 = base64Reader.result as string;
          setFormData(prev => ({ ...prev, image_url: base64 }));
          setPreviewImage(base64);
          toast.success("Gambar berhasil dimuat");
        };
        base64Reader.readAsDataURL(file);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('news-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
      toast.success("Gambar berhasil diupload");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Gagal mengupload gambar");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: "" }));
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Judul berita wajib diisi");
      return;
    }

    try {
      if (editingNews) {
        const { error } = await supabase
          .from("news")
          .update({
            title: formData.title,
            url: formData.url || null,
            source: formData.source,
            is_active: formData.is_active,
            image_url: formData.image_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingNews.id);

        if (error) throw error;
        toast.success("Berita berhasil diperbarui");
      } else {
        const { error } = await supabase.from("news").insert([{
          title: formData.title,
          url: formData.url || null,
          source: formData.source,
          is_active: formData.is_active,
          image_url: formData.image_url || null,
          published_at: new Date().toISOString(),
        }]);

        if (error) throw error;
        toast.success("Berita berhasil ditambahkan");
      }

      setShowDialog(false);
      resetForm();
      fetchNews();
    } catch (error: any) {
      console.error("Error saving news:", error);
      toast.error("Gagal menyimpan berita");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus berita ini?")) return;

    try {
      const { error } = await supabase
        .from("news")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Berita berhasil dihapus");
      fetchNews();
    } catch (error: any) {
      console.error("Error deleting news:", error);
      toast.error("Gagal menghapus berita");
    }
  };

  const handleEdit = (newsItem: News) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      url: newsItem.url || "",
      source: newsItem.source || "Kemenkeu",
      is_active: newsItem.is_active ?? true,
      image_url: newsItem.image_url || "",
    });
    setPreviewImage(newsItem.image_url || null);
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingNews(null);
    setFormData({
      title: "",
      url: "",
      source: "Kemenkeu",
      is_active: true,
      image_url: "",
    });
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean | null) => {
    try {
      const { error } = await supabase
        .from("news")
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) {
        console.error("Error details:", error);
        throw error;
      }
      
      toast.success("Status berita berhasil diubah");
      fetchNews();
    } catch (error: any) {
      console.error("Error updating news status:", error);
      toast.error(`Gagal mengubah status berita: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Kelola Berita</h2>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Berita
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Gambar</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : news.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Belum ada berita
                </TableCell>
              </TableRow>
            ) : (
              news.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt="" 
                        className="w-16 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                        <Image className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md">{item.title}</TableCell>
                  <TableCell>{item.source || "-"}</TableCell>
                  <TableCell>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={item.is_active ?? true}
                      onCheckedChange={() => handleToggleActive(item.id, item.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(item.created_at).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNews ? "Edit Berita" : "Tambah Berita"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Judul Berita *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masukkan judul berita"
                required
              />
            </div>
            <div>
              <Label htmlFor="source">Sumber</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="Contoh: Kemenkeu"
              />
            </div>
            <div>
              <Label htmlFor="url">URL (Opsional)</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Gambar (Opsional)</Label>
              <div className="mt-2 space-y-3">
                {/* Preview */}
                {(previewImage || formData.image_url) && (
                  <div className="relative inline-block">
                    <img 
                      src={previewImage || formData.image_url} 
                      alt="Preview" 
                      className="w-full max-w-[200px] h-32 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Gambar
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Format: JPG, PNG, GIF. Maksimal 5MB.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Aktif</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={uploadingImage}>
                {editingNews ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
