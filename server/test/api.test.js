import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { goodEnquiry, startServer } from './helpers.js';

const t = await startServer({ env: { SEND_ACK: 'true' } });
after(() => t.close());

test('POST /api/enquiry: success sends the team email and the acknowledgement', async () => {
  t.sent.length = 0;
  const res = await t.post(goodEnquiry);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(t.sent.length, 2);
  const [team, ack] = t.sent;
  assert.equal(team.to, 'office@intelyx.co.in');
  assert.equal(team.replyTo, 'priya@example.com');
  assert.match(team.subject, /^\[Demo Request\] Hospitals ERP/);
  assert.equal(ack.to, 'priya@example.com');
  assert.equal(ack.replyTo, 'office@intelyx.co.in');
});

test('POST /api/enquiry: a failed acknowledgement does not fail the request', async () => {
  t.sent.length = 0;
  let calls = 0;
  const original = t.mailer.send;
  t.mailer.send = async (m) => { if (++calls === 2) throw new Error('ack failed'); return original.call(t.mailer, m); };
  const res = await t.post(goodEnquiry);
  t.mailer.send = original;
  assert.equal(res.status, 200);
  assert.equal(t.sent.length, 1);
});

test('POST /api/enquiry: honeypot and too-fast submissions are silently accepted without email', async () => {
  t.sent.length = 0;
  assert.equal((await t.post({ ...goodEnquiry, website: 'http://spam' })).status, 200);
  assert.equal((await t.post({ ...goodEnquiry, elapsedMs: 200 })).status, 200);
  assert.equal(t.sent.length, 0);
});

test('POST /api/enquiry: validation errors return 400 with field messages', async () => {
  const res = await t.post({ ...goodEnquiry, email: 'bad' });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.ok(body.fields.email);
});

test('POST /api/enquiry: mail failure returns 500 with a friendly message', async () => {
  t.mailer.failWith = new Error('SMTP down for someone@example.com');
  const res = await t.post(goodEnquiry);
  t.mailer.failWith = null;
  assert.equal(res.status, 500);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.ok(!JSON.stringify(body).includes('someone@example.com'));
});

test('POST /api/enquiry: rejects non-JSON, bad JSON and oversized bodies', async () => {
  assert.equal((await t.post('x=1', { 'content-type': 'application/x-www-form-urlencoded' })).status, 415);
  assert.equal((await t.post('{not json')).status, 400);
  assert.equal((await t.post({ ...goodEnquiry, message: 'x'.repeat(20000) })).status, 413);
});

test('unknown /api routes return JSON 404; GET /api/enquiry is not allowed', async () => {
  const res = await fetch(`${t.base}/api/nope`);
  assert.equal(res.status, 404);
  assert.equal((await res.json()).ok, false);
  assert.equal((await fetch(`${t.base}/api/enquiry`)).status, 404);
});

test('GET /healthz', async () => {
  const res = await fetch(`${t.base}/healthz`);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'ok');
});

test('security headers are set', async () => {
  const res = await fetch(`${t.base}/api/nope`);
  assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-powered-by'), null);
  assert.equal(res.headers.get('cross-origin-resource-policy'), 'cross-origin');
});

test('rate limit: the 6th submission within a minute gets 429', async () => {
  const limited = await startServer({ env: { RATE_LIMIT_MAX: '5' } });
  try {
    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await limited.post({ ...goodEnquiry, elapsedMs: 5 })).status);
    assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429]);
  } finally {
    await limited.close();
  }
});
