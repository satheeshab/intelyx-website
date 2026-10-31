/**
 * Serves the built React app (client/dist) as a single-page app:
 *   - /assets/* and other files come from dist/public (hashed files are cached for a year)
 *   - each known page (/, /about, ...) is answered with its own pre-rendered <head>
 *     (title, description, social tags) so link previews and search results are right
 *   - anything else gets the app shell with a 404 status; the React router shows the Not found page
 *   - old *.html addresses redirect to the clean URL (e.g. /about.html -> /about)
 */
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';

export function clientBuilt(distDir) {
  return fs.existsSync(path.join(distDir, 'pages', 'routes.json'));
}

export function mountClient(app, distDir) {
  const publicDir = path.join(distDir, 'public');
  const pagesDir = path.join(distDir, 'pages');
  const routes = JSON.parse(fs.readFileSync(path.join(pagesDir, 'routes.json'), 'utf8'));

  // /about.html -> /about, /index.html -> / (keeps the query string)
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (!req.path.endsWith('.html')) return next();
    const clean = req.path.replace(/\/?index\.html$/, '/').replace(/\.html$/, '') || '/';
    const q = req.originalUrl.indexOf('?');
    res.redirect(301, clean + (q === -1 ? '' : req.originalUrl.slice(q)));
  });

  const hashed = /[\\/]assets[\\/][^\\/]+-[A-Za-z0-9_-]{8,}\.(?:js|css|woff2?|map)$/;
  app.use(
    express.static(publicDir, {
      index: false,
      redirect: false,
      setHeaders(res, file) {
        res.setHeader(
          'Cache-Control',
          hashed.test(file) ? 'public, max-age=31536000, immutable' : 'public, max-age=86400',
        );
      },
    }),
  );

  const sendPage = (file, status = 200) => (req, res) => {
    res.status(status).set('Cache-Control', 'no-cache').type('html').sendFile(path.join(pagesDir, file));
  };

  for (const route of routes) app.get(route.path, sendPage(route.file));

  // Unknown address: missing files get a plain 404, anything else the app shell (React shows "Not found").
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (path.extname(req.path)) return res.status(404).type('text').send('Not found');
    return sendPage('404.html', 404)(req, res);
  });
}
