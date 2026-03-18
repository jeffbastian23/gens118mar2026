import { useMemo } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  no_satu_kemenkeu?: string;
  tanggal_satu_kemenkeu?: string;
}

interface ProgressPenugasanBarProps {
  assignments: Assignment[];
  onFilterChange?: (filter: 'all' | 'completed' | 'pending') => void;
  activeFilter?: 'all' | 'completed' | 'pending';
}

export default function ProgressPenugasanBar({ 
  assignments, 
  onFilterChange,
  activeFilter = 'all'
}: ProgressPenugasanBarProps) {
  const stats = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter(a => 
      a.no_satu_kemenkeu && a.tanggal_satu_kemenkeu
    ).length;
    const pending = assignments.filter(a => 
      !a.no_satu_kemenkeu || !a.tanggal_satu_kemenkeu
    ).length;
    
    return {
      total,
      completed,
      pending,
      completedPercent: total > 0 ? (completed / total) * 100 : 0,
      pendingPercent: total > 0 ? (pending / total) * 100 : 0,
    };
  }, [assignments]);

  if (stats.total === 0) {
    return null;
  }

  return (
    <div className="p-4 border rounded-lg bg-card mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm">Progress Penugasan</h4>
        <span className="text-xs text-muted-foreground">
          {stats.completed} / {stats.total} Selesai
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex mb-3">
        <div 
          className={cn(
            "bg-green-500 transition-all duration-300 cursor-pointer hover:bg-green-600",
            activeFilter === 'completed' && "ring-2 ring-green-700"
          )}
          style={{ width: `${stats.completedPercent}%` }}
          onClick={() => onFilterChange?.('completed')}
          title="Klik untuk filter Sudah Selesai"
        />
        <div 
          className={cn(
            "bg-red-500 transition-all duration-300 cursor-pointer hover:bg-red-600",
            activeFilter === 'pending' && "ring-2 ring-red-700"
          )}
          style={{ width: `${stats.pendingPercent}%` }}
          onClick={() => onFilterChange?.('pending')}
          title="Klik untuk filter Belum Selesai"
        />
      </div>
      
      {/* Legend - Clickable for filtering */}
      <div className="flex justify-between text-xs">
        <button 
          onClick={() => onFilterChange?.('completed')}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30",
            activeFilter === 'completed' && "bg-green-100 dark:bg-green-900/30 ring-1 ring-green-500"
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          <span className="text-muted-foreground">Sudah Selesai ({stats.completed})</span>
        </button>
        <button 
          onClick={() => onFilterChange?.('pending')}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30",
            activeFilter === 'pending' && "bg-red-100 dark:bg-red-900/30 ring-1 ring-red-500"
          )}
        >
          <XCircle className="h-3.5 w-3.5 text-red-500" />
          <span className="text-muted-foreground">Belum Selesai ({stats.pending})</span>
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