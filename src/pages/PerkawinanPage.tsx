import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubMenuAccess } from "@/hooks/useSubMenuAccess";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import KarisKarsuTable from "@/components/KarisKarsuTable";
import PerkawinanDashboard from "@/components/PerkawinanDashboard";

export default function PerkawinanPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { hasSubMenuAccess } = useSubMenuAccess("perkawinan");

  const getInitialTab = () => {
    if (hasSubMenuAccess("perkawinan:dashboard")) return "dashboard";
    if (hasSubMenuAccess("perkawinan:karis-karsu")) return "karis-karsu";
    return "dashboard";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Administrasi SDM" }, { label: "Perkawinan" }]}>
        <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">Memuat data...</p></CardContent></Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Administrasi SDM" }, { label: "Perkawinan" }]}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          {hasSubMenuAccess("perkawinan:dashboard") && (
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          )}
          {hasSubMenuAccess("perkawinan:karis-karsu") && (
            <TabsTrigger value="karis-karsu">Karis/Karsu</TabsTrigger>
          )}
        </TabsList>
        {hasSubMenuAccess("perkawinan:dashboard") && (
          <TabsContent value="dashboard">
            <div className="mb-4 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <p className="text-sm italic text-muted-foreground leading-relaxed">
                Berdasarkan peraturan kepegawaian yang berlaku di Indonesia (PP No. 10 Tahun 1983 jo. PP No. 45 Tahun 1990 dan PP No. 94 Tahun 2021 tentang Disiplin PNS), Pegawai Negeri Sipil (PNS) yang tidak melaporkan perkawinan pertamanya dalam jangka waktu selambat-lambatnya satu tahun setelah perkawinan dilangsungkan, akan dijatuhi hukuman disiplin.
              </p>
            </div>
            <PerkawinanDashboard />
          </TabsContent>
        )}
        <TabsContent value="karis-karsu">
          <KarisKarsuTable />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
