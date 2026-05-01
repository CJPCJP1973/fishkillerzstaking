import Layout from "@/components/Layout";
import { ShieldCheck, DollarSign, AlertTriangle, Crosshair, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSEO } from "@/hooks/useSEO";

export default function SiteRules() {
  useSEO({
    title: "Site Rules | FishKillerz",
    description: "FishKillerz platform rules: rake structure, staking guidelines, evidence requirements, dispute process, and VIP perks.",
    canonical: "/site-rules",
  });
  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">🎯 Site Rules</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: March 2026</p>
        </div>

        {/* Platform Rake */}
        <section className="gradient-card rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Platform Rake</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            FishKillerz charges a small rake on <span className="text-primary font-semibold">backer winnings only</span>. There are no listing fees, sign-up fees, or hidden charges.
          </p>
          <div className="gradient-card rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Standard User Rake</span>
              <span className="text-primary font-display font-bold">5%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VIP Rake (Invite Only)</span>
              <span className="text-accent font-display font-bold">3%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Session Listing Fee</span>
              <span className="text-foreground font-display font-bold">FREE</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The rake is applied only when a session is profitable. If a session loses, no rake is taken.
          </p>
        </section>

        {/* Selling & Buying */}
        <section className="gradient-card rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-accent" />
            <h2 className="font-display text-lg font-bold text-foreground">Selling & Buying</h2>
          </div>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex gap-2"><span>✅</span><span>All users can sign up and buy stakes for <strong>free</strong>.</span></li>
            <li className="flex gap-2"><span>✅</span><span>Becoming a seller is a <strong>free one-click activation</strong> — no fees or approval needed.</span></li>
            <li className="flex gap-2"><span>✅</span><span>Sellers can sell up to <strong>75%</strong> of their buy-in (must keep 25% skin-in-the-game).</span></li>
            <li className="flex gap-2"><span>👑</span><span><strong>VIP (Invite Only):</strong> Reduced 3% rake · Exclusive VIP session access.</span></li>
          </ul>
        </section>

        {/* Skin-in-the-Game */}
        <section className="gradient-card rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Skin-in-the-Game Rule</h2>
          </div>
          <p className="text-sm text-foreground">
            Sellers must maintain personal risk in every session. The maximum stake percentage sold is capped at <strong>75%</strong>. The remaining 25% must be retained by the seller.
          </p>
        </section>

        {/* Payout Rules */}
        <section className="gradient-card rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-accent" />
            <h2 className="font-display text-lg font-bold text-foreground">Payout Rules</h2>
          </div>
          <ul className="space-y-1.5 text-sm text-foreground list-disc list-inside">
            <li>Sellers must pay backers their pro-rata share within <strong>60 minutes</strong> of any agent cashout.</li>
            <li>FishDollarz payouts are processed automatically — funds are credited instantly with no fees.</li>
            <li>P2P payouts must be sent directly to the backer within the 60-minute window.</li>
          </ul>
        </section>

        {/* Fraud */}
        <section className="gradient-card rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="font-display text-lg font-bold text-foreground">Fraud Prevention</h2>
          </div>
          <ul className="space-y-1.5 text-sm text-foreground list-disc list-inside">
            <li>Screenshot verification is required for session start and end balances.</li>
            <li>Duplicate or manipulated screenshots are automatically flagged.</li>
            <li>Accumulating <strong>3 fraud flags</strong> results in an automatic account ban.</li>
            <li>Banned users lose seller privileges and all active sessions are marked as disputed.</li>
          </ul>
        </section>

        {/* Geo Restrictions */}
        <section className="gradient-card rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-display text-lg font-bold text-foreground">Geographic Restrictions</h2>
          </div>
          <p className="text-sm text-foreground">
            Access is restricted in: <strong>Washington, Utah, Idaho, Louisiana, and New Jersey</strong>. Users from these states will be blocked from the platform.
          </p>
        </section>

        {/* FAQ */}
        <section className="gradient-card rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">FAQ</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1" className="border-border/50">
              <AccordionTrigger className="text-sm text-foreground hover:no-underline">What are FishDollarz?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                FishDollarz are virtual credits used on the FishKillerz platform. 1 FishDollar = $1. They can be used to buy stakes in sessions and receive payouts. FishDollarz have no real-world value outside of FishKillerz.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2" className="border-border/50">
              <AccordionTrigger className="text-sm text-foreground hover:no-underline">How do I become a seller?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Go to your Profile page and click "Become a Seller." It's completely free — one click and you're activated instantly. Once activated, you can create sessions and sell stakes to backers.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3" className="border-border/50">
              <AccordionTrigger className="text-sm text-foreground hover:no-underline">How do payouts work?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                After a session ends, the seller uploads an end-balance screenshot. Backers receive their full pro-rata share of winnings — no percentage fees. FishDollarz payouts are instant; P2P payouts must be sent within 60 minutes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4" className="border-border/50">
              <AccordionTrigger className="text-sm text-foreground hover:no-underline">What happens if a session loses?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                If the end balance is lower than the buy-in, all backers share in the loss proportionally. Your stake amount is the maximum you can lose.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5" className="border-border/50">
              <AccordionTrigger className="text-sm text-foreground hover:no-underline">How do I report a dispute?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                If you believe a session result is incorrect or a seller hasn't paid out, contact support at <a href="mailto:fishkillerzstaking@gmail.com" className="text-primary hover:underline">fishkillerzstaking@gmail.com</a>. Admins will review screenshots and transaction records to resolve the dispute.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q6" className="border-border/50">
              <AccordionTrigger className="text-sm text-foreground hover:no-underline">Can I get banned?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Yes. Accumulating 3 fraud flags results in an automatic ban. Fraud flags are issued for manipulated screenshots, duplicate images, or failure to pay out backers. Banned users lose all seller privileges.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </Layout>
  );
}
