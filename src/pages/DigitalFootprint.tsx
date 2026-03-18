import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Database, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DigitalFootprintDashboard from "@/components/DigitalFootprintDashboard";
import DigitalFootprintDatabase from "@/components/DigitalFootprintDatabase";
import DigitalFootprintUserStats from "@/components/DigitalFootprintUserStats";
import AIVoicePage from "@/components/AIVoicePage";
import { useAuth } from "@/hooks/useAuth";
import { useSubMenuAccess } from "@/hooks/useSubMenuAccess";

interface WorkSession {
  id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  tasks: string | null;
  notes: string | null;
}

export default function DigitalFootprint() {
  const { role } = useAuth();
  const { hasSubMenuAccess, loading: subMenuLoading } = useSubMenuAccess("digital-footprint");
  // Admin, super, dan overview bisa melihat Dashboard & Database tabs
  const canViewDashboard = role === "admin" || role === "super" || role === "overview";
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [stats, setStats] = useState({
    todayMinutes: 0,
    weekMinutes: 0,
    monthMinutes: 0,
    totalSessions: 0
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("digital_footprint")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(20);

    if (error) {
      toast.error("Gagal memuat data sesi kerja");
      return;
    }

    setSessions(data || []);
    calculateStats(data || []);
  };

  const calculateStats = (data: WorkSession[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayMinutes = data
      .filter(s => new Date(s.started_at) >= today && s.duration_minutes)
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    const weekMinutes = data
      .filter(s => new Date(s.started_at) >= weekAgo && s.duration_minutes)
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    const monthMinutes = data
      .filter(s => new Date(s.started_at) >= monthAgo && s.duration_minutes)
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    setStats({
      todayMinutes,
      weekMinutes,
      monthMinutes,
      totalSessions: data.filter(s => s.ended_at).length
    });
  };

  // Count visible tabs for grid
  const visibleTabs = [
    canViewDashboard && hasSubMenuAccess("digital-footprint:dashboard"),
    hasSubMenuAccess("digital-footprint:database"),
    hasSubMenuAccess("digital-footprint:ai-voice"),
  ].filter(Boolean).length;

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Beranda", path: "/" },
        { label: "Digital Footprint" }
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Digital Footprint</h1>
            <p className="text-muted-foreground">Lacak aktivitas kerja dan efektivitas produktivitas Anda</p>
          </div>
        </div>

        <Tabs defaultValue="database" className="w-full">
          <TabsList className={`grid w-full max-w-lg`} style={{ gridTemplateColumns: `repeat(${visibleTabs || 1}, 1fr)` }}>
            {canViewDashboard && hasSubMenuAccess("digital-footprint:dashboard") && (
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
            )}
            {hasSubMenuAccess("digital-footprint:database") && (
              <TabsTrigger value="database" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Database
              </TabsTrigger>
            )}
            {hasSubMenuAccess("digital-footprint:ai-voice") && (
              <TabsTrigger value="ai-voice" className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                AI Voice
              </TabsTrigger>
            )}
          </TabsList>
          
          {canViewDashboard && hasSubMenuAccess("digital-footprint:dashboard") && (
            <TabsContent value="dashboard" className="mt-6">
              <DigitalFootprintDashboard stats={stats} />
              <div className="mt-8">
                <DigitalFootprintUserStats />
              </div>
            </TabsContent>
          )}
          
          {hasSubMenuAccess("digital-footprint:database") && (
            <TabsContent value="database" className="mt-6">
              <DigitalFootprintDatabase sessions={sessions} onRefresh={fetchSessions} />
            </TabsContent>
          )}

          {hasSubMenuAccess("digital-footprint:ai-voice") && (
            <TabsContent value="ai-voice" className="mt-6">
              <AIVoicePage />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
}
