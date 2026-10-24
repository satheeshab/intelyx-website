/**
 * Intelyx — enquiry email Lambda (Node.js 20, AWS SDK v3)
 * --------------------------------------------------------------------------
 * Browser → API Gateway (HTTP API, POST /enquiry) → this function → Amazon SES
 *
 * Environment variables
 *   TO_EMAIL         Where enquiries are delivered          (office@intelyx.co.in)
 *   FROM_EMAIL       Verified SES sender                    (no-reply@intelyx.co.in)
 *   FROM_NAME        Sender display name                    (Intelyx Website)
 *   ALLOWED_ORIGINS  Comma-separated list of allowed origins. An entry of
 *                    "http://localhost" allows any localhost port.
 *   SEND_ACK         "true" to email an acknowledgement to the submitter
 *   SES_REGION       SES region (defaults to the Lambda's region)
 *   MIN_FILL_MS      Submissions faster than this are treated as bots (default 1500)
 *   DRY_RUN          "true" to skip sending (logs a summary instead) for local tests
 *
 * Privacy: logs contain only a request id, enquiry type, product and the
 * email domain, never names, phone numbers, addresses or messages.
 */

import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { signatureHtml, signatureText } from './signature.mjs';

/* ------------------------------------------------------------------------
 * Configuration
 * ---------------------------------------------------------------------- */
const env = process.env;
const TO_EMAIL = env.TO_EMAIL || 'office@intelyx.co.in';
const FROM_EMAIL = env.FROM_EMAIL || 'no-reply@intelyx.co.in';
const FROM_NAME = env.FROM_NAME || 'Intelyx Website';
const SEND_ACK = String(env.SEND_ACK).toLowerCase() === 'true';
const DRY_RUN = String(env.DRY_RUN).toLowerCase() === 'true';
const MIN_FILL_MS = Number.parseInt(env.MIN_FILL_MS || '1500', 10);
const ALLOWED_ORIGINS = (env.ALLOWED_ORIGINS ||
  'https://www.intelyx.co.in,https://intelyx.co.in')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const MAX_BODY_BYTES = 16 * 1024;

export const PRODUCTS = {
  'schools-erp': 'Schools ERP',
  'hospitals-erp': 'Hospitals ERP',
  accounting: 'Accounting Software',
  'service-booking': 'Service Booking Software',
  other: 'Other / Not sure',
};

const DEMO_TIMES = ['10:00 AM - 12:00 PM', '12:00 PM - 3:00 PM', '3:00 PM - 6:00 PM'];

const LIMITS = { name: 100, email: 254, organization: 150, message: 2000, pageUrl: 500 };

let sesClient; // created lazily so tests and DRY_RUN never need AWS credentials
const ses = () => (sesClient ??= new SESv2Client({ region: env.SES_REGION || env.AWS_REGION }));

/* ------------------------------------------------------------------------
 * Small utilities
 * ---------------------------------------------------------------------- */
const log = (level, msg, extra = {}) =>
  console[level === 'error' ? 'error' : 'log'](JSON.stringify({ level, msg, ...extra }));

/** SES error messages can quote addresses; strip them before logging. */
const redact = (text) => String(text || '').replace(/[^\s@<>"']+@[^\s@<>"']+/g, '[email]').slice(0, 300);

/** Remove HTML tags and control characters; collapse whitespace. */
export function sanitize(value, { multiline = false, max = 500 } = {}) {
  if (value === undefined || value === null) return '';
  let text = String(value)
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[<>]/g, '') // drop any stray angle brackets
    .normalize('NFC');

  text = multiline
    ? text
        .replace(/\r\n?/g, '\n')
        .replace(/[^\S\n]+/g, ' ') // collapse spaces but keep newlines
        .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
        .replace(/\n{3,}/g, '\n\n')
    : text.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ');

  return text.trim().slice(0, max);
}

export const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Keep email header values on a single line. */
const headerSafe = (value) => String(value).replace(/[\r\n]+/g, ' ').trim();

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

/** Normalise Indian mobile numbers to +91XXXXXXXXXX, or return ''. */
export function normalisePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : '';
}

const formatPhone = (e164) => (e164 ? `${e164.slice(0, 3)} ${e164.slice(3, 8)} ${e164.slice(8)}` : '');

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const formatDate = (iso) =>
  new Intl.DateTimeFormat('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));

const nowIst = () =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
  }).format(new Date()) + ' IST';

export function isOriginAllowed(origin) {
  if (!origin) return false;
  const clean = origin.replace(/\/$/, '');
  if (ALLOWED_ORIGINS.includes(clean)) return true;
  // "http://localhost" in the list allows any local port for testing
  const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.exec(clean);
  return Boolean(local && ALLOWED_ORIGINS.includes(`http://${local[1]}`));
}

