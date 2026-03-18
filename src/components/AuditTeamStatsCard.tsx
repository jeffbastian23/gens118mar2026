import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface AuditTeamMember {
  nama: string;
  jabatan: string;
  role: string;
  count: number;
}

interface AuditTeamStatsCardProps {
  auditTeamStats: AuditTeamMember[];
  dateRange: { from: Date | undefined; to: Date | undefined };
}

export default function AuditTeamStatsCard({ auditTeamStats, dateRange }: AuditTeamStatsCardProps) {
  const [auditDateFrom, setAuditDateFrom] = useState<Date | undefined>(undefined);
  const [auditDateTo, setAuditDateTo] = useState<Date | undefined>(undefined);
  const [auditRoleFilter, setAuditRoleFilter] = useState<string>("all");

  const allRoles = Array.from(new Set(auditTeamStats.map(m => m.role)));

  const filteredAuditStats = auditTeamStats.filter(member => {
    if (auditRoleFilter !== "all" && member.role !== auditRoleFilter) return false;
    return true;
  });

  if (auditTeamStats.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Statistik Tim Audit Penugasan
        </CardTitle>
        <CardDescription>
          Data personil audit berdasarkan peran dari sub menu Audit
          {dateRange.from || dateRange.to ? (
            <span className="ml-2 text-primary font-medium">
              ({dateRange.from ? format(dateRange.from, "dd MMM yyyy", { locale: id }) : "..."} - {dateRange.to ? format(dateRange.to, "dd MMM yyyy", { locale: id }) : "..."})
            </span>
          ) : (
            <span className="ml-2 text-muted-foreground">(Semua periode)</span>
          )}
        </CardDescription>
        <div className="flex flex-wrap items-end gap-3 mt-3">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Waktu Mulai</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[150px] justify-start text-left font-normal">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  {auditDateFrom ? format(auditDateFrom, "dd/MM/yyyy") : "Pilih..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={auditDateFrom} onSelect={setAuditDateFrom} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Waktu Selesai</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[150px] justify-start text-left font-normal">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  {auditDateTo ? format(auditDateTo, "dd/MM/yyyy") : "Pilih..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={auditDateTo} onSelect={setAuditDateTo} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Peran</span>
            <Select value={auditRoleFilter} onValueChange={setAuditRoleFilter}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="Semua Peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Peran</SelectItem>
                {allRoles.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(auditDateFrom || auditDateTo || auditRoleFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={() => { setAuditDateFrom(undefined); setAuditDateTo(undefined); setAuditRoleFilter("all"); }}>
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">No</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Nama</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Peran</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Jabatan</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Jumlah Penugasan</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditStats.map((member, idx) => (
                <tr key={`${member.nama}-${member.role}-${idx}`} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                  <td className="py-2 px-3 font-medium">{member.nama}</td>
                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      member.role === 'PMA' ? 'bg-purple-100 text-purple-700' :
                      member.role === 'PTA' ? 'bg-blue-100 text-blue-700' :
                      member.role === 'Katim' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">{member.jabatan}</td>
                  <td className="py-2 px-3 text-right font-semibold">{member.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
