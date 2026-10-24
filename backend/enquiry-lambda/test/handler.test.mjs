/**
 * Unit tests for the enquiry Lambda (no AWS calls: DRY_RUN is on).
 * Run with:  npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.DRY_RUN = 'true';
process.env.SEND_ACK = 'true';
process.env.ALLOWED_ORIGINS = 'https://www.intelyx.co.in,https://intelyx.co.in,http://localhost';

const mod = await import('../index.mjs');
const { handler, validate, sanitize, normalisePhone, buildSubject, buildTeamEmail, buildAckEmail, isOriginAllowed } = mod;

const good = {
  enquiryType: 'demo',
  name: 'Priya Sharma',
  email: 'Priya@Example.com',
  phone: '98765 43210',
  organization: 'Green Valley School',
  product: 'hospitals-erp',
  demoDate: '2030-01-15',
  demoTime: '10:00 AM - 12:00 PM',
  message: '',
  consent: true,
  website: '',
  pageUrl: 'https://www.intelyx.co.in/contact.html?type=demo',
  elapsedMs: 9000,
};

const event = (body, origin = 'https://www.intelyx.co.in', extra = {}) => ({
  requestContext: { http: { method: 'POST' }, requestId: 'test' },
  headers: { origin, 'content-type': 'application/json' },
  body: JSON.stringify(body),
  ...extra,
});

test('sanitize strips tags and control characters', () => {
  assert.equal(sanitize('<b>Hi</b> <script>x</script>there\u0007'), 'Hi xthere');
  assert.equal(sanitize('a\r\n\r\n\r\n\r\nb', { multiline: true }), 'a\n\nb');
});

test('normalisePhone accepts common Indian formats', () => {
  assert.equal(normalisePhone('98765 43210'), '+919876543210');
  assert.equal(normalisePhone('+91-98765-43210'), '+919876543210');
  assert.equal(normalisePhone('098765 43210'), '+919876543210');
  assert.equal(normalisePhone('12345 67890'), '');
  assert.equal(normalisePhone('98765'), '');
});

test('validate accepts a good demo request and lower-cases email', () => {
  const { data, errors } = validate(good);
  assert.equal(errors, undefined);
  assert.equal(data.email, 'priya@example.com');
  assert.equal(data.phone, '+919876543210');
});

test('validate requires a message for general enquiries', () => {
  const { errors } = validate({ ...good, enquiryType: 'general', message: '' });
  assert.ok(errors.message);
});

test('validate rejects bad fields', () => {
  const { errors } = validate({ ...good, email: 'nope', phone: '123', product: 'x', consent: false, message: 'x'.repeat(2001) });
  assert.deepEqual(Object.keys(errors).sort(), ['consent', 'email', 'message', 'phone', 'product']);
});

test('subjects follow the agreed format', () => {
  const { data } = validate(good);
  assert.equal(buildSubject(data), '[Demo Request] Hospitals ERP – Priya Sharma, Green Valley School');
  const { data: g } = validate({ ...good, enquiryType: 'general', product: 'accounting', message: 'Need GST billing for 3 shops' });
  assert.equal(buildSubject(g), '[Enquiry] Accounting Software – Priya Sharma');
});

test('subject cannot carry header injection', () => {
  const { data } = validate({ ...good, name: 'Eve\r\nBcc: x@y.com' });
  assert.ok(!/[\r\n]/.test(buildSubject(data)));
});

test('emails escape user content', () => {
  const { data } = validate({ ...good, enquiryType: 'general', message: 'Tom & Jerry "quotes" are fine here' });
  const { html, text } = buildTeamEmail(data, '1 Jan 2030, 10:00 am IST');
  assert.ok(html.includes('Tom &amp; Jerry &quot;quotes&quot;'));
  assert.ok(text.includes('Tom & Jerry'));
  assert.ok(html.includes('1 Jan 2030, 10:00 am IST'));
  const ack = buildAckEmail(data);
  assert.ok(ack.html.includes('Request a Demo'));
  assert.ok(ack.html.includes('Team Intelyx'));
});

test('origin checks', () => {
  assert.ok(isOriginAllowed('https://www.intelyx.co.in'));
  assert.ok(isOriginAllowed('http://localhost:5500'));
  assert.ok(!isOriginAllowed('https://evil.example'));
  assert.ok(!isOriginAllowed(''));
});

test('handler: success', async () => {
  const res = await handler(event(good));
  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), { ok: true });
  assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://www.intelyx.co.in');
});

test('handler: honeypot is silently accepted', async () => {
  const res = await handler(event({ ...good, website: 'http://spam' }));
  assert.equal(res.statusCode, 200);
});

test('handler: too-fast submissions are silently accepted', async () => {
  const res = await handler(event({ ...good, elapsedMs: 200 }));
  assert.equal(res.statusCode, 200);
});

test('handler: validation errors return 400 with fields', async () => {
  const res = await handler(event({ ...good, email: 'bad' }));
  assert.equal(res.statusCode, 400);
  const body = JSON.parse(res.body);
  assert.equal(body.ok, false);
  assert.ok(body.fields.email);
});

test('handler: rejects disallowed origin, wrong method, non-JSON, oversized', async () => {
  assert.equal((await handler(event(good, 'https://evil.example'))).statusCode, 403);
  assert.equal((await handler({ ...event(good), requestContext: { http: { method: 'GET' } } })).statusCode, 405);
  assert.equal((await handler({ ...event(good), headers: { origin: 'https://www.intelyx.co.in', 'content-type': 'text/plain' } })).statusCode, 415);
  assert.equal((await handler(event({ ...good, message: 'x'.repeat(20000) }))).statusCode, 413);
  assert.equal((await handler({ ...event(good), body: '{not json' })).statusCode, 400);
});

test('handler: base64 bodies are decoded', async () => {
  const e = event(good);
  e.body = Buffer.from(e.body).toString('base64');
  e.isBase64Encoded = true;
  assert.equal((await handler(e)).statusCode, 200);
});
