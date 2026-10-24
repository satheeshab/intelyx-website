#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Deploys the static website to S3 and invalidates CloudFront.
#
#   ./scripts/deploy-site.sh <bucket-name> <cloudfront-distribution-id>
#   DRY_RUN=1 ./scripts/deploy-site.sh       # build the upload folder only (no AWS calls)
#
# What it does
#   1. Copies ONLY website files into a temporary folder (allow-list below), so
#      backend code, infrastructure, docs and brand files can never be uploaded.
#   2. Stamps every ?v=... in the HTML with the current git commit, so browsers
#      always fetch fresh CSS/JS after a deploy (no manual version bumps).
#   3. Uploads with cache headers: 1 year for CSS/JS (versioned), 30 days for
#      images, 1 day for favicon/robots/sitemap, 5 minutes for HTML.
#      --delete removes files from the bucket that no longer exist in the site.
#   4. Invalidates the CloudFront cache.
#
# Used by .github/workflows/deploy.yml after every merge to main.
# ---------------------------------------------------------------------------
set -euo pipefail

DRY_RUN="${DRY_RUN:-0}"
if [[ "$DRY_RUN" != "1" ]]; then
  BUCKET="${1:?Usage: deploy-site.sh <bucket> <distribution-id>}"
  DISTRIBUTION_ID="${2:?Usage: deploy-site.sh <bucket> <distribution-id>}"
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ----- 1. Stage the website files (allow-list) ------------------------------
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cp ./*.html "$STAGE"/
cp favicon.svg robots.txt sitemap.xml "$STAGE"/
mkdir -p "$STAGE/assets"
cp -R assets/css assets/js assets/img "$STAGE/assets/"
find "$STAGE" -name ".DS_Store" -delete

# Basic sanity checks before anything is uploaded
for page in index.html 404.html contact.html; do
  [[ -f "$STAGE/$page" ]] || { echo "✗ Missing $page"; exit 1; }
done
if grep -q "REPLACE_WITH" "$STAGE/assets/js/config.js"; then
  echo "! Note: assets/js/config.js still has the placeholder API URL."
  echo "  The enquiry form will show the 'email us directly' fallback until it is set."
fi

# ----- 2. Cache-busting version stamp ---------------------------------------
VERSION="$(git rev-parse --short=10 HEAD 2>/dev/null || date +%Y%m%d%H%M%S)"
for f in "$STAGE"/*.html; do
  sed -i.bak -E "s/\?v=[A-Za-z0-9._-]+/?v=${VERSION}/g" "$f" && rm -f "$f.bak"
done
echo "→ Version stamp: ?v=${VERSION}"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "→ DRY RUN: files that would be uploaded:"
  (cd "$STAGE" && find . -type f | sed 's|^\./|   |' | sort)
  exit 0
fi

# ----- 3. Upload -------------------------------------------------------------
echo "→ CSS and JS (1-year cache)"
aws s3 sync "$STAGE/assets" "s3://${BUCKET}/assets" --delete --only-show-errors \
  --exclude "*" --include "css/*" --include "js/*" \
  --cache-control "public, max-age=31536000, immutable"

echo "→ Images (30-day cache)"
aws s3 sync "$STAGE/assets" "s3://${BUCKET}/assets" --delete --only-show-errors \
  --exclude "*" --include "img/*" \
  --cache-control "public, max-age=2592000"

echo "→ favicon, robots.txt, sitemap.xml (1-day cache)"
aws s3 sync "$STAGE" "s3://${BUCKET}" --only-show-errors \
  --exclude "*" --include "favicon.svg" --include "robots.txt" --include "sitemap.xml" \
  --cache-control "public, max-age=86400"

echo "→ HTML pages (5-minute cache)"
aws s3 sync "$STAGE" "s3://${BUCKET}" --delete --only-show-errors \
  --exclude "*" --include "*.html" \
  --content-type "text/html; charset=utf-8" \
  --cache-control "public, max-age=300, must-revalidate"

# Remove anything else left in the bucket from older deploys (e.g. a stray
# top-level folder). Everything the site needs was uploaded above.
aws s3 sync "$STAGE" "s3://${BUCKET}" --delete --only-show-errors --size-only \
  --exclude "assets/*"

# ----- 4. CloudFront invalidation -------------------------------------------
echo "→ CloudFront invalidation"
aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths "/*" \
  --query 'Invalidation.{Id:Id,Status:Status}' --output table

echo "✓ Deployed version ${VERSION} to s3://${BUCKET}"
