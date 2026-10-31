# Deploying to AWS Lightsail

The website runs as **one container** on an **AWS Lightsail container service**: the Node.js server
serves the React app and handles the enquiry form. After the one-time setup below, **every merge to
`main` deploys automatically** through GitHub Actions.

```
 You merge a pull request into main
              │
              ▼
 GitHub Actions  ── 1. runs the tests and builds the site
 (.github/workflows/deploy.yml)  2. builds the Docker image and smoke-tests it
              │                  3. pushes the image to Lightsail
              │                  4. creates a new deployment, waits until it is healthy
              ▼                  5. checks the live site
 Lightsail container service  ──►  https://www.intelyx.co.in   (HTTPS handled by Lightsail)
              │
              └─ enquiry form ──►  Amazon SES (SMTP)  ──►  office@intelyx.co.in
```

If a new version fails its health check, Lightsail keeps serving the previous version and the
workflow turns red. Visitors never see a broken release.

**Cost:** a Lightsail container service starts at about US$7 per month (*Nano*, 0.25 vCPU, 512 MB).
Check the current price on the Lightsail pricing page. SES, GitHub Actions and the free HTTPS
certificate add little or nothing for a site this size.

**One-time setup, about 45 minutes:**

| Step | What | Where |
|---|---|---|
| 1 | Email sending (SES) | AWS console + GoDaddy DNS |
| 2 | Create the Lightsail container service | AWS CloudShell |
| 3 | Let GitHub deploy to AWS | AWS CloudShell + GitHub settings |
| 4 | First deploy | GitHub Actions |
| 5 | Custom domain `www.intelyx.co.in` with HTTPS | AWS CloudShell + GoDaddy DNS |

> **Region:** everything uses **ap-south-1 (Mumbai)**.
> **AWS CloudShell:** the `>_` icon in the top bar of the AWS console. It already has the AWS CLI,
> and you can paste commands straight into it. Make sure the region at the top right says **Mumbai**.
>
> **GoDaddy DNS:** My Products → `intelyx.co.in` → **DNS**. In the *Name* field GoDaddy adds
> `.intelyx.co.in` itself, so for `abc._domainkey.intelyx.co.in` type only `abc._domainkey`.
> Leave your existing `MX` records and the `v=spf1` TXT record on `@` alone: your GoDaddy mailbox
> depends on them.

---

## Step 1: Email sending (Amazon SES)

