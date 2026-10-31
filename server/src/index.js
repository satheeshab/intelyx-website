/** Server entry point: `npm start` (production mode) and `npm run dev` (auto-restart). */
import { createApp } from './app.js';
import { assertConfig, loadConfig, loadEnvFile } from './config.js';
import { createLogger } from './logger.js';
import { createMailer } from './mailer.js';
import { clientBuilt } from './static.js';

loadEnvFile();
const config = loadConfig();
const logger = createLogger();

try {
  assertConfig(config);
} catch (err) {
  console.error(`\nConfiguration error: ${err.message}\n`);
  process.exit(1);
}

const mailer = createMailer(config.mail, { logger, isProd: config.isProd });
const app = createApp({ config, mailer, logger });

const server = app.listen(config.port, (err) => {
  if (err) return; // Express 5 also calls this on failure; the 'error' handler below reports it
  logger.info('server_started', {
    port: config.port,
    mode: config.nodeEnv,
    email: mailer.transport,
    clientBuilt: clientBuilt(config.clientDist),
  });
  console.log(`\n  Intelyx server: http://localhost:${config.port}`);
  if (mailer.transport === 'log') console.log('  Email: printing to this console (set SMTP_HOST to send real email)');
  if (!clientBuilt(config.clientDist)) console.log('  Website: not built (run "npm run build"), or use http://localhost:5173 in development');
  console.log('');
});

server.on('error', (err) => {
  console.error(err.code === 'EADDRINUSE' ? `\nPort ${config.port} is already in use. Set PORT to another value.\n` : err);
  process.exit(1);
});

// Lightsail sends SIGTERM when it replaces a deployment: finish in-flight requests, then exit.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    logger.info('shutting_down', { signal });
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 8000).unref();
  });
}
