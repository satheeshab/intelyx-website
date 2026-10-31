// Sends the enquiry to the Node server (same origin in production; proxied by Vite in development).
export const ENQUIRY_URL = '/api/enquiry';
const TIMEOUT_MS = 15_000;

/** @returns {Promise<{ok: boolean, status: number, body: object}>}  Never throws for HTTP errors. */
export async function sendEnquiry(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENQUIRY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
      credentials: 'same-origin',
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok && body.ok === true, status: res.status, body };
  } catch (err) {
    return { ok: false, status: 0, body: {}, timedOut: err?.name === 'AbortError' };
  } finally {
    clearTimeout(timer);
  }
}
