import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Award, Briefcase } from "lucide-react";

interface SyaratKenaikanPangkat {
  id: string;
  jenis_kenaikan: string;
  kode_kriteria: string;
  kriteria: string;
  deskripsi: string | null;
  is_active: boolean;
  no_urut: number | null;
  created_at: string;
  updated_at: string;
}

interface SyaratKenaikanPangkatTabProps {
  isAdmin: boolean;
  canEdit: boolean;
}

export default function SyaratKenaikanPangkatTab({ isAdmin, canEdit }: SyaratKenaikanPangkatTabProps) {
  const [data, setData] = useState<SyaratKenaikanPangkat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("regular");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: result, error } = await supabase
        .from("syarat_kenaikan_pangkat")
        .select("*")
        .order("no_urut", { ascending: true });

      if (error) throw error;
      setData(result || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data syarat kenaikan pangkat");
    } finally {
      setLoading(false);
    }
  };

  const regularData = data.filter(item => item.jenis_kenaikan === "regular");
  const fungsionalData = data.filter(item => item.jenis_kenaikan === "fungsional");

  const renderTable = (items: SyaratKenaikanPangkat[]) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Kode</TableHead>
            <TableHead>Kriteria</TableHead>
            <TableHead className="hidden md:table-cell">Deskripsi</TableHead>
            <TableHead className="w-24 text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                Belum ada data kriteria.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-primary">
                    {item.kode_kriteria}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{item.kriteria}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {item.deskripsi || "-"}
                </TableCell>
                <TableCell className="text-center">
                  {item.is_active ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Nonaktif
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Syarat Kenaikan Pangkat
          <Badge variant="secondary" className="ml-2">
            Total: {data.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="regular" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Regular
              <Badge variant="outline" className="ml-1">{regularData.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="fungsional" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Fungsional
              <Badge variant="outline" className="ml-1">{fungsionalData.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="regular">
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Kriteria Regular</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Persyaratan kenaikan pangkat regular untuk pegawai yang memenuhi kriteria berikut:
              </p>
            </div>
            {renderTable(regularData)}
          </TabsContent>
          
          <TabsContent value="fungsional">
            <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Kriteria Fungsional</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Persyaratan kenaikan pangkat fungsional untuk pejabat fungsional yang memenuhi kriteria berikut:
              </p>
            </div>
            {renderTable(fungsionalData)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
