import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Building2, Pencil, Trash2, Download, UserPlus, MessageSquare, ArchiveRestore, Archive, Check, FileText } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TrackingProgress from "./TrackingProgress";
import FeedbackDialog from "./FeedbackDialog";
import AssignUpkDialog from "./AssignUpkDialog";
import { useState } from "react";
import { generateNDPlh, generateNDPlt, generatePRINPlh, generatePRINPlt } from "@/utils/plhPltDocumentGenerator";

interface PlhKepala {
  id: string;
  unit_pemohon: string;
  unit_penerbit: string;
  nomor_naskah_dinas: string;
  tanggal: string;
  perihal: string;
  employee_id: string;
  employee_ids?: string[];
  document_path?: string;
  agenda_number?: number;
  assigned_upk_id?: string;
  assigned_upk_at?: string;
  assigned_upk_manually?: boolean;
  tanggal_plh_mulai?: string;
  tanggal_plh_selesai?: string;
  konsep_masuk_at?: string;
  konsep_masuk_by?: string;
  proses_nd_at?: string;
  proses_nd_by?: string;
  proses_st_at?: string;
  proses_st_by?: string;
  selesai_at?: string;
  selesai_by?: string;
  no_satu_kemenkeu?: string;
  tanggal_satu_kemenkeu?: string;
  jenis_plh_plt?: 'PLH' | 'PLT';
  dasar_penugasan?: string;
  pejabat_unit_pemohon_id?: string;
  pejabat_unit_penerbit_id?: string;
}

interface TimUpk {
  id: string;
  name: string;
  email: string;
}

interface PlhKepalaCardProps {
  plhKepala: PlhKepala;
  employeeName: string;
  onEdit: () => void;
  onDelete: () => void;
  onAssignToMe: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  isArchived?: boolean;
  isAdmin?: boolean;
  canEdit?: boolean;
  assignedUpk?: TimUpk | null;
  hideTracking?: boolean;
  showStatusLayout?: boolean;
  showGeneratorButtons?: boolean;
}

