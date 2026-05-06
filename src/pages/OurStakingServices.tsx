import Layout from "@/components/Layout";
import { useSEO } from "@/hooks/useSEO";
import { Crosshair, Crown, Zap, ShieldCheck, TrendingUp, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function OurStakingServices() {
  useSEO({
    title: "Our Staking Services: Buy & Sell Poker Stakes | FishKillerz",
    description:
      "Browse FishKillerz staking services: instant stake purchases, VIP sessions with reduced rake, seller activation, and concierge support — all backed by escrowed FishDollarz.",
    canonical: "/our-staking-services",
  });

  const tiers = [
    {
      icon: Crosshair,
      name: "Standard Staking",
      price: "Free to join",
      tagline: "Buy stakes in any public session",
      features: [
        "Instant stake purchases with FishDollarz",
        "Pro-rata profit sharing",
        "5% rake on winnings only",
        "Full seller transparency & ROI history",
      ],
      cta: "Browse Sessions",
      to: "/sessions",
      accent: "primary",
    },
    {
      icon: Crown,
      name: "VIP Staking",
      price: "Invite Only",
      tagline: "Exclusive sessions, lower rake",
      features: [
        "Reduced 2% rake on winnings",
        "Access to vetted high-stakes sellers",
        "Private VIP-only session feed",
        "Priority support & fast-track payouts",
      ],
      cta: "View VIP Sessions",
      to: "/vip-sessions",
      accent: "accent",
    },
    {
      icon: Zap,
      name: "Become a Seller",
      price: "1-click activation",
      tagline: "List your own staking sessions",
      features: [
        "Sell up to 75% of your buy-in",
        "Set your own markup",
        "Build a public reputation & ROI track",
        "Get paid out within 60 minutes",
      ],
      cta: "Start Selling",
      to: "/create",
      accent: "primary",
    },
  ];

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 max-w-5xl mx-auto space-y-10">
        <header className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-primary">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs uppercase tracking-wider font-semibold">Our Services</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Crypto-Backed Poker Staking, Built for Speed
          </h1>
          <p className="text-muted-foreground">
            FishKillerz offers three tiers of staking service — all powered by escrowed FishDollarz,
            instant settlement, and verified payout proof.
          </p>
        </header>

        <section className="grid md:grid-cols-3 gap-4">
          {tiers.map((t) => (
            <div
              key={t.name}
              className="gradient-card rounded-lg p-6 flex flex-col space-y-4 border border-border"
            >
              <div className="flex items-center gap-2">
                <t.icon className={`h-5 w-5 text-${t.accent}`} />
                <h2 className="font-display text-lg font-bold text-foreground">{t.name}</h2>
              </div>
              <div>
                <p className={`font-display text-xl font-bold text-${t.accent}`}>{t.price}</p>
                <p className="text-sm text-muted-foreground">{t.tagline}</p>
              </div>
              <ul className="space-y-2 text-sm text-foreground/90 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={t.to}
                className="block text-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </section>

        <section className="gradient-card rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold text-foreground">Why Choose FishKillerz</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-foreground/90">
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Escrowed Funds</p>
              <p className="text-muted-foreground">
                All stakes are held by the platform until session resolution — sellers can never
                disappear with backer money mid-session.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">OCR-Verified Proofs</p>
              <p className="text-muted-foreground">
                Deposit and payout screenshots are auto-validated for tamper-resistance via
                AI-powered OCR.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">25% Skin-in-the-Game</p>
              <p className="text-muted-foreground">
                Every seller carries at least 25% of their own buy-in — your interests are aligned
                from the first hand.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">60-Minute Payouts</p>
              <p className="text-muted-foreground">
                Sellers must initiate payout within an hour of session end. Funds hit your wallet
                fast.
              </p>
            </div>
          </div>
        </section>

        <section className="text-center space-y-3 pt-4">
          <h2 className="font-display text-xl font-bold text-foreground">New to staking?</h2>
          <p className="text-sm text-muted-foreground">
            Read our complete{" "}
            <Link to="/crypto-staking-guide" className="text-primary hover:underline">
              Crypto Staking Guide
            </Link>{" "}
            to learn how stakes, rake, and payouts work end-to-end.
          </p>
        </section>
      </div>
    </Layout>
  );
}
