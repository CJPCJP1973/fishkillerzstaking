import Layout from "@/components/Layout";
import { useSEO } from "@/hooks/useSEO";
import { BookOpen, Bitcoin, ShieldCheck, TrendingUp, AlertTriangle, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";

export default function CryptoStakingGuide() {
  useSEO({
    title: "Crypto Staking Guide: How Poker Staking Works | FishKillerz",
    description:
      "Complete guide to crypto-backed poker staking: how stakes work, skin-in-the-game rules, rake structure, payouts, and how FishDollarz keep settlement instant and transparent.",
    canonical: "/crypto-staking-guide",
  });

  return (
    <Layout>
      <article className="container py-8 pb-24 md:pb-8 max-w-3xl mx-auto space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5" />
            <span className="text-xs uppercase tracking-wider font-semibold">Informational Guide</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            The Complete Crypto Staking Guide
          </h1>
          <p className="text-muted-foreground">
            Everything you need to understand how modern, crypto-backed poker staking works on
            FishKillerz — from buying your first stake to collecting payouts.
          </p>
        </header>

        <section className="gradient-card rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold text-foreground">What is Crypto Staking?</h2>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Crypto staking in poker is a model where backers fund a player&apos;s buy-in in exchange
            for a proportional share of their winnings. Unlike traditional staking — which relies on
            wire transfers, paper agreements, and trust — crypto staking uses on-chain settlement
            and platform escrow to make stakes instant, transparent, and enforceable.
          </p>
          <p className="text-sm text-muted-foreground">
            On FishKillerz, every stake is denominated in <strong className="text-primary">FishDollarz (1 FD = $1 USD)</strong>,
            funded through Bitcoin or supported payment rails, and held in escrow until the session resolves.
          </p>
        </section>

        <section className="gradient-card rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h2 className="font-display text-xl font-bold text-foreground">How a Staking Session Works</h2>
          </div>
          <ol className="space-y-3 text-sm text-foreground/90 list-decimal list-inside">
            <li>
              <strong>Seller creates a session</strong> — listing the game, buy-in, markup, and
              percentage available. Sellers must retain at least 25% skin-in-the-game.
            </li>
            <li>
              <strong>Backers buy stakes</strong> instantly with FishDollarz from their wallet — no
              waiting on confirmations or off-platform agreements.
            </li>
            <li>
              <strong>Session is played</strong> with deposit and payout proof screenshots verified
              by OCR for tamper-resistance.
            </li>
            <li>
              <strong>Profits are distributed pro-rata</strong> within 60 minutes, with a small rake
              applied only on backer winnings.
            </li>
          </ol>
        </section>

        <section className="gradient-card rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold text-foreground">Why Crypto-Backed Staking is Safer</h2>
          </div>
          <ul className="space-y-2 text-sm text-foreground/90">
            <li>✅ <strong>Escrowed funds</strong> — sellers can&apos;t walk with backer money mid-session.</li>
            <li>✅ <strong>Instant settlement</strong> — no chargebacks, no &quot;pending wires&quot;.</li>
            <li>✅ <strong>Pseudonymous but accountable</strong> — public profiles, reputation scores, and admin oversight.</li>
            <li>✅ <strong>Skin-in-the-game enforced</strong> — sellers always have ≥25% of their own money on the line.</li>
          </ul>
        </section>

        <section className="gradient-card rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="font-display text-xl font-bold text-foreground">Risks to Understand</h2>
          </div>
          <p className="text-sm text-foreground/90">
            Staking is variance-driven. Even strong players run bad over hundreds of sessions. Only
            stake what you can afford to lose, diversify across multiple sellers, and review a
            seller&apos;s historical ROI and reliability score before buying.
          </p>
          <p className="text-xs text-muted-foreground">
            FishDollarz are platform credits, not securities. They represent USD-pegged staking
            balance and carry no investment guarantee.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-accent" />
            <h2 className="font-display text-xl font-bold text-foreground">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="gradient-card rounded-lg px-4">
            <AccordionItem value="q1">
              <AccordionTrigger>How fast are payouts?</AccordionTrigger>
              <AccordionContent>
                Sellers must initiate payout within 60 minutes of session end. Backer balances
                update instantly upon admin verification.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>What rake does FishKillerz charge?</AccordionTrigger>
              <AccordionContent>
                5% on backer winnings (2% for VIPs). No listing fees, no rake on losses.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>What happens if a seller goes bust?</AccordionTrigger>
              <AccordionContent>
                Backers share the loss pro-rata. The seller&apos;s mandatory 25% contribution means
                they always lose alongside their backers.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger>Do I need crypto to stake?</AccordionTrigger>
              <AccordionContent>
                No — you can fund your wallet with CashApp, Chime, or Bitcoin. All balances
                internally use FishDollarz (1 FD = $1 USD).
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="gradient-card rounded-lg p-6 text-center space-y-3">
          <h2 className="font-display text-xl font-bold text-foreground">Ready to start staking?</h2>
          <p className="text-sm text-muted-foreground">
            Browse live sessions or learn about our concierge staking services.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link
              to="/our-staking-services"
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Our Staking Services
            </Link>
            <Link
              to="/sessions"
              className="px-4 py-2 rounded-md border border-border text-sm font-semibold hover:bg-secondary transition-colors"
            >
              Browse Live Sessions
            </Link>
          </div>
        </section>
      </article>
    </Layout>
  );
}
