import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TimUpkMember {
  id: string;
  name: string;
  email: string;
  telepon?: string;
  tugas?: string;
  assignment_count: number;
  last_assigned_at?: string;
  created_at: string;
}

export default function TimUpkManagement() {
  const [members, setMembers] = useState<TimUpkMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editMember, setEditMember] = useState<TimUpkMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    telepon: "",
    tugas: "",
    assignment_count: 0,
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("tim_upk")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat data Tim UPK");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Nama dan email wajib diisi");
      return;
    }

    try {
      if (editMember) {
        const { error } = await supabase
          .from("tim_upk")
          .update({
            name: formData.name,
            email: formData.email,
            telepon: formData.telepon || null,
            tugas: formData.tugas || null,
            assignment_count: formData.assignment_count,
          })
          .eq("id", editMember.id);

        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const { error } = await supabase.from("tim_upk").insert({
          name: formData.name,
          email: formData.email,
          telepon: formData.telepon || null,
          tugas: formData.tugas || null,
        });

        if (error) throw error;
        toast.success("Anggota Tim UPK berhasil ditambahkan");
      }

      setDialogOpen(false);
      setEditMember(null);
      setFormData({ name: "", email: "", telepon: "", tugas: "", assignment_count: 0 });
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      // First, nullify any foreign key references in assignments table
      const { error: fkError1 } = await supabase
        .from("assignments")
        .update({ assigned_upk_id: null, assigned_upk_at: null, assigned_upk_manually: false } as any)
        .eq("assigned_upk_id", deleteId);

      if (fkError1) throw fkError1;

      // Also nullify references in plh_kepala table
      const { error: fkError2 } = await supabase
        .from("plh_kepala")
        .update({ assigned_upk_id: null, assigned_upk_at: null, assigned_upk_manually: false } as any)
        .eq("assigned_upk_id", deleteId);

      if (fkError2) throw fkError2;

      // Now delete the tim_upk member
      const { error } = await supabase
        .from("tim_upk")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Anggota berhasil dihapus");
      setDeleteId(null);
      fetchMembers();
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error(error.message || "Gagal menghapus anggota");
    }
  };

  const openEditDialog = (member: TimUpkMember) => {
    setEditMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      telepon: member.telepon || "",
      tugas: member.tugas || "",
      assignment_count: member.assignment_count,
    });
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditMember(null);
    setFormData({ name: "", email: "", telepon: "", tugas: "", assignment_count: 0 });
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Kelola Tim UPK</h3>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Anggota
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Tugas</TableHead>
              <TableHead className="text-center">Jumlah Penugasan</TableHead>
              <TableHead>Terakhir Ditugaskan</TableHead>
              <TableHead className="w-24">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Belum ada anggota Tim UPK
                </TableCell>
              </TableRow>
            ) : (
              members.map((member, index) => (
                <TableRow key={member.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell>{member.telepon || "-"}</TableCell>
                  <TableCell>{member.tugas || "-"}</TableCell>
                  <TableCell className="text-center font-semibold">{member.assignment_count}</TableCell>
                  <TableCell>
                    {member.last_assigned_at
                      ? format(new Date(member.last_assigned_at), "dd MMM yyyy HH:mm", { locale: id })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(member)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(member.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMember ? "Edit Anggota Tim UPK" : "Tambah Anggota Tim UPK"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nama *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nama@kemenkeu.go.id"
              />
            </div>
            <div>
              <Label htmlFor="telepon">Telepon</Label>
              <Input
                id="telepon"
                value={formData.telepon}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <Label htmlFor="tugas">Tugas</Label>
              <Input
                id="tugas"
                value={formData.tugas}
                onChange={(e) => setFormData({ ...formData, tugas: e.target.value })}
                placeholder="Deskripsi tugas"
              />
            </div>
            {editMember && (
              <div className="bg-muted/50 rounded-lg p-3 border">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-muted-foreground">Jumlah Penugasan</Label>
                    <p className="text-lg font-semibold text-primary">{formData.assignment_count}</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const newCount = prompt("Masukkan jumlah penugasan baru:", String(formData.assignment_count));
                      if (newCount !== null && !isNaN(Number(newCount))) {
                        setFormData({ ...formData, assignment_count: Number(newCount) });
                      }
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSubmit}>
                {editMember ? "Simpan Perubahan" : "Tambah"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Anggota Tim UPK?</AlertDialogTitle>
            <AlertDialogDescription>
              Data yang dihapus tidak dapat dikembalikan.
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
