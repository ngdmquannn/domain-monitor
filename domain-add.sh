#!/usr/bin/env bash
# domain-add.sh — Add domains to the Domain Monitor via API or .env
#
# Usage:
#   ./domain-add.sh -e domains.txt -u https://domain-monitor.zingplay.dev
#   ./domain-add.sh example.com foo.net -u https://domain-monitor.zingplay.dev
#   ./domain-add.sh -e domains.txt          # update .env directly (local dev)
#   ./domain-add.sh example.com            # update .env directly (local dev)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

usage() {
  cat <<EOF
Usage: $0 [domain...] [-e domains.txt] [-u https://app-url]

Options:
  -e, --file FILE    File chứa danh sách domain (1 domain/dòng, # = comment)
  -u, --url  URL     URL app đang host (gọi POST /api/domains để add)
                     Nếu không có -u thì update .env trực tiếp (local dev)
  -h, --help         Hiện usage

Examples:
  ./domain-add.sh -e domains.txt -u https://domain-monitor.zingplay.dev
  ./domain-add.sh example.com newsite.vn -u https://domain-monitor.zingplay.dev
  ./domain-add.sh -e domains.txt
EOF
  exit 1
}

DOMAINS_INPUT=()
DOMAINS_FILE=""
APP_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--file)  DOMAINS_FILE="$2"; shift 2 ;;
    -u|--url)   APP_URL="${2%/}"; shift 2 ;;
    -h|--help)  usage ;;
    -*)         echo "Unknown option: $1"; usage ;;
    *)          DOMAINS_INPUT+=("$1"); shift ;;
  esac
done

# Collect domains
ALL_DOMAINS=()
for d in "${DOMAINS_INPUT[@]+"${DOMAINS_INPUT[@]}"}"; do
  ALL_DOMAINS+=("$(echo "$d" | tr '[:upper:]' '[:lower:]' | tr -d ' ')")
done

if [[ -n "$DOMAINS_FILE" ]]; then
  [[ ! -f "$DOMAINS_FILE" ]] && echo "❌  File not found: $DOMAINS_FILE" && exit 1
  while IFS= read -r line || [[ -n "$line" ]]; do
    d="$(echo "$line" | tr '[:upper:]' '[:lower:]' | tr -d ' ')"
    [[ -z "$d" || "$d" == \#* ]] && continue
    ALL_DOMAINS+=("$d")
  done < "$DOMAINS_FILE"
fi

[[ ${#ALL_DOMAINS[@]} -eq 0 ]] && echo "❌  No domains provided." && usage

added=(); failed=(); skipped=()

if [[ -n "$APP_URL" ]]; then
  # --- Mode: gọi API app đang host ---
  echo "🌐  Adding via API: $APP_URL/api/domains"
  echo ""
  for d in "${ALL_DOMAINS[@]}"; do
    http_file="$(mktemp)"
    body="$(curl -s -o "$http_file" -w "%{http_code}" -X POST "$APP_URL/api/domains" \
      -H "Content-Type: application/json" \
      -d "{\"domain\":\"$d\"}")"
    code="$body"
    body="$(cat "$http_file")"; rm -f "$http_file"

    case "$code" in
      200|201) echo "✅  $d — added"; added+=("$d") ;;
      409)     echo "⏭   $d — already in list"; skipped+=("$d") ;;
      *)       echo "❌  $d — failed (HTTP $code: $body)"; failed+=("$d") || true ;;
    esac
  done

else
  # --- Mode: update .env trực tiếp (local dev) ---
  echo "📄  Updating .env directly: $ENV_FILE"
  echo ""
  [[ ! -f "$ENV_FILE" ]] && echo "❌  .env not found at $ENV_FILE" && exit 1

  current_value="$(grep -E '^MANAGED_DOMAINS=' "$ENV_FILE" | sed 's/^MANAGED_DOMAINS=//' || true)"
  new_value="$current_value"

  for d in "${ALL_DOMAINS[@]}"; do
    if echo ",$current_value," | grep -q ",$d,"; then
      echo "⏭   $d — already in list"; skipped+=("$d"); continue
    fi
    new_value="${new_value:+$new_value,}$d"
    added+=("$d")
    echo "✅  $d — added"
  done

  if [[ ${#added[@]} -gt 0 ]]; then
    if grep -qE '^MANAGED_DOMAINS=' "$ENV_FILE"; then
      sed -i '' "s|^MANAGED_DOMAINS=.*|MANAGED_DOMAINS=$new_value|" "$ENV_FILE"
    else
      printf '\nMANAGED_DOMAINS=%s\n' "$new_value" >> "$ENV_FILE"
    fi
    echo ""
    echo "📄  Updated .env — restart app to apply changes"
  fi
fi

# Summary
echo ""
echo "─────────────────────────────"
[[ ${#added[@]} -gt 0 ]]   && echo "✅  Added   (${#added[@]}):   ${added[*]}"
[[ ${#skipped[@]} -gt 0 ]] && echo "⏭   Skipped (${#skipped[@]}): ${skipped[*]}"
[[ ${#failed[@]} -gt 0 ]]  && echo "❌  Failed  (${#failed[@]}):  ${failed[*]}"
exit 0
