import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, FileText, FileDown, Copy, Star, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import TrackingProgress from "./TrackingProgress";

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
  nomor_naskah_dinas?: string;
  tujuan?: string;
  jenis_penugasan?: string;
  sumber?: string;
  sumber_satuan_kerja?: string;
  sumber_satuan_kerja_custom?: string;
  konsep_masuk_at?: string;
  konsep_masuk_by?: string;
  proses_nd_at?: string;
  proses_nd_by?: string;
  verifikasi_keuangan_at?: string;
  verifikasi_keuangan_by?: string;
  verifikasi_keuangan_status?: string;
  verifikasi_keuangan_catatan?: string;
  proses_st_at?: string;
  proses_st_by?: string;
  selesai_at?: string;
  selesai_by?: string;
  no_satu_kemenkeu?: string;
  tanggal_satu_kemenkeu?: string;
  rating_penilaian?: number | null;
  saran_feedback?: string | null;
}

interface TimUpk {
  id: string;
  name: string;
  email: string;
}

interface AssignmentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment | null;
  assignedUpk?: TimUpk | null;
  employeeCount: number;
  onGenerateNota: () => void;
  onGenerateSurat?: () => void;
  onDuplicate?: () => void;
  isAdmin: boolean;
}

export default function AssignmentDetailDialog({
  open,
  onOpenChange,
  assignment,
  assignedUpk,
  employeeCount,
  onGenerateNota,
  onGenerateSurat,
  onDuplicate,
  isAdmin,
}: AssignmentDetailDialogProps) {
  if (!assignment) return null;

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
      completed: assignment.verifikasi_keuangan_status === "approved",
      timestamp: assignment.verifikasi_keuangan_at,
      email: assignment.verifikasi_keuangan_status === "approved" || assignment.verifikasi_keuangan_status === "declined"
        // Extract name from "Name (email)" format for display
        ? (() => {
            const verifikatorInfo = assignment.verifikasi_keuangan_by || "";
            const nameMatch = verifikatorInfo.match(/^([^(]+)\s*\(/);
            return nameMatch ? nameMatch[1].trim() : verifikatorInfo;
          })()
        : undefined,
      status: assignment.verifikasi_keuangan_status === 'declined' ? 'Ditolak' : 
              assignment.verifikasi_keuangan_status === 'approved' ? 'Disetujui' : undefined,
      catatan: assignment.verifikasi_keuangan_catatan,
      pendingVerifier: pendingVerifierInfo ? (() => {
        const nameMatch = pendingVerifierInfo.match(/^([^(]+)\s*\(/);
        return nameMatch ? nameMatch[1].trim() : pendingVerifierInfo;
      })() : undefined,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full !max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="secondary">No. Agenda: {assignment.agenda_number}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Info */}
          <div>
            <div className="text-base text-primary mb-2 space-y-1">
              {assignment.tujuan && (
                <p>- {assignment.tujuan}</p>
              )}
              {!assignment.tujuan && assignment.perihal && (
                <h3 className="text-xl font-bold">{assignment.perihal}</h3>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {assignment.tanggal_mulai_kegiatan && assignment.tanggal_selesai_kegiatan
                ? assignment.tanggal_mulai_kegiatan === assignment.tanggal_selesai_kegiatan
                  ? format(new Date(assignment.tanggal_mulai_kegiatan), "dd MMM yyyy", { locale: id })
                  : `${format(new Date(assignment.tanggal_mulai_kegiatan), "dd MMM yyyy", { locale: id })} - ${format(new Date(assignment.tanggal_selesai_kegiatan), "dd MMM yyyy", { locale: id })}`
                : assignment.tanggal_mulai_kegiatan
                ? format(new Date(assignment.tanggal_mulai_kegiatan), "EEEE, dd MMMM yyyy", { locale: id })
                : ''
              }
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid gap-4">
            <div>
              <span className="font-medium text-sm">Unit Pemohon:</span>
              <p className="text-muted-foreground">{assignment.unit_pemohon}</p>
            </div>
            
            <div>
              <span className="font-medium text-sm">Unit Penerbit:</span>
              <p className="text-muted-foreground">{assignment.unit_penerbit}</p>
            </div>

            {assignment.nomor_naskah_dinas && (
              <div>
                <span className="font-medium text-sm">Nomor Naskah Dinas Unit Pemohon:</span>
                <p className="text-muted-foreground">{assignment.nomor_naskah_dinas}</p>
              </div>
            )}

            <div>
              <span className="font-medium text-sm">Tempat:</span>
              <p className="text-muted-foreground">
                {assignment.jenis_penugasan === "Dalam Kantor" ? "-" : assignment.tempat_penugasan}
              </p>
            </div>

            {assignment.jenis_penugasan && (
              <div>
                <span className="font-medium text-sm">Jenis Penugasan:</span>
                <p className="text-muted-foreground">{assignment.jenis_penugasan}</p>
              </div>
            )}

            <div>
              <span className="font-medium text-sm">Sumber:</span>
              <p className="text-muted-foreground">
                {assignment.jenis_penugasan === "Dalam Kantor" ? "-" : (assignment.sumber || "-")}
              </p>
            </div>

            <div>
              <span className="font-medium text-sm">Sumber Dana:</span>
              <p className="text-muted-foreground">
                {assignment.jenis_penugasan === "Dalam Kantor" 
                  ? "-" 
                  : (assignment.sumber === "DIPA" && assignment.sumber_satuan_kerja)
                    ? (assignment.sumber_satuan_kerja === "Lainnya" && assignment.sumber_satuan_kerja_custom
                      ? assignment.sumber_satuan_kerja_custom
                      : assignment.sumber_satuan_kerja)
                    : "-"
                }
              </p>
            </div>

            <div>
              <span className="font-medium text-sm">Pegawai Ditugaskan:</span>
              <p className="text-muted-foreground">{employeeCount} orang</p>
            </div>

            {/* Show Verifikator Keuangan after konsep masuk is submitted */}
            {assignment.konsep_masuk_at && assignment.verifikasi_keuangan_by && (
              <div>
                <span className="font-medium text-sm">Verifikator Keuangan:</span>
                <p className="text-muted-foreground italic">
                  {/* Extract name from "Name (email)" format for display */}
                  {(() => {
                    const verifikatorInfo = assignment.verifikasi_keuangan_by || "";
                    const nameMatch = verifikatorInfo.match(/^([^(]+)\s*\(/);
                    return nameMatch ? nameMatch[1].trim() : verifikatorInfo;
                  })()}
                </p>
              </div>
            )}

            {assignment.nota_dinas_downloaded && assignedUpk && (
              <div>
                <span className="font-medium text-sm">Penyusun Konsep ST:</span>
                <p className="text-muted-foreground italic">
                  {assignedUpk.name} ({assignedUpk.email})
                </p>
              </div>
            )}
          </div>

          {/* Satu Kemenkeu Info */}
          {assignment.no_satu_kemenkeu && (
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
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

          {/* Rating Display - Show if rating exists */}
          {assignment.rating_penilaian && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-semibold text-foreground">Penilaian</span>
              </div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-5 w-5",
                      star <= assignment.rating_penilaian!
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {assignment.rating_penilaian === 1 && "Kurang"}
                  {assignment.rating_penilaian === 2 && "Cukup"}
                  {assignment.rating_penilaian === 3 && "Baik"}
                  {assignment.rating_penilaian === 4 && "Sangat Baik"}
                  {assignment.rating_penilaian === 5 && "Istimewa"}
                </span>
              </div>
              {assignment.saran_feedback && (
                <p className="text-sm text-muted-foreground italic">
                  "{assignment.saran_feedback}"
                </p>
              )}
            </div>
          )}

          {/* Tracking Progress */}
          <div className="border-t pt-4">
            <div className="text-sm font-semibold mb-3 text-foreground">Status Tracking</div>
            <TrackingProgress stages={trackingStages} />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            {/* Duplicate button for user role (non-admin) */}
            {!isAdmin && onDuplicate && (
              <Button 
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={onDuplicate}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
            )}
            <Button 
              variant="outline"
              size="sm"
              className={cn(
                "flex-1",
                assignment.nota_dinas_downloaded && "border-green-500/50 bg-green-50 hover:bg-green-100"
              )}
              onClick={async () => {
                await onGenerateNota();
                // Close dialog after generating ND for user role (card will move to Arsip)
                if (!isAdmin) {
                  onOpenChange(false);
                }
              }}
              disabled={!assignment.verifikasi_keuangan_at || assignment.verifikasi_keuangan_status !== 'approved'}
              title={(!assignment.verifikasi_keuangan_at || assignment.verifikasi_keuangan_status !== 'approved') ? "Tunggu verifikasi keuangan disetujui" : ""}
            >
              {assignment.nota_dinas_downloaded ? (
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600 fill-green-100" />
              ) : (
                <XCircle className="h-4 w-4 mr-2 text-red-600 fill-red-100" />
              )}
              Generate ND
            </Button>
            {isAdmin && onGenerateSurat && (
              <Button 
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1",
                  assignment.surat_tugas_downloaded && "border-green-500/50 bg-green-50 hover:bg-green-100"
                )}
                onClick={onGenerateSurat}
                disabled={!assignment.proses_nd_at}
                title={!assignment.proses_nd_at ? "Generate ND terlebih dahulu" : ""}
              >
                {assignment.surat_tugas_downloaded ? (
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600 fill-green-100" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2 text-red-600 fill-red-100" />
                )}
                Generate ST
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
