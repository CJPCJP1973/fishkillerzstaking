#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Production Build Verification
#  Runs the same build command that publish uses and reports:
#   - missing required env vars
#   - build-time errors / warnings
#   - basic dist/ output sanity
#
#  Run:  bash scripts/verify-build.sh
# ─────────────────────────────────────────────────────────────
set -uo pipefail

GREEN="\033[32m"
RED="\033[31m"
YELLOW="\033[33m"
BLUE="\033[34m"
DIM="\033[2m"
RESET="\033[0m"

PASS="${GREEN}✓${RESET}"
FAIL="${RED}✗${RESET}"
WARN="${YELLOW}⚠${RESET}"

rc=0
LOG_FILE="$(mktemp -t verify-build.XXXXXX.log)"
trap 'rm -f "$LOG_FILE"' EXIT

echo ""
echo "══════════════════════════════════════════════════════"
echo "  Production Build Verification"
echo "══════════════════════════════════════════════════════"
echo ""

# ── 1. Required env vars ─────────────────────────────────
echo "▸ Environment variables"

REQUIRED_VARS=(
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_PUBLISHABLE_KEY"
  "VITE_SUPABASE_PROJECT_ID"
)

# Load .env so we can inspect declared values without exporting secrets.
declare -A ENV_VALUES=()
if [ -f .env ]; then
  printf " $PASS  .env file present\n"
  while IFS= read -r line || [ -n "$line" ]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    key="${key#export }"
    key="$(echo "$key" | xargs)"
    # strip surrounding quotes
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    [ -n "$key" ] && ENV_VALUES["$key"]="$val"
  done < .env
else
  printf " $WARN  .env file not found (values must come from the shell environment)\n"
fi

for var in "${REQUIRED_VARS[@]}"; do
  val="${!var-}"
  [ -z "$val" ] && val="${ENV_VALUES[$var]-}"
  if [ -n "$val" ]; then
    printf " $PASS  %s is set\n" "$var"
  else
    printf " $FAIL  %s is missing — the published app will break at runtime\n" "$var"
    rc=1
  fi
done

# ── 2. Production build ──────────────────────────────────
echo ""
echo "▸ Production build (vite build)"
echo -e " ${DIM}running: npm run build${RESET}"

BUILD_START=$(date +%s)
if npm run build --silent >"$LOG_FILE" 2>&1; then
  BUILD_END=$(date +%s)
  printf " $PASS  build succeeded in %ss\n" "$((BUILD_END - BUILD_START))"
else
  BUILD_END=$(date +%s)
  printf " $FAIL  build FAILED after %ss\n\n" "$((BUILD_END - BUILD_START))"
  echo -e " ${RED}── Build output (last 60 lines) ─────────────────────${RESET}"
  tail -n 60 "$LOG_FILE" | sed 's/^/   /'
  echo -e " ${RED}─────────────────────────────────────────────────────${RESET}"
  echo ""
  echo -e " ${RED}Full build log:${RESET} $LOG_FILE"
  trap - EXIT
  exit 1
fi

# ── 3. Build-time warnings surfaced by Vite/Rollup ───────
echo ""
echo "▸ Build warnings"
WARN_COUNT=$(grep -ciE '(warning|deprecated|circular dependency)' "$LOG_FILE" || true)
if [ "$WARN_COUNT" -gt 0 ]; then
  printf " $WARN  %s warning line(s) in build output:\n" "$WARN_COUNT"
  grep -iE '(warning|deprecated|circular dependency)' "$LOG_FILE" | head -n 20 | sed 's/^/     /'
else
  printf " $PASS  no build warnings\n"
fi

# ── 4. dist/ output sanity ───────────────────────────────
echo ""
echo "▸ dist/ output"
if [ -f dist/index.html ]; then
  printf " $PASS  dist/index.html exists\n"
else
  printf " $FAIL  dist/index.html missing\n"; rc=1
fi

if ls dist/assets/*.js >/dev/null 2>&1; then
  JS_COUNT=$(ls dist/assets/*.js 2>/dev/null | wc -l | xargs)
  printf " $PASS  %s JS bundle(s) produced\n" "$JS_COUNT"
else
  printf " $FAIL  no JS bundles in dist/assets/\n"; rc=1
fi

if ls dist/assets/*.css >/dev/null 2>&1; then
  printf " $PASS  CSS bundle produced\n"
else
  printf " $WARN  no CSS bundle in dist/assets/\n"
fi

# Verify the built bundle actually inlined the Supabase URL (Vite replaces
# import.meta.env.* at build time — an empty value means the client will 404).
if ls dist/assets/*.js >/dev/null 2>&1; then
  SUPABASE_URL_VAL="${VITE_SUPABASE_URL-}"
  [ -z "$SUPABASE_URL_VAL" ] && SUPABASE_URL_VAL="${ENV_VALUES[VITE_SUPABASE_URL]-}"
  if [ -n "$SUPABASE_URL_VAL" ]; then
    if grep -q "$SUPABASE_URL_VAL" dist/assets/*.js 2>/dev/null; then
      printf " $PASS  Supabase URL inlined into production bundle\n"
    else
      printf " $WARN  Supabase URL not found in bundle (may be tree-shaken or fallback used)\n"
    fi
  fi
fi

# ── Result ────────────────────────────────────────────────
echo ""
if [ $rc -eq 0 ]; then
  printf "${GREEN}  Build verification PASSED — safe to publish.${RESET}\n"
else
  printf "${RED}  Build verification FAILED — fix the items above before publishing.${RESET}\n"
fi
echo ""
exit $rc
