import React from 'react';
import { FileText, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AppRoute } from '../utils/router';

interface TermsPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-12">
      {/* Header */}
      <div className="space-y-4 border-b border-white/10 pb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <FileText className="w-3.5 h-3.5" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Terms of Service
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/50">
          <span>Effective Date: September 7, 2026</span>
          <span>•</span>
          <span>Last Updated: September 7, 2026</span>
        </div>
        <p className="text-sm sm:text-base text-white/70 leading-relaxed pt-2">
          Read the LabelFix Terms of Service covering tool usage, uploaded files, processing limitations,
          acceptable use, intellectual property, disclaimers, and service availability.
        </p>
      </div>

      {/* Verification Notice Callout */}
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-6 space-y-2">
        <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Important Notice: Always Review Processed Output Before Shipping</span>
        </div>
        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
          LabelFix provides automated document processing utilities. Because PDF structures and marketplace
          layouts can change, users are strictly responsible for inspecting generated labels prior to
          printing, packaging, and dispatching parcels to couriers.
        </p>
      </div>

      {/* Terms Content - 18 Sections */}
      <div className="space-y-10 text-xs sm:text-sm text-white/70 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the LabelFix web application and related services (collectively, "the Service"),
            you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these
            terms, you may not use the Service.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">2. About LabelFix</h2>
          <p>
            LabelFix provides browser-based utilities designed to assist online ecommerce sellers in preparing,
            cropping, and formatting shipping-label PDFs for standard thermal barcode printers.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">3. Use of the Services</h2>
          <p>
            The Service is provided to assist legitimate commercial sellers with document preparation. You agree
            to use the Service only for lawful purposes and in accordance with all applicable local, national,
            and international regulations.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">4. Supported Tools</h2>
          <p>
            LabelFix currently features three independent utilities:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-white/60">
            <li><strong>Meesho Promotional Label:</strong> Appends store QR codes and custom messages into available dead whitespace below official label content.</li>
            <li><strong>Flipkart Label Crop:</strong> Isolates shipping labels from mixed A4 sheets for 4×6 inch thermal output.</li>
            <li><strong>Amazon Label Tool:</strong> Pairs shipping labels with multi-page invoices, extracts SKU and quantity data, and places formatted text onto labels.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">5. Uploaded Documents</h2>
          <p>
            All document processing occurs locally inside your web browser. You retain full ownership and
            intellectual property rights to your uploaded documents, customer data, and store branding.
            LabelFix does not claim any ownership rights over your files.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">6. User Responsibilities</h2>
          <p>
            As a user of the Service, you are solely responsible for:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-white/60">
            <li>Ensuring you possess the legal authority to handle and process any customer documents you load into the tool.</li>
            <li>Configuring accurate printer settings, scale values, and media darkness on your physical hardware.</li>
            <li>Ensuring that custom messages or store links you add to labels comply with applicable marketplace policies and laws.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">7. Processing Results</h2>
          <p>
            Processing results depend upon the structure, fonts, and vector paths contained within your source
            PDFs. Modifications made to PDFs prior to uploading (such as image flattening or third-party PDF
            resizing) may alter automated boundary calculations.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">8. Accuracy and Verification</h2>
          <p>
            While LabelFix implements high-precision layout detection routines, we do not guarantee 100%
            flawless processing across all document variations. You must inspect the on-screen preview and
            verify that carrier barcodes, tracking numbers (AWB), and customer addresses are intact and legible
            before shipping items.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">9. Acceptable Use</h2>
          <p>
            You agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-white/60">
            <li>Attempt to reverse engineer, decompile, or tamper with the web application scripts.</li>
            <li>Use the Service to generate fraudulent shipping documents, forged barcodes, or deceptive courier labels.</li>
            <li>Upload documents containing malicious code, embedded exploits, or harmful scripts.</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">10. Intellectual Property</h2>
          <p>
            All software code, visual designs, typography pairings, documentation, and icons comprising LabelFix
            are the property of LabelFix and are protected by applicable copyright and intellectual property laws.
          </p>
        </section>

        {/* Section 11 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">11. Third-Party Trademarks</h2>
          <p>
            Amazon, Flipkart, Meesho, Delhivery, Shadowfax, Xpressbees, Ekart, DTDC, and other company names,
            logos, and product brands mentioned on this site are registered trademarks of their respective owners.
            Reference to these trademarks is solely for nominative descriptive purposes to identify compatible
            file formats. LabelFix is an independent utility and is not affiliated with, sponsored by, or
            endorsed by any of these entities.
          </p>
        </section>

        {/* Section 12 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">12. Service Availability</h2>
          <p>
            The Service is provided on an "as is" and "as available" basis. We strive to maintain uninterrupted
            access, but we do not warrant that the website will always be uninterrupted, error-free, or exempt
            from scheduled maintenance.
          </p>
        </section>

        {/* Section 13 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">13. Disclaimer of Warranties</h2>
          <p>
            To the maximum extent permitted by applicable law, LabelFix expressly disclaims all warranties of
            any kind, whether express, implied, or statutory, including but not limited to the implied warranties
            of merchantability, fitness for a particular purpose, title, and non-infringement. We make no warranty
            that the tools will meet your specific operational requirements or that generated barcodes will scan
            on every commercial scanner.
          </p>
        </section>

        {/* Section 14 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">14. Limitation of Liability</h2>
          <p>
            In no event shall LabelFix, its developers, contributors, or operators be liable for any indirect,
            incidental, special, consequential, or punitive damages, including without limitation loss of profits,
            lost shipments, courier delivery penalties, operational downtime, or loss of data resulting from your
            use of or inability to use the Service.
          </p>
        </section>

        {/* Section 15 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">15. Changes to the Service</h2>
          <p>
            We reserve the right to modify, suspend, or discontinue any feature, tool, or aspect of the Service
            at any time without prior notice.
          </p>
        </section>

        {/* Section 16 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">16. Changes to These Terms</h2>
          <p>
            We may revise these Terms periodically. Your continued use of LabelFix after changes have been posted
            constitutes your acceptance of the revised Terms.
          </p>
        </section>

        {/* Section 17 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white tracking-tight">17. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Republic of India,
            without regard to conflict of law principles. Any legal disputes arising out of these Terms shall be
            subject to the jurisdiction of competent courts in India.
          </p>
        </section>

        {/* Section 18 */}
        <section className="space-y-3 border-t border-white/10 pt-6">
          <h2 className="text-lg font-bold text-white tracking-tight">18. Contact Information</h2>
          <p>
            For questions regarding these Terms of Service, please contact us at:
          </p>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <p className="font-semibold text-white">LabelFix Legal & Support</p>
            <p className="text-xs text-white/50">Email: <a href="mailto:support.labelfix@gmail.com" className="text-[#c9a57b] hover:underline">support.labelfix@gmail.com</a></p>
            <p className="text-xs text-white/40">You can also visit our <button onClick={() => onNavigate('contact')} className="text-white hover:underline">Contact Page</button>.</p>
          </div>
        </section>
      </div>
    </div>
  );
};
