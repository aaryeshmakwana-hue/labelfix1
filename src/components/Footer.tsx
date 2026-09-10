import React from 'react';
import { Store, Crop, Layers, Shield, FileText, ArrowRight } from 'lucide-react';
import { AppRoute } from '../utils/router';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-[#080808] border-t border-white/5 text-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-white/5">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src="/png_to_svg_converter_by_poper.svg"
                alt="LabelFix Logo"
                className="w-9 h-9 rounded-xl object-contain shadow-md shadow-[#c9a57b]/10 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <span className="font-bold text-lg text-white tracking-wider">LabelFix</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed max-w-sm">
              Simple tools for preparing ecommerce shipping-label PDFs.
            </p>
            <div className="text-xs text-white/40 space-y-1 pt-1">
              <p>Independent e-commerce shipping label utility.</p>
              <p className="text-[11px] text-white/30">
                All marketplace trademarks belong to their respective owners.
              </p>
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-4">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('tools')}
                  className="hover:text-white transition-colors text-left"
                >
                  All Tools
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('guides')}
                  className="hover:text-white transition-colors text-left"
                >
                  Guides
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('faq')}
                  className="hover:text-white transition-colors text-left"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors text-left"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-white transition-colors text-left"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Tools Column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-4">
              Tools
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('meesho-promotional-label')}
                  className="hover:text-[#c9a57b] transition-colors text-left flex items-center space-x-1.5"
                >
                  <Store className="w-3.5 h-3.5 text-[#c9a57b] flex-shrink-0" />
                  <span>Meesho Promotional Label</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('flipkart-label-crop')}
                  className="hover:text-blue-400 transition-colors text-left flex items-center space-x-1.5"
                >
                  <Crop className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>Flipkart Label Crop</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('amazon-label-crop')}
                  className="hover:text-amber-300 transition-colors text-left flex items-center space-x-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Amazon Label Tool</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-4">
              Legal & Privacy
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('privacy-policy')}
                  className="hover:text-white transition-colors text-left flex items-center space-x-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('terms')}
                  className="hover:text-white transition-colors text-left flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                  <span>Terms of Service</span>
                </button>
              </li>
            </ul>
            <div className="mt-5 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-white/40 leading-relaxed">
              PDF files are processed locally in your browser for privacy.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© {currentYear} LabelFix. All rights reserved.</p>
          <p className="text-[11px] text-white/30 text-center sm:text-right">
            Independent shipping-label utility. Not affiliated with Meesho, Flipkart, or Amazon.
          </p>
        </div>
      </div>
    </footer>
  );
};
