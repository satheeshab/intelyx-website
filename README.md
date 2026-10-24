# Intelyx website

Marketing website for **Intelyx Tech Solutions LLP**, plus the serverless backend
that emails website enquiries to `office@intelyx.co.in`.

- **Frontend:** plain HTML5, CSS3 and vanilla JavaScript. No framework, no build step.
- **Hosting:** private Amazon S3 bucket behind Amazon CloudFront (HTTPS, HTTP/2 + HTTP/3).
- **Enquiry form:** Browser → API Gateway (HTTP API) → AWS Lambda (Node.js) → Amazon SES → `office@intelyx.co.in`.

```
                       ┌────────────────────────────── us-east-1 (global) ─────────────────────────────┐
 Visitor ── HTTPS ──▶  │ CloudFront ── CloudFront Function (apex→www, clean URLs) ── S3 bucket (OAC)    │
                       │     └─ ACM certificate · security headers · cache policies                     │
                       └────────────────────────────────────────────────────────────────────────────────┘
                       ┌────────────────────────────── ap-south-1 (Mumbai) ────────────────────────────┐
 Enquiry form ─ POST ▶ │ API Gateway HTTP API /enquiry ──▶ Lambda ──▶ Amazon SES ──▶ office@intelyx.co.in│
                       │   (CORS, 5 req/s, burst 10)       (validate,   (DKIM, SPF, DMARC)               │
                       │                                    sanitise)                                     │
                       └────────────────────────────────────────────────────────────────────────────────┘
```

**Tagline options** (option 1 is used on the site):

1. *Intelligent software for the way you run your business.* (chosen: clear, benefit-led and works for every audience)
2. *Run your institution with clarity, not complexity.*
3. *Dependable software for schools, hospitals and growing businesses.*

---

## Contents

