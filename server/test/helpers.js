/** Test helpers: start the real app on a random port with a fake mailer. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

export const silentLogger = { info() {}, warn() {}, error() {} };

export const goodEnquiry = {
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
  pageUrl: 'https://www.intelyx.co.in/contact?type=demo',
  elapsedMs: 9000,
};

/** A tiny fake client build: dist/public + dist/pages, like `npm run build` produces. */
export function makeFakeDist() {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'intelyx-dist-'));
  fs.mkdirSync(path.join(dist, 'public', 'assets'), { recursive: true });
  fs.mkdirSync(path.join(dist, 'pages'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'public', 'assets', 'index-abcdefgh.js'), 'console.log(1)');
  fs.writeFileSync(path.join(dist, 'public', 'robots.txt'), 'User-agent: *');
  fs.writeFileSync(path.join(dist, 'pages', 'home.html'), '<html><title>Home page</title></html>');
  fs.writeFileSync(path.join(dist, 'pages', 'about.html'), '<html><title>About page</title></html>');
  fs.writeFileSync(path.join(dist, 'pages', '404.html'), '<html><title>Not found page</title></html>');
  fs.writeFileSync(
    path.join(dist, 'pages', 'routes.json'),
    JSON.stringify([{ path: '/', file: 'home.html' }, { path: '/about', file: 'about.html' }]),
  );
  return dist;
}

export async function startServer({ env = {}, dist } = {}) {
  const config = loadConfig({ NODE_ENV: 'test', RATE_LIMIT_MAX: '1000', ...env, CLIENT_DIST: dist || path.join(os.tmpdir(), 'intelyx-no-dist') });
  const sent = [];
  const mailer = {
    transport: 'fake',
    failWith: null,
    async send(message) {
      if (this.failWith) throw this.failWith;
      sent.push(message);
    },
  };
  const app = createApp({ config, mailer, logger: silentLogger });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base, sent, mailer, config,
    close: () => new Promise((resolve) => server.close(resolve)),
    post: (body, headers = {}) =>
      fetch(`${base}/api/enquiry`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      }),
  };
}
