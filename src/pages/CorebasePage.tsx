import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Users, FileCheck, MapPin, Building2, UserCheck, Briefcase, BarChart3 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CorebaseDashboardTab from "@/components/corebase/CorebaseDashboardTab";
import CorebaseDbPokokTab from "@/components/corebase/CorebaseDbPokokTab";
import CorebaseDbStatusTab from "@/components/corebase/CorebaseDbStatusTab";
import CorebaseDbPensiunTab from "@/components/corebase/CorebaseDbPensiunTab";
import CorebaseDbRekamJejakTab from "@/components/corebase/CorebaseDbRekamJejakTab";
import CorebaseDbGoljabTab from "@/components/corebase/CorebaseDbGoljabTab";
import CorebaseEselonisasiTab from "@/components/corebase/CorebaseEselonisasiTab";
import CorebasePegawaiAtasanTab from "@/components/corebase/CorebasePegawaiAtasanTab";

export default function CorebasePage() {
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
      <AppLayout breadcrumbs={[{ label: "Administrasi SDM" }, { label: "Corebase" }]}>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Memuat data...</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Administrasi SDM" }, { label: "Corebase" }]}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex flex-wrap gap-1">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="db-pokok" className="gap-2">
            <Database className="h-4 w-4" />
            DB Pokok
          </TabsTrigger>
          <TabsTrigger value="db-status" className="gap-2">
            <FileCheck className="h-4 w-4" />
            DB Status
          </TabsTrigger>
          <TabsTrigger value="db-pensiun" className="gap-2">
            <Users className="h-4 w-4" />
            DB Pensiun
          </TabsTrigger>
          <TabsTrigger value="db-rekam-jejak" className="gap-2">
            <MapPin className="h-4 w-4" />
            DB Rekam Jejak
          </TabsTrigger>
          <TabsTrigger value="db-goljab" className="gap-2">
            <Briefcase className="h-4 w-4" />
            DB Goljab
          </TabsTrigger>
          <TabsTrigger value="eselonisasi" className="gap-2">
            <Building2 className="h-4 w-4" />
            Eselonisasi
          </TabsTrigger>
          <TabsTrigger value="pegawai-atasan" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Pegawai & Atasan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <CorebaseDashboardTab isAdmin={isAdmin} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="db-pokok">
          <CorebaseDbPokokTab isAdmin={isAdmin} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="db-status">
          <CorebaseDbStatusTab isAdmin={isAdmin} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="db-pensiun">
          <CorebaseDbPensiunTab isAdmin={isAdmin} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="db-rekam-jejak">
          <CorebaseDbRekamJejakTab isAdmin={isAdmin} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="db-goljab">
          <CorebaseDbGoljabTab isAdmin={isAdmin} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="eselonisasi">
          <CorebaseEselonisasiTab isAdmin={isAdmin} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="pegawai-atasan">
          <CorebasePegawaiAtasanTab isAdmin={isAdmin} canEdit={canEdit} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
