import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalisePhone, sanitize, validate } from '../src/enquiry/validate.js';
import { buildAckEmail, buildSubject, buildTeamEmail } from '../src/enquiry/emails.js';
import { goodEnquiry } from './helpers.js';

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

test('validate accepts a good demo request and lower-cases the email', () => {
  const { data, errors } = validate(goodEnquiry);
  assert.equal(errors, undefined);
  assert.equal(data.email, 'priya@example.com');
  assert.equal(data.phone, '+919876543210');
});

test('validate requires a message for general enquiries only', () => {
  assert.ok(validate({ ...goodEnquiry, enquiryType: 'general', message: '' }).errors.message);
  assert.equal(validate({ ...goodEnquiry, enquiryType: 'demo', message: '' }).errors, undefined);
});

test('validate rejects bad fields', () => {
  const { errors } = validate({ ...goodEnquiry, email: 'nope', phone: '123', product: 'x', consent: false, message: 'x'.repeat(2001) });
  assert.deepEqual(Object.keys(errors).sort(), ['consent', 'email', 'message', 'phone', 'product']);
});

test('validate rejects inherited property names as products', () => {
  assert.ok(validate({ ...goodEnquiry, product: 'constructor' }).errors.product);
  assert.ok(validate({ ...goodEnquiry, product: '__proto__' }).errors.product);
});

test('validate tolerates non-object input', () => {
  assert.ok(validate(null).errors);
  assert.ok(validate('text').errors);
  assert.ok(validate([]).errors);
});

test('subjects follow the agreed format', () => {
  const { data } = validate(goodEnquiry);
  assert.equal(buildSubject(data), '[Demo Request] Hospitals ERP – Priya Sharma, Green Valley School');
  const { data: g } = validate({ ...goodEnquiry, enquiryType: 'general', product: 'accounting', message: 'Need GST billing for 3 shops' });
  assert.equal(buildSubject(g), '[Enquiry] Accounting Software – Priya Sharma');
});

test('subject cannot carry header injection', () => {
  const { data } = validate({ ...goodEnquiry, name: 'Eve\r\nBcc: x@y.com' });
  assert.ok(!/[\r\n]/.test(buildSubject(data)));
});

test('emails escape user content and include the signature', () => {
  const { data } = validate({ ...goodEnquiry, enquiryType: 'general', message: 'Tom & Jerry "quotes" are fine here' });
  const { html, text } = buildTeamEmail(data, '1 Jan 2030, 10:00 am IST');
  assert.ok(html.includes('Tom &amp; Jerry &quot;quotes&quot;'));
  assert.ok(text.includes('Tom & Jerry'));
  assert.ok(html.includes('1 Jan 2030, 10:00 am IST'));
  const ack = buildAckEmail(data);
  assert.ok(ack.html.includes('Request a Demo'));
  assert.ok(ack.html.includes('/contact?type=demo&utm_source=email&utm_medium=signature#enquiry'));
  assert.ok(ack.html.includes('Team Intelyx'));
});