function response(statusCode, body, origin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Origin',
  };
  if (origin && isOriginAllowed(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return { statusCode, headers, body: JSON.stringify(body) };
}

/* ------------------------------------------------------------------------
 * Validation
 * ---------------------------------------------------------------------- */
/**
 * Validates and sanitises the submitted fields.
 * @returns {{ data?: object, errors?: Record<string,string> }}
 */
export function validate(input) {
  const errors = {};
  const raw = input && typeof input === 'object' ? input : {};

  const enquiryType = raw.enquiryType === 'demo' ? 'demo' : raw.enquiryType === 'general' ? 'general' : '';
  if (!enquiryType) errors.enquiryType = 'Please choose an enquiry type.';
  const isDemo = enquiryType === 'demo';

  const name = sanitize(raw.name, { max: LIMITS.name + 1 });
  if (!name) errors.name = 'Please enter your full name.';
  else if (name.length < 2 || name.length > LIMITS.name) errors.name = 'Please enter a valid name.';

  const email = sanitize(raw.email, { max: LIMITS.email + 1 }).toLowerCase();
  if (!email) errors.email = 'Please enter your email address.';
  else if (email.length > LIMITS.email || !EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';

  const phone = normalisePhone(raw.phone);
  if (!phone) errors.phone = 'Please enter a valid 10-digit Indian mobile number.';

  const organization = sanitize(raw.organization, { max: LIMITS.organization });

  const product = typeof raw.product === 'string' && PRODUCTS[raw.product] ? raw.product : '';
  if (!product) errors.product = 'Please choose a product.';

  let demoDate = '';
  let demoTime = '';
  if (isDemo) {
    demoDate = sanitize(raw.demoDate, { max: 10 });
    if (demoDate && !isValidIsoDate(demoDate)) errors.demoDate = 'Please choose a valid date.';
    demoTime = DEMO_TIMES.includes(raw.demoTime) ? raw.demoTime : '';
  }

  const rawMessage = typeof raw.message === 'string' ? raw.message : '';
  const message = sanitize(rawMessage, { multiline: true, max: LIMITS.message + 1 });
  if (message.length > LIMITS.message) errors.message = `Please keep your message under ${LIMITS.message} characters.`;
  else if (!isDemo && message.length < 10) errors.message = 'Please tell us a little about your enquiry.';

  if (raw.consent !== true) errors.consent = 'Please agree to be contacted.';

  let pageUrl = '';
  try {
    const url = new URL(String(raw.pageUrl || ''));
    if (['https:', 'http:'].includes(url.protocol)) pageUrl = url.href.slice(0, LIMITS.pageUrl);
  } catch {
    /* ignore invalid URLs */
  }

  if (Object.keys(errors).length) return { errors };
  return {
    data: { enquiryType, name, email, phone, organization, product, demoDate, demoTime, message, pageUrl },
  };
}

/* ------------------------------------------------------------------------
 * Email builders
 * ---------------------------------------------------------------------- */
export function buildSubject(d) {
  const product = PRODUCTS[d.product];
  const subject = d.enquiryType === 'demo'
    ? `[Demo Request] ${product} – ${d.name}${d.organization ? `, ${d.organization}` : ''}`
    : `[Enquiry] ${product} – ${d.name}`;
  return headerSafe(subject).slice(0, 200);
}

/** Rows shown in the team email, in order. Values are plain text. */
function detailRows(d, submittedAt) {
  const rows = [
    ['Enquiry type', d.enquiryType === 'demo' ? 'Request a Demo' : 'General Enquiry'],
    ['Name', d.name],
    ['Email', d.email],
    ['Phone', formatPhone(d.phone)],
    ['Organisation', d.organization || '—'],
    ['Product', PRODUCTS[d.product]],
  ];
  if (d.enquiryType === 'demo') {
    rows.push(['Preferred demo date', d.demoDate ? formatDate(d.demoDate) : 'Any day']);
    rows.push(['Preferred time (IST)', d.demoTime || 'Any time']);
  }
  rows.push(['Message', d.message || '—']);
  rows.push(['Consent to contact', 'Yes']);
  rows.push(['Submitted', submittedAt]);
  rows.push(['Page', d.pageUrl || '—']);
  return rows;
}

export function buildTeamEmail(d, submittedAt = nowIst()) {
  const rows = detailRows(d, submittedAt);
  const font = 'Arial, Helvetica, sans-serif';
  const heading = d.enquiryType === 'demo' ? 'New demo request' : 'New website enquiry';

  const valueHtml = (label, value) => {
    const safe = escapeHtml(value);
    if (label === 'Email') return `<a href="mailto:${safe}" style="color:#0f766e;">${safe}</a>`;
    if (label === 'Phone') return `<a href="tel:${escapeHtml(d.phone)}" style="color:#0f766e;">${safe}</a>`;
    if (label === 'Page' && d.pageUrl) return `<a href="${safe}" style="color:#0f766e;">${safe}</a>`;
    return safe.replace(/\n/g, '<br>');
  };

  const tableRows = rows
    .map(([label, value], i) => `
        <tr>
          <th align="left" valign="top" style="width:170px; padding:10px 14px; font-family:${font}; font-size:13px; font-weight:bold; color:#5a6480; background:${i % 2 ? '#ffffff' : '#f5f7fb'}; border-bottom:1px solid #e2e7f0;">${escapeHtml(label)}</th>
          <td valign="top" style="padding:10px 14px; font-family:${font}; font-size:14px; line-height:21px; color:#0b1530; background:${i % 2 ? '#ffffff' : '#f5f7fb'}; border-bottom:1px solid #e2e7f0; word-break:break-word;">${valueHtml(label, value)}</td>
        </tr>`)
    .join('');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0; padding:0; background:#f2f5fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2f5fa;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px; background:#ffffff; border:1px solid #e2e7f0; border-radius:10px; overflow:hidden;">
        <tr><td style="padding:20px 24px; background:#0b1530; font-family:${font}; color:#ffffff;">
          <div style="font-size:12px; letter-spacing:1px; text-transform:uppercase; color:#5eead4;">Intelyx website</div>
          <div style="font-size:20px; font-weight:bold; padding-top:4px;">${escapeHtml(heading)}: ${escapeHtml(PRODUCTS[d.product])}</div>
        </td></tr>
        <tr><td style="padding:0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${tableRows}
          </table>
        </td></tr>
        <tr><td style="padding:16px 24px; font-family:${font}; font-size:12px; color:#5a6480;">
          Reply to this email to respond directly to ${escapeHtml(d.name)}.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const width = Math.max(...rows.map(([label]) => label.length)) + 2;
  const text = [
    `${heading.toUpperCase()}: ${PRODUCTS[d.product]}`,
    '='.repeat(48),
    ...rows.map(([label, value]) =>
      label === 'Message'
        ? `\nMessage:\n${value}\n`
        : `${`${label}:`.padEnd(width)} ${value}`),
    '',
    `Reply to this email to respond directly to ${d.name}.`,
  ].join('\n');

  return { subject: buildSubject(d), html, text };
}

export function buildAckEmail(d) {
  const font = 'Arial, Helvetica, sans-serif';
  const first = d.name.split(/\s+/)[0];
  const product = PRODUCTS[d.product];
  const isDemo = d.enquiryType === 'demo';
  const subject = isDemo ? 'We’ve received your demo request – Intelyx' : 'Thanks for contacting Intelyx';
  const intro = isDemo
    ? `Thank you for requesting a demo of <strong>${escapeHtml(product)}</strong>. Our team will contact you within one business day to confirm a time that suits you.`
    : `Thank you for getting in touch about <strong>${escapeHtml(product)}</strong>. Our team will get back to you within one business day.`;
  const when = isDemo && (d.demoDate || d.demoTime)
    ? `<p style="margin:0 0 16px 0;">Your preferred slot: <strong>${escapeHtml(d.demoDate ? formatDate(d.demoDate) : 'Any day')}${d.demoTime ? `, ${escapeHtml(d.demoTime)} IST` : ''}</strong></p>`
    : '';
  const team = { name: 'Team Intelyx', designation: 'Customer Success' };

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0; padding:0; background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="left" style="padding:24px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; font-family:${font}; font-size:15px; line-height:24px; color:#26304a;">
        <tr><td style="padding:0 0 16px 0;">
          <p style="margin:0 0 16px 0;">Hi ${escapeHtml(first)},</p>
          <p style="margin:0 0 16px 0;">${intro}</p>
          ${when}
          <p style="margin:0 0 16px 0;">If anything is urgent, call or WhatsApp us on <a href="tel:+919380577396" style="color:#0f766e;">+91 93805 77396</a>, or simply reply to this email.</p>
          <p style="margin:0 0 24px 0;">Warm regards,</p>
        </td></tr>
        <tr><td>
${signatureHtml(team)}
        </td></tr>
        <tr><td style="padding:24px 0 0 0; font-size:11px; line-height:16px; color:#5a6480;">
          You received this email because you submitted an enquiry on www.intelyx.co.in. We use your details only to respond to your enquiry.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `Hi ${first},`,
    '',
    isDemo
      ? `Thank you for requesting a demo of ${product}. Our team will contact you within one business day to confirm a time that suits you.`
      : `Thank you for getting in touch about ${product}. Our team will get back to you within one business day.`,
    ...(isDemo && (d.demoDate || d.demoTime)
      ? ['', `Your preferred slot: ${d.demoDate ? formatDate(d.demoDate) : 'Any day'}${d.demoTime ? `, ${d.demoTime} IST` : ''}`]
      : []),
    '',
    'If anything is urgent, call or WhatsApp us on +91 93805 77396, or simply reply to this email.',
    '',
    'Warm regards,',
    '',
    signatureText(team),
    '',
    '--',
    'You received this email because you submitted an enquiry on www.intelyx.co.in.',
  ].join('\n');

  return { subject, html, text };
}

/* ------------------------------------------------------------------------
 * Sending
 * ---------------------------------------------------------------------- */
async function sendEmail({ to, replyTo, fromName, subject, html, text }) {
  if (DRY_RUN) {
    log('info', 'dry_run_email', { toDomain: to.split('@')[1], subjectLength: subject.length });
    return;
  }
  await ses().send(new SendEmailCommand({
    FromEmailAddress: `"${headerSafe(fromName).replace(/"/g, '')}" <${FROM_EMAIL}>`,
    Destination: { ToAddresses: [to] },
    ReplyToAddresses: [replyTo],
    Content: {
      Simple: {
        Subject: { Data: headerSafe(subject), Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
          Text: { Data: text, Charset: 'UTF-8' },
        },
      },
    },
  }));
}

/* ------------------------------------------------------------------------
 * Handler
 * ---------------------------------------------------------------------- */
export async function handler(event = {}, context = {}) {
  const requestId = context.awsRequestId || event.requestContext?.requestId || 'local';
  const headers = Object.fromEntries(
    Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v]),
  );
  const origin = headers.origin || '';
  const method = event.requestContext?.http?.method || event.httpMethod || 'POST';

  if (method === 'OPTIONS') return response(204, {}, origin);
  if (method !== 'POST') return response(405, { ok: false, error: 'Method not allowed.' }, origin);

  if (!isOriginAllowed(origin)) {
    log('warn', 'origin_rejected', { requestId, origin: origin.slice(0, 100) });
    return response(403, { ok: false, error: 'Origin not allowed.' }, origin);
  }

  if (!String(headers['content-type'] || '').includes('application/json')) {
    return response(415, { ok: false, error: 'Please send JSON.' }, origin);
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : event.body || '';
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return response(413, { ok: false, error: 'Your message is too long.' }, origin);
  }

  let input;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return response(400, { ok: false, error: 'Invalid request.' }, origin);
  }

  // Spam traps: a filled honeypot or an impossibly fast submission.
  // Reply with a normal success so bots learn nothing.
  const elapsed = Number(input?.elapsedMs);
  if ((typeof input?.website === 'string' && input.website.trim() !== '') ||
      (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < MIN_FILL_MS)) {
    log('info', 'spam_dropped', { requestId, reason: input?.website ? 'honeypot' : 'too_fast' });
    return response(200, { ok: true }, origin);
  }

  const { data, errors } = validate(input);
  if (errors) {
    log('info', 'validation_failed', { requestId, fields: Object.keys(errors) });
    return response(400, {
      ok: false,
      error: 'Please check the highlighted details and try again.',
      fields: errors,
    }, origin);
  }

  const meta = {
    requestId,
    enquiryType: data.enquiryType,
    product: data.product,
    emailDomain: data.email.split('@')[1],
  };

  try {
    const team = buildTeamEmail(data);
    await sendEmail({
      to: TO_EMAIL,
      replyTo: data.email,
      fromName: FROM_NAME,
      ...team,
    });
    log('info', 'enquiry_sent', meta);
  } catch (err) {
    log('error', 'enquiry_send_failed', { ...meta, errorName: err?.name, errorMessage: redact(err?.message) });
    return response(500, {
      ok: false,
      error: 'We could not send your enquiry right now. Please try again or email office@intelyx.co.in.',
    }, origin);
  }

  if (SEND_ACK) {
    try {
      await sendEmail({ to: data.email, replyTo: TO_EMAIL, fromName: 'Intelyx', ...buildAckEmail(data) });
      log('info', 'ack_sent', meta);
    } catch (err) {
      // The team already has the enquiry, so don't fail the request.
      log('warn', 'ack_send_failed', { ...meta, errorName: err?.name, errorMessage: redact(err?.message) });
    }
  }

  return response(200, { ok: true }, origin);
}
