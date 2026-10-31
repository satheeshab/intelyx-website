import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { makeFakeDist, startServer } from './helpers.js';

const dist = makeFakeDist();
const t = await startServer({ dist });
after(() => t.close());
const get = (p, opts = {}) => fetch(`${t.base}${p}`, { redirect: 'manual', ...opts });

test('known pages return their own pre-rendered HTML', async () => {
  assert.match(await (await get('/')).text(), /Home page/);
  assert.match(await (await get('/about')).text(), /About page/);
  assert.match(await (await get('/about/')).text(), /About page/);
  const res = await get('/about');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-cache');
});

test('unknown pages get the app shell with status 404', async () => {
  const res = await get('/no-such-page');
  assert.equal(res.status, 404);
  assert.match(await res.text(), /Not found page/);
});

test('missing files get a plain 404', async () => {
  const res = await get('/assets/missing.js');
  assert.equal(res.status, 404);
  assert.equal(await res.text(), 'Not found');
});

test('hashed assets are cached for a year; other files for a day', async () => {
  assert.equal((await get('/assets/index-abcdefgh.js')).headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal((await get('/robots.txt')).headers.get('cache-control'), 'public, max-age=86400');
});

test('old .html addresses redirect to clean URLs and keep the query', async () => {
  let res = await get('/about.html');
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), '/about');
  res = await get('/index.html');
  assert.equal(res.headers.get('location'), '/');
  res = await get('/contact.html?type=demo&utm_source=email');
  assert.equal(res.headers.get('location'), '/contact?type=demo&utm_source=email');
});

/** fetch() cannot override the Host header, so use node:http for these requests. */
function rawGet(base, path, headers) {
  const { port } = new URL(base);
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path, headers }, (res) => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location }));
    }).on('error', reject);
  });
}

test('the bare domain redirects to www and plain HTTP to HTTPS when enabled', async () => {
  const prod = await startServer({ dist, env: { APEX_HOST: 'intelyx.co.in', FORCE_HTTPS: 'true' } });
  try {
    let res = await rawGet(prod.base, '/about?x=1', { host: 'intelyx.co.in', 'x-forwarded-proto': 'https' });
    assert.equal(res.status, 301);
    assert.equal(res.location, 'https://www.intelyx.co.in/about?x=1');

    res = await rawGet(prod.base, '/about', { host: 'www.intelyx.co.in', 'x-forwarded-proto': 'http' });
    assert.equal(res.status, 301);
    assert.equal(res.location, 'https://www.intelyx.co.in/about');

    // already HTTPS on www: served normally; health checks are never redirected
    assert.equal((await rawGet(prod.base, '/about', { host: 'www.intelyx.co.in', 'x-forwarded-proto': 'https' })).status, 200);
    assert.equal((await rawGet(prod.base, '/healthz', { host: 'abc.cs.amazonlightsail.com', 'x-forwarded-proto': 'http' })).status, 200);
    // the default Lightsail address is not redirected to www
    assert.equal((await rawGet(prod.base, '/about', { host: 'abc.cs.amazonlightsail.com', 'x-forwarded-proto': 'https' })).status, 200);
  } finally {
    await prod.close();
  }
});
