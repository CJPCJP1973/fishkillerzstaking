import { ReactNode, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin }: Props) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [serverVerified, setServerVerified] = useState<boolean | null>(requireAdmin ? null : true);

  useEffect(() => {
    if (!requireAdmin || !user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      if (!data) navigate("/", { replace: true });
      else setServerVerified(true);
    });
  }, [user, requireAdmin]);

  if (loading || (requireAdmin && serverVerified === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
