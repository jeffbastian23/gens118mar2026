import { Check, X, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TrackingStage {
  label: string;
  completed: boolean;
  timestamp?: string;
  email?: string;
  status?: string;
  catatan?: string;
  pendingVerifier?: string; // Name/email of verifier when status is pending
}

interface TrackingProgressProps {
  stages: TrackingStage[];
}

export default function TrackingProgress({ stages }: TrackingProgressProps) {
  return (
    <div className="relative py-4 isolate">
      {/* Progress Line */}
      <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-border" />
      
      {/* Stages */}
      <div className="space-y-5">
        {stages.map((stage, index) => {
          const isDeclined = stage.status === 'Ditolak';
          const isPending = stage.label === 'Verifikasi Keuangan' && !stage.completed && !isDeclined && stages[index - 1]?.completed;
          
          return (
            <div key={index} className="relative flex items-start gap-3">
              {/* Circle Icon */}
              <div
                className={`relative flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                  isDeclined
                    ? "bg-destructive border-destructive shadow-sm"
                    : stage.completed
                    ? "bg-primary border-primary shadow-sm"
                    : isPending
                    ? "bg-yellow-500 border-yellow-500 shadow-sm animate-pulse"
                    : "bg-background border-border"
                }`}
              >
                {isDeclined ? (
                  <X className="h-4 w-4 text-destructive-foreground" />
                ) : stage.completed ? (
                  <Check className="h-4 w-4 text-primary-foreground" />
                ) : isPending ? (
                  <AlertCircle className="h-4 w-4 text-white" />
                ) : null}
              </div>

              {/* Stage Info */}
              <div className="flex-1 min-w-0 pt-1">
                <div className={`text-sm font-medium ${
                  isDeclined 
                    ? "text-destructive" 
                    : stage.completed 
                    ? "text-foreground" 
                    : isPending
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-muted-foreground"
                }`}>
                  {stage.label}
                  {stage.status && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      isDeclined 
                        ? "bg-destructive/10 text-destructive" 
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }`}>
                      {stage.status}
                    </span>
                  )}
                  {/* Show "Auto System" label when verified by system */}
                  {stage.completed && stage.email === "Auto System" && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      Auto System
                    </span>
                  )}
                {isPending && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Menunggu
                    </span>
                  )}
                </div>
                {(stage.completed || isDeclined) && stage.timestamp && (
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <div>{format(new Date(stage.timestamp), "dd MMM yyyy, HH:mm", { locale: id })}</div>
                    {stage.email && <div className="italic truncate">{stage.email}</div>}
                    {isDeclined && stage.catatan && (
                      <div className="mt-1 text-xs bg-destructive/10 text-destructive p-2 rounded border border-destructive/20">
                        <span className="font-medium">Catatan:</span> {stage.catatan}
                      </div>
                    )}
                  </div>
                )}
                {/* Show pending verifier info when status is pending */}
                {isPending && stage.pendingVerifier && (
                  <div className="text-xs text-muted-foreground mt-1 italic">
                    Verifikator: {stage.pendingVerifier}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
