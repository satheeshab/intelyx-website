import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ICONS } from '../src/data/icons.js';
import { PRODUCT_DETAILS, PRODUCTS } from '../src/data/products.js';
import { NOT_FOUND, PAGES } from '../src/data/seo.js';
import {
  FIELD_ORDER, buildMailto, buildPayload, normalisePhone, validateAll, validateField,
} from '../src/lib/validation.js';

const today = new Date(2026, 9, 31); // 31 Oct 2026
const good = {
  enquiryType: 'general', name: 'Priya Sharma', email: 'priya@example.com', phone: '98765 43210',
  organization: '', product: 'accounting', demoDate: '', demoTime: '',
  message: 'We need GST billing for three shops.', consent: true, website: '',
};

test('a complete general enquiry is valid', () => {
  assert.deepEqual(validateAll(good, today), {});
});

test('empty form reports every required field in page order', () => {
  const empty = { ...good, name: '', email: '', phone: '', product: '', message: '', consent: false };
  assert.deepEqual(Object.keys(validateAll(empty, today)), FIELD_ORDER.filter((f) => f !== 'demoDate'));
});

test('phone accepts Indian mobile formats and rejects others', () => {
  for (const ok of ['98765 43210', '+91 98765-43210', '098765 43210', '9876543210']) {
    assert.equal(validateField('phone', { ...good, phone: ok }, today), '', ok);
  }
  for (const bad of ['12345', '5876543210', '98765 4321', 'abcdefghij']) {
    assert.notEqual(validateField('phone', { ...good, phone: bad }, today), '', bad);
  }
  assert.equal(normalisePhone('+91 98765-43210'), '9876543210');
});

test('email validation', () => {
  assert.notEqual(validateField('email', { ...good, email: 'name@' }, today), '');
  assert.notEqual(validateField('email', { ...good, email: 'no-at-sign.com' }, today), '');
  assert.equal(validateField('email', { ...good, email: 'a@b.co' }, today), '');
});

test('message is optional for demos, required (10+ chars) for general enquiries', () => {
  assert.equal(validateField('message', { ...good, enquiryType: 'demo', message: '' }, today), '');
  assert.notEqual(validateField('message', { ...good, message: '' }, today), '');
  assert.notEqual(validateField('message', { ...good, message: 'short' }, today), '');
  assert.notEqual(validateField('message', { ...good, message: 'x'.repeat(2001) }, today), '');
});

test('demo date cannot be in the past', () => {
  const demo = { ...good, enquiryType: 'demo' };
  assert.notEqual(validateField('demoDate', { ...demo, demoDate: '2026-10-30' }, today), '');
  assert.equal(validateField('demoDate', { ...demo, demoDate: '2026-10-31' }, today), '');
  assert.equal(validateField('demoDate', { ...good, demoDate: '2020-01-01' }, today), ''); // ignored for general
});

test('payload uses +91 numbers, drops demo fields for general enquiries and carries the honeypot', () => {
  const p = buildPayload({ ...good, demoDate: '2026-11-01', demoTime: 'x', website: '' }, { pageUrl: 'https://x/contact', elapsedMs: 5000 });
  assert.equal(p.phone, '+919876543210');
  assert.equal(p.demoDate, '');
  assert.equal(p.website, '');
  assert.equal(p.consent, true);
});

test('mailto fallback is pre-filled', () => {
  const href = buildMailto(buildPayload({ ...good, enquiryType: 'demo', product: 'hospitals-erp' }, { pageUrl: '', elapsedMs: 0 }));
  assert.ok(href.startsWith('mailto:office@intelyx.co.in?subject=%5BDemo%20Request%5D%20Hospitals%20ERP'));
  assert.ok(decodeURIComponent(href).includes('Phone: +919876543210'));
});

test('every icon referenced by the product data exists', () => {
  for (const p of PRODUCTS) {
    assert.ok(ICONS[p.icon], `product icon ${p.icon}`);
    for (const f of PRODUCT_DETAILS[p.id].features) assert.ok(ICONS[f.icon], `feature icon ${f.icon} in ${p.id}`);
  }
});

test('every product has details, 8 features and a demo-ready id', () => {
  assert.equal(PRODUCTS.length, 4);
  for (const p of PRODUCTS) {
    assert.equal(PRODUCT_DETAILS[p.id].features.length, 8, p.id);
    assert.match(p.id, /^[a-z-]+$/);
  }
});

test('every page has a unique title and a description of a sensible length', () => {
  const titles = new Set();
  for (const [route, page] of Object.entries({ ...PAGES, '404': NOT_FOUND })) {
    assert.ok(page.title.length <= 70, `${route} title too long`);
    assert.ok(page.description.length >= 50 && page.description.length <= 200, `${route} description length`);
    assert.ok(!titles.has(page.title), `duplicate title ${route}`);
    titles.add(page.title);
  }
});
