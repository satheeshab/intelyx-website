# Deploying intelyx.co.in to AWS

This guide is for this setup:

- **DNS and email stay at GoDaddy.** No DNS move. Your existing GoDaddy mailbox keeps working.
- **The AWS account already runs other things.** Every name used here is specific to Intelyx,
  and an existing GitHub connection in the account is reused rather than duplicated.
- **GitHub deploys the website automatically after every merge to `main`.**
  The infrastructure and the email backend are set up **once, by hand**, using the steps below.

Allow about an hour, plus waiting time for DNS (usually minutes, occasionally a few hours).

```
One-time (you)                                     Every merge to main (automatic)
──────────────                                     ───────────────────────────────
1. SES email setup        (ap-south-1)             GitHub Actions
2. Email backend stack    (ap-south-1)               ├─ checks the site (links, files)
3. Website hosting stack  (us-east-1)                ├─ uploads it to S3
4. DNS records at GoDaddy                            ├─ clears the CloudFront cache
5. Connect GitHub to AWS                             └─ checks https://www.intelyx.co.in
```

---

## Before you start

1. **Merge the website pull request into `main`.** The first run of the
   *Deploy website* workflow will say *"Deploy skipped"*; that's expected until step 5.
2. **Sign in to the AWS console** with a user that can create IAM roles, CloudFormation
   stacks, S3, CloudFront, ACM, Lambda, API Gateway and SES (an administrator is simplest).
3. **Open AWS CloudShell:** the `>_` icon in the top bar of the AWS console. It already has the
   AWS CLI, SAM CLI, Node.js and git.
