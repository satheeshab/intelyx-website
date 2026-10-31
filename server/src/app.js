/**
 * Builds the Express app. Kept separate from index.js so tests can create an app
 * with a fake mailer and a temporary client build.
 */
import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import { createLogger } from './logger.js';
import { enquiryRouter } from './enquiry/routes.js';
import { clientBuilt, mountClient } from './static.js';

export function createApp({ config, mailer, logger = createLogger() }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  // Health check for the Lightsail load balancer (before any redirects).
  app.get('/healthz', (req, res) => res.type('text').send('ok'));

  // Production redirects: HTTP -> HTTPS, and the bare domain -> www.
  app.use((req, res, next) => {
    const host = (req.hostname || '').toLowerCase();
    if (config.apexHost && host === config.apexHost) {
      return res.redirect(301, `https://${config.canonicalHost}${req.originalUrl}`);
    }
    if (config.forceHttps && req.protocol !== 'https') {
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }
    return next();
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https://*.google.com', 'https://*.googleapis.com', 'https://*.gstatic.com'],
          frameSrc: ['https://www.google.com', 'https://maps.google.com'],
          connectSrc: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          objectSrc: ["'none'"],
          // Only when HTTPS is enforced; otherwise a local production run on http://localhost would break.
          ...(config.forceHttps ? { upgradeInsecureRequests: [] } : {}),
        },
      },
      hsts: config.forceHttps ? { maxAge: 63_072_000, includeSubDomains: true, preload: true } : false,
      // Email apps load /assets/img/logo-email.png from other origins.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use(compression());

  // ---- API ----
  const api = express.Router();
  api.use(express.json({ limit: '16kb' }));
  api.use(enquiryRouter({ config, mailer, logger }));
  api.use((req, res) => res.status(404).json({ ok: false, error: 'Not found.' }));
  api.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    if (err?.type === 'entity.too.large') return res.status(413).json({ ok: false, error: 'Your message is too long.' });
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ ok: false, error: 'Invalid request.' });
    logger.error('unhandled_error', { errorName: err?.name });
    return res.status(500).json({ ok: false, error: 'Something went wrong.' });
  });
  app.use('/api', api);

  // ---- React app ----
  if (clientBuilt(config.clientDist)) {
    mountClient(app, config.clientDist);
  } else {
    app.use((req, res) =>
      res.status(404).type('text').send(
        'The website has not been built yet. In development open http://localhost:5173 (npm run dev); ' +
          'for production mode run "npm run build" first.',
      ),
    );
  }

  return app;
}
