import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, UserPlus, Download, Pencil, Trash2, FileText, CheckCircle2, Star, Copy, DollarSign, XCircle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AssignmentDetailDialog from "./AssignmentDetailDialog";
import VerifikasiKeuanganDialog from "./VerifikasiKeuanganDialog";
import RatingDialog from "./RatingDialog";

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
  manual_employees?: { nama: string; pangkat: string; jabatan: string; }[];
  nota_dinas_downloaded?: boolean;
  surat_tugas_downloaded?: boolean;
  assigned_upk_id?: string;
  no_satu_kemenkeu?: string;
  tanggal_satu_kemenkeu?: string;
  konseptor_name?: string;
  proses_nd_at?: string;
  verifikasi_keuangan_at?: string;
  verifikasi_keuangan_by?: string;
  verifikasi_keuangan_status?: 'approved' | 'declined' | null;
  verifikasi_keuangan_catatan?: string;
  rating_penilaian?: number | null;
  saran_feedback?: string | null;
  selesai_at?: string;
  created_by_email?: string;
  konsep_masuk_at?: string;
  // Additional fields for duplicate feature
  dasar_penugasan?: string;
  nomor_naskah_dinas?: string;
  tanggal_naskah?: string;
  tujuan?: string;
  waktu_penugasan?: string;
  lokasi_penugasan_detail?: string;
  pejabat_unit_pemohon_id?: string;
  pejabat_unit_penerbit_id?: string;
  sumber?: string;
}

interface TimUpk {
  id: string;
  name: string;
  email: string;
}

interface TimKeuangan {
  id: string;
  name: string;
  email: string;
}

interface AssignmentTableProps {
  assignments: Assignment[];
  timUpkList: TimUpk[];
  timKeuanganList?: TimKeuangan[];
  isAdmin: boolean;
  canEdit?: boolean;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignmentId: string) => void;
  onAssignUpk: (assignmentId: string) => void;
  onAssignKeuangan?: (assignmentId: string) => void;
  onFeedback: (assignmentId: string) => void;
  onDownload: (assignmentId: string, type: 'dasar' | 'konsep') => void;
  onGenerateNota: (assignment: Assignment) => void;
  onGenerateSurat: (assignment: Assignment) => void;
  onVerifikasiSuccess?: () => void;
  onDuplicate?: (assignment: Assignment) => void;
}

