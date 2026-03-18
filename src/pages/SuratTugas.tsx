import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubMenuAccess } from "@/hooks/useSubMenuAccess";
import { useUserEselonFilter } from "@/hooks/useUserEselonFilter";
import { Button } from "@/components/ui/button";
import { Home, LogOut, Settings, Mic, FileText, Users, ExternalLink, Download, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "@/pages/Dashboard";
import AssignmentCard from "@/components/AssignmentCard";
import AssignmentTable from "@/components/AssignmentTable";
import AssignmentDialog from "@/components/AssignmentDialog";
import AssignmentDetailDialog from "@/components/AssignmentDetailDialog";
import FeedbackDialog from "@/components/FeedbackDialog";
import AssignUpkDialog from "@/components/AssignUpkDialog";
import AssignKeuanganDialog from "@/components/AssignKeuanganDialog";
import RatingDialog from "@/components/RatingDialog";
import NotificationBell from "@/components/NotificationBell";
import AISearchBar from "@/components/AISearchBar";
import FloatingVoiceAssistant from "@/components/FloatingVoiceAssistant";
import ExportDialog from "@/components/ExportDialog";
import AssignmentExportDialog from "@/components/AssignmentExportDialog";
import SPDExportDialog from "@/components/SPDExportDialog";
import BudgetConfirmationDialog from "@/components/BudgetConfirmationDialog";
import EmployeeRekapDialog from "@/components/EmployeeRekapDialog";
import STLuarKantorDialog from "@/components/STLuarKantorDialog";
import STLuarKantorTable from "@/components/STLuarKantorTable";
import AuditPenugasanTable from "@/components/AuditPenugasanTable";
import RealisasiAnggaranDashboard from "@/components/RealisasiAnggaranDashboard";
import RekapRealisasiPerjadinDashboard from "@/components/RekapRealisasiPerjadinDashboard";
import TimUpkManagement from "@/components/TimUpkManagement";
import TimKeuanganManagement from "@/components/TimKeuanganManagement";
import RatingStatisticsCard, { RatingStatisticsCardRef } from "@/components/RatingStatisticsCard";
import VerificationProgressBar from "@/components/VerificationProgressBar";
import ProgressPenugasanBar from "@/components/ProgressPenugasanBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateNotaDinas, generateSuratTugas } from "@/utils/documentGenerator";
import { format as formatDate } from "date-fns";
import { id } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Voicebot from "@/components/Voicebot";
import SearchableSelectFilter from "@/components/SearchableSelectFilter";
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

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string;
  uraian_pangkat: string;
  uraian_jabatan: string;
  nm_unit_organisasi: string;
}

interface Assignment {
  id: string;
  agenda_number: number;
  unit_pemohon: string;
  unit_penerbit: string;
  dasar_penugasan: string;
  nomor_naskah_dinas: string;
  tanggal_naskah: string;
  perihal: string;
  employee_ids: string[];
  tujuan: string;
  tanggal_mulai_kegiatan?: string;
  tanggal_selesai_kegiatan?: string;
  waktu_penugasan: string;
  lokasi_penugasan_detail: string;
  tempat_penugasan: string;
  pejabat_unit_pemohon_id: string;
  pejabat_unit_penerbit_id: string;
  nota_dinas_downloaded?: boolean;
  surat_tugas_downloaded?: boolean;
  konsep_masuk_at?: string;
  konsep_masuk_by?: string;
  proses_nd_at?: string;
  proses_st_at?: string;
  selesai_at?: string;
  no_satu_kemenkeu?: string;
  tanggal_satu_kemenkeu?: string;
  sumber?: string;
  sumber_satuan_kerja?: string;
  konseptor_name?: string;
  assigned_upk_id?: string;
  assigned_upk_at?: string;
  verifikasi_keuangan_at?: string;
  verifikasi_keuangan_by?: string;
  verifikasi_keuangan_status?: 'approved' | 'declined' | null;
  verifikasi_keuangan_catatan?: string;
  rating_penilaian?: number | null;
}


