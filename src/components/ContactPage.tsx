import React, { useState } from 'react';
import { Mail, MessageSquare, AlertCircle, HelpCircle, FileQuestion, CheckCircle2, Copy, Check } from 'lucide-react';
import { AppRoute } from '../utils/router';

interface ContactPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [copied, setCopied] = useState(false);
  const supportEmail = 'support.labelfix@gmail.com';

  const handleCopyEmail = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(supportEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#c9a57b]/10 border border-[#c9a57b]/20 text-[#c9a57b] text-xs font-semibold">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Support & Inquiries</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Contact LabelFix
        </h1>
        <p className="text-base sm:text-lg text-white/70 leading-relaxed">
          We welcome questions, bug reports, and suggestions from sellers to make our label tools better.
        </p>
      </div>

      {/* Main Support Card */}
      <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 sm:p-10 space-y-8">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            How to Reach Us
          </h2>
          <p className="text-sm text-white/60 mt-1">
            Reach out via email for assistance, feedback, or data privacy inquiries.
          </p>
        </div>

        {/* Support Email Box */}
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#c9a57b]/15 text-[#c9a57b] flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">
                Support Email
              </p>
              <a
                href={`mailto:${supportEmail}`}
                className="text-base font-bold text-white hover:text-[#c9a57b] transition-colors"
              >
                {supportEmail}
              </a>
            </div>
          </div>
          <button
            onClick={handleCopyEmail}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Email</span>
              </>
            )}
          </button>
        </div>

        {/* Reasons to Contact */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/50">
            What You Can Contact Us For:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/70">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center space-x-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a57b]"></span>
              <span>Technical problems or error messages</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center space-x-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a57b]"></span>
              <span>PDF parsing or formatting issues</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center space-x-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a57b]"></span>
              <span>Incorrect output or alignment reports</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center space-x-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a57b]"></span>
              <span>Feature requests & new marketplace ideas</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center space-x-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a57b]"></span>
              <span>General feedback on tool performance</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center space-x-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a57b]"></span>
              <span>Data privacy questions & requests</span>
            </div>
          </div>
        </div>

        {/* Issue Reporting Checklist */}
        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/15 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>Helpful Information to Include in Bug Reports</span>
          </h4>
          <p className="text-xs text-white/60 leading-relaxed">
            To help us identify and resolve PDF processing issues as quickly as possible, please include:
          </p>
          <ul className="space-y-1.5 text-xs text-white/70 pl-2">
            <li>• <strong>Tool Used:</strong> (Meesho Promotional Label, Flipkart Crop, or Amazon Tool)</li>
            <li>• <strong>Browser & Operating System:</strong> (e.g. Chrome 120 on Windows 11, Safari on macOS)</li>
            <li>• <strong>Description:</strong> What happened versus what you expected to happen</li>
            <li>• <strong>Error Message:</strong> Any specific error text displayed on the screen</li>
          </ul>
        </div>
      </div>

      {/* Quick Answers Shortcut */}
      <div className="p-6 rounded-2xl bg-[#0f0f0f] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Looking for immediate answers?</h3>
          <p className="text-xs text-white/50 mt-1">
            Many common questions regarding printer scaling, browser compatibility, and PDF formats are answered in our FAQ.
          </p>
        </div>
        <button
          onClick={() => onNavigate('faq')}
          className="px-4 py-2 bg-[#c9a57b] hover:bg-[#d9b58b] text-black text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
        >
          View FAQ
        </button>
      </div>
    </div>
  );
};
