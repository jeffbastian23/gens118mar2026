import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, FileText, MapPin, Calendar, Building2, Briefcase, Award, DollarSign, Wallet, TrendingDown, TrendingUp, Clock, CheckCircle, Star, Shield } from "lucide-react";
import { format, startOfDay, endOfDay, isWithinInterval, parseISO, isBefore, isAfter, isToday } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import AppLayout from "@/components/layout/AppLayout";
import AuditTeamStatsCard from "@/components/AuditTeamStatsCard";

interface DashboardStats {
  totalEmployees: number;
  totalAssignments: number;
  uniqueLocations: number;
  todayAssignments: number;
  unitPenerbitStats: { unit: string; count: number }[];
  unitPemohonStats: { unit: string; count: number }[];
  recentActivities: { date: string; count: number }[];
  locationStats: { location: string; count: number }[];
  topEmployees: { name: string; count: number }[];
  cityBudgetStats: { city: string; count: number; locationType: string }[];
  notaDinasDownloaded: number;
  notaDinasNotDownloaded: number;
  suratTugasDownloaded: number;
  suratTugasNotDownloaded: number;
  timUpkStats: { name: string; email: string; count: number }[];
  futureAssignments: { name: string; count: number; employees: string[]; location: string; startDate: string; endDate: string }[];
  presentAssignments: { name: string; count: number; employees: string[]; location: string; startDate: string; endDate: string }[];
  pastAssignments: { name: string; count: number; employees: string[]; location: string; startDate: string; endDate: string }[];
  timelineStats: { period: string; count: number }[];
  sumberStats: { sumber: string; count: number }[];
  ratingStats: { rating: number; count: number; label: string }[];
  averageRating: number;
  totalRated: number;
  auditTeamStats: { nama: string; jabatan: string; role: string; count: number }[];
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DashboardProps {
  embedded?: boolean;
}

export default function Dashboard({ embedded = false }: DashboardProps) {
  const { user, role, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [location] = useState("Surabaya, Jawa Timur");
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalAssignments: 0,
    uniqueLocations: 0,
    todayAssignments: 0,
    unitPenerbitStats: [],
    unitPemohonStats: [],
    recentActivities: [],
    locationStats: [],
    topEmployees: [],
    cityBudgetStats: [],
    notaDinasDownloaded: 0,
    notaDinasNotDownloaded: 0,
    suratTugasDownloaded: 0,
    suratTugasNotDownloaded: 0,
    timUpkStats: [],
    futureAssignments: [],
    presentAssignments: [],
    pastAssignments: [],
    timelineStats: [],
    sumberStats: [],
    ratingStats: [],
    averageRating: 0,
    totalRated: 0,
    auditTeamStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [perihalFilter, setPerihalFilter] = useState<string>("all");
  const [availablePerihal, setAvailablePerihal] = useState<string[]>([]);
  const [selectedTimelineStatus, setSelectedTimelineStatus] = useState<'future' | 'present' | 'past'>('future');

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Update current date every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to realtime changes for assignments and city_budgets
    const assignmentsChannel = supabase
      .channel('assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        () => {
          console.log('Assignment data changed, refreshing dashboard...');
          fetchDashboardData();
        }
      )
      .subscribe();

    const budgetsChannel = supabase
      .channel('city-budgets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'city_budgets'
        },
        () => {
          console.log('City budgets changed, refreshing dashboard...');
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(budgetsChannel);
    };
  }, [dateRange, perihalFilter]);

  const fetchDashboardData = async () => {
    try {
      // Fetch total employees
      const { count: employeeCount } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });

      // Fetch employees with only needed columns (id, nm_pegawai for name lookup)
      let allEmployees: any[] = [];
      let employeePage = 0;
      const employeePageSize = 1000;
      let hasMoreEmployees = true;
      
      while (hasMoreEmployees) {
        const { data: employeeBatch } = await supabase
          .from("employees")
          .select("id, nm_pegawai")
          .range(employeePage * employeePageSize, (employeePage + 1) * employeePageSize - 1);
        
        if (employeeBatch && employeeBatch.length > 0) {
          allEmployees = [...allEmployees, ...employeeBatch];
          hasMoreEmployees = employeeBatch.length === employeePageSize;
          employeePage++;
        } else {
          hasMoreEmployees = false;
        }
      }
      const employeeData = allEmployees;

      // Fetch Tim UPK data
      const { data: timUpkData } = await supabase
        .from("tim_upk")
        .select("*");

      // Fetch city budgets (using type assertion until schema is synced)
      const { data: cityBudgets } = await supabase
        .from("city_budgets" as any)
        .select("*");

      // Fetch budget configuration (using type assertion until schema is synced)
      const { data: budgetConfig } = await supabase
        .from("budget_config" as any)
        .select("*")
        .eq("fiscal_year", new Date().getFullYear())
        .maybeSingle();

      // Fetch all assignments
      const { data: allAssignments } = await supabase
        .from("assignments")
        .select("*");

      if (allAssignments) {
        // Extract unique perihal values
        const uniquePerihal = Array.from(new Set(allAssignments.map(a => a.perihal))).filter(Boolean);
        setAvailablePerihal(uniquePerihal);

        // Filter by date range and perihal if selected
        let assignments = allAssignments;
        if (dateRange.from || dateRange.to || perihalFilter) {
          assignments = allAssignments.filter(a => {
            let matchesDate = true;
            let matchesPerihal = true;

            // Date filter
            if (dateRange.from || dateRange.to) {
              try {
                const assignmentDate = a.tanggal_mulai_kegiatan ? parseISO(a.tanggal_mulai_kegiatan) : null;
                if (assignmentDate && dateRange.from && dateRange.to) {
                  matchesDate = isWithinInterval(assignmentDate, { start: dateRange.from, end: dateRange.to });
                } else if (dateRange.from) {
                  matchesDate = assignmentDate >= dateRange.from;
                } else if (dateRange.to) {
                  matchesDate = assignmentDate <= dateRange.to;
                }
              } catch {
                matchesDate = true;
              }
            }

            // Perihal filter
            if (perihalFilter && perihalFilter !== "all") {
              matchesPerihal = a.perihal === perihalFilter;
            }

            return matchesDate && matchesPerihal;
          });
        }
        // Total assignments
        const totalAssignments = assignments.length;

        // Unique locations
        const locations = new Set(assignments.map(a => a.tempat_penugasan));
        const uniqueLocations = locations.size;

        // Today's assignments
        const todayDate = new Date();
        const todayStr = format(todayDate, "yyyy-MM-dd");
        const todayAssignments = assignments.filter(a => 
          a.tanggal_mulai_kegiatan === todayStr
        ).length;

        // Unit Penerbit statistics
        const unitPenerbitMap = new Map<string, number>();
        assignments.forEach(a => {
          const count = unitPenerbitMap.get(a.unit_penerbit) || 0;
          unitPenerbitMap.set(a.unit_penerbit, count + 1);
        });
        const unitPenerbitStats = Array.from(unitPenerbitMap.entries())
          .map(([unit, count]) => ({ unit, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Unit Pemohon statistics
        const unitPemohonMap = new Map<string, number>();
        assignments.forEach(a => {
          const count = unitPemohonMap.get(a.unit_pemohon) || 0;
          unitPemohonMap.set(a.unit_pemohon, count + 1);
        });
        const unitPemohonStats = Array.from(unitPemohonMap.entries())
          .map(([unit, count]) => ({ unit, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Recent activities (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return format(date, "yyyy-MM-dd");
        }).reverse();

        const recentActivities = last7Days.map(date => ({
          date,
          count: assignments.filter(a => a.tanggal_mulai_kegiatan === date).length,
        }));

        // Location statistics
        const locationMap = new Map<string, number>();
        assignments.forEach(a => {
          const count = locationMap.get(a.tempat_penugasan) || 0;
          locationMap.set(a.tempat_penugasan, count + 1);
        });
        const locationStats = Array.from(locationMap.entries())
          .map(([location, count]) => ({ location, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Top employees by assignment count with proper name lookup
        const employeeAssignmentMap = new Map<string, number>();
        assignments.forEach(a => {
          if (a.employee_ids && Array.isArray(a.employee_ids)) {
            a.employee_ids.forEach((empId: string) => {
              const count = employeeAssignmentMap.get(empId) || 0;
              employeeAssignmentMap.set(empId, count + 1);
            });
          }
        });
        
        const topEmployees = Array.from(employeeAssignmentMap.entries())
          .map(([empId, count]) => {
            const employee = employeeData?.find(e => e.id === empId);
            return employee ? { 
              name: employee.nm_pegawai, 
              count 
            } : null;
          })
          .filter((entry): entry is { name: string; count: number } => entry !== null)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Calculate budget statistics by location type (Dalam Kantor / Luar Kantor)
        const dalamKantorCities = ['surabaya', 'sidoarjo'];
        const locationBudgetMap = new Map<string, Map<string, { count: number; nominal: number }>>();
        
        const normalize = (s: string) => (s || '').toLowerCase().trim();
        const fallbackRates: Record<string, number> = {
          'sidoarjo': 0,  // Dalam kantor
          'surabaya': 0,  // Dalam kantor
          'gresik': 300000,
          'pasuruan': 300000,
          'bojonegoro': 300000,
          'madura': 300000,
          'malang': 300000,
          'lamongan': 300000,
          'madiun': 300000,
        };

        assignments.forEach(a => {
          const city = a.tempat_penugasan;
          const normalizedCity = normalize(city);
          const cityBudget = (cityBudgets as any)?.find((cb: any) => normalize(cb.city_name) === normalizedCity);
          
          // Determine if it's dalam kantor or luar kantor
          const isDalamKantor = dalamKantorCities.some(dk => normalizedCity.includes(dk));
          const locationType = isDalamKantor ? 'Dalam Kantor' : 'Luar Kantor';
          
          // Get nominal
          let nominal = Number(cityBudget?.nominal_per_trip || 0);
          if (!nominal) {
            if (normalizedCity.includes('sidoarjo') || normalizedCity.includes('surabaya')) {
              nominal = 0;
            } else if (['gresik','pasuruan','bojonegoro','madura','malang','lamongan','madiun'].some(k => normalizedCity.includes(k))) {
              nominal = 300000;
            }
          }
          
          if (!locationBudgetMap.has(locationType)) {
            locationBudgetMap.set(locationType, new Map());
          }
          
          const cityMap = locationBudgetMap.get(locationType)!;
          const existing = cityMap.get(city) || { count: 0, nominal: 0 };
          cityMap.set(city, {
            count: existing.count + (a.employee_ids?.length || 0),
            nominal
          });
        });

        const cityBudgetStats = Array.from(locationBudgetMap.entries())
          .flatMap(([locationType, cityMap]) => 
            Array.from(cityMap.entries()).map(([city, data]) => ({
              locationType,
              city,
              count: data.count,
            }))
          )
          .sort((a, b) => {
            // Sort by location type first (Dalam Kantor first), then by count
            if (a.locationType !== b.locationType) {
              return a.locationType === 'Dalam Kantor' ? -1 : 1;
            }
            return b.count - a.count;
          });

        // Calculate rating statistics
        const ratingMap = new Map<number, number>();
        let totalRatingSum = 0;
        let totalRatedCount = 0;
        
        assignments.forEach(a => {
          const rating = (a as any).rating_penilaian;
          if (rating && rating >= 1 && rating <= 4) {
            ratingMap.set(rating, (ratingMap.get(rating) || 0) + 1);
            totalRatingSum += rating;
            totalRatedCount++;
          }
        });
        
        const ratingLabels = ['', 'Kurang', 'Cukup', 'Baik', 'Sangat Baik'];
        const ratingStats = [1, 2, 3, 4].map(rating => ({
          rating,
          count: ratingMap.get(rating) || 0,
          label: ratingLabels[rating]
        }));
        
        const averageRating = totalRatedCount > 0 ? totalRatingSum / totalRatedCount : 0;

        // Calculate download statistics
        const notaDinasDownloaded = assignments.filter(a => a.nota_dinas_downloaded).length;
        const notaDinasNotDownloaded = totalAssignments - notaDinasDownloaded;
        const suratTugasDownloaded = assignments.filter(a => a.surat_tugas_downloaded).length;
        const suratTugasNotDownloaded = totalAssignments - suratTugasDownloaded;

        // Calculate Tim UPK statistics
        const timUpkMap = new Map<string, number>();
        assignments.forEach(a => {
          const upkId = (a as any).assigned_upk_id;
          if (upkId) {
            const count = timUpkMap.get(upkId) || 0;
            timUpkMap.set(upkId, count + 1);
          }
        });

        const timUpkStats = Array.from(timUpkMap.entries())
          .map(([upkId, count]) => {
            const upkMember = (timUpkData as any)?.find((u: any) => u.id === upkId);
            return {
              name: upkMember?.name || 'Unknown',
              email: upkMember?.email || '',
              count
            };
          })
          .sort((a, b) => b.count - a.count);

        // Categorize assignments by time
        const today = new Date();
        const futureAssignmentsList: any[] = [];
        const presentAssignmentsList: any[] = [];
        const pastAssignmentsList: any[] = [];

        assignments.forEach(a => {
          if (!a.tanggal_mulai_kegiatan) return;
          
          const startDate = parseISO(a.tanggal_mulai_kegiatan);
          const endDate = a.tanggal_selesai_kegiatan ? parseISO(a.tanggal_selesai_kegiatan) : startDate;
          
          const employeeNames = (a.employee_ids || [])
            .map((empId: string) => employeeData?.find(e => e.id === empId)?.nm_pegawai)
            .filter(Boolean);

          // Use tujuan if available, otherwise fallback to perihal
          const displayName = (a as any).tujuan 
            ? (a as any).tujuan 
            : a.perihal;

          const assignmentData = {
            name: displayName,
            location: a.tempat_penugasan,
            startDate: format(startDate, "dd MMM yyyy", { locale: id }),
            endDate: format(endDate, "dd MMM yyyy", { locale: id }),
            employees: employeeNames,
            count: employeeNames.length
          };

          if (isBefore(endDate, today) && !isToday(endDate)) {
            pastAssignmentsList.push(assignmentData);
          } else if (isAfter(startDate, today) && !isToday(startDate)) {
            futureAssignmentsList.push(assignmentData);
          } else {
            presentAssignmentsList.push(assignmentData);
          }
        });

        // Fetch and add ST Luar Kantor data
        const { data: stLuarKantorData, error: stLKError } = await supabase
          .from("st_luar_kantor")
          .select("*");

        if (!stLKError && stLuarKantorData) {
          stLuarKantorData.forEach(stlk => {
            const startDate = parseISO(stlk.tanggal_mulai);
            const endDate = parseISO(stlk.tanggal_selesai);
            
            const employeeNames = (stlk.employee_ids || [])
              .map((empId: string) => employeeData?.find(e => e.id === empId)?.nm_pegawai)
              .filter(Boolean);

            const stlkData = {
              name: stlk.hal || `ST LK: ${stlk.lokasi_penugasan}`,
              location: stlk.lokasi_penugasan,
              startDate: format(startDate, "dd MMM yyyy", { locale: id }),
              endDate: format(endDate, "dd MMM yyyy", { locale: id }),
              employees: employeeNames,
              count: employeeNames.length
            };

            if (isBefore(endDate, today) && !isToday(endDate)) {
              pastAssignmentsList.push(stlkData);
            } else if (isAfter(startDate, today) && !isToday(startDate)) {
              futureAssignmentsList.push(stlkData);
            } else {
              presentAssignmentsList.push(stlkData);
            }
          });
        }

        // Timeline stats for chart
        const timelineStats = [
          { period: "Selesai", count: pastAssignmentsList.length },
          { period: "Berlangsung", count: presentAssignmentsList.length },
          { period: "Mendatang", count: futureAssignmentsList.length }
        ];

        // Sumber statistics with detailed breakdown
        const sumberDetailMap = new Map<string, number>();
        assignments.forEach(a => {
          const sumber = (a as any).sumber || 'Non DIPA';
          let detail = '';
          
          if (sumber === 'DIPA') {
            // Get satuan kerja from sumber_satuan_kerja or custom
            const satuanKerja = (a as any).sumber_satuan_kerja_custom || (a as any).sumber_satuan_kerja;
            if (satuanKerja && satuanKerja !== 'Lain-lain') {
              detail = `${sumber} (${satuanKerja})`;
            } else {
              detail = sumber;
            }
          } else if (sumber === 'Non DIPA') {
            // For Non DIPA, also check for custom details
            const satuanKerja = (a as any).sumber_satuan_kerja_custom || (a as any).sumber_satuan_kerja;
            if (satuanKerja) {
              detail = `${sumber} (${satuanKerja})`;
            } else {
              detail = sumber;
            }
          } else {
            detail = sumber;
          }
          
          const count = sumberDetailMap.get(detail) || 0;
          sumberDetailMap.set(detail, count + 1);
        });
        
        const sumberStats = Array.from(sumberDetailMap.entries())
          .map(([sumber, count]) => ({ sumber, count }))
          .sort((a, b) => {
            // Sort DIPA first, then by count
            if (a.sumber.includes('DIPA') && !b.sumber.includes('DIPA')) return -1;
            if (!a.sumber.includes('DIPA') && b.sumber.includes('DIPA')) return 1;
            return b.count - a.count;
          });

        // Fetch audit penugasan data for audit team stats
        let auditTeamStats: { nama: string; jabatan: string; role: string; count: number }[] = [];
        try {
          const { data: auditData } = await supabase
            .from("audit_penugasan")
            .select("*");
          
          if (auditData && auditData.length > 0) {
            // Filter audit data by date range if set
            let filteredAudit = auditData;
            if (dateRange.from || dateRange.to) {
              filteredAudit = auditData.filter((a: any) => {
                try {
                  const awalPeklap = a.tanggal_awal_peklap ? new Date(a.tanggal_awal_peklap) : null;
                  if (!awalPeklap || isNaN(awalPeklap.getTime())) return true;
                  if (dateRange.from && dateRange.to) {
                    return isWithinInterval(awalPeklap, { start: dateRange.from, end: dateRange.to });
                  }
                  if (dateRange.from) return awalPeklap >= dateRange.from;
                  if (dateRange.to) return awalPeklap <= dateRange.to;
                  return true;
                } catch { return true; }
              });
            }

            const teamMap = new Map<string, { jabatan: string; role: string; count: number }>();
            const roles = [
              { nameKey: 'nama_pma', jabatanKey: 'jabatan_pma', role: 'PMA' },
              { nameKey: 'nama_pta', jabatanKey: 'jabatan_pta', role: 'PTA' },
              { nameKey: 'nama_katim', jabatanKey: 'jabatan_katim', role: 'Katim' },
              { nameKey: 'nama_a1', jabatanKey: 'jabatan_a1', role: 'A1' },
              { nameKey: 'nama_a2', jabatanKey: 'jabatan_a2', role: 'A2' },
              { nameKey: 'nama_a3', jabatanKey: 'jabatan_a3', role: 'A3' },
            ];

            filteredAudit.forEach((row: any) => {
              roles.forEach(({ nameKey, jabatanKey, role }) => {
                const nama = row[nameKey];
                if (!nama) return;
                const key = `${nama}|${role}`;
                const existing = teamMap.get(key);
                if (existing) {
                  existing.count++;
                } else {
                  teamMap.set(key, { jabatan: row[jabatanKey] || '-', role, count: 1 });
                }
              });
            });

            auditTeamStats = Array.from(teamMap.entries())
              .map(([key, val]) => ({ nama: key.split('|')[0], ...val }))
              .sort((a, b) => {
                const roleOrder = ['PMA', 'PTA', 'Katim', 'A1', 'A2', 'A3'];
                return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
              });
          }
        } catch (auditErr) {
          console.error("Error fetching audit data for dashboard:", auditErr);
        }

        setStats({
          totalEmployees: employeeCount || 0,
          totalAssignments,
          uniqueLocations,
          todayAssignments,
          unitPenerbitStats,
          unitPemohonStats,
          recentActivities,
          locationStats,
          topEmployees,
          cityBudgetStats,
          notaDinasDownloaded,
          notaDinasNotDownloaded,
          suratTugasDownloaded,
          suratTugasNotDownloaded,
          timUpkStats,
          futureAssignments: futureAssignmentsList,
          presentAssignments: presentAssignmentsList,
          pastAssignments: pastAssignmentsList,
          timelineStats,
          sumberStats,
          ratingStats,
          averageRating,
          totalRated: totalRatedCount,
          auditTeamStats,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    const loadingContent = (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Memuat dashboard...</p>
        </CardContent>
      </Card>
    );
    
    if (embedded) return loadingContent;
    return <AppLayout breadcrumbs={[{ label: "Dashboard" }]}>{loadingContent}</AppLayout>;
  }

  const dashboardContent = (
      <div className="space-y-6">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Statistik dan ringkasan data penugasan
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd MMM yyyy", { locale: id })} -{" "}
                      {format(dateRange.to, "dd MMM yyyy", { locale: id })}
                    </>
                  ) : (
                    format(dateRange.from, "dd MMM yyyy", { locale: id })
                  )
                ) : (
                  <span>Pilih rentang tanggal</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  Reset Filter
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Select value={perihalFilter} onValueChange={setPerihalFilter}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter Jenis Kegiatan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kegiatan</SelectItem>
              {availablePerihal.map((perihal) => (
                <SelectItem key={perihal} value={perihal}>
                  {perihal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Combined Timeline Status and Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Status Penugasan Berdasarkan Waktu</CardTitle>
          <CardDescription>Distribusi penugasan berdasarkan periode waktu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Summary Grid - Clickable */}
          <div className="grid gap-4 md:grid-cols-3">
            <button 
              onClick={() => setSelectedTimelineStatus('future')}
              className={`flex items-center gap-3 p-4 rounded-lg border bg-card text-left transition-all hover:shadow-md ${
                selectedTimelineStatus === 'future' ? 'ring-2 ring-blue-500 shadow-md' : ''
              }`}
            >
              <TrendingUp className="h-8 w-8 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Penugasan Mendatang</p>
                <p className="text-2xl font-bold text-blue-600">{stats.futureAssignments.length}</p>
                <p className="text-xs text-muted-foreground">Penugasan yang akan datang</p>
              </div>
            </button>

            <button 
              onClick={() => setSelectedTimelineStatus('present')}
              className={`flex items-center gap-3 p-4 rounded-lg border bg-card text-left transition-all hover:shadow-md ${
                selectedTimelineStatus === 'present' ? 'ring-2 ring-orange-500 shadow-md' : ''
              }`}
            >
              <Clock className="h-8 w-8 text-orange-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Penugasan Berlangsung</p>
                <p className="text-2xl font-bold text-orange-600">{stats.presentAssignments.length}</p>
                <p className="text-xs text-muted-foreground">Penugasan sedang berlangsung</p>
              </div>
            </button>

            <button 
              onClick={() => setSelectedTimelineStatus('past')}
              className={`flex items-center gap-3 p-4 rounded-lg border bg-card text-left transition-all hover:shadow-md ${
                selectedTimelineStatus === 'past' ? 'ring-2 ring-green-500 shadow-md' : ''
              }`}
            >
              <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Penugasan Selesai</p>
                <p className="text-2xl font-bold text-green-600">{stats.pastAssignments.length}</p>
                <p className="text-xs text-muted-foreground">Penugasan yang telah selesai</p>
              </div>
            </button>
          </div>

          {/* Chart and Detail Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Chart */}
            <div>
              <ChartContainer
                config={{
                  count: {
                    label: "Jumlah Penugasan",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[280px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.timelineStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Employee Details List */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-4">
                {selectedTimelineStatus === 'future' && (
                  <>
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold text-blue-600">Detail Penugasan Mendatang</h3>
                  </>
                )}
                {selectedTimelineStatus === 'present' && (
                  <>
                    <Clock className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold text-orange-600">Detail Penugasan Berlangsung</h3>
                  </>
                )}
                {selectedTimelineStatus === 'past' && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold text-green-600">Detail Penugasan Selesai</h3>
                  </>
                )}
              </div>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {selectedTimelineStatus === 'future' && stats.futureAssignments.length === 0 && (
                  <p className="text-sm text-muted-foreground">Tidak ada penugasan mendatang</p>
                )}
                {selectedTimelineStatus === 'present' && stats.presentAssignments.length === 0 && (
                  <p className="text-sm text-muted-foreground">Tidak ada penugasan berlangsung</p>
                )}
                {selectedTimelineStatus === 'past' && stats.pastAssignments.length === 0 && (
                  <p className="text-sm text-muted-foreground">Tidak ada penugasan selesai</p>
                )}

                {selectedTimelineStatus === 'future' && stats.futureAssignments.map((assignment, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-3 py-2 bg-card rounded-r">
                    <p className="text-sm font-semibold">{assignment.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {assignment.location}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {assignment.startDate} - {assignment.endDate}
                    </p>
                    <p className="text-xs font-medium text-blue-600 mt-1">{assignment.count} pegawai:</p>
                    {assignment.employees.length > 0 && (
                      <ul className="text-xs text-muted-foreground mt-1 ml-2 space-y-0.5">
                        {assignment.employees.map((emp, empIdx) => (
                          <li key={empIdx}>• {emp}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                {selectedTimelineStatus === 'present' && stats.presentAssignments.map((assignment, idx) => (
                  <div key={idx} className="border-l-4 border-orange-500 pl-3 py-2 bg-card rounded-r">
                    <p className="text-sm font-semibold">{assignment.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {assignment.location}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {assignment.startDate} - {assignment.endDate}
                    </p>
                    <p className="text-xs font-medium text-orange-600 mt-1">{assignment.count} pegawai:</p>
                    {assignment.employees.length > 0 && (
                      <ul className="text-xs text-muted-foreground mt-1 ml-2 space-y-0.5">
                        {assignment.employees.map((emp, empIdx) => (
                          <li key={empIdx}>• {emp}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                {selectedTimelineStatus === 'past' && stats.pastAssignments.map((assignment, idx) => (
                  <div key={idx} className="border-l-4 border-green-500 pl-3 py-2 bg-card rounded-r">
                    <p className="text-sm font-semibold">{assignment.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {assignment.location}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {assignment.startDate} - {assignment.endDate}
                    </p>
                    <p className="text-xs font-medium text-green-600 mt-1">{assignment.count} pegawai:</p>
                    {assignment.employees.length > 0 && (
                      <ul className="text-xs text-muted-foreground mt-1 ml-2 space-y-0.5">
                        {assignment.employees.map((emp, empIdx) => (
                          <li key={empIdx}>• {emp}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Audit Team Statistics */}
      <AuditTeamStatsCard auditTeamStats={stats.auditTeamStats} dateRange={dateRange} />

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pegawai</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Pegawai terdaftar di sistem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Surat Tugas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Surat tugas yang telah dibuat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lokasi Penugasan</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueLocations}</div>
            <p className="text-xs text-muted-foreground">
              Lokasi berbeda telah dikunjungi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kegiatan Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "dd MMMM yyyy", { locale: id })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unit Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Top Unit Penerbit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.unitPenerbitStats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada data
                </p>
              ) : (
                stats.unitPenerbitStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{stat.unit}</p>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <div className="text-sm font-bold">{stat.count}</div>
                      <div className="text-xs text-muted-foreground">ST</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Top Unit Pemohon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.unitPemohonStats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada data
                </p>
              ) : (
                stats.unitPemohonStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{stat.unit}</p>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <div className="text-sm font-bold">{stat.count}</div>
                      <div className="text-xs text-muted-foreground">permohonan</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Location Map */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Aktivitas 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="text-sm">
                    {format(new Date(activity.date), "EEEE, dd MMMM yyyy", { locale: id })}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold">{activity.count}</div>
                    <div className="text-xs text-muted-foreground">kegiatan</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Lokasi Penugasan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.locationStats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada data
                </p>
              ) : (
                stats.locationStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{stat.location}</p>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <div className="text-sm font-bold">{stat.count}</div>
                      <div className="text-xs text-muted-foreground">kunjungan</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Employees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Pegawai Penugasan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topEmployees.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada data
              </p>
            ) : (
              stats.topEmployees.map((employee, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{employee.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold">{employee.count}</div>
                    <div className="text-xs text-muted-foreground">ST</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget Overview - Hidden as per user request */}

      {/* Download Status Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Status Download Nota Dinas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Sudah Diunduh</span>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.notaDinasDownloaded}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">Belum Diunduh</span>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.notaDinasNotDownloaded}
                </div>
              </div>
              {stats.totalAssignments > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress Download</span>
                    <span className="font-semibold">
                      {((stats.notaDinasDownloaded / stats.totalAssignments) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${(stats.notaDinasDownloaded / stats.totalAssignments) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Status Download Surat Tugas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Sudah Diunduh</span>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.suratTugasDownloaded}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">Belum Diunduh</span>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.suratTugasNotDownloaded}
                </div>
              </div>
              {stats.totalAssignments > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress Download</span>
                    <span className="font-semibold">
                      {((stats.suratTugasDownloaded / stats.totalAssignments) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${(stats.suratTugasDownloaded / stats.totalAssignments) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Statistics (Dalam/Luar Kantor) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Statistik Lokasi Penugasan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {stats.cityBudgetStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada data penugasan
              </p>
            ) : (
              <>
                {['Dalam Kantor', 'Luar Kantor'].map((locationType) => {
                  const locationData = stats.cityBudgetStats.filter((stat) => stat.locationType === locationType);
                  if (locationData.length === 0) return null;
                  const totalCount = locationData.reduce((sum, s) => sum + s.count, 0);
                  
                  return (
                    <div key={locationType} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-primary">{locationType}</h3>
                        <span className="text-sm font-bold text-primary">{totalCount} pegawai</span>
                      </div>
                      {locationData.map((stat, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 pl-4 rounded-lg bg-muted/30">
                          <p className="text-sm font-medium">{stat.city}</p>
                          <span className="text-sm font-bold">{stat.count} pegawai</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sumber Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Statistik Sumber Dana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.sumberStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada data sumber dana
              </p>
            ) : (
              stats.sumberStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      stat.sumber.includes('DIPA') && !stat.sumber.includes('Non DIPA') ? 'bg-blue-100 text-blue-700' :
                      stat.sumber.includes('Non DIPA') ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{stat.sumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {stat.sumber.includes('Non DIPA') ? 'Tidak mengurangi anggaran' : 'Sumber dana penugasan'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stat.count}</div>
                    <div className="text-xs text-muted-foreground">penugasan</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tim UPK Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Statistik Tim UPK
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.timUpkStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada Tim UPK yang ditugaskan
              </p>
            ) : (
              stats.timUpkStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{stat.name}</p>
                    <p className="text-xs text-muted-foreground italic">{stat.email}</p>
                  </div>
                  <div className="ml-4">
                    <div className="text-xl font-bold text-primary">
                      {stat.count}
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      penugasan
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      </div>
  );

  if (embedded) return dashboardContent;
  return <AppLayout breadcrumbs={[{ label: "Dashboard" }]}>{dashboardContent}</AppLayout>;
}
