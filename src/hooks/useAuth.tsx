import { useEffect, useState, useContext, createContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

export type UserRole = "admin" | "user" | "overview" | "super" | null;

// Helper function to check if role has admin privileges
export const isAdminRole = (role: UserRole): boolean => {
  return role === "admin" || role === "super";
};

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: UserRole;
  fullName: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const sessionCheckRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("[AuthProvider] Error fetching user role:", error);
        setRole(null);
        return;
      }

      // Handle legacy sapu_jagat role by converting to super
      const fetchedRole = data?.role === 'sapu_jagat' ? 'super' : data?.role;
      setRole((fetchedRole ?? null) as UserRole);
    } catch (error) {
      console.error("[AuthProvider] Exception fetching user role:", error);
      setRole(null);
    }
  }, []);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("[AuthProvider] Error fetching profile:", error);
        setFullName(null);
        return;
      }

      setFullName(data?.full_name ?? null);
    } catch (error) {
      console.error("[AuthProvider] Exception fetching profile:", error);
      setFullName(null);
    }
  }, []);

  const resetAuthState = useCallback(() => {
    setUser(null);
    setSession(null);
    setRole(null);
    setFullName(null);
  }, []);

  // Periodic session check every 5 minutes as fallback
  const startSessionCheck = useCallback(() => {
    if (sessionCheckRef.current) clearInterval(sessionCheckRef.current);
    sessionCheckRef.current = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        resetAuthState();
        toast.warning("Sesi Anda telah berakhir, silakan login ulang.", {
          action: {
            label: "Login",
            onClick: () => navigate("/auth"),
          },
        });
        navigate("/auth");
      }
    }, 5 * 60 * 1000); // every 5 minutes
  }, [navigate, resetAuthState]);

  useEffect(() => {
    // Set up auth state listener FIRST before getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthProvider] Auth event:', event);

        if (event === 'SIGNED_IN') {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            // Use setTimeout to avoid Supabase deadlock on auth callbacks
            setTimeout(() => {
              fetchUserRole(session.user.id);
              fetchUserProfile(session.user.id);
            }, 0);
          }
          startSessionCheck();
          setLoading(false);

        } else if (event === 'TOKEN_REFRESHED') {
          // Only update session, no need to re-fetch role/profile
          setSession(session);
          setUser(session?.user ?? null);

        } else if (event === 'SIGNED_OUT') {
          resetAuthState();
          setLoading(false);
          if (sessionCheckRef.current) clearInterval(sessionCheckRef.current);
          toast.info("Anda telah keluar dari sistem.");
          navigate("/auth");

        } else if (event === 'USER_UPDATED') {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            setTimeout(() => {
              fetchUserProfile(session.user.id);
            }, 0);
          }

        } else if (event === 'INITIAL_SESSION') {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            setTimeout(() => {
              fetchUserRole(session.user.id);
              fetchUserProfile(session.user.id);
            }, 0);
            startSessionCheck();
          }
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        fetchUserRole(session.user.id);
        fetchUserProfile(session.user.id);
        startSessionCheck();
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (sessionCheckRef.current) clearInterval(sessionCheckRef.current);
    };
  }, [fetchUserRole, fetchUserProfile, resetAuthState, startSessionCheck, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    // SIGNED_OUT event will handle navigation + state reset
  };

  return (
    <AuthContext.Provider value={{ user, session, role, fullName, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
