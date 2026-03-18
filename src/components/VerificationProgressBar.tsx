import { useMemo } from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  verifikasi_keuangan_status?: string | null;
  verifikasi_keuangan_at?: string | null;
  konsep_masuk_at?: string | null;
  sumber?: string;
  sumber_satuan_kerja?: string;
  no_satu_kemenkeu?: string;
  tanggal_satu_kemenkeu?: string;
}

interface VerificationProgressBarProps {
  assignments: Assignment[];
  onFilterChange?: (filter: 'all' | 'completed' | 'pending') => void;
  activeFilter?: 'all' | 'completed' | 'pending';
}

export default function VerificationProgressBar({ 
  assignments, 
  onFilterChange,
  activeFilter = 'all'
}: VerificationProgressBarProps) {
  const stats = useMemo(() => {
    const total = assignments.filter(a => a.konsep_masuk_at).length;
    const approved = assignments.filter(a => 
      a.verifikasi_keuangan_status === 'approved'
    ).length;
    const declined = assignments.filter(a => 
      a.verifikasi_keuangan_status === 'declined'
    ).length;
    const pending = assignments.filter(a => 
      a.konsep_masuk_at && !a.verifikasi_keuangan_at
    ).length;
    
    // Track completion status (has no_satu_kemenkeu)
    const completed = assignments.filter(a => 
      a.no_satu_kemenkeu && a.tanggal_satu_kemenkeu
    ).length;
    const notCompleted = assignments.filter(a => 
      !a.no_satu_kemenkeu || !a.tanggal_satu_kemenkeu
    ).length;
    
    return {
      total,
      approved,
      declined,
      pending,
      completed,
      notCompleted,
      totalAssignments: assignments.length,
      approvedPercent: total > 0 ? (approved / total) * 100 : 0,
      declinedPercent: total > 0 ? (declined / total) * 100 : 0,
      pendingPercent: total > 0 ? (pending / total) * 100 : 0,
      completedPercent: assignments.length > 0 ? (completed / assignments.length) * 100 : 0,
      notCompletedPercent: assignments.length > 0 ? (notCompleted / assignments.length) * 100 : 0,
    };
  }, [assignments]);

  if (stats.total === 0) {
    return null;
  }

  return (
    <div className="p-4 border rounded-lg bg-card mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm">Progress Verifikasi Keuangan</h4>
        <span className="text-xs text-muted-foreground">
          {stats.approved + stats.declined} / {stats.total} Terverifikasi
        </span>
      </div>
      
      {/* Progress bar - Clickable */}
      <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex mb-3">
        <div 
          className={cn(
            "bg-green-500 transition-all duration-300 cursor-pointer hover:bg-green-600",
            activeFilter === 'completed' && "ring-2 ring-green-700"
          )}
          style={{ width: `${stats.approvedPercent}%` }}
          onClick={() => onFilterChange?.('completed')}
          title="Klik untuk filter Disetujui"
        />
        <div 
          className={cn(
            "bg-red-500 transition-all duration-300 cursor-pointer hover:bg-red-600",
            activeFilter === 'pending' && "ring-2 ring-red-700"
          )}
          style={{ width: `${stats.declinedPercent}%` }}
          onClick={() => onFilterChange?.('pending')}
          title="Klik untuk filter Ditolak"
        />
        <div 
          className={cn(
            "bg-yellow-500 transition-all duration-300 cursor-pointer hover:bg-yellow-600",
            activeFilter === 'all' && "ring-2 ring-yellow-700"
          )}
          style={{ width: `${stats.pendingPercent}%` }}
          onClick={() => onFilterChange?.('all')}
          title="Klik untuk filter Menunggu"
        />
      </div>
      
      {/* Legend - Clickable for filtering */}
      <div className="flex flex-wrap gap-4 text-xs">
        <button 
          onClick={() => onFilterChange?.('completed')}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30",
            activeFilter === 'completed' && "bg-green-100 dark:bg-green-900/30 ring-1 ring-green-500"
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          <span className="text-muted-foreground">Disetujui ({stats.approved})</span>
        </button>
        <button 
          onClick={() => onFilterChange?.('pending')}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30",
            activeFilter === 'pending' && "bg-red-100 dark:bg-red-900/30 ring-1 ring-red-500"
          )}
        >
          <XCircle className="h-3.5 w-3.5 text-red-500" />
          <span className="text-muted-foreground">Ditolak ({stats.declined})</span>
        </button>
        <button 
          onClick={() => onFilterChange?.('all')}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30",
            activeFilter === 'all' && "bg-yellow-100 dark:bg-yellow-900/30 ring-1 ring-yellow-500"
          )}
        >
          <Clock className="h-3.5 w-3.5 text-yellow-500" />
          <span className="text-muted-foreground">Menunggu ({stats.pending})</span>
        </button>
        {activeFilter !== 'all' && (
          <button 
            onClick={() => onFilterChange?.('all')}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer hover:bg-muted text-muted-foreground underline"
          >
            Reset Filter
          </button>
        )}
      </div>
    </div>
  );
}