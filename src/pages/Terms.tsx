import Layout from "@/components/Layout";

export default function Terms() {
  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 max-w-3xl mx-auto space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Terms of Service</h1>
        <div className="gradient-card rounded-lg p-6 space-y-4 text-muted-foreground text-sm">
          <h2 className="text-lg font-bold text-foreground">FishKillerz Master Terms of Service</h2>
          <p className="italic">Last Updated: March 9, 2026</p>

          <h3 className="text-base font-semibold text-foreground">1. Definitions &amp; Scope</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>&quot;Platform&quot;:</strong> Refers to FishKillerz, its website (fishkillerz.com), and the associated PWA.</li>
            <li><strong>&quot;FishDollarz&quot;:</strong> Refers to the internal digital points/credits used exclusively for accounting and incentives within the Platform.</li>
            <li><strong>&quot;Services&quot;:</strong> Refers to the staking marketplace, ledger services, and user-hierarchy infrastructure provided by the Platform.</li>
            <li><strong>Nature of Platform:</strong> FishKillerz is a marketplace and ledger service for Users. We do not provide gaming software (e.g., Golden Dragon, Vblink) and are not responsible for the stability of third-party gaming platforms.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground">2. User Eligibility &amp; Identity</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Age Requirement:</strong> By registering, you represent that you are at least 18 years of age (or the age of majority in your jurisdiction).</li>
            <li><strong>Verification:</strong> The Platform reserves the right to request government-issued identification at any time (via Stripe Identity or manual review). Failure to provide documentation results in immediate suspension and forfeiture of FishDollarz.</li>
            <li><strong>Terminology:</strong> All participants are designated as &quot;Users.&quot; While users may act as &quot;Sellers&quot; or &quot;Backers,&quot; the unified &quot;User&quot; designation applies to all account functions.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground">3. The Reputation Economy &amp; Tiered Logic</h3>
          <p>User permissions and fees are strictly dictated by the following system architecture:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Tier 1 (Minnow):</strong> 0-4 sessions; Max 25% stake share sold; 8% platform rake.</li>
            <li><strong>Tier 2 (Shark):</strong> 5-9 sessions; Max 50% stake share sold; 6% platform rake.</li>
            <li><strong>Tier 3 (Killer Whale):</strong> 10+ sessions; Max 75% stake share sold; 4% platform rake.</li>
            <li><strong>Tier 4 (Apex Predator):</strong> Invite-only; Max 75% stake share; 2% platform rake; Exclusive VIP listing access.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground">4. Staking Rules &amp; Integrity</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>The 75% &quot;Skin in the Game&quot; Rule:</strong> All Sellers must retain a minimum of 25% personal stake in every session. Bypassing this via secondary accounts results in a permanent ban.</li>
            <li><strong>Evidence-Based Settlement:</strong> Sellers must upload &quot;Bookend&quot; screenshots (Deposit and Payout confirmations) to the Session Journal.</li>
            <li><strong>Missing Evidence Penalty:</strong> If a required recording/screenshot is missing, the Seller is responsible for the Full Stake Amount plus a 10% penalty fee distributed to backers. Failure to settle results in a public &quot;Scammer&quot; flag on partner groups.</li>
            <li><strong>No Guarantee of Profit:</strong> Staking is an investment in a skill-based game; backers acknowledge they can lose 100% of their investment.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground">5. FishDollarz: Deposits, Redemptions, &amp; Nature</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Closed-Loop System:</strong> FishDollarz are virtual items intended solely for use within FishKillerz. They have no real-world value, are not legal tender, and are not an investment or security.</li>
            <li><strong>Deposits:</strong> Users purchase FishDollarz by transferring fiat or approved cryptocurrency to designated accounts.</li>
            <li><strong>Redemptions:</strong> Users may request to redeem FishDollarz for real-world currency at the Platform&apos;s discretion, subject to AML (Anti-Money Laundering) verification.</li>
            <li><strong>Finality:</strong> Once Admin approves a screenshot and releases funds from escrow, the transaction is final and non-reversible.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground">6. Limitation of Liability &amp; Security</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>&quot;As Is&quot; Provision:</strong> FishKillerz is not liable for indirect or consequential damages, including loss of FishDollarz due to technical errors or account compromises.</li>
            <li><strong>P2P Risk:</strong> FishKillerz facilitates agreements but is not responsible for the direct movement of funds in P2P transactions. Users accept all risks of counterparty behavior.</li>
            <li><strong>Account Responsibility:</strong> You are solely responsible for maintaining the security of your credentials and your third-party gaming app accounts (FireKirin, etc.).</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground">7. Right to Terminate</h3>
          <p>The Platform reserves the right to suspend accounts and confiscate FishDollarz for suspected fraud, illegal activity, or violation of these terms.</p>
        </div>
      </div>
    </Layout>
  );
}
