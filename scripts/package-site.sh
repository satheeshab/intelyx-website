#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Builds a clean folder containing ONLY the website files, ready to upload to S3.
#
#   ./scripts/package-site.sh [output-folder]      (default: ./s3-upload)
#
# - Copies an allow-list of website files (never backend, infra, scripts, docs,
#   brand files or git data).
# - Replaces every ?v=... in the HTML with the current commit ID, so browsers
#   fetch fresh CSS/JS after each upload.
# - Used by deploy-site.sh (automatic deploys) and for manual uploads.
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT="${1:-s3-upload}"

# Safety: only wipe the default output folder or an empty/new one.
if [[ -d "$OUT" && -n "$(ls -A "$OUT")" ]]; then
  if [[ "$(basename "$OUT")" == "s3-upload" ]]; then
    rm -rf "$OUT"
  else
    echo "✗ '$OUT' exists and is not empty. Choose an empty folder." >&2
    exit 1
  fi
fi
mkdir -p "$OUT"

# ----- Copy the website files (allow-list) ----------------------------------
cp ./*.html "$OUT"/
cp favicon.svg robots.txt sitemap.xml "$OUT"/
mkdir -p "$OUT/assets"
cp -R assets/css assets/js assets/img "$OUT/assets/"
find "$OUT" -name ".DS_Store" -delete

# ----- Sanity checks ---------------------------------------------------------
for page in index.html about.html products.html contact.html 404.html privacy.html terms.html; do
  [[ -f "$OUT/$page" ]] || { echo "✗ Missing $page" >&2; exit 1; }
done

# ----- Cache-busting version stamp ------------------------------------------
VERSION="$(git rev-parse --short=10 HEAD 2>/dev/null || date +%Y%m%d%H%M%S)"
for f in "$OUT"/*.html; do
  sed -i.bak -E "s/\?v=[A-Za-z0-9._-]+/?v=${VERSION}/g" "$f" && rm -f "$f.bak"
done

echo "→ Packaged $(find "$OUT" -type f | wc -l | tr -d ' ') files into '$OUT' (version ${VERSION})"
if grep -q "REPLACE_WITH" "$OUT/assets/js/config.js"; then
  echo "! Note: assets/js/config.js still has the placeholder API URL."
  echo "  The enquiry form will show the 'email us directly' fallback until it is set."
fi
