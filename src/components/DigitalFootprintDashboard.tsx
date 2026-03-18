import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Activity, BarChart3, Power } from "lucide-react";

interface StatsProps {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  totalSessions: number;
}

interface DigitalFootprintDashboardProps {
  stats: StatsProps;
}

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
};

export default function DigitalFootprintDashboard({ stats }: DigitalFootprintDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hari Ini</CardDescription>
            <CardTitle className="text-2xl">{formatDuration(stats.todayMinutes)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              Waktu kerja hari ini
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>7 Hari Terakhir</CardDescription>
            <CardTitle className="text-2xl">{formatDuration(stats.weekMinutes)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Activity className="w-4 h-4 mr-1" />
              Total minggu ini
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>30 Hari Terakhir</CardDescription>
            <CardTitle className="text-2xl">{formatDuration(stats.monthMinutes)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <BarChart3 className="w-4 h-4 mr-1" />
              Total bulan ini
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sesi</CardDescription>
            <CardTitle className="text-2xl">{stats.totalSessions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Power className="w-4 h-4 mr-1" />
              Sesi kerja selesai
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
