#!/usr/bin/env bash
# Register CareerPack's MCP server as a Composio Custom MCP toolkit.
#
# CareerPack already serves MCP at <site>/mcp (74 tools, OAuth + DCR + bearer).
# This script does NOT build a server — it registers that endpoint with
# Composio so its tools appear in Composio sessions beside every other toolkit.
#
# COMPOSIO_API_KEY is a USER key (uak_…) and goes in x-user-api-key. A project
# key (ak_…) uses x-api-key instead; the CLI's `composio login` writes the uak_
# form, which is why this script defaults to it.
#
# Three steps, and the middle one is NOT optional:
#   1. upsert the toolkit  — declares app_url + which auth modes it accepts
#   2. create the auth config — upsert does NOT do this; without it sync fails
#      with "Connected account is required for auth based apps" forever
#   3. create a connected account holding the CareerPack bearer, then sync
#
# The CareerPack token comes from either:
#   a) Setelan → MCP → "API key (Client ID + Secret)", then POST those to
#      https://careerpack.org/api/oauth/token with grant_type=client_credentials
#      (no browser, no consent screen — this is the path for a headless client)
#   b) an OAuth grant already sitting in oauthAccessTokens
#
# Never run with a token on the command line (shell history, ps). Read them
# from the environment or a file.
#
#   COMPOSIO_API_KEY=... CAREERPACK_TOKEN=... scripts/composio-careerpack-mcp.sh
#
# Exit codes: 0 registered+synced, 1 bad input, 2 registration failed.

set -euo pipefail

COMPOSIO_BASE="${COMPOSIO_BASE:-https://backend.composio.dev/api/v3.1}"
# The bare *.convex.site host, NOT careerpack.org: /mcp and every /.well-known
# document live on the SITE origin. A client's first probe goes to the host of
# the MCP URL and never reaches the Next.js app.
MCP_URL="${MCP_URL:-https://accomplished-vole-302.ap-southeast-2.convex.site/mcp}"
SLUG="${SLUG:-CAREERPACK}"

: "${COMPOSIO_API_KEY:?set COMPOSIO_API_KEY (project key from dashboard.composio.dev)}"
: "${CAREERPACK_TOKEN:?set CAREERPACK_TOKEN (Bearer for $MCP_URL)}"

# --- 0. Prove the bearer actually works before registering it ---------------
# Composio only checks that a key was PROVIDED, not that the server accepts it.
# Registering a dead token produces a toolkit that syncs zero tools and looks
# like a Composio bug. This is a read-only tools/list — the cheapest call that
# proves auth + reachability together.
printf '==> probing %s\n' "$MCP_URL"
probe=$(
  curl -sS -m 20 -o /tmp/opencode/mcp-probe.json -w '%{http_code}' \
    -X POST "$MCP_URL" \
    -H "Authorization: Bearer $CAREERPACK_TOKEN" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
) || { echo "FAIL: cannot reach $MCP_URL" >&2; exit 2; }

if [ "$probe" != "200" ]; then
  echo "FAIL: /mcp answered HTTP $probe — token rejected or endpoint down." >&2
  head -c 400 /tmp/opencode/mcp-probe.json >&2 || true
  echo >&2
  echo "A 401 here means CAREERPACK_TOKEN is wrong/expired. Fix that first:" >&2
  echo "  curl -X POST https://careerpack.org/api/oauth/token \\" >&2
  echo "       -d grant_type=client_credentials \\" >&2
  echo "       -d client_id=<cp_...> -d client_secret=<secret>" >&2
  exit 2
fi
tool_count=$(jq -r '(.result.tools // []) | length' /tmp/opencode/mcp-probe.json 2>/dev/null || echo "?")
echo "    ok — $tool_count tools visible"

# --- 1. Register (upsert) ---------------------------------------------------
# app_url and auth_schemes are IMMUTABLE after the first registration: changing
# either returns 409 and needs a delete + re-register. Everything else updates
# in place, so re-running this script is safe.
printf '==> registering custom MCP toolkit %s\n' "$SLUG"
reg=$(
  curl -sS -m 30 -w '\n%{http_code}' \
    -X POST "$COMPOSIO_BASE/custom/toolkits/upsert" \
    -H "x-user-api-key: $COMPOSIO_API_KEY" \
    -H 'Content-Type: application/json' \
    -d "$(jq -n --arg slug "$SLUG" --arg url "$MCP_URL" '{
      slug: $slug,
      toolkit_config: {
        name: "CareerPack",
        app_url: $url,
        auth_schemes: [
          { mode: "API_KEY",
            headers: { Authorization: "Bearer {{generic_api_key}}" } }
        ]
      }
    }')"
)
reg_body=${reg%$'\n'*}
reg_code=${reg##*$'\n'}

case "$reg_code" in
  200|201) ;;
  409)
    cat <<'EOF' >&2
