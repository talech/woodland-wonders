#!/usr/bin/env bash
# Fails if tracked files include secrets-prone, machine-specific or generated artifacts.
# Runs in CI and locally: `bash scripts/check-hygiene.sh`
set -euo pipefail

forbidden_regex='(^|/)(\.env(\..+)?|\.DS_Store|node_modules/|dist/|build/|web-build/|coverage/|\.expo/|ios/|android/)|\.(pem|p8|p12|key|jks|keystore|mobileprovision|tsbuildinfo)$'
allowed_regex='(^|/)\.env\.example$'

bad=$(git ls-files | grep -E "$forbidden_regex" | grep -Ev "$allowed_regex" || true)
if [[ -n "$bad" ]]; then
  echo "::error::Forbidden files are tracked:"
  echo "$bad"
  exit 1
fi

# Case-sensitive reference check: docs referenced by the contracts must exist with exact case.
for f in AGENTS.md CLAUDE.md ORCHESTRATION.md docs/GDD.md docs/STATUS.md; do
  git ls-files --error-unmatch "$f" >/dev/null 2>&1 || { echo "::error::Missing required file (case-sensitive): $f"; exit 1; }
done

# Large-file guard (2 MB) — assets should be optimized; larger binaries need explicit review.
large=$(git ls-files -z | xargs -0 -I{} sh -c 'test -f "{}" && s=$(wc -c < "{}") && [ "$s" -gt 2097152 ] && echo "{} ($s bytes)"' || true)
if [[ -n "$large" ]]; then
  echo "::error::Files over 2 MB are tracked:"; echo "$large"; exit 1
fi

echo "hygiene: ok"
