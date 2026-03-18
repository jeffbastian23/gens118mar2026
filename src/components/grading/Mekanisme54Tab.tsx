import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, ChevronDown, FileText, Users, GraduationCap, Briefcase, Sparkles, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SidangPenilaianInfoGraphic from "./SidangPenilaianInfoGraphic";

// Helper function to normalize education level display
// DII→D2, DIII→D3, DIV→D4, SLTA/SLTA sederajat→SMA, DIV/S1→D4/S1
// Note: We intentionally do NOT convert standalone "DI" to "D1" as it conflicts
// with the Indonesian preposition "di" in description text.
const normalizePendidikan = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/DIV\/S1/gi, "D4/S1")
    .replace(/DIII/gi, "D3")
    .replace(/DIV/gi, "D4")
    .replace(/DII/gi, "D2")
    .replace(/SLTA Sederajat/gi, "SMA")
    .replace(/SLTA sederajat/gi, "SMA")
    .replace(/SLTA/gi, "SMA");
};

interface Mekanisme54Data {
  id: string;
  jenis_penetapan: string;
  sub_jenis: string;
  kode_kategori: string;
  deskripsi: string;
  level: number;
  parent_kode: string | null;
}

// Color configurations for jenis_penetapan
const JENIS_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  "Penetapan Pertama": {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    badge: "bg-emerald-500 text-white hover:bg-emerald-600"
  },
  "Penetapan Kembali": {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-500 text-white hover:bg-blue-600"
  },
  "Penetapan Simulasi": {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    badge: "bg-amber-500 text-white hover:bg-amber-600"
  },
  "Penetapan Sidang": {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    badge: "bg-purple-500 text-white hover:bg-purple-600"
  }
};

// Color configurations for sub_jenis
const SUB_JENIS_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  "PU": {
    bg: "bg-cyan-100 dark:bg-cyan-900/50",
    text: "text-cyan-700 dark:text-cyan-300",
    icon: <Users className="h-4 w-4" />
  },
  "PK": {
    bg: "bg-rose-100 dark:bg-rose-900/50",
    text: "text-rose-700 dark:text-rose-300",
    icon: <Briefcase className="h-4 w-4" />
  },
  "PTB": {
    bg: "bg-violet-100 dark:bg-violet-900/50",
    text: "text-violet-700 dark:text-violet-300",
    icon: <GraduationCap className="h-4 w-4" />
  }
};

const SUB_JENIS_LABELS: Record<string, string> = {
  "PU": "Pelaksana Umum",
  "PK": "Pelaksana Khusus",
  "PTB": "Pelaksana Tugas Belajar"
};

interface CategoryItemProps {
  item: Mekanisme54Data;
  isChild?: boolean;
}

