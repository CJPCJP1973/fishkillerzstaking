#!/usr/bin/env node
/**
 * Sitemap generator + canonical/redirect validator.
 *
 * Single source of truth for public routes. Asserts:
 *   1. Every sitemap URL is a real route in src/App.tsx
 *   2. Every sitemap URL has a matching `canonical: "<path>"` in its page via useSEO
 *   3. Every legacy redirect target in App.tsx exists as a real route
 *
 * Run:   node scripts/generate-sitemap.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BASE_URL = "https://fishkillerz.com";
const TODAY = new Date().toISOString().slice(0, 10);

// --- Public, indexable routes (single source of truth) ---
// Private routes (/profile, /settings, /admin, /reset-password, /u/:username) are
// excluded — they require auth or are dynamic and disallowed in robots.txt.
const PUBLIC_ROUTES = [
  { path: "/",                     priority: "1.0", changefreq: "daily"   },
  { path: "/sessions",             priority: "0.9", changefreq: "hourly"  },
  { path: "/vip-sessions",         priority: "0.8", changefreq: "hourly"  },
  { path: "/our-staking-services", priority: "0.8", changefreq: "weekly"  },
  { path: "/crypto-staking-guide", priority: "0.7", changefreq: "weekly"  },
  { path: "/compare/stakekings",   priority: "0.7", changefreq: "monthly" },
  { path: "/leaderboard",          priority: "0.7", changefreq: "daily"   },
  { path: "/auth",                 priority: "0.5", changefreq: "monthly" },
  { path: "/terms",                priority: "0.3", changefreq: "monthly" },
  { path: "/site-rules",           priority: "0.3", changefreq: "monthly" },
  { path: "/privacy",              priority: "0.3", changefreq: "monthly" },
  { path: "/forgot-password",      priority: "0.2", changefreq: "yearly"  },
  { path: "/guides/golden-dragon-strategy", priority: "0.7", changefreq: "monthly" },
];

const appSrc = readFileSync(resolve(ROOT, "src/App.tsx"), "utf8");

// Extract all <Route path="..."> definitions
const routeMatches = [...appSrc.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const definedRoutes = new Set(routeMatches);

// Extract legacy redirect targets: <LegacyRedirect to="/path" />
const legacyTargets = [...appSrc.matchAll(/<LegacyRedirect\s+to="([^"]+)"/g)].map((m) => m[1]);

const errors = [];

// 1. Every public route must exist in App.tsx
for (const { path } of PUBLIC_ROUTES) {
  if (!definedRoutes.has(path)) {
    errors.push(`Sitemap path "${path}" has no matching <Route> in src/App.tsx`);
  }
}

// 2. Every public route must have a matching canonical in some page
const pageFiles = [
  "src/pages/Index.tsx",
  "src/pages/Sessions.tsx",
  "src/pages/VipSessions.tsx",
  "src/pages/OurStakingServices.tsx",
  "src/pages/CryptoStakingGuide.tsx",
  "src/pages/Leaderboard.tsx",
  "src/pages/CompareStakeKings.tsx",
  "src/pages/Auth.tsx",
  "src/pages/Terms.tsx",
  "src/pages/SiteRules.tsx",
  "src/pages/PrivacyPolicy.tsx",
  "src/pages/ForgotPassword.tsx",
];
const canonicalsFound = new Set();
for (const f of pageFiles) {
  const src = readFileSync(resolve(ROOT, f), "utf8");
  const m = src.match(/canonical:\s*"([^"]+)"/);
  if (m) canonicalsFound.add(m[1]);
}
for (const { path } of PUBLIC_ROUTES) {
  if (!canonicalsFound.has(path)) {
    errors.push(`Sitemap path "${path}" has no matching canonical tag (useSEO canonical) in any page`);
  }
}

// 3. Every legacy redirect target must be a real route
for (const target of legacyTargets) {
  if (!definedRoutes.has(target)) {
    errors.push(`Legacy redirect target "${target}" does not exist as a <Route> in src/App.tsx`);
  }
}

if (errors.length) {
  console.error("❌ Sitemap validation failed:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

// --- Write sitemap.xml ---
const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  PUBLIC_ROUTES.map(
    ({ path, priority, changefreq }) =>
      `  <url>\n` +
      `    <loc>${BASE_URL}${path === "/" ? "/" : path}</loc>\n` +
      `    <lastmod>${TODAY}</lastmod>\n` +
      `    <changefreq>${changefreq}</changefreq>\n` +
      `    <priority>${priority}</priority>\n` +
      `  </url>`
  ).join("\n") +
  `\n</urlset>\n`;

writeFileSync(resolve(ROOT, "public/sitemap.xml"), xml);
console.log(`✅ Wrote public/sitemap.xml (${PUBLIC_ROUTES.length} URLs)`);
console.log(`✅ Validated ${legacyTargets.length} legacy redirect targets`);
console.log(`✅ Validated ${PUBLIC_ROUTES.length} canonical tags`);
