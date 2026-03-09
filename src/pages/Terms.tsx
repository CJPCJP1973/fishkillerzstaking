import Layout from "@/components/Layout";

export default function Terms() {
  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 max-w-3xl mx-auto space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Terms of Service</h1>
        <div className="gradient-card rounded-lg p-6">
          <p className="text-muted-foreground text-sm">Terms of Service <FishKillerz
                                                                      Master Terms of Service
​Last Updated: March 9, 2026
​1. Definitions & Scope
​"Platform": Refers to FishKillerz, its website (fishkillerz.com), and the associated PWA.
​"FishDollarz": Refers to the internal digital points/credits used exclusively for accounting and incentives within the Platform.
​"Services": Refers to the staking marketplace, ledger services, and user-hierarchy infrastructure provided by the Platform.
​Nature of Platform: FishKillerz is a marketplace and ledger service for Users. We do not provide gaming software (e.g., Golden Dragon, Vblink) and are not responsible for the stability of third-party gaming platforms.
​2. User Eligibility & Identity
​Age Requirement: By registering, you represent that you are at least 18 years of age (or the age of majority in your jurisdiction).
​Verification: The Platform reserves the right to request government-issued identification at any time (via Stripe Identity or manual review). Failure to provide documentation results in immediate suspension and forfeiture of FishDollarz.
​Terminology: All participants are designated as "Users." While users may act as "Sellers" or "Backers," the unified "User" designation applies to all account functions.
​3. The Reputation Economy & Tiered Logic
​User permissions and fees are strictly dictated by the following system architecture:
​Tier 1 (Minnow): 0-4 sessions; Max 25% stake share sold; 8% platform rake.
​Tier 2 (Shark): 5-9 sessions; Max 50% stake share sold; 6% platform rake.
​Tier 3 (Killer Whale): 10+ sessions; Max 75% stake share sold; 4% platform rake.
​Tier 4 (Apex Predator): Invite-only; Max 75% stake share; 2% platform rake; Exclusive VIP listing access.
​4. Staking Rules & Integrity
​The 75% "Skin in the Game" Rule: All Sellers must retain a minimum of 25% personal stake in every session. Bypassing this via secondary accounts results in a permanent ban.
​Evidence-Based Settlement: Sellers must upload "Bookend" screenshots (Deposit and Payout confirmations) to the Session Journal.
​Missing Evidence Penalty: If a required recording/screenshot is missing, the Seller is responsible for the Full Stake Amount plus a 10% penalty fee distributed to backers. Failure to settle results in a public "Scammer" flag on partner groups.
​No Guarantee of Profit: Staking is an investment in a skill-based game; backers acknowledge they can lose 100% of their investment.
​5. FishDollarz: Deposits, Redemptions, & Nature
​Closed-Loop System: FishDollarz are virtual items intended solely for use within FishKillerz. They have no real-world value, are not legal tender, and are not an investment or security.
​Deposits: Users purchase FishDollarz by transferring fiat or approved cryptocurrency to designated accounts.
​Redemptions: Users may request to redeem FishDollarz for real-world currency at the Platform’s discretion, subject to AML (Anti-Money Laundering) verification.
​Finality: Once Admin approves a screenshot and releases funds from escrow, the transaction is final and non-reversible.
​6. Limitation of Liability & Security
​"As Is" Provision: FishKillerz is not liable for indirect or consequential damages, including loss of FishDollarz due to technical errors or account compromises.
​P2P Risk: FishKillerz facilitates agreements but is not responsible for the direct movement of funds in P2P transactions. Users accept all risks of counterparty behavior.
​Account Responsibility: You are solely responsible for maintaining the security of your credentials and your third-party gaming app accounts (FireKirin, etc.).
​7. Right to Terminate
​The Platform reserves the right to suspend accounts and confiscate FishDollarz for suspected fraud, illegal activity, or violation of these terms>
        </div>
      </div>
    </Layout>
  );
}
