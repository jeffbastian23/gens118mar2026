import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Award, BarChart3, ExternalLink, Database } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SyaratKenaikanPangkatTab from "@/components/SyaratKenaikanPangkatTab";
import OlahDataKenaikanPangkatTab from "@/components/OlahDataKenaikanPangkatTab";

export default function KenaikanPangkatPage() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const canEdit = role !== "overview";
  const [activeTab, setActiveTab] = useState("dashboard");

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Administrasi SDM" }, { label: "Kenaikan Pangkat" }]}>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Memuat data...</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Administrasi SDM" }, { label: "Kenaikan Pangkat" }]}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="syarat-kenaikan-pangkat" className="gap-2">
            <Award className="h-4 w-4" />
            Syarat Kenaikan Pangkat
          </TabsTrigger>
          <TabsTrigger value="olah-data" className="gap-2">
            <Database className="h-4 w-4" />
            Olah Data
          </TabsTrigger>
        </TabsList>

        {/* Tab: Dashboard */}
        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Dashboard Kenaikan Pangkat
                </CardTitle>
                <Button
                  variant="outline"
                  className="gap-2 border-primary text-primary hover:bg-primary/10"
                  onClick={() => window.open("https://s.id/jfpbc", "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Jabatan Fungsional
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Periode April</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">-</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Periode Oktober</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">-</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Tahun Ini</p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">-</p>
                    </div>
                  </div>
                </Card>
              </div>
              <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-muted-foreground">
                  Dashboard statistik kenaikan pangkat akan ditampilkan di sini.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Syarat Kenaikan Pangkat */}
        <TabsContent value="syarat-kenaikan-pangkat">
          <SyaratKenaikanPangkatTab isAdmin={isAdmin} canEdit={canEdit} />
        </TabsContent>

        {/* Tab: Olah Data */}
        <TabsContent value="olah-data">
          <OlahDataKenaikanPangkatTab isAdmin={isAdmin} canEdit={canEdit} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
