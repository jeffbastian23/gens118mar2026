import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, UserPlus, Download, Pencil, Trash2, FileText } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PlhKepalaDetailDialog from "./PlhKepalaDetailDialog";

interface PlhKepala {
  id: string;
  unit_pemohon: string;
  unit_penerbit: string;
  nomor_naskah_dinas: string;
  tanggal: string;
  perihal: string;
  employee_id: string;
  employee_ids?: string[];
  tanggal_plh_mulai?: string;
  tanggal_plh_selesai?: string;
  pejabat_unit_pemohon_id?: string;
  pejabat_unit_penerbit_id?: string;
  document_path?: string;
  agenda_number?: number;
  selesai_at?: string;
  selesai_by?: string;
  jenis_plh_plt?: 'PLH' | 'PLT';
  dasar_penugasan?: string;
  assigned_upk_id?: string;
  konsep_masuk_at?: string;
  konsep_masuk_by?: string;
  proses_nd_at?: string;
  proses_nd_by?: string;
  proses_st_at?: string;
  proses_st_by?: string;
  no_satu_kemenkeu?: string;
  tanggal_satu_kemenkeu?: string;
}

interface Employee {
  id: string;
  nm_pegawai: string;
}

interface TimUpk {
  id: string;
  name: string;
  email: string;
}

interface PlhKepalaTableProps {
  plhKepalaList: PlhKepala[];
  employees: Employee[];
  timUpkList: TimUpk[];
  isAdmin: boolean;
  canEdit?: boolean;
  onEdit: (plhKepala: PlhKepala) => void;
  onDelete: (plhKepalaId: string) => void;
  onAssignUpk: (plhKepalaId: string) => void;
  onFeedback: (plhKepalaId: string) => void;
  onGenerateND: (plhKepala: PlhKepala) => void;
  onGeneratePRIN: (plhKepala: PlhKepala) => void;
}

