#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  FishKillerz — Pre-Deploy Checklist
#  Run:  bash scripts/deploy-checklist.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

PASS="\033[32m✓\033[0m"
FAIL="\033[31m✗\033[0m"
WARN="\033[33m⚠\033[0m"
rc=0

check() { if eval "$2" 2>/dev/null; then printf " $PASS  %s\n" "$1"; else printf " $FAIL  %s\n" "$1"; rc=1; fi }
warn()  { if eval "$2" 2>/dev/null; then printf " $PASS  %s\n" "$1"; else printf " $WARN  %s (non-blocking)\n" "$1"; fi }

echo ""
echo "══════════════════════════════════════════"
echo "  FishKillerz Deploy Checklist"
echo "══════════════════════════════════════════"
echo ""

# ── 1. Build ──────────────────────────────────────────────
echo "▸ Build"
check "npm run build succeeds"          "npm run build --silent"
check "dist/index.html exists"          "test -f dist/index.html"
check "dist/assets/ has JS bundles"     "ls dist/assets/*.js >/dev/null"

# ── 2. Vercel config ─────────────────────────────────────
echo ""
echo "▸ Vercel routing & headers"
check "vercel.json is valid JSON"       "python3 -c 'import json,pathlib; json.load(pathlib.Path(\"vercel.json\").open())'"
check "SPA rewrite exists"             "grep -q 'destination.*index.html' vercel.json"
check "Security headers present"       "grep -q 'X-Content-Type-Options' vercel.json"
check "Asset immutable caching"        "grep -q 'immutable' vercel.json"

# ── 3. Lovable hosting headers ───────────────────────────
echo ""
echo "▸ Lovable hosting (public/_headers)"
check "_headers file exists"            "test -f public/_headers"
check "index.html no-cache"            "grep -A1 '/index.html' public/_headers | grep -qi 'no-cache'"
check "assets immutable"               "grep -A1 '/assets' public/_headers | grep -qi 'immutable'"

# ── 4. PWA / Manifest ───────────────────────────────────
echo ""
echo "▸ PWA & manifest"
check "manifest.webmanifest exists"     "test -f public/manifest.webmanifest"
check "manifest linked in index.html"   "grep -q 'manifest.webmanifest' index.html"
check "192px icon exists"              "test -f public/pwa-192x192.png"
check "512px icon exists"              "test -f public/pwa-512x512.png"
warn  "No service worker registered"   "! grep -rq 'serviceWorker.register' src/"

# ── 5. SEO essentials ───────────────────────────────────
echo ""
echo "▸ SEO"
check "robots.txt exists"              "test -f public/robots.txt"
check "sitemap.xml exists"             "test -f public/sitemap.xml"
check "canonical tag in index.html"    "grep -q 'rel=\"canonical\"' index.html"
check "OG image tag in index.html"     "grep -q 'og:image' index.html"

# ── 6. Edge functions ───────────────────────────────────
echo ""
echo "▸ Edge functions (type-check)"
for fn in supabase/functions/*/index.ts; do
  name=$(basename "$(dirname "$fn")")
  dir=$(dirname "$fn")
  if [ -f "$dir/deno.json" ]; then
    check "edge fn: $name" "(cd '$dir' && deno check index.ts)"
  else
    check "edge fn: $name" "deno check '$fn'"
  fi
done

# ── 7. Security quick-checks ────────────────────────────
echo ""
echo "▸ Security"
warn  "No hardcoded API secrets in src/" "! grep -rqE '(sk_live|sk_test|SUPABASE_SERVICE_ROLE)' src/"
check "X-Frame-Options in vercel.json"  "grep -q 'X-Frame-Options' vercel.json"

echo ""
if [ $rc -eq 0 ]; then
  printf "\033[32m  All checks passed — safe to deploy!\033[0m\n"
else
  printf "\033[31m  Some checks failed — fix before deploying.\033[0m\n"
fi
echo ""
exit $rc