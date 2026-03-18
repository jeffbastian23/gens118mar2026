import { useState, useEffect } from "react";
import { useAuth, isAdminRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, User, Loader2, UserPlus, Trash2, Pencil, RefreshCw, Users, FileText, BookOpen, Home, Download, AlertCircle, CheckCircle2, Newspaper, ShieldCheck, Sparkles, BarChart3, Search, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { isAdminRole as isAdminRoleCheck } from "@/hooks/useAuth";
import { ESELON_III_OPTIONS, ESELON_IV_OPTIONS, ESELON_III_TO_IV_MAP } from "@/components/SatuanKerjaTab";
import NewsManagement from "@/components/NewsManagement";
import AccessManagement from "@/components/AccessManagement";
import UsageSummary from "@/components/UsageSummary";
import { downloadNDTemplateSmallGroup, downloadNDTemplateLargeGroup } from "@/utils/createNDTemplate";
import { downloadSTTemplateSmallGroup, downloadSTTemplateLargeGroup } from "@/utils/createSTTemplate";
import TemplateDownloads from "@/components/TemplateDownloads";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  eselon_iii: string | null;
  eselon_iv: string | null;
  created_at: string;
}

interface UserWithRole extends Profile {
  role: "admin" | "user" | "overview" | "super" | null;
}

type ActiveTab = "users" | "access" | "generate-template" | "guide" | "news" | "usage";

type RoleType = "admin" | "user" | "overview" | "super";

