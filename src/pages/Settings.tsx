import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import PaymentSettings from "@/components/PaymentSettings";

export default function Settings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">User Settings</h1>
        </div>
        <PaymentSettings />
      </div>
    </Layout>
  );
}
