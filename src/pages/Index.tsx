import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, Search, LogOut, Shield, Calendar, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import batikPattern from "@/assets/batik-pattern.png";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import EmployeeCard from "@/components/EmployeeCard";
import EmployeeTable from "@/components/EmployeeTable";
import AssignmentCard from "@/components/AssignmentCard";
import AssignmentDialog from "@/components/AssignmentDialog";
import ImportDialog from "@/components/ImportDialog";
import ExportDialog from "@/components/ExportDialog";
import EmployeeRekapDialog from "@/components/EmployeeRekapDialog";
import Dashboard from "@/pages/Dashboard";
import VoiceCommandSystem from "@/components/VoiceCommandSystem";
import NotificationBell from "@/components/NotificationBell";
import EmployeeDialog from "@/components/EmployeeDialog";
import Voicebot from "@/components/Voicebot";
import DataPokokTable from "@/components/DataPokokTable";
import PensiunTable from "@/components/PensiunTable";
import PendidikanTable from "@/components/PendidikanTable";
import PlhKepalaDialog from "@/components/PlhKepalaDialog";
import PlhKepalaCard from "@/components/PlhKepalaCard";
import AISearchBar from "@/components/AISearchBar";
import DataSidebar from "@/components/DataSidebar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Filter, X } from "lucide-react";

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
  created_by_email?: string;
  updated_by_email?: string;
  sumber?: string;
  assigned_upk_id?: string;
  assigned_upk_at?: string;
  assigned_upk_manually?: boolean;
}

interface TimUpk {
  id: string;
  name: string;
  email: string;
}

interface PlhKepala {
  id: string;
  unit_pemohon: string;
  unit_penerbit: string;
  dasar_penugasan: string;
  nomor_naskah_dinas: string;
  tanggal: string;
  perihal: string;
  employee_id: string;
  tanggal_plh_mulai?: string;
  tanggal_plh_selesai?: string;
  pejabat_unit_pemohon_id?: string;
  pejabat_unit_penerbit_id?: string;
  document_path?: string;
  agenda_number?: number;
  assigned_upk_id?: string;
  assigned_upk_at?: string;
  assigned_upk_manually?: boolean;
}