FAIL: 409 Conflict — app_url or auth_schemes differs from the existing toolkit.
Those two fields cannot change in place. Delete and re-register:
  curl -X DELETE "$COMPOSIO_BASE/custom/toolkits/CUSTOM_CAREERPACK" -H "x-user-api-key: $COMPOSIO_API_KEY"
Then run this script again.
EOF
    exit 2
    ;;
  *)
    echo "FAIL: upsert returned HTTP $reg_code" >&2
    echo "$reg_body" | head -c 600 >&2; echo >&2
    exit 2
    ;;
esac

toolkit_slug=$(echo "$reg_body" | jq -r '.slug // empty')
[ -n "$toolkit_slug" ] || { echo "FAIL: no slug in response" >&2; echo "$reg_body" | head -c 400 >&2; exit 2; }
echo "    registered as $toolkit_slug"

# --- 2. Connect the account that carries the token --------------------------
# API_KEY mode needs an ACTIVE connected account before the initial sync runs,
# and a connected account must name the auth config the upsert just created.
# Re-running must not stack duplicate accounts, so list first.
printf '==> connecting CareerPack account\n'
existing=$(
  curl -sS -m 20 "$COMPOSIO_BASE/connected_accounts?toolkit_slugs=$toolkit_slug&statuses=ACTIVE" \
    -H "x-user-api-key: $COMPOSIO_API_KEY" | jq -r '(.items // [])[0].id // empty'
)

if [ -n "$existing" ]; then
  echo "    reusing active account $existing"
  acct_id=$existing
else
  auth_config_id=$(
    curl -sS -m 20 "$COMPOSIO_BASE/auth_configs?toolkit_slug=$toolkit_slug" \
      -H "x-user-api-key: $COMPOSIO_API_KEY" | jq -r '(.items // [])[0].id // empty'
  )
  # upsert does NOT create the auth config — it only declares which schemes the
  # toolkit accepts. Without this, sync fails with "Connected account is
  # required for auth based apps" and the toolkit sits at 0 tools forever.
  if [ -z "$auth_config_id" ]; then
    echo "    creating auth config (upsert does not)"
    auth_config_id=$(
      curl -sS -m 30 -X POST "$COMPOSIO_BASE/auth_configs" \
        -H "x-user-api-key: $COMPOSIO_API_KEY" \
        -H 'Content-Type: application/json' \
        -d "$(jq -n --arg slug "$toolkit_slug" '{
          toolkit: { slug: $slug },
          auth_config: {
            type: "use_custom_auth",
            authScheme: "API_KEY",
            credentials: {},
            restrict_to_following_tools: []
          }
        }')" | jq -r '.auth_config.id // empty'
    )
  fi
  if [ -z "$auth_config_id" ]; then
    echo "FAIL: no auth config for $toolkit_slug and could not create one" >&2
    exit 2
  fi
  echo "    auth config $auth_config_id"

  conn=$(
    curl -sS -m 30 -X POST "$COMPOSIO_BASE/connected_accounts" \
      -H "x-user-api-key: $COMPOSIO_API_KEY" \
      -H 'Content-Type: application/json' \
      -d "$(jq -n --arg cfg "$auth_config_id" --arg tok "$CAREERPACK_TOKEN" '{
        auth_config: { id: $cfg },
        connection: {
          user_id: "careerpack-owner",
          state: { authScheme: "API_KEY", val: { generic_api_key: $tok } }
        }
      }')"
  )
  acct_id=$(echo "$conn" | jq -r '.id // empty')
  if [ -z "$acct_id" ]; then
    echo "FAIL: could not create connected account" >&2
    echo "$conn" | head -c 600 >&2; echo >&2
    exit 2
  fi
  echo "    created account $acct_id"
fi

# --- 3. Sync tool definitions ----------------------------------------------
# Auto-sync only fills an EMPTY toolkit. A toolkit that already has a version
# silently keeps stale tool definitions, so sync explicitly.
printf '==> syncing tools\n'
synced=$(
  curl -sS -m 60 -X POST "$COMPOSIO_BASE/custom/toolkits/sync" \
    -H "x-user-api-key: $COMPOSIO_API_KEY" \
    -H 'Content-Type: application/json' \
    -d "$(jq -n --arg slug "$toolkit_slug" --arg acct "$acct_id" \
      '{slug: $slug, connected_account_id: $acct}')"
)
echo "$synced" | jq -r '"    version=\(.version // "?") tools=\(.synced_count // "?")"' 2>/dev/null \
  || { echo "$synced" | head -c 400; echo; }

cat <<EOF

Done. Toolkit $toolkit_slug is registered and synced.

Verify with a read-only tool before trusting it end to end:
  ~/.local/bin/composio execute CAREERPACK_PROFILE_GET '{}'

Known Composio gap: custom tools can sync and execute fine yet stay missing
from COMPOSIO_SEARCH_TOOLS results. If search cannot find them, call the exact
slug through COMPOSIO_MULTI_EXECUTE_TOOL — that is the workaround, not a sign
the sync failed.
EOF
