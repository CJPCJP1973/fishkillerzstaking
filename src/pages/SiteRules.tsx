import Layout from "@/components/Layout";
import { ShieldCheck, DollarSign, AlertTriangle, Crosshair, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function SiteRules() {
  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">🎯 Site Rules</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: March 2026</p>
        </div>

        {/* Platform Fees */}
        <section className="gradient-card rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Platform Fees (Rake)</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            A platform fee (rake) is applied to all winning payouts. The rate depends on the seller's tier and payment method.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 text-muted-foreground font-medium">Tier</th>
                  <th className="py-2 pr-4 text-muted-foreground font-medium">P2P Rake</th>
                  <th className="py-2 text-muted-foreground font-medium">FishDollarz Rake</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">🐟 Minnow (Tier 1)</td>
                  <td className="py-2 pr-4 font-semibold">10%</td>
                  <td className="py-2 font-semibold text-primary">8%</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">🦈 Shark (Tier 2)</td>
                  <td className="py-2 pr-4 font-semibold">10%</td>
                  <td className="py-2 font-semibold text-primary">6%</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">🐋 Killer Whale (Tier 3)</td>
                  <td className="py-2 pr-4 font-semibold">10%</td>
                  <td className="py-2 font-semibold text-primary">4%</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">👑 Apex Predator (VIP)</td>
                  <td className="py-2 pr-4 font-semibold">2%</td>
                  <td className="py-2 font-semibold text-primary">2%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            P2P rake is a flat <span className="font-semibold">10%</span> for all non-VIP tiers. FishDollarz payments offer <span className="text-primary font-semibold">reduced tier-based rates</span> (8% → 6% → 4% → 2%).
          </p>
        </section>

        {/* Seller Tiers */}
        <section className="gradient-card rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-accent" />
            <h2 className="font-display text-lg font-bold text-foreground">Seller Tiers</h2>
          </div>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex gap-2"><span>🐟</span><span><strong>Minnow (Tier 1):</strong> 0–4 completed sessions · Max 25% stake</span></li>
            <li className="flex gap-2"><span>🦈</span><span><strong>Shark (Tier 2):</strong> 5–9 completed sessions · Max 50% stake</span></li>
            <li className="flex gap-2"><span>🐋</span><span><strong>Killer Whale (Tier 3):</strong> 10+ completed sessions · Max 75% stake</span></li>
            <li className="flex gap-2"><span>👑</span><span><strong>Apex Predator (VIP):</strong> Invite-only · Max 75% stake · Exclusive VIP sessions</span></li>
          </ul>
          <p className="text-xs text-muted-foreground">Tiers upgrade automatically on session completion. VIP is admin-granted only.</p>
        </section>

        {/* Skin-in-the-Game */}
        <section className="gradient-card rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Skin-in-the-Game Rule</h2>
          </div>
          <p className="text-sm text-foreground">
            Sellers must maintain personal risk in every session. The maximum stake percentage sold is capped by tier (25%–75%). The remainder must be retained by the seller.
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
            <li>P2P payouts require the seller to send the platform rake to <strong>$fishkillerzstaking</strong> on CashApp for manual confirmation.</li>
            <li>FishDollarz payouts are processed automatically — rake is deducted and funds credited instantly.</li>
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
      </div>
    </Layout>
  );
}