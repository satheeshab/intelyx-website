/** Builds the enquiry notification (to the team) and the optional acknowledgement (to the visitor). */
import { signatureHtml, signatureText } from '../signature.js';
import { PRODUCTS, escapeHtml } from './validate.js';

/** Keep email header values on a single line. */
const headerSafe = (value) => String(value).replace(/[\r\n]+/g, ' ').trim();

const formatPhone = (e164) => (e164 ? `${e164.slice(0, 3)} ${e164.slice(3, 8)} ${e164.slice(8)}` : '');

const formatDate = (iso) =>
  new Intl.DateTimeFormat('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));

export const nowIst = () =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
  }).format(new Date()) + ' IST';

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
    if (label === 'Email') return `<a href="mailto:${safe}" style="color:#a94727;">${safe}</a>`;
    if (label === 'Phone') return `<a href="tel:${escapeHtml(d.phone)}" style="color:#a94727;">${safe}</a>`;
    if (label === 'Page' && d.pageUrl) return `<a href="${safe}" style="color:#a94727;">${safe}</a>`;
    return safe.replace(/\n/g, '<br>');
  };

  const tableRows = rows
    .map(([label, value], i) => `
        <tr>
          <th align="left" valign="top" style="width:170px; padding:10px 14px; font-family:${font}; font-size:13px; font-weight:bold; color:#5e5d59; background:${i % 2 ? '#ffffff' : '#f6f5ef'}; border-bottom:1px solid #e8e6dc;">${escapeHtml(label)}</th>
          <td valign="top" style="padding:10px 14px; font-family:${font}; font-size:14px; line-height:21px; color:#141413; background:${i % 2 ? '#ffffff' : '#f6f5ef'}; border-bottom:1px solid #e8e6dc; word-break:break-word;">${valueHtml(label, value)}</td>
        </tr>`)
    .join('');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0; padding:0; background:#f0eee6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0eee6;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px; background:#ffffff; border:1px solid #e8e6dc; border-radius:10px; overflow:hidden;">
        <tr><td style="padding:20px 24px; background:#141413; font-family:${font}; color:#ffffff;">
          <div style="font-size:12px; letter-spacing:1px; text-transform:uppercase; color:#e8896a;">Intelyx website</div>
          <div style="font-size:20px; font-weight:bold; padding-top:4px;">${escapeHtml(heading)}: ${escapeHtml(PRODUCTS[d.product])}</div>
        </td></tr>
        <tr><td style="padding:0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${tableRows}
          </table>
        </td></tr>
        <tr><td style="padding:16px 24px; font-family:${font}; font-size:12px; color:#5e5d59;">
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
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; font-family:${font}; font-size:15px; line-height:24px; color:#3d3d3a;">
        <tr><td style="padding:0 0 16px 0;">
          <p style="margin:0 0 16px 0;">Hi ${escapeHtml(first)},</p>
          <p style="margin:0 0 16px 0;">${intro}</p>
          ${when}
          <p style="margin:0 0 16px 0;">If anything is urgent, call or WhatsApp us on <a href="tel:+919380577396" style="color:#a94727;">+91 93805 77396</a>, or simply reply to this email.</p>
          <p style="margin:0 0 24px 0;">Warm regards,</p>
        </td></tr>
        <tr><td>
${signatureHtml(team)}
        </td></tr>
        <tr><td style="padding:24px 0 0 0; font-size:11px; line-height:16px; color:#5e5d59;">
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
