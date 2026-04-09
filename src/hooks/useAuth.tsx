import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { defaultUserProfileState } from "@/lib/authState";

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

  const resetProfileState = () => {
    setSellerStatus(defaultUserProfileState.sellerStatus);
    setUsername(defaultUserProfileState.username);
    setVerificationStatus(defaultUserProfileState.verificationStatus);
    setVerificationNote(defaultUserProfileState.verificationNote);
    setIsVip(defaultUserProfileState.isVip);
    setCompletedSessions(defaultUserProfileState.completedSessions);
    setSellerPaid(defaultUserProfileState.sellerPaid);
  };

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) throw error;
    return data?.map((r) => r.role) || [];
  };

  const fetchProfile = async (_userId: string) => {
    const { data, error } = await supabase.rpc("get_own_profile");
    if (error) throw error;
    const profile = Array.isArray(data) ? data[0] : data;
    return {
      sellerStatus: profile?.seller_status || "none",
      username: profile?.username || null,
      verificationStatus: profile?.verification_status || "none",
      verificationNote: null,
      isVip: profile?.is_vip ?? false,
      completedSessions: profile?.completed_sessions ?? 0,
      sellerPaid: profile?.seller_paid ?? false,
    };
  };

  useEffect(() => {
    let active = true;

    const syncAuthState = async (nextSession: Session | null, event?: string) => {
      if (!active) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (event === "PASSWORD_RECOVERY") {
        setLoading(false);
        if (window.location.pathname !== "/reset-password") {
          window.location.href = "/reset-password";
        }
        return;
      }

      if (!nextSession?.user) {
        setUserRoles([]);
        resetProfileState();
        setLoading(false);
        return;
      }

      const [rolesResult, profileResult] = await Promise.allSettled([
        fetchRoles(nextSession.user.id),
        fetchProfile(nextSession.user.id),
      ]);

      if (!active) return;

      setUserRoles(rolesResult.status === "fulfilled" ? rolesResult.value : []);

      if (profileResult.status === "fulfilled") {
        setSellerStatus(profileResult.value.sellerStatus);
        setUsername(profileResult.value.username);
        setVerificationStatus(profileResult.value.verificationStatus);
        setVerificationNote(profileResult.value.verificationNote);
        setIsVip(profileResult.value.isVip);
        setCompletedSessions(profileResult.value.completedSessions);
        setSellerPaid(profileResult.value.sellerPaid);
      } else {
        resetProfileState();
      }

      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void syncAuthState(nextSession, event);
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      void syncAuthState(currentSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
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
        
        isVip,
        completedSessions,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
