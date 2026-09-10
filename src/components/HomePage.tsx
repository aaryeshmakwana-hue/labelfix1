import React from 'react';
import {
  Printer,
  Sparkles,
  Crop,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sliders,
  Store,
  CheckCircle2,
  Clock,
  HardDrive,
  FileCheck,
} from 'lucide-react';
import { AppRoute } from '../utils/router';

interface HomePageProps {
  onNavigate: (route: AppRoute) => void;
  onOpenHelpModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenHelpModal }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-white/5 bg-gradient-to-b from-[#121212] via-[#0a0a0a] to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#c9a57b]/10 border border-[#c9a57b]/20 text-[#c9a57b] text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#c9a57b]" />
              <span>LabelFix — Marketplace Shipping Utilities</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Shipping Label PDF Tools for Ecommerce Sellers
            </h1>

            {/* Supporting Text */}
            <p className="mt-5 text-base sm:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
              Prepare shipping-label PDFs more easily with practical tools for Meesho, Flipkart, and Amazon workflows.
            </p>

            {/* Quick CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <button
                id="hero-meesho-btn"
                onClick={() => onNavigate('meesho-promotional-label')}
                className="px-6 py-3.5 bg-[#c9a57b] hover:bg-[#d9b58b] text-black font-semibold rounded-xl transition-all shadow-lg shadow-[#c9a57b]/15 flex items-center space-x-2 text-sm group"
              >
                <Store className="w-4 h-4 text-black" />
                <span>Meesho Promotional Label</span>
                <ArrowRight className="w-4 h-4 text-black transition-transform group-hover:translate-x-1" />
              </button>

              <button
                id="hero-flipkart-btn"
                onClick={() => onNavigate('flipkart-label-crop')}
                className="px-5 py-3.5 bg-[#141414] hover:bg-[#1f1f1f] text-white border border-white/10 font-medium rounded-xl transition-all flex items-center space-x-2 text-sm"
              >
                <Crop className="w-4 h-4 text-[#c9a57b]" />
                <span>Flipkart Label Crop</span>
              </button>

              <button
                id="hero-amazon-btn"
                onClick={() => onNavigate('amazon-label-crop')}
                className="px-5 py-3.5 bg-[#141414] hover:bg-[#1f1f1f] text-white border border-white/10 font-medium rounded-xl transition-all flex items-center space-x-2 text-sm"
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Amazon Label Crop</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Choose Your Tool Section */}
      <section id="tools" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs uppercase font-bold tracking-[0.2em] text-[#c9a57b] mb-2">
            Platform Tools
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Choose Your Label Tool
          </p>
          <p className="mt-2 text-sm text-white/50">
            Independent, high-precision utilities engineered for each marketplace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tool 1: Meesho Promotional Label */}
          <div
            id="tool-card-meesho"
            onClick={() => onNavigate('meesho-promotional-label')}
            className="group relative bg-[#111111] hover:bg-[#141414] border border-white/10 hover:border-[#c9a57b]/50 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-[#c9a57b]/10"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a57b]/20 to-[#c9a57b]/5 text-[#c9a57b] border border-[#c9a57b]/20 flex items-center justify-center">
                  <Store className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Active & Ready</span>
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-[#c9a57b] transition-colors">
                Meesho Promotional Label
              </h3>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">
                Add promotional content and your store QR code to Meesho labels.
              </p>

              <div className="mt-5 pt-4 border-t border-white/5 space-y-2 text-xs text-white/50">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a57b]" />
                  <span>Automatic invoice ending & legal line detection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a57b]" />
                  <span>Store link QR code generator with smart scaling</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a57b]" />
                  <span>Zero barcode collision with 4×6" thermal output</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#c9a57b] group-hover:text-white flex items-center space-x-1">
                <span>Launch Meesho Tool</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="text-[11px] text-white/40">4×6 Thermal Ready</span>
            </div>
          </div>

          {/* Tool 2: Flipkart Label Crop */}
          <div
            id="tool-card-flipkart"
            onClick={() => onNavigate('flipkart-label-crop')}
            className="group relative bg-[#111111] hover:bg-[#141414] border border-white/10 hover:border-white/20 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 text-white/80 border border-white/10 flex items-center justify-center">
                  <Crop className="w-6 h-6 text-[#c9a57b]" />
                </div>
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  <span>Dedicated Tool</span>
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-[#c9a57b] transition-colors">
                Flipkart Label Crop
              </h3>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">
                Prepare Flipkart labels for clean thermal printing.
              </p>

              <div className="mt-5 pt-4 border-t border-white/5 space-y-2 text-xs text-white/50">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white/60" />
                  <span>Crops shipping label cleanly from Flipkart orders</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white/60" />
                  <span>Separates tax invoices to prevent waste</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white/60" />
                  <span>Strictly isolated from Meesho processing engine</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80 group-hover:text-[#c9a57b] flex items-center space-x-1">
                <span>Launch Flipkart Tool</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="text-[11px] text-white/40">Independent Module</span>
            </div>
          </div>

          {/* Tool 3: Amazon Label Crop */}
          <div
            id="tool-card-amazon"
            onClick={() => onNavigate('amazon-label-crop')}
            className="group relative bg-[#111111] hover:bg-[#141414] border border-white/10 hover:border-amber-500/30 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 text-white/80 border border-white/10 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-amber-400" />
                </div>
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Dedicated Tool</span>
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                Amazon Label Processor
              </h3>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">
                Pair Amazon shipping labels with invoices and add SKU / Quantity.
              </p>

              <div className="mt-5 pt-4 border-t border-white/5 space-y-2 text-xs text-white/50">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white/60" />
                  <span>Dynamic document scanning & multi-page invoice support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white/60" />
                  <span>Inserts (SKU) | Qty in designated horizontal blank area</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white/60" />
                  <span>Invoices excluded; original Amazon page size preserved</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80 group-hover:text-amber-300 flex items-center space-x-1">
                <span>Launch Amazon Tool</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="text-[11px] text-white/40">Independent Module</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why LabelFix Section */}
      <section id="why" className="py-16 bg-[#0e0e0e] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs uppercase font-bold tracking-[0.2em] text-[#c9a57b] mb-2">
              The Standard for Sellers
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Why Online Sellers Choose LabelFix
            </p>
            <p className="mt-2 text-sm text-white/50">
              Engineered specifically to solve real marketplace label printing pain points.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Simple */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-[#c9a57b]/10 text-[#c9a57b] flex items-center justify-center mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Simple</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Zero complex configuration. Drag and drop your label PDF batches and get
                perfect output in seconds without cumbersome desktop software.
              </p>
            </div>

            {/* Fast */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Fast</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                100% in-browser client-side execution. No uploading heavy PDF files to remote
                servers—processing completes instantly right inside your browser.
              </p>
            </div>

            {/* Printer-ready */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Printer-Ready</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Standard 4×6 inch (288 × 432 pt) dimensions engineered precisely for standard
                thermal printers (TVS, TSC, Zebra, Xprinter, Rollo) with sharp scannability.
              </p>
            </div>

            {/* Built for e-commerce sellers */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Built for Sellers</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Designed to safeguard carrier barcodes, tracking numbers, and buyer delivery data
                while turning dead label whitespace into repeat store orders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supporting Content Section */}
      <section id="about" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-4xl mx-auto space-y-10 text-white/70">
          {/* Simple Tools for Everyday Shipping Work */}
          <div className="border-b border-white/10 pb-8 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Simple Tools for Everyday Shipping Work
            </h2>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              LabelFix helps ecommerce sellers reduce repetitive PDF preparation work. Choose the
              tool that matches your shipping-label workflow, upload the supported PDF, process it,
              and download or print the result.
            </p>
          </div>

          {/* 3 Marketplace Tool Explanations */}
          <div className="space-y-6">
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 sm:p-6 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Store className="w-4 h-4 text-[#c9a57b]" />
                  <span>Meesho Promotional Labels</span>
                </h3>
                <button
                  onClick={() => onNavigate('meesho-promotional-label')}
                  className="text-xs text-[#c9a57b] hover:underline font-semibold flex items-center space-x-1"
                >
                  <span>Open Tool</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                The Meesho Promotional Label tool inspects Meesho shipping-label PDFs and calculates the
                available whitespace below the label and invoice tables. It places your configured store QR code
                and customer promotional message in this dead space while strictly keeping carrier barcodes,
                AWB tracking numbers, and delivery addresses unobstructed.
              </p>
            </div>

            <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 sm:p-6 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Crop className="w-4 h-4 text-blue-400" />
                  <span>Flipkart Label Crop</span>
                </h3>
                <button
                  onClick={() => onNavigate('flipkart-label-crop')}
                  className="text-xs text-blue-400 hover:underline font-semibold flex items-center space-x-1"
                >
                  <span>Open Tool</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                Flipkart orders frequently combine customer invoices with shipping labels on full A4 pages.
                The Flipkart Label Crop tool isolates the shipping label portion cleanly using automatic boundary
                detection or manual crop coordinate adjustments, preparing vector-sharp 4×6 inch labels for thermal printers.
              </p>
            </div>

            <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 sm:p-6 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Amazon Label Processing</span>
                </h3>
                <button
                  onClick={() => onNavigate('amazon-label-crop')}
                  className="text-xs text-amber-400 hover:underline font-semibold flex items-center space-x-1"
                >
                  <span>Open Tool</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                The Amazon Shipping Label Tool scans combined Amazon PDF orders, automatically pairs shipping
                labels with their corresponding tax invoice pages, extracts SKU and quantity details, and places
                formatted (SKU) | Qty text into the label whitespace band while omitting invoices from thermal printing.
              </p>
            </div>
          </div>

          {/* Built for Practical Ecommerce Workflows */}
          <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-bold text-white">
              Built for Practical Ecommerce Workflows
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs text-white/60">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#c9a57b] flex-shrink-0 mt-0.5" />
                <span><strong>Browser-based workflow:</strong> No desktop app or software installation needed.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#c9a57b] flex-shrink-0 mt-0.5" />
                <span><strong>PDF-focused tools:</strong> Native vector processing maintains razor-sharp barcodes.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#c9a57b] flex-shrink-0 mt-0.5" />
                <span><strong>Batch processing:</strong> Process single orders or 90+ label batches seamlessly.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#c9a57b] flex-shrink-0 mt-0.5" />
                <span><strong>Downloadable output:</strong> Export clean PDF files directly to your downloads folder.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#c9a57b] flex-shrink-0 mt-0.5" />
                <span><strong>Print-focused:</strong> Engineered for 4×6 inch thermal printers (TSC, Zebra, TVS, Rollo).</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#c9a57b] flex-shrink-0 mt-0.5" />
                <span><strong>Responsive interface:</strong> Clean layout accessible across desktop, tablet, and mobile.</span>
              </div>
            </div>
          </div>

          {/* Knowledge & Guides Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 gap-4">
            <div>
              <p className="text-sm font-bold text-white">Need help setting up your labels or printer?</p>
              <p className="text-xs text-white/50">Explore our step-by-step seller guides and troubleshooting tips.</p>
            </div>
            <button
              onClick={() => onNavigate('guides')}
              className="px-4 py-2 bg-[#c9a57b] hover:bg-[#d9b58b] text-black font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
            >
              Browse Guides
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
