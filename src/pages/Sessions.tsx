import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import SessionCard, { SessionData } from "@/components/SessionCard";
import { Crosshair } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Sessions() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.rpc("get_public_sessions");

      if (data) {
        setSessions(
          data.map((s) => ({
            id: s.id,
            shooterName: s.shooter_name,
            platform: s.platform,
            agentRoom: s.agent_room,
            totalBuyIn: Number(s.total_buy_in),
            stakeAvailable: Number(s.stake_available),
            stakeSold: Number(s.stake_sold ?? 0),
            sharePrice: Number((s as any).share_price ?? 50),
            endTime: new Date(s.end_time).toLocaleString(),
            status: (s.status ?? "pending") as SessionData["status"],
            streamUrl: s.stream_url ?? undefined,
          }))
        );
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Crosshair className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">All Sessions</h1>
        </div>
        {loading ? (
          <p className="text-muted-foreground">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground">No sessions yet.</p>
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
