/**
 * Runs after `vite build`. Writes one HTML file per page into dist/pages/, identical to the built
 * index.html except for the page-specific <head> (title, description, canonical, social tags and
 * structured data). The Node server sends the matching file for each URL, so crawlers and link
 * previews see the right text even though the page itself is rendered by React in the browser.
 * Also writes dist/pages/routes.json (the list of known URLs) and 404.html.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOT_FOUND, PAGES, SITE_URL } from '../src/data/seo.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'dist', 'public');
const pagesDir = path.join(root, 'dist', 'pages');
const template = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Replace one tag (matched by regex); fail the build if the template doesn't have it. */
function replaceTag(html, pattern, replacement, name) {
  if (!pattern.test(html)) throw new Error(`prerender-head: "${name}" tag not found in index.html`);
  return html.replace(pattern, () => replacement);
}

function render(page, url) {
  let html = template;
  html = replaceTag(html, /<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`, 'title');
  html = replaceTag(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(page.description)}">`, 'description');
  html = replaceTag(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(page.title)}">`, 'og:title');
  html = replaceTag(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(page.description)}">`, 'og:description');
  if (url) {
    html = replaceTag(html, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`, 'canonical');
    html = replaceTag(html, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`, 'og:url');
  } else {
    html = html.replace(/\s*<link rel="canonical" href="[^"]*">/, '').replace(/\s*<meta property="og:url" content="[^"]*">/, '');
  }
  const extra = [];
  if (page.noindex) extra.push('<meta name="robots" content="noindex">');
  if (page.jsonLd) extra.push(`<script type="application/ld+json" data-page-ld>${JSON.stringify(page.jsonLd)}</script>`);
  if (extra.length) html = html.replace('</head>', () => `  ${extra.join('\n  ')}\n</head>`);
  return html;
}

fs.rmSync(pagesDir, { recursive: true, force: true });
fs.mkdirSync(pagesDir, { recursive: true });

const routes = [];
for (const [route, page] of Object.entries(PAGES)) {
  const file = route === '/' ? 'home.html' : `${route.slice(1)}.html`;
  fs.writeFileSync(path.join(pagesDir, file), render(page, `${SITE_URL}${route}`));
  routes.push({ path: route, file });
}
fs.writeFileSync(path.join(pagesDir, '404.html'), render(NOT_FOUND, null));
fs.writeFileSync(path.join(pagesDir, 'routes.json'), JSON.stringify(routes, null, 2));
console.log(`Pre-rendered ${routes.length} pages + 404 into ${path.relative(process.cwd(), pagesDir) || pagesDir}`);
