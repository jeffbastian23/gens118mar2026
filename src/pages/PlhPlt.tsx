import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubMenuAccess } from "@/hooks/useSubMenuAccess";
import { Button } from "@/components/ui/button";
import { Home, LogOut, Settings, Mic, FileText, Archive, CalendarIcon, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import { supabase } from "@/integrations/supabase/client";
import PlhKepalaCard from "@/components/PlhKepalaCard";
import PlhKepalaDialog from "@/components/PlhKepalaDialog";
import PlhKepalaTable from "@/components/PlhKepalaTable";
import DataPokokTable from "@/components/DataPokokTable";
import PlhPltDashboard from "@/components/PlhPltDashboard";
import NotificationBell from "@/components/NotificationBell";
import AISearchBar from "@/components/AISearchBar";
import FloatingVoiceAssistant from "@/components/FloatingVoiceAssistant";
import ExportDialog from "@/components/ExportDialog";
import FeedbackDialog from "@/components/FeedbackDialog";
import AssignUpkDialog from "@/components/AssignUpkDialog";
import { generateNDPlh, generateNDPlt, generatePRINPlh, generatePRINPlt } from "@/utils/plhPltDocumentGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Voicebot from "@/components/Voicebot";
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

interface PlhKepala {
  id: string;
  unit_pemohon: string;
  unit_penerbit: string;
  dasar_penugasan: string;
  nomor_naskah_dinas: string;
  tanggal: string;
  perihal: string;
  employee_id: string;
  employee_ids?: string[];
  tanggal_plh_mulai?: string;
  tanggal_plh_selesai?: string;
  pejabat_unit_pemohon_id?: string;
  pejabat_unit_penerbit_id?: string;
  document_path?: string;
  agenda_number?: number;
  selesai_at?: string;
  selesai_by?: string;
  jenis_plh_plt?: 'PLH' | 'PLT';
}

export default function PlhPlt() {
  const { user, fullName, role, loading: authLoading, signOut } = useAuth();
  const { hasSubMenuAccess } = useSubMenuAccess("plh-plt");
  const navigate = useNavigate();
  const isAdmin = role === "admin" || role === "super";
  const canEdit = role !== "overview";
  const [employees, setEmployees] = useState<any[]>([]);
  const [plhKepalaList, setPlhKepalaList] = useState<PlhKepala[]>([]);
  const [timUpkList, setTimUpkList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plhKepalaDialogOpen, setPlhKepalaDialogOpen] = useState(false);
  const [selectedPlhKepala, setSelectedPlhKepala] = useState<PlhKepala | null>(null);
  const [deletePlhId, setDeletePlhId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("entry");
  const [voicebotOpen, setVoicebotOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedPlhKepalaId, setSelectedPlhKepalaId] = useState<string | null>(null);
  const [assignUpkDialogOpen, setAssignUpkDialogOpen] = useState(false);
  
  // Status tab filters
  const [filterPerihal, setFilterPerihal] = useState("");
  const [filterUnitPemohon, setFilterUnitPemohon] = useState("");
  const [filterUnitPenerbit, setFilterUnitPenerbit] = useState("");
  const [filterPegawai, setFilterPegawai] = useState("");
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("nm_pegawai", { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchTimUpk = async () => {
    try {
      const { data, error } = await supabase
        .from("tim_upk")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setTimUpkList(data || []);
    } catch (error: any) {
      console.error("Error fetching Tim UPK:", error);
    }
  };

  const fetchPlhKepala = async () => {
    try {
      const { data, error } = await supabase
        .from("plh_kepala")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlhKepalaList((data || []) as PlhKepala[]);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data PLH Kepala");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchTimUpk();
    fetchPlhKepala();
  }, []);

  const handleDeletePlhKepala = async () => {
    if (!deletePlhId) return;

    try {
      const { error } = await supabase.from("plh_kepala").delete().eq("id", deletePlhId);
      if (error) throw error;
      
      toast.success("Data PLH Kepala berhasil dihapus!");
      fetchPlhKepala();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus data");
    } finally {
      setDeletePlhId(null);
    }
  };

  const handleEditPlhKepala = (plhKepala: PlhKepala) => {
    setSelectedPlhKepala(plhKepala);
    setPlhKepalaDialogOpen(true);
  };

  const handleAssignToMe = async (plhKepalaId: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.email) {
        toast.error("User tidak ditemukan");
        return;
      }

      const upkMember = timUpkList.find((upk: any) => upk.email === currentUser.email);
      if (!upkMember) {
        toast.error("Anda bukan anggota Tim UPK");
        return;
      }

      const { error } = await supabase
        .from("plh_kepala")
        .update({
          assigned_upk_id: upkMember.id,
          assigned_upk_at: new Date().toISOString(),
          assigned_upk_manually: true,
        })
        .eq("id", plhKepalaId);

      if (error) throw error;

      toast.success(`Berhasil assign ke ${upkMember.name}`);
      fetchPlhKepala();
    } catch (error: any) {
      toast.error(error.message || "Gagal assign");
    }
  };

  const handleArchivePlhKepala = async (plhKepalaId: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const email = currentUser?.email || "unknown";

      const { error } = await supabase
        .from("plh_kepala")
        .update({
          selesai_at: new Date().toISOString(),
          selesai_by: email,
        })
        .eq("id", plhKepalaId);

      if (error) throw error;

      toast.success("PLH Kepala berhasil diarsipkan");
      fetchPlhKepala();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengarsipkan");
    }
  };

  const handleUnarchivePlhKepala = async (plhKepalaId: string) => {
    try {
      const { error } = await supabase
        .from("plh_kepala")
        .update({
          selesai_at: null,
          selesai_by: null,
        })
        .eq("id", plhKepalaId);

      if (error) throw error;

      toast.success("PLH Kepala berhasil dibatalkan dari arsip");
      fetchPlhKepala();
    } catch (error: any) {
      toast.error(error.message || "Gagal membatalkan arsip");
    }
  };

  // Filter function for status tab
  const getFilteredPlhKepala = () => {
    return plhKepalaList.filter(plh => {
      // Filter by perihal
      if (filterPerihal && !plh.perihal.toLowerCase().includes(filterPerihal.toLowerCase())) {
        return false;
      }

      // Filter by unit pemohon
      if (filterUnitPemohon && !plh.unit_pemohon.toLowerCase().includes(filterUnitPemohon.toLowerCase())) {
        return false;
      }

      // Filter by unit penerbit
      if (filterUnitPenerbit && !plh.unit_penerbit.toLowerCase().includes(filterUnitPenerbit.toLowerCase())) {
        return false;
      }

      // Filter by pegawai
      if (filterPegawai) {
        const employee = employees.find((emp: any) => emp.id === plh.employee_id);
        const employeeName = employee?.nm_pegawai || '';
        if (!employeeName.toLowerCase().includes(filterPegawai.toLowerCase())) {
          return false;
        }
      }

      // Filter by date range
      if (filterStartDate && plh.tanggal_plh_mulai) {
        const plhDate = new Date(plh.tanggal_plh_mulai);
        if (plhDate < filterStartDate) {
          return false;
        }
      }

      if (filterEndDate && plh.tanggal_plh_mulai) {
        const plhDate = new Date(plh.tanggal_plh_mulai);
        if (plhDate > filterEndDate) {
          return false;
        }
      }

      return true;
    });
  };

  const resetFilters = () => {
    setFilterPerihal("");
    setFilterUnitPemohon("");
    setFilterUnitPenerbit("");
    setFilterPegawai("");
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
  };

  const filteredPlhKepalaForStatus = getFilteredPlhKepala();
  // Count as completed only if all 4 steps are done (konsep_masuk, proses_nd, proses_st, and feedback with no_satu_kemenkeu)
  const completedCount = filteredPlhKepalaForStatus.filter((p: any) => 
    p.konsep_masuk_at && p.proses_nd_at && p.proses_st_at && p.no_satu_kemenkeu && p.tanggal_satu_kemenkeu
  ).length;
  const totalCount = filteredPlhKepalaForStatus.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <img src={logoKemenkeu} alt="Kementerian Keuangan" className="h-14 w-auto drop-shadow-lg" />
              <img src={logoCustoms} alt="Customs" className="h-12 w-auto drop-shadow-lg" />
              <div>
                <h1 className="text-2xl font-bold">PLH/PLT Kepala</h1>
                <p className="text-sm text-blue-100">Kanwil DJBC Jawa Timur I</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{fullName}</p>
                <p className="text-xs text-blue-100">{role === "admin" ? "Administrator" : role === "overview" ? "Overview" : "Pengguna"}</p>
              </div>
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/admin")}
                  className="text-white hover:bg-white/20 gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Panel Admin
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setVoicebotOpen(true)}
                className="text-white hover:bg-white/20 gap-2"
              >
                <Mic className="h-4 w-4" />
                Buka Voicebot
              </Button>
              <NotificationBell />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/")}
                className="text-white hover:bg-white/20 gap-2"
              >
                <Home className="h-5 w-5" />
                Beranda
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={signOut}
                className="text-white hover:bg-white/20"
                title="Keluar"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* AI Search Bar */}
          <div className="mt-4">
            <AISearchBar placeholder="Cari dengan AI di seluruh database..." />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full`} style={{ gridTemplateColumns: `repeat(${[
            hasSubMenuAccess("plh-plt:dashboard"),
            hasSubMenuAccess("plh-plt:form-permohonan"),
            hasSubMenuAccess("plh-plt:status")
          ].filter(Boolean).length || 1}, 1fr)` }}>
            {hasSubMenuAccess("plh-plt:dashboard") && <TabsTrigger value="data-pokok">Dashboard</TabsTrigger>}
            {hasSubMenuAccess("plh-plt:form-permohonan") && <TabsTrigger value="entry">Form Permohonan</TabsTrigger>}
            {hasSubMenuAccess("plh-plt:status") && <TabsTrigger value="status">Status</TabsTrigger>}
          </TabsList>

          {hasSubMenuAccess("plh-plt:form-permohonan") && (
          <TabsContent value="entry">
            <Card className="p-6 mb-4">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Form Permohonan</h2>
                  <p className="text-muted-foreground mb-6">
                    Buat dan kelola data PLH Kepala
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {canEdit && (
                    <Button
                      onClick={() => {
                        setSelectedPlhKepala(null);
                        setPlhKepalaDialogOpen(true);
                      }}
                      className="h-20 sm:h-24 flex flex-col gap-2 text-sm sm:text-base"
                    >
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span>Buat Penugasan Baru</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setExportDialogOpen(true)}
                    className="h-20 sm:h-24 flex flex-col gap-2 text-sm sm:text-base"
                  >
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span>Export Excel</span>
                  </Button>

                  {isAdmin && (
                    <>
                      <label className="cursor-pointer">
                        <Button
                          variant="outline"
                          className="h-20 sm:h-24 flex flex-col gap-2 text-sm sm:text-base w-full"
                          asChild
                        >
                          <span>
                            <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
                            <span>Import Excel</span>
                          </span>
                        </Button>
                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          import("xlsx").then(async (XLSX) => {
                            const reader = new FileReader();
                            reader.onload = async (evt) => {
                              const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                              const wb = XLSX.read(data, { type: "array" });
                              const ws = wb.Sheets[wb.SheetNames[0]];
                              const jsonData = XLSX.utils.sheet_to_json(ws);
                              let imported = 0;
                              for (const row of jsonData as any[]) {
                                const { error } = await supabase.from("plh_kepala").insert({
                                  unit_pemohon: row["Unit Pemohon"] || "",
                                  unit_penerbit: row["Unit Penerbit"] || "",
                                  nomor_naskah_dinas: row["Nomor Naskah"] || "",
                                  tanggal: row["Tanggal"] || new Date().toISOString(),
                                  perihal: row["Perihal"] || "",
                                  dasar_penugasan: row["Dasar Penugasan"] || null,
                                  jenis_plh_plt: row["Jenis"] === "PLT" ? "PLT" : "PLH",
                                });
                                if (!error) imported++;
                              }
                              toast.success(`${imported} data berhasil diimport`);
                              fetchPlhKepala();
                            };
                            reader.readAsArrayBuffer(file);
                          });
                          e.target.value = "";
                        }} />
                      </label>

                      <Button
                        variant="destructive"
                        className="h-20 sm:h-24 flex flex-col gap-2 text-sm sm:text-base"
                        onClick={async () => {
                          if (!confirm("Yakin ingin menghapus SEMUA data PLH/PLT? Tindakan ini tidak dapat dibatalkan.")) return;
                          const { error } = await supabase.from("plh_kepala").delete().neq("id", "");
                          if (error) {
                            toast.error("Gagal menghapus semua data");
                            return;
                          }
                          toast.success("Semua data berhasil dihapus");
                          fetchPlhKepala();
                        }}
                      >
                        <Trash2 className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span>Hapus Semua</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Data PLH/PLT untuk Admin dengan Table atau Meja & Arsip terpisah untuk User */}
            {isAdmin ? (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Data PLH/PLT</h3>
                <PlhKepalaTable
                  plhKepalaList={plhKepalaList}
                  employees={employees}
                  timUpkList={timUpkList}
                  isAdmin={isAdmin}
                  canEdit={canEdit}
                  onEdit={handleEditPlhKepala}
                  onDelete={(id) => setDeletePlhId(id)}
                  onAssignUpk={(id) => {
                    setSelectedPlhKepalaId(id);
                    setAssignUpkDialogOpen(true);
                  }}
                  onFeedback={(id) => {
                    setSelectedPlhKepalaId(id);
                    setFeedbackDialogOpen(true);
                  }}
                  onGenerateND={async (plhKepala) => {
                    try {
                      toast.info("Generating Nota Dinas...");
                      if (plhKepala.jenis_plh_plt === 'PLT') {
                        await generateNDPlt(plhKepala);
                      } else {
                        await generateNDPlh(plhKepala);
                      }
                      toast.success("Nota Dinas berhasil di-generate!");
                      fetchPlhKepala();
                    } catch (error: any) {
                      toast.error(error.message || "Gagal generate Nota Dinas");
                    }
                  }}
                  onGeneratePRIN={async (plhKepala) => {
                    try {
                      toast.info("Generating Surat Perintah...");
                      if (plhKepala.jenis_plh_plt === 'PLT') {
                        await generatePRINPlt(plhKepala);
                      } else {
                        await generatePRINPlh(plhKepala);
                      }
                      toast.success("Surat Perintah berhasil di-generate!");
                      fetchPlhKepala();
                    } catch (error: any) {
                      toast.error(error.message || "Gagal generate Surat Perintah");
                    }
                  }}
                />
              </Card>
            ) : (
              <>
                {/* Meja Section */}
                <Card className="p-6 mb-4">
                  <h3 className="text-xl font-bold mb-4">Meja</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plhKepalaList
                      .filter(p => !p.selesai_at)
                      .map((plhKepala) => {
                        const employeeId = plhKepala.employee_id || plhKepala.employee_ids?.[0];
                        const employee = employees.find((emp: any) => emp.id === employeeId);
                        const assignedUpk = timUpkList.find((upk: any) => upk.id === (plhKepala as any).assigned_upk_id);
                        
                        return (
                          <PlhKepalaCard
                            key={plhKepala.id}
                            plhKepala={plhKepala}
                            employeeName={employee?.nm_pegawai || 'Unknown'}
                            onEdit={() => handleEditPlhKepala(plhKepala)}
                            onDelete={() => setDeletePlhId(plhKepala.id)}
                            onAssignToMe={() => handleAssignToMe(plhKepala.id)}
                            onArchive={() => handleArchivePlhKepala(plhKepala.id)}
                            isAdmin={isAdmin}
                            canEdit={canEdit}
                            assignedUpk={assignedUpk}
                            showGeneratorButtons={true}
                            hideTracking={true}
                          />
                        );
                      })}
                  </div>
                </Card>

                {/* Arsip Section */}
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">Arsip</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plhKepalaList
                      .filter(p => p.selesai_at)
                      .map((plhKepala) => {
                        const employeeId = plhKepala.employee_id || plhKepala.employee_ids?.[0];
                        const employee = employees.find((emp: any) => emp.id === employeeId);
                        const assignedUpk = timUpkList.find((upk: any) => upk.id === (plhKepala as any).assigned_upk_id);
                        
                        return (
                          <PlhKepalaCard
                            key={plhKepala.id}
                            plhKepala={plhKepala}
                            employeeName={employee?.nm_pegawai || 'Unknown'}
                            onEdit={() => handleEditPlhKepala(plhKepala)}
                            onDelete={() => setDeletePlhId(plhKepala.id)}
                            onAssignToMe={() => handleAssignToMe(plhKepala.id)}
                            onUnarchive={() => handleUnarchivePlhKepala(plhKepala.id)}
                            isArchived={true}
                            isAdmin={isAdmin}
                            canEdit={canEdit}
                            assignedUpk={assignedUpk}
                            showGeneratorButtons={true}
                            hideTracking={true}
                          />
                        );
                      })}
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
          )}

          {hasSubMenuAccess("plh-plt:status") && (
          <TabsContent value="status">
            <Card className="p-6 mb-4">
              <h3 className="text-lg font-semibold mb-4">Filter Penugasan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Perihal</Label>
                  <Input
                    placeholder="Filter perihal..."
                    value={filterPerihal}
                    onChange={(e) => setFilterPerihal(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Unit Pemohon</Label>
                  <Input
                    placeholder="Filter unit pemohon..."
                    value={filterUnitPemohon}
                    onChange={(e) => setFilterUnitPemohon(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Unit Penerbit</Label>
                  <Input
                    placeholder="Filter unit penerbit..."
                    value={filterUnitPenerbit}
                    onChange={(e) => setFilterUnitPenerbit(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pegawai</Label>
                  <Input
                    placeholder="Filter pegawai..."
                    value={filterPegawai}
                    onChange={(e) => setFilterPegawai(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tanggal Mulai</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !filterStartDate && "text-muted-foreground"
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterStartDate ? format(filterStartDate, "dd/MM/yyyy") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filterStartDate}
                        onSelect={setFilterStartDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tanggal Akhir</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !filterEndDate && "text-muted-foreground"
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterEndDate ? format(filterEndDate, "dd/MM/yyyy") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filterEndDate}
                        onSelect={setFilterEndDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={resetFilters}
                className="w-full md:w-auto"
              >
                Reset Filter
              </Button>
            </Card>

            {/* Progress Bar */}
            <Card className="p-6 mb-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-semibold">Progress Penugasan</h3>
                  <span className="text-sm font-medium">
                    {completedCount} / {totalCount} Selesai
                  </span>
                </div>
                
                <div className="relative w-full h-6 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
                    {completionPercentage}%
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Sudah Selesai ({completedCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Belum Selesai ({totalCount - completedCount})</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPlhKepalaForStatus.map((plhKepala) => {
                const employee = employees.find((emp: any) => emp.id === plhKepala.employee_id);
                const assignedUpk = timUpkList.find((upk: any) => upk.id === (plhKepala as any).assigned_upk_id);
                
                return (
                  <PlhKepalaCard
                    key={plhKepala.id}
                    plhKepala={plhKepala}
                    employeeName={employee?.nm_pegawai || 'Unknown'}
                    onEdit={() => handleEditPlhKepala(plhKepala)}
                    onDelete={isAdmin ? () => setDeletePlhId(plhKepala.id) : undefined}
                    onAssignToMe={() => handleAssignToMe(plhKepala.id)}
                    isAdmin={isAdmin}
                    assignedUpk={assignedUpk}
                    showStatusLayout={true}
                  />
                );
              })}
            </div>
          </TabsContent>
          )}

          {hasSubMenuAccess("plh-plt:dashboard") && (
          <TabsContent value="data-pokok">
            <PlhPltDashboard />
          </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Export Dialog */}
      <ExportDialog 
        open={exportDialogOpen} 
        onOpenChange={setExportDialogOpen}
      />

      {/* Dialogs */}
      <PlhKepalaDialog
        open={plhKepalaDialogOpen}
        onOpenChange={setPlhKepalaDialogOpen}
        plhKepala={selectedPlhKepala}
        onSuccess={() => {
          fetchPlhKepala();
          setSelectedPlhKepala(null);
        }}
      />

      <AlertDialog open={!!deletePlhId} onOpenChange={() => setDeletePlhId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data PLH Kepala?</AlertDialogTitle>
            <AlertDialogDescription>
              Data yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlhKepala}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Voicebot Dialog */}
      <Dialog open={voicebotOpen} onOpenChange={setVoicebotOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Voicebot Asisten</DialogTitle>
          </DialogHeader>
          <Voicebot />
        </DialogContent>
      </Dialog>

      {/* Floating Voice Assistant */}
      <FloatingVoiceAssistant />
    </div>
  );
}
