import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isAdminRole } from "@/hooks/useAuth";

// Mapping dari unit_pemohon ke eselon III di profiles
const UNIT_PEMOHON_TO_ESELON_III: Record<string, string> = {
  "Kepala Bagian Umum": "Bagian Umum",
  "Kepala Bidang Kepabeanan dan Cukai": "Bidang Kepabeanan dan Cukai",
  "Kepala Bidang Fasilitas Kepabeanan dan Cukai": "Bidang Fasilitas Kepabeanan dan Cukai",
  "Kepala Bidang Penindakan dan Penyidikan": "Bidang Penindakan dan Penyidikan",
  "Kepala Bidang Kepatuhan Internal": "Bidang Kepatuhan Internal",
  "Fungsional PBC Ahli Madya Sub Unsur Keberatan dan Banding": "Sub Unsur Keberatan dan Banding",
  "Fungsional PBC Ahli Madya Sub Unsur Audit Kepabeanan dan Cukai": "Sub Unsur Audit Kepabeanan dan Cukai",
};

export function useUserEselonFilter() {
  const { user, role } = useAuth();
  const [userEselonIII, setUserEselonIII] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserEselon = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Admin, super, and overview always see everything
      if (isAdminRole(role) || role === "overview") {
        setUserEselonIII(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("eselon_iii")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        // If eselon_iii is set, use it for filtering
        // If not set (null), user can see all
        setUserEselonIII(data?.eselon_iii || null);
      } catch (error) {
        console.error("Error fetching user eselon:", error);
        setUserEselonIII(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserEselon();
  }, [user, role]);

  /**
   * Check if an assignment should be visible to the current user
   * based on their eselon III setting
   */
  const shouldShowAssignment = (unitPemohon: string): boolean => {
    // Admin/super/overview or users without eselon III can see all
    if (isAdminRole(role) || role === "overview" || !userEselonIII) {
      return true;
    }

    // Map the unit_pemohon to eselon III format
    const assignmentEselonIII = UNIT_PEMOHON_TO_ESELON_III[unitPemohon];
    
    // If we can map it, check if it matches user's eselon III
    if (assignmentEselonIII) {
      return assignmentEselonIII === userEselonIII;
    }

    // Special case: Kepala Kantor Wilayah can be seen by everyone
    if (unitPemohon === "Kepala Kantor Wilayah DJBC Jawa Timur I") {
      return true;
    }

    // For unmapped unit_pemohon (like BAPORS), allow access
    return true;
  };

  /**
   * Filter an array of assignments based on user's eselon III
   */
  const filterAssignmentsByEselon = <T extends { unit_pemohon: string }>(
    assignments: T[]
  ): T[] => {
    // Admin/super/overview or users without eselon III see all
    if (isAdminRole(role) || role === "overview" || !userEselonIII) {
      return assignments;
    }

    return assignments.filter(a => shouldShowAssignment(a.unit_pemohon));
  };

  return {
    userEselonIII,
    loading,
    shouldShowAssignment,
    filterAssignmentsByEselon,
    isFiltered: !!userEselonIII && !isAdminRole(role) && role !== "overview",
  };
}
