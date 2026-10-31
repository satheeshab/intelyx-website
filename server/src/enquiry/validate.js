/**
 * Validation and sanitising for the enquiry form. Everything the browser sends
 * is treated as untrusted: HTML is stripped, lengths are capped and formats checked.
 */

// Keep in sync with client/src/data/products.js (ids are the form's <option> values).
export const PRODUCTS = {
  'schools-erp': 'Schools ERP',
  'hospitals-erp': 'Hospitals ERP',
  accounting: 'Accounting Software',
  'service-booking': 'Service Booking Software',
  other: 'Other / Not sure',
};

export const DEMO_TIMES = ['10:00 AM - 12:00 PM', '12:00 PM - 3:00 PM', '3:00 PM - 6:00 PM'];

export const LIMITS = { name: 100, email: 254, organization: 150, message: 2000, pageUrl: 500 };

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

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

/** Normalise Indian mobile numbers to +91XXXXXXXXXX, or return ''. */
export function normalisePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : '';
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

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

  const product = typeof raw.product === 'string' && Object.hasOwn(PRODUCTS, raw.product) ? raw.product : '';
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
