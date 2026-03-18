import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Briefcase, Building2 } from "lucide-react";

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string;
  uraian_pangkat: string;
  uraian_jabatan: string;
  nm_unit_organisasi: string;
}

interface EmployeeCardProps {
  employee: Employee;
}

export default function EmployeeCard({ employee }: EmployeeCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <User className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate mb-1">{employee.nm_pegawai}</h3>
            <p className="text-xs text-muted-foreground font-mono mb-1">NIP: {employee.nip}</p>
            <Badge variant="secondary" className="mb-2 text-xs">
              {employee.uraian_pangkat}
            </Badge>
            <div className="space-y-1">
              <div className="flex items-start gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-2">{employee.uraian_jabatan}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-2">{employee.nm_unit_organisasi}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
