#!/usr/bin/env bash
# Frontend demo-isolation guard (prompt §3.3). Scans src/ excluding the three demo subtrees.
set -euo pipefail
ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
SRC="$ROOT/src"
# Any string literal naming a demo module, whatever surrounds it: import, import(), require,
# side-effect import, export … from. Alias roots or a relative path with a demo/ segment.
DEMO_SPECIFIER="['\"](@/(lib/demo|app/api/demo|app/\\(platform\\)/demo)(/|['\"])|(\\.{1,2}/)+([^'\"]*/)?demo/)"
status=0
while IFS= read -r file; do
  if grep -nE 'NEXT_PUBLIC_DEMO_MODE' "$file"; then
    echo "NEXT_PUBLIC_DEMO_MODE referenced outside demo subtree: ${file#"$ROOT"/}"; status=1
  fi
  if grep -nE "$DEMO_SPECIFIER" "$file"; then
    echo "demo import outside demo subtree: ${file#"$ROOT"/}"; status=1
  fi
done < <(find "$SRC" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \
    -o -name '*.mjs' -o -name '*.cjs' -o -name '*.mts' -o -name '*.cts' -o -name '*.mdx' \) \
  -not -path "$SRC/app/(platform)/demo/*" -not -path "$SRC/app/api/demo/*" -not -path "$SRC/lib/demo/*")
exit $status
