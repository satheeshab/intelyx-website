#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Creates the AWS role that GitHub Actions uses to deploy (no access keys needed).
# Safe to run more than once. Run it in AWS CloudShell or anywhere the AWS CLI is signed in.
#
#   ./deploy/create-github-role.sh <github-owner/repo> [region] [role-name]
#   ./deploy/create-github-role.sh satheeshab/intelyx-website
#
# What it does
#   1. Adds GitHub as a trusted sign-in provider (OIDC), or reuses it if the account already has it.
#   2. Creates the role. Only workflows of THIS repository running in the "production"
#      environment can use it.
#   3. Gives the role the few Lightsail permissions needed to push an image and deploy it.
# ---------------------------------------------------------------------------
set -euo pipefail

REPO="${1:?Usage: create-github-role.sh <github-owner/repo> [region] [role-name]}"
REGION="${2:-ap-south-1}"
ROLE="${3:-intelyx-github-deploy}"
HERE="$(cd "$(dirname "$0")" && pwd)"

if [[ ! "$REPO" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  echo "✗ '$REPO' is not in the form owner/repo" >&2; exit 1
fi

ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
PROVIDER="arn:aws:iam::${ACCOUNT}:oidc-provider/token.actions.githubusercontent.com"
echo "→ AWS account ${ACCOUNT}, region ${REGION}"

# 1. GitHub as a trusted identity provider (an account can only have one)
if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$PROVIDER" >/dev/null 2>&1; then
  echo "→ GitHub sign-in provider already exists: reusing it"
else
  aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 >/dev/null
  echo "→ Created the GitHub sign-in provider"
fi

# 2. The role (trust policy filled in from the template)
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
sed -e "s|__ACCOUNT_ID__|${ACCOUNT}|g" -e "s|__GITHUB_REPO__|${REPO}|g" "$HERE/github-trust-policy.json" > "$TMP/trust.json"
if aws iam get-role --role-name "$ROLE" >/dev/null 2>&1; then
  aws iam update-assume-role-policy --role-name "$ROLE" --policy-document "file://$TMP/trust.json"
  echo "→ Updated the trust policy of existing role ${ROLE}"
else
  aws iam create-role --role-name "$ROLE" --max-session-duration 3600 \
    --description "GitHub Actions deploys the Intelyx website to Lightsail" \
    --assume-role-policy-document "file://$TMP/trust.json" >/dev/null
  echo "→ Created role ${ROLE}"
fi

# 3. Permissions
sed -e "s|__REGION__|${REGION}|g" "$HERE/github-deploy-policy.json" > "$TMP/permissions.json"
aws iam put-role-policy --role-name "$ROLE" --policy-name deploy-to-lightsail --policy-document "file://$TMP/permissions.json"

ARN="$(aws iam get-role --role-name "$ROLE" --query Role.Arn --output text)"
echo
echo "✓ Done. Add this as the GitHub variable AWS_DEPLOY_ROLE_ARN:"
echo
echo "    ${ARN}"
echo
