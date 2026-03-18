import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Power, PowerOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function HeaderWorkButton() {
  const { fullName, user } = useAuth();
  const [isWorking, setIsWorking] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    checkCurrentSession();
  }, []);

  // Auto-tracking: detect user activity
  useEffect(() => {
    if (!isAutoMode || !isWorking) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Check for inactivity periodically
    inactivityTimerRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity > INACTIVITY_THRESHOLD && isWorking) {
        handleStopWork(true);
      }
    }, 30000); // Check every 30 seconds

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, [isAutoMode, isWorking]);

  const checkCurrentSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("digital_footprint")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "on")
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setIsWorking(true);
      setCurrentSessionId(data.id);
    }
  };

  const handleStartWork = async (autoMode: boolean = false) => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Anda harus login terlebih dahulu");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("digital_footprint")
      .insert({
        user_id: user.id,
        status: "on",
        tasks: autoMode ? "Mode Otomatis" : "Mode Manual",
        notes: `${fullName || user?.email || 'User'} - Mulai kerja ${autoMode ? '(Otomatis)' : '(Manual)'}`
      })
      .select()
      .single();

    if (error) {
      toast.error("Gagal memulai sesi kerja");
      setIsLoading(false);
      return;
    }

    setIsWorking(true);
    setCurrentSessionId(data.id);
    setIsAutoMode(autoMode);
    lastActivityRef.current = Date.now();
    toast.success(`Sesi kerja dimulai ${autoMode ? '(Mode Otomatis)' : '(Mode Manual)'}`);
    setIsLoading(false);
  };

  const handleStopWork = async (isAutoStop: boolean = false) => {
    if (!currentSessionId) return;
    setIsLoading(true);

    const { data: currentSession } = await supabase
      .from("digital_footprint")
      .select("started_at")
      .eq("id", currentSessionId)
      .single();

    if (!currentSession) {
      setIsLoading(false);
      return;
    }

    const startTime = new Date(currentSession.started_at);
    const endTime = new Date();
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);

    const { error } = await supabase
      .from("digital_footprint")
      .update({
        status: "off",
        ended_at: endTime.toISOString(),
        duration_minutes: durationMinutes,
        notes: isAutoStop ? "Berhenti otomatis (Inaktif)" : "Berhenti manual"
      })
      .eq("id", currentSessionId);

    if (error) {
      toast.error("Gagal menghentikan sesi kerja");
      setIsLoading(false);
      return;
    }

    setIsWorking(false);
    setCurrentSessionId(null);
    setIsAutoMode(false);
    toast.success(`Sesi kerja selesai. Durasi: ${durationMinutes} menit`);
    setIsLoading(false);
  };

  // Auto-stop when page visibility changes (device sleep/tab hidden)
  useEffect(() => {
    if (!isAutoMode || !isWorking) return;

    const handleVisibilityChange = () => {
      if (document.hidden && isWorking && isAutoMode) {
        handleStopWork(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAutoMode, isWorking, currentSessionId]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => isWorking ? handleStopWork() : handleStartWork(false)}
      disabled={isLoading}
      className={`h-8 w-8 sm:h-9 sm:w-9 ${isWorking ? 'text-red-300 hover:text-red-200 hover:bg-red-500/20' : 'text-white hover:bg-white/20'}`}
      title={isWorking ? "Selesai Kerja" : "Mulai Kerja"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
      ) : isWorking ? (
        <PowerOff className="h-4 w-4 sm:h-5 sm:w-5" />
      ) : (
        <Power className="h-4 w-4 sm:h-5 sm:w-5" />
      )}
    </Button>
  );
}
