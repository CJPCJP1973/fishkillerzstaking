/**
 * Reusable JSON-LD structured data builders for SEO.
 * Pass the results to `useSEO({ jsonLd })`.
 */

export const SITE_URL = "https://fishkillerz.lovable.app";

export const organizationSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FishKillerz",
  alternateName: "FishKillerz Staking",
  url: SITE_URL,
  logo: `${SITE_URL}/pwa-512x512.png`,
  description:
    "FishKillerz is a trust-by-evidence staking marketplace where backers buy and sell shares in live fish table and slot sessions using the FishDollarz ledger.",
  sameAs: [] as string[],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${SITE_URL}/connect`,
      availableLanguage: ["en"],
    },
  ],
};

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbSchema(
  crumbs: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}

/* ── Page-scoped FAQ content ───────────────────────────── */

export const homeFaqs: FaqItem[] = [
  {
    question: "What is FishKillerz staking?",
    answer:
      "FishKillerz is a staking marketplace where shooters sell shares of a live fish table or slot session and backers buy those shares. Profits are split pro-rata after a small rake on winnings only.",
  },
  {
    question: "What are FishDollarz?",
    answer:
      "FishDollarz are the internal ledger credits used on FishKillerz, where 1 FD equals 1 USD in accounting value. They are used to fund stakes and receive payouts, and are settled manually by an admin.",
  },
  {
    question: "How much of a session can a shooter sell?",
    answer:
      "A shooter can sell a maximum of 75% of a session. They must keep at least 25% skin in the game so their incentives stay aligned with their backers.",
  },
  {
    question: "What fees does FishKillerz charge?",
    answer:
      "There are no listing fees. A 5% rake is taken on backer winnings, reduced to 2% for VIP sessions. Losing sessions are never raked.",
  },
];

export const sessionsFaqs: FaqItem[] = [
  {
    question: "How do I buy a stake in a fish table session?",
    answer:
      "Open an active session, choose the amount of FishDollarz you want to stake, and confirm. Your share of the session is locked in instantly and shown on the session's stake chart.",
  },
  {
    question: "Which fish table platforms are supported?",
    answer:
      "Sessions run on popular skill-based platforms including Golden Dragon, Diamond Dragon, Vblink and Riversweeps, among others listed on each session card.",
  },
  {
    question: "When do I get paid after a session ends?",
    answer:
      "Shooters must submit payout proof within 60 minutes of a session ending. Once an admin verifies the evidence, winnings are credited to each backer's FishDollarz balance pro-rata.",
  },
  {
    question: "What happens if a session loses?",
    answer:
      "Losses are shared pro-rata across all backers according to their share of the buy-in. No rake is charged on a losing session.",
  },
];

export const slotPoolFaqs: FaqItem[] = [
  {
    question: "What is a slot pool?",
    answer:
      "A slot pool splits a single slot bankroll into seats. Multiple backers each buy a seat, the shooter plays the session, and any profit is split pro-rata across the seats.",
  },
  {
    question: "How do I join a slot pool?",
    answer:
      "Browse open pools, pick one with available seats, and buy a seat with FishDollarz. Your seat is confirmed once the admin verifies the pool is funded.",
  },
  {
    question: "How are slot pool winnings calculated?",
    answer:
      "Winnings are calculated pro-rata by seat share, with the standard 5% rake (2% for VIP) applied to profit only. A full payout ledger is reviewed by an admin before release.",
  },
];

export const servicesFaqs: FaqItem[] = [
  {
    question: "Is it free to list a session on FishKillerz?",
    answer:
      "Yes. Listing a session or slot pool is free. FishKillerz only earns a rake on backer winnings.",
  },
  {
    question: "How do I become a seller (shooter)?",
    answer:
      "Complete identity verification in your profile, agree to the seller terms including the 60-minute payout window, and your seller access is enabled after admin approval.",
  },
  {
    question: "What makes a session VIP?",
    answer:
      "VIP sessions are invite-only sessions from proven sellers. They carry a reduced 2% rake on backer winnings instead of the standard 5%.",
  },
];
