import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Clock, Users, Briefcase, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Profile {
  user_id: string;
  email: string;
  full_name: string | null;
  user_status: string | null;
}

interface ActiveSession {
  id: string;
  user_id: string;
  status: string;
  started_at: string;
  tasks: string | null;
  notes: string | null;
  user_email?: string;
  user_name?: string;
}

interface LiveStatusPanelProps {
  currentUserId: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  available: { label: "Tersedia", color: "bg-green-500", bgColor: "bg-green-500/20" },
  busy: { label: "Sibuk", color: "bg-red-500", bgColor: "bg-red-500/20" },
  away: { label: "Away", color: "bg-yellow-500", bgColor: "bg-yellow-500/20" },
  in_meeting: { label: "Meeting", color: "bg-purple-500", bgColor: "bg-purple-500/20" },
  working: { label: "Bekerja", color: "bg-blue-500", bgColor: "bg-blue-500/20" },
};

const formatDuration = (startedAt: string) => {
  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
};

export default function LiveStatusPanel({ currentUserId }: LiveStatusPanelProps) {
  const { role } = useAuth();
  const isAdmin = role === "admin" || role === "super";
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stoppingSession, setStoppingSession] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const fetchData = async () => {
    try {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, email, full_name, user_status");

      const { data: sessionsData } = await supabase
        .from("digital_footprint")
        .select("id, user_id, status, started_at, tasks, notes")
        .eq("status", "on")
        .is("ended_at", null);

      if (profilesData) {
        setProfiles(profilesData.filter(p => p.user_id !== currentUserId));
      }

      if (sessionsData && profilesData) {
        const enrichedSessions = sessionsData.map(session => {
          const profile = profilesData.find(p => p.user_id === session.user_id);
          return {
            ...session,
            user_email: profile?.email,
            user_name: profile?.full_name,
          };
        });
        setActiveSessions(enrichedSessions);
      }
    } catch (error) {
      console.error("Error fetching live status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminStopSession = async (session: ActiveSession) => {
    if (!isAdmin) return;
    setStoppingSession(session.id);
    try {
      const startTime = new Date(session.started_at);
      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);

      const { error } = await supabase
        .from("digital_footprint")
        .update({
          status: "off",
          ended_at: endTime.toISOString(),
          duration_minutes: durationMinutes,
          notes: "Dihentikan oleh Admin"
        })
        .eq("id", session.id);

      if (error) throw error;

      toast.success(`Sesi ${session.user_name || session.user_email} berhasil dihentikan`);
      fetchData();
    } catch (error) {
      console.error("Error stopping session:", error);
      toast.error("Gagal menghentikan sesi");
    } finally {
      setStoppingSession(null);
    }
  };

  const onlineProfiles = profiles.filter(p => 
    p.user_status && p.user_status !== "offline"
  );

  if (loading) {
    return (
      <div className="flex gap-3 w-full">
        <div className="flex-[2] bg-white/10 rounded-lg p-3 animate-pulse">
          <div className="h-4 bg-white/20 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-white/20 rounded"></div>
        </div>
        <div className="flex-1 bg-white/10 rounded-lg p-3 animate-pulse">
          <div className="h-4 bg-white/20 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 w-full">
      {/* Status Rekan Section */}
      <div className="flex-[2] bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-white" />
          <h3 className="text-xs font-semibold text-white">Status Rekan</h3>
          <Badge variant="secondary" className="ml-auto text-[10px] bg-white/20 text-white border-0 px-1.5 py-0">
            {onlineProfiles.length} online
          </Badge>
        </div>
        
        <ScrollArea className="h-[100px]">
          {onlineProfiles.length > 0 ? (
            <div className="flex flex-wrap gap-2 pb-1">
              {onlineProfiles.map((profile) => {
                const status = statusConfig[profile.user_status || "available"];
                const activeSession = activeSessions.find(s => s.user_id === profile.user_id);
                return (
                  <div 
                    key={profile.user_id} 
                    className="flex items-center gap-1.5 bg-white/5 rounded-full px-2 py-1"
                    title={`${profile.full_name || profile.email}${activeSession ? ` - Bekerja (${formatDuration(activeSession.started_at)})` : ''}`}
                  >
                    <div className="relative">
                      <Avatar className="w-5 h-5 border border-white/30">
                        <AvatarFallback className="bg-blue-500 text-white text-[8px]">
                          {(profile.full_name || profile.email)?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white",
                        activeSession ? "bg-green-500 animate-pulse" : status.color
                      )} />
                    </div>
                    <span className="text-[10px] text-white truncate max-w-[70px]">
                      {(profile.full_name || profile.email?.split("@")[0])?.split(" ")[0]}
                    </span>
                    {activeSession && (
                      <span className="text-[8px] text-green-300 ml-0.5">
                        {formatDuration(activeSession.started_at)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-white/60 text-center py-2">
              Tidak ada rekan online
            </p>
          )}
        </ScrollArea>
      </div>

      {/* Live Project Section */}
      <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-white" />
          <h3 className="text-xs font-semibold text-white">Live Project</h3>
          <Badge variant="secondary" className="ml-auto text-[10px] bg-green-500/30 text-white border-0 px-1.5 py-0">
            {activeSessions.length} aktif
          </Badge>
        </div>
        
        <ScrollArea className="h-[100px]">
          {activeSessions.length > 0 ? (
            <div className="space-y-1.5 pb-1">
              {activeSessions.map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-center gap-2 bg-white/5 rounded px-2 py-1 group"
                  title={session.tasks || session.notes || 'Sesi aktif'}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                  <span className="text-[10px] text-white truncate flex-1">
                    {session.user_name || session.user_email?.split("@")[0]}
                  </span>
                  <span className="text-[9px] text-white/60">
                    {formatDuration(session.started_at)}
                  </span>
                  {isAdmin && session.user_id !== currentUserId && (
                    <button
                      onClick={() => handleAdminStopSession(session)}
                      disabled={stoppingSession === session.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-500/30 text-red-300 hover:text-red-200 flex-shrink-0"
                      title="Hentikan sesi (Admin)"
                    >
                      <Square className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-2">
              <Briefcase className="w-4 h-4 text-white/30 mx-auto mb-1" />
              <p className="text-[10px] text-white/60">Tidak ada sesi aktif</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
