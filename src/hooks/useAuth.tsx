import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRoles: string[];
  isAdmin: boolean;
  isSeller: boolean;
  sellerStatus: string;
  sellerPaid: boolean;
  username: string | null;
  verificationStatus: string;
  verificationNote: string | null;
  isVip: boolean;
  completedSessions: number;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRoles: [],
  isAdmin: false,
  isSeller: false,
  sellerStatus: "none",
  sellerPaid: false,
  username: null,
  verificationStatus: "none",
  verificationNote: null,
  isVip: false,
  completedSessions: 0,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [sellerStatus, setSellerStatus] = useState("none");
  const [sellerPaid, setSellerPaid] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState("none");
  const [verificationNote, setVerificationNote] = useState<string | null>(null);
  
  const [isVip, setIsVip] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    setUserRoles(data?.map((r) => r.role) || []);
  };

  const fetchProfile = async (_userId: string) => {
    const { data } = await supabase.rpc("get_own_profile");
    const profile = Array.isArray(data) ? data[0] : data;
    if (profile) {
      setSellerStatus(profile.seller_status || "none");
      setUsername(profile.username || null);
      setVerificationStatus(profile.verification_status || "none");
      setVerificationNote(null); // excluded from RPC for security
      
      setIsVip(profile.is_vip ?? false);
      setCompletedSessions(profile.completed_sessions ?? 0);
      setSellerPaid(profile.seller_paid ?? false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // On password recovery, redirect to reset page instead of auto-login
        if (event === "PASSWORD_RECOVERY") {
          // Navigate to reset-password page — use window.location to ensure it works
          // even before React Router is fully ready
          if (window.location.pathname !== "/reset-password") {
            window.location.href = "/reset-password";
          }
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchRoles(session.user.id);
          await fetchProfile(session.user.id);
        } else {
          setUserRoles([]);
          setSellerStatus("none");
          setUsername(null);
          setVerificationStatus("none");
          setVerificationNote(null);
          setSellerTier(1);
          setIsVip(false);
          setCompletedSessions(0);
          setSellerPaid(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        userRoles,
        isAdmin: userRoles.includes("admin"),
        isSeller: userRoles.includes("seller") || sellerStatus === "active",
        sellerStatus,
        sellerPaid,
        username,
        verificationStatus,
        verificationNote,
        sellerTier: isVip ? 4 : sellerTier,
        isVip,
        completedSessions,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
