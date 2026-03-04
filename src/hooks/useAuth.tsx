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
  username: string | null;
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
  username: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [sellerStatus, setSellerStatus] = useState("none");
  const [username, setUsername] = useState<string | null>(null);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    setUserRoles(data?.map((r) => r.role) || []);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("seller_status, username")
      .eq("user_id", userId)
      .single();
    if (data) {
      setSellerStatus(data.seller_status || "none");
      setUsername(data.username || null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchRoles(session.user.id);
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setUserRoles([]);
          setSellerStatus("none");
          setUsername(null);
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
        username,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
