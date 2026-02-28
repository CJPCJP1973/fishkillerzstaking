import { Crosshair, ArrowRight, Waves } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import LiveFeed from "@/components/LiveFeed";
import StatsBar from "@/components/StatsBar";
import SessionCard, { SessionData } from "@/components/SessionCard";
import PlatformBadge from "@/components/PlatformBadge";
import heroBg from "@/assets/hero-bg.png";

const mockSessions: SessionData[] = [
  {
    id: "1",
    shooterName: "AceHunter99",
    platform: "Golden Dragon",
    agentRoom: "VIP Room #7",
    totalBuyIn: 1000,
    stakeAvailable: 750,
    stakeSold: 450,
    endTime: "Tonight 11PM",
    status: "live",
    streamUrl: "https://kick.com/acehunter",
  },
  {
    id: "2",
    shooterName: "DeepSeaKing",
    platform: "Fire Phoenix",
    agentRoom: "Agent Mike",
    totalBuyIn: 2000,
    stakeAvailable: 1500,
    stakeSold: 600,
    endTime: "Tomorrow 2AM",
    status: "funding",
  },
  {
    id: "3",
    shooterName: "SharkBite",
    platform: "Vblink",
    agentRoom: "Lobby A",
    totalBuyIn: 500,
    stakeAvailable: 375,
    stakeSold: 375,
    endTime: "Tonight 9PM",
    status: "completed",
  },
  {
    id: "4",
    shooterName: "ReefRunner",
    platform: "Diamond Dragon",
    agentRoom: "Room 12",
    totalBuyIn: 1500,
    stakeAvailable: 1125,
    stakeSold: 200,
    endTime: "Tonight 10PM",
    status: "pending",
  },
];

const featuredPlatforms = ["Golden Dragon", "Diamond Dragon", "Fire Phoenix", "Vblink", "Riversweeps", "Magic City"];

export default function Index() {
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
              Back elite shooters on fish table sessions. Buy stakes, track live wins, and collect your cut.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/sessions">
                <Button className="gradient-primary text-primary-foreground font-display font-bold px-6 py-5 text-base">
                  Browse Sessions <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/create">
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 font-display font-bold px-6 py-5 text-base">
                  I'm a Shooter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Feed */}
      <LiveFeed />

      {/* Main Content */}
      <div className="container py-8 space-y-8 pb-24 md:pb-8">
        {/* Stats */}
        <StatsBar />

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
