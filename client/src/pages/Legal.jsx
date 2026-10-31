import { Icon } from '../components/Icon.jsx';
import PageHero from '../components/PageHero.jsx';
import { useSeo } from '../hooks/useSeo.js';

const Contact = () => (
  <>
    <h2>Contact</h2>
    <p>
      Intelyx Tech Solutions LLP, Sarjapura Road, Bengaluru, India<br />
      Email: <a href="mailto:office@intelyx.co.in">office@intelyx.co.in</a> &middot; Phone:{' '}
      <a href="tel:+919380577396">+91&nbsp;93805&nbsp;77396</a>
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
            {/* PLACEHOLDER: have this text reviewed by a legal professional before launch */}
            <p className="notice">
              <Icon name="info" /> <span>This is a placeholder draft. Please review it with your legal adviser before publishing.</span>
            </p>
            <p><strong>Last updated:</strong> [Date]</p>
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
      <p>This Privacy Policy explains how Intelyx Tech Solutions LLP ("Intelyx", "we", "us") collects and uses personal information through this website, www.intelyx.co.in.</p>

      <h2>Information we collect</h2>
      <p>When you submit our enquiry or demo request form, we collect the details you provide: your name, email address, phone number, organisation name, product of interest, preferred demo date and time, and your message. We also record the date and time of the submission and the page it was sent from.</p>
      <p>We do not use advertising trackers or sell your information. Our hosting provider may keep standard technical logs (such as IP address and browser type) for security and reliability.</p>

      <h2>How we use your enquiry data</h2>
      <p><strong>Information you submit through the enquiry form is used only to respond to your enquiry</strong>, for example to answer your question, schedule and conduct a demo, or send you information you asked for. We do not add you to marketing lists without your separate consent.</p>

      <h2>How your data is handled</h2>
      <ul>
        <li>Form submissions are sent securely over HTTPS and delivered by email to our team.</li>
        <li>Access is limited to the Intelyx staff who handle enquiries.</li>
        <li>We keep enquiry emails only as long as needed to respond and follow up, unless you become a customer.</li>
        <li>We use trusted service providers (such as Amazon Web Services) to host the website and deliver email.</li>
      </ul>

      <h2>Your choices</h2>
      <p>You can ask us to access, correct or delete the information you've shared with us at any time by emailing <a href="mailto:office@intelyx.co.in">office@intelyx.co.in</a>.</p>

      <h2>Third-party content</h2>
      <p>Our contact page includes an embedded Google Map, and our pages use Google Fonts. These services are provided by Google and are subject to Google's own privacy policy.</p>

      <Contact />
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage path="/terms" title="Terms of Service">
      <p>These terms govern your use of the Intelyx website, www.intelyx.co.in, operated by Intelyx Tech Solutions LLP.</p>

      <h2>Use of this website</h2>
      <p>You may browse this website and use the enquiry form for genuine business enquiries. Please don't misuse the website, attempt to disrupt it, or submit false or harmful information.</p>

      <h2>Information on this website</h2>
      <p>We work to keep product information accurate and up to date, but features, availability and pricing may change. Details of any product or service are confirmed in a separate written agreement.</p>

      <h2>Intellectual property</h2>
      <p>The Intelyx name, logo, website content and design belong to Intelyx Tech Solutions LLP. Please don't reuse them without our permission.</p>

      <h2>Software subscriptions</h2>
      <p>Use of Intelyx software products is governed by the agreement signed with each customer, not by these website terms.</p>

      <h2>Limitation of liability</h2>
      <p>This website is provided "as is". To the extent permitted by law, Intelyx is not liable for any loss arising from the use of this website.</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India, and the courts of Bengaluru, Karnataka have jurisdiction.</p>

      <h2>Contact</h2>
      <p>Questions about these terms? Email <a href="mailto:office@intelyx.co.in">office@intelyx.co.in</a>.</p>
    </LegalPage>
  );
}
