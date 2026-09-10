import React from 'react';
import { Shield, Lock, FileText, CheckCircle2, Eye, ServerOff, Database } from 'lucide-react';
import { AppRoute } from '../utils/router';

interface PrivacyPolicyPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-12">
      {/* Header */}
      <div className="space-y-4 border-b border-white/10 pb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Privacy & Data Protection</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Privacy Policy
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/50">
          <span>Effective Date: September 7, 2026</span>
          <span>•</span>
          <span>Last Updated: September 7, 2026</span>
        </div>
        <p className="text-sm sm:text-base text-white/70 leading-relaxed pt-2">
          Learn how LabelFix handles uploaded PDF files, personal information, cookies, analytics,
          advertising, third-party services, security, and user privacy.
        </p>
      </div>

      {/* Core Client-Side Processing Highlight Box */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-[#111111] to-[#111111] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <ServerOff className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              100% In-Browser Client-Side Processing
            </h2>
            <p className="text-xs text-emerald-400/90 font-medium">
              Your shipping labels and customer details never touch an external server.
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
          When you upload shipping labels to LabelFix (for Meesho, Flipkart, or Amazon), all parsing,
          cropping, text insertion, and PDF generation are executed directly inside your web browser
          using local JavaScript (PDF.js and pdf-lib). Documents, buyer addresses, telephone numbers,
          and financial order totals are never transmitted to, processed by, or saved on any remote
          server or database.
        </p>
      </div>

      {/* Privacy Content - 19 Sections */}
      <div className="space-y-10 text-xs sm:text-sm text-white/70 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">1. Introduction</h2>
          <p>
            LabelFix ("we", "our", or "the platform") is dedicated to respecting and protecting the
            privacy of ecommerce sellers and the integrity of customer order documents. This Privacy
            Policy explains our practices regarding the collection, use, processing, and protection of
            information when you visit or use our web applications and documentation.
          </p>
          <p>
            By accessing or using LabelFix, you acknowledge the terms outlined in this Privacy Policy.
            If you do not agree with these terms, please discontinue use of our tools.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">2. Information We Collect</h2>
          <p>
            We adhere to strict data minimization principles. We do not require account registration,
            passwords, or mandatory profiles to use our primary PDF utilities. Consequently, we collect
            only the minimum technical data necessary to deliver the web interface in your browser.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">3. Information Users Provide</h2>
          <p>
            Users may optionally enter preferences into the application interface to customize label
            output. This includes:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-white/60">
            <li>Custom store names or seller display titles.</li>
            <li>Public store catalog links (e.g. your public marketplace storefront URL) used to generate store QR codes.</li>
            <li>Custom customer review or thank-you message templates.</li>
            <li>Thermal printer preference configurations (e.g. margin offsets, font size preferences).</li>
          </ul>
          <p>
            All such information is stored exclusively in your local device's browser memory (HTML5
            LocalStorage) and is not synchronized to any centralized cloud database.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">4. Uploaded PDF Files</h2>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <p className="font-semibold text-white">Sensitive Shipping Label Content:</p>
            <p>
              Ecommerce shipping labels and invoices generated by marketplaces naturally contain sensitive
              third-party personal and commercial data, such as:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-white/60">
              <li>Customer names and delivery addresses.</li>
              <li>Customer telephone or contact numbers.</li>
              <li>Order IDs, tracking numbers (AWB), and carrier routing barcodes.</li>
              <li>Product titles, SKUs, quantities, and price/tax breakdowns.</li>
              <li>Seller business names, GST numbers, and warehouse dispatch addresses.</li>
            </ul>
          </div>
          <p className="font-semibold text-emerald-400">Our Technical Processing Model:</p>
          <p>
            LabelFix operates exclusively on client-side Web APIs. When you select or drag a PDF into the
            browser window:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-white/60">
            <li>The file is read directly into your browser's local memory (RAM).</li>
            <li>No file upload request is sent to any server endpoint.</li>
            <li>The PDF is never written to remote disks, temporary server caches, or external storage buckets.</li>
            <li>When you close or refresh your browser tab, the active PDF memory is automatically cleared by the browser garbage collector.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">5. How Information Is Used</h2>
          <p>
            Any configuration data you enter is used solely for the immediate functional purpose requested:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-white/60">
            <li>To construct store QR codes and promotional footer bands on Meesho labels.</li>
            <li>To position crop boundaries on Flipkart labels.</li>
            <li>To extract and display SKU and quantity text on Amazon labels.</li>
            <li>To render real-time interactive canvas previews and compile downloadable 4×6 PDF outputs.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">6. Data Minimization</h2>
          <p>
            We do not collect unnecessary user details. We do not require email sign-ups, phone numbers,
            social logins, or payment cards to run our label processing utilities.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">7. Data Retention</h2>
          <p>
            Uploaded PDF files are retained only in temporary browser memory during your active session.
            No persistent server-side storage exists for documents. User configuration settings (such as
            saved store templates) remain in your browser's LocalStorage until you manually clear your
            browser cache or use the built-in Settings Reset options.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">8. Data Security</h2>
          <p>
            Because sensitive shipping documents remain within your local web browser sandbox, they are
            protected by your device's operating system security and your web browser's same-origin policy.
            We serve all application assets over encrypted Transport Layer Security (HTTPS) to prevent
            eavesdropping or tampering of the application code itself.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">9. Cookies</h2>
          <p>
            LabelFix does not use tracking cookies to build behavioral profiles. We utilize standard
            client-side web storage mechanisms (HTML5 LocalStorage) purely to preserve your local UI preferences
            (such as dark mode preferences and saved store labels).
          </p>
        </section>

        {/* Section 10 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">10. Analytics</h2>
          <p>
            We may monitor aggregate website operational health, page performance, and generic traffic
            metrics to detect crashes and ensure service uptime. Such metrics do not include uploaded PDF
            contents, customer names, addresses, or order details.
          </p>
        </section>

        {/* Section 11 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">11. Advertising</h2>
          <p>
            Third-party advertising networks (such as Google AdSense) are not currently implemented on
            LabelFix. Should advertising services be introduced in the future, this Privacy Policy will be
            updated with comprehensive disclosure regarding ad technology, cookies, and opt-out mechanisms.
          </p>
        </section>

        {/* Section 12 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">12. Third-Party Services</h2>
          <p>
            The application relies on trusted open-source web libraries bundled into the client interface,
            including PDF.js and pdf-lib. These libraries operate entirely within your local browser runtime
            and do not transmit your documents to external services.
          </p>
        </section>

        {/* Section 13 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">13. External Marketplace Links</h2>
          <p>
            Our documentation and guides may contain references or links to official ecommerce seller portals
            (such as Meesho, Flipkart, and Amazon). We are not responsible for the privacy practices or
            content of these external websites.
          </p>
        </section>

        {/* Section 14 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">14. User Rights</h2>
          <p>
            Depending on your jurisdiction, including under relevant Indian digital data protection standards,
            you have the right to understand how your data is handled, access your stored information, and
            request deletion. Because your settings reside on your own device, you maintain immediate,
            direct control over all saved data at all times.
          </p>
        </section>

        {/* Section 15 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">15. Data Deletion Requests</h2>
          <p>
            To delete any information stored by LabelFix on your device:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-white/60">
            <li>Open the Settings menu in the Meesho tool and click "Reset to Defaults".</li>
            <li>Alternatively, clear your browser cookies and site data for this domain in your browser settings.</li>
            <li>Because we do not store customer records or uploaded files on servers, there are no server records to delete.</li>
          </ul>
        </section>

        {/* Section 16 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">16. Children's Privacy</h2>
          <p>
            LabelFix is designed for commercial use by ecommerce sellers, business owners, and logistics
            professionals. We do not knowingly solicit or collect data from individuals under 18 years of age.
          </p>
        </section>

        {/* Section 17 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">17. International Data Processing</h2>
          <p>
            Because all file parsing and PDF generation occurs locally on the end-user's device, your documents
            do not cross international borders or transfer between foreign servers during processing.
          </p>
        </section>

        {/* Section 18 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">18. Changes to This Privacy Policy</h2>
          <p>
            We may revise this Privacy Policy periodically to reflect enhancements in our tools or adjustments
            in applicable legal frameworks. Changes become effective immediately upon posting to this page.
            The "Last Updated" date at the top of this page indicates the most recent modification.
          </p>
        </section>

        {/* Section 19 */}
        <section className="space-y-3 border-t border-white/10 pt-6">
          <h2 className="text-lg font-bold text-white tracking-tight">19. Contact Us</h2>
          <p>
            If you have questions, feedback, or privacy-related concerns regarding this policy, please reach out:
          </p>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <p className="font-semibold text-white">LabelFix Privacy Team</p>
            <p className="text-xs text-white/50">Email: <a href="mailto:support.labelfix@gmail.com" className="text-[#c9a57b] hover:underline">support.labelfix@gmail.com</a></p>
            <p className="text-xs text-white/40">You can also visit our <button onClick={() => onNavigate('contact')} className="text-white hover:underline">Contact Page</button>.</p>
          </div>
        </section>
      </div>
    </div>
  );
};
