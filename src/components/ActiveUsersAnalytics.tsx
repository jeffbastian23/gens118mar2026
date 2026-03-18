import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Activity, Clock, TrendingUp } from "lucide-react";

interface ActiveUser {
  email: string;
  full_name: string;
  online_at: string;
  current_page?: string;
}

interface ActiveUsersStats {
  total: number;
  byPage: Record<string, number>;
}

export default function ActiveUsersAnalytics() {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [stats, setStats] = useState<ActiveUsersStats>({ total: 0, byPage: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const channel = supabase.channel('active-users-presence', {
      config: {
        presence: { key: 'active_users' },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: ActiveUser[] = [];
        const pageStats: Record<string, number> = {};

        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence: any) => {
            if (presence.email) {
              users.push({
                email: presence.email,
                full_name: presence.full_name || presence.email,
                online_at: presence.online_at,
                current_page: presence.current_page || 'Beranda',
              });

              const page = presence.current_page || 'Beranda';
              pageStats[page] = (pageStats[page] || 0) + 1;
            }
          });
        });

        setActiveUsers(users);
        setStats({
          total: users.length,
          byPage: pageStats,
        });
        setLoading(false);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const getTopPages = () => {
    return Object.entries(stats.byPage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-500" />
          Analitik Pengguna Aktif Real-time
        </CardTitle>
        <CardDescription>
          Pengguna yang sedang mengakses aplikasi saat ini
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Active Users */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-green-800">Sedang Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-3xl font-bold text-green-700">{stats.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Peak Time Info */}
          <Card className="border">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-muted rounded-full">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">Update</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date().toLocaleTimeString('id-ID')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Top Page */}
          <Card className="border">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-muted rounded-full">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">Halaman Populer</span>
                </div>
                <Badge variant="secondary">
                  {getTopPages()[0]?.[0] || '-'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Users List */}
        {activeUsers.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Daftar Pengguna Aktif ({activeUsers.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeUsers.map((user, index) => (
                <div
                  key={`${user.email}-${index}`}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {(user.full_name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.full_name || user.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.current_page} • {formatTime(user.online_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Tidak ada pengguna aktif saat ini</p>
            <p className="text-xs mt-1">Pengguna akan muncul saat mereka mengakses aplikasi</p>
          </div>
        )}

        {/* Page Distribution */}
        {Object.keys(stats.byPage).length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Distribusi Halaman yang Diakses
            </h4>
            <div className="flex flex-wrap gap-2">
              {getTopPages().map(([page, count]) => (
                <Badge key={page} variant="outline" className="py-1 px-3">
                  {page}: {count} user
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
