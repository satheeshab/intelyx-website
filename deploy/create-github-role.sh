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
  # A provider created by another project may not accept the audience the AWS action uses.
  # Without it, AWS answers "Not authorized to perform sts:AssumeRoleWithWebIdentity".
  if ! aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$PROVIDER" \
       --query 'ClientIDList' --output text | tr '\t' '\n' | grep -qx 'sts.amazonaws.com'; then
    aws iam add-client-id-to-open-id-connect-provider \
      --open-id-connect-provider-arn "$PROVIDER" --client-id sts.amazonaws.com
    echo "→ Added the audience sts.amazonaws.com to the provider"
  fi
else
  aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 >/dev/null
  echo "→ Created the GitHub sign-in provider"
fi

# 2. The role (trust policy filled in from the template)
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
# GitHub names the repository in its sign-in token either as "repo:owner/name" or, for repositories
# using immutable subjects, as "repo:owner@<id>/name@<id>". Ask GitHub which one this repository
# uses; the role trusts both forms. A private repository needs GITHUB_TOKEN set to read this.
SUB_PREFIX="$(curl -fsS ${GITHUB_TOKEN:+-H "Authorization: Bearer $GITHUB_TOKEN"} \
  "https://api.github.com/repos/${REPO}/actions/oidc/customization/sub" 2>/dev/null \
  | jq -r '.sub_claim_prefix // empty' 2>/dev/null || true)"
if [[ -z "$SUB_PREFIX" ]]; then
  SUB_PREFIX="repo:${REPO}"
  echo "→ Could not read the token format from GitHub; trusting repo:${REPO} only"
fi
echo "→ GitHub identifies this repository as: ${SUB_PREFIX}"
sed -e "s|__ACCOUNT_ID__|${ACCOUNT}|g" -e "s|__GITHUB_REPO__|${REPO}|g" -e "s|__SUB_PREFIX__|${SUB_PREFIX}|g" \
  "$HERE/github-trust-policy.json" > "$TMP/trust.json"
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
echo "  The role trusts only:  ${SUB_PREFIX}:environment:production"
echo "                         repo:${REPO}:environment:production"
echo "  Provider audiences:    $(aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$PROVIDER" --query 'ClientIDList' --output text)"
echo
