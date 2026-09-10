#!/usr/bin/env sh
# Verify from the outside that a deployed host exposes the backend and nothing else:
#   - :80  answers with a redirect to https
#   - :443 answers over TLS
#   - the service ports behind nginx (api, ai, postgres) are NOT reachable
#
# Run it from a machine that is *not* the VPS, otherwise loopback-bound ports
# will look open when they are not actually exposed.
#
#   sh scripts/check-vps-exposure.sh medicail.nf2.tech
#   sh scripts/check-vps-exposure.sh medicail.nf2.tech 203.0.113.10
#
# IMPORTANT: medicail.nf2.tech is proxied through Cloudflare. Testing the
# hostname alone only tells you what Cloudflare's edge does — Cloudflare
# terminates TLS, applies its own "Always Use HTTPS" redirect, and forwards
# only 80/443. It says nothing about the VPS itself. Pass the origin IP as the
# second argument to test the machine directly; that is the check that matters,
# because anyone who learns the origin IP can bypass the edge entirely.

set -eu

HOST="${1:-}"
ORIGIN="${2:-}"
if [ -z "$HOST" ]; then
    echo "usage: $0 <host> [origin-ip]" >&2
    echo "  e.g. $0 medicail.nf2.tech 203.0.113.10" >&2
    exit 2
fi

# Ports that must stay private. nginx reaches them over the docker network.
PRIVATE_PORTS="8000 8001 5432"

# What we actually open TCP connections to.
TARGET="${ORIGIN:-$HOST}"

fail=0
pass() { printf '  ok    %s\n' "$1"; }
bad()  { printf '  FAIL  %s\n' "$1"; fail=1; }
warn() { printf '  warn  %s\n' "$1"; }

printf '\nChecking %s' "$HOST"
[ -n "$ORIGIN" ] && printf ' (origin %s)' "$ORIGIN"
printf '\n\n'

# --- is there a CDN in front? ---------------------------------------------
edge=$(curl -s -I --max-time 10 "https://$HOST/health" 2>/dev/null \
    | tr -d '\r' | awk 'tolower($1)=="server:"{print tolower($2)}' || true)
if [ -z "$ORIGIN" ] && [ -n "$edge" ] && [ "$edge" != "nginx" ]; then
    printf 'edge\n'
    warn "'$HOST' is served by '$edge', not the origin directly."
    warn "Results below describe that edge, NOT the VPS."
    warn "Re-run with the origin IP: $0 $HOST <origin-ip>"
    printf '\n'
fi

# --- :80 must redirect to https -------------------------------------------
printf 'port 80 -> 443 redirect\n'
if [ -n "$ORIGIN" ]; then
    r=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' --max-time 10 \
        -H "Host: $HOST" "http://$ORIGIN/api" 2>/dev/null || echo "000 ")
else
    r=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' --max-time 10 \
        "http://$HOST/api" 2>/dev/null || echo "000 ")
fi
code=${r%% *}
target=${r#* }

case "$code" in
    301|302|307|308)
        case "$target" in
            https://*) pass "HTTP $code -> $target" ;;
            *)         bad  "HTTP $code but redirects to '$target' (not https)" ;;
        esac
        ;;
    000) bad "port 80 unreachable (expected a redirect)" ;;
    *)   bad "HTTP $code on port 80 — cleartext is served, not redirected" ;;
esac

# --- :443 must serve the backend ------------------------------------------
printf '\nport 443 backend\n'
if [ -n "$ORIGIN" ]; then
    # --resolve pins the TLS SNI/Host to $HOST while connecting to the origin.
    # -k because the origin may present a cert the edge would normally front.
    hdr=$(curl -s -I -k --max-time 10 --resolve "$HOST:443:$ORIGIN" \
        "https://$HOST/health" 2>/dev/null | tr -d '\r' || true)
else
    hdr=$(curl -s -I --max-time 10 "https://$HOST/health" 2>/dev/null | tr -d '\r' || true)
fi
health=$(printf '%s' "$hdr" | awk 'NR==1{print $2}')

case "${health:-000}" in
    000|"") bad "https /health unreachable (TLS handshake or cert problem?)" ;;
    200)    pass "https /health -> 200" ;;
    *)      bad "https /health -> $health (expected 200)" ;;
esac

if printf '%s' "$hdr" | grep -qi '^strict-transport-security:'; then
    pass "HSTS present"
else
    bad "no Strict-Transport-Security header"
fi

# --- service ports must be closed -----------------------------------------
printf '\nprivate ports on %s (must be closed)\n' "$TARGET"
for port in $PRIVATE_PORTS; do
    # A refused/filtered connection is the desired outcome here.
    if nc -z -w 5 "$TARGET" "$port" 2>/dev/null; then
        bad "port $port is reachable from the internet"
    else
        pass "port $port closed"
    fi
done

printf '\n'
if [ "$fail" -eq 0 ]; then
    if [ -z "$ORIGIN" ]; then
        printf 'Edge checks passed. Re-run with the origin IP to check the VPS itself.\n'
    else
        printf 'All checks passed.\n'
    fi
else
    printf 'Some checks failed — see FAIL lines above.\n'
fi
exit "$fail"