export default function AssignmentTable({
  assignments,
  timUpkList,
  timKeuanganList = [],
  isAdmin,
  canEdit = true,
  onEdit,
  onDelete,
  onAssignUpk,
  onAssignKeuangan,
  onFeedback,
  onDownload,
  onGenerateNota,
  onGenerateSurat,
  onVerifikasiSuccess,
  onDuplicate,
}: AssignmentTableProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [verifikasiDialogOpen, setVerifikasiDialogOpen] = useState(false);
  const [verifikasiAssignment, setVerifikasiAssignment] = useState<Assignment | null>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingAssignment, setRatingAssignment] = useState<Assignment | null>(null);

  const handleRowClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setDetailDialogOpen(true);
  };

  const getAssignedUpk = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment?.assigned_upk_id) return null;
    return timUpkList.find(upk => upk.id === assignment.assigned_upk_id) || null;
  };

  // Get verifikator name - show name instead of email for super/admin roles
  const getVerifikatorName = (assignment: Assignment) => {
    if (!assignment.konsep_masuk_at) return null;
    
    // If already verified, show verifikator name (extract name from "Name (email)" format)
    if (assignment.verifikasi_keuangan_by) {
      const verifikatorInfo = assignment.verifikasi_keuangan_by;
      // Check if format is "Name (email)" and extract just the name
      const nameMatch = verifikatorInfo.match(/^([^(]+)\s*\(/);
      if (nameMatch) {
        return nameMatch[1].trim();
      }
      // If it's just an email, try to find the name from tim_keuangan
      const keuanganMember = timKeuanganList.find(k => k.email === verifikatorInfo);
      if (keuanganMember) {
        return keuanganMember.name;
      }
      return verifikatorInfo;
    }
    // Auto-assign default verifikator when konsep masuk
    const defaultVerifikator = timKeuanganList.find(k => k.name === "Freesia Putri Erwana");
    return defaultVerifikator?.name || "Freesia Putri Erwana";
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-card w-full">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[4%] text-xs">No</TableHead>
              <TableHead className="w-[14%] text-xs">No & Tujuan</TableHead>
              <TableHead className="w-[8%] text-xs">Tanggal</TableHead>
              <TableHead className="w-[9%] text-xs">Pemohon</TableHead>
              <TableHead className="w-[9%] text-xs">Penerbit</TableHead>
              <TableHead className="w-[8%] text-xs">Konseptor</TableHead>
              <TableHead className="w-[8%] text-xs">Verifikator</TableHead>
              <TableHead className="w-[8%] text-xs">Penyusun ST</TableHead>
              <TableHead className="w-[6%] text-xs">Sumber</TableHead>
              <TableHead className="w-[8%] text-xs">Satker</TableHead>
              <TableHead className="w-[7%] text-xs">No. ST</TableHead>
              <TableHead className="w-[11%] text-xs text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  Tidak ada data penugasan
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => {
                const assignedUpk = getAssignedUpk(assignment.id);
                const isCompleted = !!assignment.no_satu_kemenkeu;
                return (
                  <TableRow 
                    key={assignment.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors border-r-4",
                      isCompleted ? "border-r-green-500" : "border-r-red-500"
                    )}
                    onClick={() => handleRowClick(assignment)}
                  >
                    <TableCell>
                      <Badge variant="secondary" className="font-semibold">
                        {assignment.agenda_number}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-xs break-words whitespace-normal">
                      <div className="space-y-1">
                        {assignment.nomor_naskah_dinas && (
                          <p className="text-muted-foreground text-xs">{assignment.nomor_naskah_dinas}</p>
                        )}
                        {assignment.tujuan && (
                          <p className="text-xs">{assignment.tujuan}</p>
                        )}
                        {!assignment.nomor_naskah_dinas && !assignment.tujuan && (
                          <p>{assignment.perihal}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground break-words whitespace-normal">
                      {assignment.tanggal_mulai_kegiatan && assignment.tanggal_selesai_kegiatan ? (
                        assignment.tanggal_mulai_kegiatan === assignment.tanggal_selesai_kegiatan ? (
                          format(new Date(assignment.tanggal_mulai_kegiatan), "dd MMM yyyy", { locale: id })
                        ) : (
                          <>
                            {format(new Date(assignment.tanggal_mulai_kegiatan), "dd MMM", { locale: id })} - 
                            {format(new Date(assignment.tanggal_selesai_kegiatan), "dd MMM yyyy", { locale: id })}
                          </>
                        )
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-xs break-words whitespace-normal">{assignment.unit_pemohon}</TableCell>
                    <TableCell className="text-xs break-words whitespace-normal">{assignment.unit_penerbit}</TableCell>
                    <TableCell className="text-xs text-muted-foreground italic break-words whitespace-normal">
                      {assignment.konseptor_name || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground italic break-words whitespace-normal">
                      {getVerifikatorName(assignment) || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground italic break-words whitespace-normal">
                      {assignedUpk ? assignedUpk.name : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground break-words whitespace-normal">
                      {assignment.sumber || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground break-words whitespace-normal">
                      {(assignment as any).sumber_satuan_kerja || "-"}
                    </TableCell>
                    <TableCell className="text-xs font-medium break-words whitespace-normal">
                      {assignment.no_satu_kemenkeu ? (
                        <span className="text-green-600">{assignment.no_satu_kemenkeu}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right p-1" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-0.5 justify-end">
                        {isAdmin && onDuplicate && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicate(assignment);
                            }}
                            title="Duplicate Draft"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                        {isAdmin && (assignment as any).konsep_masuk_at && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                              "h-6 w-6",
                              assignment.verifikasi_keuangan_status === 'approved' 
                                ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                                : assignment.verifikasi_keuangan_status === 'declined'
                                ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                : "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              setVerifikasiAssignment(assignment);
                              setVerifikasiDialogOpen(true);
                            }}
                            title={
                              assignment.verifikasi_keuangan_status === 'approved' 
                                ? "Disetujui - Klik untuk ubah"
                                : assignment.verifikasi_keuangan_status === 'declined'
                                ? "Ditolak - Klik untuk ubah"
                                : "Verifikasi Keuangan"
                            }
                          >
                            {assignment.verifikasi_keuangan_status === 'declined' ? (
                              <XCircle className="h-3 w-3 text-red-600" />
                            ) : (
                              <CheckCircle2 className={cn(
                                "h-3 w-3",
                                assignment.verifikasi_keuangan_status === 'approved' && "fill-green-100"
                              )} />
                            )}
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-6 w-6" title="Download">
                              <Download className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            {(assignment as any).document_path ? (
                              <DropdownMenuItem onClick={() => onDownload(assignment.id, 'dasar')}>
                                Dasar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                Dasar
                              </DropdownMenuItem>
                            )}
                            {(assignment as any).konsep_path ? (
                              <DropdownMenuItem onClick={() => onDownload(assignment.id, 'konsep')}>
                                Konsep
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                Konsep
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {canEdit && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-6 w-6" title="Generate">
                                <FileText className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem 
                                onClick={() => onGenerateNota(assignment)}
                                className="flex items-center gap-2"
                              >
                                <span className={cn(
                                  "w-2 h-2 rounded-full",
                                  assignment.nota_dinas_downloaded ? "bg-green-500" : "bg-red-500"
                                )} />
                                <span className={assignment.nota_dinas_downloaded ? "font-medium" : ""}>ND</span>
                              </DropdownMenuItem>
                              {isAdmin && (
                                <DropdownMenuItem 
                                  onClick={() => onGenerateSurat(assignment)}
                                  className="flex items-center gap-2"
                                >
                                  <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    assignment.surat_tugas_downloaded ? "bg-green-500" : "bg-red-500"
                                  )} />
                                  <span className={assignment.surat_tugas_downloaded ? "font-medium" : ""}>ST</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAssignUpk(assignment.id);
                            }}
                            title="Assign ke Tim UPK"
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
                        )}
                        {isAdmin && onAssignKeuangan && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAssignKeuangan(assignment.id);
                            }}
                            title="Assign ke Tim Keuangan"
                          >
                            <DollarSign className="h-3 w-3" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFeedback(assignment.id);
                            }}
                            title="Input No. Satu Kemenkeu"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                            "h-6 w-6",
                            assignment.rating_penilaian 
                              ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50" 
                              : "text-muted-foreground hover:text-yellow-500"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRatingAssignment(assignment);
                            setRatingDialogOpen(true);
                          }}
                          title={assignment.rating_penilaian ? `Rating: ${assignment.rating_penilaian}/5` : "Beri Penilaian"}
                        >
                          <Star className={cn("h-3 w-3", assignment.rating_penilaian && "fill-current")} />
                        </Button>
                        {canEdit && (
                          (() => {
                            const isSelesai = !!assignment.selesai_at;
                            const canEditAssignment = isAdmin || !isSelesai;
                            
                            return (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn(
                                  "h-6 w-6",
                                  !canEditAssignment && "opacity-50 cursor-not-allowed"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!canEditAssignment) return;
                                  onEdit(assignment);
                                }}
                                title={!canEditAssignment ? "Tidak dapat diedit - Status sudah selesai" : "Edit"}
                                disabled={!canEditAssignment}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            );
                          })()
                        )}
                        {isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(assignment.id);
                            }}
                            title="Hapus"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AssignmentDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        assignment={selectedAssignment}
        assignedUpk={selectedAssignment ? getAssignedUpk(selectedAssignment.id) : null}
        employeeCount={(selectedAssignment?.employee_ids?.length || 0) + (selectedAssignment?.manual_employees?.length || 0)}
        onGenerateNota={() => {
          if (selectedAssignment) {
            onGenerateNota(selectedAssignment);
            setDetailDialogOpen(false);
          }
        }}
        onGenerateSurat={isAdmin ? () => {
          if (selectedAssignment) {
            onGenerateSurat(selectedAssignment);
            setDetailDialogOpen(false);
          }
        } : undefined}
        isAdmin={isAdmin}
      />

      {verifikasiAssignment && (
        <VerifikasiKeuanganDialog
          open={verifikasiDialogOpen}
          onOpenChange={setVerifikasiDialogOpen}
          assignmentId={verifikasiAssignment.id}
          perihal={verifikasiAssignment.perihal}
          createdByEmail={verifikasiAssignment.created_by_email}
          onSuccess={() => {
            setVerifikasiAssignment(null);
            onVerifikasiSuccess?.();
          }}
        />
      )}

      {ratingAssignment && (
        <RatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          assignmentId={ratingAssignment.id}
          perihal={ratingAssignment.perihal}
          currentRating={ratingAssignment.rating_penilaian}
          currentSaran={ratingAssignment.saran_feedback}
          onSuccess={() => {
            setRatingAssignment(null);
            onVerifikasiSuccess?.();
          }}
        />
      )}
    </>
  );
}
