import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Quote, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface QuoteItem {
  id: string;
  quote_text: string;
  is_active: boolean;
  display_order: number | null;
  created_at: string;
}

interface QuoteSettings {
  id: string;
  auto_mode: boolean;
  rotation_interval_seconds: number;
}

// Function to get daily quote index based on day of year
const getDailyQuoteIndex = (totalQuotes: number): number => {
  if (totalQuotes === 0) return 0;
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dayOfYear % totalQuotes;
};

export default function QuoteManagement() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [settings, setSettings] = useState<QuoteSettings | null>(null);
  const [newQuote, setNewQuote] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error: any) {
      console.error("Error fetching quotes:", error);
      toast.error("Gagal memuat data quote");
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("quote_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchQuotes(), fetchSettings()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAddQuote = async () => {
    if (!newQuote.trim()) {
      toast.error("Quote tidak boleh kosong");
      return;
    }

    try {
      const maxOrder = Math.max(0, ...quotes.map(q => q.display_order || 0));
      const { error } = await supabase
        .from("quotes")
        .insert({
          quote_text: newQuote.trim(),
          is_active: false,
          display_order: maxOrder + 1,
        });

      if (error) throw error;
      toast.success("Quote berhasil ditambahkan");
      setNewQuote("");
      fetchQuotes();
    } catch (error: any) {
      console.error("Error adding quote:", error);
      toast.error("Gagal menambahkan quote");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      // If auto mode is ON, we can toggle any quote's active status
      // If auto mode is OFF, only one quote can be active at a time
      if (!settings?.auto_mode && !currentStatus) {
        // Deactivate all other quotes first
        await supabase
          .from("quotes")
          .update({ is_active: false })
          .neq("id", id);
      }

      const { error } = await supabase
        .from("quotes")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentStatus ? "Quote dinonaktifkan" : "Quote diaktifkan");
      fetchQuotes();
    } catch (error: any) {
      console.error("Error toggling quote:", error);
      toast.error("Gagal mengubah status quote");
    }
  };

  const handleDeleteQuote = async (id: string) => {
    try {
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Quote berhasil dihapus");
      fetchQuotes();
    } catch (error: any) {
      console.error("Error deleting quote:", error);
      toast.error("Gagal menghapus quote");
    }
  };

  const handleToggleAutoMode = async () => {
    if (!settings) return;

    try {
      const { error } = await supabase
        .from("quote_settings")
        .update({ auto_mode: !settings.auto_mode })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success(settings.auto_mode ? "Mode manual aktif" : "Mode auto aktif");
      setSettings({ ...settings, auto_mode: !settings.auto_mode });
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast.error("Gagal mengubah pengaturan");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Memuat data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Quote className="h-5 w-5" />
            Pengaturan Quote Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Mode Auto</Label>
              <p className="text-sm text-muted-foreground">
                {settings?.auto_mode 
                  ? "Quote akan berputar otomatis berdasarkan hari (rotasi harian)"
                  : "Quote aktif/inaktif diatur secara manual"}
              </p>
              {settings?.auto_mode && quotes.length > 0 && (
                <p className="text-xs text-primary mt-1">
                  Quote hari ini: #{getDailyQuoteIndex(quotes.length) + 1} dari {quotes.length} quote
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{settings?.auto_mode ? "ON" : "OFF"}</span>
              <Switch 
                checked={settings?.auto_mode || false}
                onCheckedChange={handleToggleAutoMode}
              />
              <RefreshCw className={`h-4 w-4 ${settings?.auto_mode ? "animate-spin text-primary" : "text-muted-foreground"}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Quote</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Tambahkan quote baru..."
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddQuote()}
            />
            <Button onClick={handleAddQuote}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Quote</TableHead>
                <TableHead className="w-24 text-center">Status</TableHead>
                <TableHead className="w-24 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Belum ada quote
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote, index) => (
                  <TableRow key={quote.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="italic">"{quote.quote_text}"</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={quote.is_active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(quote.id, quote.is_active)}
                      >
                        {quote.is_active ? "Aktif" : "Inaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