4. **Get the code into CloudShell:**
   ```bash
   git clone https://github.com/satheeshab/intelyx-website.git
   cd intelyx-website
   ```
   If the repository is private, either use a GitHub
   [personal access token](https://github.com/settings/tokens) as the password, or download the
   ZIP from GitHub (**Code → Download ZIP**), upload it with CloudShell's **Actions → Upload file**,
   then `unzip intelyx-website-main.zip && cd intelyx-website-main`.
5. **Open GoDaddy DNS** in another tab: GoDaddy → **My Products** → `intelyx.co.in` →
   **DNS** (*Manage DNS*).

> **GoDaddy tip:** in the *Name* field GoDaddy adds `.intelyx.co.in` for you. When AWS shows a
> name like `abc123._domainkey.intelyx.co.in`, type only `abc123._domainkey`. Remove any
> trailing dot from values.
>
> **Don't change** your existing `MX` records, the `TXT` record on `@` that starts with
> `v=spf1` (GoDaddy email needs it), or anything else these steps don't mention.

---

## Step 1: Email sending (Amazon SES, Mumbai)

Run in CloudShell:

```bash
export AWS_REGION=ap-south-1

# 1a. Register the domain with SES and print the 3 DKIM records to add at GoDaddy
aws sesv2 create-email-identity --email-identity intelyx.co.in \
  --query 'DkimAttributes.Tokens' --output text | tr '\t' '\n' | \
  while read t; do echo "CNAME  ${t}._domainkey  ->  ${t}.dkim.amazonses.com"; done

# 1b. Use mail.intelyx.co.in as the bounce domain (keeps GoDaddy's SPF untouched)
aws sesv2 put-email-identity-mail-from-attributes --email-identity intelyx.co.in \
  --mail-from-domain mail.intelyx.co.in --behavior-on-mx-failure USE_DEFAULT_VALUE

# 1c. Verify the inbox that receives enquiries (click the link in the email it sends)
aws sesv2 create-email-identity --email-identity office@intelyx.co.in
```

**Add these records at GoDaddy** (DNS → **Add New Record**):

| Type | Name | Value | Notes |
|---|---|---|---|
| CNAME | `<token1>._domainkey` | `<token1>.dkim.amazonses.com` | from step 1a output |
| CNAME | `<token2>._domainkey` | `<token2>.dkim.amazonses.com` | |
| CNAME | `<token3>._domainkey` | `<token3>.dkim.amazonses.com` | |
| MX | `mail` | `feedback-smtp.ap-south-1.amazonses.com` | Priority `10` |
| TXT | `mail` | `v=spf1 include:amazonses.com ~all` | Only on `mail`, not on `@` |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:office@intelyx.co.in` | **Skip if a `_dmarc` record already exists** |

Check progress (both should say `SUCCESS` within about an hour):

```bash
aws sesv2 get-email-identity --email-identity intelyx.co.in \
  --query '{DKIM:DkimAttributes.Status, MailFrom:MailFromAttributes.MailFromDomainStatus}'
```

**Optional, for acknowledgement emails to customers:** request SES production access
(SES console → **Account dashboard → Request production access**; choose *Transactional*,
website `https://www.intelyx.co.in`, and describe "website enquiry form notifications").
Enquiries to `office@intelyx.co.in` work without it.

---

## Step 2: Email backend (API + Lambda, Mumbai)

```bash
cd infra
sam build
sam deploy --guided --region ap-south-1
```

Press **Enter** to accept each default (stack `intelyx-enquiry-api`, runtime `nodejs24.x`,
`SendAck=false`). Answer **y** to *"Allow SAM CLI IAM role creation"* and to
*"Save arguments to configuration file"*.

When it finishes, note the two outputs:

- **`EnquiryApiUrl`**, e.g. `https://abc123xyz.execute-api.ap-south-1.amazonaws.com/enquiry`
- **`ApiOrigin`**, e.g. `https://abc123xyz.execute-api.ap-south-1.amazonaws.com`

Quick test (should print `{"ok":true}`, and an email arrives at office@intelyx.co.in):

```bash
curl -s -X POST "<EnquiryApiUrl>" -H "Origin: https://www.intelyx.co.in" \
  -H "Content-Type: application/json" \
  -d '{"enquiryType":"general","name":"Deploy Test","email":"office@intelyx.co.in","phone":"9380577396","product":"other","message":"Testing the website enquiry API.","consent":true}'
cd ..
```

**Point the website form at it:** in GitHub, edit `assets/js/config.js` and replace the
`enquiryApiUrl` value with your `EnquiryApiUrl`, then commit to `main` (or merge it in a pull
request). Once step 5 is done, that merge deploys automatically.

---

## Step 3: Website hosting (S3 + CloudFront, N. Virginia)

CloudFront only accepts SSL certificates from **us-east-1**, so this stack lives there.

**First, check whether the account already trusts GitHub** (because the account is shared):

```bash
aws iam list-open-id-connect-providers --query 'OpenIDConnectProviderList[].Arn' --output text \
  | tr '\t' '\n' | grep -q token.actions.githubusercontent.com \
  && echo "EXISTS: use CreateGitHubOidcProvider=false" \
  || echo "NOT FOUND: use CreateGitHubOidcProvider=true"
```

**Create the stack** (replace the two values in `<...>`):

```bash
aws cloudformation create-stack --region us-east-1 \
  --stack-name intelyx-website \
  --template-body file://infra/hosting.yaml \
  --capabilities CAPABILITY_IAM \
  --parameters \
    ParameterKey=DomainName,ParameterValue=intelyx.co.in \
    ParameterKey=ApiOrigin,ParameterValue=<ApiOrigin from step 2> \
    ParameterKey=GitHubRepository,ParameterValue=satheeshab/intelyx-website \
    ParameterKey=GitHubBranch,ParameterValue=main \
    ParameterKey=CreateGitHubOidcProvider,ParameterValue=<true or false from the check above>
```

The stack now **waits for you to prove you own the domain**. After about a minute, print the
two SSL validation records:

```bash
CERT=$(aws acm list-certificates --region us-east-1 \
  --query "CertificateSummaryList[?DomainName=='www.intelyx.co.in'].CertificateArn | [0]" --output text)
aws acm describe-certificate --region us-east-1 --certificate-arn "$CERT" \
  --query 'Certificate.DomainValidationOptions[].ResourceRecord.[Name,Value]' --output table
```

**Add both as CNAME records at GoDaddy.** For a name like
`_3f2a1b.www.intelyx.co.in.` type `_3f2a1b.www`; for `_9c8d7e.intelyx.co.in.` type `_9c8d7e`.
Paste the value without the trailing dot. **Keep these records forever**: they let the
certificate renew itself every year.

Wait for the stack to finish (usually 10 to 30 minutes after the records are added):

```bash
aws cloudformation wait stack-create-complete --region us-east-1 --stack-name intelyx-website
aws cloudformation describe-stacks --region us-east-1 --stack-name intelyx-website \
  --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' --output table
```

Note **`BucketName`**, **`DistributionId`**, **`DistributionDomainName`** and
**`GitHubDeployRoleArn`**.

---

## Step 4: Point the domain at the website (GoDaddy)

**`www.intelyx.co.in`:** GoDaddy already has a `www` CNAME (pointing to `@`). **Edit** it:

| Type | Name | Value |
|---|---|---|
| CNAME | `www` | `<DistributionDomainName>` (e.g. `d1a2b3c4d5e6f7.cloudfront.net`) |

**`intelyx.co.in` (without www):** GoDaddy can't point the bare domain at CloudFront, so
forward it instead: **DNS → Forwarding → Add forwarding** on the domain:

- Forward to: `https://www.intelyx.co.in`
- Type: **Permanent (301)**, setting: **Forward only**

This only replaces the website records on `@`; your `MX` (email) records are not affected.

After about 10 minutes, check:

- `https://www.intelyx.co.in` shows the site with a padlock.
- `http://intelyx.co.in` ends up at `https://www.intelyx.co.in`.
- `https://intelyx.co.in`: if the browser shows a certificate warning, GoDaddy's forwarding
  isn't covering HTTPS on your plan. Most visitors use `www` or arrive from search results, so
  this is usually acceptable. The full fix is moving DNS to Route 53 later (README, section 7,
  Option A).

---

## Step 5: Connect GitHub (automatic deploys)

In GitHub, open the repository **Settings**:

1. **Environments →** open `production` (GitHub creates it on the first workflow run), or
   click **New environment** and name it exactly `production`.
   Under **Deployment branches and tags**, choose **Selected branches and tags** and add `main`.
   (Optional: add yourself under **Required reviewers** to approve each deploy.)
2. **Secrets and variables → Actions → Variables tab → New repository variable**, add:

   | Name | Value |
   |---|---|
   | `AWS_DEPLOY_ROLE_ARN` | `GitHubDeployRoleArn` output |
   | `S3_BUCKET` | `BucketName` output |
   | `CLOUDFRONT_DISTRIBUTION_ID` | `DistributionId` output |

   These are identifiers, not passwords. GitHub signs in to AWS with short-lived tokens
   (OIDC), so no AWS keys are stored anywhere.
3. **Actions → Deploy website → Run workflow** (branch `main`) for the first deploy.

The run turns green in 1 to 2 minutes, and the summary links to the site.

---

## From now on

- **Every merge to `main` deploys the site.** Pull requests run the same checks first (all
  files present, no broken internal links) without deploying.
- Changes that only touch `backend/`, `infra/`, `brand/`, `email-signature/` or Markdown files
  don't trigger a deploy.
- **No more cache-busting by hand:** each deploy stamps CSS/JS links with the commit ID, so
  visitors always get the latest files.
- **Undo a bad change:** open the merged pull request in GitHub and click **Revert**, then
  merge the revert. That deploys the previous version. (S3 also keeps old file versions for
  90 days.)
- **Backend or infrastructure changes** are still manual: rerun step 2 (`sam build && sam deploy`)
  or update the hosting stack with `aws cloudformation deploy --region us-east-1
  --stack-name intelyx-website --template-file infra/hosting.yaml --capabilities CAPABILITY_IAM`
  (it keeps your earlier parameter values).

## If something goes wrong

| What you see | What to do |
|---|---|
| Workflow says **"Deploy skipped"** | One of the three GitHub variables is missing or misspelled (step 5). |
| **"Not authorized to perform sts:AssumeRoleWithWebIdentity"** | The `production` environment name or repository name doesn't match the stack's `GitHubRepository` value, or the `main` branch rule is missing. |
| **AccessDenied** on `s3 sync` | `S3_BUCKET` doesn't match the `BucketName` output. |
| Stack stuck on **Certificate** for over an hour | The two ACM CNAME records at GoDaddy are missing or have the full domain typed in the Name field. |
| Site shows the old version | Wait 2 minutes (cache clearing); then hard-refresh with Ctrl/Cmd + Shift + R. |
| Form says it can't send | `config.js` still has the placeholder, or `ApiOrigin` in the hosting stack doesn't match the API. |
| Enquiry emails don't arrive | Step 1 isn't `SUCCESS` yet, or office@ wasn't verified. Check the Lambda logs in CloudWatch (`/aws/lambda/intelyx-enquiry-api-...`). |
