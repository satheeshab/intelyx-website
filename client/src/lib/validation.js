// Form validation rules for the enquiry form. Pure functions (no React) so they are easy to test.
// The server repeats these checks (server/src/enquiry/validate.js): never rely on the browser alone.

export const MESSAGE_MAX = 2000;

export const PRODUCT_LABELS = {
  'schools-erp': 'Schools ERP',
  'hospitals-erp': 'Hospitals ERP',
  accounting: 'Accounting Software',
  'service-booking': 'Service Booking Software',
  other: 'Other / Not sure',
};

/** Order in which errors are focused (matches the order on the page). */
export const FIELD_ORDER = ['name', 'email', 'phone', 'product', 'demoDate', 'message', 'consent'];

const pad = (n) => (n < 10 ? '0' : '') + n;
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Accepts "98765 43210", "+91 98765-43210", "098765..." and returns 10 digits (or fewer). */
export function normalisePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export const firstName = (full) => String(full || '').trim().split(/\s+/)[0] || 'there';

const rules = {
  name(v) {
    const t = v.name.trim();
    if (!t) return 'Please enter your full name.';
    if (t.length < 2) return 'Your name looks too short.';
    if (!/[A-Za-zÀ-ɏऀ-෿]/.test(t)) return 'Please use letters in your name.';
    return '';
  },
  email(v) {
    const t = v.email.trim();
    if (!t) return 'Please enter your email address.';
    if (t.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return 'Please enter a valid email, like name@example.com.';
    return '';
  },
  phone(v) {
    const t = v.phone.trim();
    if (!t) return 'Please enter your mobile number.';
    if (!/^[6-9]\d{9}$/.test(normalisePhone(t))) return 'Please enter a valid 10-digit Indian mobile number.';
    return '';
  },
  product(v) {
    return v.product ? '' : 'Please choose the product you are interested in.';
  },
  demoDate(v, today) {
    if (v.enquiryType !== 'demo' || !v.demoDate) return '';
    return v.demoDate < isoDate(today) ? 'Please choose a date from today onwards.' : '';
  },
  message(v) {
    const t = v.message.trim();
    if (t.length > MESSAGE_MAX) return `Please keep your message under ${MESSAGE_MAX} characters.`;
    if (v.enquiryType !== 'demo' && !t) return 'Please tell us a little about your enquiry.';
    if (v.enquiryType !== 'demo' && t.length < 10) return 'Please add a few more details (at least 10 characters).';
    return '';
  },
  consent(v) {
    return v.consent ? '' : 'Please agree to be contacted so we can reply.';
  },
};

/** Returns an error message for one field, or '' when valid. */
export function validateField(field, values, today = new Date()) {
  return rules[field] ? rules[field](values, today) : '';
}

/** Returns { field: message } for every invalid field. */
export function validateAll(values, today = new Date()) {
  const errors = {};
  for (const field of FIELD_ORDER) {
    const message = validateField(field, values, today);
    if (message) errors[field] = message;
  }
  return errors;
}

/** The JSON sent to POST /api/enquiry. */
export function buildPayload(values, { pageUrl, elapsedMs }) {
  const demo = values.enquiryType === 'demo';
  const digits = normalisePhone(values.phone);
  return {
    enquiryType: demo ? 'demo' : 'general',
    name: values.name.trim(),
    email: values.email.trim(),
    phone: digits ? `+91${digits}` : '',
    organization: values.organization.trim(),
    product: values.product,
    demoDate: demo ? values.demoDate : '',
    demoTime: demo ? values.demoTime : '',
    message: values.message.trim(),
    consent: values.consent === true,
    website: values.website, // honeypot: stays empty for people
    pageUrl,
    elapsedMs,
  };
}

/** mailto: link used when the form cannot be sent, pre-filled from what the visitor typed. */
export function buildMailto(data, to = 'office@intelyx.co.in') {
  const productName = PRODUCT_LABELS[data.product] || 'General';
  const demo = data.enquiryType === 'demo';
  const subject = `${demo ? '[Demo Request] ' : '[Enquiry] '}${productName}${data.name ? ` - ${data.name}` : ''}`;
  const lines = [
    `Enquiry type: ${demo ? 'Request a Demo' : 'General Enquiry'}`,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Organisation: ${data.organization || '-'}`,
    `Product: ${productName}`,
  ];
  if (demo) {
    lines.push(`Preferred demo date: ${data.demoDate || 'Any'}`);
    lines.push(`Preferred time: ${data.demoTime || 'Any'}`);
  }
  lines.push('', 'Message:', data.message || '-');
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}
