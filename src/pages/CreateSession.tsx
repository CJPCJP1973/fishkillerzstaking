import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import CreateSessionForm from "@/components/CreateSessionForm";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";

export default function CreateSession() {
  const { user, isSeller, loading } = useAuth();
  const navigate = useNavigate();

  useSEO({
    title: "Create Session | FishKillerz",
    description: "List a new fish table staking session on FishKillerz. Set your buy-in, stake amount, and platform.",
    canonical: "/create",
  });

  useEffect(() => {
    if (!loading && (!user || !isSeller)) {
      navigate("/profile");
    }
  }, [user, isSeller, loading, navigate]);

  if (loading || !user || !isSeller) return null;

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-6">
          Create a Staking Session
        </h1>
        <CreateSessionForm />
      </div>
    </Layout>
  );
}
