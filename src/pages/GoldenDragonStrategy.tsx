import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { Target, Coins, Shield, TrendingUp } from "lucide-react";

export default function GoldenDragonStrategy() {
  useSEO({
    title: "Golden Dragon Fish Game Strategy — How to Win Online | FishKillerz",
    description:
      "A complete strategy guide for the Golden Dragon fish game online: best fish to target, ammo bet sizing, room selection, and how backers should evaluate shooter risk.",
    canonical: "/guides/golden-dragon-strategy",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Golden Dragon Fish Game Strategy — How to Win Online",
      description:
        "How to win at Golden Dragon fish tables: fish selection, bet sizing, room strategy, and staking risk profile.",
      author: { "@type": "Organization", name: "FishKillerz" },
      publisher: { "@type": "Organization", name: "FishKillerz" },
      mainEntityOfPage: "https://fishkillerz.lovable.app/guides/golden-dragon-strategy",
    },
  });

  return (
    <Layout>
      <main className="container max-w-3xl mx-auto px-4 py-10 space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-wider text-primary">Strategy Guide</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            Golden Dragon Fish Game Strategy: How to Win Online
          </h1>
          <p className="text-muted-foreground text-lg">
            A practical guide to playing (and staking) the Golden Dragon fish game online — for
            both shooters chasing big multipliers and backers deciding which sessions are worth
            funding.
          </p>
        </header>

        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Target className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Pick your fish, not just your shots</h2>
          </div>
          <p className="text-sm leading-relaxed">
            Golden Dragon pays by multiplier, so the fish you target matters more than raw shot
            count. Low-tier fish (crab, small clownfish) drain ammo fast and pay 2–5×. Focus
            fire on mid-tier targets (lionfish, pufferfish, 20–50×) and only chase bosses
            (Golden Toad, Dragon, Kraken) when a room is already primed by other shooters.
          </p>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Coins className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Bet sizing: match ammo to the room</h2>
          </div>
          <p className="text-sm leading-relaxed">
            The single fastest way to burn a bankroll is spraying $1 ammo at a $0.10 room, or
            firing $0.10 rounds at a boss that needs $2 shots to break. Read the room's active
            bet range in the corner, start at the low end, and step up only after you land a
            10×+ multiplier. Golden Dragon's payout curve is exponential — one clean boss kill
            usually beats twenty rushed shots.
          </p>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Room selection & timing</h2>
          </div>
          <p className="text-sm leading-relaxed">
            Rooms with 3–4 active shooters and a boss visible are the highest-EV entry point:
            other players soften the boss and you collect the multiplier when it drops. Empty
            rooms look tempting but bosses spawn on player-damage timers — you'll pay full
            freight to break them alone. Late nights (11pm–3am ET) tend to run softer rooms.
          </p>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-5 w-5" />
            <h2 className="font-semibold text-lg">For backers: reading a Golden Dragon session</h2>
          </div>
          <p className="text-sm leading-relaxed">
            When you're staking a shooter on FishKillerz, Golden Dragon sessions read
            differently than Vblink or Riversweeps. Look for:
          </p>
          <ul className="text-sm space-y-1 list-disc pl-5">
            <li>A shooter with a documented multi-session history on Golden Dragon specifically</li>
            <li>A realistic buy-in — high-variance games need runway, so under-funded sessions crash early</li>
            <li>A stated target room (10¢, 50¢, $1+) that matches the buy-in</li>
            <li>Screenshots that include the room's bet range, not just the balance</li>
          </ul>
        </Card>

        <Card className="p-5 space-y-3 border-primary/40">
          <h2 className="font-semibold text-lg">Ready to play — or back — a Golden Dragon session?</h2>
          <p className="text-sm text-muted-foreground">
            Browse live shooters on Golden Dragon or list your own session for the community
            to stake.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              to="/sessions"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Browse live sessions
            </Link>
            <Link
              to="/create"
              className="inline-flex items-center justify-center rounded-md border border-primary/50 px-4 py-2 text-sm font-medium hover:bg-primary/10"
            >
              List a session
            </Link>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground">
          FishDollarz are internal platform credits (1 FD = $1 USD) used for staking on
          FishKillerz. Gameplay outcomes on Golden Dragon are skill- and variance-driven; past
          shooter performance does not guarantee future results.
        </p>
      </main>
    </Layout>
  );
}
