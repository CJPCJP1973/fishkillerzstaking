import Layout from "@/components/Layout";
import { useSEO } from "@/hooks/useSEO";

export default function PrivacyPolicy() {
  useSEO({
    title: "Privacy Policy | FishKillerz",
    description: "Learn how FishKillerz collects, uses, and protects your personal data. Our privacy policy covers cookies, analytics, and data retention practices.",
    canonical: "/privacy",
  });

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8 max-w-3xl mx-auto space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Privacy Policy</h1>
        <div className="gradient-card rounded-lg p-6 space-y-4 text-muted-foreground text-sm">
          <h2 className="text-lg font-bold text-foreground">FishKillerz Privacy Policy</h2>
          <p className="italic">Last Updated: April 16, 2026</p>

          <h3 className="text-base font-semibold text-foreground">1. Introduction</h3>
          <p>
            FishKillerz ("we", "us", or "our") respects your privacy and is committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, store, and protect your information when you use our platform.
          </p>

          <h3 className="text-base font-semibold text-foreground">2. Information We Collect</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Information:</strong> Username, email address, display name, and password when you register.</li>
            <li><strong>Profile Information:</strong> Avatar, bio, and verification documents (when submitted for seller verification).</li>
            <li><strong>Transaction Data:</strong> Staking activity, FishDollarz balance, deposits, and redemption requests.</li>
            <li><strong>Payment Information:</strong> Cash App tags, Chime handles, Bitcoin addresses, and Lightning Network addresses for payouts.</li>
            <li><strong>Device &amp; Usage Data:</strong> IP address, browser type, device information, and pages visited via Google Analytics.</li>
            <li><strong>Communication Data:</strong> Emails and messages sent to our support team.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground">3. How We Use Your Information</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide and maintain the FishKillerz platform and its features.</li>
            <li>Process staking transactions and manage FishDollarz balances.</li>
            <li>Verify seller identity and prevent fraud.</li>
            <li>Communicate with you about your account, sessions, and platform updates.</li>
            <li>Analyze platform usage to improve user experience.</li>
            <li>Comply with legal obligations and enforce our Terms of Service.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground">4. Cookies &amp; Tracking Technologies</h3>
          <p>We use cookies and similar technologies to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Maintain your authentication session.</li>
            <li>Remember your preferences and settings.</li>
            <li>Analyze traffic and usage patterns via Google Analytics (with anonymized IP addresses).</li>
            <li>Display consent banners for compliance with privacy regulations.</li>
          </ul>
          <p>
            You can manage cookie preferences through the consent banner or your browser settings. 
            Disabling certain cookies may affect platform functionality.
          </p>

          <h3 className="text-base font-semibold text-foreground">5. Third-Party Services</h3>
          <p>We use the following third-party services that may process your data:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Google Analytics:</strong> For website traffic analysis. See <a href="https://policies.google.com/privacy" className="text-primary hover:underline">Google's Privacy Policy</a>.</li>
            <li><strong>Consent Manager:</strong> For managing cookie consent preferences.</li>
            <li><strong>Payment Processors:</strong> For processing deposits and redemptions (Stripe, Cash App, etc.).</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground">6. Data Security</h3>
          <p>
            We implement industry-standard security measures to protect your data, including encryption at rest and in transit, 
            secure authentication, and regular security audits. However, no method of transmission over the internet is 100% secure.
          </p>

          <h3 className="text-base font-semibold text-foreground">7. Data Retention</h3>
          <p>
            We retain your personal data for as long as your account is active or as needed to provide services. 
            Transaction records are retained for 7 years for legal and tax compliance purposes. 
            You may request account deletion by contacting support; however, certain transaction data may be retained as required by law.
          </p>

          <h3 className="text-base font-semibold text-foreground">8. Your Rights</h3>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your personal data (subject to legal retention requirements).</li>
            <li>Object to certain processing activities.</li>
            <li>Withdraw consent where processing is based on consent.</li>
          </ul>
          <p>To exercise these rights, contact us at fishkillerzstaking@gmail.com.</p>

          <h3 className="text-base font-semibold text-foreground">9. Children's Privacy</h3>
          <p>
            FishKillerz is not intended for individuals under 18 years of age. We do not knowingly collect personal data from children. 
            If we discover that a child under 18 has provided us with personal data, we will delete it immediately.
          </p>

          <h3 className="text-base font-semibold text-foreground">10. Changes to This Policy</h3>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes via email or platform announcements. 
            Continued use of the platform after changes constitutes acceptance of the updated policy.
          </p>

          <h3 className="text-base font-semibold text-foreground">11. Contact Us</h3>
          <p>
            For questions or concerns about this Privacy Policy or our data practices, please contact us at{" "}
            <a href="mailto:fishkillerzstaking@gmail.com" className="text-primary hover:underline">fishkillerzstaking@gmail.com</a>.
          </p>
        </div>
      </div>
    </Layout>
  );
}
