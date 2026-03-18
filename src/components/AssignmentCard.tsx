import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileDown, Pencil, Trash2, CheckCircle2, XCircle, UserPlus, Download, MessageSquare, Archive, ArchiveRestore, Copy, Star, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import TrackingProgress from "./TrackingProgress";
import FeedbackDialog from "./FeedbackDialog";
import AssignUpkDialog from "./AssignUpkDialog";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Assignment {
  id: string;
  agenda_number: number;
  unit_pemohon: string;
  unit_penerbit: string;
  perihal: string;
  tanggal_mulai_kegiatan?: string;
  tanggal_selesai_kegiatan?: string;
  tempat_penugasan: string;
  employee_ids: string[];
  nota_dinas_downloaded?: boolean;
  surat_tugas_downloaded?: boolean;
  created_by_email?: string;
  updated_by_email?: string;
  assigned_upk_id?: string;
  assigned_upk_at?: string;
  assigned_upk_manually?: boolean;
  document_path?: string;
  konsep_path?: string;
  konsep_masuk_at?: string;
  konsep_masuk_by?: string;
  proses_nd_at?: string;
  proses_nd_by?: string;
  verifikasi_keuangan_at?: string;
  verifikasi_keuangan_by?: string;
  verifikasi_keuangan_status?: 'approved' | 'declined' | null;
  verifikasi_keuangan_catatan?: string;
  proses_st_at?: string;
  proses_st_by?: string;
  selesai_at?: string;
  selesai_by?: string;
  no_satu_kemenkeu?: string;
  tanggal_satu_kemenkeu?: string;
  sumber?: string;
  tujuan?: string;
  rating_penilaian?: number | null;
}

interface TimUpk {
  id: string;
  name: string;
  email: string;
}

interface AssignmentCardProps {
  assignment: Assignment;
  employeeNames: string[];
  onEdit?: () => void;
  onDelete?: () => void;
  onGenerateNota: () => void;
  onGenerateSurat?: () => void;
  onDuplicate?: () => void;
  isAdmin: boolean;
  assignedUpk?: TimUpk | null;
  onAssignToMe: () => void;
  currentUserEmail: string;
  timUpkList: TimUpk[];
  viewOnly?: boolean;
  showTracking?: boolean;
  onArchive?: () => void;
  onUnarchive?: () => void;
  isArchived?: boolean;
  onRefresh?: () => void;
}

