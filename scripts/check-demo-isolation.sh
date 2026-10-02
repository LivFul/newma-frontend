#!/usr/bin/env bash
# Frontend demo-isolation guard (prompt §3.3). Scans src/ excluding the three demo subtrees.
set -euo pipefail
ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
SRC="$ROOT/src"
status=0
while IFS= read -r file; do
  if grep -nE 'NEXT_PUBLIC_DEMO_MODE' "$file"; then
    echo "NEXT_PUBLIC_DEMO_MODE referenced outside demo subtree: ${file#"$ROOT"/}"; status=1
  fi
  if grep -nE "from ['\"](@/lib/demo|@/app/api/demo|@/app/\(platform\)/demo|\.{1,2}/[^'\"]*/demo/)" "$file"; then
    echo "demo import outside demo subtree: ${file#"$ROOT"/}"; status=1
  fi
done < <(find "$SRC" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' \) \
  -not -path "$SRC/app/(platform)/demo/*" -not -path "$SRC/app/api/demo/*" -not -path "$SRC/lib/demo/*")
exit $status