The server sends each enquiry through Amazon SES over SMTP. (Any SMTP service works. See
[Using another email service](#using-another-email-service) at the end.)

### 1a. Verify your domain in SES

In CloudShell:

```bash
export AWS_REGION=ap-south-1

# Register the domain; prints the 3 DKIM records to add at GoDaddy
aws sesv2 create-email-identity --email-identity intelyx.co.in \
  --query 'DkimAttributes.Tokens' --output text | tr '\t' '\n' | \
  while read t; do echo "CNAME  ${t}._domainkey  ->  ${t}.dkim.amazonses.com"; done

# Use mail.intelyx.co.in for bounces (keeps GoDaddy's SPF record untouched)
aws sesv2 put-email-identity-mail-from-attributes --email-identity intelyx.co.in \
  --mail-from-domain mail.intelyx.co.in --behavior-on-mx-failure USE_DEFAULT_VALUE

# Verify the inbox that receives enquiries (click the link in the email it sends you)
aws sesv2 create-email-identity --email-identity office@intelyx.co.in
```

Add these records at GoDaddy (**Add New Record**):

| Type | Name | Value | Notes |
|---|---|---|---|
| CNAME | `<token1>._domainkey` | `<token1>.dkim.amazonses.com` | from the output above |
| CNAME | `<token2>._domainkey` | `<token2>.dkim.amazonses.com` | |
| CNAME | `<token3>._domainkey` | `<token3>.dkim.amazonses.com` | |
| MX | `mail` | `feedback-smtp.ap-south-1.amazonses.com` | Priority `10` |
| TXT | `mail` | `v=spf1 include:amazonses.com ~all` | on `mail` only, **not** on `@` |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:office@intelyx.co.in` | skip if `_dmarc` already exists |

Check progress (both should say `SUCCESS` within about an hour):

```bash
aws sesv2 get-email-identity --email-identity intelyx.co.in \
  --query '{DKIM:DkimAttributes.Status, MailFrom:MailFromAttributes.MailFromDomainStatus}'
```

### 1b. Create SMTP credentials

1. AWS console → **Amazon SES** (region Mumbai) → **SMTP settings** → **Create SMTP credentials**.
2. Accept the suggested user name and click **Create user**.
3. **Download the credentials file or copy the SMTP user name and password now.** AWS shows the
   password only once. Treat it like a password: it goes into GitHub as a **secret** in step 3.
4. Note the **SMTP endpoint** on that page. It should be `email-smtp.ap-south-1.amazonaws.com`.

### 1c. Production access (optional, for customer acknowledgement emails)

New SES accounts are in a "sandbox" that can only send to verified addresses. That is enough for
enquiries to `office@intelyx.co.in`. To email visitors (`SEND_ACK=true`), request production
access: SES → **Account dashboard** → **Request production access** (mail type *Transactional*,
website `https://www.intelyx.co.in`, use case "website enquiry notifications and acknowledgements").

---

## Step 2: Create the Lightsail container service

```bash
aws lightsail create-container-service \
  --service-name intelyx-web \
  --power nano \
  --scale 1 \
  --region ap-south-1
```

(Or in the console: **Lightsail → Containers → Create container service**, region Mumbai, capacity
*Nano × 1*, name `intelyx-web`, and skip the "Set up your first deployment" section.)

Wait until it is ready (about 2 to 5 minutes):

```bash
aws lightsail get-container-services --service-name intelyx-web --region ap-south-1 \
  --query 'containerServices[0].{state:state,url:url}' --output table
```

When `state` shows `READY`, continue. Note the `url`, e.g.
`https://intelyx-web.xxxxxxxxxxxx.ap-south-1.cs.amazonlightsail.com/`. That works over HTTPS straight away.

---

## Step 3: Let GitHub deploy to AWS

GitHub signs in to AWS with short-lived tokens (OIDC), so **no AWS access keys are stored in GitHub**.

### 3a. Create the deploy role (one command)

In CloudShell, get the code and run the helper:

```bash
git clone https://github.com/satheeshab/intelyx-website.git
cd intelyx-website
./deploy/create-github-role.sh satheeshab/intelyx-website
```

The script reuses your account's existing GitHub sign-in provider if there is one (your AWS account
is shared with other projects), creates a role that **only this repository's `production`
environment can use**, and prints the role's ARN. Copy it. If the repository is private, use a
[personal access token](https://github.com/settings/tokens) as the password when cloning, or run
the commands from the downloaded ZIP instead.

### 3b. Add the settings in GitHub

Repository → **Settings**:

1. **Environments → New environment** → name it exactly `production`. Under *Deployment
   branches and tags* choose **Selected branches and tags** and add `main`. (Optional: add yourself
   under *Required reviewers* to approve each deploy.)
2. **Secrets and variables → Actions → Variables → New repository variable**:

   | Name | Value |
   |---|---|
   | `AWS_DEPLOY_ROLE_ARN` | the ARN printed in step 3a |

   Optional variables (the defaults are shown): `AWS_REGION` = `ap-south-1`, `LIGHTSAIL_SERVICE` =
   `intelyx-web`, `SMTP_HOST` = `email-smtp.ap-south-1.amazonaws.com`, `TO_EMAIL` =
   `office@intelyx.co.in`, `FROM_EMAIL` = `no-reply@intelyx.co.in`, `FROM_NAME` = `Intelyx Website`,
   `SEND_ACK` = `false`.

3. **Secrets and variables → Actions → Secrets → New repository secret**:

   | Name | Value |
   |---|---|
   | `SMTP_USER` | the SMTP user name from step 1b |
   | `SMTP_PASS` | the SMTP password from step 1b |

   > The deploy copies these into the Lightsail deployment's environment, which anyone with access
   > to your Lightsail console can read. That is why step 1b creates a **dedicated SES user**:
   > it can only send email, and you can rotate its password at any time (create new credentials in
   > SES, update the GitHub secret, re-run the workflow).

---

## Step 4: First deploy

Merge the pull request into `main` (or open **Actions → Test and deploy → Run workflow**). In the
**Actions** tab you'll see two jobs: *Test and build*, then *Deploy to Lightsail*. It takes about
5 to 8 minutes. When it finishes, the run summary shows your service URL. Open it and test the
contact form: an email should arrive at `office@intelyx.co.in`.

---

## Step 5: Custom domain with HTTPS

Lightsail issues a free certificate for `www.intelyx.co.in`.

### 5a. Request the certificate

```bash
aws lightsail create-certificate --region ap-south-1 \
  --certificate-name intelyx-cert --domain-name www.intelyx.co.in

# Show the validation record to add at GoDaddy
aws lightsail get-certificates --region ap-south-1 --certificate-name intelyx-cert \
  --include-certificate-details \
  --query 'certificates[0].certificateDetail.domainValidationRecords[0].resourceRecord' --output table
```

Add the shown **CNAME** record at GoDaddy (Name without `.intelyx.co.in`, Value without a trailing
dot). Keep it forever. Check until the status is `ISSUED` (usually 5 to 30 minutes):

```bash
aws lightsail get-certificates --region ap-south-1 --certificate-name intelyx-cert \
  --query 'certificates[0].certificateDetail.status' --output text
```

### 5b. Attach the domain to the service

```bash
aws lightsail update-container-service --region ap-south-1 --service-name intelyx-web \
  --public-domain-names '{"intelyx-cert":["www.intelyx.co.in"]}'
```

### 5c. Point GoDaddy at it

Edit the existing `www` record in GoDaddy DNS:

| Type | Name | Value |
|---|---|---|
| CNAME | `www` | the service URL **without** `https://` and the trailing `/`, e.g. `intelyx-web.xxxxxxxxxxxx.ap-south-1.cs.amazonlightsail.com` |

For the bare domain `intelyx.co.in`, GoDaddy can't point it at the container, so use
**DNS → Forwarding → Add forwarding**: forward `intelyx.co.in` to `https://www.intelyx.co.in`
(Permanent 301, *Forward only*). The app also redirects the bare domain to `www` if a request ever
reaches it.

After about 10 minutes, `https://www.intelyx.co.in` shows the site with a padlock.
(On some GoDaddy plans `https://intelyx.co.in` shows a certificate warning because GoDaddy's
forwarding has no certificate for it. Moving DNS to Route 53 later would fix that.)

---

## Day to day

- **Deploy:** merge a pull request into `main`. Pull requests run the tests and build the container
  but never deploy.
- **Roll back:** revert the pull request on GitHub (**Revert** button) and merge the revert. That
  deploys the previous code. You can also redeploy an older version in the Lightsail console
  (Containers → `intelyx-web` → **Deployments**).
- **Logs** (Lightsail console → Containers → `intelyx-web` → **Logs**, or):
  ```bash
  aws lightsail get-container-log --region ap-south-1 --service-name intelyx-web --container-name web
  ```
  The server logs one JSON line per event and never logs names, phone numbers or messages.
- **Change email settings:** edit the GitHub variables/secrets and re-run the workflow
  (**Actions → Run workflow**). They are applied on each deploy.
- **More capacity:** Lightsail console → Containers → `intelyx-web` → **Capacity**
  (e.g. *Micro* or scale 2). No code change needed.
- **Image storage:** each deploy registers a new image in Lightsail, which keeps the most recent
  ones automatically.

## Run the production container on your own computer

```bash
docker build -t intelyx-web .
docker run --rm -p 8080:8080 -e ALLOW_LOG_EMAIL=true intelyx-web
# open http://localhost:8080  (emails are printed in the container log instead of being sent)
```

On an Apple Silicon Mac add `--platform linux/amd64` to `docker build`, because Lightsail runs amd64.

## Troubleshooting

| What you see | What to do |
|---|---|
| Workflow says **"Deploy skipped"** | The `AWS_DEPLOY_ROLE_ARN` variable is missing (step 3b). |
| **"Not authorized to perform sts:AssumeRoleWithWebIdentity"** | The `production` environment doesn't exist, doesn't allow `main`, or the repository name given to `create-github-role.sh` differs from the actual `owner/repo`. Re-run the script with the exact name. |
| **AccessDenied** for a `lightsail:` action | Add the named action to the `deploy-to-lightsail` policy of the `intelyx-github-deploy` role (`deploy/github-deploy-policy.json` lists the current ones). |
| **"Container service … is 'DISABLED' / 'DEPLOYING'"** | Wait until it is `READY` or `RUNNING` (step 2). |
| Workflow error **"Add the SMTP_USER and SMTP_PASS secrets"** | Step 3b, secrets. |
| Deployment **FAILED** | The new container didn't pass `/healthz`. Open the logs. The most common cause is a missing or wrong email setting: the server refuses to start in production without working SMTP settings, and says so in the log. The previous version keeps running. |
| Form says it could not send | SES identity isn't `SUCCESS` yet, `office@intelyx.co.in` wasn't verified (step 1), or the SMTP credentials are wrong. The log shows `enquiry_send_failed` with the reason. |
| Certificate stays `PENDING_VALIDATION` | The validation CNAME at GoDaddy is missing, or the full domain was typed in the *Name* field. |
| Site shows the old version | Hard-refresh (Ctrl/Cmd + Shift + R). Pages are sent with `no-cache`, and the CSS/JS files have new names on every build. |

## Using another email service

Any SMTP service works. Set `SMTP_HOST`, `SMTP_USER` and `SMTP_PASS` (and `SMTP_PORT` if it isn't
587; port 465 uses SSL automatically). For example, your GoDaddy mailbox:
`SMTP_HOST=smtpout.secureserver.net`, `SMTP_PORT=465`, with the mailbox address and password. Set
`FROM_EMAIL` to the same mailbox, since GoDaddy only sends from addresses it hosts. GoDaddy
limits how many emails you can send per day and may throttle mail from cloud servers. SES is the
more dependable choice for a website.
