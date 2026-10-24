/*
 * Intelyx — Enquiry / Request a Demo form (contact.html)
 * --------------------------------------------------------------------------
 *  - Pre-selects product and enquiry type from ?product= and ?type=
 *  - Shows demo date/time fields only for "Request a Demo"
 *  - Friendly inline validation (on blur and on submit)
 *  - Sends the form as JSON to the API in /assets/js/config.js
 *  - Success: replaces the form with a thank-you message
 *  - Failure: shows an error with a pre-filled "email us directly" link
 */
(function () {
  'use strict';

  var form = document.getElementById('enquiry-form');
  if (!form) return;

  var config = window.INTELYX_CONFIG || {};
  var CONTACT_EMAIL = config.contactEmail || 'office@intelyx.co.in';
  var MESSAGE_MAX = 2000;
  var loadedAt = Date.now();

  var PRODUCTS = {
    'schools-erp': 'Schools ERP',
    'hospitals-erp': 'Hospitals ERP',
    'accounting': 'Accounting Software',
    'service-booking': 'Service Booking Software',
    'other': 'Other / Not sure'
  };

  // Element references
  var el = {
    wrap: document.querySelector('[data-form-wrap]'),
    success: document.getElementById('form-success'),
    successName: document.querySelector('[data-success-name]'),
    typeGeneral: document.getElementById('type-general'),
    typeDemo: document.getElementById('type-demo'),
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    organization: document.getElementById('organization'),
    product: document.getElementById('product'),
    demoFields: document.querySelector('[data-demo-fields]'),
    demoDate: document.getElementById('demoDate'),
    demoTime: document.getElementById('demoTime'),
    message: document.getElementById('message'),
    messageReq: document.querySelector('[data-message-req]'),
    messageOpt: document.querySelector('[data-message-opt]'),
    counter: document.getElementById('message-counter'),
    consent: document.getElementById('consent'),
    honeypot: document.getElementById('website'),
    submit: form.querySelector('[data-submit]'),
    submitLabel: form.querySelector('[data-submit-label]'),
    errorBox: document.getElementById('form-error'),
    errorDetail: document.querySelector('[data-error-detail]'),
    mailto: document.querySelector('[data-mailto-fallback]'),
    status: document.getElementById('form-status')
  };

  /* ---------------------------------------------------------------------
   * Helpers
   * ------------------------------------------------------------------- */
  function isDemo() {
    return el.typeDemo.checked;
  }

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function isoDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /** Accepts "98765 43210", "+91 98765-43210", "091..." and returns 10 digits (or ''). */
  function normalisePhone(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.indexOf('91') === 0) digits = digits.slice(2);
    if (digits.length === 11 && digits.charAt(0) === '0') digits = digits.slice(1);
    return digits;
  }

  function firstName(full) {
    return String(full || '').trim().split(/\s+/)[0] || 'there';
  }

  /* ---------------------------------------------------------------------
   * Validation rules: each returns an error message, or '' when valid
   * ------------------------------------------------------------------- */
  var rules = {
    name: function () {
      var v = el.name.value.trim();
      if (!v) return 'Please enter your full name.';
      if (v.length < 2) return 'Your name looks too short.';
      if (!/[A-Za-zÀ-ɏऀ-෿]/.test(v)) return 'Please use letters in your name.';
      return '';
    },
    email: function () {
      var v = el.email.value.trim();
      if (!v) return 'Please enter your email address.';
      if (v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        return 'Please enter a valid email, like name@example.com.';
      }
      return '';
    },
    phone: function () {
      var v = el.phone.value.trim();
      if (!v) return 'Please enter your mobile number.';
      if (!/^[6-9]\d{9}$/.test(normalisePhone(v))) {
        return 'Please enter a valid 10-digit Indian mobile number.';
      }
      return '';
    },
    product: function () {
      return el.product.value ? '' : 'Please choose the product you are interested in.';
    },
    demoDate: function () {
      if (!isDemo() || !el.demoDate.value) return '';
      if (el.demoDate.value < isoDate(new Date())) return 'Please choose a date from today onwards.';
      return '';
    },
    message: function () {
      var v = el.message.value.trim();
      if (v.length > MESSAGE_MAX) return 'Please keep your message under ' + MESSAGE_MAX + ' characters.';
      if (!isDemo() && !v) return 'Please tell us a little about your enquiry.';
      if (!isDemo() && v.length < 10) return 'Please add a few more details (at least 10 characters).';
      return '';
    },
    consent: function () {
      return el.consent.checked ? '' : 'Please agree to be contacted so we can reply.';
    }
  };

  function showError(field, message) {
    var input = el[field];
    var errorEl = document.getElementById(field + '-error');
    if (!input || !errorEl) return;
    errorEl.textContent = message;
    if (message) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  function validateField(field) {
    var message = rules[field]();
    showError(field, message);
    return !message;
  }

  function validateAll() {
    var firstInvalid = null;
    Object.keys(rules).forEach(function (field) {
      if (!validateField(field) && !firstInvalid) firstInvalid = el[field];
    });
    return firstInvalid;
  }

  /* ---------------------------------------------------------------------
   * Enquiry type toggle (General vs Demo)
   * ------------------------------------------------------------------- */
  function applyType() {
    var demo = isDemo();
    el.demoFields.hidden = !demo;
    el.messageReq.hidden = demo;
    el.messageOpt.hidden = !demo;
    el.message.required = !demo;
    el.submitLabel.textContent = demo ? 'Request my demo' : 'Send enquiry';
    // Re-check the message if it already shows an error
    if (el.message.getAttribute('aria-invalid') === 'true') validateField('message');
  }

  /* ---------------------------------------------------------------------
   * Pre-fill from the URL: contact.html?product=hospitals-erp&type=demo#enquiry
   * ------------------------------------------------------------------- */
  function prefillFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var product = (params.get('product') || '').toLowerCase();
    var type = (params.get('type') || '').toLowerCase();

    if (PRODUCTS[product]) el.product.value = product;
    if (type === 'demo') el.typeDemo.checked = true;
    if (type === 'general' || type === 'enquiry') el.typeGeneral.checked = true;
  }

  /* ---------------------------------------------------------------------
   * Character counter
   * ------------------------------------------------------------------- */
  function updateCounter() {
    var length = el.message.value.length;
    el.counter.textContent = length + ' / ' + MESSAGE_MAX;
    el.counter.classList.toggle('is-near', length > MESSAGE_MAX * 0.9);
  }

  /* ---------------------------------------------------------------------
   * Payload + mailto fallback
   * ------------------------------------------------------------------- */
  function collect() {
    var digits = normalisePhone(el.phone.value);
    return {
      enquiryType: isDemo() ? 'demo' : 'general',
      name: el.name.value.trim(),
      email: el.email.value.trim(),
      phone: digits ? '+91' + digits : '',
      organization: el.organization.value.trim(),
      product: el.product.value,
      demoDate: isDemo() ? el.demoDate.value : '',
      demoTime: isDemo() ? el.demoTime.value : '',
      message: el.message.value.trim(),
      consent: el.consent.checked,
      website: el.honeypot.value, // honeypot: should stay empty
      pageUrl: window.location.href.split('#')[0],
      elapsedMs: Date.now() - loadedAt
    };
  }

  function buildMailto(data) {
    var productName = PRODUCTS[data.product] || 'General';
    var subject = (data.enquiryType === 'demo' ? '[Demo Request] ' : '[Enquiry] ') +
      productName + (data.name ? ' - ' + data.name : '');
    var lines = [
      'Enquiry type: ' + (data.enquiryType === 'demo' ? 'Request a Demo' : 'General Enquiry'),
      'Name: ' + data.name,
      'Email: ' + data.email,
      'Phone: ' + data.phone,
      'Organisation: ' + (data.organization || '-'),
      'Product: ' + productName
    ];
    if (data.enquiryType === 'demo') {
      lines.push('Preferred demo date: ' + (data.demoDate || 'Any'));
      lines.push('Preferred time: ' + (data.demoTime || 'Any'));
    }
    lines.push('', 'Message:', data.message || '-');
    return 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\n'));
  }

  /* ---------------------------------------------------------------------
   * UI states
   * ------------------------------------------------------------------- */
  function setLoading(loading) {
    el.submit.disabled = loading;
    el.submit.classList.toggle('is-loading', loading);
    el.submit.setAttribute('aria-busy', String(loading));
    el.status.textContent = loading ? 'Sending your enquiry…' : '';
  }

  function showFailure(detail, data) {
    el.errorDetail.textContent = detail || 'Please try again in a moment.';
    el.mailto.href = buildMailto(data);
    el.errorBox.hidden = false;
    el.errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showSuccess(data) {
    el.successName.textContent = firstName(data.name);
    el.wrap.hidden = true;
    el.success.hidden = false;
    el.success.focus();
    el.success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function endpointConfigured() {
    var url = config.enquiryApiUrl || '';
    return /^https:\/\//.test(url) && url.indexOf('REPLACE_WITH') === -1 ||
      /^http:\/\/(localhost|127\.0\.0\.1)/.test(url);
  }

  /* ---------------------------------------------------------------------
   * Submit
   * ------------------------------------------------------------------- */
  function onSubmit(event) {
    event.preventDefault();
    el.errorBox.hidden = true;

    var firstInvalid = validateAll();
    if (firstInvalid) {
      firstInvalid.focus();
      el.status.textContent = 'Please correct the highlighted fields.';
      return;
    }

    var data = collect();

    if (!endpointConfigured()) {
      showFailure('Our online form is not available right now.', data);
      return;
    }

    setLoading(true);

    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, config.requestTimeoutMs || 15000);

    fetch(config.enquiryApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller ? controller.signal : undefined,
      credentials: 'omit',
      mode: 'cors'
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          return { ok: res.ok, status: res.status, body: body };
        });
      })
      .then(function (result) {
        if (result.ok && result.body && result.body.ok) {
          showSuccess(data);
          return;
        }
        var detail = result.status === 400 && result.body && result.body.error
          ? result.body.error
          : result.status === 429
            ? 'We are receiving a lot of requests. Please try again in a minute.'
            : 'Something went wrong on our side.';
        showFailure(detail, data);
      })
      .catch(function (err) {
        var detail = err && err.name === 'AbortError'
          ? 'The request timed out. Please check your connection and try again.'
          : 'We could not reach our server. Please check your connection and try again.';
        showFailure(detail, data);
      })
      .then(function () {
        clearTimeout(timer);
        setLoading(false);
      });
  }

  /* ---------------------------------------------------------------------
   * Wire up
   * ------------------------------------------------------------------- */
  prefillFromUrl();
  applyType();
  updateCounter();

  // Demo date: from today onwards, up to a year ahead
  var today = new Date();
  var nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  el.demoDate.min = isoDate(today);
  el.demoDate.max = isoDate(nextYear);

  el.typeGeneral.addEventListener('change', applyType);
  el.typeDemo.addEventListener('change', applyType);
  el.message.addEventListener('input', updateCounter);

  // Validate a field when the visitor leaves it; clear errors as they fix it
  Object.keys(rules).forEach(function (field) {
    var input = el[field];
    if (!input) return;
    var evt = input.type === 'checkbox' || input.tagName === 'SELECT' || input.type === 'date' ? 'change' : 'blur';
    input.addEventListener(evt, function () {
      if (field === 'phone' && input.value.trim()) {
        var digits = normalisePhone(input.value);
        if (digits.length === 10) input.value = digits.slice(0, 5) + ' ' + digits.slice(5);
      }
      validateField(field);
    });
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  form.addEventListener('submit', onSubmit);
})();
