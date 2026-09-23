#!/usr/bin/env bash
# Zip the Vercel Web Proxy project for distribution.
#
# Includes:
#   - src/                 (all source)
#   - public/              (static assets)
#   - prisma/              (schema)
#   - package.json, bun.lock, tsconfig.json, next.config.ts
#   - eslint.config.mjs, postcss.config.mjs, tailwind.config.ts
#   - components.json
#   - vercel.json
#   - README.md
#
# Excludes (per .gitignore + obvious build/runtime junk):
#   - node_modules/
#   - .next/
#   - .git/
#   - .zscripts/
#   - dev.log, server.log
#   - download/  (don't ship the download folder inside itself)
#   - skills/, examples/, mini-services/, tests/, db/, upload/ (sandbox-only)
#   - .env       (don't ship secrets)

set -euo pipefail

PROJECT_DIR="/home/z/my-project"
OUTPUT_FILE="/home/z/my-project/download/web-proxy.zip"

mkdir -p "$(dirname "$OUTPUT_FILE")"

# Remove any previous zip so we always ship a fresh copy.
rm -f "$OUTPUT_FILE"

cd "$PROJECT_DIR"

# Make sure no stale copy of the zip itself is sitting in public/ before we
# zip — otherwise the archive would include itself.
rm -f public/web-proxy.zip 2>/dev/null || true

# Build the include list explicitly so we don't accidentally ship sandbox
# internals (skills, examples, mini-services, tests, db, .zscripts, .next, etc).
INCLUDES=(
  "src"
  "public"
  "prisma"
  "package.json"
  "bun.lock"
  "tsconfig.json"
  "next.config.ts"
  "eslint.config.mjs"
  "postcss.config.mjs"
  "tailwind.config.ts"
  "components.json"
  "vercel.json"
  "README.md"
)

# Use --no-recursion to skip subdirs we didn't list. We add dirs explicitly.
# `-X` skips extra file attributes (keeps the archive smaller).
zip -r -X "$OUTPUT_FILE" "${INCLUDES[@]}"

echo ""
echo "✓ Created: $OUTPUT_FILE"
echo "  Size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo "  Contents (top-level):"
unzip -l "$OUTPUT_FILE" | awk 'NR>3 && $4 ~ /\// {split($4,a,"/"); print "    "a[1]"/"}' | sort -u | head -20