const Index = () => {
  const { user, role, fullName, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [plhKepalaList, setPlhKepalaList] = useState<PlhKepala[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [plhKepalaDialogOpen, setPlhKepalaDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedPlhKepala, setSelectedPlhKepala] = useState<PlhKepala | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePlhId, setDeletePlhId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [employeeRekapOpen, setEmployeeRekapOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [showVoicebot, setShowVoicebot] = useState(false);
  const [timUpkList, setTimUpkList] = useState<TimUpk[]>([]);
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(isAdmin ? "dashboard" : "assignments");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState<string>("Memuat lokasi...");
  
  // Assignment filters
  const [filterPerihal, setFilterPerihal] = useState("");
  const [filterUnitPemohon, setFilterUnitPemohon] = useState("");
  const [filterTempat, setFilterTempat] = useState("");
  const [filterEmployeeName, setFilterEmployeeName] = useState("");
  const [filterNoSatuKemenkeu, setFilterNoSatuKemenkeu] = useState("");
  const [filterTanggalKegiatan, setFilterTanggalKegiatan] = useState<Date | undefined>();
  
  // PLH Kepala filters
  const [filterPlhPerihal, setFilterPlhPerihal] = useState("");
  const [filterPlhUnitPemohon, setFilterPlhUnitPemohon] = useState("");
  const [filterPlhEmployeeName, setFilterPlhEmployeeName] = useState("");
  const [filterPlhNoSatuKemenkeu, setFilterPlhNoSatuKemenkeu] = useState("");
  const [filterPlhTanggal, setFilterPlhTanggal] = useState<Date | undefined>();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchEmployees = async () => {
    try {
      // Fetch all employees without limit
      let allEmployees: any[] = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .order("nm_pegawai", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allEmployees = [...allEmployees, ...data];
        
        if (data.length < pageSize) break;
        page++;
      }
      
      // Ensure all employees have nip field and match Employee interface
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
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data penugasan");
    }
  };

  const fetchPlhKepala = async () => {
    try {
      const { data, error } = await supabase
        .from("plh_kepala")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlhKepalaList(data || []);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data PLH Kepala");
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

  useEffect(() => {
    fetchEmployees();
    fetchAssignments();
    fetchPlhKepala();
    fetchTimUpk();

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Use reverse geocoding API (OpenStreetMap Nominatim)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=id`
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || "Lokasi tidak diketahui";
            const province = data.address?.state || "";
            setUserLocation(`${city}${province ? ', ' + province : ''}`);
          } catch (error) {
            console.error("Error getting location name:", error);
            setUserLocation("Lokasi tidak tersedia");
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setUserLocation("Lokasi tidak diaktifkan");
        }
      );
    } else {
      setUserLocation("Geolokasi tidak didukung");
    }

    return () => clearInterval(timeInterval);
  }, []);

  const filteredEmployees = employees.filter((emp) =>
    emp.nm_pegawai.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.uraian_jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.uraian_pangkat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nm_unit_organisasi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
      toast.success("Data pegawai berhasil dihapus!");
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus data");
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeDialogOpen(true);
  };

  const handleDeleteAssignment = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from("assignments").delete().eq("id", deleteId);
      if (error) throw error;
      
      toast.success("Data penugasan berhasil dihapus!");
      fetchAssignments();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus data");
    } finally {
      setDeleteId(null);
    }
  };

  const handleAddAssignment = () => {
    setSelectedAssignment(null);
    setAssignmentDialogOpen(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setAssignmentDialogOpen(true);
  };

  const handleAddPlhKepala = () => {
    setSelectedPlhKepala(null);
    setPlhKepalaDialogOpen(true);
  };

  const handleEditPlhKepala = (plhKepala: PlhKepala) => {
    setSelectedPlhKepala(plhKepala);
    setPlhKepalaDialogOpen(true);
  };

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

  const generateDocument = async (assignment: Assignment, type: 'nota' | 'surat') => {
    // Generate Nota Dinas
    if (type === 'nota') {
      try {
        toast.info('Generating Nota Dinas...');
        
        const { generateNotaDinas } = await import('@/utils/documentGenerator');
        
        const assignedEmployees = assignment.employee_ids
          .map(id => employees.find(emp => emp.id === id))
          .filter(Boolean)
          .map(emp => ({
            nm_pegawai: emp!.nm_pegawai,
            uraian_pangkat: emp!.uraian_pangkat,
            uraian_jabatan: emp!.uraian_jabatan,
          }));

        const signingOfficial = employees.find(emp => emp.id === assignment.pejabat_unit_penerbit_id);
        
        if (!signingOfficial) {
          toast.error('Pejabat unit penerbit tidak ditemukan');
          return;
        }

        await generateNotaDinas({
          nomor_surat: `ND-${assignment.agenda_number}/${new Date().getFullYear()}`,
          dasar_penugasan: assignment.dasar_penugasan,
          nomor_naskah_dinas: assignment.nomor_naskah_dinas,
          tanggal_naskah: assignment.tanggal_naskah,
          perihal: assignment.perihal,
          employees: assignedEmployees,
          tujuan: assignment.tujuan,
          tanggal_kegiatan: assignment.tanggal_mulai_kegiatan ? format(new Date(assignment.tanggal_mulai_kegiatan), "EEEE, dd MMMM yyyy", { locale: id }) : "",
          waktu_penugasan: assignment.waktu_penugasan,
          tempat_penugasan: assignment.tempat_penugasan,
          pejabat_penandatangan: {
            nm_pegawai: signingOfficial.nm_pegawai,
            uraian_pangkat: signingOfficial.uraian_pangkat,
            uraian_jabatan: signingOfficial.uraian_jabatan,
          },
          tanggal_surat: new Date(),
          unit_pemohon: assignment.unit_pemohon,
          unit_penerbit: assignment.unit_penerbit,
        });
        
        // Auto-assign Tim UPK if not already assigned
        // Only assign to members whose status is NOT "away"
        let upkId = (assignment as any).assigned_upk_id;
        if (!upkId) {
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
                return !profile || profile.user_status !== "away";
              });
              
              if (availableMembers.length > 0) {
                const selectedUpk = availableMembers[0];
                upkId = selectedUpk.id;
                
                // Update assignment count
                await supabase
                  .from("tim_upk")
                  .update({
                    assignment_count: (selectedUpk.assignment_count || 0) + 1,
                    last_assigned_at: new Date().toISOString()
                  })
                  .eq("id", selectedUpk.id);
              }
            }
          } catch (upkError) {
            console.warn("Could not auto-assign UPK:", upkError);
          }
        }
        
        // Update download status and assign Tim UPK
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
          .from('assignments')
          .update({
            nota_dinas_downloaded: true,
            nota_dinas_downloaded_at: new Date().toISOString(),
            nota_dinas_downloaded_by: user?.email || 'Unknown',
            assigned_upk_id: upkId,
            assigned_upk_at: upkId && !(assignment as any).assigned_upk_id ? new Date().toISOString() : (assignment as any).assigned_upk_at
          })
          .eq('id', assignment.id);
        
        // Send email notification
        try {
          await supabase.functions.invoke("send-download-notification", {
            body: {
              documentType: "Nota Dinas",
              agendaNumber: assignment.agenda_number,
              perihal: assignment.perihal,
              downloadedBy: user?.email || 'Unknown'
            }
          });
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }
        
        toast.success('Nota Dinas berhasil dibuat!');
        fetchAssignments(); // Refresh data
      } catch (error: any) {
        toast.error('Gagal membuat Nota Dinas: ' + error.message);
      }
      return;
    }

    // Generate Surat Tugas
    try {
      toast.info('Generating Surat Tugas...');
      
      const { generateSuratTugas } = await import('@/utils/documentGenerator');
      
      // Get employee details
      const assignedEmployees = assignment.employee_ids
        .map(id => employees.find(emp => emp.id === id))
        .filter(Boolean)
        .map(emp => ({
          nm_pegawai: emp!.nm_pegawai,
          uraian_pangkat: emp!.uraian_pangkat,
          uraian_jabatan: emp!.uraian_jabatan,
        }));

      const signingOfficial = employees.find(emp => emp.id === assignment.pejabat_unit_penerbit_id);
      
      if (!signingOfficial) {
        toast.error('Pejabat unit penerbit tidak ditemukan');
        return;
      }

      await generateSuratTugas({
        nomor_surat: `ST-${assignment.agenda_number}/${new Date().getFullYear()}`,
        dasar_penugasan: assignment.dasar_penugasan,
        nomor_naskah_dinas: assignment.nomor_naskah_dinas,
        tanggal_naskah: assignment.tanggal_naskah,
        perihal: assignment.perihal,
        employees: assignedEmployees,
        tujuan: assignment.tujuan,
        tanggal_kegiatan: assignment.tanggal_mulai_kegiatan ? format(new Date(assignment.tanggal_mulai_kegiatan), "EEEE, dd MMMM yyyy", { locale: id }) : "",
        waktu_penugasan: assignment.waktu_penugasan,
        tempat_penugasan: assignment.tempat_penugasan,
        pejabat_penandatangan: {
          nm_pegawai: signingOfficial.nm_pegawai,
          uraian_pangkat: signingOfficial.uraian_pangkat,
          uraian_jabatan: signingOfficial.uraian_jabatan,
        },
        tanggal_surat: new Date(),
        sumber: (assignment as any).sumber,
        sumber_satuan_kerja: (assignment as any).sumber_satuan_kerja,
        sumber_satuan_kerja_custom: (assignment as any).sumber_satuan_kerja_custom,
      });
      
      // Update download status
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('assignments')
        .update({
          surat_tugas_downloaded: true,
          surat_tugas_downloaded_at: new Date().toISOString(),
          surat_tugas_downloaded_by: user?.email || 'Unknown'
        })
        .eq('id', assignment.id);
      
      // Send email notification
      try {
        await supabase.functions.invoke("send-download-notification", {
          body: {
            documentType: "Surat Tugas",
            agendaNumber: assignment.agenda_number,
            perihal: assignment.perihal,
            downloadedBy: user?.email || 'Unknown'
          }
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
      
      toast.success('Surat Tugas berhasil dibuat!');
      fetchAssignments(); // Refresh data
    } catch (error: any) {
      toast.error('Gagal membuat Surat Tugas: ' + error.message);
    }
  };

  const getEmployeeNames = (employeeIds: string[]) => {
    return employeeIds
      .map(id => employees.find(emp => emp.id === id)?.nm_pegawai)
      .filter(Boolean) as string[];
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)?.nm_pegawai || "Tidak diketahui";
  };

  const handleAssignToMe = async (assignmentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Email pengguna tidak ditemukan");
        return;
      }

      // Check if user is admin
      if (!isAdmin) {
        toast.error("Hanya admin yang dapat mengambil penugasan");
        return;
      }

      // Find Tim UPK member by email
      const upkMember = timUpkList.find(upk => upk.email === user.email);
      
      if (upkMember) {
        // If admin is also in Tim UPK list, assign with Tim UPK tracking
        const { error } = await supabase
          .from('assignments')
          .update({
            assigned_upk_id: upkMember.id,
            assigned_upk_at: new Date().toISOString(),
            assigned_upk_manually: true
          })
          .eq('id', assignmentId);

        if (error) throw error;

        // Update Tim UPK stats
        await supabase
          .from('tim_upk')
          .update({
            assignment_count: (upkMember as any).assignment_count + 1,
            last_assigned_at: new Date().toISOString()
          })
          .eq('id', upkMember.id);
      } else {
        // If admin is not in Tim UPK list, just mark as manually assigned
        const { error } = await supabase
          .from('assignments')
          .update({
            assigned_upk_at: new Date().toISOString(),
            assigned_upk_manually: true,
            updated_by_email: user.email
          })
          .eq('id', assignmentId);

        if (error) throw error;
      }

      toast.success(`Penugasan berhasil diambil oleh ${fullName || user.email}!`);
      fetchAssignments();
      fetchTimUpk();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengambil penugasan");
    }
  };

  const getAssignedUpk = (assignment: Assignment) => {
    if (!assignment.assigned_upk_id) return null;
    return timUpkList.find(upk => upk.id === assignment.assigned_upk_id);
  };

  const getAssignedUpkPlh = (plhKepala: PlhKepala) => {
    if (!plhKepala.assigned_upk_id) return null;
    return timUpkList.find(upk => upk.id === plhKepala.assigned_upk_id);
  };

  // Filtered assignments
  const filteredAssignments = assignments.filter((assignment) => {
    let matches = true;
    
    // Filter by perihal
    if (filterPerihal && !assignment.perihal?.toLowerCase().includes(filterPerihal.toLowerCase())) {
      matches = false;
    }
    
    // Filter by unit pemohon
    if (filterUnitPemohon && !assignment.unit_pemohon?.toLowerCase().includes(filterUnitPemohon.toLowerCase())) {
      matches = false;
    }
    
    // Filter by tempat
    if (filterTempat && !assignment.tempat_penugasan?.toLowerCase().includes(filterTempat.toLowerCase())) {
      matches = false;
    }
    
    // Filter by employee name
    if (filterEmployeeName) {
      const employeeNames = getEmployeeNames(assignment.employee_ids);
      const hasMatchingEmployee = employeeNames.some(name => 
        name.toLowerCase().includes(filterEmployeeName.toLowerCase())
      );
      if (!hasMatchingEmployee) {
        matches = false;
      }
    }
    
    // Filter by nomor satu kemenkeu
    if (filterNoSatuKemenkeu && !(assignment as any).no_satu_kemenkeu?.toLowerCase().includes(filterNoSatuKemenkeu.toLowerCase())) {
      matches = false;
    }
    
    // Filter by tanggal kegiatan
    if (filterTanggalKegiatan && assignment.tanggal_mulai_kegiatan) {
      const assignmentDate = format(new Date(assignment.tanggal_mulai_kegiatan), "yyyy-MM-dd");
      const filterDate = format(filterTanggalKegiatan, "yyyy-MM-dd");
      if (assignmentDate !== filterDate) {
        matches = false;
      }
    }
    
    return matches;
  });

  // Filtered PLH Kepala
  const filteredPlhKepala = plhKepalaList.filter((plh) => {
    let matches = true;
    
    // Filter by perihal
    if (filterPlhPerihal && !plh.perihal?.toLowerCase().includes(filterPlhPerihal.toLowerCase())) {
      matches = false;
    }
    
    // Filter by unit pemohon
    if (filterPlhUnitPemohon && !plh.unit_pemohon?.toLowerCase().includes(filterPlhUnitPemohon.toLowerCase())) {
      matches = false;
    }
    
    // Filter by employee name
    if (filterPlhEmployeeName) {
      const employeeName = getEmployeeName(plh.employee_id);
      if (!employeeName.toLowerCase().includes(filterPlhEmployeeName.toLowerCase())) {
        matches = false;
      }
    }
    
    // Filter by nomor satu kemenkeu
    if (filterPlhNoSatuKemenkeu && !(plh as any).no_satu_kemenkeu?.toLowerCase().includes(filterPlhNoSatuKemenkeu.toLowerCase())) {
      matches = false;
    }
    
    // Filter by tanggal
    if (filterPlhTanggal && plh.tanggal) {
      const plhDate = format(new Date(plh.tanggal), "yyyy-MM-dd");
      const filterDate = format(filterPlhTanggal, "yyyy-MM-dd");
      if (plhDate !== filterDate) {
        matches = false;
      }
    }
    
    return matches;
  });

  const clearAssignmentFilters = () => {
    setFilterPerihal("");
    setFilterUnitPemohon("");
    setFilterTempat("");
    setFilterEmployeeName("");
    setFilterNoSatuKemenkeu("");
    setFilterTanggalKegiatan(undefined);
  };

  const clearPlhFilters = () => {
    setFilterPlhPerihal("");
    setFilterPlhUnitPemohon("");
    setFilterPlhEmployeeName("");
    setFilterPlhNoSatuKemenkeu("");
    setFilterPlhTanggal(undefined);
  };

  const handleAssignToMePlh = async (plhKepalaId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Anda harus login terlebih dahulu");
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const fullName = profile?.full_name;
      const upkMember = timUpkList.find(upk => upk.email === user.email);
      
      if (upkMember) {
        // If admin is also in Tim UPK list, assign with Tim UPK tracking
        const { error } = await supabase
          .from('plh_kepala')
          .update({
            assigned_upk_id: upkMember.id,
            assigned_upk_at: new Date().toISOString(),
            assigned_upk_manually: true
          })
          .eq('id', plhKepalaId);

        if (error) throw error;

        // Update Tim UPK count
        await supabase
          .from('tim_upk')
          .update({
            assignment_count: (upkMember as any).assignment_count + 1,
            last_assigned_at: new Date().toISOString()
          })
          .eq('id', upkMember.id);
      } else {
        // Admin not in Tim UPK list
        const { error } = await supabase
          .from('plh_kepala')
          .update({
            assigned_upk_at: new Date().toISOString(),
            assigned_upk_manually: true
          })
          .eq('id', plhKepalaId);

        if (error) throw error;
      }

      toast.success(`PLH Kepala berhasil diambil oleh ${fullName || user.email}!`);
      fetchPlhKepala();
      fetchTimUpk();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengambil PLH Kepala");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Blue Header with Logos and Batik Pattern */}
      <div 
        className="bg-[#1e5ba8] text-white sticky top-0 z-10 shadow-lg relative overflow-hidden"
        style={{
          backgroundImage: `url(${batikPattern})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
        }}
      >
        <div className="absolute inset-0 bg-[#1e5ba8]/85 backdrop-blur-sm"></div>
        <div className={`container mx-auto py-6 relative z-10 ${isAdmin ? 'pl-16 pr-4' : 'px-4'}`}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img src={logoKemenkeu} alt="Kementerian Keuangan" className="h-14 w-auto drop-shadow-lg" />
                <img src="/src/assets/logo-customs.png" alt="Customs" className="h-12 w-auto drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Customs HR Administration</h1>
                <p className="text-sm text-blue-100">Kanwil DJBC Jawa Timur I</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <div className="text-right space-y-0.5">
                    <p className="text-sm font-semibold text-white">
                      {(() => {
                        const hour = currentTime.getHours();
                        let greeting = "";
                        if (hour >= 5 && hour < 11) greeting = "Selamat Pagi";
                        else if (hour >= 11 && hour < 15) greeting = "Selamat Siang";
                        else if (hour >= 15 && hour < 19) greeting = "Selamat Sore";
                        else greeting = "Selamat Malam";
                        return `${greeting}, ${fullName || user.email}`;
                      })()}
                    </p>
                    <p className="text-xs text-blue-100">
                      <span className="capitalize font-medium">
                        {role === "admin" ? "Administrator" : "User"}
                      </span>
                      {" • "}
                      {format(currentTime, "dd MMM yyyy", { locale: id })}
                      {" • "}
                      {userLocation}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate("/admin")}
                      className="text-white hover:bg-white/20"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Panel Admin
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowVoicebot(!showVoicebot)}
                    className="text-white hover:bg-white/20"
                  >
                    {showVoicebot ? "Tutup Voicebot" : "Buka Voicebot"}
                  </Button>
                  <NotificationBell />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={signOut}
                    className="text-white hover:bg-white/20"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Keluar
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="relative">
            <AISearchBar 
              externalQuery={aiSearchQuery}
              onResultsFound={(results) => {
                console.log('AI Search results:', results);
              }} 
            />
          </div>
        </div>
      </div>

      {/* Data Sidebar */}
      {isAdmin && <DataSidebar />}

      {/* Main Content */}
      <div className={`container mx-auto py-6 ${isAdmin ? 'pl-16 pr-4' : 'px-4'}`}>
        {showVoicebot && (
          <div className="mb-6">
            <Voicebot />
          </div>
        )}
        
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Memuat data...</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={isAdmin ? "dashboard" : "assignments"} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex justify-between items-center">
              <TabsList>
                {isAdmin && <TabsTrigger value="dashboard">Dashboard</TabsTrigger>}
                <TabsTrigger value="assignments">Data Penugasan</TabsTrigger>
                {isAdmin && <TabsTrigger value="plhkepala">Plh Kepala</TabsTrigger>}
                {isAdmin && <TabsTrigger value="employees">Daftar Pegawai</TabsTrigger>}
              </TabsList>
              {activeTab === "assignments" && (
                <Button onClick={handleAddAssignment}>
                  <Plus className="w-4 h-4 mr-2" />
                  Entry Data Penugasan
                </Button>
              )}
              {activeTab === "plhkepala" && isAdmin && (
                <Button onClick={handleAddPlhKepala}>
                  <Plus className="w-4 h-4 mr-2" />
                  Entry Data PLH Kepala
                </Button>
              )}
            </div>

            {isAdmin && (
              <TabsContent value="dashboard">
                <Dashboard />
              </TabsContent>
            )}

            <TabsContent value="assignments" className="space-y-4">
              {/* Assignment Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Filter Data Penugasan</h3>
                    {(filterPerihal || filterUnitPemohon || filterTempat || filterEmployeeName || filterNoSatuKemenkeu || filterTanggalKegiatan) && (
                      <Button variant="ghost" size="sm" onClick={clearAssignmentFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Reset Filter
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Filter Perihal</label>
                      <Input
                        placeholder="Cari perihal..."
                        value={filterPerihal}
                        onChange={(e) => setFilterPerihal(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Filter Unit Pemohon</label>
                      <Input
                        placeholder="Cari unit pemohon..."
                        value={filterUnitPemohon}
                        onChange={(e) => setFilterUnitPemohon(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Filter Tempat</label>
                      <Input
                        placeholder="Cari tempat..."
                        value={filterTempat}
                        onChange={(e) => setFilterTempat(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Filter Nama Pegawai</label>
                      <Input
                        placeholder="Cari nama pegawai..."
                        value={filterEmployeeName}
                        onChange={(e) => setFilterEmployeeName(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Filter No. Satu Kemenkeu</label>
                      <Input
                        placeholder="Cari nomor..."
                        value={filterNoSatuKemenkeu}
                        onChange={(e) => setFilterNoSatuKemenkeu(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Filter Tanggal Kegiatan</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start h-9 font-normal">
                            <Calendar className="mr-2 h-4 w-4" />
                            {filterTanggalKegiatan ? format(filterTanggalKegiatan, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={filterTanggalKegiatan}
                            onSelect={setFilterTanggalKegiatan}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {filteredAssignments.length} dari {assignments.length} data penugasan
                </div>
                {assignments.length > 0 && (
                  <div className="flex gap-2">
                    <Button onClick={() => setExportOpen(true)} variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Export Excel
                    </Button>
                    <Button onClick={() => setEmployeeRekapOpen(true)} variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Rekap ST Pegawai
                    </Button>
                  </div>
                )}
              </div>
              {filteredAssignments.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <p className="text-muted-foreground mb-4">
                      {assignments.length === 0 ? "Belum ada data penugasan" : "Tidak ada data yang sesuai dengan filter"}
                    </p>
                    {assignments.length === 0 && (
                      <Button onClick={handleAddAssignment}>
                        <Plus className="w-4 h-4 mr-2" />
                        Buat Penugasan Pertama
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                  {filteredAssignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      employeeNames={getEmployeeNames(assignment.employee_ids)}
                      onEdit={() => handleEditAssignment(assignment)}
                      onDelete={isAdmin ? () => setDeleteId(assignment.id) : undefined}
                      onGenerateNota={() => generateDocument(assignment, 'nota')}
                      onGenerateSurat={isAdmin ? () => generateDocument(assignment, 'surat') : undefined}
                      isAdmin={isAdmin}
                      assignedUpk={getAssignedUpk(assignment)}
                      onAssignToMe={() => handleAssignToMe(assignment.id)}
                      currentUserEmail={user?.email || ''}
                      timUpkList={timUpkList}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {isAdmin && (
              <TabsContent value="plhkepala" className="space-y-4">
                {/* PLH Kepala Filters */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Filter PLH Kepala</h3>
                      {(filterPlhPerihal || filterPlhUnitPemohon || filterPlhEmployeeName || filterPlhNoSatuKemenkeu || filterPlhTanggal) && (
                        <Button variant="ghost" size="sm" onClick={clearPlhFilters}>
                          <X className="h-4 w-4 mr-1" />
                          Reset Filter
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium mb-1 block">Filter Perihal</label>
                        <Input
                          placeholder="Cari perihal..."
                          value={filterPlhPerihal}
                          onChange={(e) => setFilterPlhPerihal(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Filter Unit Pemohon</label>
                        <Input
                          placeholder="Cari unit pemohon..."
                          value={filterPlhUnitPemohon}
                          onChange={(e) => setFilterPlhUnitPemohon(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Filter Nama Pegawai</label>
                        <Input
                          placeholder="Cari nama pegawai..."
                          value={filterPlhEmployeeName}
                          onChange={(e) => setFilterPlhEmployeeName(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Filter No. Satu Kemenkeu</label>
                        <Input
                          placeholder="Cari nomor..."
                          value={filterPlhNoSatuKemenkeu}
                          onChange={(e) => setFilterPlhNoSatuKemenkeu(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Filter Tanggal</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start h-9 font-normal">
                              <Calendar className="mr-2 h-4 w-4" />
                              {filterPlhTanggal ? format(filterPlhTanggal, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={filterPlhTanggal}
                              onSelect={setFilterPlhTanggal}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {filteredPlhKepala.length} dari {plhKepalaList.length} data PLH Kepala
                  </div>
                </div>
                {filteredPlhKepala.length === 0 ? (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <p className="text-muted-foreground mb-4">
                        {plhKepalaList.length === 0 ? "Belum ada data PLH Kepala" : "Tidak ada data yang sesuai dengan filter"}
                      </p>
                      {plhKepalaList.length === 0 && (
                        <Button onClick={handleAddPlhKepala}>
                          <Plus className="w-4 h-4 mr-2" />
                          Buat Data PLH Kepala Pertama
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {filteredPlhKepala.map((plhKepala) => (
                      <PlhKepalaCard
                        key={plhKepala.id}
                        plhKepala={plhKepala}
                        employeeName={getEmployeeName(plhKepala.employee_id)}
                        onEdit={() => handleEditPlhKepala(plhKepala)}
                        onDelete={() => setDeletePlhId(plhKepala.id)}
                        onAssignToMe={() => handleAssignToMePlh(plhKepala.id)}
                        isAdmin={isAdmin}
                        assignedUpk={getAssignedUpkPlh(plhKepala)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value="employees" className="space-y-4">
                {employees.length === 0 ? (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <p className="text-muted-foreground mb-4">Belum ada data pegawai</p>
                      <Button onClick={() => setImportOpen(true)}>
                        Import Data CSV
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <EmployeeTable
                    employees={employees}
                    onEdit={handleEditEmployee}
                    onDelete={handleDeleteEmployee}
                    onRefresh={fetchEmployees}
                  />
                )}
              </TabsContent>
            )}

          </Tabs>
        )}
      </div>

      {/* Dialogs */}
      <AssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        assignment={selectedAssignment}
        onSuccess={() => {
          fetchAssignments();
          setAssignmentDialogOpen(false);
        }}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={fetchEmployees}
      />

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
      />

      <EmployeeRekapDialog
        open={employeeRekapOpen}
        onOpenChange={setEmployeeRekapOpen}
      />

      <EmployeeDialog
        open={employeeDialogOpen}
        onOpenChange={setEmployeeDialogOpen}
        employee={selectedEmployee}
        onSuccess={() => {
          fetchEmployees();
          setEmployeeDialogOpen(false);
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAssignment}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PlhKepalaDialog
        open={plhKepalaDialogOpen}
        onOpenChange={setPlhKepalaDialogOpen}
        plhKepala={selectedPlhKepala}
        onSuccess={() => {
          fetchPlhKepala();
          setPlhKepalaDialogOpen(false);
        }}
      />

      <AlertDialog open={!!deletePlhId} onOpenChange={() => setDeletePlhId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data PLH Kepala ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlhKepala}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {user && (
        <VoiceCommandSystem
          onSearch={(query) => {
            // Trigger AI search from voice command
            setAiSearchQuery(query);
            toast.info(`Mencari: ${query}`);
          }}
          onCommand={(command, params) => {
            switch (command) {
              case "open_assignment_dialog":
                handleAddAssignment();
                break;
              case "open_employee_dialog":
                setImportOpen(true);
                break;
              case "export_data":
                setExportOpen(true);
                break;
              case "search":
                setSearchTerm(params.term);
                break;
            }
          }}
        />
      )}
    </div>
  );
};

export default Index;