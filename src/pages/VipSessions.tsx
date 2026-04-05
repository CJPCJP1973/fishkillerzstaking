import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SessionCard, { SessionData } from "@/components/SessionCard";
import { Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";

export default function VipSessions() {
  const { user, isVip, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useSEO({
    title: "VIP Sessions | FishKillerz Staking",
    description:
      "Exclusive high-stakes fish table staking sessions from Apex Predator sellers. VIP access only — 2% rake. Golden Dragon, Diamond Dragon & more.",
    canonical: "/vip-sessions",
  });

  useEffect(() => {
    if (!loading && (!user || !isVip)) {
      navigate("/sessions");
    }
  }, [user, isVip, loading, navigate]);

  useEffect(() => {
    if (!user || !isVip) return;
    const fetch = async () => {
      const { data } = await supabase.rpc("get_public_sessions");
      if (data) {
        const vipSessions = (data as any[]).filter((s) => s.shooter_tier === 4);
        setSessions(
          vipSessions.map((s) => ({
            id: s.id,
            shooterName: s.shooter_name,
            platform: s.platform,
            agentRoom: s.agent_room,
            totalBuyIn: Number(s.total_buy_in),
            stakeAvailable: Number(s.stake_available),
            stakeSold: Number(s.stake_sold ?? 0),
            sharePrice: Number(s.share_price),
            endTime: new Date(s.end_time).toLocaleString(),
            status: (s.status ?? "pending") as SessionData["status"],
            streamUrl: s.stream_url ?? undefined,
          }))
        );
      }
      setLoadingSessions(false);
    };
    fetch();
  }, [user, isVip]);

  if (loading || !user || !isVip) return null;

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-md bg-yellow-400/20">
            <Crown className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">VIP Sessions</h1>
            <p className="text-xs text-muted-foreground">
              Exclusive listings from Apex Predator sellers · 2% rake
            </p>
          </div>
        </div>
        {loadingSessions ? (
          <p className="text-muted-foreground">Loading VIP sessions…</p>
        ) : sessions.length === 0 ? (
          <div className="gradient-card rounded-lg p-8 text-center">
            <Crown className="h-10 w-10 text-yellow-400/50 mx-auto mb-3" />
            <p className="text-muted-foreground font-display">No VIP sessions available right now.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Check back soon for exclusive high-stakes listings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
