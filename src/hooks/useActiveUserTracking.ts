import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PAGE_NAMES: Record<string, string> = {
  '/': 'Beranda',
  '/dashboard': 'Dashboard',
  '/admin': 'Admin Panel',
  '/surat-tugas': 'Surat Tugas',
  '/plh-plt': 'PLH/PLT',
  '/pendidikan': 'Pendidikan',
  '/pensiun': 'Pensiun',
  '/cuti': 'Cuti',
  '/absensi': 'Absensi',
  '/daftar-pegawai': 'Daftar Pegawai',
  '/arsip': 'Arsip',
  '/berita': 'Berita',
  '/digital-footprint': 'Digital Footprint',
  '/agenda': 'Agenda',
  '/kunjungan-tamu': 'Kunjungan Tamu',
  '/surat-masuk': 'Surat Masuk',
  '/ebook': 'eBook',
  '/qr-presensi': 'QR Presensi',
  '/aktivasi-cortax': 'Aktivasi Cortax',
  '/japri-teman': 'Japri Teman',
  '/live-chat-sdm': 'Live Chat SDM',
  '/rumah-negara': 'Rumah Negara',
  '/monitor-pbdk': 'Monitor PBDK',
  '/mutasi': 'Mutasi',
  '/kekuatan-pegawai': 'Kekuatan Pegawai',
  '/grading': 'Grading',
  '/penilaian-perilaku': 'Penilaian Perilaku',
};

export function useActiveUserTracking() {
  const { user } = useAuth();
  const location = useLocation();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    // Create or reuse the presence channel
    const channel = supabase.channel('active-users-presence', {
      config: {
        presence: { key: 'active_users' },
      },
    });

    channelRef.current = channel;

    const trackPresence = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const pageName = PAGE_NAMES[location.pathname] || location.pathname;

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            email: user.email,
            full_name: profile?.full_name || user.email,
            online_at: new Date().toISOString(),
            current_page: pageName,
            user_id: user.id,
          });
        }
      });
    };

    trackPresence();

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.email, user?.id]);

  // Update page when location changes
  useEffect(() => {
    if (!user?.email || !channelRef.current) return;

    const updatePage = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const pageName = PAGE_NAMES[location.pathname] || location.pathname;

      await channelRef.current?.track({
        email: user.email,
        full_name: profile?.full_name || user.email,
        online_at: new Date().toISOString(),
        current_page: pageName,
        user_id: user.id,
      });
    };

    updatePage();
  }, [location.pathname, user?.email, user?.id]);
}
