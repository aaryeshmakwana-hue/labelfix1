import React from 'react';
import { Store, Crop, Layers, ArrowRight, Printer, Shield, CheckCircle2, FileText, Zap } from 'lucide-react';
import { AppRoute } from '../utils/router';

interface AllToolsPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const AllToolsPage: React.FC<AllToolsPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Header Section */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#c9a57b]/10 border border-[#c9a57b]/20 text-[#c9a57b] text-xs font-semibold">
          <span>Marketplace PDF Utilities</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Ecommerce Shipping Label Tools
        </h1>
        <p className="text-sm sm:text-base text-white/60 leading-relaxed">
          LabelFix provides practical PDF tools for ecommerce sellers who need to prepare shipping
          labels for printing and fulfillment. Each utility is tailored to a specific marketplace workflow
          to eliminate manual editing and reduce printing mistakes.
        </p>
      </div>

      {/* Three Main Tool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {/* Tool 1: Meesho */}
        <div className="bg-[#111111] hover:bg-[#141414] border border-white/10 hover:border-[#c9a57b]/50 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 shadow-xl group">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-[#c9a57b]/15 text-[#c9a57b] border border-[#c9a57b]/25 flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ready to Use
              </span>
            </div>

            <h2 className="text-xl font-bold text-white group-hover:text-[#c9a57b] transition-colors">
              Meesho Promotional Label
            </h2>
            <p className="text-sm text-white/60 mt-2.5 leading-relaxed">
              Prepare supported Meesho shipping labels and add your configured promotional QR content
              in the designated label whitespace.
            </p>

            <div className="mt-6 pt-5 border-t border-white/5 space-y-2.5 text-xs text-white/50">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#c9a57b] flex-shrink-0 mt-0.5" />
                <span>Safely places store QR codes and review notes below label content</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#c9a57b] flex-shrink-0 mt-0.5" />
                <span>Zero overlap with shipping barcodes, AWB, or courier details</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#c9a57b] flex-shrink-0 mt-0.5" />
                <span>Formats for standard 4×6 inch thermal printers (Zebra, TVS, TSC, Rollo)</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => onNavigate('meesho-promotional-label')}
              className="w-full py-3 px-4 bg-[#c9a57b] hover:bg-[#d9b58b] text-black font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 shadow-md shadow-[#c9a57b]/10"
            >
              <span>Open Tool</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tool 2: Flipkart */}
        <div className="bg-[#111111] hover:bg-[#141414] border border-white/10 hover:border-blue-500/40 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 shadow-xl group">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/25 flex items-center justify-center">
                <Crop className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Dedicated Crop Tool
              </span>
            </div>

            <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
              Flipkart Label Crop
            </h2>
            <p className="text-sm text-white/60 mt-2.5 leading-relaxed">
              Prepare supported Flipkart shipping-label PDFs using the dedicated crop workflow while
              preserving the label content.
            </p>

            <div className="mt-6 pt-5 border-t border-white/5 space-y-2.5 text-xs text-white/50">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Isolates Flipkart shipping labels cleanly from full A4 sheets</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Adjustable crop window with auto-detection & manual coordinates</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Batch processing supports up to 90+ labels at full vector resolution</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => onNavigate('flipkart-label-crop')}
              className="w-full py-3 px-4 bg-[#181818] hover:bg-[#222222] text-white border border-white/10 hover:border-blue-500/40 font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center space-x-2"
            >
              <span>Open Tool</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tool 3: Amazon */}
        <div className="bg-[#111111] hover:bg-[#141414] border border-white/10 hover:border-amber-500/40 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 shadow-xl group">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Original Page Size
              </span>
            </div>

            <h2 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
              Amazon Label Tool
            </h2>
            <p className="text-sm text-white/60 mt-2.5 leading-relaxed">
              Process supported Amazon shipping-label and invoice PDFs and place extracted SKU and
              quantity information in the designated label area.
            </p>

            <div className="mt-6 pt-5 border-t border-white/5 space-y-2.5 text-xs text-white/50">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Scans Amazon PDF orders and automatically pairs labels with tax invoices</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Places readable (SKU) | Qty text safely into the label whitespace band</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Leaves original Amazon page dimensions intact; invoices are omitted from print batch</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => onNavigate('amazon-label-crop')}
              className="w-full py-3 px-4 bg-[#181818] hover:bg-[#222222] text-white border border-white/10 hover:border-amber-500/40 font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center space-x-2"
            >
              <span>Open Tool</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* How It Works & Best Practices */}
      <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-6">
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          How to Use LabelFix Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-white/60 leading-relaxed">
          <div className="space-y-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-xs">
              1
            </span>
            <h3 className="font-semibold text-white text-sm">Download Official PDFs</h3>
            <p>
              Download shipping labels directly from your seller dashboard (Meesho Supplier Hub,
              Flipkart Seller Hub, or Amazon Seller Central) as unmodified PDF documents.
            </p>
          </div>

          <div className="space-y-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-xs">
              2
            </span>
            <h3 className="font-semibold text-white text-sm">Process Securely In-Browser</h3>
            <p>
              Upload the PDF to the matching tool. Processing takes place 100% inside your local
              web browser. Files are never transmitted to external cloud servers.
            </p>
          </div>

          <div className="space-y-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-xs">
              3
            </span>
            <h3 className="font-semibold text-white text-sm">Preview & Thermal Print</h3>
            <p>
              Inspect the visual canvas preview. Once verified, download the processed PDF or send it
              directly to your 4×6 thermal printer with 1:1 scale settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
