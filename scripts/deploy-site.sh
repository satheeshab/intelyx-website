#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Deploys the static site to S3 and invalidates CloudFront.
#
#   ./scripts/deploy-site.sh <bucket-name> <cloudfront-distribution-id>
#
# Uploads only website files (never /backend, /infra, /scripts, README, etc.)
# and sets cache headers: 1 year for versioned CSS/JS, 30 days for images,
# 1 day for favicon/robots/sitemap and 5 minutes for HTML.
# After changing any CSS or JS file, bump ?v= in the HTML (see README).
# Used by README instructions and by .github/workflows/deploy.yml.
# ---------------------------------------------------------------------------
set -euo pipefail

BUCKET="${1:?Usage: deploy-site.sh <bucket> <distribution-id>}"
DISTRIBUTION_ID="${2:?Usage: deploy-site.sh <bucket> <distribution-id>}"

cd "$(dirname "$0")/.."

# Never upload these
EXCLUDES=(
  --exclude ".git/*" --exclude ".github/*" --exclude "backend/*" --exclude "infra/*"
  --exclude "scripts/*" --exclude "email-signature/*" --exclude "node_modules/*"
  --exclude "README.md" --exclude ".gitignore" --exclude "*.DS_Store" --exclude ".aws-sam/*"
)

echo "→ CSS and JS (1-year cache; HTML references them with ?v=<version>)"
aws s3 sync ./assets "s3://${BUCKET}/assets" --delete \
  --exclude "*" --include "css/*" --include "js/*" \
  --cache-control "public, max-age=31536000, immutable"

echo "→ Images (30-day cache)"
aws s3 sync ./assets "s3://${BUCKET}/assets" --delete \
  --exclude "*" --include "img/*" --exclude "*.DS_Store" \
  --cache-control "public, max-age=2592000"

echo "→ Root files: favicon, robots.txt, sitemap.xml (1-day cache)"
aws s3 sync . "s3://${BUCKET}" "${EXCLUDES[@]}" \
  --exclude "*" --include "favicon.svg" --include "robots.txt" --include "sitemap.xml" \
  --cache-control "public, max-age=86400"

echo "→ HTML pages (5-minute cache)"
aws s3 sync . "s3://${BUCKET}" --delete \
  --exclude "*" --include "*.html" "${EXCLUDES[@]}" \
  --content-type "text/html; charset=utf-8" \
  --cache-control "public, max-age=300, must-revalidate"

echo "→ CloudFront invalidation"
aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths "/*" \
  --query 'Invalidation.{Id:Id,Status:Status}' --output table

echo "✓ Deployed to s3://${BUCKET}"
