import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { MessageTemplate } from '../types';
import { DEFAULT_TEMPLATE } from '../data/defaultAccounts';
import {
  X,
  FileText,
  RotateCcw,
  Check,
  Smile,
  Printer,
  Sparkles,
} from 'lucide-react';

interface TemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeAccount, updateActiveTemplate, resetActiveTemplate } = useAccounts();
  const [template, setTemplate] = useState<MessageTemplate>(activeAccount?.messageTemplate || DEFAULT_TEMPLATE);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && activeAccount) {
      setTemplate(activeAccount.messageTemplate || DEFAULT_TEMPLATE);
      setSavedSuccess(false);
    }
  }, [isOpen, activeAccount]);

  if (!isOpen || !activeAccount) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateActiveTemplate(template);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleReset = () => {
    if (confirm('Restore standard default thank-you and review template?')) {
      resetActiveTemplate();
      setTemplate(DEFAULT_TEMPLATE);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#141414] rounded-2xl shadow-2xl border border-white/10 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#d1d1d1]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0d0d0d] border-b border-white/5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#c9a57b]/15 text-[#c9a57b] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Promotional Message Template</h3>
              <p className="text-xs text-white/40">
                Active for: <strong className="text-[#c9a57b]">{activeAccount.accountName}</strong>
              </p>
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
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Form: Template Fields */}
          <form onSubmit={handleSave} className="space-y-3.5">
            {/* Heading */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
                Heading
              </label>
              <input
                type="text"
                value={template.heading}
                onChange={(e) => setTemplate({ ...template, heading: e.target.value })}
                placeholder="THANK YOU FOR CHOOSING US!"
                className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#c9a57b]/40 focus:border-[#c9a57b]"
              />
            </div>

            {/* Review Message */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
                Review CTA Message
              </label>
              <textarea
                rows={2}
                value={template.reviewMessage}
                onChange={(e) => setTemplate({ ...template, reviewMessage: e.target.value })}
                placeholder="Loved your purchase? Share your experience by leaving a review."
                className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#c9a57b]/40 focus:border-[#c9a57b]"
              />
            </div>

            {/* Store CTA */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
                Store Follow CTA
              </label>
              <input
                type="text"
                value={template.storeCTA}
                onChange={(e) => setTemplate({ ...template, storeCTA: e.target.value })}
                placeholder="SCAN TO FOLLOW OUR STORE"
                className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#c9a57b]/40 focus:border-[#c9a57b]"
              />
            </div>

            {/* Sub Highlights */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
                Store Highlights Line
              </label>
              <input
                type="text"
                value={template.subCTA}
                onChange={(e) => setTemplate({ ...template, subCTA: e.target.value })}
                placeholder="More Collections • New Arrivals • Special Offers"
                className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#c9a57b]/40 focus:border-[#c9a57b]"
              />
            </div>

            {/* Footer */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
                Footer Sign-off
              </label>
              <input
                type="text"
                value={template.footer}
                onChange={(e) => setTemplate({ ...template, footer: e.target.value })}
                placeholder="We look forward to serving you again!"
                className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#c9a57b]/40 focus:border-[#c9a57b]"
              />
            </div>

            {/* Emoji Mode Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs font-medium text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.enableEmojis}
                  onChange={(e) => setTemplate({ ...template, enableEmojis: e.target.checked })}
                  className="rounded bg-[#0d0d0d] border-white/20 text-[#c9a57b] focus:ring-[#c9a57b] h-4 w-4"
                />
                <Smile className="w-3.5 h-3.5 text-[#c9a57b]" />
                <span>Enable Emojis in Print</span>
              </label>

              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-white/40 hover:text-white flex items-center space-x-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Default</span>
              </button>
            </div>

            <div className="pt-3 flex items-center justify-end space-x-2 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-[#0d0d0d] hover:bg-[#1a1a1a] text-white/80 border border-white/10 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#c9a57b] hover:bg-[#d9b58b] text-black rounded-xl text-xs font-bold shadow-md shadow-[#c9a57b]/10"
              >
                {savedSuccess ? 'Saved ✓' : 'Save Template'}
              </button>
            </div>
          </form>

          {/* Right Live Simulated Thermal Slip Preview */}
          <div className="bg-[#0d0d0d] rounded-xl p-4 flex flex-col items-center justify-center border border-white/5">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 mb-2 flex items-center space-x-1">
              <Printer className="w-3 h-3 text-[#c9a57b]" />
              <span>Simulated Thermal Print Output</span>
            </span>

            <div className="w-full max-w-[240px] bg-white rounded-lg p-3 shadow-xl border border-white/10 font-sans text-center text-black space-y-1.5">
              <div className="border-b border-dashed border-black pb-1 mb-1">
                <span className="text-[9px] uppercase tracking-widest text-black/50 font-mono">
                  [ End of Invoice Line ]
                </span>
              </div>

              <p className="text-[11px] font-bold tracking-tight text-black">
                {template.heading || 'THANK YOU FOR CHOOSING US!'}
              </p>

              {template.reviewMessage && (
                <div className="text-[9px] text-black/80 leading-tight">
                  {template.reviewMessage.split('\n').map((l, i) => (
                    <p key={i}>{l}</p>
                  ))}
                </div>
              )}

              <p className="text-[9.5px] font-bold text-black tracking-tight">
                {template.storeCTA || 'SCAN TO FOLLOW OUR STORE'}
              </p>

              {template.subCTA && (
                <p className="text-[8px] text-black/70 leading-tight">
                  {template.subCTA}
                </p>
              )}

              <div className="w-16 h-16 mx-auto bg-white border border-black p-1 flex items-center justify-center">
                {activeAccount.generatedQRCode ? (
                  <img
                    src={activeAccount.generatedQRCode}
                    alt="Store QR"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-[8px] font-mono">[QR CODE]</span>
                )}
              </div>

              {template.footer && (
                <p className="text-[8.5px] text-black/80 font-medium">
                  {template.footer}
                </p>
              )}
            </div>

            <p className="text-[10px] text-white/40 text-center mt-3">
              Configured once per account and automatically rendered below each invoice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