export default function SuratTugas() {
  const { user, role, fullName, loading: authLoading, signOut } = useAuth();
  const { hasSubMenuAccess, loading: subMenuLoading } = useSubMenuAccess("surat-tugas");
  const { filterAssignmentsByEselon, isFiltered: isEselonFiltered, userEselonIII } = useUserEselonFilter();
  const navigate = useNavigate();
  const isAdmin = role === "admin" || role === "super";
  const canEdit = role !== "overview";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [timUpkList, setTimUpkList] = useState<any[]>([]);
  const [timKeuanganList, setTimKeuanganList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Guard to prevent out-of-order fetches from overwriting newer state (prevents row “muncul lagi” sesaat)
  const assignmentsFetchSeqRef = useRef(0);
  // Tracks IDs currently being deleted so fetchAssignments always filters them out
  const pendingDeleteIdsRef = useRef<Set<string>>(new Set());
  // Ref for RatingStatisticsCard to refresh it after rating submission
  const ratingStatsRef = useRef<RatingStatisticsCardRef>(null);
  // Determine initial active tab based on access
  const getInitialTab = () => {
    if (hasSubMenuAccess("surat-tugas:dashboard")) return "dashboard";
    if (hasSubMenuAccess("surat-tugas:cek-status")) return "assignments";
    if (hasSubMenuAccess("surat-tugas:form-permohonan")) return "entry";
    if (hasSubMenuAccess("surat-tugas:st-luar-kantor")) return "st-luar-kantor";
    if (hasSubMenuAccess("surat-tugas:realisasi-anggaran")) return "realisasi-anggaran";
    if (hasSubMenuAccess("surat-tugas:rekap-realisasi-perjadin")) return "rekap-realisasi-perjadin";
    if (hasSubMenuAccess("surat-tugas:tim-upk")) return "tim-upk";
    if (hasSubMenuAccess("surat-tugas:tim-keuangan")) return "tim-keuangan";
    return "assignments";
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [voicebotOpen, setVoicebotOpen] = useState(false);
  
  // Filter states
  const [filterPerihal, setFilterPerihal] = useState("");
  const [filterLokasi, setFilterLokasi] = useState("");
  const [filterPegawai, setFilterPegawai] = useState("");
  const [filterUnitPemohon, setFilterUnitPemohon] = useState("");
  const [filterUnitPenerbit, setFilterUnitPenerbit] = useState("");
  const [filterTanggalMulai, setFilterTanggalMulai] = useState("");
  const [filterTanggalAkhir, setFilterTanggalAkhir] = useState("");
  const [filterNoAgenda, setFilterNoAgenda] = useState("");
  const [filterKonseptor, setFilterKonseptor] = useState("");
  const [filterTujuan, setFilterTujuan] = useState("");
  const [filterNomorND, setFilterNomorND] = useState("");
  const [progressFilter, setProgressFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [rekapDialogOpen, setRekapDialogOpen] = useState(false);
  const [assignmentExportDialogOpen, setAssignmentExportDialogOpen] = useState(false);
  const [spdExportDialogOpen, setSpdExportDialogOpen] = useState(false);
  const [budgetConfirmationOpen, setBudgetConfirmationOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [assignUpkDialogOpen, setAssignUpkDialogOpen] = useState(false);
  const [assignKeuanganDialogOpen, setAssignKeuanganDialogOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  
  // Rating dialog states for user role
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedRatingAssignment, setSelectedRatingAssignment] = useState<Assignment | null>(null);
  
  // ST Luar Kantor states
  const [stLuarKantor, setStLuarKantor] = useState<any[]>([]);
  const [stLuarKantorDialogOpen, setStLuarKantorDialogOpen] = useState(false);
  const [selectedSTLuarKantor, setSelectedSTLuarKantor] = useState<any>(null);
  const [deleteSTLKId, setDeleteSTLKId] = useState<string | null>(null);
  
  // Pagination state for cek status
  const [cekStatusPerPage, setCekStatusPerPage] = useState<number>(10);
  const [cekStatusPage, setCekStatusPage] = useState(1);
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchEmployees = async () => {
    try {
      let allEmployees: any[] = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from("employees")
          .select("id, nm_pegawai, nip, uraian_pangkat, uraian_jabatan, nm_unit_organisasi")
          .order("nm_pegawai", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allEmployees = [...allEmployees, ...data];
        
        if (data.length < pageSize) break;
        page++;
      }
      
      const employeesWithNip: Employee[] = allEmployees.map(emp => ({
        id: emp.id,
        nm_pegawai: emp.nm_pegawai,
        nip: emp.nip || '',
        uraian_pangkat: emp.uraian_pangkat,
        uraian_jabatan: emp.uraian_jabatan,
        nm_unit_organisasi: emp.nm_unit_organisasi,
      }));
      setEmployees(employeesWithNip);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    const fetchSeq = ++assignmentsFetchSeqRef.current;

    try {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, agenda_number, unit_pemohon, unit_penerbit, dasar_penugasan, nomor_naskah_dinas, tanggal_naskah, perihal, employee_ids, tujuan, tanggal_mulai_kegiatan, tanggal_selesai_kegiatan, waktu_penugasan, lokasi_penugasan_detail, tempat_penugasan, pejabat_unit_pemohon_id, pejabat_unit_penerbit_id, nota_dinas_downloaded, surat_tugas_downloaded, konsep_masuk_at, konsep_masuk_by, proses_nd_at, proses_nd_by, proses_st_at, proses_st_by, selesai_at, selesai_by, no_satu_kemenkeu, tanggal_satu_kemenkeu, sumber, sumber_satuan_kerja, assigned_upk_id, assigned_upk_at, verifikasi_keuangan_at, verifikasi_keuangan_by, verifikasi_keuangan_status, verifikasi_keuangan_catatan, rating_penilaian, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch konseptor names in a single batch query instead of N+1
      const konseptorEmails = [...new Set((data || []).filter(a => a.konsep_masuk_by).map(a => a.konsep_masuk_by!))];
      const konseptorMap = new Map<string, string>();
      if (konseptorEmails.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("email, full_name")
          .in("email", konseptorEmails);
        profilesData?.forEach(p => {
          if (p.email) konseptorMap.set(p.email, p.full_name || p.email);
        });
      }
      const assignmentsWithKonseptor = (data || []).map(assignment => ({
        ...assignment,
        konseptor_name: assignment.konsep_masuk_by ? (konseptorMap.get(assignment.konsep_masuk_by) || assignment.konsep_masuk_by) : undefined,
      }));

      // Avoid stale/out-of-order fetch results overwriting newer state
      if (fetchSeq !== assignmentsFetchSeqRef.current) return;

      // Always filter out any IDs that are currently pending deletion
      const filtered = assignmentsWithKonseptor.filter(
        (a) => !pendingDeleteIdsRef.current.has(a.id)
      );

      setAssignments(filtered as Assignment[]);
    } catch (error: any) {
      // Only show error if this is still the latest fetch
      if (fetchSeq === assignmentsFetchSeqRef.current) {
        toast.error(error.message || "Gagal memuat data penugasan");
      }
    }
  };

  const fetchTimUpk = async () => {
    try {
      const { data, error } = await supabase
        .from("tim_upk")
        .select("id, name, email, assignment_count, last_assigned_at")
        .order("name", { ascending: true });

      if (error) throw error;
      setTimUpkList(data || []);
    } catch (error: any) {
      console.error("Error fetching Tim UPK:", error);
    }
  };

  const fetchTimKeuangan = async () => {
    try {
      const { data, error } = await supabase
        .from("tim_keuangan")
        .select("id, name, email")
        .order("name", { ascending: true });

      if (error) throw error;
      setTimKeuanganList(data || []);
    } catch (error: any) {
      console.error("Error fetching Tim Keuangan:", error);
    }
  };

  const fetchSTLuarKantor = async () => {
    try {
      const { data, error } = await supabase
        .from("st_luar_kantor")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      
      // Batch fetch profile names instead of N+1
      const emails = [...new Set((data || []).filter(r => r.created_by_email).map(r => r.created_by_email!))];
      const nameMap = new Map<string, string>();
      if (emails.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("email, full_name")
          .in("email", emails);
        profilesData?.forEach(p => {
          if (p.email) nameMap.set(p.email, p.full_name || "");
        });
      }
      const enrichedData = (data || []).map(record => ({
        ...record,
        created_by_name: record.created_by_email ? (nameMap.get(record.created_by_email) || null) : null
      }));
      
      setStLuarKantor(enrichedData);
    } catch (error: any) {
      console.error("Error fetching ST Luar Kantor:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAssignments();
    fetchTimUpk();
    fetchTimKeuangan();
    fetchSTLuarKantor();
  }, []);

  const handleDeleteAssignment = async () => {
    if (!deleteId) return;

    const deletingId = deleteId;

    // Track this ID as pending deletion so fetchAssignments always filters it out
    pendingDeleteIdsRef.current.add(deletingId);

    // Optimistic update - remove from local state immediately
    setAssignments((prev) => prev.filter((a) => a.id !== deletingId));

    // Clear dialog state immediately for better UX
    setDeleteId(null);

    try {
      const { data, error } = await supabase.functions.invoke("delete-assignment", {
        body: { assignmentId: deletingId },
      });

      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);

      toast.success((data as any)?.message || "Data penugasan berhasil dihapus!");

      // Refresh from server to ensure sync
      await fetchAssignments();

      // Keep deleted row hidden even if any stale fetch arrives
      setAssignments((prev) => prev.filter((a) => a.id !== deletingId));
    } catch (error: any) {
      // Restore behavior on failure
      pendingDeleteIdsRef.current.delete(deletingId);
      toast.error(error?.message || "Gagal menghapus data");
      await fetchAssignments();
    } finally {
      // Remove from pending set after a short delay to avoid any racing GET responses
      setTimeout(() => {
        pendingDeleteIdsRef.current.delete(deletingId);
      }, 2000);
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setAssignmentDialogOpen(true);
  };

  const handleAssignToMe = async (assignmentId: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.email) {
        toast.error("User tidak ditemukan");
        return;
      }

      // Find the Tim UPK member matching the current user
      const upkMember = timUpkList.find((upk: any) => upk.email === currentUser.email);
      if (!upkMember) {
        toast.error("Anda bukan anggota Tim UPK");
        return;
      }

      // Update the assignment to assign to current user
      const { error } = await supabase
        .from("assignments")
        .update({
          assigned_upk_id: upkMember.id,
          assigned_upk_at: new Date().toISOString(),
          assigned_upk_manually: true,
        })
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success(`Berhasil assign ke ${upkMember.name}`);
      fetchAssignments();
    } catch (error: any) {
      toast.error(error.message || "Gagal assign");
    }
  };

  const handleArchiveAssignment = async (assignmentId: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const email = currentUser?.email || "unknown";

      const { error } = await supabase
        .from("assignments")
        .update({
          selesai_at: new Date().toISOString(),
          selesai_by: email,
        })
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("Penugasan berhasil diarsipkan");
      fetchAssignments();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengarsipkan");
    }
  };

  const handleDeleteSTLuarKantor = async () => {
    if (!deleteSTLKId) return;

    try {
      const { error } = await supabase
        .from("st_luar_kantor")
        .delete()
        .eq("id", deleteSTLKId);

      if (error) throw error;

      toast.success("Data ST Luar Kantor berhasil dihapus");
      fetchSTLuarKantor();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus data");
    } finally {
      setDeleteSTLKId(null);
    }
  };

  const handleUnarchiveAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("assignments")
        .update({
          selesai_at: null,
          selesai_by: null,
        })
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("Penugasan berhasil dibatalkan dari arsip");
      fetchAssignments();
    } catch (error: any) {
      toast.error(error.message || "Gagal membatalkan arsip");
    }
  };

  const handleDuplicateAssignment = async (assignment: Assignment) => {
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Get next agenda number with fresh query each retry
        const { data: maxData } = await supabase
          .from("assignments")
          .select("agenda_number")
          .order("agenda_number", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        const newAgendaNumber = (maxData?.agenda_number || 0) + 1;
        
        // Get current user email
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const userEmail = currentUser?.email || "Unknown";
        
        // Check if manual verification is required (DIPA + Kanwil DJBC Jatim I)
        const requiresManualVerification = 
          (assignment as any).sumber === "DIPA" && 
          (assignment as any).sumber_satuan_kerja === "Kanwil DJBC Jatim I";
        
        let verifikasi_keuangan_by = null;
        let verifikasi_keuangan_at = null;
        let verifikasi_keuangan_status = null;
        
        if (!requiresManualVerification) {
          // Auto-verify
          verifikasi_keuangan_at = new Date().toISOString();
          verifikasi_keuangan_by = "Auto System";
          verifikasi_keuangan_status = "approved";
        } else {
          // Requires manual verification - auto-assign Freesia Putri Erwana as default
          // If Freesia is "Away", fallback to Hidayatul Lisnaini
          try {
            const { data: keuanganMembers } = await supabase
              .from("tim_keuangan")
              .select("*")
              .order("name", { ascending: true });
            
            if (keuanganMembers && keuanganMembers.length > 0) {
              // Find Freesia Putri Erwana
              const freesia = keuanganMembers.find(k => k.name === "Freesia Putri Erwana");
              // Find Hidayatul Lisnaini as backup
              const hidayatul = keuanganMembers.find(k => k.name === "Hidayatul Lisnaini");
              
              let selectedVerifikator = freesia;
              if (freesia) {
                // Check Freesia's status from profiles
                const { data: freesiaProfile } = await supabase
                  .from("profiles")
                  .select("user_status")
                  .eq("email", freesia.email)
                  .maybeSingle();
                
                // If Freesia is Away, use Hidayatul Lisnaini
                if (freesiaProfile?.user_status === "away" && hidayatul) {
                  selectedVerifikator = hidayatul;
                }
              } else if (hidayatul) {
                selectedVerifikator = hidayatul;
              } else {
                // Fallback to member with lowest assignment count
                selectedVerifikator = keuanganMembers.sort((a, b) => 
                  (a.assignment_count || 0) - (b.assignment_count || 0)
                )[0];
              }
              
              if (selectedVerifikator) {
                verifikasi_keuangan_by = `${selectedVerifikator.name} (${selectedVerifikator.email})`;
                verifikasi_keuangan_status = "pending";
                
                // Update the Tim Keuangan assignment count
                await supabase
                  .from("tim_keuangan")
                  .update({
                    assignment_count: (selectedVerifikator.assignment_count || 0) + 1,
                    last_assigned_at: new Date().toISOString()
                  })
                  .eq("id", selectedVerifikator.id);
              }
            }
          } catch (keuanganError) {
            console.error("Error auto-assigning Tim Keuangan:", keuanganError);
          }
        }
        
        // Create duplicate with new agenda number
        const { data: insertedData, error } = await supabase.from("assignments").insert({
          agenda_number: newAgendaNumber,
          unit_pemohon: assignment.unit_pemohon,
          unit_penerbit: assignment.unit_penerbit,
          dasar_penugasan: (assignment as any).dasar_penugasan,
          nomor_naskah_dinas: (assignment as any).nomor_naskah_dinas,
          tanggal_naskah: (assignment as any).tanggal_naskah,
          perihal: assignment.perihal,
          employee_ids: assignment.employee_ids,
          tujuan: (assignment as any).tujuan,
          tanggal_mulai_kegiatan: assignment.tanggal_mulai_kegiatan,
          tanggal_selesai_kegiatan: assignment.tanggal_selesai_kegiatan,
          waktu_penugasan: (assignment as any).waktu_penugasan,
          lokasi_penugasan_detail: (assignment as any).lokasi_penugasan_detail,
          tempat_penugasan: assignment.tempat_penugasan,
          pejabat_unit_pemohon_id: (assignment as any).pejabat_unit_pemohon_id,
          pejabat_unit_penerbit_id: (assignment as any).pejabat_unit_penerbit_id,
          sumber: (assignment as any).sumber,
          sumber_satuan_kerja: (assignment as any).sumber_satuan_kerja,
          created_by_email: userEmail,
          konsep_masuk_at: new Date().toISOString(),
          konsep_masuk_by: userEmail,
          verifikasi_keuangan_by,
          verifikasi_keuangan_at,
          verifikasi_keuangan_status,
        }).select();
        
        if (error) {
          // Check if it's a duplicate key error
          if (error.code === '23505' && error.message?.includes('agenda_number')) {
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`Duplicate agenda number detected, retrying... (${retryCount}/${maxRetries})`);
              continue; // Retry with fresh query
            }
          }
          throw error;
        }
        
        toast.success(`Draft berhasil diduplikasi dengan No. Agenda ${newAgendaNumber}`);
        fetchAssignments();
        return; // Success, exit the function
      } catch (error: any) {
        if (retryCount >= maxRetries - 1) {
          toast.error(error.message || "Gagal menduplikasi draft");
          return;
        }
        retryCount++;
      }
    }
  };

  const handleFeedbackSubmit = async (noSatuKemenkeu: string, tanggalSatuKemenkeu: Date) => {
    if (!selectedAssignmentId) return;
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const email = currentUser?.email || "unknown";

      await supabase
        .from("assignments")
        .update({
          no_satu_kemenkeu: noSatuKemenkeu,
          tanggal_satu_kemenkeu: formatDate(tanggalSatuKemenkeu, "yyyy-MM-dd"),
          selesai_at: new Date().toISOString(),
          selesai_by: email,
        })
        .eq("id", selectedAssignmentId);

      toast.success("Data Satu Kemenkeu berhasil disimpan");
      fetchAssignments();
      setSelectedAssignmentId(null);
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    }
  };

  const handleGenerateNotaDinas = async (assignment: Assignment) => {
    try {
      console.log("🔵 [Generate ND] Starting generation for assignment:", assignment.id);
      console.log("🔵 [Generate ND] Employee IDs:", assignment.employee_ids);
      
      // Fetch full employee details for the assignment
      const { data: employeeData, error: empError } = await supabase
        .from("employees")
        .select("*")
        .in("id", assignment.employee_ids);

      if (empError) {
        console.error("❌ [Generate ND] Error fetching employees:", empError);
        throw empError;
      }
      
      console.log("✅ [Generate ND] Employee data fetched:", employeeData);
      
      // Validate employee data
      if (!employeeData || employeeData.length === 0) {
        throw new Error("Data pegawai tidak ditemukan. Pastikan pegawai sudah ditambahkan ke penugasan.");
      }
      
      // Check for missing required fields in employees
      const missingFields = employeeData.filter(emp => 
        !emp.nm_pegawai || !emp.uraian_pangkat || !emp.uraian_jabatan
      );
      if (missingFields.length > 0) {
        console.warn("⚠️ [Generate ND] Employees with missing data:", missingFields);
        throw new Error("Beberapa pegawai memiliki data tidak lengkap (nama, pangkat, atau jabatan kosong).");
      }

      // Fetch pejabat penandatangan
      const { data: pejabatData, error: pejError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", assignment.pejabat_unit_pemohon_id)
        .single();

      if (pejError) {
        console.error("❌ [Generate ND] Error fetching pejabat:", pejError);
        throw new Error("Pejabat penandatangan tidak ditemukan.");
      }
      
      console.log("✅ [Generate ND] Pejabat data fetched:", pejabatData);
      
      // Validate pejabat data
      if (!pejabatData || !pejabatData.nm_pegawai) {
        throw new Error("Data pejabat penandatangan tidak lengkap.");
      }

      // Validate required fields
      if (!assignment.perihal || !assignment.dasar_penugasan || !assignment.tujuan) {
        throw new Error("Data penugasan tidak lengkap. Perihal, dasar penugasan, dan tujuan harus diisi.");
      }
      
      if (!assignment.tanggal_naskah) {
        throw new Error("Tanggal naskah dinas harus diisi.");
      }

      // Format tanggal kegiatan
      let tanggalKegiatan = "";
      if (assignment.tanggal_mulai_kegiatan && assignment.tanggal_selesai_kegiatan) {
        try {
          const startDate = new Date(assignment.tanggal_mulai_kegiatan);
          const endDate = new Date(assignment.tanggal_selesai_kegiatan);
          
          // Check if dates are valid
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error("Format tanggal kegiatan tidak valid");
          }
          
          if (assignment.tanggal_mulai_kegiatan === assignment.tanggal_selesai_kegiatan) {
            tanggalKegiatan = formatDate(startDate, "dd MMMM yyyy", { locale: id });
          } else {
            tanggalKegiatan = `${formatDate(startDate, "dd MMMM yyyy", { locale: id })} - ${formatDate(endDate, "dd MMMM yyyy", { locale: id })}`;
          }
        } catch (error) {
          console.error("❌ [Generate ND] Error formatting dates:", error);
          throw new Error("Gagal memformat tanggal kegiatan. Periksa format tanggal.");
        }
      } else {
        throw new Error("Tanggal mulai dan selesai kegiatan harus diisi.");
      }

      // Generate nomor surat if not exists
      const nomorSurat = (assignment as any).nomor_surat || `ND-${assignment.agenda_number}/${new Date().getFullYear()}`;

      // Format tanggal naskah with validation
      let formattedTanggalNaskah = assignment.tanggal_naskah;
      try {
        const naskahDate = new Date(assignment.tanggal_naskah);
        if (!isNaN(naskahDate.getTime())) {
          formattedTanggalNaskah = formatDate(naskahDate, "yyyy-MM-dd");
        }
      } catch (error) {
        console.warn("⚠️ [Generate ND] Could not format tanggal_naskah, using original value");
      }

      // Combine database employees with manual employees for ND
      const dbEmployees = employeeData.map((emp: any) => ({
        nm_pegawai: emp.nm_pegawai || '',
        uraian_pangkat: emp.uraian_pangkat || '',
        uraian_jabatan: emp.uraian_jabatan || '',
        gol_ruang: (emp as any).gol_ruang || ''
      }));
      
      // Get manual employees from assignment if any
      const manualEmployees = ((assignment as any).manual_employees || []).map((emp: any) => ({
        nm_pegawai: emp.nama,
        uraian_pangkat: emp.pangkat,
        uraian_jabatan: emp.jabatan,
        gol_ruang: ''
      }));
      
      // Combine all employees
      const allEmployees = [...dbEmployees, ...manualEmployees];

      // Prepare data for document generation
      const documentData = {
        nomor_surat: nomorSurat,
        dasar_penugasan: assignment.dasar_penugasan,
        nomor_naskah_dinas: assignment.nomor_naskah_dinas,
        tanggal_naskah: formattedTanggalNaskah,
        perihal: assignment.perihal,
        employees: allEmployees,
        tujuan: assignment.tujuan,
        tanggal_kegiatan: tanggalKegiatan,
        waktu_penugasan: assignment.waktu_penugasan,
        tempat_penugasan: assignment.tempat_penugasan || '-',
        alamat_penugasan: assignment.lokasi_penugasan_detail || '-',
        pejabat_penandatangan: {
          nm_pegawai: pejabatData.nm_pegawai || '',
          uraian_pangkat: pejabatData.uraian_pangkat || '',
          uraian_jabatan: pejabatData.uraian_jabatan || '',
          gol_ruang: (pejabatData as any).gol_ruang || ''
        },
        tanggal_surat: new Date(),
        unit_pemohon: assignment.unit_pemohon || '',
        unit_penerbit: assignment.unit_penerbit || ''
      };

      console.log("📋 [Generate ND] Document data prepared:", JSON.stringify(documentData, null, 2));

      // Get current user email for tracking
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      // Auto-assign UPK if not assigned yet
      // Only assign to members whose status is NOT "away"
      let assignedUpkId = assignment.assigned_upk_id;
      if (!assignedUpkId) {
        try {
          // Get all Tim UPK members
          const { data: upkMembers } = await supabase
            .from("tim_upk")
            .select("*")
            .order("assignment_count", { ascending: true })
            .order("last_assigned_at", { ascending: true, nullsFirst: true });
          
          if (upkMembers && upkMembers.length > 0) {
            // Get profiles to check status
            const { data: profiles } = await supabase
              .from("profiles")
              .select("email, user_status");
            
            // Filter out members with "away" status
            const availableMembers = upkMembers.filter(member => {
              const profile = profiles?.find(p => p.email === member.email);
              // Include if no profile found (default to available) or status is not "away"
              return !profile || profile.user_status !== "away";
            });
            
            if (availableMembers.length > 0) {
              // Select the one with lowest assignment count
              const selectedUpk = availableMembers[0];
              assignedUpkId = selectedUpk.id;
              
              // Update assignment count
              await supabase
                .from("tim_upk")
                .update({
                  assignment_count: (selectedUpk.assignment_count || 0) + 1,
                  last_assigned_at: new Date().toISOString()
                })
                .eq("id", selectedUpk.id);
            } else {
              console.warn("⚠️ [Generate ND] No available UPK members (all are away)");
            }
          }
        } catch (upkError) {
          console.warn("⚠️ [Generate ND] Could not auto-assign UPK:", upkError);
        }
      }

      // Prepare update object for database
      const updateData: Record<string, any> = {
        proses_nd_at: new Date().toISOString(),
        proses_nd_by: userEmail,
        nota_dinas_downloaded: true,
        nota_dinas_downloaded_at: new Date().toISOString(),
        nota_dinas_downloaded_by: userEmail,
      };

      // Add UPK assignment if needed
      if (assignedUpkId) {
        updateData.assigned_upk_id = assignedUpkId;
        if (!assignment.assigned_upk_id) {
          updateData.assigned_upk_at = new Date().toISOString();
        }
      }

      // For non-admin users, automatically mark as selesai (complete) when generating ND
      // This moves the card from "Meja" to "Arsip"
      if (!isAdmin) {
        updateData.selesai_at = new Date().toISOString();
        updateData.selesai_by = userEmail;
      }

      // Update tracking in database BEFORE generating document
      const { error: updateError } = await supabase
        .from("assignments")
        .update(updateData)
        .eq("id", assignment.id);

      if (updateError) {
        console.error("❌ [Generate ND] Error updating database:", updateError);
        // Continue with document generation even if update fails
      } else {
        console.log("✅ [Generate ND] Database updated successfully:", updateData);
      }

      // Generate document and wait for it to complete
      await generateNotaDinas(documentData);
      
      console.log("✅ [Generate ND] Document generated successfully");
      
      // Refresh assignments to update UI
      fetchAssignments();
      
      // Show appropriate success message
      toast.success(isAdmin ? "Nota Dinas berhasil diunduh!" : "Nota Dinas berhasil diunduh! Penugasan dipindahkan ke Arsip.");
      
      return true;
    } catch (error: any) {
      console.error("Error generating Nota Dinas:", error);
      toast.error(error.message || "Gagal generate Nota Dinas");
      throw error;
    }
  };

  const handleGenerateSuratTugas = async (assignment: Assignment) => {
    try {
      // Fetch full employee details for the assignment
      const { data: employeeData, error: empError } = await supabase
        .from("employees")
        .select("*")
        .in("id", assignment.employee_ids);

      if (empError) throw empError;

      // Fetch pejabat penandatangan
      const { data: pejabatData, error: pejError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", assignment.pejabat_unit_penerbit_id)
        .single();

      if (pejError) throw pejError;

      // Format tanggal kegiatan
      let tanggalKegiatan = "";
      if (assignment.tanggal_mulai_kegiatan && assignment.tanggal_selesai_kegiatan) {
        if (assignment.tanggal_mulai_kegiatan === assignment.tanggal_selesai_kegiatan) {
          tanggalKegiatan = formatDate(new Date(assignment.tanggal_mulai_kegiatan), "dd MMMM yyyy", { locale: id });
        } else {
          tanggalKegiatan = `${formatDate(new Date(assignment.tanggal_mulai_kegiatan), "dd MMMM yyyy", { locale: id })} - ${formatDate(new Date(assignment.tanggal_selesai_kegiatan), "dd MMMM yyyy", { locale: id })}`;
        }
      }

      // Generate nomor surat if not exists
      const nomorSurat = (assignment as any).nomor_surat || `ST-${assignment.agenda_number}/${new Date().getFullYear()}`;

      // Combine database employees with manual employees
      const dbEmployees = employeeData.map((emp: any) => ({
        nm_pegawai: emp.nm_pegawai,
        uraian_pangkat: emp.uraian_pangkat,
        uraian_jabatan: emp.uraian_jabatan,
        gol_ruang: emp.gol_ruang || ''
      }));
      
      // Get manual employees from assignment if any
      const manualEmployees = ((assignment as any).manual_employees || []).map((emp: any) => ({
        nm_pegawai: emp.nama,
        uraian_pangkat: emp.pangkat,
        uraian_jabatan: emp.jabatan,
        gol_ruang: ''
      }));
      
      // Combine all employees
      const allEmployees = [...dbEmployees, ...manualEmployees];

      // Prepare data for document generation
      const documentData = {
        nomor_surat: nomorSurat,
        dasar_penugasan: assignment.dasar_penugasan,
        nomor_naskah_dinas: assignment.nomor_naskah_dinas,
        tanggal_naskah: assignment.tanggal_naskah,
        perihal: assignment.perihal,
        employees: allEmployees,
        tujuan: assignment.tujuan,
        tanggal_kegiatan: tanggalKegiatan,
        waktu_penugasan: assignment.waktu_penugasan,
        tempat_penugasan: assignment.tempat_penugasan || '-',
        alamat_penugasan: assignment.lokasi_penugasan_detail || '-',
        pejabat_penandatangan: {
          nm_pegawai: pejabatData.nm_pegawai,
          uraian_pangkat: pejabatData.uraian_pangkat,
          uraian_jabatan: pejabatData.uraian_jabatan,
          gol_ruang: (pejabatData as any).gol_ruang || ''
        },
        tanggal_surat: new Date(),
        unit_pemohon: assignment.unit_pemohon,
        unit_penerbit: assignment.unit_penerbit,
        sumber: (assignment as any).sumber,
        sumber_satuan_kerja: (assignment as any).sumber_satuan_kerja,
        sumber_satuan_kerja_custom: (assignment as any).sumber_satuan_kerja_custom
      };

      // Generate document
      await generateSuratTugas(documentData);
      
      // Update download status in database
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";
      
      await supabase
        .from("assignments")
        .update({
          surat_tugas_downloaded: true,
          surat_tugas_downloaded_at: new Date().toISOString(),
          surat_tugas_downloaded_by: userEmail,
          proses_st_at: new Date().toISOString(),
          proses_st_by: userEmail,
        })
        .eq("id", assignment.id);
      
      // Refresh assignments to update UI
      fetchAssignments();
      
      toast.success("Surat Tugas berhasil diunduh!");
      
    } catch (error: any) {
      console.error("Error generating Surat Tugas:", error);
      toast.error(error.message || "Gagal generate Surat Tugas");
    }
  };

  // Eselon-filtered assignments (for user role with eselon III set in admin panel)
  const eselonFilteredAssignments = useMemo(() => {
    return filterAssignmentsByEselon(assignments);
  }, [assignments, filterAssignmentsByEselon]);

  // Filter assignments - using exact match for dropdown selections
  const filteredAssignments = eselonFilteredAssignments.filter((assignment) => {
    // Perihal - exact match from dropdown
    if (filterPerihal && assignment.perihal !== filterPerihal) return false;
    // Lokasi - exact match from dropdown
    if (filterLokasi && assignment.tempat_penugasan !== filterLokasi) return false;
    // Unit Pemohon - exact match from dropdown
    if (filterUnitPemohon && assignment.unit_pemohon !== filterUnitPemohon) return false;
    // Unit Penerbit - exact match from dropdown
    if (filterUnitPenerbit && assignment.unit_penerbit !== filterUnitPenerbit) return false;
    // Pegawai - check if any employee matches (exact name from dropdown)
    if (filterPegawai) {
      const hasEmployee = assignment.employee_ids.some(id => {
        const emp = employees.find(e => e.id === id);
        return emp?.nm_pegawai === filterPegawai;
      });
      if (!hasEmployee) return false;
    }
    // Filter by tanggal_naskah for Form Permohonan
    if (filterTanggalMulai && assignment.tanggal_naskah && assignment.tanggal_naskah < filterTanggalMulai) return false;
    if (filterTanggalAkhir && assignment.tanggal_naskah && assignment.tanggal_naskah > filterTanggalAkhir) return false;
    // Filter by No. Agenda - exact match from dropdown
    if (filterNoAgenda && assignment.agenda_number.toString() !== filterNoAgenda) return false;
    // Filter by Konseptor - exact match from dropdown
    if (filterKonseptor && assignment.konseptor_name !== filterKonseptor) return false;
    // Filter by Tujuan Penugasan
    if (filterTujuan && !(assignment as any).tujuan?.toLowerCase().includes(filterTujuan.toLowerCase())) return false;
    // Filter by Nomor Naskah Dinas (from dasar_penugasan)
    if (filterNomorND && !(assignment as any).nomor_naskah_dinas?.toLowerCase().includes(filterNomorND.toLowerCase())) return false;
    // Filter by progress status
    if (progressFilter === 'completed' && (!assignment.no_satu_kemenkeu || !(assignment as any).tanggal_satu_kemenkeu)) return false;
    if (progressFilter === 'pending' && assignment.no_satu_kemenkeu && (assignment as any).tanggal_satu_kemenkeu) return false;
    // Filter by verification status
    if (verificationFilter === 'completed' && (assignment as any).verifikasi_keuangan_status !== 'approved') return false;
    if (verificationFilter === 'pending' && (assignment as any).verifikasi_keuangan_status === 'approved') return false;
    return true;
  });

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
                <h1 className="text-2xl font-bold">Surat Tugas</h1>
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
            hasSubMenuAccess("surat-tugas:dashboard"),
            hasSubMenuAccess("surat-tugas:form-permohonan"),
            hasSubMenuAccess("surat-tugas:cek-status"),
            hasSubMenuAccess("surat-tugas:st-luar-kantor") || true,
            true,
            hasSubMenuAccess("surat-tugas:realisasi-anggaran"),
            hasSubMenuAccess("surat-tugas:rekap-realisasi-perjadin"),
            hasSubMenuAccess("surat-tugas:tim-upk"),
            hasSubMenuAccess("surat-tugas:tim-keuangan")
          ].filter(Boolean).length || 1}, 1fr)` }}>
            {hasSubMenuAccess("surat-tugas:dashboard") && (
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            )}
            {hasSubMenuAccess("surat-tugas:form-permohonan") && (
              <TabsTrigger value="entry">Form Permohonan</TabsTrigger>
            )}
            {hasSubMenuAccess("surat-tugas:cek-status") && (
              <TabsTrigger value="assignments">Cek Status</TabsTrigger>
            )}
            <TabsTrigger value="audit">Audit</TabsTrigger>
            {hasSubMenuAccess("surat-tugas:st-luar-kantor") && (
              <TabsTrigger value="st-luar-kantor">ST Luar Kantor</TabsTrigger>
            )}
            {hasSubMenuAccess("surat-tugas:realisasi-anggaran") && (
              <TabsTrigger value="realisasi-anggaran">Realisasi Anggaran</TabsTrigger>
            )}
            {hasSubMenuAccess("surat-tugas:rekap-realisasi-perjadin") && (
              <TabsTrigger value="rekap-realisasi-perjadin">Rekap Realisasi Perjadin</TabsTrigger>
            )}
            {hasSubMenuAccess("surat-tugas:tim-upk") && (
              <TabsTrigger value="tim-upk">Tim UPK</TabsTrigger>
            )}
            {hasSubMenuAccess("surat-tugas:tim-keuangan") && (
              <TabsTrigger value="tim-keuangan">Tim Keuangan</TabsTrigger>
            )}
          </TabsList>

          {hasSubMenuAccess("surat-tugas:dashboard") && (
            <TabsContent value="dashboard">
              <div className="space-y-4">
                <Dashboard embedded />
                <RatingStatisticsCard ref={ratingStatsRef} />
              </div>
            </TabsContent>
          )}

          {hasSubMenuAccess("surat-tugas:form-permohonan") && (
          <TabsContent value="entry">
            <Card className="p-6 mb-4">
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Form Permohonan</h2>
                    <p className="text-muted-foreground mb-6">
                      Buat dan kelola penugasan pegawai
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={async () => {
                            try {
                              const response = await fetch('/templates/ST_Format_Banyak.docx');
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = 'ST_Format_Banyak.docx';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                              toast.success("Template berhasil diunduh");
                            } catch (error) {
                              toast.error("Gagal mengunduh template");
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Unduh Template
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open("https://kemenkeu-my.sharepoint.com/:x:/r/personal/rizal_afiat_kemenkeu_go_id/_layouts/15/doc2.aspx?sourcedoc=%7BCAA04020-AED5-42DC-B4F4-E4C2C94B77CD%7D&file=Monitoring%20ST.xlsx&action=default&mobileredirect=true", "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Arsip
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {canEdit && (
                    <Button
                      onClick={() => {
                        setSelectedAssignment(null);
                        setBudgetConfirmationOpen(true);
                      }}
                      className="h-20 sm:h-24 flex flex-col gap-2 text-sm sm:text-base"
                    >
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span>Buat Penugasan Baru</span>
                    </Button>
                  )}

                  {role === "admin" && (
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        if (assignments.length === 0) {
                          toast.error("Tidak ada data untuk dihapus");
                          return;
                        }
                        if (!confirm(`Yakin ingin menghapus SEMUA ${assignments.length} data penugasan?`)) return;
                        const { error } = await supabase.from("assignments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
                        if (error) {
                          toast.error("Gagal menghapus semua data");
                          return;
                        }
                        toast.success("Semua data penugasan berhasil dihapus");
                        fetchAssignments();
                      }}
                      className="h-20 sm:h-24 flex flex-col gap-2 text-sm sm:text-base"
                    >
                      <Trash2 className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span>Hapus Semua</span>
                    </Button>
                  )}

                  {isAdmin && (
                    <>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          try {
                            const arrayBuffer = await file.arrayBuffer();
                            const workbook = XLSX.read(arrayBuffer, { type: "array" });
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const jsonData = XLSX.utils.sheet_to_json(worksheet);
                            
                            let imported = 0;
                            const { data: maxData } = await supabase
                              .from("assignments")
                              .select("agenda_number")
                              .order("agenda_number", { ascending: false })
                              .limit(1)
                              .single();
                            
                            let nextAgenda = (maxData?.agenda_number || 0) + 1;
                            
                            for (const row of jsonData as any[]) {
                              const { error } = await supabase.from("assignments").insert({
                                agenda_number: nextAgenda++,
                                unit_pemohon: row["Unit Pemohon"] || "",
                                unit_penerbit: row["Unit Penerbit"] || "",
                                dasar_penugasan: row["Dasar Penugasan"] || "",
                                nomor_naskah_dinas: row["Nomor Naskah Dinas"] || "",
                                tanggal_naskah: row["Tanggal Naskah"] || formatDate(new Date(), "yyyy-MM-dd"),
                                perihal: row["Perihal"] || "",
                                employee_ids: [],
                                tujuan: row["Tujuan"] || "",
                                waktu_penugasan: row["Waktu Penugasan"] || "",
                                tempat_penugasan: row["Tempat Penugasan"] || "",
                                pejabat_unit_pemohon_id: "",
                                pejabat_unit_penerbit_id: "",
                                created_by_email: user?.email || "Unknown",
                              });
                              if (!error) imported++;
                            }
                            toast.success(`Berhasil import ${imported} data penugasan`);
                            fetchAssignments();
                          } catch (error: any) {
                            toast.error("Gagal import data");
                          }
                          event.target.value = '';
                        }}
                        className="hidden"
                        id="import-assignment-excel"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('import-assignment-excel')?.click()}
                        className="h-20 sm:h-24 flex flex-col gap-2 text-sm sm:text-base"
                      >
                        <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span>Import Excel</span>
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setAssignmentExportDialogOpen(true)}
                    className="h-20 sm:h-24 flex flex-col gap-2 text-sm sm:text-base"
                  >
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span>Export Excel</span>
                  </Button>

                  {isAdmin && (
                    <Button
                      variant="outline"
                      onClick={() => setRekapDialogOpen(true)}
                      className="h-20 sm:h-24 flex flex-col gap-2 text-sm sm:text-base"
                    >
                      <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span>Rekap ST Pegawai</span>
                    </Button>
                  )}

                  {role !== "user" && (
                    <Button
                      variant="outline"
                      onClick={() => setSpdExportDialogOpen(true)}
                      className="h-20 sm:h-24 flex flex-col gap-2 text-sm sm:text-base"
                    >
                      <Download className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span>Export SPD</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Agenda Section for Admin - Table format with dialog on click */}
            {(role === "admin" || role === "super" || role === "overview") && (
              <>
                {/* Verification Progress Bar */}
                <VerificationProgressBar 
                  assignments={assignments} 
                  onFilterChange={setVerificationFilter}
                  activeFilter={verificationFilter}
                />
                
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">Agenda Penugasan</h3>
                
                {/* Filters */}
                <div className="mb-4 p-4 border rounded-lg bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="agenda-filter-perihal" className="text-xs">Perihal</Label>
                      <Input
                        id="agenda-filter-perihal"
                        placeholder="Cari perihal..."
                        value={filterPerihal}
                        onChange={(e) => setFilterPerihal(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="agenda-filter-tujuan" className="text-xs">Tujuan Penugasan</Label>
                      <Input
                        id="agenda-filter-tujuan"
                        placeholder="Cari tujuan penugasan..."
                        value={filterTujuan}
                        onChange={(e) => setFilterTujuan(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="agenda-filter-nomor-nd" className="text-xs">Nomor Naskah Dinas</Label>
                      <Input
                        id="agenda-filter-nomor-nd"
                        placeholder="Cari nomor ND..."
                        value={filterNomorND}
                        onChange={(e) => setFilterNomorND(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="agenda-filter-lokasi" className="text-xs">Tempat Penugasan</Label>
                      <Input
                        id="agenda-filter-lokasi"
                        placeholder="Cari lokasi..."
                        value={filterLokasi}
                        onChange={(e) => setFilterLokasi(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="agenda-filter-unit-pemohon" className="text-xs">Unit Pemohon</Label>
                      <Input
                        id="agenda-filter-unit-pemohon"
                        placeholder="Cari unit pemohon..."
                        value={filterUnitPemohon}
                        onChange={(e) => setFilterUnitPemohon(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="agenda-filter-no-satu" className="text-xs">No. Satu Kemenkeu</Label>
                      <Input
                        id="agenda-filter-no-satu"
                        placeholder="Cari no. satu kemenkeu..."
                        value={filterPegawai}
                        onChange={(e) => setFilterPegawai(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                <AssignmentTable
                  assignments={assignments.filter(assignment => {
                    const matchPerihal = !filterPerihal || assignment.perihal.toLowerCase().includes(filterPerihal.toLowerCase());
                    const matchLokasi = !filterLokasi || assignment.tempat_penugasan.toLowerCase().includes(filterLokasi.toLowerCase());
                    const matchUnitPemohon = !filterUnitPemohon || assignment.unit_pemohon.toLowerCase().includes(filterUnitPemohon.toLowerCase());
                    const matchNoSatu = !filterPegawai || (assignment.no_satu_kemenkeu && assignment.no_satu_kemenkeu.toLowerCase().includes(filterPegawai.toLowerCase()));
                    const matchTujuan = !filterTujuan || (assignment as any).tujuan?.toLowerCase().includes(filterTujuan.toLowerCase());
                    const matchNomorND = !filterNomorND || (assignment as any).nomor_naskah_dinas?.toLowerCase().includes(filterNomorND.toLowerCase());
                    return matchPerihal && matchLokasi && matchUnitPemohon && matchNoSatu && matchTujuan && matchNomorND;
                  })}
                  timUpkList={timUpkList}
                  timKeuanganList={timKeuanganList}
                  isAdmin={isAdmin}
                  onEdit={handleEditAssignment}
                  onDelete={(id) => setDeleteId(id)}
                  onAssignUpk={(id) => {
                    setSelectedAssignmentId(id);
                    setAssignUpkDialogOpen(true);
                  }}
                  onAssignKeuangan={(id) => {
                    setSelectedAssignmentId(id);
                    setAssignKeuanganDialogOpen(true);
                  }}
                  onFeedback={(id) => {
                    setSelectedAssignmentId(id);
                    setFeedbackDialogOpen(true);
                  }}
                  onDownload={async (id, type) => {
                    const assignment = assignments.find(a => a.id === id);
                    if (!assignment) return;
                    
                    try {
                      if (type === "dasar") {
                        const documentPath = (assignment as any).document_path;
                        if (!documentPath) {
                          toast.error("Tidak ada dokumen dasar yang tersedia");
                          return;
                        }

                        const { data, error } = await supabase.storage
                          .from('assignment-documents')
                          .download(documentPath);

                        if (error) throw error;

                        const url = URL.createObjectURL(data);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = documentPath.split('/').pop() || 'dasar-penugasan';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        toast.success("Dokumen dasar berhasil diunduh");
                      } else if (type === "konsep") {
                        const konsepPath = (assignment as any).konsep_path;
                        if (!konsepPath) {
                          toast.error("Tidak ada dokumen konsep yang tersedia");
                          return;
                        }

                        const { data, error } = await supabase.storage
                          .from('konsep-documents')
                          .download(konsepPath);

                        if (error) throw error;

                        const url = URL.createObjectURL(data);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = konsepPath.split('/').pop() || 'konsep';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        toast.success("Dokumen konsep berhasil diunduh");
                      }
                    } catch (error) {
                      console.error('Error downloading document:', error);
                      toast.error("Gagal mengunduh dokumen");
                    }
                  }}
                  onGenerateNota={handleGenerateNotaDinas}
                  onGenerateSurat={handleGenerateSuratTugas}
                  onVerifikasiSuccess={fetchAssignments}
                  onDuplicate={handleDuplicateAssignment}
                />
              </Card>
              </>
            )}

            {/* Meja Section - Only for regular users */}
            {!isAdmin && role !== "overview" && (
              <Card className="p-6 mb-4">
                <h3 className="text-xl font-bold mb-4">
                  Meja
                  {isEselonFiltered && userEselonIII && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({userEselonIII})
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {eselonFilteredAssignments
                    .filter(a => {
                      // Only show assignments that are not yet completed
                      return !a.selesai_at;
                    })
                    .map((assignment) => {
                      const employeeNames = assignment.employee_ids
                        .map(id => employees.find(emp => emp.id === id)?.nm_pegawai)
                        .filter(Boolean) as string[];
                      const assignedUpk = timUpkList.find((upk: any) => upk.id === (assignment as any).assigned_upk_id);
                        
                      return (
                        <AssignmentCard
                          key={assignment.id}
                          assignment={assignment}
                          employeeNames={employeeNames}
                          onEdit={() => handleEditAssignment(assignment)}
                          onDelete={() => setDeleteId(assignment.id)}
                          onAssignToMe={() => handleAssignToMe(assignment.id)}
                          onGenerateNota={() => handleGenerateNotaDinas(assignment)}
                          onGenerateSurat={() => handleGenerateSuratTugas(assignment)}
                          onDuplicate={() => handleDuplicateAssignment(assignment)}
                          isAdmin={isAdmin}
                          assignedUpk={assignedUpk}
                          currentUserEmail={user?.email || ''}
                          timUpkList={timUpkList}
                          showTracking={false}
                          onArchive={() => handleArchiveAssignment(assignment.id)}
                          onRefresh={fetchAssignments}
                        />
                      );
                    })}
                </div>
              </Card>
            )}

            {/* Arsip Section - Only for regular users */}
            {!isAdmin && role !== "overview" && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">
                  Arsip
                  {isEselonFiltered && userEselonIII && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({userEselonIII})
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {eselonFilteredAssignments
                    .filter(a => {
                      // For user role: show assignments that are completed
                      return a.selesai_at;
                    })
                    .map((assignment) => {
                      const employeeNames = assignment.employee_ids
                        .map(id => employees.find(emp => emp.id === id)?.nm_pegawai)
                        .filter(Boolean) as string[];
                      const assignedUpk = timUpkList.find((upk: any) => upk.id === (assignment as any).assigned_upk_id);
                      const canRate = !!(assignment as any).no_satu_kemenkeu;
                        
                      return (
                        <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                                    No. Agenda: {assignment.agenda_number}
                                  </span>
                                </div>
                                <div className="text-lg font-bold text-primary">
                                  {assignment.perihal}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {assignment.tanggal_mulai_kegiatan && assignment.tanggal_selesai_kegiatan
                                    ? assignment.tanggal_mulai_kegiatan === assignment.tanggal_selesai_kegiatan
                                      ? new Date(assignment.tanggal_mulai_kegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                      : `${new Date(assignment.tanggal_mulai_kegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - ${new Date(assignment.tanggal_selesai_kegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                    : ''
                                  }
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {canEdit && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleUnarchiveAssignment(assignment.id)} 
                                    title="Batalkan Arsip"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                )}
                                {canRate && (
                                  <Button 
                                    variant="default"
                                    size="icon" 
                                    onClick={() => {
                                      setSelectedRatingAssignment(assignment);
                                      setRatingDialogOpen(true);
                                    }} 
                                    title="Beri Nilai"
                                    className="bg-blue-500 hover:bg-blue-600"
                                  >
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {/* Show existing rating if any */}
                              {(assignment as any).rating_penilaian && (
                              <div className="flex items-center gap-1 mt-2 p-2 bg-muted/50 rounded-lg">
                                <span className="text-xs text-muted-foreground">Rating:</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star} 
                                      className={`h-4 w-4 ${star <= (assignment as any).rating_penilaian ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                </div>
              </Card>
            )}

            {/* Rating Statistics Section - Only for regular users */}
            {!isAdmin && role !== "overview" && (
              <div className="mt-4">
                <RatingStatisticsCard ref={ratingStatsRef} />
              </div>
            )}
          </TabsContent>
          )}

{hasSubMenuAccess("surat-tugas:cek-status") && (
          <TabsContent value="assignments">
            {/* Filters with Search */}
            <Card className="p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-no-agenda">No. Agenda</Label>
                  <SearchableSelectFilter
                    id="filter-no-agenda"
                    placeholder="Pilih no. agenda"
                    value={filterNoAgenda}
                    onChange={setFilterNoAgenda}
                    options={assignments.map(a => String(a.agenda_number))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-konseptor">Konseptor</Label>
                  <SearchableSelectFilter
                    id="filter-konseptor"
                    placeholder="Pilih konseptor"
                    value={filterKonseptor}
                    onChange={setFilterKonseptor}
                    options={assignments.map(a => a.konseptor_name || "").filter(Boolean)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-tujuan">Tujuan Penugasan</Label>
                  <SearchableSelectFilter
                    id="filter-tujuan"
                    placeholder="Pilih tujuan penugasan"
                    value={filterTujuan}
                    onChange={setFilterTujuan}
                    options={assignments.map(a => (a as any).tujuan || "").filter(Boolean)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-lokasi">Lokasi Kegiatan</Label>
                  <SearchableSelectFilter
                    id="filter-lokasi"
                    placeholder="Pilih lokasi"
                    value={filterLokasi}
                    onChange={setFilterLokasi}
                    options={assignments.map(a => a.tempat_penugasan)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-pegawai">Pegawai</Label>
                  <SearchableSelectFilter
                    id="filter-pegawai"
                    placeholder="Pilih pegawai"
                    value={filterPegawai}
                    onChange={setFilterPegawai}
                    options={employees.map(e => e.nm_pegawai)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-unit-pemohon">Unit Pemohon</Label>
                  <SearchableSelectFilter
                    id="filter-unit-pemohon"
                    placeholder="Pilih unit pemohon"
                    value={filterUnitPemohon}
                    onChange={setFilterUnitPemohon}
                    options={assignments.map(a => a.unit_pemohon)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-unit-penerbit">Unit Penerbit</Label>
                  <SearchableSelectFilter
                    id="filter-unit-penerbit"
                    placeholder="Pilih unit penerbit"
                    value={filterUnitPenerbit}
                    onChange={setFilterUnitPenerbit}
                    options={assignments.map(a => a.unit_penerbit)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-tanggal-mulai">Tanggal Mulai</Label>
                  <Input
                    id="filter-tanggal-mulai"
                    type="date"
                    value={filterTanggalMulai}
                    onChange={(e) => setFilterTanggalMulai(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-tanggal-akhir">Tanggal Akhir</Label>
                  <Input
                    id="filter-tanggal-akhir"
                    type="date"
                    value={filterTanggalAkhir}
                    onChange={(e) => setFilterTanggalAkhir(e.target.value)}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterNoAgenda("");
                  setFilterKonseptor("");
                  setFilterPerihal("");
                  setFilterLokasi("");
                  setFilterPegawai("");
                  setFilterUnitPemohon("");
                  setFilterUnitPenerbit("");
                  setFilterTanggalMulai("");
                  setFilterTanggalAkhir("");
                }}
                className="mt-4"
              >
                Reset Filter
              </Button>
            </Card>

            {/* Completion Progress Bar - Using ProgressPenugasanBar */}
            <ProgressPenugasanBar 
              assignments={filteredAssignments} 
              onFilterChange={setProgressFilter}
              activeFilter={progressFilter}
            />

            {/* Assignment Cards - 2 columns with pagination */}
            {(() => {
              const totalItems = filteredAssignments.length;
              const totalPages = cekStatusPerPage === 0 ? 1 : Math.ceil(totalItems / cekStatusPerPage);
              const currentPage = Math.min(cekStatusPage, totalPages || 1);
              const paginatedAssignments = cekStatusPerPage === 0 
                ? filteredAssignments 
                : filteredAssignments.slice((currentPage - 1) * cekStatusPerPage, currentPage * cekStatusPerPage);
              
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      Menampilkan {paginatedAssignments.length} dari {totalItems} data
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Per halaman:</span>
                      <Select value={cekStatusPerPage.toString()} onValueChange={(v) => { setCekStatusPerPage(Number(v)); setCekStatusPage(1); }}>
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="0">All</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {paginatedAssignments.map((assignment) => {
                      const employeeNames = assignment.employee_ids
                        .map(id => employees.find(emp => emp.id === id)?.nm_pegawai)
                        .filter(Boolean) as string[];
                      const assignedUpk = timUpkList.find((upk: any) => upk.id === (assignment as any).assigned_upk_id);
                        
                      return (
                        <AssignmentCard
                          key={assignment.id}
                          assignment={assignment}
                          employeeNames={employeeNames}
                          onEdit={() => handleEditAssignment(assignment)}
                          onDelete={() => setDeleteId(assignment.id)}
                          onAssignToMe={() => {}}
                          onGenerateNota={() => handleGenerateNotaDinas(assignment)}
                          onGenerateSurat={() => handleGenerateSuratTugas(assignment)}
                          isAdmin={isAdmin}
                          assignedUpk={assignedUpk}
                          currentUserEmail={user?.email || ''}
                          timUpkList={timUpkList}
                          viewOnly={true}
                          onRefresh={fetchAssignments}
                        />
                      );
                    })}
                  </div>
                  {/* Pagination Controls */}
                  {cekStatusPerPage > 0 && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setCekStatusPage(currentPage - 1)}
                      >
                        Sebelumnya
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Halaman {currentPage} dari {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCekStatusPage(currentPage + 1)}
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
          </TabsContent>
          )}

          <TabsContent value="audit">
            <Card className="p-6">
              <AuditPenugasanTable isAdmin={isAdmin} canEdit={role !== "overview"} />
            </Card>
          </TabsContent>

          {hasSubMenuAccess("surat-tugas:st-luar-kantor") && (
            <TabsContent value="st-luar-kantor">
              <Card className="p-6 mb-4">
                <div className="flex justify-between items-center gap-2 flex-wrap mb-4">
                  <h3 className="text-xl font-bold">ST Luar Kantor</h3>
                  {isAdmin && (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => {
                          setSelectedSTLuarKantor(null);
                          setStLuarKantorDialogOpen(true);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Tambah ST LK
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          import("xlsx").then(XLSX => {
                            const exportData = stLuarKantor.map((r, i) => ({
                              "No": i + 1,
                              "Dasar Penugasan": r.dasar_penugasan,
                              "Hal": r.hal || "-",
                              "Tanggal Mulai": formatDate(new Date(r.tanggal_mulai), "dd/MM/yyyy"),
                              "Tanggal Selesai": formatDate(new Date(r.tanggal_selesai), "dd/MM/yyyy"),
                              "Lokasi": r.lokasi_penugasan,
                              "Waktu": r.waktu_penugasan || "-",
                            }));
                            const ws = XLSX.utils.json_to_sheet(exportData);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "ST Luar Kantor");
                            XLSX.writeFile(wb, `st_luar_kantor_${formatDate(new Date(), "yyyyMMdd")}.xlsx`);
                            toast.success("Data berhasil diekspor");
                          });
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Excel
                      </Button>
                      <label>
                        <Button variant="outline" asChild>
                          <span>
                            <FileText className="h-4 w-4 mr-2" />
                            Import Excel
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
                              const { data: { user: currentUser } } = await supabase.auth.getUser();
                              for (const row of jsonData as any[]) {
                                const { error } = await supabase.from("st_luar_kantor").insert({
                                  dasar_penugasan: row["Dasar Penugasan"] || "",
                                  hal: row["Hal"] !== "-" ? row["Hal"] : null,
                                  lokasi_penugasan: row["Lokasi"] || "",
                                  waktu_penugasan: row["Waktu"] !== "-" ? row["Waktu"] : null,
                                  tanggal_mulai: row["Tanggal Mulai"] || new Date().toISOString(),
                                  tanggal_selesai: row["Tanggal Selesai"] || new Date().toISOString(),
                                  employee_ids: [],
                                  created_by_email: currentUser?.email || null
                                });
                                if (!error) imported++;
                              }
                              toast.success(`${imported} data berhasil diimport`);
                              fetchSTLuarKantor();
                            };
                            reader.readAsArrayBuffer(file);
                          });
                          e.target.value = "";
                        }} />
                      </label>
                      {role === "admin" && (
                        <Button
                          variant="destructive"
                          onClick={async () => {
                            if (!confirm("Yakin ingin menghapus SEMUA data ST Luar Kantor? Tindakan ini tidak dapat dibatalkan.")) return;
                            const { error } = await supabase.from("st_luar_kantor").delete().neq("id", "");
                            if (error) {
                              toast.error("Gagal menghapus semua data");
                              return;
                            }
                            toast.success("Semua data berhasil dihapus");
                            fetchSTLuarKantor();
                          }}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Hapus Semua
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <STLuarKantorTable
                  records={stLuarKantor}
                  employees={employees}
                  onEdit={(record) => {
                    setSelectedSTLuarKantor(record);
                    setStLuarKantorDialogOpen(true);
                  }}
                  onDelete={(id) => setDeleteSTLKId(id)}
                  isAdmin={isAdmin}
                />
              </Card>
            </TabsContent>
          )}

          {hasSubMenuAccess("surat-tugas:realisasi-anggaran") && (
            <TabsContent value="realisasi-anggaran">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Realisasi Anggaran</h2>
                <p className="text-muted-foreground mb-6">
                  Monitoring dan laporan ketersediaan dana
                </p>
                <RealisasiAnggaranDashboard />
              </Card>
            </TabsContent>
          )}

          {hasSubMenuAccess("surat-tugas:rekap-realisasi-perjadin") && (
            <TabsContent value="rekap-realisasi-perjadin">
              <Card className="p-6">
                <RekapRealisasiPerjadinDashboard />
              </Card>
            </TabsContent>
          )}

          {hasSubMenuAccess("surat-tugas:tim-upk") && (
            <TabsContent value="tim-upk">
              <Card className="p-6">
                <TimUpkManagement />
              </Card>
            </TabsContent>
          )}

          {hasSubMenuAccess("surat-tugas:tim-keuangan") && (
            <TabsContent value="tim-keuangan">
              <Card className="p-6">
                <TimKeuanganManagement />
              </Card>
            </TabsContent>
          )}

        </Tabs>
      </div>

      {/* Dialogs */}
      <AssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        assignment={selectedAssignment}
        onSuccess={() => {
          fetchAssignments();
          setSelectedAssignment(null);
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Penugasan?</AlertDialogTitle>
            <AlertDialogDescription>
              Data yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAssignment}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteSTLKId} onOpenChange={() => setDeleteSTLKId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data ST Luar Kantor?</AlertDialogTitle>
            <AlertDialogDescription>
              Data yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSTLuarKantor}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <STLuarKantorDialog
        open={stLuarKantorDialogOpen}
        onOpenChange={setStLuarKantorDialogOpen}
        employees={employees}
        onSuccess={fetchSTLuarKantor}
        stData={selectedSTLuarKantor}
      />

      {/* Voicebot Dialog */}
      <Dialog open={voicebotOpen} onOpenChange={setVoicebotOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Voicebot Asisten</DialogTitle>
          </DialogHeader>
          <Voicebot />
        </DialogContent>
      </Dialog>

      {/* Export Dialogs */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />

      <EmployeeRekapDialog
        open={rekapDialogOpen}
        onOpenChange={setRekapDialogOpen}
      />

      <AssignmentExportDialog
        open={assignmentExportDialogOpen}
        onOpenChange={setAssignmentExportDialogOpen}
      />

      <SPDExportDialog
        open={spdExportDialogOpen}
        onOpenChange={setSpdExportDialogOpen}
      />

      <BudgetConfirmationDialog
        open={budgetConfirmationOpen}
        onOpenChange={setBudgetConfirmationOpen}
        onConfirm={() => {
          setAssignmentDialogOpen(true);
        }}
      />

      {/* Feedback and Assign UPK Dialogs */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
        onSubmit={handleFeedbackSubmit}
        currentNo={selectedAssignmentId ? assignments.find(a => a.id === selectedAssignmentId)?.no_satu_kemenkeu : undefined}
        currentDate={selectedAssignmentId && assignments.find(a => a.id === selectedAssignmentId)?.tanggal_satu_kemenkeu 
          ? new Date(assignments.find(a => a.id === selectedAssignmentId)!.tanggal_satu_kemenkeu!) 
          : undefined}
      />

      <AssignUpkDialog
        open={assignUpkDialogOpen}
        onOpenChange={setAssignUpkDialogOpen}
        assignmentId={selectedAssignmentId || ''}
        assignmentType="assignment"
        timUpkList={timUpkList}
        onSuccess={() => {
          fetchAssignments();
          setSelectedAssignmentId(null);
        }}
      />

      <AssignKeuanganDialog
        open={assignKeuanganDialogOpen}
        onOpenChange={setAssignKeuanganDialogOpen}
        assignmentId={selectedAssignmentId || ''}
        timKeuanganList={timKeuanganList}
        onSuccess={() => {
          fetchAssignments();
          setSelectedAssignmentId(null);
        }}
      />

      {/* Rating Dialog for user role */}
      <RatingDialog
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        assignmentId={selectedRatingAssignment?.id || ''}
        perihal={selectedRatingAssignment?.perihal || ''}
        currentRating={(selectedRatingAssignment as any)?.rating_penilaian}
        currentSaran={(selectedRatingAssignment as any)?.saran_feedback}
        onSuccess={() => {
          fetchAssignments();
          setSelectedRatingAssignment(null);
          // Refresh rating statistics card
          ratingStatsRef.current?.refresh();
        }}
      />

      {/* Floating Voice Assistant */}
      <FloatingVoiceAssistant />
    </div>
  );
}
