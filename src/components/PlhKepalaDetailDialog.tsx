import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import TrackingProgress from "./TrackingProgress";

interface PlhKepala {
  id: string;
  unit_pemohon: string;
  unit_penerbit: string;
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
  dasar_penugasan?: string;
  assigned_upk_id?: string;
  konsep_masuk_at?: string;
  konsep_masuk_by?: string;
  proses_nd_at?: string;
  proses_nd_by?: string;
  proses_st_at?: string;
  proses_st_by?: string;
  no_satu_kemenkeu?: string;
  tanggal_satu_kemenkeu?: string;
}

interface TimUpk {
  id: string;
  name: string;
  email: string;
}

interface PlhKepalaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plhKepala: PlhKepala | null;
  employeeName?: string;
  assignedUpk?: TimUpk | null;
  onGenerateND: () => void;
  onGeneratePRIN: () => void;
  isAdmin: boolean;
}

export default function PlhKepalaDetailDialog({
  open,
  onOpenChange,
  plhKepala,
  employeeName,
  assignedUpk,
  onGenerateND,
  onGeneratePRIN,
  isAdmin,
}: PlhKepalaDetailDialogProps) {
  if (!plhKepala) return null;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="secondary">No. Agenda: {plhKepala.agenda_number || '-'}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Info */}
          <div>
            <h3 className="text-xl font-bold text-primary mb-2">{plhKepala.perihal}</h3>
            <p className="text-sm text-muted-foreground">{plhKepala.nomor_naskah_dinas}</p>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm">{formatPlhDates()}</span>
          </div>

          {/* Details Grid */}
          <div className="grid gap-4">
            <div>
              <span className="font-medium text-sm">Pemohon:</span>
              <p className="text-primary">{plhKepala.unit_pemohon}</p>
            </div>
            
            <div>
              <span className="font-medium text-sm">Penerbit:</span>
              <p className="text-primary">{plhKepala.unit_penerbit}</p>
            </div>

            <div>
              <span className="font-medium text-sm">Pejabat PLH:</span>
              <p className="text-muted-foreground">{employeeName || 'Unknown'}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Jenis:</span>
              <Badge variant="outline" className="text-xs">
                {plhKepala.jenis_plh_plt || 'PLH'}
              </Badge>
            </div>

            {assignedUpk && (
              <div>
                <span className="font-medium text-sm">Tim UPK:</span>
                <p className="text-muted-foreground italic">
                  {assignedUpk.name} ({assignedUpk.email})
                </p>
              </div>
            )}
          </div>

          {/* Satu Kemenkeu Info */}
          {plhKepala.no_satu_kemenkeu && (
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
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

          {/* Tracking Progress */}
          <div className="border-t pt-4">
            <div className="text-sm font-semibold mb-3 text-foreground">Status Tracking</div>
            <TrackingProgress stages={trackingStages} />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              variant="default"
              size="sm"
              className="flex-1"
              onClick={onGenerateND}
            >
              <FileText className="h-4 w-4 mr-2" />
              ND {plhKepala.jenis_plh_plt || 'PLH'}
            </Button>
            <Button 
              variant="default"
              size="sm"
              className="flex-1"
              onClick={onGeneratePRIN}
            >
              <FileText className="h-4 w-4 mr-2" />
              PRIN {plhKepala.jenis_plh_plt || 'PLH'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
