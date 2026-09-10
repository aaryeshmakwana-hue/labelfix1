import React from 'react';
import {
  X,
  HelpCircle,
  ShieldCheck,
  Printer,
  FileCheck,
  Sparkles,
  Store,
  Layers,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#141414] rounded-2xl shadow-2xl border border-white/10 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#d1d1d1]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d0d0d] border-b border-white/5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#c9a57b]/15 text-[#c9a57b] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">LabelFix — Help & Guide</h3>
              <p className="text-xs text-white/40">E-Commerce Label Processing & 4×6 Thermal Workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-[#d1d1d1] max-h-[75vh] overflow-y-auto">
          {/* Step 1 */}
          <div className="p-3.5 bg-[#0d0d0d] border border-white/5 rounded-xl space-y-1">
            <div className="flex items-center space-x-2 text-white font-semibold text-sm">
              <Store className="w-4 h-4 text-[#c9a57b]" />
              <span>1. Account & One-Time Store Link Setup</span>
            </div>
            <p className="text-white/50 leading-relaxed">
              Create your Meesho accounts (e.g. <em>Your Account</em>, <em>My Store</em>).
              Enter your store URL once. The system automatically creates a high-contrast,
              error-corrected QR code for follow & reviews that attaches automatically to every future batch.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 bg-[#0d0d0d] border border-white/5 rounded-xl space-y-1">
            <div className="flex items-center space-x-2 text-white font-semibold text-sm">
              <FileCheck className="w-4 h-4 text-[#c9a57b]" />
              <span>2. Upload Meesho Label PDF</span>
            </div>
            <p className="text-white/50 leading-relaxed">
              Drop any 1, 25, 50, or 100+ page Meesho shipping label PDF. The engine scans each page,
              detects the exact bottom boundary of the Tax Invoice table, and locates the safe whitespace below it.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 bg-[#0d0d0d] border border-white/5 rounded-xl space-y-1">
            <div className="flex items-center space-x-2 text-white font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>3. Absolute Original Label Safety</span>
            </div>
            <p className="text-white/50 leading-relaxed">
              The original label (barcodes, customer addresses, invoice totals, Meesho logos) is preserved 100% untouched as a native vector layer. The promotional section is added solely into the blank whitespace at the bottom.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 bg-[#0d0d0d] border border-white/5 rounded-xl space-y-1">
            <div className="flex items-center space-x-2 text-white font-semibold text-sm">
              <Printer className="w-4 h-4 text-[#c9a57b]" />
              <span>4. Thermal Printing on 4×6" Printers</span>
            </div>
            <p className="text-white/50 leading-relaxed">
              Click <strong className="text-white">Process All</strong> to generate an exact 4×6 inch (288 × 432 pt) print-ready PDF ready for any thermal roll printer (TSC, Zebra, Xprinter, TVS, Rollo).
            </p>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-white/80">
              <strong className="text-emerald-400">Zero Server Upload:</strong> All processing is done strictly client-side within your browser. Customer names, addresses, phone numbers, and invoice amounts never leave your device.
            </div>
          </div>

          <div className="pt-2 flex justify-end border-t border-white/5">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#c9a57b] hover:bg-[#d9b58b] text-black rounded-xl font-bold transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
