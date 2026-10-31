/** Minimal JSON logger. Never pass names, phone numbers or messages to it. */
export function createLogger(sink = console) {
  const write = (level, msg, extra = {}) => {
    const line = JSON.stringify({ time: new Date().toISOString(), level, msg, ...extra });
    (level === 'error' ? sink.error : level === 'warn' ? sink.warn : sink.log)(line);
  };
  return {
    info: (msg, extra) => write('info', msg, extra),
    warn: (msg, extra) => write('warn', msg, extra),
    error: (msg, extra) => write('error', msg, extra),
  };
}

/** SES/SMTP error messages can quote addresses; strip them before logging. */
export const redact = (text) =>
  String(text || '').replace(/[^\s@<>"']+@[^\s@<>"']+/g, '[email]').slice(0, 300);
