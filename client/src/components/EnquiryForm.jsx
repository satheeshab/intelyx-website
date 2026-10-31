import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PRODUCTS } from '../data/products.js';
import { sendEnquiry } from '../lib/api.js';
import {
  FIELD_ORDER, MESSAGE_MAX, PRODUCT_LABELS, buildMailto, buildPayload, firstName, isoDate,
  normalisePhone, validateAll, validateField,
} from '../lib/validation.js';
import { Icon } from './Icon.jsx';

const EMPTY = {
  enquiryType: 'general',
  name: '', email: '', phone: '', organization: '', product: '',
  demoDate: '', demoTime: '', message: '', consent: false,
  website: '', // honeypot
};

function Field({ id, label, required, optional, error, hint, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true">*</span>}
        {optional && <span className="optional">(optional)</span>}
      </label>
      {children}
      {hint}
      <p className="error" id={`${id}-error`}>{error}</p>
    </div>
  );
}

export default function EnquiryForm() {
  const [params] = useSearchParams();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | failed
  const [failure, setFailure] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [sentName, setSentName] = useState('');
  const loadedAt = useRef(Date.now());
  const successRef = useRef(null);
  const errorRef = useRef(null);

  const isDemo = values.enquiryType === 'demo';
  const today = useMemo(() => new Date(), []);
  const minDate = isoDate(today);
  const maxDate = isoDate(new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()));

  // Pre-select product and enquiry type from ?product= and ?type= (e.g. contact?product=hospitals-erp&type=demo)
  const productParam = (params.get('product') || '').toLowerCase();
  const typeParam = (params.get('type') || '').toLowerCase();
  useEffect(() => {
    setValues((v) => ({
      ...v,
      product: PRODUCT_LABELS[productParam] ? productParam : v.product,
      enquiryType: typeParam === 'demo' ? 'demo' : typeParam === 'general' || typeParam === 'enquiry' ? 'general' : v.enquiryType,
    }));
  }, [productParam, typeParam]);

  const set = (field, value) => {
    const next = { ...values, [field]: value };
    setValues(next);
    // Once a field shows an error, re-check it as the visitor fixes it
    if (errors[field] || (field === 'enquiryType' && errors.message)) {
      setErrors((prev) => {
        const copy = { ...prev };
        for (const f of field === 'enquiryType' ? ['message', 'demoDate'] : [field]) {
          const message = validateField(f, next, today);
          if (message) copy[f] = message; else delete copy[f];
        }
        return copy;
      });
    }
  };

  const check = (field, valuesNow = values) =>
    setErrors((prev) => {
      const copy = { ...prev };
      const message = validateField(field, valuesNow, today);
      if (message) copy[field] = message; else delete copy[field];
      return copy;
    });

  const onPhoneBlur = () => {
    const digits = normalisePhone(values.phone);
    const next = digits.length === 10 ? { ...values, phone: `${digits.slice(0, 5)} ${digits.slice(5)}` } : values;
    if (next !== values) setValues(next);
    check('phone', next);
  };

  const focusField = (id) => document.getElementById(id)?.focus();

  async function onSubmit(event) {
    event.preventDefault();
    setFailure('');

    const found = validateAll(values, today);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((f) => found[f]);
    if (firstInvalid) {
      setAnnouncement('Please correct the highlighted fields.');
      focusField(firstInvalid);
      return;
    }

    const payload = buildPayload(values, {
      pageUrl: window.location.href.split('#')[0],
      elapsedMs: Date.now() - loadedAt.current,
    });

    setStatus('sending');
    setAnnouncement('Sending your enquiry…');
    const result = await sendEnquiry(payload);

    if (result.ok) {
      setSentName(firstName(payload.name));
      setStatus('success');
      setAnnouncement('');
      return;
    }

    // The server rejected specific fields: show them inline
    if (result.status === 400 && result.body?.fields) {
      const serverErrors = {};
      for (const [field, message] of Object.entries(result.body.fields)) serverErrors[field] = message;
      setErrors(serverErrors);
      const first = FIELD_ORDER.find((f) => serverErrors[f]);
      setStatus('idle');
      setAnnouncement('Please correct the highlighted fields.');
      if (first) focusField(first);
      return;
    }

    setFailure(
      result.timedOut
        ? 'The request timed out. Please check your connection and try again.'
        : result.status === 429
          ? 'We are receiving a lot of requests. Please try again in a minute.'
          : result.status === 0
            ? 'We could not reach our server. Please check your connection and try again.'
            : 'Something went wrong on our side.',
    );
    setStatus('failed');
    setAnnouncement('');
  }

  // Move focus to the result message
  useEffect(() => {
    if (status === 'success') {
      successRef.current?.focus();
      successRef.current?.scrollIntoView({ block: 'center' });
    }
    if (status === 'failed') errorRef.current?.scrollIntoView({ block: 'center' });
  }, [status]);

  const sending = status === 'sending';
  const err = (f) => errors[f] || '';
  const invalid = (f) => (errors[f] ? 'true' : undefined);

  if (status === 'success') {
    return (
      <div className="form-success" ref={successRef} tabIndex={-1}>
        <div className="success-icon"><Icon name="check-circle" /></div>
        <h2>Thanks, {sentName}!</h2>
        <p>Our team will get back to you within one business day.</p>
        <div className="hero-actions">
          <Link className="btn btn--secondary" to="/products">Explore products</Link>
          <Link className="btn btn--primary" to="/">Back to home</Link>
        </div>
      </div>
    );
  }

  const mailto = buildMailto(buildPayload(values, { pageUrl: '', elapsedMs: 0 }));

  return (
    <div>
      <h2 id="form-title">Send us an enquiry</h2>
      <p id="form-intro">
        Fill in a few details and we'll get back to you within one business day. Fields marked{' '}
        <span className="req" aria-hidden="true">*</span><span className="sr-only">with an asterisk</span> are required.
      </p>

      <form className="form" id="enquiry-form" noValidate onSubmit={onSubmit} aria-labelledby="form-title" aria-describedby="form-intro">
        {/* Enquiry type (segmented toggle) */}
        <fieldset className="field">
          <legend>Enquiry type<span className="req" aria-hidden="true">*</span></legend>
          <div className="segmented">
            <input type="radio" id="type-general" name="enquiryType" value="general"
              checked={!isDemo} onChange={() => set('enquiryType', 'general')} />
            <label htmlFor="type-general"><Icon name="message" /> General Enquiry</label>
            <input type="radio" id="type-demo" name="enquiryType" value="demo"
              checked={isDemo} onChange={() => set('enquiryType', 'demo')} />
            <label htmlFor="type-demo"><Icon name="calendar-check" /> Request a Demo</label>
          </div>
        </fieldset>

        <div className="form-row form-row--2">
          <Field id="name" label="Full name" required error={err('name')}>
            <input className="input" id="name" name="name" type="text" autoComplete="name" maxLength={100} required
              value={values.name} aria-invalid={invalid('name')} aria-describedby="name-error"
              onChange={(e) => set('name', e.target.value)} onBlur={() => check('name')} />
          </Field>
          <Field id="email" label="Email" required error={err('email')}>
            <input className="input" id="email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required
              value={values.email} aria-invalid={invalid('email')} aria-describedby="email-error"
              onChange={(e) => set('email', e.target.value)} onBlur={() => check('email')} />
          </Field>
        </div>

        <div className="form-row form-row--2">
          <Field id="phone" label="Mobile number" required error={err('phone')}
            hint={<p className="hint" id="phone-hint">10-digit Indian mobile number</p>}>
            <div className="input-group">
              <span className="input-prefix" aria-hidden="true">+91</span>
              <input className="input" id="phone" name="phone" type="tel" autoComplete="tel-national" inputMode="tel" maxLength={16}
                placeholder="98765 43210" required value={values.phone} aria-invalid={invalid('phone')}
                aria-describedby="phone-hint phone-error"
                onChange={(e) => set('phone', e.target.value)} onBlur={onPhoneBlur} />
            </div>
          </Field>
          <Field id="organization" label="Organisation / Business name" optional error="">
            <input className="input" id="organization" name="organization" type="text" autoComplete="organization" maxLength={150}
              value={values.organization} onChange={(e) => set('organization', e.target.value)} />
          </Field>
        </div>

        <Field id="product" label="Product of interest" required error={err('product')}>
          <select className="select" id="product" name="product" required value={values.product}
            aria-invalid={invalid('product')} aria-describedby="product-error"
            onChange={(e) => set('product', e.target.value)} onBlur={() => check('product')}>
            <option value="">Select a product</option>
            {PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            <option value="other">Other / Not sure</option>
          </select>
        </Field>

        {/* Only shown when "Request a Demo" is selected */}
        {isDemo && (
          <div className="demo-fields">
            <div className="form-row form-row--2">
              <Field id="demoDate" label="Preferred demo date" optional error={err('demoDate')}>
                <input className="input" id="demoDate" name="demoDate" type="date" min={minDate} max={maxDate}
                  value={values.demoDate} aria-invalid={invalid('demoDate')} aria-describedby="demoDate-error"
                  onChange={(e) => set('demoDate', e.target.value)} />
              </Field>
              <Field id="demoTime" label="Preferred time (IST)" optional error="">
                <select className="select" id="demoTime" name="demoTime" value={values.demoTime}
                  onChange={(e) => set('demoTime', e.target.value)}>
                  <option value="">Any time</option>
                  <option value="10:00 AM - 12:00 PM">Morning (10 AM – 12 PM)</option>
                  <option value="12:00 PM - 3:00 PM">Afternoon (12 – 3 PM)</option>
                  <option value="3:00 PM - 6:00 PM">Late afternoon (3 – 6 PM)</option>
                </select>
              </Field>
            </div>
            <p className="hint">We'll confirm the exact slot with you by email or phone.</p>
          </div>
        )}

        <div className="field">
          <label htmlFor="message">
            Message
            {isDemo ? <span className="optional">(optional)</span> : <span className="req" aria-hidden="true">*</span>}
          </label>
          <textarea className="textarea" id="message" name="message" rows={5} maxLength={MESSAGE_MAX}
            placeholder="Tell us a little about your organisation and what you're looking for."
            value={values.message} aria-invalid={invalid('message')} aria-describedby="message-counter message-error"
            onChange={(e) => set('message', e.target.value)} onBlur={() => check('message')} />
          <div className="field-meta">
            <p className="error" id="message-error">{err('message')}</p>
            <span className={`counter${values.message.length > MESSAGE_MAX * 0.9 ? ' is-near' : ''}`} id="message-counter" aria-live="polite">
              {values.message.length} / {MESSAGE_MAX}
            </span>
          </div>
        </div>

        {/* Honeypot: leave empty. Hidden from people; bots tend to fill it. */}
        <div className="hp-field" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off"
            value={values.website} onChange={(e) => set('website', e.target.value)} />
        </div>

        <div className="field">
          <label className="check">
            <input id="consent" name="consent" type="checkbox" required checked={values.consent}
              aria-invalid={invalid('consent')} aria-describedby="consent-error"
              onChange={(e) => set('consent', e.target.checked)} />
            <span>I agree to be contacted by Intelyx regarding my enquiry.<span className="req" aria-hidden="true">*</span></span>
          </label>
          <p className="error" id="consent-error">{err('consent')}</p>
        </div>

        {status === 'failed' && (
          <div className="alert alert--error" role="alert" ref={errorRef}>
            <Icon name="alert" />
            <div>
              <p><strong>Sorry, we couldn't send your enquiry.</strong> <span>{failure}</span></p>
              <p>
                You can also <a href={mailto}>email us directly at office@intelyx.co.in</a> or call{' '}
                <a href="tel:+919380577396">+91&nbsp;93805&nbsp;77396</a>.
              </p>
            </div>
          </div>
        )}

        <div className="form-footer">
          <button className={`btn btn--primary btn--lg btn--block${sending ? ' is-loading' : ''}`} type="submit"
            disabled={sending} aria-busy={sending}>
            <span className="spinner" aria-hidden="true"></span>
            <span>{isDemo ? 'Request my demo' : 'Send enquiry'}</span>
            <Icon name="send" />
          </button>
          <p className="form-privacy">
            We use your details only to respond to your enquiry. See our <Link to="/privacy">Privacy Policy</Link>.
          </p>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      </form>
    </div>
  );
}