export default function AssignmentCard({
  assignment,
  employeeNames,
  onEdit,
  onDelete,
  onGenerateNota,
  onGenerateSurat,
  onDuplicate,
  isAdmin,
  assignedUpk,
  onAssignToMe,
  currentUserEmail,
  timUpkList,
  viewOnly = false,
  showTracking = true,
  onArchive,
  onUnarchive,
  isArchived = false,
  onRefresh
}: AssignmentCardProps) {
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [assignUpkDialogOpen, setAssignUpkDialogOpen] = useState(false);
  const isTimUpkMember = timUpkList.some(upk => upk.email === currentUserEmail);
  const canAssignToUpk = isAdmin;
  
  const handleDownloadDocument = async () => {
    if (!assignment.document_path) {
      toast.error("Tidak ada dokumen konsideran yang tersedia");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('assignment-documents')
        .download(assignment.document_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = assignment.document_path.split('/').pop() || 'konsideran';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Dokumen konsideran berhasil diunduh");
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error("Gagal mengunduh dokumen konsideran");
    }
  };

  const handleDownloadKonsep = async () => {
    if (!assignment.konsep_path) {
      toast.error("Tidak ada dokumen konsep yang tersedia");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('konsep-documents')
        .download(assignment.konsep_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = assignment.konsep_path.split('/').pop() || 'konsep';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Dokumen konsep berhasil diunduh");
    } catch (error) {
      console.error('Error downloading konsep:', error);
      toast.error("Gagal mengunduh dokumen konsep");
    }
  };

  const handleGenerateNota = async () => {
    // NEW FLOW: Verifikasi Keuangan must be approved first
    if (!assignment.verifikasi_keuangan_at || assignment.verifikasi_keuangan_status !== 'approved') {
      toast.error("Tidak dapat Generate ND. Harap tunggu verifikasi keuangan disetujui terlebih dahulu.");
      return;
    }

    try {
      // Call the actual document generation - database updates are handled in SuratTugas.tsx handleGenerateNotaDinas
      await onGenerateNota();
      
      // Refresh data after generation
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error("Error generating Nota Dinas:", error);
      toast.error(error.message || "Gagal generate Nota Dinas");
    }
  };

  const handleGenerateSurat = async () => {
    // NEW FLOW: Proses ND must be completed first
    if (!assignment.proses_nd_at) {
      toast.error("Tidak dapat Generate ST. Harap Generate ND terlebih dahulu.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || "unknown";

      // Update tracking
      const { error: updateError } = await supabase
        .from("assignments")
        .update({
          proses_st_at: new Date().toISOString(),
          proses_st_by: email,
          surat_tugas_downloaded: true,
        })
        .eq("id", assignment.id);

      if (updateError) throw updateError;

      // Call the actual generation
      if (onGenerateSurat) {
        onGenerateSurat();
      }
      
      toast.success("Surat Tugas berhasil digenerate!");
      
      // Reload after a short delay to ensure document generation completes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("Error generating Surat Tugas:", error);
      toast.error(error.message || "Gagal generate Surat Tugas");
    }
  };

  const handleFeedbackSubmit = async (noSatuKemenkeu: string, tanggalSatuKemenkeu: Date) => {
    // Validation: Proses ST must be completed first
    if (!assignment.proses_st_at) {
      toast.error("Tidak dapat menyelesaikan penugasan. Harap Generate ST terlebih dahulu.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || "unknown";

      await supabase
        .from("assignments")
        .update({
          no_satu_kemenkeu: noSatuKemenkeu,
          tanggal_satu_kemenkeu: format(tanggalSatuKemenkeu, "yyyy-MM-dd"),
          selesai_at: new Date().toISOString(),
          selesai_by: email,
        })
        .eq("id", assignment.id);

      toast.success("Data Satu Kemenkeu berhasil disimpan");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    }
  };

  // Determine if pending verifier should be shown
  const isPendingVerification = !!assignment.konsep_masuk_at && 
    (!assignment.verifikasi_keuangan_at || !assignment.verifikasi_keuangan_status || assignment.verifikasi_keuangan_status === null);
  const pendingVerifierInfo = isPendingVerification && assignment.verifikasi_keuangan_by ? assignment.verifikasi_keuangan_by : undefined;

  // Updated flow: Konsep Masuk > Verifikasi Keuangan > Proses ND > Proses ST > Selesai
  const trackingStages = [
    {
      label: "Konsep Masuk",
      completed: !!assignment.konsep_masuk_at,
      timestamp: assignment.konsep_masuk_at,
      email: assignment.konsep_masuk_by,
    },
    {
      label: "Verifikasi Keuangan",
      completed: !!assignment.verifikasi_keuangan_at && assignment.verifikasi_keuangan_status === 'approved',
      timestamp: assignment.verifikasi_keuangan_at,
      email: assignment.verifikasi_keuangan_status === 'approved' || assignment.verifikasi_keuangan_status === 'declined' 
        ? assignment.verifikasi_keuangan_by 
        : undefined,
      status: assignment.verifikasi_keuangan_status === 'declined' ? 'Ditolak' : 
              assignment.verifikasi_keuangan_status === 'approved' ? 'Disetujui' : undefined,
      catatan: assignment.verifikasi_keuangan_catatan,
      pendingVerifier: pendingVerifierInfo,
    },
    {
      label: "Proses Penyusunan ND",
      completed: !!assignment.proses_nd_at,
      timestamp: assignment.proses_nd_at,
      email: assignment.proses_nd_by,
    },
    {
      label: "Proses Penyusunan ST",
      completed: !!assignment.proses_st_at,
      timestamp: assignment.proses_st_at,
      email: assignment.proses_st_by,
    },
    {
      label: "Konsep ST Telah Dinaikkan Via Nadine",
      completed: !!assignment.no_satu_kemenkeu && !!assignment.tanggal_satu_kemenkeu,
      timestamp: assignment.selesai_at,
      email: assignment.selesai_by,
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
                  No. Agenda: {assignment.agenda_number}
                </span>
              </div>
              <div className="text-sm text-primary mb-1 space-y-0.5">
                {assignment.tujuan && (
                  <p>{assignment.tujuan}</p>
                )}
                {!assignment.tujuan && assignment.perihal && (
                  <p className="font-bold text-lg">{assignment.perihal}</p>
                )}
              </div>
              <div className="text-sm text-muted-foreground font-normal">
                {assignment.tanggal_mulai_kegiatan && assignment.tanggal_selesai_kegiatan
                  ? assignment.tanggal_mulai_kegiatan === assignment.tanggal_selesai_kegiatan
                    ? format(new Date(assignment.tanggal_mulai_kegiatan), "dd MMM yyyy", { locale: id })
                    : `${format(new Date(assignment.tanggal_mulai_kegiatan), "dd MMM yyyy", { locale: id })} - ${format(new Date(assignment.tanggal_selesai_kegiatan), "dd MMM yyyy", { locale: id })}`
                  : assignment.tanggal_mulai_kegiatan
                  ? format(new Date(assignment.tanggal_mulai_kegiatan), "EEEE, dd MMMM yyyy", { locale: id })
                  : ''
                }
              </div>
              {/* Rating display for user and super roles */}
              {assignment.rating_penilaian && (
                <div className="flex items-center gap-1 mt-2 p-2 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground">Rating:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-4 w-4 ${star <= assignment.rating_penilaian! ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            {!viewOnly && (
              <div className="flex gap-1">
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setFeedbackDialogOpen(true)} 
                    title={!assignment.proses_st_at ? "Generate ST terlebih dahulu" : "Input No. Satu Kemenkeu"}
                    disabled={!assignment.proses_st_at}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                )}
                {isAdmin && (assignment.document_path || assignment.konsep_path) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" title="Download Dokumen">
                        <Download className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {assignment.document_path && (
                        <DropdownMenuItem onClick={handleDownloadDocument}>
                          <FileText className="h-4 w-4 mr-2" />
                          Unduh Konsideran
                        </DropdownMenuItem>
                      )}
                      {assignment.konsep_path && (
                        <DropdownMenuItem onClick={handleDownloadKonsep}>
                          <FileDown className="h-4 w-4 mr-2" />
                          Unduh Konsep
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {canAssignToUpk && (
                  <Button variant="ghost" size="icon" onClick={() => setAssignUpkDialogOpen(true)} title="Assign ke Tim UPK">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                )}
                {isArchived && onUnarchive && (
                  <Button variant="ghost" size="icon" onClick={onUnarchive} title="Batalkan Arsip">
                    <ArchiveRestore className="h-4 w-4" />
                  </Button>
                )}
                {/* Duplicate button for user role (non-admin) - before Edit button */}
                {!isAdmin && onDuplicate && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onDuplicate}
                    title="Duplicate Draft"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                {onEdit && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      // Edit is allowed when selesai_at is NOT set (status is not selesai)
                      // selesai_at is set when no_satu_kemenkeu is provided
                      if (assignment.selesai_at) return;
                      onEdit();
                    }} 
                    title={
                      assignment.selesai_at 
                        ? "Tidak dapat diedit - Status sudah Selesai" 
                        : "Edit - Dapat mengedit selama status belum Selesai"
                    }
                    disabled={!!assignment.selesai_at}
                    className={cn(assignment.selesai_at && "opacity-50 cursor-not-allowed")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {onArchive && (
                  <Button variant="ghost" size="icon" onClick={onArchive} title="Arsipkan">
                    <Archive className="h-4 w-4" />
                  </Button>
                )}
                {isAdmin && onDelete && (
                  <Button variant="ghost" size="icon" onClick={onDelete} title="Hapus">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={showTracking ? "grid md:grid-cols-2 gap-6" : ""}>
            {/* Left Column - Details */}
            <div className="space-y-3">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Unit Pemohon:</span>
                  <p className="text-muted-foreground">{assignment.unit_pemohon}</p>
                </div>
                <div>
                  <span className="font-medium">Unit Penerbit:</span>
                  <p className="text-muted-foreground">{assignment.unit_penerbit}</p>
                </div>
                {(assignment as any).nomor_naskah_dinas && (
                  <div>
                    <span className="font-medium">Nomor Naskah Dinas Unit Pemohon:</span>
                    <p className="text-muted-foreground">{(assignment as any).nomor_naskah_dinas}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium">Tempat:</span>
                  <p className="text-muted-foreground">
                    {(assignment as any).jenis_penugasan === "Dalam Kantor" ? "-" : assignment.tempat_penugasan}
                  </p>
                </div>
                {(assignment as any).jenis_penugasan && (
                  <div>
                    <span className="font-medium">Jenis Penugasan:</span>
                    <p className="text-muted-foreground">{(assignment as any).jenis_penugasan}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium">Sumber:</span>
                  <p className="text-muted-foreground">
                    {(assignment as any).jenis_penugasan === "Dalam Kantor" ? "-" : (assignment.sumber || "-")}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Sumber Dana:</span>
                  <p className="text-muted-foreground">
                    {(assignment as any).jenis_penugasan === "Dalam Kantor" 
                      ? "-" 
                      : (assignment.sumber === "DIPA" && (assignment as any).sumber_satuan_kerja)
                        ? ((assignment as any).sumber_satuan_kerja === "Lainnya" && (assignment as any).sumber_satuan_kerja_custom
                          ? (assignment as any).sumber_satuan_kerja_custom
                          : (assignment as any).sumber_satuan_kerja)
                        : "-"
                    }
                  </p>
                </div>
                <div>
                  <span className="font-medium">Pegawai Ditugaskan:</span>
                  <p className="text-muted-foreground">{assignment.employee_ids.length} orang</p>
                </div>
                {assignment.nota_dinas_downloaded && assignedUpk && (
                  <div>
                    <span className="font-medium">Penyusun Konsep ST:</span>
                    <p className="text-muted-foreground italic">
                      {assignedUpk.name} ({assignedUpk.email})
                    </p>
                  </div>
                )}
              </div>

              {assignment.no_satu_kemenkeu && (
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <div className="text-base font-semibold text-primary mb-1">
                    Nomor Booking ST
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {assignment.no_satu_kemenkeu}
                  </div>
                  {assignment.tanggal_satu_kemenkeu && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(assignment.tanggal_satu_kemenkeu), "dd MMMM yyyy", { locale: id })}
                    </div>
                  )}
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1 text-left flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Laporan E-perjadin Maksimal 3 hari
              </p>
                </div>
              )}
            </div>

            {/* Right Column - Tracking */}
            {showTracking && (
              <div className="border-l pl-6">
                <div className="text-sm font-semibold mb-2 text-foreground">Status Tracking</div>
                <TrackingProgress stages={trackingStages} />
              </div>
            )}
          </div>
        </CardContent>
        {!viewOnly && (
          <CardFooter className="flex gap-2 pt-4 border-t">
            {/* Generate ND button - hide if verifikasi keuangan is declined */}
            {assignment.verifikasi_keuangan_status !== 'declined' && (
              <Button 
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1",
                  assignment.nota_dinas_downloaded && "border-green-500/50 bg-green-50 hover:bg-green-100"
                )}
                onClick={handleGenerateNota}
                disabled={!assignment.konsep_masuk_at || !assignment.verifikasi_keuangan_at || assignment.verifikasi_keuangan_status !== 'approved'}
                title={
                  !assignment.konsep_masuk_at 
                    ? "Upload konsep terlebih dahulu" 
                    : !assignment.verifikasi_keuangan_at 
                      ? "Tunggu verifikasi keuangan" 
                      : assignment.verifikasi_keuangan_status !== 'approved' 
                        ? "Verifikasi keuangan belum disetujui" 
                        : ""
                }
              >
                {assignment.nota_dinas_downloaded ? (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-600 fill-green-100" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 mr-1.5 text-red-600 fill-red-100" />
                )}
                <FileText className="h-3.5 w-3.5 mr-1" />
                ND
              </Button>
            )}
            {/* Show declined message if verification was rejected */}
            {assignment.verifikasi_keuangan_status === 'declined' && (
              <div className="flex-1">
                <div className="text-sm text-red-600 font-medium flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  Verifikasi Keuangan Ditolak
                </div>
                {assignment.verifikasi_keuangan_catatan && (
                  <div className="text-xs text-muted-foreground mt-1 bg-red-50 p-2 rounded border border-red-200">
                    <span className="font-medium">Catatan:</span> {assignment.verifikasi_keuangan_catatan}
                  </div>
                )}
              </div>
            )}
            {isAdmin && onGenerateSurat && (
              <Button 
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1",
                  assignment.surat_tugas_downloaded && "border-green-500/50 bg-green-50 hover:bg-green-100"
                )}
                onClick={handleGenerateSurat}
                disabled={!assignment.proses_nd_at}
                title={!assignment.proses_nd_at ? "Generate ND terlebih dahulu" : ""}
              >
                {assignment.surat_tugas_downloaded ? (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-600 fill-green-100" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 mr-1.5 text-red-600 fill-red-100" />
                )}
                <FileDown className="h-3.5 w-3.5 mr-1" />
                ST
              </Button>
            )}
          </CardFooter>
        )}
      </Card>

      <FeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
        onSubmit={handleFeedbackSubmit}
        currentNo={assignment.no_satu_kemenkeu}
        currentDate={assignment.tanggal_satu_kemenkeu ? new Date(assignment.tanggal_satu_kemenkeu) : undefined}
      />

      <AssignUpkDialog
        open={assignUpkDialogOpen}
        onOpenChange={setAssignUpkDialogOpen}
        assignmentId={assignment.id}
        assignmentType="assignment"
        timUpkList={timUpkList}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
