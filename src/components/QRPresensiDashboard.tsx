import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Calendar, CheckCircle2, MapPin } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface QREvent {
  id: string;
  nama_kegiatan: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  is_active: boolean;
}

interface AttendanceResponse {
  id: string;
  event_id: string;
  nama: string;
  distance_meter: number;
  waktu_absen: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function QRPresensiDashboard() {
  const [events, setEvents] = useState<QREvent[]>([]);
  const [responses, setResponses] = useState<AttendanceResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, responsesRes] = await Promise.all([
        supabase.from("qr_presensi_events").select("id, nama_kegiatan, tanggal_mulai, tanggal_selesai, is_active").order("created_at", { ascending: false }),
        supabase.from("qr_presensi_responses").select("id, event_id, nama, distance_meter, waktu_absen").order("waktu_absen", { ascending: false })
      ]);

      setEvents(eventsRes.data || []);
      setResponses(responsesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Statistics
  const totalEvents = events.length;
  const activeEvents = events.filter(e => e.is_active).length;
  const totalResponses = responses.length;
  const validResponses = responses.filter(r => r.distance_meter <= 5).length;

  // Per-event statistics
  const eventStats = events.map(event => {
    const eventResponses = responses.filter(r => r.event_id === event.id);
    const validCount = eventResponses.filter(r => r.distance_meter <= 5).length;
    return {
      name: event.nama_kegiatan.length > 20 ? event.nama_kegiatan.substring(0, 20) + "..." : event.nama_kegiatan,
      fullName: event.nama_kegiatan,
      total: eventResponses.length,
      valid: validCount,
      invalid: eventResponses.length - validCount,
      isActive: event.is_active
    };
  }).slice(0, 10);

  // Status distribution for pie chart
  const statusData = [
    { name: 'Valid', value: validResponses },
    { name: 'Diluar Radius', value: totalResponses - validResponses }
  ];

  // Daily responses for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const dailyData = last7Days.map(date => {
    const dayResponses = responses.filter(r => {
      const responseDate = new Date(r.waktu_absen).toISOString().split('T')[0];
      return responseDate === date;
    });
    return {
      date: format(new Date(date), "dd MMM", { locale: id }),
      total: dayResponses.length,
      valid: dayResponses.filter(r => r.distance_meter <= 5).length
    };
  });

  if (loading) {
    return <div className="text-center py-8">Memuat data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Total Kegiatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <p className="text-xs text-muted-foreground">{activeEvents} aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Absensi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResponses}</div>
            <p className="text-xs text-muted-foreground">dari semua kegiatan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Absensi Valid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{validResponses}</div>
            <p className="text-xs text-muted-foreground">
              {totalResponses > 0 ? Math.round((validResponses / totalResponses) * 100) : 0}% dari total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              Diluar Radius
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalResponses - validResponses}</div>
            <p className="text-xs text-muted-foreground">
              {totalResponses > 0 ? Math.round(((totalResponses - validResponses) / totalResponses) * 100) : 0}% dari total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Absensi 7 Hari Terakhir</CardTitle>
            <CardDescription>Trend absensi harian</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="valid" name="Valid" fill="#10B981" stackId="a" />
                <Bar dataKey="total" name="Total" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Status Absensi</CardTitle>
            <CardDescription>Berdasarkan validasi lokasi</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#F59E0B'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Per-Event Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistik Per Kegiatan</CardTitle>
          <CardDescription>Detail absensi untuk setiap kegiatan</CardDescription>
        </CardHeader>
        <CardContent>
          {eventStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Belum ada data kegiatan</p>
          ) : (
            <div className="space-y-4">
              {eventStats.map((event, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${event.isActive ? 'bg-green-500' : 'bg-gray-400'}`} 
                        title={event.isActive ? 'Aktif' : 'Tidak Aktif'}
                      />
                      <h4 className="font-medium" title={event.fullName}>{event.name}</h4>
                    </div>
                    <span className="text-sm text-muted-foreground">{event.total} absensi</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">Valid: {event.valid}</span>
                      <span className="text-amber-600">Diluar Radius: {event.invalid}</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                      {event.total > 0 && (
                        <>
                          <div 
                            className="bg-green-500 transition-all"
                            style={{ width: `${(event.valid / event.total) * 100}%` }}
                          />
                          <div 
                            className="bg-amber-500 transition-all"
                            style={{ width: `${(event.invalid / event.total) * 100}%` }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
