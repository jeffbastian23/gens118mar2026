import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Plus, Pencil, Trash2, Radio, Music, Video, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OnAirItem {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  media_url: string;
  thumbnail_url: string | null;
  is_live: boolean;
  created_at: string;
  created_by: string | null;
}

export default function OnAirTab() {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const [items, setItems] = useState<OnAirItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<OnAirItem | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    media_type: "audio",
    media_url: "",
    thumbnail_url: "",
    is_live: false
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("on_air_content")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching on air content:", error);
      setItems([]);
    } else {
      setItems((data || []) as OnAirItem[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.media_url) {
      toast.error("Judul dan URL media harus diisi");
      return;
    }

    try {
      if (editingItem) {
        const { error } = await (supabase as any)
          .from("on_air_content")
          .update({
            title: formData.title,
            description: formData.description || null,
            media_type: formData.media_type,
            media_url: formData.media_url,
            thumbnail_url: formData.thumbnail_url || null,
            is_live: formData.is_live
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Konten berhasil diubah");
      } else {
        const { error } = await (supabase as any)
          .from("on_air_content")
          .insert({
            title: formData.title,
            description: formData.description || null,
            media_type: formData.media_type,
            media_url: formData.media_url,
            thumbnail_url: formData.thumbnail_url || null,
            is_live: formData.is_live,
            created_by: user?.email
          });

        if (error) throw error;
        toast.success("Konten berhasil ditambahkan");
      }

      setShowDialog(false);
      resetForm();
      fetchItems();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal menyimpan konten");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus konten ini?")) return;
    
    const { error } = await (supabase as any).from("on_air_content").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus konten");
      return;
    }
    toast.success("Konten berhasil dihapus");
    fetchItems();
  };

  const handleEdit = (item: OnAirItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      media_type: item.media_type,
      media_url: item.media_url,
      thumbnail_url: item.thumbnail_url || "",
      is_live: item.is_live
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      media_type: "audio",
      media_url: "",
      thumbnail_url: "",
      is_live: false
    });
  };

  const togglePlay = (item: OnAirItem) => {
    if (playingId === item.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = item.media_url;
        audioRef.current.play();
      }
      setPlayingId(item.id);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "audio":
        return <Music className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      default:
        return <Radio className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-500" />
          On Air - Informasi Kepegawaian
        </CardTitle>
        {isAdmin && (
          <Button onClick={() => { resetForm(); setShowDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Konten
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {/* Hidden audio element for playback */}
        <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
        
        {loading ? (
          <div className="text-center py-8">Memuat konten...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada konten On Air</p>
            <p className="text-sm mt-2">Konten podcast dan streaming informasi kepegawaian akan tampil di sini</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Featured/Live Content */}
            {items.filter(item => item.is_live).map(item => (
              <Card key={item.id} className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {item.thumbnail_url ? (
                        <img 
                          src={item.thumbnail_url} 
                          alt={item.title}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center">
                          {getMediaIcon(item.media_type)}
                        </div>
                      )}
                      <Badge className="absolute -top-2 -right-2 bg-red-500 animate-pulse">
                        LIVE
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {item.media_type === "audio" ? (
                        <Button
                          variant={playingId === item.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => togglePlay(item)}
                        >
                          {playingId === item.id ? (
                            <Pause className="w-4 h-4 mr-2" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          {playingId === item.id ? "Pause" : "Play"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(item.media_url, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Buka
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Regular Content List */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.filter(item => !item.is_live).map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {getMediaIcon(item.media_type)}
                        {item.media_type === "audio" ? "Audio" : "Video"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.created_at), "dd MMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {item.media_type === "audio" ? (
                          <Button
                            variant={playingId === item.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => togglePlay(item)}
                          >
                            {playingId === item.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(item.media_url, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Konten" : "Tambah Konten On Air"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Judul *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Judul podcast/streaming"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi singkat konten"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipe Media</Label>
                  <Select 
                    value={formData.media_type} 
                    onValueChange={(v) => setFormData({ ...formData, media_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audio">Audio/Podcast</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_live}
                      onChange={(e) => setFormData({ ...formData, is_live: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Tampilkan sebagai LIVE</span>
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>URL Media *</Label>
                <Input
                  value={formData.media_url}
                  onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                  placeholder="https://example.com/audio.mp3 atau link YouTube"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Masukkan URL audio/video langsung atau link YouTube/Spotify
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>URL Thumbnail (Opsional)</Label>
                <Input
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingItem ? "Simpan Perubahan" : "Tambah"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
