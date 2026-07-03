#!/usr/bin/env bash
#
# IRONFORGE — Post-deploy smoke test
#
# Runs a 30-second verification of the production URL.
# Checks: HTTP status codes, key page elements, API routes, SEO endpoints.
#
# Usage:
#   IRONFORGE_LIVE_URL=https://yourdomain.com bash scripts/smoke-test.sh
#
# Exit codes:
#   0 — all checks passed
#   1 — one or more checks failed

set -euo pipefail

URL="${IRONFORGE_LIVE_URL:-http://localhost:3000}"
PASS=0
FAIL=0
SKIP=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check() {
  local label="$1"
  local expected="$2"
  local actual="$3"

  if [ "$expected" = "$actual" ]; then
    echo -e "  ${GREEN}✓${NC} $label"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $label (expected: $expected, got: $actual)"
    FAIL=$((FAIL + 1))
  fi
}

check_contains() {
  local label="$1"
  local body="$2"
  local pattern="$3"

  if echo "$body" | grep -q "$pattern"; then
    echo -e "  ${GREEN}✓${NC} $label"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $label (pattern not found: $pattern)"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  IRONFORGE — Smoke Test"
echo "  URL: $URL"
echo "  $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ─── 1. Home Page ───
echo "▸ Home Page"
HOME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/")
check "HTTP 200 on /" "200" "$HOME_STATUS"

HOME_BODY=$(curl -s "$URL/")
check_contains "IRONFORGE in title" "$HOME_BODY" "IRONFORGE"
check_contains "Hero headline present" "$HOME_BODY" "BUILT BY"
check_contains "Programs section present" "$HOME_BODY" "CHOOSE YOUR DISCIPLINE"
check_contains "Coaches section present" "$HOME_BODY" "TWENTY-FOUR SPECIALISTS"
check_contains "Stories section present" "$HOME_BODY" "REAL TRANSFORMATIONS"
check_contains "Booking section present" "$HOME_BODY" "CLAIM YOUR FIRST SESSION"
check_contains "Memberships section present" "$HOME_BODY" "CHOOSE YOUR COMMITMENT"
check_contains "JSON-LD structured data" "$HOME_BODY" "application/ld+json"
check_contains "HealthClub schema" "$HOME_BODY" "HealthClub"
echo ""

# ─── 2. SEO Endpoints ───
echo "▸ SEO Endpoints"
ROBOTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/robots.txt")
check "HTTP 200 on /robots.txt" "200" "$ROBOTS_STATUS"

ROBOTS_BODY=$(curl -s "$URL/robots.txt")
check_contains "robots.txt has Sitemap" "$ROBOTS_BODY" "Sitemap:"
check_contains "robots.txt disallows /admin/" "$ROBOTS_BODY" "Disallow: /admin/"

SITEMAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/sitemap.xml")
check "HTTP 200 on /sitemap.xml" "200" "$SITEMAP_STATUS"

SITEMAP_BODY=$(curl -s "$URL/sitemap.xml")
check_contains "sitemap.xml has urlset" "$SITEMAP_BODY" "<urlset"
SITEMAP_URL_COUNT=$(echo "$SITEMAP_BODY" | grep -c "<url>" || true)
check "sitemap.xml has ≥20 URLs" "true" $([ "$SITEMAP_URL_COUNT" -ge 20 ] && echo "true" || echo "false")

MANIFEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/manifest.webmanifest")
check "HTTP 200 on /manifest.webmanifest" "200" "$MANIFEST_STATUS"

ICON_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/icon.svg")
check "HTTP 200 on /icon.svg" "200" "$ICON_STATUS"
echo ""

# ─── 3. API Routes ───
echo "▸ API Routes (Read)"
PROGRAMS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/programs")
check "HTTP 200 on /api/programs" "200" "$PROGRAMS_STATUS"

PROGRAMS_BODY=$(curl -s "$URL/api/programs")
check_contains "API returns programs array" "$PROGRAMS_BODY" '"data"'
PROGRAMS_COUNT=$(echo "$PROGRAMS_BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null || echo "0")
check "API returns 9 programs" "9" "$PROGRAMS_COUNT"

COACHES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/coaches")
check "HTTP 200 on /api/coaches" "200" "$COACHES_STATUS"

COACHES_BODY=$(curl -s "$URL/api/coaches")
COACHES_COUNT=$(echo "$COACHES_BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null || echo "0")
check "API returns 8 coaches" "8" "$COACHES_COUNT"

STORIES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/stories")
check "HTTP 200 on /api/stories" "200" "$STORIES_STATUS"

STORIES_BODY=$(curl -s "$URL/api/stories")
STORIES_COUNT=$(echo "$STORIES_BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null || echo "0")
check "API returns 6 stories" "6" "$STORIES_COUNT"
echo ""

# ─── 4. Program Detail API ───
echo "▸ API Routes (Detail)"
PROGRAM_DETAIL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/programs/conjugate-max-effort")
check "HTTP 200 on /api/programs/conjugate-max-effort" "200" "$PROGRAM_DETAIL_STATUS"

PROGRAM_404_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/programs/nonexistent-slug")
check "HTTP 404 on unknown program slug" "404" "$PROGRAM_404_STATUS"

INVALID_GOAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/programs?goal=invalid")
check "HTTP 400 on invalid goal filter" "400" "$INVALID_GOAL_STATUS"
echo ""

# ─── 5. Auth ───
echo "▸ Auth"
ADMIN_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" "$URL/admin")
check "HTTP 307 redirect on /admin (unauthenticated)" "307" "$ADMIN_REDIRECT"

ADMIN_LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/admin/login")
check "HTTP 200 on /admin/login" "200" "$ADMIN_LOGIN_STATUS"

ADMIN_LOGIN_BODY=$(curl -s "$URL/admin/login")
check_contains "Login form present" "$ADMIN_LOGIN_BODY" "SIGN IN"
echo ""

# ─── 6. Error Pages ───
echo "▸ Error Pages"
NOT_FOUND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/this-page-does-not-exist")
check "HTTP 404 on unknown route" "404" "$NOT_FOUND_STATUS"

NOT_FOUND_BODY=$(curl -s "$URL/this-page-does-not-exist")
check_contains "404 page has brand styling" "$NOT_FOUND_BODY" "404"
echo ""

# ─── 7. Security Headers ───
echo "▸ Security Headers"
HEADERS=$(curl -sI "$URL/")
check_contains "CSP header present" "$HEADERS" "Content-Security-Policy"
check_contains "HSTS header present" "$HEADERS" "Strict-Transport-Security"
check_contains "X-Frame-Options present" "$HEADERS" "X-Frame-Options"
check_contains "X-Content-Type-Options present" "$HEADERS" "X-Content-Type-Options"
echo ""

# ─── Summary ───
echo "═══════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}PASSED${NC}: $PASS    ${RED}FAILED${NC}: $FAIL    SKIPPED: $SKIP"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}❌ SMOKE TEST FAILED — $FAIL check(s) failed${NC}"
  exit 1
else
  echo -e "${GREEN}✅ SMOKE TEST PASSED — all $PASS checks green${NC}"
  exit 0
fi
