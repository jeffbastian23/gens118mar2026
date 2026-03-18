import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isAdminRole } from "@/hooks/useAuth";

export function useSubMenuAccess(menuId: string) {
  const { user, role } = useAuth();
  const [allowedSubMenus, setAllowedSubMenus] = useState<string[]>([]);
  const [hasParentMenuAccess, setHasParentMenuAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubMenuAccess = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Admin and super always have full access
      if (isAdminRole(role)) {
        setHasParentMenuAccess(true);
        setAllowedSubMenus([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_menu_access")
          .select("allowed_menus")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.allowed_menus) {
          // Check if user has access to parent menu
          const hasParent = data.allowed_menus.includes(menuId);
          setHasParentMenuAccess(hasParent);
          
          // Filter sub-menus that belong to this menu
          const subMenus = data.allowed_menus.filter((menu: string) => 
            menu.startsWith(`${menuId}:`)
          );
          setAllowedSubMenus(subMenus);
        } else {
          setHasParentMenuAccess(false);
          setAllowedSubMenus([]);
        }
      } catch (error) {
        console.error("Error fetching sub-menu access:", error);
        setHasParentMenuAccess(false);
        setAllowedSubMenus([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubMenuAccess();
  }, [user, role, menuId]);

  const hasSubMenuAccess = (subMenuId: string): boolean => {
    // Admin and super always have access
    if (isAdminRole(role)) return true;
    
    // If user doesn't have parent menu access, no access at all
    if (!hasParentMenuAccess) return false;
    
    // If user has parent menu but no specific sub-menus configured,
    // it means they have access to ALL sub-menus
    if (allowedSubMenus.length === 0 && !loading) {
      return true;
    }
    
    // Check if specific sub-menu is allowed
    return allowedSubMenus.includes(subMenuId);
  };

  const getAccessibleSubMenus = (): string[] => {
    return allowedSubMenus;
  };

  return {
    hasSubMenuAccess,
    getAccessibleSubMenus,
    loading,
    isAdmin: isAdminRole(role),
    hasParentMenuAccess,
  };
}