export default function PlhKepalaTable({
  plhKepalaList,
  employees,
  timUpkList,
  isAdmin,
  canEdit = true,
  onEdit,
  onDelete,
  onAssignUpk,
  onFeedback,
  onGenerateND,
  onGeneratePRIN,
}: PlhKepalaTableProps) {
  const [selectedPlhKepala, setSelectedPlhKepala] = useState<PlhKepala | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const handleRowClick = (plhKepala: PlhKepala) => {
    setSelectedPlhKepala(plhKepala);
    setDetailDialogOpen(true);
  };

  const getEmployeeName = (plhKepala: PlhKepala) => {
    const employeeId = plhKepala.employee_id || plhKepala.employee_ids?.[0];
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.nm_pegawai || 'Unknown';
  };

  const getAssignedUpk = (plhKepala: PlhKepala) => {
    if (!plhKepala.assigned_upk_id) return null;
    return timUpkList.find(upk => upk.id === plhKepala.assigned_upk_id) || null;
  };

  const formatPlhDates = (plhKepala: PlhKepala) => {
    if (!plhKepala.tanggal_plh_mulai && !plhKepala.tanggal_plh_selesai) {
      return "-";
    }

    const startDate = plhKepala.tanggal_plh_mulai ? new Date(plhKepala.tanggal_plh_mulai) : null;
    const endDate = plhKepala.tanggal_plh_selesai ? new Date(plhKepala.tanggal_plh_selesai) : null;

    if (!startDate && !endDate) return "-";
    if (!endDate || (startDate && isSameDay(startDate, endDate))) {
      return format(startDate!, "dd MMM yyyy", { locale: id });
    }

    return `${format(startDate!, "dd MMM", { locale: id })} - ${format(endDate, "dd MMM yyyy", { locale: id })}`;
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-20">No. Agenda</TableHead>
              <TableHead className="min-w-[180px]">Perihal</TableHead>
              <TableHead className="w-32">Tanggal</TableHead>
              <TableHead className="w-32">Unit Pemohon</TableHead>
              <TableHead className="w-32">Unit Penerbit</TableHead>
              <TableHead className="w-28">Pejabat PLH</TableHead>
              <TableHead className="w-28">Tim UPK</TableHead>
              <TableHead className="w-32">No. Satu Kemenkeu</TableHead>
              <TableHead className="w-48 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plhKepalaList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Tidak ada data PLH/PLT
                </TableCell>
              </TableRow>
            ) : (
              plhKepalaList.map((plhKepala) => {
                const assignedUpk = getAssignedUpk(plhKepala);
                const isCompleted = !!plhKepala.no_satu_kemenkeu;
                const employeeName = getEmployeeName(plhKepala);
                
                return (
                  <TableRow 
                    key={plhKepala.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors border-r-4",
                      isCompleted ? "border-r-green-500" : "border-r-red-500"
                    )}
                    onClick={() => handleRowClick(plhKepala)}
                  >
                    <TableCell>
                      <Badge variant="secondary" className="font-semibold">
                        {plhKepala.agenda_number || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{plhKepala.perihal}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatPlhDates(plhKepala)}
                    </TableCell>
                    <TableCell className="text-xs">{plhKepala.unit_pemohon}</TableCell>
                    <TableCell className="text-xs">{plhKepala.unit_penerbit}</TableCell>
                    <TableCell className="text-xs text-muted-foreground italic">
                      {employeeName}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground italic">
                      {assignedUpk ? assignedUpk.name : "-"}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {plhKepala.no_satu_kemenkeu ? (
                        <span className="text-green-600">{plhKepala.no_satu_kemenkeu}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-0.5 justify-end">
                        {/* Column 1: Generate, then Assign */}
                        {canEdit && (
                          <div className="flex flex-col gap-0.5">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Generate">
                                  <FileText className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem 
                                  onClick={() => onGenerateND(plhKepala)}
                                  className="flex items-center gap-2"
                                >
                                  <span className={cn(
                                    "w-2.5 h-2.5 rounded-full shadow-sm",
                                    plhKepala.proses_nd_at ? "bg-green-500 ring-2 ring-green-200" : "bg-red-500 ring-2 ring-red-200"
                                  )} />
                                  <span className={plhKepala.proses_nd_at ? "font-medium" : ""}>
                                    ND {plhKepala.jenis_plh_plt || 'PLH'}
                                  </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => onGeneratePRIN(plhKepala)}
                                  className="flex items-center gap-2"
                                >
                                  <span className={cn(
                                    "w-2.5 h-2.5 rounded-full shadow-sm",
                                    plhKepala.proses_st_at ? "bg-green-500 ring-2 ring-green-200" : "bg-red-500 ring-2 ring-red-200"
                                  )} />
                                  <span className={plhKepala.proses_st_at ? "font-medium" : ""}>
                                    PRIN {plhKepala.jenis_plh_plt || 'PLH'}
                                  </span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssignUpk(plhKepala.id);
                              }}
                              title="Assign ke Tim UPK"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                        
                        {/* Column 2: Edit, then Feedback */}
                        <div className="flex flex-col gap-0.5">
                          {canEdit && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(plhKepala);
                              }}
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFeedback(plhKepala.id);
                            }}
                            title="Feedback Satu Kemenkeu"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Column 3: Delete */}
                        {canEdit && (
                          <div className="flex flex-col gap-0.5">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(plhKepala.id);
                              }}
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <PlhKepalaDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        plhKepala={selectedPlhKepala}
        employeeName={selectedPlhKepala ? getEmployeeName(selectedPlhKepala) : undefined}
        assignedUpk={selectedPlhKepala ? getAssignedUpk(selectedPlhKepala) : null}
        onGenerateND={() => {
          if (selectedPlhKepala) onGenerateND(selectedPlhKepala);
          setDetailDialogOpen(false);
        }}
        onGeneratePRIN={() => {
          if (selectedPlhKepala) onGeneratePRIN(selectedPlhKepala);
          setDetailDialogOpen(false);
        }}
        isAdmin={isAdmin}
      />
    </>
  );
}
