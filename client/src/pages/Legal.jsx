import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import { useSeo } from '../hooks/useSeo.js';
import { PLAUSIBLE_DOMAIN } from '../lib/analytics.js';

// Update this date whenever the text of either page changes.
const LAST_UPDATED = '1 November 2026';

const EMAIL = <a href="mailto:office@intelyx.co.in">office@intelyx.co.in</a>;

const Contact = () => (
  <>
    <h2>Contact</h2>
    <p>
      Intelyx Tech Solutions LLP, Sarjapura Road, Bengaluru, Karnataka, India<br />
      Email: {EMAIL} &middot; Phone: <a href="tel:+919380577396">+91&nbsp;93805&nbsp;77396</a>
    </p>
  </>
);

function LegalPage({ path, title, children }) {
  useSeo(path);
  return (
    <>
      <PageHero crumb={title} title={title} />
      <section className="section section--tight">
        <div className="container">
          <div className="legal">
            <p><strong>Last updated:</strong> {LAST_UPDATED}</p>
            {children}
          </div>
        </div>
      </section>
    </>
  );
}

export function Privacy() {
  return (
    <LegalPage path="/privacy" title="Privacy Policy">
      <p>
        This Privacy Policy explains how Intelyx Tech Solutions LLP ("Intelyx", "we", "us") collects, uses and protects
        personal data through this website, www.intelyx.co.in. We handle personal data in line with India's Digital
        Personal Data Protection Act, 2023 ("DPDP Act"), and for this website we are the Data Fiduciary.
      </p>
      <p>
        This policy covers this website only. Data that our customers store in Intelyx software products is covered
        by the agreement with each customer.
      </p>

      <h2>Information we collect</h2>
      <p>
        When you submit our enquiry or demo request form, we collect the details you provide: your name, email address,
        mobile number, organisation name (optional), product of interest, preferred demo date and time, and your
        message. We also record the date and time of the submission and the page it was sent from.
      </p>
      <p>
        Our servers keep standard technical logs (such as IP address, browser type and the pages requested) to keep
        the website secure and reliable, for example to block spam and abuse.
      </p>
      {PLAUSIBLE_DOMAIN ? (
        <p>
          We use Plausible Analytics to count visits and understand which pages are useful. Plausible does not use
          cookies, does not collect personal data and does not track you across other websites. We only see totals,
          such as the number of visits to each page.
        </p>
      ) : null}

      <h2>Why we use it</h2>
      <p>
        <strong>Information you submit through the enquiry form is used only to respond to your enquiry</strong>: to
        answer your question, schedule and run a demo, or send you information you asked for. You give your consent
        for this when you tick the consent box on the form. We do not sell your data, and we do not add you to
        marketing lists without your separate consent.
      </p>

      <h2>Cookies and similar technologies</h2>
      <p>
        This website does not use advertising or tracking cookies. If you choose light or dark mode, your choice is
        saved in your own browser (local storage) so the website remembers it. It is never sent to us.
      </p>

      <h2>Who we share it with</h2>
      <p>We share personal data only with service providers that help us run this website, and only as needed:</p>
      <ul>
        <li>Amazon Web Services, which hosts this website and delivers our email, in its Mumbai (India) region.</li>
        <li>Google, which provides the fonts and the embedded map on our contact page, under Google's own privacy policy.</li>
        {PLAUSIBLE_DOMAIN ? <li>Plausible Analytics, for the cookie-free visit counts described above.</li> : null}
      </ul>
      <p>We may also disclose information when required by law or by a lawful request from a government authority.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep enquiry details only as long as we need them to respond and follow up, and no longer than 12 months
        after our last contact with you, unless you become a customer or the law requires us to keep them longer. Then
        we delete them.
      </p>

      <h2>How we protect it</h2>
      <ul>
        <li>All traffic to this website is encrypted with HTTPS.</li>
        <li>Access to enquiries is limited to the Intelyx staff who handle them.</li>
        <li>We use reasonable security safeguards, including access controls and up-to-date software, to prevent misuse or loss.</li>
      </ul>

      <h2>Your rights</h2>
      <p>Under the DPDP Act, you can:</p>
      <ul>
        <li>ask what personal data we hold about you and how we use it;</li>
        <li>ask us to correct, complete, update or delete your personal data;</li>
        <li>withdraw your consent at any time (this does not affect what we did before you withdrew it);</li>
        <li>nominate another person to exercise these rights on your behalf if you are unable to; and</li>
        <li>raise a grievance with us about how we handle your data.</li>
      </ul>
      <p>To use any of these rights, email {EMAIL}. We will reply within 30 days.</p>

      <h2>Grievance officer</h2>
      <p>
        If you have a concern about how we handle your personal data, contact our Grievance Officer at {EMAIL} with the
        subject "Privacy grievance". If you are not satisfied with our response, you may complain to the Data
        Protection Board of India.
      </p>

      <h2>Children</h2>
      <p>
        This website is meant for organisations and businesses. It is not intended for anyone under 18, and we do not
        knowingly collect their personal data.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The "Last updated" date at the top shows when it last changed. If
        we make a significant change, we will make it clear on this page.
      </p>

      <Contact />
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage path="/terms" title="Terms of Service">
      <p>
        These terms govern your use of the Intelyx website, www.intelyx.co.in, operated by Intelyx Tech Solutions LLP
        ("Intelyx", "we", "us"). By using this website, you agree to these terms.
      </p>

      <h2>Use of this website</h2>
      <p>You may browse this website and use the enquiry form for genuine business enquiries. You agree not to:</p>
      <ul>
        <li>submit false, misleading or someone else's information;</li>
        <li>send spam, malicious code or harmful content;</li>
        <li>try to disrupt the website, gain unauthorised access to it, or overload it; or</li>
        <li>copy or scrape the website's content in bulk without our permission.</li>
      </ul>

      <h2>Information on this website</h2>
      <p>
        We work to keep product information accurate and up to date, but features, availability and pricing may
        change without notice. Nothing on this website is an offer or a binding commitment. The details of any product
        or service are confirmed in a separate written agreement.
      </p>

      <h2>Software subscriptions</h2>
      <p>
        Use of Intelyx software products is governed by the agreement signed with each customer, not by these website
        terms. If the two conflict, the customer agreement applies.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The Intelyx name, logo, website content and design belong to Intelyx Tech Solutions LLP or its licensors. You
        may view and share pages for your own reference, but please don't reuse or modify them without our written
        permission.
      </p>

      <h2>Links to other websites</h2>
      <p>
        This website links to services run by others, such as Google Maps and WhatsApp. We are not responsible for
        their content or how they handle your data.
      </p>

      <h2>Privacy</h2>
      <p>
        How we handle personal data is explained in our <Link to="/privacy">Privacy Policy</Link>.
      </p>

      <h2>No warranty and limitation of liability</h2>
      <p>
        This website is provided "as is" and "as available". We do not promise that it will always be available or
        free of errors. To the extent permitted by law, Intelyx is not liable for any indirect or consequential loss
        arising from the use of this website or reliance on its content.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time. The "Last updated" date at the top shows when they last changed.
        Continuing to use the website after a change means you accept the updated terms.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India, and the courts of Bengaluru, Karnataka have exclusive jurisdiction.</p>

      <Contact />
    </LegalPage>
  );
}