1. [Project structure](#1-project-structure)
2. [Preview locally](#2-preview-locally)
3. [Editing content, colours and fonts](#3-editing-content-colours-and-fonts)
4. [Setting the API endpoint (config.js)](#4-setting-the-api-endpoint-configjs)
5. [Amazon SES setup](#5-amazon-ses-setup-ap-south-1)
6. [Deploy the enquiry backend](#6-deploy-the-enquiry-backend-sam)
7. [Hosting: S3 + CloudFront, custom domain and SSL](#7-hosting-s3--cloudfront-custom-domain-and-ssl)
8. [Deploy the website and invalidate the cache](#8-deploy-the-website-and-invalidate-the-cache)
9. [Optional: deploy from GitHub Actions (OIDC)](#9-optional-deploy-from-github-actions-oidc)
10. [Email signature](#10-email-signature)
11. [Testing checklist](#11-testing-checklist)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Project structure

```
/index.html              Home + products overview
/products.html           One section per product (#schools-erp, #hospitals-erp, #accounting, #service-booking)
/about.html              Who we are, mission, vision, values, journey
/contact.html            Contact details, map and the enquiry / demo form (#enquiry)
/privacy.html            Privacy Policy (placeholder draft, have it reviewed)
/terms.html              Terms of Service (placeholder draft, have it reviewed)
/404.html                Not-found page (served by CloudFront for missing paths)
/favicon.svg, /robots.txt, /sitemap.xml

/assets/css/style.css    All styles. Colours and fonts are CSS variables at the top.
/assets/js/theme-init.js Applies the saved light/dark theme before first paint; loads fonts
/assets/js/config.js     The enquiry API URL: the one place to edit after deploying the backend
/assets/js/main.js       Navigation, dropdown, theme toggle, scroll animations
/assets/js/enquiry.js    Enquiry form: pre-fill, validation, sending, success/error states
/assets/img/             Logo (SVG), email logo (PNG, 2x), Open Graph image, Apple touch icon

/backend/enquiry-lambda/ index.mjs (Lambda handler), signature.mjs (shared email signature),
                         test/ (unit tests), scripts/build-signature.mjs
/infra/template.yaml     AWS SAM template for the enquiry API (deploy in ap-south-1)
/infra/samconfig.toml    Defaults for `sam deploy`
/infra/hosting.yaml      CloudFormation for S3 + CloudFront + ACM + Route 53 (deploy in us-east-1)
/scripts/deploy-site.sh  Uploads the site to S3 with the right cache headers, then invalidates CloudFront
/.github/workflows/deploy.yml  Optional automatic deploy on push to main (GitHub OIDC)
/email-signature/        signature.html and signature.txt
```

Icons are inline SVG inside the HTML. There are no external images, scripts or stock photos;
the only third-party resources are Google Fonts and the Google Maps embed on the contact page.

## 2. Preview locally

Pages use root-relative paths (`/assets/...`), so open them through a local web server
rather than by double-clicking the file:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

`http://localhost:8080` (and `:5500` for VS Code Live Server) is already allowed by the API's
CORS settings, so you can test the real form against the deployed backend.

## 3. Editing content, colours and fonts

**Text.** All copy is plain HTML in each page, so search for the sentence you want to change.
Sections are marked with comments such as `<!-- ================= WHY INTELYX ================= -->`.
Items still to fill in are marked `EDIT ME` or `PLACEHOLDER`:

- `about.html`: "Our journey" milestones (`[Year]` placeholders)
- `contact.html`: business hours
- Footer of every page: social links (`href="#"`)
- `privacy.html`, `terms.html`: have them reviewed by a legal adviser and set the "Last updated" date

**Header and footer.** There is no build step, so the header and footer are repeated in every
page between `<!-- ============ HEADER ... -->` and `<!-- ============ FOOTER ... -->`.
When you change one, make the same change in all seven pages (search and replace works well).
Only the `aria-current="page"` attribute (the active menu item) differs between pages.

**Colours.** Edit the CSS variables at the top of `assets/css/style.css`:

| Variable | Light | Used for |
|---|---|---|
| `--color-ink` | `#0b1530` | Deep navy: headings, dark panels |
| `--color-accent` | `#14b8a6` | Teal accent (decorative: icons, highlights) |
| `--color-accent-strong` | `#0f766e` | Teal for buttons and links (passes WCAG AA on white) |
| `--color-bg`, `--color-bg-alt`, `--color-surface` | soft neutrals | Page and card backgrounds |
| `--color-text`, `--color-muted` | `#26304a`, `#5a6480` | Body and secondary text |

Dark-mode values are defined twice below that block (once for the OS preference, once for
the manual toggle); change both. Keep text at a contrast ratio of at least 4.5:1.

**Fonts.** Plus Jakarta Sans (headings) and Inter (body) load from Google Fonts. The URL is in
each page's `<head>` (the `data-fonts` link and its `<noscript>` copy); the font names are the
`--font-heading` and `--font-body` variables.

**Logo.** The mark is inline SVG in the header and footer (`.brand-mark`), and also in
`favicon.svg` and `assets/img/logo.svg`. Its colours follow the theme via `--logo-tile`,
`--logo-glyph` and `--logo-dot`.

**Cache busting (important).** CSS and JS are cached for a year and referenced as
`style.css?v=1.0.0`. **After changing any CSS or JS file, bump the version** in every page
(search and replace `?v=1.0.0` → `?v=1.0.1`), or visitors may keep the old file.

**Sitemap.** When you add a page, add it to `sitemap.xml` and give it its own `<title>`,
meta description, canonical URL and Open Graph tags (copy the `<head>` of an existing page).

## 4. Setting the API endpoint (config.js)

After deploying the backend (section 6), copy the `EnquiryApiUrl` output into
`assets/js/config.js`:

```js
enquiryApiUrl: 'https://abc123xyz.execute-api.ap-south-1.amazonaws.com/enquiry',
```

Then bump `?v=` (section 3) and redeploy the site. Until it is set, the form shows a friendly
error with an "email us directly" link that pre-fills the subject and body.

`config.js` is public. Never put keys or secrets in it; the backend needs none from the browser.

**How the form works:**

- `contact.html?product=hospitals-erp&type=demo#enquiry` pre-selects the product and "Request a Demo".
  Product IDs: `schools-erp`, `hospitals-erp`, `accounting`, `service-booking`, `other`.
- The demo date and time fields appear only for "Request a Demo". The message is required for
  general enquiries and optional for demos (max 2000 characters, with a live counter).
- Spam protection: a hidden honeypot field, plus submissions faster than 1.5 seconds are
  quietly accepted and discarded.

## 5. Amazon SES setup (ap-south-1)

All SES, API Gateway and Lambda resources live in **ap-south-1 (Mumbai)**.

### 5.1 Verify the domain (DKIM)

```bash
aws sesv2 create-email-identity --email-identity intelyx.co.in --region ap-south-1
```

The response lists three DKIM tokens. Add three **CNAME** records in DNS:

| Name | Value |
|---|---|
| `<token1>._domainkey.intelyx.co.in` | `<token1>.dkim.amazonses.com` |
| `<token2>._domainkey.intelyx.co.in` | `<token2>.dkim.amazonses.com` |
| `<token3>._domainkey.intelyx.co.in` | `<token3>.dkim.amazonses.com` |

(The same records are shown in SES console → Identities → intelyx.co.in → DKIM.)

### 5.2 SPF via a custom MAIL FROM domain

Using a subdomain keeps SES separate from whatever already sends mail for `intelyx.co.in`
(Google Workspace, Zoho, etc.), so you never need a second root SPF record:

```bash
aws sesv2 put-email-identity-mail-from-attributes --region ap-south-1 \
  --email-identity intelyx.co.in --mail-from-domain mail.intelyx.co.in \
  --behavior-on-mx-failure USE_DEFAULT_VALUE
```

| Type | Name | Value |
|---|---|---|
| MX | `mail.intelyx.co.in` | `10 feedback-smtp.ap-south-1.amazonses.com` |
| TXT | `mail.intelyx.co.in` | `"v=spf1 include:amazonses.com ~all"` |

### 5.3 DMARC

| Type | Name | Value |
|---|---|---|
| TXT | `_dmarc.intelyx.co.in` | `"v=DMARC1; p=none; rua=mailto:office@intelyx.co.in; fo=1"` |

If a DMARC record already exists, keep only one. Start with `p=none`; after a few weeks of
clean reports move to `p=quarantine`.

### 5.4 Verify the recipient address

```bash
aws sesv2 create-email-identity --email-identity office@intelyx.co.in --region ap-south-1
```

Click the link in the verification email. While SES is in the **sandbox** it can only send to
verified addresses, which is enough for the enquiry emails to `office@intelyx.co.in`.

### 5.5 Request production access

Needed for acknowledgement emails to customers (`SendAck=true`). In the console go to
SES → Account dashboard → **Request production access**, or:

```bash
aws sesv2 put-account-details --region ap-south-1 \
  --production-access-enabled --mail-type TRANSACTIONAL \
  --website-url https://www.intelyx.co.in --contact-language EN \
  --additional-contact-email-addresses office@intelyx.co.in \
  --use-case-description "Transactional email only: the website enquiry form sends each submission to office@intelyx.co.in and, optionally, one acknowledgement to the person who submitted it. No marketing email. Bounces and complaints are monitored in the SES console."
```

AWS usually replies within 24 hours.

## 6. Deploy the enquiry backend (SAM)

Prerequisites: [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html),
[AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
and Node.js 20 or later.

```bash
cd infra
sam build && sam deploy --guided
```

Accept the defaults from `samconfig.toml` (stack `intelyx-enquiry-api`, region `ap-south-1`)
or change them. Parameters:

| Parameter | Default | Lambda env var |
|---|---|---|
| `ToEmail` | `office@intelyx.co.in` | `TO_EMAIL` |
| `FromEmail` | `no-reply@intelyx.co.in` | `FROM_EMAIL` |
| `FromName` | `Intelyx Website` | `FROM_NAME` |
| `SesDomain` | `intelyx.co.in` | (IAM scope) |
| `AllowedOrigins` | `https://www.intelyx.co.in,https://intelyx.co.in,http://localhost:8080,...` | `ALLOWED_ORIGINS` |
| `SendAck` | `false` | `SEND_ACK` |
| `NodeRuntime` | `nodejs20.x` | (runtime) |

> **Node.js runtime note.** AWS deprecated `nodejs20.x` on 30 April 2026, so it no longer
> receives security patches, and new functions on it can't be created after 1 February 2027.
> The code runs unchanged on `nodejs22.x` and `nodejs24.x`; choose `nodejs24.x` when deploying
> (`--parameter-overrides NodeRuntime=nodejs24.x`) unless you specifically need Node 20.

What the stack creates:

- **HTTP API** `POST /enquiry` with CORS limited to `AllowedOrigins` and throttling of
  5 requests/second (burst 10). Access logs contain no IP addresses or form data.
- **Lambda** that validates and sanitises every field (required fields, email and Indian
  mobile formats, length limits, HTML stripped), then sends an HTML + plain-text email with
  `Reply-To` set to the visitor, so you can reply directly. Subjects look like
  `[Demo Request] Hospitals ERP – Priya Sharma, Green Valley Hospital` or
  `[Enquiry] Accounting Software – Priya Sharma`. It returns `{ "ok": true }` or
  `{ "ok": false, "error": "..." }` with 400/403/405/413/415/500 as appropriate.
- **IAM role** allowed only `ses:SendEmail` / `ses:SendRawEmail`, only on the verified
  identity, and only with `FromEmail` as the sender.
- **Log groups** (30-day retention). Logs record the request ID, enquiry type, product and the
  email *domain*, never names, phone numbers or messages.

When the deploy finishes, copy the **`EnquiryApiUrl`** output into `assets/js/config.js`
(section 4) and the **`ApiOrigin`** output into the hosting stack (section 7).

Once testing is done, remove the `localhost` entries from `AllowedOrigins` and redeploy.

**Test the API from a terminal:**

```bash
curl -i -X POST "https://<api-id>.execute-api.ap-south-1.amazonaws.com/enquiry" \
  -H "Origin: https://www.intelyx.co.in" -H "Content-Type: application/json" \
  -d '{"enquiryType":"general","name":"Test User","email":"you@example.com","phone":"9876543210",
       "product":"accounting","message":"Testing the enquiry form.","consent":true,
       "pageUrl":"https://www.intelyx.co.in/contact.html"}'
```

**Run the unit tests** (no AWS calls):

```bash
cd backend/enquiry-lambda && npm install && npm test
```

**Logs:** CloudWatch → Log groups → `/aws/lambda/<EnquiryFunctionName>`, or
`sam logs --stack-name intelyx-enquiry-api --region ap-south-1 --tail`.

**Acknowledgement emails.** After SES production access is granted, redeploy with
`SendAck=true` to send each visitor a branded "we've received your enquiry" email that ends
with the company signature. A failed acknowledgement is logged but never fails the enquiry.

## 7. Hosting: S3 + CloudFront, custom domain and SSL

`infra/hosting.yaml` creates:

- **S3 bucket** (`intelyx-site-<account-id>`): private, Block Public Access on, versioning on,
  encrypted, old versions expire after 90 days. Only CloudFront can read it (Origin Access Control).
- **ACM certificate** for `www.intelyx.co.in` and `intelyx.co.in` with DNS validation.
- **CloudFront distribution**: HTTPS only (HTTP redirects to HTTPS), HTTP/2 and HTTP/3,
  compression, `index.html` as the default root object, and `/404.html` for missing pages.
- **CloudFront Function**: redirects `intelyx.co.in` → `https://www.intelyx.co.in` (301),
  `/index.html` → `/`, and serves clean URLs (`/about` → `/about.html`).
- **Response headers policy**: HSTS (2 years, preload), `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` and a Content-Security-Policy
  allowing only this site, Google Fonts, the Google Maps embed and your API.
- **Cache policies**: `/assets/*` cached long (30 days default, up to 1 year, keyed on `?v=`);
  HTML cached for 5 minutes.
- **Route 53** A/AAAA alias records (if you use Route 53).
- An optional **GitHub Actions deploy role** (section 9).

> **Deploy this stack in `us-east-1`.** CloudFront only accepts ACM certificates from that region.

### Option A: DNS in Route 53 (recommended)

If you don't have a hosted zone yet, create one and point your registrar's name servers to it:

```bash
aws route53 create-hosted-zone --name intelyx.co.in --caller-reference "$(date +%s)"
# Copy the 4 NS records from the output into your domain registrar's name-server settings.
```

Then deploy (the certificate is validated automatically, which usually takes 5 to 30 minutes):

```bash
aws cloudformation deploy --region us-east-1 \
  --stack-name intelyx-website \
  --template-file infra/hosting.yaml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
      DomainName=intelyx.co.in \
      HostedZoneId=Z0123456789ABCDEFGHIJ \
      ApiOrigin=https://<api-id>.execute-api.ap-south-1.amazonaws.com
```

Move the SES records from section 5 into the same hosted zone.

### Option B: DNS stays with your current registrar

Deploy with `HostedZoneId=""` (leave it out). The stack pauses at the certificate step:

1. Open **ACM (us-east-1) → Certificates** (or the CloudFormation **Events** tab) and copy
   the two validation **CNAME** records. Add them at your registrar. The stack continues
   automatically once they are found.
2. When the stack completes, take the **`DistributionDomainName`** output (e.g.
   `d1234abcd.cloudfront.net`) and add:

| Type | Name | Value |
|---|---|---|
| CNAME | `www` | `d1234abcd.cloudfront.net` |
| ALIAS / ANAME / CNAME-flattening | `@` (intelyx.co.in) | `d1234abcd.cloudfront.net` |

Many registrars don't support ALIAS records at the apex. If yours doesn't, either move DNS to
Route 53 (Option A) or use the registrar's "URL forwarding" to send `intelyx.co.in` to
`https://www.intelyx.co.in`.

Leave the ACM validation CNAMEs in place permanently so the certificate renews automatically.

### Stack outputs

`BucketName`, `DistributionId`, `DistributionDomainName`, `CertificateArn` and (optional)
`GitHubDeployRoleArn`. Show them with:

```bash
aws cloudformation describe-stacks --region us-east-1 --stack-name intelyx-website \
  --query "Stacks[0].Outputs" --output table
```

> If the API URL changes, update `ApiOrigin` in this stack, or the browser will block the form
> (Content-Security-Policy `connect-src`). The default allows any API in ap-south-1.

## 8. Deploy the website and invalidate the cache

**Recommended:** use the script, which uploads only website files and sets cache headers
(1 year for versioned CSS/JS, 30 days for images, 5 minutes for HTML):

```bash
./scripts/deploy-site.sh <BucketName> <DistributionId>
```

**Manual equivalent:**

```bash
aws s3 sync ./ s3://<BucketName> --delete \
  --exclude ".git/*" --exclude ".github/*" --exclude "backend/*" --exclude "infra/*" \
  --exclude "scripts/*" --exclude "email-signature/*" --exclude "README.md" --exclude ".gitignore"

aws cloudfront create-invalidation --distribution-id <DistributionId> --paths "/*"
```

Invalidations take a minute or two. The first 1,000 invalidation paths each month are free,
and `/*` counts as one path.

## 9. Optional: deploy from GitHub Actions (OIDC)

`.github/workflows/deploy.yml` deploys the site on every push to `main` with short-lived AWS
credentials (no access keys stored in GitHub).

1. Redeploy the hosting stack with your repository:
   ```bash
   aws cloudformation deploy --region us-east-1 --stack-name intelyx-website \
     --template-file infra/hosting.yaml --capabilities CAPABILITY_IAM \
     --parameter-overrides GitHubRepository=satheeshab/intelyx-website GitHubBranch=main
   ```
   (Use `CreateGitHubOidcProvider=false` if your account already has the
   `token.actions.githubusercontent.com` identity provider.)
2. In GitHub: **Settings → Secrets and variables → Actions → Variables**, add:
   - `AWS_DEPLOY_ROLE_ARN`: the `GitHubDeployRoleArn` output
   - `S3_BUCKET`: the `BucketName` output
   - `CLOUDFRONT_DISTRIBUTION_ID`: the `DistributionId` output
3. Push to `main`, or run the workflow by hand from the **Actions** tab.

The role can only write to this bucket and invalidate this distribution. The workflow is
skipped until `AWS_DEPLOY_ROLE_ARN` is set.

## 10. Email signature

Files: `email-signature/signature.html` (rich) and `email-signature/signature.txt` (plain).
The block is table-based with inline styles, Arial/Helvetica, max 500px wide, no JavaScript and
no background images. The "Request a Demo" button is a coloured table cell, so it still shows
when images are blocked. The logo is `https://www.intelyx.co.in/assets/img/logo-email.png`
(a 2x PNG on a white rounded background, so it stays readable when mail apps use dark mode),
so **deploy the website before using the signature**.

The same block ends the acknowledgement email. It is generated from
`backend/enquiry-lambda/signature.mjs`. To change it, edit that file and run
`cd backend/enquiry-lambda && npm run signature` to regenerate both signature files.

**Personalise:** replace `[Full Name]` and `[Designation]` in `signature.html` (and `.txt`).

**Gmail (web; settings apply to the mobile app too)**
1. Open `signature.html` in Chrome, press Ctrl/Cmd + A, then Ctrl/Cmd + C.
2. Gmail → ⚙ → **See all settings** → **General** → **Signature** → **Create new**.
3. Paste, set it as the default for new emails and replies, then **Save changes** at the bottom.

**Outlook (new Outlook for Windows and Outlook on the web)**
1. Open `signature.html` in a browser, select all and copy.
2. ⚙ Settings → **Accounts** → **Signatures** → **New signature**, paste, then choose it as the default.

**Outlook (classic desktop for Windows)**
1. Copy as above.
2. **File → Options → Mail → Signatures… → New**, paste into the editor, set the defaults, and click **OK**.

**Apple Mail (macOS)**
1. **Mail → Settings → Signatures**, select the account and click **+**.
2. **Uncheck** "Always match my default message font".
3. Open `signature.html` in **Safari**, select all, copy, and paste into the signature box.
   (If it looks plain, close Mail, paste again and reopen.)

**Apple Mail (iPhone/iPad):** Settings → Mail → Signature. iOS keeps only basic formatting,
so use `signature.txt` there.

**Testing.** The signature was checked in a browser in light mode and a simulated dark mode.
Before rolling it out, send test emails to Gmail (web and mobile), Outlook (desktop and web)
and Apple Mail with dark mode both on and off, or use a preview service such as Litmus or
Email on Acid. Known client behaviour: Outlook desktop ignores rounded corners (the button is
square there) and some clients recolour text in dark mode; the colours were chosen to stay
readable either way.

## 11. Testing checklist

**Form validation** (`/contact.html`)
- [ ] Submitting the empty form shows an inline error under each required field and focuses the first one.
- [ ] Invalid email (`name@`) and phone (`12345`, `5876543210`) show friendly errors; `+91 98765-43210` is accepted.
- [ ] "Request a Demo" shows date and time fields, makes the message optional and changes the button text.
- [ ] The counter updates and stops at 2000 characters.
- [ ] `contact.html?product=service-booking&type=demo#enquiry` pre-selects the product and demo type.
- [ ] Every "Request a Demo" button on `products.html` pre-fills the right product.
- [ ] While sending, the button is disabled and shows a spinner.
- [ ] Success replaces the form with "Thanks, <first name>! Our team will get back to you within one business day."
- [ ] Failure (e.g. a wrong URL in `config.js`) shows the error with an "email us directly" link whose subject and body are pre-filled.
- [ ] The form works with the keyboard only (Tab, Space/arrows on the toggle, Enter to submit).

**Email delivery**
- [ ] A general enquiry and a demo request each arrive at `office@intelyx.co.in` with the expected subject.
- [ ] Clicking **Reply** addresses the visitor.
- [ ] The email shows every field, the submission time (IST) and the page URL.
- [ ] The message passes SPF, DKIM and DMARC (Gmail: ⋮ → *Show original*).
- [ ] With `SendAck=true` (after production access), the visitor receives the acknowledgement with the signature.
- [ ] A submission with the hidden `website` field filled returns `200` but sends no email.
- [ ] CloudWatch logs contain no names, phone numbers or messages.

**Layout and accessibility** (360px, 768px, 1280px, 1920px)
- [ ] No horizontal scrolling; the hamburger menu opens, and closes with the X button or Esc.
- [ ] The Products dropdown opens on hover and with Enter/Space on the arrow button; Esc closes it.
- [ ] The theme toggle switches light/dark and the choice survives a reload.
- [ ] The active page is highlighted in the menu.
- [ ] Focus outlines are visible on every link, button and field.
- [ ] Animations are off when the OS "reduce motion" setting is on.

**Hosting**
- [ ] `http://intelyx.co.in/about` ends at `https://www.intelyx.co.in/about` and shows the About page.
- [ ] `https://www.intelyx.co.in/does-not-exist` shows the 404 page with status 404.
- [ ] Response headers include `strict-transport-security` and `content-security-policy`
      (`curl -sI https://www.intelyx.co.in`), and the browser console shows no CSP errors.
- [ ] The S3 bucket URL itself returns *Access Denied*.

**Lighthouse** (Chrome DevTools → Lighthouse, mobile and desktop)
- [ ] Performance, Accessibility, Best Practices and SEO all 90+ on every page.
  Pre-launch runs against a local server with production-like headers scored 100 in all four
  categories on the home, products, about and contact pages. The 404 page scores lower on SEO
  on purpose, because it is `noindex`.
- [ ] Validate structured data at <https://search.google.com/test/rich-results> and
      social previews at <https://www.opengraph.xyz/>.
- [ ] Submit `https://www.intelyx.co.in/sitemap.xml` in Google Search Console.

## 12. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Form says "Our online form is not available right now" | `enquiryApiUrl` in `config.js` still has the placeholder. |
| Browser console: *blocked by CORS policy* | The page's origin isn't in `AllowedOrigins`. Add it (exact scheme, host and port) and redeploy the SAM stack. |
| Browser console: *Refused to connect … Content Security Policy* | `ApiOrigin` in the hosting stack doesn't match the API URL. |
| API returns 500, logs show `MessageRejected: Email address is not verified` | SES sandbox: verify the recipient, or request production access. |
| API returns 403 | The request had no `Origin` header, or one not in `ALLOWED_ORIGINS`. |
| API returns 429 | Throttling (5 req/s, burst 10) is working; retry shortly. |
| Old CSS/JS after deploying | Bump `?v=` in the HTML and run an invalidation. |
| Certificate stuck in *Pending validation* | The ACM CNAME records are missing or wrong at your DNS provider. |
| `/about` shows 404 | The CloudFront Function isn't associated, or `about.html` wasn't uploaded. |
