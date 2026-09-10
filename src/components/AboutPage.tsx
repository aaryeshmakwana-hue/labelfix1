import React from 'react';
import { Store, Crop, Layers, Printer, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { AppRoute } from '../utils/router';

interface AboutPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#c9a57b]/10 border border-[#c9a57b]/20 text-[#c9a57b] text-xs font-semibold">
          <span>About Us</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          About LabelFix
        </h1>
        <p className="text-base sm:text-lg text-white/70 leading-relaxed">
          LabelFix is a collection of practical tools designed to simplify common ecommerce
          shipping-label PDF tasks.
        </p>
      </div>

      {/* Main Philosophy & Background */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 text-sm text-white/70 leading-relaxed">
        <p>
          Online sellers across platforms like Meesho, Flipkart, and Amazon receive shipping-label
          PDFs that frequently require additional preparation before they can be sent to thermal printers.
          These files often combine shipping labels with multi-page customer invoices, leave empty dead
          space where customer communication could happen, or format labels on full A4 sheets that are
          ill-suited for standard 4×6 inch thermal rolls.
        </p>
        <p>
          LabelFix was developed to address these everyday operational friction points. Instead of
          forcing sellers through complex image editors or tedious manual page deletions, LabelFix
          focuses on reducing repetitive manual work and making common label-processing workflows easier.
        </p>
      </div>

      {/* Core Principles */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white tracking-tight">
          What We Focus On
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-white/60 leading-relaxed">
          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-white">Simple Workflows</h3>
            <p>
              Tools are engineered for immediate use: upload your PDF, review the preview, and download
              or print your result. There is no complicated setup or steep learning curve.
            </p>
          </div>

          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-white">Practical Tools</h3>
            <p>
              Each utility solves a clearly defined challenge for a specific marketplace format—whether
              that is adding promotional store QR codes, isolating shipping labels from A4 sheets, or
              pairing invoices with shipping labels.
            </p>
          </div>

          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-white">Batch Processing</h3>
            <p>
              Where supported, LabelFix processes multi-page PDF documents quickly, helping sellers
              handle daily dispatches of dozens or hundreds of packages with consistent results.
            </p>
          </div>

          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-white">Print-Focused Outputs</h3>
            <p>
              Files are prepared specifically for thermal barcode printers (such as TVS, TSC, Zebra, and
              Rollo) so logistics carriers can scan tracking barcodes cleanly and accurately.
            </p>
          </div>

          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-white">Client-Side Privacy</h3>
            <p>
              All document processing takes place directly in your web browser. Customer delivery
              addresses and order values are never transmitted to external cloud servers.
            </p>
          </div>

          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-white">Transparent Software</h3>
            <p>
              We do not claim 100% accuracy or make exaggerated claims. We provide reliable software,
              encourage sellers to review their output, and continuously refine our tools based on feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Current Tools Overview */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Current LabelFix Tools
        </h2>
        <div className="space-y-4">
          {/* Tool 1 */}
          <div className="p-5 rounded-2xl bg-[#111111] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#c9a57b]/15 text-[#c9a57b] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Meesho Promotional Label</h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Detects available whitespace below Meesho labels to safely add promotional messages and store review QR codes without barcode interference.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('meesho-promotional-label')}
              className="px-4 py-2 bg-[#c9a57b] hover:bg-[#d9b58b] text-black font-bold text-xs rounded-xl transition-colors whitespace-nowrap flex items-center space-x-1"
            >
              <span>Open Tool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tool 2 */}
          <div className="p-5 rounded-2xl bg-[#111111] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Crop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Flipkart Label Crop</h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Extracts shipping labels from full A4 sheets with automatic boundary detection and manual coordinate controls at 1:1 vector resolution.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('flipkart-label-crop')}
              className="px-4 py-2 bg-[#181818] hover:bg-[#222222] border border-white/10 text-white font-bold text-xs rounded-xl transition-colors whitespace-nowrap flex items-center space-x-1"
            >
              <span>Open Tool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tool 3 */}
          <div className="p-5 rounded-2xl bg-[#111111] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Amazon Shipping Label Tool</h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Pairs shipping labels with multi-page tax invoices, extracts SKU & quantity data, and prints formatted item text directly into the label whitespace band.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('amazon-label-crop')}
              className="px-4 py-2 bg-[#181818] hover:bg-[#222222] border border-white/10 text-white font-bold text-xs rounded-xl transition-colors whitespace-nowrap flex items-center space-x-1"
            >
              <span>Open Tool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Trademark Disclaimer */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/40 leading-relaxed space-y-1">
        <p className="font-semibold text-white/50">Trademark Disclaimer</p>
        <p>
          Amazon, Flipkart, and Meesho are registered trademarks of their respective owners. LabelFix
          is an independent utility and is not affiliated with, sponsored by, or endorsed by Amazon,
          Flipkart, or Meesho.
        </p>
      </div>
    </div>
  );
};
