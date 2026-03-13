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
            <li className="flex gap-2"><span>👑</span><span><strong>VIP Invite Only (VIP):</strong> Invite-only · Max 75% stake · Exclusive VIP sessions</span></li>
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
                Go to your Profile page and click "Become a Seller." Your request will be reviewed by an admin. Once approved, you can create sessions and sell stakes to backers.
                FishKillerz Community Guidelines & Platform Rules
​Welcome to FishKillerz. To ensure a fair, secure, and competitive environment, all users must adhere to these community standards. By participating in any session, you agree to these rules.
​1. The Golden Rule: Integrity First
• ​"Skin in the Game": Every Seller must retain at least 25% of their own stake in every session. Any attempt to bypass this via secondary accounts will result in an immediate and permanent ban.
• ​The Evidence Protocol: All sessions require a Proof of Deposit (PoD) and Proof of Payout (PoP). If you cannot provide a clear, original screenshot of your deposit and final withdrawal, you are responsible for the full stake amount plus a 10% penalty fee.
• ​Zero Tolerance for Scams: Any confirmed attempt to defraud backers, manipulate screenshots, or misrepresent gaming agent activity will result in a permanent ban and a public 'Scammer' flag on our partner network.
​2. Respectful Conduct
• ​The Session Journal is for Business: Please keep all communication in the Session Journal strictly related to the staking session.
• ​Professionalism: Harassment, threats, or aggressive behavior toward other Users or the Admin will not be tolerated. This is a business marketplace; treat your partners with professional courtesy.
• ​No Solicitation: Do not use the platform to promote outside services, alternative platforms, or direct-message users for off-platform transactions.
​3. Admin Authority & Disputes
• ​Finality of Decisions: The Admin has final authority in all disputes. Once a settlement is verified and released from escrow, the transaction is closed and final.
• ​Escrow Security: All FishDollarz in escrow are held to ensure payout accuracy. Any attempt to pressure the Admin to release funds prematurely will be ignored.
• ​Platform Neutrality: FishKillerz is a marketplace, not a gaming provider. We are not responsible for the server stability of the gaming agents (Golden Dragon, Vblink, etc.). If an agent platform goes down, our dispute resolution process will prioritize fairness based on the evidence provided.
​4. Account Security
• ​Your Responsibility: You are 100% responsible for your account security. Never share your login credentials. We will never ask for your password.
• ​One Account Per Person: Multiple account creation to farm bonuses or bypass tier limits is strictly prohibited and will result in the forfeiture of all balances.
​5. Financial Hygiene
• ​No Real-World Value: FishDollarz are virtual points for use within this system only. They are not an investment, and they carry no cash value outside of our official redemption process.
• ​AML Compliance: All redemption requests are subject to review. We reserve the right to verify account history to prevent money laundering and fraud.
​🛡️ Violation Consequences
• ​Warning: For minor infractions (misunderstandings, missed screenshots without malicious intent).
• ​Shadow Ban: For suspicious behavior (hidden from public view, no communication capability).
• ​Hard Ban: For intentional fraud, underage usage, or malicious behavior.
​If you see something, say something. Flag suspicious sessions via the 'Report' button in the Session Journal.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3" className="border-border/50">
              <AccordionTrigger className="text-sm text-foreground hover:no-underline">How do payouts work?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                After a session ends, the seller uploads an end-balance screenshot. Backers receive their pro-rata share of winnings minus the platform rake. FishDollarz payouts are instant; P2P payouts must be sent within 60 minutes and the rake sent to $fishkillerzstaking on CashApp.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4" className="border-border/50">
              <AccordionTrigger className="text-sm text-foreground hover:no-underline">What happens if a session loses?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                If the end balance is lower than the buy-in, all backers share in the loss proportionally. No rake is charged on losing sessions. Your stake amount is the maximum you can lose.
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
