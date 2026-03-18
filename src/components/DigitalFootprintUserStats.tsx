import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Clock, CheckCircle2, XCircle, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string;
}

interface UserStats {
  userId: string;
  fullName: string;
  email: string;
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  totalSessions: number;
  completedTasks: number;
  incompleteTasks: number;
}

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  userName: string;
  userEmail: string;
}

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
};

export default function DigitalFootprintUserStats() {
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [filteredStats, setFilteredStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTasks, setAllTasks] = useState<TaskItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUserStats();
    loadAllTasks();
    
    // Subscribe to real-time updates on digital_footprint table
    const channel = supabase
      .channel('digital-footprint-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'digital_footprint' 
      }, () => {
        fetchUserStats();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStats(userStats);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = userStats.filter(
        (stat) =>
          stat.fullName.toLowerCase().includes(query) ||
          stat.email.toLowerCase().includes(query)
      );
      setFilteredStats(filtered);
    }
  }, [searchQuery, userStats]);

  const loadAllTasks = () => {
    const savedTasks = localStorage.getItem('digital_footprint_tasks');
    if (savedTasks) {
      setAllTasks(JSON.parse(savedTasks));
    }
  };

  const fetchUserStats = async () => {
    try {
      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("full_name");

      if (usersError) throw usersError;

      // Fetch all digital footprint sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("digital_footprint")
        .select("*")
        .order("started_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      // Load tasks from localStorage
      const savedTasks = localStorage.getItem('digital_footprint_tasks');
      const tasks: TaskItem[] = savedTasks ? JSON.parse(savedTasks) : [];

      // Calculate stats for each user
      const stats: UserStats[] = (users || []).map((user) => {
        const userSessions = sessions?.filter(s => s.user_id === user.user_id) || [];
        const userTasks = tasks.filter(t => t.userEmail === user.email);

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const todayMinutes = userSessions
          .filter(s => new Date(s.started_at) >= today && s.duration_minutes)
          .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

        const weekMinutes = userSessions
          .filter(s => new Date(s.started_at) >= weekAgo && s.duration_minutes)
          .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

        const monthMinutes = userSessions
          .filter(s => new Date(s.started_at) >= monthAgo && s.duration_minutes)
          .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

        const completedTasks = userTasks.filter(t => t.completed).length;
        const incompleteTasks = userTasks.filter(t => !t.completed).length;

        return {
          userId: user.user_id,
          fullName: user.full_name || "User",
          email: user.email,
          todayMinutes,
          weekMinutes,
          monthMinutes,
          totalSessions: userSessions.filter(s => s.ended_at).length,
          completedTasks,
          incompleteTasks
        };
      });

      // Sort by most active (monthly minutes)
      stats.sort((a, b) => b.monthMinutes - a.monthMinutes);

      setUserStats(stats);
      setFilteredStats(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Statistik Per Pengguna</h2>
        <p className="text-muted-foreground">Waktu produktif dan status tugas setiap pegawai</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Cari nama atau email pegawai..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid Layout - 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStats.map((stat) => (
          <Card key={stat.userId}>
            <CardHeader className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {stat.fullName}
                  </CardTitle>
                  <Badge variant={stat.totalSessions > 0 ? "default" : "secondary"} className="text-xs">
                    {stat.totalSessions} Sesi
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-2 text-xs">
                  <Mail className="w-3 h-3" />
                  {stat.email}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                {/* Time Statistics */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <div className="flex items-center gap-1 text-blue-600 mb-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-medium">Hari Ini</span>
                    </div>
                    <p className="text-sm font-bold text-blue-700">
                      {formatDuration(stat.todayMinutes)}
                    </p>
                  </div>

                  <div className="bg-indigo-50 p-2 rounded-lg">
                    <div className="flex items-center gap-1 text-indigo-600 mb-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-medium">7 Hari</span>
                    </div>
                    <p className="text-sm font-bold text-indigo-700">
                      {formatDuration(stat.weekMinutes)}
                    </p>
                  </div>

                  <div className="bg-purple-50 p-2 rounded-lg">
                    <div className="flex items-center gap-1 text-purple-600 mb-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-medium">30 Hari</span>
                    </div>
                    <p className="text-sm font-bold text-purple-700">
                      {formatDuration(stat.monthMinutes)}
                    </p>
                  </div>
                </div>

                {/* Task Statistics */}
                <div className="border-t pt-3">
                  <h4 className="text-xs font-medium mb-2">Status Tugas</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border-b-4 border-green-500">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-green-600 font-medium">Selesai</p>
                        <p className="text-sm font-bold text-green-700">{stat.completedTasks}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border-b-4 border-red-500">
                      <XCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                      <div>
                        <p className="text-[10px] font-medium text-red-600">Belum Selesai</p>
                        <p className="text-sm font-bold text-red-700">{stat.incompleteTasks}</p>
                      </div>
                    </div>
                  </div>

                  {/* Task Progress Bar */}
                  {(stat.completedTasks + stat.incompleteTasks) > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>
                          {Math.round((stat.completedTasks / (stat.completedTasks + stat.incompleteTasks)) * 100)}%
                        </span>
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                        <div 
                          className="bg-green-500"
                          style={{ 
                            width: `${(stat.completedTasks / (stat.completedTasks + stat.incompleteTasks)) * 100}%` 
                          }}
                        />
                        <div 
                          className="bg-red-500"
                          style={{ 
                            width: `${(stat.incompleteTasks / (stat.completedTasks + stat.incompleteTasks)) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredStats.length === 0 && !loading && (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {searchQuery ? "Tidak ada hasil pencarian" : "Belum ada data pengguna"}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
