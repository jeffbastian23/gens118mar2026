import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, CheckCircle, DollarSign, TrendingUp, PiggyBank, Percent, Loader2, ChevronDown, ChevronUp, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BudgetConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

interface BudgetStats {
  totalPagu: number;
  totalRealisasi: number;
  totalSisa: number;
  persentaseRealisasi: number;
}

interface PerjadinStats {
  totalPagu: number;
  totalRealisasi: number;
  totalSaldo: number;
  persentaseRealisasi: number;
}

interface UserSPDDetail {
  jenis_spd: string;
  pagu: number;
  efisiensi: number;
  pagu_tersedia: number;
  realisasi: number;
  persentase: number;
  saldo: number;
}

export default function BudgetConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
}: BudgetConfirmationDialogProps) {
  const { user } = useAuth();
  const [hasReadBudget, setHasReadBudget] = useState(false);
  const [budgetStats, setBudgetStats] = useState<BudgetStats | null>(null);
  const [perjadinStats, setPerjadinStats] = useState<PerjadinStats | null>(null);
  const [userSPDDetails, setUserSPDDetails] = useState<UserSPDDetail[]>([]);
  const [userEselonIII, setUserEselonIII] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchStats();
      fetchPdfUrl();
    }
  }, [open]);

  const fetchPdfUrl = async () => {
    try {
      const { data: files } = await supabase.storage
        .from("realisasi-pdf")
        .list("", { limit: 1, sortBy: { column: "created_at", order: "desc" } });
      
      if (files && files.length > 0) {
        const { data: urlData } = supabase.storage
          .from("realisasi-pdf")
          .getPublicUrl(files[0].name);
        if (urlData?.publicUrl) {
          setPdfUrl(urlData.publicUrl);
        }
      }
    } catch (error) {
      console.error("Error fetching PDF:", error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch user's eselon_iii from profiles
      if (user?.id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("eselon_iii")
          .eq("user_id", user.id)
          .single();
        
        if (profileData?.eselon_iii) {
          setUserEselonIII(profileData.eselon_iii);
        }
      }

      // Fetch realisasi anggaran stats
      const { data: realisasiData } = await supabase
        .from("realisasi_anggaran")
        .select("pagu_revisi, realisasi_sd_periode, sisa_anggaran, persentase, uraian, level_hierarki")
        .order("no_urut", { ascending: true });

      if (realisasiData && realisasiData.length > 0) {
        const topLevelRow = realisasiData.find(
          (item: any) => item.uraian?.includes("JUMLAH SELURUHNYA") || item.level_hierarki === 0
        );
        
        if (topLevelRow) {
          const persentase = (topLevelRow.persentase || 0) > 1 
            ? (topLevelRow.persentase || 0)
            : (topLevelRow.persentase || 0) * 100;
          
          setBudgetStats({
            totalPagu: topLevelRow.pagu_revisi || 0,
            totalRealisasi: topLevelRow.realisasi_sd_periode || 0,
            totalSisa: topLevelRow.sisa_anggaran || 0,
            persentaseRealisasi: persentase,
          });
        } else {
          const totalPagu = realisasiData.reduce((sum: number, i: any) => sum + (i.pagu_revisi || 0), 0);
          const totalRealisasi = realisasiData.reduce((sum: number, i: any) => sum + (i.realisasi_sd_periode || 0), 0);
          const totalSisa = realisasiData.reduce((sum: number, i: any) => sum + (i.sisa_anggaran || 0), 0);
          
          setBudgetStats({
            totalPagu,
            totalRealisasi,
            totalSisa,
            persentaseRealisasi: totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0,
          });
        }
      }

      // Fetch rekap realisasi perjadin stats
      const { data: perjadinData } = await supabase
        .from("rekap_realisasi_perjadin")
        .select("jenis_spd, satker, pagu, efisiensi, pagu_tersedia, realisasi, persentase, saldo");

      if (perjadinData && perjadinData.length > 0) {
        const totalPagu = perjadinData.reduce((sum: number, item: any) => sum + (item.pagu || 0), 0);
        const totalEfisiensi = perjadinData.reduce((sum: number, item: any) => sum + (item.efisiensi || 0), 0);
        const totalRealisasi = perjadinData.reduce((sum: number, item: any) => sum + (item.realisasi || 0), 0);
        const paguTersedia = totalPagu - totalEfisiensi;
        const totalSaldo = paguTersedia - totalRealisasi;
        const persentase = paguTersedia > 0 ? (totalRealisasi / paguTersedia) * 100 : 0;

        setPerjadinStats({
          totalPagu: paguTersedia,
          totalRealisasi,
          totalSaldo,
          persentaseRealisasi: persentase,
        });

        // Filter SPD details based on user's eselon_iii
        if (user?.id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("eselon_iii")
            .eq("user_id", user.id)
            .single();
          
          if (profileData?.eselon_iii) {
            const userEselon = profileData.eselon_iii;
            const filteredSPD = perjadinData
              .filter((item: any) => 
                item.satker && 
                Array.isArray(item.satker) && 
                item.satker.includes(userEselon)
              )
              .map((item: any) => ({
                jenis_spd: item.jenis_spd,
                pagu: item.pagu || 0,
                efisiensi: item.efisiensi || 0,
                pagu_tersedia: item.pagu_tersedia || (item.pagu - (item.efisiensi || 0)),
                realisasi: item.realisasi || 0,
                persentase: item.persentase || 0,
                saldo: item.saldo || ((item.pagu - (item.efisiensi || 0)) - (item.realisasi || 0)),
              }));
            
            setUserSPDDetails(filteredSPD);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching budget stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleConfirm = () => {
    if (hasReadBudget) {
      onConfirm();
      onOpenChange(false);
      setHasReadBudget(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setHasReadBudget(false);
    }
    onOpenChange(newOpen);
  };

  const canProceed = hasReadBudget;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Konfirmasi Sebelum Membuat Penugasan
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Pastikan Anda telah membaca data anggaran terkini untuk memastikan ketersediaan dana.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Memuat data anggaran...</span>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Realisasi Anggaran Stats */}
            {budgetStats && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground">Realisasi Anggaran Kanwil DJBC Jatim I</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Card className="p-3 border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Total Pagu</p>
                        <p className="text-sm font-bold text-blue-600">{formatCurrency(budgetStats.totalPagu)}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3 border-l-4 border-l-green-500">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Realisasi ({budgetStats.persentaseRealisasi.toFixed(1)}%)</p>
                        <p className="text-sm font-bold text-green-600">{formatCurrency(budgetStats.totalRealisasi)}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3 border-l-4 border-l-orange-500 col-span-2">
                    <div className="flex items-center gap-2">
                      <PiggyBank className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Sisa Anggaran</p>
                        <p className="text-sm font-bold text-orange-600">{formatCurrency(budgetStats.totalSisa)}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Rekap Realisasi Perjadin Stats */}
            {perjadinStats && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground">Rekapitulasi Realisasi Perjadin Kanwil DJBC Jatim I</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Card className="p-3 border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Pagu Tersedia</p>
                        <p className="text-sm font-bold text-blue-600">{formatCurrency(perjadinStats.totalPagu)}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3 border-l-4 border-l-green-500">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Realisasi ({perjadinStats.persentaseRealisasi.toFixed(1)}%)</p>
                        <p className="text-sm font-bold text-green-600">{formatCurrency(perjadinStats.totalRealisasi)}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3 border-l-4 border-l-purple-500 col-span-2">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-purple-600" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Saldo Tersedia</p>
                        <p className={`text-sm font-bold ${perjadinStats.totalSaldo < 0 ? 'text-destructive' : 'text-purple-600'}`}>
                          {formatCurrency(perjadinStats.totalSaldo)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* User SPD Details Dropdown */}
                {userSPDDetails.length > 0 && userEselonIII && (
                  <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen} className="mt-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full flex items-center justify-between">
                        <span className="text-xs font-medium truncate">
                          Detail Kamar: {userEselonIII}
                        </span>
                        {detailsOpen ? <ChevronUp className="h-4 w-4 ml-2 shrink-0" /> : <ChevronDown className="h-4 w-4 ml-2 shrink-0" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {userSPDDetails.map((spd, index) => (
                        <Card key={index} className="p-3 bg-muted/30 border">
                          <h5 className="text-xs font-semibold text-foreground mb-2 border-b pb-1">
                            {spd.jenis_spd}
                          </h5>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Pagu</p>
                              <p className="font-medium text-foreground">{formatCurrency(spd.pagu)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Efisiensi</p>
                              <p className="font-medium text-foreground">{formatCurrency(spd.efisiensi)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Pagu Tersedia</p>
                              <p className="font-medium text-blue-600">{formatCurrency(spd.pagu_tersedia)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Realisasi</p>
                              <p className="font-medium text-green-600">{formatCurrency(spd.realisasi)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Persentase</p>
                              <p className={`font-medium ${spd.persentase > 100 ? 'text-destructive' : 'text-foreground'}`}>
                                {spd.persentase.toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Saldo</p>
                              <p className={`font-medium ${spd.saldo < 0 ? 'text-destructive' : 'text-purple-600'}`}>
                                {formatCurrency(spd.saldo)}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            )}

            {/* PDF Realisasi Anggaran */}
            {pdfUrl && (
              <div className="space-y-2 mt-4">
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <FileDown className="h-4 w-4 text-primary" />
                  Dokumen PDF Realisasi Anggaran
                </h4>
                <Card className="p-0 overflow-hidden border">
                  <iframe
                    src={pdfUrl}
                    className="w-full h-[300px]"
                    title="PDF Realisasi Anggaran"
                  />
                </Card>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open(pdfUrl, "_blank")}
                >
                  <FileDown className="h-4 w-4" />
                  Buka PDF di Tab Baru
                </Button>
              </div>
            )}

            {/* Combined Checkbox */}
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors mt-4">
              <Checkbox
                id="budget"
                checked={hasReadBudget}
                onCheckedChange={(checked) => setHasReadBudget(checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="budget"
                className="text-sm cursor-pointer flex-1"
              >
                <span className="font-medium">Sudah membaca Realisasi Anggaran & Rekap Realisasi Perjadin</span>
                <p className="text-muted-foreground text-xs mt-1">
                  Pastikan telah memeriksa ketersediaan dana sebelum membuat penugasan baru
                </p>
              </label>
            </div>

            {canProceed && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4" />
                <span>Anda dapat melanjutkan untuk membuat penugasan baru</span>
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <Button onClick={handleConfirm} disabled={!canProceed || loading}>
            Lanjutkan
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
