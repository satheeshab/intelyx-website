import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertConfig, loadConfig } from '../src/config.js';

test('defaults: development with the console mail transport needs no settings', () => {
  const config = loadConfig({});
  assert.equal(config.mail.transport, 'log');
  assert.equal(config.port, 3001);
  assert.doesNotThrow(() => assertConfig(config));
});

test('SMTP_HOST switches to the smtp transport and requires credentials', () => {
  assert.throws(() => assertConfig(loadConfig({ SMTP_HOST: 'smtp.example.com' })), /SMTP_USER, SMTP_PASS are missing/);
  const ok = loadConfig({ SMTP_HOST: 'smtp.example.com', SMTP_USER: 'u', SMTP_PASS: 'p' });
  assert.equal(ok.mail.transport, 'smtp');
  assert.equal(ok.mail.secure, false);
  assert.equal(loadConfig({ SMTP_HOST: 'h', SMTP_PORT: '465' }).mail.secure, true);
});

test('production refuses to start without working email settings', () => {
  assert.throws(() => assertConfig(loadConfig({ NODE_ENV: 'production' })), /Refusing to start in production/);
  assert.doesNotThrow(() => assertConfig(loadConfig({ NODE_ENV: 'production', ALLOW_LOG_EMAIL: 'true' })));
  assert.doesNotThrow(() => assertConfig(loadConfig({ NODE_ENV: 'production', SMTP_HOST: 'h', SMTP_USER: 'u', SMTP_PASS: 'p' })));
});

test('invalid transport names are rejected', () => {
  assert.throws(() => assertConfig(loadConfig({ EMAIL_TRANSPORT: 'carrier-pigeon' })), /EMAIL_TRANSPORT/);
});
