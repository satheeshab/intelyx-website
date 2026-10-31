/**
 * Intelyx branded email signature.
 *
 * This is the single source for the signature block. It is used:
 *   - at the bottom of the acknowledgement email sent by the server, and
 *   - to generate /email-signature/signature.html and signature.txt
 *     (run `npm run signature` from the repository root after editing).
 *
 * Email-client rules followed here: table layout, inline CSS only,
 * web-safe fonts, max width 500px, no JavaScript, no background images,
 * and a "bulletproof" button (a coloured table cell, not an image).
 */

const SITE = 'https://www.intelyx.co.in';
export const LOGO_URL = `${SITE}/assets/img/logo-email.png`;
export const DEMO_URL =
  `${SITE}/contact?type=demo&utm_source=email&utm_medium=signature#enquiry`;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * HTML signature block.
 * @param {{ name?: string, designation?: string }} [person]
 */
export function signatureHtml({ name = '[Full Name]', designation = '[Designation]' } = {}) {
  const font = 'Arial, Helvetica, sans-serif';
  const link = 'color:#a94727; text-decoration:none;';
  const row = `font-family:${font}; font-size:13px; line-height:20px; color:#3d3d3a; padding:0 0 2px 0;`;

  return `<!-- Intelyx email signature: start -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:500px; width:100%; border-collapse:collapse; font-family:${font};">
  <tr>
    <td style="padding:0 0 12px 0;">
      <a href="${SITE}" style="text-decoration:none;"><img src="${LOGO_URL}" width="132" height="40" alt="Intelyx" style="display:block; width:132px; height:40px; border:0; outline:none; text-decoration:none;"></a>
    </td>
  </tr>
  <tr>
    <td style="border-top:2px solid #d97757; padding:12px 0 0 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td style="font-family:${font}; font-size:16px; line-height:22px; font-weight:bold; color:#141413; padding:0 0 2px 0;">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="font-family:${font}; font-size:13px; line-height:20px; color:#5e5d59; padding:0 0 10px 0;">${escapeHtml(designation)}, Intelyx Tech Solutions LLP</td>
        </tr>
        <tr>
          <td style="${row}">&#128222;&nbsp; <a href="tel:+919380577396" style="${link}">+91 93805 77396</a></td>
        </tr>
        <tr>
          <td style="${row}">&#9993;&#65039;&nbsp; <a href="mailto:office@intelyx.co.in" style="${link}">office@intelyx.co.in</a></td>
        </tr>
        <tr>
          <td style="${row}">&#127760;&nbsp; <a href="${SITE}" style="${link}">www.intelyx.co.in</a></td>
        </tr>
        <tr>
          <td style="${row} padding:0 0 14px 0;">&#128205;&nbsp; Sarjapura Road, Bengaluru, India</td>
        </tr>
        <tr>
          <td style="padding:0;">
            <!-- Bulletproof button: coloured table cell, shows even with images blocked -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
              <tr>
                <td align="center" bgcolor="#141413" style="background-color:#141413; border-radius:6px; padding:10px 18px; mso-padding-alt:10px 18px;">
                  <a href="${DEMO_URL}" target="_blank" style="font-family:${font}; font-size:14px; line-height:18px; font-weight:bold; color:#faf9f5; text-decoration:none; display:inline-block;">Request a Demo &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<!-- Intelyx email signature: end -->`;
}

/**
 * Plain-text signature.
 * @param {{ name?: string, designation?: string }} [person]
 */
export function signatureText({ name = '[Full Name]', designation = '[Designation]' } = {}) {
  return [
    name,
    `${designation}, Intelyx Tech Solutions LLP`,
    '📞 +91 93805 77396',
    '✉️ office@intelyx.co.in',
    '🌐 www.intelyx.co.in',
    '📍 Sarjapura Road, Bengaluru, India',
    '',
    `Request a Demo: ${DEMO_URL}`,
  ].join('\n');
}
