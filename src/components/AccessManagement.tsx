import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, KeyRound, Users, RefreshCw, ChevronDown, ChevronRight, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth, isAdminRole } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
// Import centralized menu configuration
import {
  MenuItem,
  MAIN_MENUS,
  ADMINISTRASI_SDM_MENUS,
  PENGEMBANGAN_SDM_MENUS,
  ALL_MENUS,
  getAllMenuIds,
} from "@/config/menuConfig";

interface UserWithAccess {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  allowed_menus: string[];
  role?: string;
}

export default function AccessManagement() {
  const { role } = useAuth();
  const [users, setUsers] = useState<UserWithAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, string[]>>({});
  const [expandedMenus, setExpandedMenus] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchUsersWithAccess();
  }, []);

  // Real-time sync
  useEffect(() => {
    const channel = supabase
      .channel('user-menu-access-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_menu_access'
        },
        () => {
          fetchUsersWithAccess();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsersWithAccess = async () => {
    try {
      setLoading(true);

      // Fetch profiles, user_roles, and menu access in parallel
      const [profilesRes, rolesRes, accessRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, user_id, email, full_name')
          .order('full_name', { ascending: true }),
        supabase
          .from('user_roles')
          .select('user_id, role'),
        supabase
          .from('user_menu_access')
          .select('user_id, allowed_menus')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (accessRes.error) throw accessRes.error;

      const profiles = profilesRes.data ?? [];
      const rolesData = rolesRes.data ?? [];
      const accessData = accessRes.data ?? [];

      // Combine data with role info for sorting (include all users including admin)
      const usersWithAccess: UserWithAccess[] = profiles
        .map((profile) => {
          const access = accessData.find((a) => a.user_id === profile.user_id);
          const userRole = rolesData.find((r) => r.user_id === profile.user_id);
          return {
            ...profile,
            allowed_menus: access?.allowed_menus ?? [],
            role: userRole?.role,
          };
        });

      // Sort by role hierarchy: admin, overview, super, user
      const roleOrder: Record<string, number> = { admin: 1, overview: 2, super: 3, user: 4 };
      usersWithAccess.sort((a, b) => {
        const orderA = a.role ? (roleOrder[a.role] ?? 5) : 5;
        const orderB = b.role ? (roleOrder[b.role] ?? 5) : 5;
        return orderA - orderB;
      });

      setUsers(usersWithAccess);
      setPendingChanges({});
    } catch (error: any) {
      console.error('Error fetching users with access:', error);
      toast.error('Gagal memuat data akses pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuToggle = (userId: string, menuId: string, currentMenus: string[]) => {
    const pendingMenus = pendingChanges[userId] ?? currentMenus;
    let newMenus: string[];

    // Find menu to check if it has sub-menus
    const menu = ALL_MENUS.find(m => m.id === menuId);
    
    if (pendingMenus.includes(menuId)) {
      // Remove menu and all its sub-menus
      newMenus = pendingMenus.filter((m) => m !== menuId && !m.startsWith(menuId + ':'));
    } else {
      // Add menu and all its sub-menus
      newMenus = [...pendingMenus, menuId];
      if (menu?.subMenus) {
        menu.subMenus.forEach(sub => {
          if (!newMenus.includes(sub.id)) {
            newMenus.push(sub.id);
          }
        });
      }
    }
    
    setPendingChanges((prev) => ({
      ...prev,
      [userId]: newMenus,
    }));
  };

  const handleSubMenuToggle = (userId: string, subMenuId: string, parentMenuId: string, currentMenus: string[]) => {
    const pendingMenus = pendingChanges[userId] ?? currentMenus;
    let newMenus: string[];

    if (pendingMenus.includes(subMenuId)) {
      // Remove sub-menu
      newMenus = pendingMenus.filter((m) => m !== subMenuId);
      
      // Check if all sub-menus are now removed, then remove parent too
      const menu = ALL_MENUS.find(m => m.id === parentMenuId);
      if (menu?.subMenus) {
        const hasAnySubMenu = menu.subMenus.some(sub => 
          sub.id !== subMenuId && newMenus.includes(sub.id)
        );
        if (!hasAnySubMenu) {
          newMenus = newMenus.filter(m => m !== parentMenuId);
        }
      }
    } else {
      // Add sub-menu and ensure parent is also added
      newMenus = [...pendingMenus, subMenuId];
      if (!newMenus.includes(parentMenuId)) {
        newMenus.push(parentMenuId);
      }
    }
    
    setPendingChanges((prev) => ({
      ...prev,
      [userId]: newMenus,
    }));
  };

  const handleSelectAll = (userId: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      [userId]: getAllMenuIds(),
    }));
  };

  const handleClearAll = (userId: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      [userId]: [],
    }));
  };

  const toggleMenuExpansion = (userId: string, menuId: string) => {
    setExpandedMenus(prev => {
      const userExpanded = prev[userId] || [];
      if (userExpanded.includes(menuId)) {
        return { ...prev, [userId]: userExpanded.filter(m => m !== menuId) };
      } else {
        return { ...prev, [userId]: [...userExpanded, menuId] };
      }
    });
  };

  const isMenuExpanded = (userId: string, menuId: string): boolean => {
    return (expandedMenus[userId] || []).includes(menuId);
  };

  const saveUserAccess = async (userId: string) => {
    const menus = pendingChanges[userId];
    if (menus === undefined) return;

    setSaving(userId);
    try {
      // Check if user already has access record
      const { data: existing } = await supabase
        .from('user_menu_access')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('user_menu_access')
          .update({ allowed_menus: menus })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('user_menu_access')
          .insert({ user_id: userId, allowed_menus: menus });

        if (error) throw error;
      }

      toast.success('Akses menu berhasil disimpan');
      
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, allowed_menus: menus } : u
        )
      );
      
      // Clear pending changes for this user
      setPendingChanges((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    } catch (error: any) {
      console.error('Error saving menu access:', error);
      toast.error('Gagal menyimpan akses menu');
    } finally {
      setSaving(null);
    }
  };

  const getMenusForUser = (user: UserWithAccess): string[] => {
    return pendingChanges[user.user_id] ?? user.allowed_menus;
  };

  const hasChanges = (userId: string): boolean => {
    return pendingChanges[userId] !== undefined;
  };

  const countSelectedMenus = (menus: string[]): number => {
    // Count only main menus, not sub-menus
    return ALL_MENUS.filter(m => menus.includes(m.id)).length;
  };

  const countSelectedSubMenus = (menus: string[], parentId: string): number => {
    const parent = ALL_MENUS.find(m => m.id === parentId);
    if (!parent?.subMenus) return 0;
    return parent.subMenus.filter(sub => menus.includes(sub.id)).length;
  };

  const renderMenuSection = (
    title: string,
    menuList: MenuItem[],
    userId: string,
    currentMenus: string[],
    originalMenus: string[]
  ) => (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
        {title}
      </DropdownMenuLabel>
      {menuList.map((menu) => (
        <div key={menu.id}>
          {menu.subMenus ? (
            <Collapsible 
              open={isMenuExpanded(userId, menu.id)}
              onOpenChange={() => toggleMenuExpansion(userId, menu.id)}
            >
              <div className="flex items-center">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 mr-1">
                    {isMenuExpanded(userId, menu.id) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <DropdownMenuCheckboxItem
                  checked={currentMenus.includes(menu.id)}
                  onCheckedChange={() => handleMenuToggle(userId, menu.id, originalMenus)}
                  onSelect={(e) => e.preventDefault()}
                  className="flex-1"
                >
                  <span className="flex items-center gap-2">
                    {menu.label}
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {countSelectedSubMenus(currentMenus, menu.id)}/{menu.subMenus.length}
                    </Badge>
                  </span>
                </DropdownMenuCheckboxItem>
              </div>
              <CollapsibleContent className="pl-8 space-y-1">
                {menu.subMenus.map((subMenu) => (
                  <DropdownMenuCheckboxItem
                    key={subMenu.id}
                    checked={currentMenus.includes(subMenu.id)}
                    onCheckedChange={() => handleSubMenuToggle(userId, subMenu.id, menu.id, originalMenus)}
                    onSelect={(e) => e.preventDefault()}
                    className="text-sm text-muted-foreground"
                  >
                    {subMenu.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <DropdownMenuCheckboxItem
              checked={currentMenus.includes(menu.id)}
              onCheckedChange={() => handleMenuToggle(userId, menu.id, originalMenus)}
              onSelect={(e) => e.preventDefault()}
            >
              {menu.label}
            </DropdownMenuCheckboxItem>
          )}
        </div>
      ))}
    </>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-6 w-6" />
              Manajemen Akses Menu
            </CardTitle>
            <CardDescription>
              Atur hak akses menu dan sub-menu untuk setiap pengguna. User hanya bisa mengakses menu yang dipilih.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {isAdminRole(role) && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const exportData = users.map((u, idx) => ({
                      No: idx + 1,
                      Nama: u.full_name || "",
                      Email: u.email,
                      Role: u.role || "",
                      "Menu Diizinkan": u.allowed_menus.join(", "),
                    }));
                    const ws = XLSX.utils.json_to_sheet(exportData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Akses Menu");
                    XLSX.writeFile(wb, "manajemen_akses.xlsx");
                    toast.success("Data berhasil diekspor");
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const reader = new FileReader();
                        reader.onload = async (evt) => {
                          const bstr = evt.target?.result;
                          const wb = XLSX.read(bstr, { type: "binary" });
                          const wsname = wb.SheetNames[0];
                          const ws = wb.Sheets[wsname];
                          const jsonData: any[] = XLSX.utils.sheet_to_json(ws);
                          
                          // Process import: update menu access based on email
                          let updated = 0;
                          for (const row of jsonData) {
                            const email = row.Email?.toString().trim();
                            const menusStr = row["Menu Diizinkan"]?.toString().trim();
                            if (!email || !menusStr) continue;
                            
                            const user = users.find((u) => u.email === email);
                            if (!user) continue;
                            
                            const menus = menusStr.split(",").map((m: string) => m.trim()).filter(Boolean);
                            
                            // Check if user already has access record
                            const { data: existing } = await supabase
                              .from('user_menu_access')
                              .select('id')
                              .eq('user_id', user.user_id)
                              .maybeSingle();

                            if (existing) {
                              await supabase
                                .from('user_menu_access')
                                .update({ allowed_menus: menus })
                                .eq('user_id', user.user_id);
                            } else {
                              await supabase
                                .from('user_menu_access')
                                .insert({ user_id: user.user_id, allowed_menus: menus });
                            }
                            updated++;
                          }
                          
                          toast.success(`Berhasil mengupdate akses ${updated} user`);
                          fetchUsersWithAccess();
                        };
                        reader.readAsBinaryString(file);
                      } catch (error: any) {
                        console.error("Error importing data:", error);
                        toast.error("Gagal membaca file Excel");
                      }
                      e.target.value = "";
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
              </>
            )}
            <Button variant="outline" onClick={fetchUsersWithAccess}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Belum ada pengguna terdaftar
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">No</TableHead>
                <TableHead className="w-[200px]">Nama</TableHead>
                <TableHead className="w-[200px]">Email</TableHead>
                <TableHead>Menu yang Diizinkan</TableHead>
                <TableHead className="text-center w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => {
                const currentMenus = getMenusForUser(user);
                const changed = hasChanges(user.user_id);

                // Row background color based on role (matching User Management tab)
                const rowBgClass = user.role === 'admin' 
                  ? 'bg-blue-50 hover:bg-blue-100' 
                  : user.role === 'overview' 
                    ? 'bg-purple-50 hover:bg-purple-100' 
                    : user.role === 'super' 
                      ? 'bg-emerald-50 hover:bg-emerald-100' 
                      : 'bg-slate-50 hover:bg-slate-100';

                return (
                  <TableRow key={user.id} className={rowBgClass}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.full_name || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <Users className="h-4 w-4 mr-2" />
                            {currentMenus.length === 0 ? (
                              <span className="text-muted-foreground">Tidak ada akses</span>
                            ) : currentMenus.length === getAllMenuIds().length ? (
                              <span>Semua menu ({countSelectedMenus(currentMenus)})</span>
                            ) : (
                              <span>{countSelectedMenus(currentMenus)} menu, {currentMenus.length - countSelectedMenus(currentMenus)} sub-menu</span>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80 max-h-[500px] overflow-y-auto bg-background z-50">
                          <DropdownMenuLabel className="flex items-center justify-between">
                            <span>Pilih Menu & Sub-Menu</span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs"
                                onClick={() => handleSelectAll(user.user_id)}
                              >
                                Semua
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs"
                                onClick={() => handleClearAll(user.user_id)}
                              >
                                Hapus
                              </Button>
                            </div>
                          </DropdownMenuLabel>
                          
                          {/* Menu Utama */}
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                            Menu Utama
                          </DropdownMenuLabel>
                          {MAIN_MENUS.map((menu) => (
                            <DropdownMenuCheckboxItem
                              key={menu.id}
                              checked={currentMenus.includes(menu.id)}
                              onCheckedChange={() =>
                                handleMenuToggle(user.user_id, menu.id, user.allowed_menus)
                              }
                              onSelect={(e) => e.preventDefault()}
                            >
                              {menu.label}
                            </DropdownMenuCheckboxItem>
                          ))}
                          
                          {/* Administrasi SDM */}
                          {renderMenuSection(
                            "Administrasi SDM",
                            ADMINISTRASI_SDM_MENUS,
                            user.user_id,
                            currentMenus,
                            user.allowed_menus
                          )}
                          
                          {/* Pengembangan SDM */}
                          {renderMenuSection(
                            "Pengembangan SDM",
                            PENGEMBANGAN_SDM_MENUS,
                            user.user_id,
                            currentMenus,
                            user.allowed_menus
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {/* Show badges for selected menus */}
                      {currentMenus.length > 0 && countSelectedMenus(currentMenus) <= 5 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {ALL_MENUS.filter(m => currentMenus.includes(m.id)).map((menu) => {
                            const subCount = menu.subMenus 
                              ? countSelectedSubMenus(currentMenus, menu.id)
                              : 0;
                            const totalSub = menu.subMenus?.length || 0;
                            
                            return (
                              <Badge key={menu.id} variant="secondary" className="text-xs">
                                {menu.label}
                                {totalSub > 0 && (
                                  <span className="ml-1 text-muted-foreground">
                                    ({subCount}/{totalSub})
                                  </span>
                                )}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        onClick={() => saveUserAccess(user.user_id)}
                        disabled={!changed || saving === user.user_id}
                        variant={changed ? "default" : "outline"}
                      >
                        {saving === user.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}