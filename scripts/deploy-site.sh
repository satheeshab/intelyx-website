#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Deploys the static website to S3 and invalidates CloudFront.
#
#   ./scripts/deploy-site.sh <bucket-name> <cloudfront-distribution-id>
#   DRY_RUN=1 ./scripts/deploy-site.sh       # build the upload folder only (no AWS calls)
#
# What it does
#   1. Copies ONLY website files into a temporary folder (scripts/package-site.sh), so
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

# ----- 1+2. Stage the website files and stamp versions -----------------------
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
./scripts/package-site.sh "$STAGE"

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

echo "✓ Deployed commit $(git rev-parse --short=10 HEAD 2>/dev/null || echo unknown) to s3://${BUCKET}"