export default function PlhKepalaCard({ plhKepala, employeeName, onEdit, onDelete, onAssignToMe, onArchive, onUnarchive, isArchived = false, isAdmin = false, canEdit = true, assignedUpk, hideTracking = false, showStatusLayout = false, showGeneratorButtons = false }: PlhKepalaCardProps) {
  const isUser = !isAdmin;
  const canModify = canEdit && !isAdmin ? true : isAdmin;
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [assignUpkDialogOpen, setAssignUpkDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timUpkList, setTimUpkList] = useState<any[]>([]);

  // Fetch Tim UPK list
  useState(() => {
    const fetchTimUpk = async () => {
      try {
        const { data } = await supabase.from("tim_upk").select("*").order("name");
        setTimUpkList(data || []);
      } catch (error) {
        console.error("Error fetching Tim UPK:", error);
      }
    };
    fetchTimUpk();
  });
  const handleDownloadDocument = async () => {
    if (!plhKepala.document_path) {
      toast.error("Tidak ada dokumen yang tersedia");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('konsideran-documents')
        .download(plhKepala.document_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ND-PLH-Agenda-${plhKepala.agenda_number || 'unknown'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Dokumen berhasil diunduh");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunduh dokumen");
    }
  };

  const handleChecklistND = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || "unknown";

      // Get all Tim UPK members and filter by status (exclude "away")
      let nextUpkId = null;
      try {
        const { data: upkMembers } = await supabase
          .from("tim_upk")
          .select("*")
          .order("assignment_count", { ascending: true })
          .order("last_assigned_at", { ascending: true, nullsFirst: true });
        
        if (upkMembers && upkMembers.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("email, user_status");
          
          const availableMembers = upkMembers.filter(member => {
            const profile = profiles?.find(p => p.email === member.email);
            return !profile || profile.user_status !== "away";
          });
          
          if (availableMembers.length > 0) {
            const selectedUpk = availableMembers[0];
            nextUpkId = selectedUpk.id;
            
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

      // Update the PLH record with konsep_masuk timestamp and assign to Tim UPK
      await supabase
        .from("plh_kepala")
        .update({
          konsep_masuk_at: new Date().toISOString(),
          konsep_masuk_by: email,
          assigned_upk_id: nextUpkId,
          assigned_upk_at: nextUpkId ? new Date().toISOString() : null,
          assigned_upk_manually: false,
        })
        .eq("id", plhKepala.id);

      // Get the assigned UPK member details for notification
      const { data: upkMember } = await supabase
        .from("tim_upk")
        .select("email, name")
        .eq("id", nextUpkId)
        .single();

      // Get the UPK user_id from profiles
      if (upkMember) {
        const { data: upkProfile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", upkMember.email)
          .single();

        if (upkProfile) {
          // Create notification for Tim UPK
          await supabase
            .from("notifications")
            .insert({
              user_id: upkProfile.user_id,
              title: `Konsep Masuk - Agenda #${plhKepala.agenda_number}`,
              message: `Konsep dengan perihal "${plhKepala.perihal}" telah masuk dan ditugaskan kepada Anda.`,
              is_read: false,
            });
        }
      }

      toast.success("Checklist ND berhasil dan ditugaskan ke Tim UPK");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Gagal checklist ND");
    }
  };

  const handleChecklistPRIN = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || "unknown";

      await supabase
        .from("plh_kepala")
        .update({
          proses_st_at: new Date().toISOString(),
          proses_st_by: email,
        })
        .eq("id", plhKepala.id);

      // Get the assigned UPK member details for notification
      if (plhKepala.assigned_upk_id) {
        const { data: upkMember } = await supabase
          .from("tim_upk")
          .select("email, name")
          .eq("id", plhKepala.assigned_upk_id)
          .single();

        // Get the UPK user_id from profiles
        if (upkMember) {
          const { data: upkProfile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("email", upkMember.email)
            .single();

          if (upkProfile) {
            // Create notification for Tim UPK when entering Proses ND
            await supabase
              .from("notifications")
              .insert({
                user_id: upkProfile.user_id,
                title: `Proses ND - Agenda #${plhKepala.agenda_number}`,
                message: `Penugasan dengan perihal "${plhKepala.perihal}" telah masuk ke tahap Proses ND.`,
                is_read: false,
              });
          }
        }
      }

      toast.success("Checklist PRIN berhasil");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Gagal checklist PRIN");
    }
  };

  const handleGenerateND = async () => {
    try {
      setIsGenerating(true);
      toast.info("Generating Nota Dinas...");
      
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || "unknown";
      
      // Auto-assign Tim UPK if not already assigned (exclude "away" status)
      if (!plhKepala.assigned_upk_id) {
        try {
          const { data: upkMembers } = await supabase
            .from("tim_upk")
            .select("*")
            .order("assignment_count", { ascending: true })
            .order("last_assigned_at", { ascending: true, nullsFirst: true });
          
          if (upkMembers && upkMembers.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("email, user_status");
            
            const availableMembers = upkMembers.filter(member => {
              const profile = profiles?.find(p => p.email === member.email);
              return !profile || profile.user_status !== "away";
            });
            
            if (availableMembers.length > 0) {
              const selectedUpk = availableMembers[0];
              
              await supabase
                .from("plh_kepala")
                .update({
                  assigned_upk_id: selectedUpk.id,
                  assigned_upk_at: new Date().toISOString(),
                  assigned_upk_manually: false,
                })
                .eq("id", plhKepala.id);
              
              await supabase
                .from("tim_upk")
                .update({
                  assignment_count: (selectedUpk.assignment_count || 0) + 1,
                  last_assigned_at: new Date().toISOString()
                })
                .eq("id", selectedUpk.id);
              
              toast.success("Tim UPK berhasil ditunjuk secara otomatis");
            }
          }
        } catch (upkError) {
          console.warn("Could not auto-assign UPK:", upkError);
        }
      }
      
      // Call appropriate generator based on jenis_plh_plt
      if (plhKepala.jenis_plh_plt === 'PLT') {
        await generateNDPlt(plhKepala);
      } else {
        await generateNDPlh(plhKepala);
      }
      
      // Prepare update data
      const updateData: any = {
        proses_nd_at: new Date().toISOString(),
        proses_nd_by: email,
      };
      
      // For non-admin users, automatically archive (move to Arsip) when generating ND
      if (!isAdmin) {
        updateData.selesai_at = new Date().toISOString();
        updateData.selesai_by = email;
      }
      
      // Update Proses ND tracking
      await supabase
        .from("plh_kepala")
        .update(updateData)
        .eq("id", plhKepala.id);
      
      toast.success("Nota Dinas berhasil di-generate!");
      
      // Reload to show updated assignment
      window.location.reload();
    } catch (error: any) {
      console.error("Error generating ND:", error);
      toast.error(error.message || "Gagal generate Nota Dinas");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePRIN = async () => {
    try {
      setIsGenerating(true);
      toast.info("Generating Surat Perintah...");
      
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || "unknown";
      
      // Call appropriate generator based on jenis_plh_plt
      if (plhKepala.jenis_plh_plt === 'PLT') {
        await generatePRINPlt(plhKepala);
      } else {
        await generatePRINPlh(plhKepala);
      }
      
      // Update Proses PRIN tracking
      await supabase
        .from("plh_kepala")
        .update({
          proses_st_at: new Date().toISOString(),
          proses_st_by: email,
        })
        .eq("id", plhKepala.id);
      
      toast.success("Surat Perintah berhasil di-generate!");
      
      // Reload to show updated data
      window.location.reload();
    } catch (error: any) {
      console.error("Error generating PRIN:", error);
      toast.error(error.message || "Gagal generate Surat Perintah");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFeedbackSubmit = async (noSatuKemenkeu: string, tanggalSatuKemenkeu: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || "unknown";

      // Get the PLH record with creator email
      const { data: plhRecord } = await supabase
        .from("plh_kepala")
        .select("konsep_masuk_by")
        .eq("id", plhKepala.id)
        .single();

      // Update only the feedback data, don't mark as selesai yet
      await supabase
        .from("plh_kepala")
        .update({
          no_satu_kemenkeu: noSatuKemenkeu,
          tanggal_satu_kemenkeu: format(tanggalSatuKemenkeu, "yyyy-MM-dd"),
        })
        .eq("id", plhKepala.id);

      // Notify all admins AND the creator that the process is complete (SELESAI stage)
      const notificationsToSend: any[] = [];
      
      // Get all admin users
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("user_id, email") as any;
      
      if (adminProfiles) {
        // Add notification for creator
        if (plhRecord?.konsep_masuk_by) {
          const creatorProfile = adminProfiles.find((p: any) => p.email === plhRecord.konsep_masuk_by);
          if (creatorProfile) {
            notificationsToSend.push({
              user_id: creatorProfile.user_id,
              title: `Penugasan Selesai - Agenda #${plhKepala.agenda_number}`,
              message: `Penugasan ${plhKepala.jenis_plh_plt || 'PLH'} dengan perihal "${plhKepala.perihal}" telah selesai diproses dengan No. Satu Kemenkeu: ${noSatuKemenkeu}.`,
              is_read: false,
            });
          }
        }
        
        // Add notifications for all other admins
        const otherAdmins = adminProfiles.filter(
          (p: any) => p.email !== plhRecord?.konsep_masuk_by && p.email !== email
        );
        otherAdmins.forEach((admin: any) => {
          notificationsToSend.push({
            user_id: admin.user_id,
            title: `Penugasan Selesai - Agenda #${plhKepala.agenda_number}`,
            message: `Penugasan ${plhKepala.jenis_plh_plt || 'PLH'} dengan perihal "${plhKepala.perihal}" telah selesai diproses dengan No. Satu Kemenkeu: ${noSatuKemenkeu}.`,
            is_read: false,
          });
        });
        
        if (notificationsToSend.length > 0) {
          await supabase.from("notifications").insert(notificationsToSend);
        }
      }

      toast.success("Data Satu Kemenkeu berhasil disimpan");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    }
  };

  const formatPlhDates = () => {
    if (!plhKepala.tanggal_plh_mulai && !plhKepala.tanggal_plh_selesai) {
      return "-";
    }

    const startDate = plhKepala.tanggal_plh_mulai ? new Date(plhKepala.tanggal_plh_mulai) : null;
    const endDate = plhKepala.tanggal_plh_selesai ? new Date(plhKepala.tanggal_plh_selesai) : null;

    if (!startDate && !endDate) return "-";
    if (!endDate || (startDate && isSameDay(startDate, endDate))) {
      return format(startDate!, "dd MMMM yyyy", { locale: id });
    }

    const startDay = format(startDate!, "dd", { locale: id });
    const endDay = format(endDate, "dd", { locale: id });
    const startMonth = format(startDate!, "MMMM", { locale: id });
    const endMonth = format(endDate, "MMMM", { locale: id });
    const startYear = format(startDate!, "yyyy", { locale: id });
    const endYear = format(endDate, "yyyy", { locale: id });

    if (startYear !== endYear) {
      return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
    }
    if (startMonth !== endMonth) {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
    }
    return `${startDay}-${endDay} ${endMonth} ${endYear}`;
  };

  // Calculate if all tracking steps are completed
  const isFullyCompleted = !!(
    plhKepala.konsep_masuk_at &&
    plhKepala.proses_nd_at &&
    plhKepala.proses_st_at &&
    plhKepala.no_satu_kemenkeu &&
    plhKepala.tanggal_satu_kemenkeu
  );

  const trackingStages = [
    {
      label: "Konsep Masuk",
      completed: !!plhKepala.konsep_masuk_at,
      timestamp: plhKepala.konsep_masuk_at,
      email: plhKepala.konsep_masuk_by,
    },
    {
      label: "Proses ND",
      completed: !!plhKepala.proses_nd_at,
      timestamp: plhKepala.proses_nd_at,
      email: plhKepala.proses_nd_by,
    },
    {
      label: "Proses PRIN",
      completed: !!plhKepala.proses_st_at,
      timestamp: plhKepala.proses_st_at,
      email: plhKepala.proses_st_by,
    },
    {
      label: "Selesai",
      completed: isFullyCompleted,
      timestamp: plhKepala.tanggal_satu_kemenkeu,
      email: plhKepala.selesai_by,
    },
  ];

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                  No. Agenda : {plhKepala.agenda_number || '-'}
                </span>
              </div>
              <div className="text-lg font-bold text-primary mb-1">
                {plhKepala.perihal}
              </div>
              <div className="text-sm text-muted-foreground font-normal">
                {plhKepala.nomor_naskah_dinas}
              </div>
            </div>
            <div className="flex gap-1">
              {/* Untuk admin: hapus archive/unarchive di Form Permohonan, tampilkan di Status */}
              {/* Untuk user: tampilkan archive di Form Permohonan, hapus feedback & assign to me */}
              
              {isArchived && onUnarchive && !isAdmin && canEdit && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onUnarchive} 
                  title="Batalkan Arsip"
                >
                  <ArchiveRestore className="h-4 w-4" />
                </Button>
              )}
              {plhKepala.document_path && showStatusLayout && !isAdmin && (
                <Button variant="ghost" size="icon" onClick={handleDownloadDocument} title="Unduh Dokumen">
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {!showStatusLayout && !isUser && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setFeedbackDialogOpen(true)} 
                    title="Feedback Satu Kemenkeu"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setAssignUpkDialogOpen(true)} 
                    title="Assign ke Tim UPK"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onEdit} title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </>
              )}
              {!showStatusLayout && !isArchived && isUser && canEdit && (
                <Button variant="ghost" size="icon" onClick={onEdit} title="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {/* Hide delete button for non-admin users in Status tab */}
              {!showStatusLayout && !isArchived && onArchive && !isAdmin && canEdit && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onArchive} 
                  title="Arsipkan"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              )}
              {isAdmin && !showStatusLayout && (
                <Button variant="ghost" size="icon" onClick={onDelete} title="Hapus">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-3">
        {showStatusLayout ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatPlhDates()}</span>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div><strong>Pemohon:</strong> {plhKepala.unit_pemohon}</div>
                  <div><strong>Penerbit:</strong> {plhKepala.unit_penerbit}</div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium mb-1">Pejabat PLH:</div>
                  <div className="text-muted-foreground">{employeeName}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="font-medium">Jenis:</div>
                <div className={`px-2 py-1 rounded-md text-xs font-semibold ${
                  (plhKepala as any).jenis_plh_plt === 'PLT' 
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {(plhKepala as any).jenis_plh_plt || 'PLH'}
                </div>
              </div>

              {assignedUpk && (
                <div className="flex items-start gap-2 text-sm">
                  <UserPlus className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">Tim UPK:</div>
                    <div className="text-muted-foreground italic">
                      {assignedUpk.name} ({assignedUpk.email})
                    </div>
                  </div>
                </div>
              )}

              {plhKepala.no_satu_kemenkeu && (
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <div className="text-base font-semibold text-primary mb-1">
                    No. Satu Kemenkeu
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {plhKepala.no_satu_kemenkeu}
                  </div>
                  {plhKepala.tanggal_satu_kemenkeu && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(plhKepala.tanggal_satu_kemenkeu), "dd MMMM yyyy", { locale: id })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Tracking */}
            <div className="border-l pl-6">
              <div className="text-sm font-semibold mb-2 text-foreground">Status Tracking</div>
              <TrackingProgress stages={trackingStages} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatPlhDates()}</span>
            </div>
            
            <div className="flex items-start gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div><strong>Pemohon:</strong> {plhKepala.unit_pemohon}</div>
                <div><strong>Penerbit:</strong> {plhKepala.unit_penerbit}</div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium mb-1">Pejabat PLH:</div>
                <div className="text-muted-foreground">{employeeName}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="font-medium">Jenis:</div>
              <div className={`px-2 py-1 rounded-md text-xs font-semibold ${
                (plhKepala as any).jenis_plh_plt === 'PLT' 
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' 
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {(plhKepala as any).jenis_plh_plt || 'PLH'}
              </div>
            </div>

            {assignedUpk && (
              <div className="flex items-start gap-2 text-sm">
                <UserPlus className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium mb-1">Tim UPK:</div>
                  <div className="text-muted-foreground italic">
                    {assignedUpk.name} ({assignedUpk.email})
                  </div>
                </div>
              </div>
            )}

            {plhKepala.no_satu_kemenkeu && (
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                <div className="text-base font-semibold text-primary mb-1">
                  No. Satu Kemenkeu
                </div>
                <div className="text-lg font-bold text-foreground">
                  {plhKepala.no_satu_kemenkeu}
                </div>
                {plhKepala.tanggal_satu_kemenkeu && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {format(new Date(plhKepala.tanggal_satu_kemenkeu), "dd MMMM yyyy", { locale: id })}
                  </div>
                )}
              </div>
            )}

            {!hideTracking && (
              <div className="pt-4 border-t mt-4">
                <div className="text-sm font-semibold mb-2 text-foreground">Status Tracking</div>
                <TrackingProgress stages={trackingStages} />
              </div>
            )}
          </div>
        )}
      </CardContent>
        {showGeneratorButtons && (
          <CardFooter className="flex flex-col sm:flex-row gap-3 p-4 border-t">
            <Button 
              variant="default" 
              size="sm"
              className="w-full sm:flex-1 text-sm" 
              onClick={handleGenerateND}
              disabled={isGenerating}
            >
              <FileText className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">ND {plhKepala.jenis_plh_plt || 'PLH'}</span>
            </Button>
            {isAdmin && (
              <Button 
                variant="default" 
                size="sm"
                className="w-full sm:flex-1 text-sm" 
                onClick={handleGeneratePRIN}
                disabled={isGenerating}
              >
                <FileText className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">PRIN {plhKepala.jenis_plh_plt || 'PLH'}</span>
              </Button>
            )}
          </CardFooter>
        )}
      </Card>

      <FeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
        onSubmit={handleFeedbackSubmit}
        currentNo={plhKepala.no_satu_kemenkeu}
        currentDate={plhKepala.tanggal_satu_kemenkeu ? new Date(plhKepala.tanggal_satu_kemenkeu) : undefined}
      />

      <AssignUpkDialog
        open={assignUpkDialogOpen}
        onOpenChange={setAssignUpkDialogOpen}
        assignmentId={plhKepala.id}
        assignmentType="plh_kepala"
        timUpkList={timUpkList}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
