import Layout from "@/components/Layout";
import { useSEO } from "@/hooks/useSEO";
import { CheckCircle2, XCircle, Zap, Crown, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function CompareStakeKings() {
  useSEO({
    title: "FishKillerz vs StakeKings: Lower Rake & Instant Settlement",
    description:
      "Compare FishKillerz and StakeKings on rake, payout speed, and trust. See why FishDollarz instant settlement and 2–5% rake beats traditional staking platforms.",
    canonical: "/compare/stakekings",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How is FishKillerz's rake different from StakeKings?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "FishKillerz charges 5% rake on winnings (2% for VIP), with no listing fees. Stakes settle instantly via the FishDollarz ledger.",
            },
          },
          {
            "@type": "Question",
            name: "Is FishKillerz faster than StakeKings?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes — FishDollarz settles stakes instantly inside the platform, and payouts open within a 60-minute window once sessions complete.",
            },
          },
          {
            "@type": "Question",
            name: "Which platform supports fish table games?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "FishKillerz is the only marketplace built specifically for fish table staking on Golden Dragon, Diamond Dragon, Vblink, Riversweeps, Fire Phoenix, and Magic City.",
            },
          },
        ],
      },
    ],
  });

  const rows: { label: string; us: string; them: string; usGood?: boolean }[] = [
    { label: "Rake on winnings", us: "5% (2% VIP)", them: "Higher / variable", usGood: true },
    { label: "Listing fees", us: "$0", them: "Varies", usGood: true },
    { label: "Settlement", us: "Instant FishDollarz ledger", them: "Manual P2P", usGood: true },
    { label: "Payout window", us: "60 minutes", them: "Manual / slower", usGood: true },
    { label: "Fish table games", us: "Native support", them: "Not supported", usGood: true },
    { label: "Seller skin-in-game", us: "25% minimum enforced", them: "Optional", usGood: true },
    { label: "VIP tier", us: "Invite-only, 2% rake", them: "Not available", usGood: true },
  ];

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-12 max-w-4xl">
        <header className="mb-8">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Comparison</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight mb-3">
            FishKillerz <span className="text-muted-foreground">vs</span>{" "}
            <span className="text-accent">StakeKings</span>
          </h1>
          <p className="text-foreground/80 text-base md:text-lg max-w-2xl">
            Looking for a StakeKings alternative? FishKillerz delivers lower rake, instant
            FishDollarz settlement, and native support for fish table games — the games StakeKings
            doesn't cover.
          </p>
        </header>

        <section aria-labelledby="at-a-glance" className="gradient-card rounded-lg p-5 mb-8">
          <h2 id="at-a-glance" className="font-display text-xl font-bold text-foreground mb-4">
            At a glance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-4 font-display text-muted-foreground">Feature</th>
                  <th className="py-2 pr-4 font-display text-primary">FishKillerz</th>
                  <th className="py-2 font-display text-muted-foreground">StakeKings</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b border-border/40">
                    <td className="py-3 pr-4 text-foreground/90">{r.label}</td>
                    <td className="py-3 pr-4 text-foreground font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {r.usGood ? (
                          <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                        )}
                        {r.us}
                      </span>
                    </td>
                    <td className="py-3 text-foreground/70">{r.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: Zap,
              title: "Instant settlement",
              body: "FishDollarz (1 FD = $1) move between backer and shooter the moment a stake is bought — no waiting on CashApp or wire transfers.",
            },
            {
              icon: Crown,
              title: "Lower rake for VIPs",
              body: "Verified high-volume backers pay just 2% rake on winnings, vs the 5% standard tier. StakeKings offers no equivalent.",
            },
            {
              icon: ShieldCheck,
              title: "Skin-in-the-game enforced",
              body: "Sellers must keep at least 25% of every session — aligning incentives so your backer dollars aren't risked alone.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="gradient-card rounded-lg p-4">
              <Icon className="h-5 w-5 text-primary mb-2" aria-hidden="true" />
              <h3 className="font-display font-bold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-foreground/80">{body}</p>
            </div>
          ))}
        </section>

        <section className="gradient-card rounded-lg p-6 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Ready to switch?
          </h2>
          <p className="text-foreground/80 mb-4 max-w-xl mx-auto">
            Browse active fish table sessions and back a verified shooter in under a minute.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/sessions"
              className="gradient-primary text-primary-foreground font-display font-bold px-5 py-2.5 rounded-md"
            >
              Browse Sessions
            </Link>
            <Link
              to="/our-staking-services"
              className="border border-accent/40 text-accent hover:bg-accent/10 font-display font-bold px-5 py-2.5 rounded-md"
            >
              See All Services
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
