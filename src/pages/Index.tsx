import { useEffect, useState } from "react";
import { Crosshair, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import LiveFeed from "@/components/LiveFeed";
import StatsBar from "@/components/StatsBar";
import SessionCard, { SessionData } from "@/components/SessionCard";
import PlatformBadge from "@/components/PlatformBadge";
import OcrDashboardWidget from "@/components/OcrDashboardWidget";
import heroBg from "@/assets/hero-bg.png";
import { supabase } from "@/integrations/supabase/client";

const featuredPlatforms = ["Golden Dragon", "Diamond Dragon", "Fire Phoenix", "Vblink", "Riversweeps", "Magic City"];

export default function Index() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      const { data: allData } = await supabase.rpc("get_public_sessions");
      const data = (allData || [])
        .filter((s: any) => ["funding", "live", "pending"].includes(s.status))
        .slice(0, 6);

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
            sharePrice: Number(s.share_price),
            endTime: new Date(s.end_time).toLocaleString(),
            status: (s.status ?? "pending") as SessionData["status"],
            streamUrl: s.stream_url ?? undefined,
          }))
        );
      }
      setLoading(false);
    };
    fetchSessions();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        <div className="relative container py-12 md:py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Crosshair className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Staking Marketplace</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight mb-4">
              FISH<span className="text-primary glow-text-cyan">KILLERZ</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mb-6 max-w-md">
              Back elite players on fish table sessions. Buy stakes, track live wins, and collect your cut.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/sessions">
                <Button className="gradient-primary text-primary-foreground font-display font-bold px-6 py-5 text-base">
                  Browse Sessions <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="outline" className="border-accent/30 text-accent hover:bg-accent/10 font-display font-bold px-6 py-5 text-base">
                  💰 Buy FishDollarz
                </Button>
              </Link>
              <Link to="/create">
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 font-display font-bold px-6 py-5 text-base">
                  I'm a Seller
                </Button>
              </Link>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm font-display font-semibold text-accent">1 FishDollar = $1</p>
              <p className="text-[10px] text-muted-foreground/60 italic">
                FishDollarz are virtual items with no real-world value outside the FishKillerz platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Feed */}
      <LiveFeed />

      {/* Main Content */}
      <div className="container py-8 space-y-8 pb-24 md:pb-8 min-h-[400px]">
        {/* Stats */}
        <StatsBar />

        {/* OCR Scan Monitor — Admin only */}
        <OcrDashboardWidget />

        {/* Featured Platforms */}
        <div>
          <h2 className="font-display text-lg font-bold text-foreground mb-3">Featured Platforms</h2>
          <div className="flex flex-wrap gap-2">
            {featuredPlatforms.map((p) => (
              <PlatformBadge key={p} platform={p} />
            ))}
          </div>
        </div>

        {/* Active Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-foreground">Active Sessions</h2>
            <Link to="/sessions" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {loading ? (
            <p className="text-muted-foreground">Loading sessions…</p>
          ) : sessions.length === 0 ? (
            <div className="gradient-card rounded-lg p-8 text-center">
              <p className="text-muted-foreground">No active sessions yet. Be the first to create one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