function CategoryItem({ item, isChild = false }: CategoryItemProps) {
  const subJenisColor = SUB_JENIS_COLORS[item.sub_jenis];
  
  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all duration-200 hover:shadow-md",
        isChild ? "ml-6 bg-muted/30" : "bg-background",
        "border-border/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
          subJenisColor?.bg || "bg-muted"
        )}>
          {subJenisColor?.icon || <FileText className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={cn("text-xs font-medium", subJenisColor?.text)}>
              {item.kode_kategori}
            </Badge>
            {isChild && (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">
            {normalizePendidikan(item.deskripsi)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface SubJenisSectionProps {
  subJenis: string;
  items: Mekanisme54Data[];
}

function SubJenisSection({ subJenis, items }: SubJenisSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const subJenisColor = SUB_JENIS_COLORS[subJenis];
  
  // Separate parent and child items
  const parentItems = items.filter(item => item.level === 1);
  const childItems = items.filter(item => item.level === 2);
  
  // Group children by parent code prefix
  const getChildrenForParent = (parentKode: string) => {
    return childItems.filter(child => child.kode_kategori.startsWith(parentKode + "."));
  };

  return (
    <div className={cn(
      "rounded-xl border-2 overflow-hidden transition-all duration-300",
      subJenisColor?.bg || "bg-muted",
      "border-border/30"
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-4 transition-colors",
          "hover:bg-black/5 dark:hover:bg-white/5"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-lg",
            subJenisColor?.bg || "bg-muted"
          )}>
            {subJenisColor?.icon || <FileText className="h-5 w-5" />}
          </div>
          <div className="text-left">
            <h4 className={cn("font-semibold text-base", subJenisColor?.text)}>
              {SUB_JENIS_LABELS[subJenis] || subJenis}
            </h4>
            <p className="text-xs text-muted-foreground">
              {items.length} kategori
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs", subJenisColor?.bg, subJenisColor?.text)}>
            {subJenis}
          </Badge>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-4 pt-0 space-y-2">
          {parentItems.map(parent => (
            <div key={parent.id} className="space-y-2">
              <CategoryItem item={parent} />
              {getChildrenForParent(parent.kode_kategori).map(child => (
                <CategoryItem key={child.id} item={child} isChild />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface JenisPenetapanCardProps {
  jenis: string;
  data: Mekanisme54Data[];
}

function JenisPenetapanCard({ jenis, data }: JenisPenetapanCardProps) {
  const colors = JENIS_COLORS[jenis];
  
  // Group by sub_jenis
  const groupedBySubJenis = useMemo(() => {
    const groups: Record<string, Mekanisme54Data[]> = {};
    data.forEach(item => {
      if (!groups[item.sub_jenis]) {
        groups[item.sub_jenis] = [];
      }
      groups[item.sub_jenis].push(item);
    });
    return groups;
  }, [data]);

  const subJenisOrder = ["PU", "PK", "PTB"];
  
  return (
    <Card className={cn("border-2", colors?.border)}>
      <CardHeader className={cn("border-b", colors?.bg, colors?.border)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl",
              colors?.badge
            )}>
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className={cn("text-lg", colors?.text)}>
                {jenis}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {data.length} total kategori penetapan
              </p>
            </div>
          </div>
          <Badge className={colors?.badge}>
            {Object.keys(groupedBySubJenis).length} Jenis Pelaksana
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {subJenisOrder.map(subJenis => (
          groupedBySubJenis[subJenis] && (
            <SubJenisSection
              key={subJenis}
              subJenis={subJenis}
              items={groupedBySubJenis[subJenis]}
            />
          )
        ))}
      </CardContent>
    </Card>
  );
}

export default function Mekanisme54Tab() {
  const [data, setData] = useState<Mekanisme54Data[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Penetapan Pertama");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubJenisFilter, setActiveSubJenisFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: result, error } = await supabase
        .from("mekanisme_54")
        .select("*")
        .order("jenis_penetapan")
        .order("sub_jenis")
        .order("kode_kategori");

      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error("Error fetching mekanisme 54 data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data by search query and sub_jenis filter
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = searchQuery === "" || 
        item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kode_kategori.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSubJenis = activeSubJenisFilter === null || item.sub_jenis === activeSubJenisFilter;
      
      return matchesSearch && matchesSubJenis;
    });
  }, [data, searchQuery, activeSubJenisFilter]);

  // Group filtered data by jenis_penetapan
  const groupedData = useMemo(() => {
    const groups: Record<string, Mekanisme54Data[]> = {};
    filteredData.forEach(item => {
      if (!groups[item.jenis_penetapan]) {
        groups[item.jenis_penetapan] = [];
      }
      groups[item.jenis_penetapan].push(item);
    });
    return groups;
  }, [filteredData]);

  const jenisList = ["Penetapan Pertama", "Penetapan Kembali", "Penetapan Simulasi", "Penetapan Sidang"];

  const handleSubJenisFilterClick = (subJenis: string) => {
    setActiveSubJenisFilter(prev => prev === subJenis ? null : subJenis);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveSubJenisFilter(null);
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: data.length,
      byJenis: jenisList.map(jenis => ({
        jenis,
        count: groupedData[jenis]?.length || 0,
        color: JENIS_COLORS[jenis]
      }))
    };
  }, [data, groupedData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Mekanisme 54 - Penetapan Peringkat Jabatan</CardTitle>
              <p className="text-sm text-muted-foreground">
                Database kategori penetapan peringkat jabatan berdasarkan PMK 54
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.byJenis.map(({ jenis, count, color }) => (
              <div
                key={jenis}
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105",
                  color?.bg,
                  color?.border,
                  activeTab === jenis && "ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => setActiveTab(jenis)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className={color?.badge}>{count}</Badge>
                </div>
                <p className={cn("text-sm font-medium", color?.text)}>
                  {jenis.replace("Penetapan ", "")}
                </p>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kategori penetapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {(searchQuery || activeSubJenisFilter) && (
              <button
                onClick={clearFilters}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Legend with clickable filter */}
          <div className="mt-4 p-4 bg-muted/50 rounded-xl">
            <h4 className="text-sm font-medium mb-3">Legenda Jenis Pelaksana: <span className="text-xs text-muted-foreground">(klik untuk filter)</span></h4>
            <div className="flex flex-wrap gap-4">
              {Object.entries(SUB_JENIS_LABELS).map(([key, label]) => {
                const colors = SUB_JENIS_COLORS[key];
                const isActive = activeSubJenisFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSubJenisFilterClick(key)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                      isActive 
                        ? "ring-2 ring-primary ring-offset-2 bg-background shadow-md scale-105" 
                        : "hover:bg-background/80 hover:shadow"
                    )}
                  >
                    <div className={cn("flex items-center justify-center w-6 h-6 rounded", colors.bg)}>
                      {colors.icon}
                    </div>
                    <Badge variant={isActive ? "default" : "outline"} className={cn(!isActive && colors.text)}>
                      {key}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </button>
                );
              })}
            </div>
            {(searchQuery || activeSubJenisFilter) && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Filter aktif:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="text-xs">
                    Pencarian: "{searchQuery}"
                  </Badge>
                )}
                {activeSubJenisFilter && (
                  <Badge variant="secondary" className="text-xs">
                    {SUB_JENIS_LABELS[activeSubJenisFilter]}
                  </Badge>
                )}
                <span className="text-muted-foreground">
                  ({filteredData.length} hasil)
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {jenisList.map(jenis => {
            const color = JENIS_COLORS[jenis];
            return (
              <TabsTrigger
                key={jenis}
                value={jenis}
                className={cn(
                  "text-xs sm:text-sm data-[state=active]:text-white",
                  `data-[state=active]:${color.badge.split(' ')[0]}`
                )}
              >
                {jenis.replace("Penetapan ", "")}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {jenisList.map(jenis => (
          <TabsContent key={jenis} value={jenis} className="mt-4">
            <ScrollArea className="h-[600px]">
              <JenisPenetapanCard 
                jenis={jenis} 
                data={groupedData[jenis] || []} 
              />
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      {/* Infografis Sidang Penilaian */}
      <SidangPenilaianInfoGraphic />
    </div>
  );
}
