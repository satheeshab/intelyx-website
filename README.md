# Intelyx website

Website for **Intelyx Tech Solutions LLP**: a React single-page app served by a Node.js (Express)
server, which also sends the enquiry-form emails. It runs as one container on AWS Lightsail and
**deploys automatically after every merge to `main`**.

| | |
|---|---|
| **Front end** | React 19, React Router, Vite. Plain CSS: warm cream theme with serif headlines, plus a dark mode. |
| **Back end** | Node.js 24 (works on 22.12+), Express 5, Nodemailer. |
| **Email** | Amazon SES over SMTP (any SMTP service works). In development, emails are printed to the console. |
| **Hosting** | One Docker container on an AWS Lightsail container service. |
| **Deploys** | GitHub Actions: test → build image → push to Lightsail → health check. |

> **Deploying for the first time?** Follow **[DEPLOY.md](DEPLOY.md)**.

## Contents

1. [Run it locally](#1-run-it-locally)
2. [Project structure](#2-project-structure)
3. [Editing content, colours and logo](#3-editing-content-colours-and-logo)
4. [How the enquiry form works](#4-how-the-enquiry-form-works)
5. [Configuration (environment variables)](#5-configuration-environment-variables)
6. [Tests](#6-tests)
7. [Email signature](#7-email-signature)
8. [Testing checklist before launch](#8-testing-checklist-before-launch)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Run it locally

You need **Node.js 22.12 or newer** (24 recommended; [nodejs.org](https://nodejs.org)). Nothing else:
no database, no AWS account and no email settings.

```bash
git clone https://github.com/satheeshab/intelyx-website.git
cd intelyx-website
npm install
npm run dev
```

Open **http://localhost:5173**. This starts two things together:

- the **React app** on port 5173 (Vite, with instant reload when you edit a file), and
- the **Node server** on port 3001, which handles `/api/*`. Vite forwards API calls to it.

Fill in the contact form: the email is **printed in the terminal** instead of being sent.

### Production mode (what visitors get)

```bash
npm run build     # builds the React app into client/dist
npm start         # serves everything from one server
```

Open **http://localhost:3001**. This is the same server that runs on Lightsail. It also redirects
old `.html` addresses (`/about.html` → `/about`), which the dev server does not.

### With Docker

```bash
docker build -t intelyx-web .
docker run --rm -p 8080:8080 -e ALLOW_LOG_EMAIL=true intelyx-web
```

Open **http://localhost:8080**. (Without `ALLOW_LOG_EMAIL=true` or SMTP settings, a production
container refuses to start, so enquiries can never be silently lost.)

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development: React on :5173 + server on :3001, both reload on change |
| `npm run build` | Production build of the React app (`client/dist`) |
| `npm start` | Start the Node server (serves the built app and the API) |
| `npm test` | All tests (server and client) |
| `npm run signature` | Regenerate the email signature files (section 7) |

To use a different port: `PORT=4000 npm start` (server) or `API_PORT=4000 npm run dev -w client`
if you moved the server in development.

## 2. Project structure

```
client/                      React app (Vite)
  index.html                 HTML shell: fonts, icons, Organization/LocalBusiness structured data
  public/                    Copied as-is: favicon, robots.txt, sitemap.xml, theme-init.js, assets/img/*
  scripts/prerender-head.mjs After the build: writes each page's own <title>/description/social tags
  src/
    main.jsx, App.jsx        Entry point and the list of pages (routes)
    pages/                   Home, Products, About, Contact, Legal (Privacy + Terms), NotFound
    components/              Header, Footer, Layout, EnquiryForm, CtaBand, Icon, Logo, ...
    data/products.js         Product catalogue (names, features, who it's for)
    data/seo.js              Page titles, descriptions, structured data
    data/icons.js            Inline SVG icons
    lib/validation.js        Form rules, payload and "email us directly" fallback link
    lib/api.js               Sends the form to /api/enquiry
    hooks/                   Theme toggle, scroll animations, per-page <title>
    styles/style.css         All styles; colours and fonts are CSS variables at the top
  test/                      Client tests

server/                      Node.js server (Express)
  src/index.js               Start-up: config check, mailer, HTTP server, graceful shutdown
  src/app.js                 Security headers, redirects, /healthz, /api, serves the React app
  src/enquiry/               routes.js (POST /api/enquiry), validate.js, emails.js
  src/mailer.js              Nodemailer: SMTP, or "log to the console" for development
  src/signature.js           The branded email signature (also used in the acknowledgement email)
  src/static.js              Serves client/dist as a SPA: clean URLs, caching, 404 handling
  src/config.js              Environment variables and start-up checks
  test/                      Server tests (API, validation, SMTP delivery, static serving, config)

Dockerfile                   Production image (multi-stage: build, production dependencies, runtime)
.github/workflows/deploy.yml Test on every pull request; deploy on every merge to main
deploy/                      Script and policies that give GitHub permission to deploy
brand/                       Logo files (SVG/PNG, light/dark/one-colour) and usage guide
email-signature/             signature.html and signature.txt
.env.example                 Every setting, documented (copy to .env for local overrides)
DEPLOY.md                    AWS Lightsail setup, step by step
```

## 3. Editing content, colours and logo

**Text.** All copy is in the React files, so search for the sentence you want to change:

| What | Where |
|---|---|
| Products, features, "who it's for" | `client/src/data/products.js` (the home page, menus and footer read from it) |
| Home page text | `client/src/pages/Home.jsx` |
| About page: mission, values, **milestones (placeholders)** | `client/src/pages/About.jsx` |
| Contact details, **business hours**, FAQ | `client/src/pages/Contact.jsx` |
| Privacy Policy and Terms (**placeholder drafts: have a lawyer review them**) | `client/src/pages/Legal.jsx` |
| Menu, footer, **social links** (`href: '#'`) | `client/src/components/Header.jsx`, `Footer.jsx` |
| Page titles and descriptions (search results, link previews) | `client/src/data/seo.js` |

Things still to fill in are marked `EDIT ME` or `PLACEHOLDER`. Changes show up instantly in
`npm run dev`.

**Adding a page.** Create `client/src/pages/Foo.jsx` (call `useSeo('/foo')`), add its route in
`client/src/App.jsx`, add its title/description to `PAGES` in `client/src/data/seo.js` (this also
pre-renders its `<head>` and registers the URL with the server), add it to
`client/public/sitemap.xml`, and link to it from the header or footer.

**Colours.** The look is warm cream paper, near-black ink and a terracotta accent. Edit the CSS
variables at the top of `client/src/styles/style.css`:

| Variable | Light | Used for |
|---|---|---|
| `--color-bg`, `--color-bg-alt`, `--color-surface` | `#faf9f5`, `#f0eee6`, `#ffffff` | Page, alternate section and card backgrounds |
| `--color-heading`, `--color-text`, `--color-muted` | `#141413`, `#3d3d3a`, `#5e5d59` | Headlines, body and secondary text |
| `--color-primary`, `--color-on-primary` | `#141413`, `#faf9f5` | Main buttons (a light button in dark mode) |
| `--color-secondary-bg` | `#efede4` | Secondary buttons |
| `--color-accent` | `#d97757` | Terracotta for decoration: icons, chart, highlights |
| `--color-accent-strong` | `#a94727` | Terracotta for text and links (passes WCAG AA on every cream surface) |
| `--color-band` | `#141413` | Dark panels: call-to-action band, mission card, industry tiles |

Dark-mode values are defined twice below that block (once for the OS preference, once for the
manual toggle): change both, and keep text at a contrast ratio of at least 4.5:1. The logo colours
are separate variables (`--logo-*`).

**Fonts.** Headlines and the "Intelyx" wordmark use **Newsreader** (a serif); body text, buttons,
menus and labels use **Inter**. Both load from Google Fonts (the link is in `client/index.html`);
the names are the `--font-heading` and `--font-body` variables.

**Logo.** Ready-to-use files and rules are in [`brand/`](brand/README.md). On the website the mark
is the `LogoMark` component (`client/src/components/Logo.jsx`), so it follows the theme colours.

## 4. How the enquiry form works

```
Browser (React form) ── POST /api/enquiry (JSON) ──► Node server ──► SMTP (Amazon SES) ──► office@intelyx.co.in
```

- **Pre-fill:** `/contact?product=hospitals-erp&type=demo#enquiry` selects the product and
  "Request a Demo". Product ids: `schools-erp`, `hospitals-erp`, `accounting`, `service-booking`, `other`.
- **In the browser:** friendly inline validation, a character counter (2000 max), demo date/time
  fields only for demo requests, a spinner while sending, and a thank-you message on success. If
  sending fails, an "email us directly" link appears with the subject and body already filled in.
- **On the server (`server/src/enquiry/`):** every field is validated and sanitised again (HTML
  stripped, lengths capped, Indian mobile format, email format), and the visitor's email becomes
  the **Reply-To**, so the team can just hit Reply.
- **The email:** subject `[Demo Request] Hospitals ERP – Name, Organisation` or
  `[Enquiry] Product – Name`; an HTML and plain-text table of every field, the time (IST) and the
  page address. With `SEND_ACK=true` the visitor also gets a branded acknowledgement ending in the
  company signature.
- **Spam protection:** a hidden honeypot field, a minimum fill time (a form submitted within 1.5
  seconds is quietly discarded), and a limit of 5 submissions per visitor per minute.
- **Privacy:** logs contain only the enquiry type, product and the email *domain*, never names,
  phone numbers or messages.

## 5. Configuration (environment variables)

All optional locally. Copy `.env.example` to `.env` to try settings. In production the deploy
workflow sets them (see [DEPLOY.md](DEPLOY.md), step 3b).

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3001` (`8080` in the container) | Server port |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | empty | Email server. **Empty host = print emails to the console.** |
| `SMTP_PORT` | `587` | Port (`465` uses SSL automatically) |
| `TO_EMAIL` | `office@intelyx.co.in` | Where enquiries are delivered |
| `FROM_EMAIL`, `FROM_NAME` | `no-reply@intelyx.co.in`, `Intelyx Website` | Sender (must be verified with your email service) |
| `SEND_ACK` | `false` | `true` also emails a thank-you to the visitor |
| `EMAIL_TRANSPORT` | automatic | Force `smtp` or `log` |
| `ALLOW_LOG_EMAIL` | `false` | Lets a **production** server run without SMTP (emails only logged) |
| `FORCE_HTTPS`, `APEX_HOST`, `CANONICAL_HOST` | off | Production redirects: HTTP→HTTPS and `intelyx.co.in`→`www` |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS` | `5`, `60000` | Enquiries per visitor per window |
| `NODE_ENV` | `development` | `production` enables strict start-up checks (set by the Docker image) |

In production the server **refuses to start** without working email settings, so a misconfigured
deploy fails its health check and the previous version keeps serving, instead of dropping enquiries.

## 6. Tests

```bash
npm test          # server (33 tests) + client (11 tests)
```

- **Server:** validation and sanitising, email content, the API (success, spam traps, errors, rate
  limit), real SMTP delivery against an in-process mail server (including header-injection
  attempts and rejected logins), page serving and redirects, and start-up configuration checks.
- **Client:** form rules, the payload and fallback link, product/icon data and page titles.

Pull requests also build the Docker image and smoke-test it (GitHub Actions).

## 7. Email signature

Files: `email-signature/signature.html` (rich) and `signature.txt` (plain). It is table-based
with inline styles, Arial/Helvetica, at most 500px wide, with no JavaScript or background images,
and a **"Request a Demo" button made from a coloured table cell**, so it still shows when images are
blocked. The logo is `https://www.intelyx.co.in/assets/img/logo-email.png` (a 2x PNG on a white
rounded background, readable in dark mode), so **deploy the site before using the signature**.

The same block ends the acknowledgement email. To change it, edit `server/src/signature.js` and run
`npm run signature`. Personalise by replacing `[Full Name]` and `[Designation]` in the HTML.

**Gmail:** open `signature.html` in Chrome, select all, copy → Gmail ⚙ → **See all settings** →
**General** → **Signature** → **Create new**, paste, set it as default, **Save changes**.
**Outlook (new Outlook / web):** copy as above → ⚙ Settings → **Accounts → Signatures → New
signature**, paste, set defaults. **Outlook (classic Windows):** **File → Options → Mail →
Signatures… → New**, paste, set defaults.
**Apple Mail (Mac):** **Mail → Settings → Signatures**, **+**, untick *Always match my default
message font*, paste the copied signature (copy it from Safari). **iPhone/iPad:** Settings → Mail →
Signature, use the plain-text version.

Check it in Gmail (web and mobile), Outlook (desktop and web) and Apple Mail, in light and dark
mode, before rolling it out. Outlook desktop ignores rounded corners (the button is square there).

## 8. Testing checklist before launch

**Form**
- [ ] Empty submit shows an inline error under each required field and focuses the first.
- [ ] Bad email (`name@`) and phone (`12345`) show friendly errors; `+91 98765-43210` is accepted.
- [ ] "Request a Demo" shows date/time fields and makes the message optional.
- [ ] `/contact?product=service-booking&type=demo#enquiry` pre-selects both.
- [ ] A real submission arrives at `office@intelyx.co.in`; **Reply** goes to the visitor; the email
      passes SPF, DKIM and DMARC (Gmail → ⋮ → *Show original*).
- [ ] With `SEND_ACK=true` (after SES production access) the visitor gets the acknowledgement.

**Layout and accessibility** (360, 768, 1280, 1920 px)
- [ ] No sideways scrolling. The mobile menu opens and closes (X button, Esc, choosing a link).
- [ ] The Products dropdown works with the mouse and the keyboard (Enter, Tab, Esc).
- [ ] Light/dark toggle works and survives a reload. Focus outlines are visible everywhere.
- [ ] Animations stop when the OS "reduce motion" setting is on.

**Production**
- [ ] `https://www.intelyx.co.in` shows a padlock; `http://` redirects to `https://`.
- [ ] `https://www.intelyx.co.in/does-not-exist` shows the 404 page (status 404).
- [ ] `curl -sI https://www.intelyx.co.in` shows `strict-transport-security` and `content-security-policy`.
- [ ] Lighthouse (Chrome DevTools, mobile and desktop): all four scores 90+.
- [ ] Share a page link in WhatsApp/LinkedIn and check the title, description and image.
- [ ] Submit `https://www.intelyx.co.in/sitemap.xml` in Google Search Console.

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| `npm run dev` says port 3001/5173 is in use | Another copy is running. Close it, or set `PORT=3002` (and `API_PORT=3002` for the client). |
| Form says "email us directly" in development | The Node server isn't running (use `npm run dev`, not just Vite). |
| Opened `http://localhost:3001` and see "website has not been built yet" | Run `npm run build` first, or use http://localhost:5173 while developing. |
| `Configuration error: Refusing to start in production…` | Production mode needs `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (or `ALLOW_LOG_EMAIL=true` to test). |
| Real emails don't arrive | Check the server log for `enquiry_send_failed`: unverified sender/domain in SES, SES sandbox, or wrong SMTP credentials. |
| Docker build fails on `npm ci` behind a company proxy | Pass the proxy/certificate settings your network requires (`--build-arg` / `--network=host`). |
