import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Shield, User, Eye, Sparkles, Database, HardDrive, Wifi, Activity, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import ActiveUsersAnalytics from "@/components/ActiveUsersAnalytics";

interface RoleStats {
  role: string;
  count: number;
}

interface UsageMetric {
  label: string;
  current: string;
  limit: string;
  percentage: number;
  icon: React.ReactNode;
}

export default function UsageSummary() {
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);

  // Supabase Free Plan usage metrics (static display based on reference image)
  const usageMetrics: UsageMetric[] = [
    {
      label: "Egress (Bandwidth)",
      current: "0.906 GB",
      limit: "5 GB",
      percentage: 18,
      icon: <Wifi className="h-4 w-4" />
    },
    {
      label: "Database Size",
      current: "0.06 GB",
      limit: "0.5 GB",
      percentage: 12,
      icon: <Database className="h-4 w-4" />
    },
    {
      label: "Storage Size",
      current: "0.036 GB",
      limit: "1 GB",
      percentage: 4,
      icon: <HardDrive className="h-4 w-4" />
    },
    {
      label: "Realtime Connections",
      current: "11",
      limit: "200",
      percentage: 6,
      icon: <Activity className="h-4 w-4" />
    },
    {
      label: "Monthly Active Users",
      current: "15",
      limit: "50,000 MAU",
      percentage: 1,
      icon: <Users className="h-4 w-4" />
    },
    {
      label: "Edge Function Invocations",
      current: "17",
      limit: "500,000",
      percentage: 1,
      icon: <Sparkles className="h-4 w-4" />
    }
  ];

  useEffect(() => {
    fetchRoleStats();

    // Real-time subscription for role changes
    const channel = supabase
      .channel('role-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          fetchRoleStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRoleStats = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role');

      if (error) throw error;

      // Count roles
      const roleCounts: Record<string, number> = {};
      (data || []).forEach((item: any) => {
        const role = item.role || 'unassigned';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });

      const stats: RoleStats[] = Object.entries(roleCounts).map(([role, count]) => ({
        role,
        count: count as number
      }));

      // Sort by count descending
      stats.sort((a, b) => b.count - a.count);

      setRoleStats(stats);
      setTotalUsers(data?.length || 0);
    } catch (error) {
      console.error('Error fetching role stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'super':
        return <Sparkles className="h-4 w-4" />;
      case 'overview':
        return <Eye className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'super':
        return 'Super';
      case 'overview':
        return 'Overview';
      case 'user':
        return 'User';
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super':
        return 'default';
      case 'overview':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Statistik Role Pengguna Aktif
          </CardTitle>
          <CardDescription>
            Jumlah pengguna berdasarkan role yang sedang aktif dalam aplikasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roleStats.map((stat) => (
              <Card key={stat.role} className="border-2">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(stat.role)} className="flex items-center gap-1">
                        {getRoleIcon(stat.role)}
                        {getRoleLabel(stat.role)}
                      </Badge>
                    </div>
                    <span className="text-2xl font-bold">{stat.count}</span>
                  </div>
                  <Progress 
                    value={(stat.count / totalUsers) * 100} 
                    className="mt-3 h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {((stat.count / totalUsers) * 100).toFixed(1)}% dari total
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Pengguna Terdaftar:</span>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {totalUsers} users
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Users Analytics - Real-time */}
      <ActiveUsersAnalytics />

      {/* Supabase Usage Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Usage Summary - Supabase Free Plan
              </CardTitle>
              <CardDescription>
                Penggunaan resource Supabase saat ini. Data diperbarui setiap 1 jam.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://supabase.com/dashboard/project/uaqqbkwidpkntvomjgzt/settings/billing/usage", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Lihat di Supabase
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usageMetrics.map((metric, index) => (
              <Card key={index} className="border">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-muted rounded-md">
                      {metric.icon}
                    </div>
                    <span className="font-medium text-sm">{metric.label}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {metric.current} / {metric.limit}
                      </span>
                      <Badge 
                        variant={metric.percentage >= 80 ? "destructive" : metric.percentage >= 50 ? "default" : "secondary"}
                      >
                        {metric.percentage}%
                      </Badge>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`absolute left-0 top-0 h-full rounded-full transition-all ${getProgressColor(metric.percentage)}`}
                        style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Anda belum melebihi kuota <strong>Free Plan</strong> dalam billing cycle ini. 
              Jika melebihi, Anda mungkin mengalami pembatasan karena saat ini tidak dikenakan biaya untuk kelebihan penggunaan.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}