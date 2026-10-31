/** POST /api/enquiry: validate, then email the team (and optionally the visitor). */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { redact } from '../logger.js';
import { validate } from './validate.js';
import { buildAckEmail, buildTeamEmail } from './emails.js';

export function enquiryRouter({ config, mailer, logger }) {
  const router = Router();
  const { mail } = config;

  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({ ok: false, error: 'Too many requests. Please wait a minute and try again.' }),
  });

  router.post('/enquiry', limiter, async (req, res) => {
    if (!req.is('application/json')) {
      return res.status(415).json({ ok: false, error: 'Please send JSON.' });
    }
    const input = req.body;

    // Spam traps: a filled honeypot or an impossibly fast submission.
    // Reply with a normal success so bots learn nothing.
    const elapsed = Number(input?.elapsedMs);
    const honeypot = typeof input?.website === 'string' && input.website.trim() !== '';
    if (honeypot || (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < config.minFillMs)) {
      logger.info('spam_dropped', { reason: honeypot ? 'honeypot' : 'too_fast' });
      return res.json({ ok: true });
    }

    const { data, errors } = validate(input);
    if (errors) {
      logger.info('validation_failed', { fields: Object.keys(errors) });
      return res.status(400).json({
        ok: false,
        error: 'Please check the highlighted details and try again.',
        fields: errors,
      });
    }

    // Safe to log: no names, phone numbers, addresses or messages.
    const meta = { enquiryType: data.enquiryType, product: data.product, emailDomain: data.email.split('@')[1] };

    try {
      await mailer.send({ to: mail.toEmail, replyTo: data.email, fromName: mail.fromName, ...buildTeamEmail(data) });
      logger.info('enquiry_sent', meta);
    } catch (err) {
      logger.error('enquiry_send_failed', { ...meta, errorName: err?.name, errorCode: err?.code, errorMessage: redact(err?.message) });
      return res.status(500).json({
        ok: false,
        error: 'We could not send your enquiry right now. Please try again or email office@intelyx.co.in.',
      });
    }

    if (mail.sendAck) {
      try {
        await mailer.send({ to: data.email, replyTo: mail.toEmail, fromName: 'Intelyx', ...buildAckEmail(data) });
        logger.info('ack_sent', meta);
      } catch (err) {
        // The team already has the enquiry, so don't fail the request.
        logger.warn('ack_send_failed', { ...meta, errorName: err?.name, errorMessage: redact(err?.message) });
      }
    }

    return res.json({ ok: true });
  });

  return router;
}