export default function AdminPanel() {
  const { role, loading: authLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("users");
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserRole, setNewUserRole] = useState<RoleType>("user");
  const [newUserEselonIII, setNewUserEselonIII] = useState("");
  const [newUserEselonIV, setNewUserEselonIV] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [searchFilter, setSearchFilter] = useState("");
  const [eselonIIIFilter, setEselonIIIFilter] = useState("");
  const [eselonIVFilter, setEselonIVFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const emailSchema = z.string().email().refine(
    (email) => email.endsWith("@kemenkeu.go.id"),
    { message: "Email harus menggunakan domain @kemenkeu.go.id" }
  );
  const passwordSchema = z.string().min(8, { message: "Password minimal 8 karakter" });

  useEffect(() => {
    console.log('[AdminPanel] Auth state:', { role, authLoading, user: user?.email });
    
    // Beri waktu 500ms untuk role loading sebelum redirect
    const timer = setTimeout(() => {
      if (!authLoading && !isAdminRole(role)) {
        console.log('[AdminPanel] Access denied, redirecting...', { role });
        toast.error("Anda tidak memiliki akses ke halaman ini");
        window.location.href = "/";
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [role, authLoading, user]);

  useEffect(() => {
    if (isAdminRole(role)) {
      fetchUsers();
    }
  }, [role]);

  // Real-time sync with database
  useEffect(() => {
    if (!isAdminRole(role)) return;

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          console.log('[AdminPanel] Profiles changed, refreshing...');
          fetchUsers();
        }
      )
      .subscribe();

    const rolesChannel = supabase
      .channel('user-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          console.log('[AdminPanel] User roles changed, refreshing...');
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, [role]);

  const fetchUsers = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch in parallel and select only needed columns for speed
      const [profilesRes, rolesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id,user_id,email,full_name,eselon_iii,eselon_iv,created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('user_roles')
          .select('user_id,role')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const profiles = profilesRes.data ?? [];
      const roles = rolesRes.data ?? [];

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = profiles.map((profile: any) => {
        const userRole = roles.find((r: any) => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role ?? null,
        };
      });

      // Sort by role hierarchy: admin, overview, super, user, then null
      const roleOrder: Record<string, number> = { admin: 1, overview: 2, super: 3, user: 4 };
      usersWithRoles.sort((a, b) => {
        const orderA = a.role ? (roleOrder[a.role] ?? 5) : 5;
        const orderB = b.role ? (roleOrder[b.role] ?? 5) : 5;
        return orderA - orderB;
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat data pengguna');
    } finally {
      // Use the flag, not the state value, to avoid stale checks
      if (isManualRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session tidak ditemukan. Silakan login kembali.');
        await fetchUsers(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('sync-users', {
        body: {},
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        console.error('Sync users error:', error);
        toast.error('Sinkronisasi gagal: ' + (error.message || 'Unknown error'));
        await fetchUsers(false);
        return;
      }

      const anyData: any = data as any;
      if (anyData?.users) {
        setUsers(anyData.users);
      } else {
        await fetchUsers(false);
      }

      const deletedProfiles = anyData?.deleted?.profiles ?? anyData?.deletedProfiles ?? 0;
      const deletedRoles = anyData?.deleted?.roles ?? anyData?.deletedRoles ?? 0;
      toast.success(`Data berhasil diperbarui${(deletedProfiles || deletedRoles) ? ` (dibersihkan: ${deletedProfiles} profil, ${deletedRoles} role)` : ''}`);
    } catch (err: any) {
      console.error('Sync error:', err);
      toast.error('Gagal menyinkronkan data');
      await fetchUsers(false);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: RoleType) => {
    try {
      // First, check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      toast.success("Role berhasil diperbarui");
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error("Gagal memperbarui role");
    }
  };

  const handleAddUser = async () => {
    setAddLoading(true);
    try {
      // Validate email
      const emailValidation = emailSchema.safeParse(newUserEmail);
      if (!emailValidation.success) {
        toast.error(emailValidation.error.errors[0].message);
        setAddLoading(false);
        return;
      }

      // Validate password
      const passwordValidation = passwordSchema.safeParse(newUserPassword);
      if (!passwordValidation.success) {
        toast.error(passwordValidation.error.errors[0].message);
        setAddLoading(false);
        return;
      }

      // Validate full name
      if (!newUserFullName.trim()) {
        toast.error("Nama lengkap harus diisi");
        setAddLoading(false);
        return;
      }

      // Check if user already exists in profiles table
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id, email")
        .eq("email", newUserEmail)
        .maybeSingle();

      if (existingProfile) {
        toast.error("Email sudah terdaftar dalam sistem");
        setAddLoading(false);
        return;
      }

      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session tidak ditemukan. Silakan login kembali.");
        setAddLoading(false);
        return;
      }

      // Call edge function to create user via admin API (no email rate limit)
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          full_name: newUserFullName,
          role: newUserRole,
          eselon_iii: newUserEselonIII && newUserEselonIII !== "_none_" ? newUserEselonIII : null,
          eselon_iv: newUserEselonIV && newUserEselonIV !== "_none_" ? newUserEselonIV : null,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      const result = data as any;
      if (result?.error) {
        toast.error("Gagal menambahkan user: " + result.error);
        setAddLoading(false);
        return;
      }

      toast.success(`User ${newUserFullName} berhasil ditambahkan dengan role ${newUserRole}. User langsung aktif tanpa perlu verifikasi email.`, {
        duration: 5000
      });
      setShowAddDialog(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserFullName("");
      setNewUserRole("user");
      setNewUserEselonIII("");
      setNewUserEselonIV("");
      
      // Force immediate refresh
      await fetchUsers();
    } catch (error: any) {
      console.error("Error adding user:", error);
      if (error.message?.includes("already been registered") || error.message?.includes("already registered")) {
        toast.error("Email sudah terdaftar");
      } else {
        toast.error("Gagal menambahkan user: " + (error.message || "Unknown error"));
      }
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Session tidak ditemukan. Silakan login kembali.");
        return;
      }

      // Call edge function to delete user (requires service_role key)
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { userId: selectedUser.user_id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      // Handle errors without throwing to avoid runtime overlay
      if (error) {
        const status = error?.context?.response?.status;
        const message = String(error?.message ?? '');
        if (message.includes('User not found') || status === 404) {
          toast.info("User sudah tidak ada atau telah dihapus sebelumnya.");
          setShowDeleteDialog(false);
          setSelectedUser(null);
          await fetchUsers();
          return;
        }
        toast.error("Gagal menghapus user: " + message);
        return;
      }

      if ((data as any)?.error) {
        toast.error("Gagal menghapus user: " + (data as any).error);
        return;
      }

      toast.success(`User ${selectedUser.full_name || selectedUser.email} berhasil dihapus`);
      setShowDeleteDialog(false);
      setSelectedUser(null);
      
      // Force immediate refresh
      await fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      const status = error?.status ?? error?.context?.response?.status;
      const message = error?.message ?? '';

      // Gracefully handle already-deleted/nonexistent users
      if (message.includes('User not found') || status === 404) {
        toast.info("User sudah tidak ada atau telah dihapus sebelumnya.");
        setShowDeleteDialog(false);
        setSelectedUser(null);
        fetchUsers();
        return;
      }

      toast.error("Gagal menghapus user: " + message);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setEditLoading(true);
    try {
      // Validate full name
      if (!newUserFullName.trim()) {
        toast.error("Nama lengkap harus diisi");
        setEditLoading(false);
        return;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          full_name: newUserFullName,
          eselon_iii: newUserEselonIII && newUserEselonIII !== "_none_" ? newUserEselonIII : null,
          eselon_iv: newUserEselonIV && newUserEselonIV !== "_none_" ? newUserEselonIV : null,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", selectedUser.user_id);

      if (profileError) throw profileError;

      // Update role if changed
      if (newUserRole !== selectedUser.role) {
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", selectedUser.user_id)
          .maybeSingle();

        if (existingRole) {
          const { error: roleError } = await supabase
            .from("user_roles")
            .update({ role: newUserRole })
            .eq("user_id", selectedUser.user_id);

          if (roleError) throw roleError;
        } else {
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({ user_id: selectedUser.user_id, role: newUserRole });

          if (roleError) throw roleError;
        }
      }

      toast.success("User berhasil diperbarui");
      setShowEditDialog(false);
      setSelectedUser(null);
      setNewUserFullName("");
      setNewUserRole("user");
      setNewUserEselonIII("");
      setNewUserEselonIV("");
      
      // Force immediate refresh
      await fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error("Gagal memperbarui user: " + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Template generation handlers
  const handleDownloadNDTemplateSmall = async () => {
    try {
      toast.info("Generating ND template (≤5 pegawai)...");
      await downloadNDTemplateSmallGroup();
      toast.success("Template ND (≤5 pegawai) berhasil di-generate! Silakan copy file ke public/templates/");
    } catch (error) {
      console.error("Error generating ND template:", error);
      toast.error("Gagal generate template ND");
    }
  };

  const handleDownloadNDTemplateLarge = async () => {
    try {
      toast.info("Generating ND template (>5 pegawai)...");
      await downloadNDTemplateLargeGroup();
      toast.success("Template ND (>5 pegawai) berhasil di-generate! Silakan copy file ke public/templates/");
    } catch (error) {
      console.error("Error generating ND template:", error);
      toast.error("Gagal generate template ND");
    }
  };

  const handleDownloadSTTemplateSmall = async () => {
    try {
      toast.info("Generating ST template (≤5 pegawai)...");
      await downloadSTTemplateSmallGroup();
      toast.success("Template ST (≤5 pegawai) berhasil di-generate! Silakan copy file ke public/templates/");
    } catch (error) {
      console.error("Error generating ST template:", error);
      toast.error("Gagal generate template ST");
    }
  };

  const handleDownloadSTTemplateLarge = async () => {
    try {
      toast.info("Generating ST template (>5 pegawai)...");
      await downloadSTTemplateLargeGroup();
      toast.success("Template ST (>5 pegawai) berhasil di-generate! Silakan copy file ke public/templates/");
    } catch (error) {
      console.error("Error generating ST template:", error);
      toast.error("Gagal generate template ST");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdminRole(role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-background border-r border-border shadow-sm flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="font-bold text-lg">Admin Panel</h2>
          </div>
          
          <nav className="space-y-2">
            <Button
              variant="ghost"
              onClick={() => window.location.href = "/"}
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Home className="w-4 h-4 mr-3" />
              Beranda
            </Button>
            
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              onClick={() => setActiveTab("users")}
              className="w-full justify-start"
            >
              <Users className="w-4 h-4 mr-3" />
              Manajemen User
            </Button>
            
            {/* Hide Manajemen Akses for super role - only show for admin */}
            {role === "admin" && (
              <Button
                variant={activeTab === "access" ? "default" : "ghost"}
                onClick={() => setActiveTab("access")}
                className="w-full justify-start"
              >
                <ShieldCheck className="w-4 h-4 mr-3" />
                Manajemen Akses
              </Button>
            )}
            
            <Button
              variant={activeTab === "generate-template" ? "default" : "ghost"}
              onClick={() => setActiveTab("generate-template")}
              className="w-full justify-start"
            >
              <FileText className="w-4 h-4 mr-3" />
              Generate Template
            </Button>
            
            <Button
              variant={activeTab === "news" ? "default" : "ghost"}
              onClick={() => setActiveTab("news")}
              className="w-full justify-start"
            >
              <Newspaper className="w-4 h-4 mr-3" />
              Kelola Berita
            </Button>
            
            <Button
              variant={activeTab === "guide" ? "default" : "ghost"}
              onClick={() => setActiveTab("guide")}
              className="w-full justify-start"
            >
              <BookOpen className="w-4 h-4 mr-3" />
              Guide
            </Button>
            
            <Button
              variant={activeTab === "usage" ? "default" : "ghost"}
              onClick={() => setActiveTab("usage")}
              className="w-full justify-start"
            >
              <BarChart3 className="w-4 h-4 mr-3" />
              Usage Summary
            </Button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-6">
          {activeTab === "users" && (
            <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    Manajemen User
                  </CardTitle>
                  <CardDescription>
                    Kelola role dan akses pengguna aplikasi
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {isAdminRoleCheck(role) && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          const exportData = users.map((u, idx) => ({
                            No: idx + 1,
                            Nama: u.full_name || "",
                            Email: u.email,
                            "Eselon III": u.eselon_iii || "",
                            "Eselon IV": u.eselon_iv || "",
                            Role: u.role || "",
                            Terdaftar: new Date(u.created_at).toLocaleDateString("id-ID"),
                          }));
                          const ws = XLSX.utils.json_to_sheet(exportData);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, "Users");
                          XLSX.writeFile(wb, "manajemen_user.xlsx");
                          toast.success("Data berhasil diekspor");
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const reader = new FileReader();
                              reader.onload = async (evt) => {
                                const bstr = evt.target?.result;
                                const wb = XLSX.read(bstr, { type: "binary" });
                                const wsname = wb.SheetNames[0];
                                const ws = wb.Sheets[wsname];
                                const jsonData = XLSX.utils.sheet_to_json(ws);
                                toast.info(`Ditemukan ${jsonData.length} baris data. Silakan gunakan fitur 'Tambah User' untuk menambahkan user baru.`);
                              };
                              reader.readAsBinaryString(file);
                            } catch (error: any) {
                              console.error("Error importing data:", error);
                              toast.error("Gagal membaca file Excel");
                            }
                            e.target.value = "";
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Import
                        </Button>
                      </div>
                    </>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Tambah User
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter Section */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama atau email..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={eselonIIIFilter} onValueChange={setEselonIIIFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter Eselon III" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all_">Semua Eselon III</SelectItem>
                    {ESELON_III_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={eselonIVFilter} onValueChange={setEselonIVFilter}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Filter Eselon IV" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all_">Semua Eselon IV</SelectItem>
                    {ESELON_IV_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all_">Semua Role</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super">Super</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="overview">Overview</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada pengguna terdaftar
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">No</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Eselon III</TableHead>
                      <TableHead>Eselon IV</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Terdaftar</TableHead>
                      <TableHead className="text-center">Ubah Role</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter((user) => {
                        // Search filter by name or email
                        const searchLower = searchFilter.toLowerCase();
                        const matchesSearch = !searchFilter || 
                          (user.full_name?.toLowerCase().includes(searchLower)) ||
                          user.email.toLowerCase().includes(searchLower);
                        
                        // Eselon III filter
                        const matchesEselonIII = !eselonIIIFilter || eselonIIIFilter === "_all_" || 
                          user.eselon_iii === eselonIIIFilter;
                        
                        // Eselon IV filter
                        const matchesEselonIV = !eselonIVFilter || eselonIVFilter === "_all_" || 
                          user.eselon_iv === eselonIVFilter;
                        
                        // Role filter
                        const matchesRole = !roleFilter || roleFilter === "_all_" || 
                          user.role === roleFilter;
                        
                        return matchesSearch && matchesEselonIII && matchesEselonIV && matchesRole;
                      })
                      .map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          {user.full_name || "-"}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {user.eselon_iii || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {user.eselon_iv || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.role ? (
                            <Badge 
                              className={
                                user.role === "admin" 
                                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                  : user.role === "overview" 
                                    ? "bg-purple-600 hover:bg-purple-700 text-white" 
                                    : user.role === "super" 
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                                      : "bg-slate-500 hover:bg-slate-600 text-white"
                              }
                            >
                              {user.role === "admin" ? (
                                <><Shield className="w-3 h-3 mr-1" />Admin</>
                              ) : user.role === "super" ? (
                                <><Sparkles className="w-3 h-3 mr-1" />Super</>
                              ) : user.role === "overview" ? (
                                <><BarChart3 className="w-3 h-3 mr-1" />Overview</>
                              ) : (
                                <><User className="w-3 h-3 mr-1" />User</>
                              )}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Belum ada role</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Select
                            value={user.role || "none"}
                            onValueChange={(value) => {
                              if (value !== "none") {
                                handleRoleChange(user.user_id, value as RoleType);
                              }
                            }}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" disabled>
                                Pilih Role
                              </SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super">Super</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="overview">Overview</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                            onClick={() => {
                                setSelectedUser(user);
                                setNewUserFullName(user.full_name || "");
                                setNewUserRole(user.role || "user");
                                setNewUserEselonIII(user.eselon_iii || "");
                                setNewUserEselonIV(user.eselon_iv || "");
                                setShowEditDialog(true);
                              }}
                              className="hover:bg-primary/10"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteDialog(true);
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          )}

          {activeTab === "access" && (
            <AccessManagement />
          )}

          {activeTab === "generate-template" && (
            <div className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    Setelah download template, Anda perlu edit manual di Word untuk menambahkan conditional sections dan fix table loops.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("guide")}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Panduan Setup
                  </Button>
                </AlertDescription>
              </Alert>
              <TemplateDownloads />
              
              <Card>
                <CardHeader>
                  <CardTitle>Generate Template Nota Dinas</CardTitle>
                  <CardDescription>
                    Utility untuk membuat template Word Nota Dinas dengan placeholder docxtemplater
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Template ≤5 Pegawai</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate template Word untuk Nota Dinas dengan jumlah pegawai kurang dari atau sama dengan 5 orang (format daftar).
                    </p>
                    <Button onClick={handleDownloadNDTemplateSmall}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Template ND (≤5)
                    </Button>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-2">Template &gt;5 Pegawai</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate template Word untuk Nota Dinas dengan jumlah pegawai lebih dari 5 orang (format tabel dengan loop dinamis).
                    </p>
                    <Button onClick={handleDownloadNDTemplateLarge}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Template ND (&gt;5)
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Generate Template Surat Tugas</CardTitle>
                  <CardDescription>
                    Utility untuk membuat template Word Surat Tugas dengan placeholder docxtemplater
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Template ≤5 Pegawai</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate template Word untuk Surat Tugas dengan jumlah pegawai kurang dari atau sama dengan 5 orang (format daftar).
                    </p>
                    <Button onClick={handleDownloadSTTemplateSmall}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Template ST (≤5)
                    </Button>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-2">Template &gt;5 Pegawai</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate template Word untuk Surat Tugas dengan jumlah pegawai lebih dari 5 orang (format tabel).
                    </p>
                    <Button onClick={handleDownloadSTTemplateLarge}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Template ST (&gt;5)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "news" && (
            <Card>
              <CardHeader>
                <CardTitle>Kelola Berita</CardTitle>
                <CardDescription>
                  Kelola berita yang ditampilkan pada running text di halaman utama
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NewsManagement />
              </CardContent>
            </Card>
          )}

          {activeTab === "guide" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Panduan Setup Template Dokumen</h1>
                  <p className="text-muted-foreground">
                    Panduan lengkap untuk memperbaiki template Word agar compatible dengan sistem generator
                  </p>
                </div>
                <Button onClick={() => setActiveTab("generate-template")} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Generate Template
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Template Word harus diedit secara manual di Microsoft Word atau LibreOffice untuk menambahkan
                  syntax conditional dan loop yang benar. Library programmatic tidak dapat membuat struktur XML
                  yang kompatibel dengan docxtemplater.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Ikhtisar Masalah & Solusi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Masalah yang Ditemukan:</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>
                        <strong>Template ≤5 Pegawai:</strong> Baris kosong muncul untuk slot pegawai yang tidak digunakan
                      </li>
                      <li>
                        <strong>Template &gt;5 Pegawai:</strong> Semua pegawai masuk ke satu baris tabel, tidak membuat baris terpisah per pegawai
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Solusi:</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>
                        <strong>Template ≤5 Pegawai:</strong> Gunakan conditional sections untuk menyembunyikan slot kosong
                      </li>
                      <li>
                        <strong>Template &gt;5 Pegawai:</strong> Gunakan row-level loop syntax yang wrap entire table row
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Badge variant="outline" className="mr-2">1</Badge>
                    Template ≤5 Pegawai - Tambahkan Conditional Sections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <strong>Penting:</strong> Pegawai 1 TIDAK perlu conditional karena minimal 1 pegawai selalu ada.
                      Hanya Pegawai 2-5 yang perlu dibungkus dengan conditional sections.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Badge variant="outline" className="mr-2">2</Badge>
                    Template &gt;5 Pegawai - Fix Table Loop Syntax
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Catatan Penting:</strong> Docxtemplater memerlukan loop syntax yang wrap entire table row di level XML.
                      Syntax harus ditulis SEBELUM dan SESUDAH row, bukan di dalam cell.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "usage" && (
            <UsageSummary />
          )}
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>
              Tambahkan user baru dengan email Kemenkeu dan tetapkan role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap *</Label>
              <Input
                id="fullName"
                placeholder="Masukkan nama lengkap"
                value={newUserFullName}
                onChange={(e) => setNewUserFullName(e.target.value)}
                disabled={addLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@kemenkeu.go.id"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                disabled={addLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 8 karakter"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                disabled={addLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eselonIII">Eselon III</Label>
              <Select
                value={newUserEselonIII}
                onValueChange={(value) => {
                  setNewUserEselonIII(value);
                  // Reset Eselon IV when Eselon III changes
                  setNewUserEselonIV("");
                }}
                disabled={addLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Eselon III" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">- Tidak ada -</SelectItem>
                  {ESELON_III_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eselonIV">Eselon IV</Label>
              <Select
                value={newUserEselonIV}
                onValueChange={setNewUserEselonIV}
                disabled={addLoading || !newUserEselonIII || newUserEselonIII === "_none_"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={newUserEselonIII && newUserEselonIII !== "_none_" ? "Pilih Eselon IV" : "Pilih Eselon III terlebih dahulu"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">- Tidak ada -</SelectItem>
                  {(newUserEselonIII && newUserEselonIII !== "_none_" 
                    ? (ESELON_III_TO_IV_MAP[newUserEselonIII] || [])
                    : ESELON_IV_OPTIONS
                  ).map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newUserEselonIII && newUserEselonIII !== "_none_" && (ESELON_III_TO_IV_MAP[newUserEselonIII]?.length === 0) && (
                <p className="text-xs text-muted-foreground">
                  {newUserEselonIII} tidak memiliki unit Eselon IV
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={newUserRole}
                onValueChange={(value) => setNewUserRole(value as RoleType)}
                disabled={addLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super">Super</SelectItem>
                  <SelectItem value="overview">Overview</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
              setNewUserEmail("");
                setNewUserPassword("");
                setNewUserFullName("");
                setNewUserRole("user");
                setNewUserEselonIII("");
                setNewUserEselonIV("");
              }}
              disabled={addLoading}
            >
              Batal
            </Button>
            <Button onClick={handleAddUser} disabled={addLoading}>
              {addLoading ? "Menambahkan..." : "Tambah User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Perbarui informasi user dan role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={selectedUser?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editFullName">Nama Lengkap *</Label>
              <Input
                id="editFullName"
                placeholder="Masukkan nama lengkap"
                value={newUserFullName}
                onChange={(e) => setNewUserFullName(e.target.value)}
                disabled={editLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEselonIII">Eselon III</Label>
              <Select
                value={newUserEselonIII}
                onValueChange={(value) => {
                  setNewUserEselonIII(value);
                  // Reset Eselon IV when Eselon III changes
                  setNewUserEselonIV("");
                }}
                disabled={editLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Eselon III" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">- Tidak ada -</SelectItem>
                  {ESELON_III_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEselonIV">Eselon IV</Label>
              <Select
                value={newUserEselonIV}
                onValueChange={setNewUserEselonIV}
                disabled={editLoading || !newUserEselonIII || newUserEselonIII === "_none_"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={newUserEselonIII && newUserEselonIII !== "_none_" ? "Pilih Eselon IV" : "Pilih Eselon III terlebih dahulu"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">- Tidak ada -</SelectItem>
                  {(newUserEselonIII && newUserEselonIII !== "_none_" 
                    ? (ESELON_III_TO_IV_MAP[newUserEselonIII] || [])
                    : ESELON_IV_OPTIONS
                  ).map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newUserEselonIII && newUserEselonIII !== "_none_" && (ESELON_III_TO_IV_MAP[newUserEselonIII]?.length === 0) && (
                <p className="text-xs text-muted-foreground">
                  {newUserEselonIII} tidak memiliki unit Eselon IV
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role *</Label>
              <Select
                value={newUserRole}
                onValueChange={(value) => setNewUserRole(value as RoleType)}
                disabled={editLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super">Super</SelectItem>
                  <SelectItem value="overview">Overview</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedUser(null);
                setNewUserFullName("");
                setNewUserRole("user");
                setNewUserEselonIII("");
                setNewUserEselonIV("");
              }}
              disabled={editLoading}
            >
              Batal
            </Button>
            <Button onClick={handleEditUser} disabled={editLoading}>
              {editLoading ? "Memperbarui..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus user <strong>{selectedUser?.full_name || selectedUser?.email}</strong>? 
              Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait user ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUser(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
