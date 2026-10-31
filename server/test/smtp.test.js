/**
 * Exercises the real Nodemailer SMTP transport against a tiny in-process SMTP server,
 * so the "email goes out over SMTP" path is tested without any external service.
 */
import net from 'node:net';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createMailer } from '../src/mailer.js';
import { goodEnquiry, silentLogger } from './helpers.js';

/** Minimal SMTP server: accepts AUTH PLAIN/LOGIN, records every delivered message. */
function startFakeSmtp({ rejectAuth = false } = {}) {
  const messages = [];
  const server = net.createServer((socket) => {
    let mode = 'command';
    let data = '';
    let envelope = { from: '', to: [], auth: '' };
    const send = (line) => socket.write(`${line}\r\n`);
    send('220 fake.smtp ESMTP');
    let buffer = '';
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let idx;
      while ((idx = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (mode === 'data') {
          if (line === '.') {
            messages.push({ ...envelope, raw: data });
            data = '';
            mode = 'command';
            send('250 OK queued');
          } else {
            data += (line.startsWith('..') ? line.slice(1) : line) + '\r\n';
          }
          continue;
        }
        const cmd = line.toUpperCase();
        if (cmd.startsWith('EHLO') || cmd.startsWith('HELO')) {
          socket.write('250-fake.smtp\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n');
        } else if (cmd.startsWith('AUTH PLAIN')) {
          const [, , token] = line.split(' ');
          envelope.auth = Buffer.from(token || '', 'base64').toString('utf8').replace(/\0/g, '|');
          send(rejectAuth ? '535 5.7.8 Authentication failed' : '235 2.7.0 Accepted');
        } else if (cmd.startsWith('MAIL FROM')) {
          envelope.from = line.slice(10).replace(/[<>]/g, '').split(' ')[0].trim();
          send('250 OK');
        } else if (cmd.startsWith('RCPT TO')) {
          envelope.to.push(line.slice(8).replace(/[<>]/g, '').trim());
          send('250 OK');
        } else if (cmd === 'DATA') {
          mode = 'data';
          send('354 End data with <CR><LF>.<CR><LF>');
        } else if (cmd === 'QUIT') {
          send('221 Bye');
          socket.end();
        } else if (cmd === 'RSET') {
          envelope = { from: '', to: [], auth: envelope.auth };
          send('250 OK');
        } else {
          send('250 OK');
        }
      }
    });
    socket.on('error', () => {});
  });
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () =>
      resolve({ port: server.address().port, messages, close: () => new Promise((r) => server.close(r)) }),
    ),
  );
}

const smtp = await startFakeSmtp();
const rejecting = await startFakeSmtp({ rejectAuth: true });
after(async () => { await smtp.close(); await rejecting.close(); });

const mailEnv = (port) => ({
  SMTP_HOST: '127.0.0.1', SMTP_PORT: String(port), SMTP_USER: 'AKIATESTUSER', SMTP_PASS: 'secret-pass',
  TO_EMAIL: 'office@intelyx.co.in', FROM_EMAIL: 'no-reply@intelyx.co.in', SEND_ACK: 'true',
});

async function appFor(port) {
  const config = loadConfig({ NODE_ENV: 'test', RATE_LIMIT_MAX: '1000', ...mailEnv(port) });
  const mailer = createMailer(config.mail, { logger: silentLogger });
  const server = await new Promise((resolve) => { const s = createApp({ config, mailer, logger: silentLogger }).listen(0, () => resolve(s)); });
  return { server, url: `http://127.0.0.1:${server.address().port}/api/enquiry` };
}

const post = (url, body) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('an enquiry is delivered over SMTP to the team, then acknowledged to the visitor', async () => {
  const { server, url } = await appFor(smtp.port);
  try {
    const res = await post(url, goodEnquiry);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });

    assert.equal(smtp.messages.length, 2);
    const [team, ack] = smtp.messages;

    assert.equal(team.auth, '|AKIATESTUSER|secret-pass'); // credentials reached the server
    assert.equal(team.from, 'no-reply@intelyx.co.in');
    assert.deepEqual(team.to, ['office@intelyx.co.in']);
    assert.match(team.raw, /^From: "?Intelyx Website"? <no-reply@intelyx\.co\.in>/m);
    assert.match(team.raw, /^Reply-To: priya@example\.com/m);
    assert.match(team.raw, /^To: office@intelyx\.co\.in/m);
    assert.match(team.raw, /^Subject: \[Demo Request\] Hospitals ERP =E2=80=93 Priya Sharma|^Subject: =\?UTF-8\?/m);
    assert.match(team.raw, /Content-Type: multipart\/alternative/);
    assert.match(team.raw, /Content-Type: text\/plain/);
    assert.match(team.raw, /Content-Type: text\/html/);

    assert.deepEqual(ack.to, ['priya@example.com']);
    assert.match(ack.raw, /^Reply-To: office@intelyx\.co\.in/m);
  } finally {
    server.close();
  }
});

test('a rejected login becomes a friendly 500 and does not leak credentials', async () => {
  const { server, url } = await appFor(rejecting.port);
  try {
    const res = await post(url, goodEnquiry);
    assert.equal(res.status, 500);
    const text = JSON.stringify(await res.json());
    assert.ok(!text.includes('secret-pass') && !text.includes('AKIATESTUSER'));
    assert.match(text, /office@intelyx\.co\.in/); // tells the visitor how to reach us instead
  } finally {
    server.close();
  }
});

test('header injection in the name cannot add recipients', async () => {
  smtp.messages.length = 0;
  const { server, url } = await appFor(smtp.port);
  try {
    const res = await post(url, { ...goodEnquiry, name: 'Eve\r\nBcc: attacker@evil.example', email: 'eve@example.com' });
    assert.equal(res.status, 200);
    for (const m of smtp.messages) {
      assert.ok(!m.to.some((r) => r.includes('evil')), 'no extra recipient');
      assert.ok(!/^Bcc:/m.test(m.raw), 'no injected header');
    }
  } finally {
    server.close();
  }
});
