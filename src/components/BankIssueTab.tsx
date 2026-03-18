import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const UIC_OPTIONS = [
  "Bagian Umum",
  "Bidang P2",
  "Bidang KI",
  "Bidang KC",
  "Bidang Fasilitas",
  "Sub Unsur Audit",
  "Sub Unsur Keban",
  "BC Perak",
  "BC Juanda",
  "BC Madura",
  "BC Sidoarjo",
  "BC Pasuruan",
  "BC Bojonegoro",
  "BLBC Surabaya"
];

interface BankIssue {
  id: string;
  no: number | null;
  issue: string;
  solusi: string | null;
  uic: string[] | null;
  created_at: string;
  created_by_email: string | null;
}

export default function BankIssueTab() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<BankIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingIssue, setEditingIssue] = useState<BankIssue | null>(null);
  const [formData, setFormData] = useState({
    issue: "",
    solusi: "",
    uic: [] as string[],
  });

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bank_issue")
        .select("*")
        .order("no", { ascending: true });

      if (error) throw error;
      setIssues(data || []);
    } catch (error: any) {
      console.error("Error fetching issues:", error);
      toast.error("Gagal memuat data issue");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.issue.trim()) {
      toast.error("Issue wajib diisi");
      return;
    }

    try {
      if (editingIssue) {
        const { error } = await supabase
          .from("bank_issue")
          .update({
            issue: formData.issue,
            solusi: formData.solusi || null,
            uic: formData.uic,
          })
          .eq("id", editingIssue.id);

        if (error) throw error;
        toast.success("Issue berhasil diperbarui");
      } else {
        // Get next number
        const maxNo = issues.length > 0 ? Math.max(...issues.map(i => i.no || 0)) : 0;
        
        const { error } = await supabase.from("bank_issue").insert([{
          no: maxNo + 1,
          issue: formData.issue,
          solusi: formData.solusi || null,
          uic: formData.uic,
          created_by_email: user?.email,
        }]);

        if (error) throw error;
        toast.success("Issue berhasil ditambahkan");
      }

      setShowDialog(false);
      resetForm();
      fetchIssues();
    } catch (error: any) {
      console.error("Error saving issue:", error);
      toast.error("Gagal menyimpan issue");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus issue ini?")) return;

    try {
      const { error } = await supabase
        .from("bank_issue")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Issue berhasil dihapus");
      fetchIssues();
    } catch (error: any) {
      console.error("Error deleting issue:", error);
      toast.error("Gagal menghapus issue");
    }
  };

  const handleEdit = (issue: BankIssue) => {
    setEditingIssue(issue);
    setFormData({
      issue: issue.issue,
      solusi: issue.solusi || "",
      uic: issue.uic || [],
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingIssue(null);
    setFormData({
      issue: "",
      solusi: "",
      uic: [],
    });
  };

  const handleUicChange = (uic: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, uic: [...prev.uic, uic] }));
    } else {
      setFormData(prev => ({ ...prev, uic: prev.uic.filter(u => u !== uic) }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bank Issue</h2>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Issue
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">No</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Solusi</TableHead>
              <TableHead>UIC</TableHead>
              <TableHead className="w-24">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : issues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Belum ada data issue
                </TableCell>
              </TableRow>
            ) : (
              issues.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.no}</TableCell>
                  <TableCell className="max-w-xs">{item.issue}</TableCell>
                  <TableCell className="max-w-xs">{item.solusi || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(item.uic || []).map((u, idx) => (
                        <span key={idx} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">
                          {u}
                        </span>
                      ))}
                    </div>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIssue ? "Edit Issue" : "Tambah Issue"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="issue">Issue *</Label>
              <Textarea
                id="issue"
                value={formData.issue}
                onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                placeholder="Masukkan issue/permasalahan"
                required
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="solusi">Solusi</Label>
              <Textarea
                id="solusi"
                value={formData.solusi}
                onChange={(e) => setFormData({ ...formData, solusi: e.target.value })}
                placeholder="Masukkan solusi"
                rows={3}
              />
            </div>
            <div>
              <Label>UIC (Unit In Charge)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
                {UIC_OPTIONS.map((uic) => (
                  <div key={uic} className="flex items-center space-x-2">
                    <Checkbox
                      id={uic}
                      checked={formData.uic.includes(uic)}
                      onCheckedChange={(checked) => handleUicChange(uic, checked as boolean)}
                    />
                    <label
                      htmlFor={uic}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {uic}
                    </label>
                  </div>
                ))}
              </div>
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
              <Button type="submit">
                {editingIssue ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
