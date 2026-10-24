/*
 * Intelyx — site configuration.
 * --------------------------------------------------------------------------
 * This is the ONE place to set the enquiry API endpoint.
 * After deploying the backend (see README → "Deploy the enquiry backend"),
 * copy the "EnquiryApiUrl" output from the SAM stack and paste it below.
 *
 * Nothing secret belongs in this file: it is public and served to browsers.
 */
window.INTELYX_CONFIG = Object.freeze({
  // Example: 'https://abc123xyz.execute-api.ap-south-1.amazonaws.com/enquiry'
  enquiryApiUrl: 'https://REPLACE_WITH_API_ID.execute-api.ap-south-1.amazonaws.com/enquiry',

  // Shown in the error fallback ("email us directly") link.
  contactEmail: 'office@intelyx.co.in',

  // Request timeout for the enquiry form, in milliseconds.
  requestTimeoutMs: 15000
});
