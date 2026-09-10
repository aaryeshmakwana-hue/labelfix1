import React from 'react';
import { useAccounts } from '../context/AccountContext';
import {
  Store,
  QrCode,
  ExternalLink,
  Edit2,
  FileText,
  Plus,
  CheckCircle2,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  onOpenAccountModal: (editMode?: boolean) => void;
  onOpenTemplateModal: () => void;
  onOpenSettingsModal: () => void;
  onLoadSample?: (count: number, type?: 'single' | 'mixed' | 'tall') => void;
  loadedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenAccountModal,
  onOpenTemplateModal,
  onOpenSettingsModal,
  onLoadSample,
  loadedCount,
}) => {
  const { activeAccount } = useAccounts();
  const tmpl = activeAccount?.messageTemplate;

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 space-y-4">
      {/* Current Account Card */}
      <div className="bg-[#141414] rounded-2xl border border-white/5 p-6 shadow-sm">
        {activeAccount ? (
          <>
            <div className="flex items-center justify-between pb-3.5 border-b border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#c9a57b]/15 text-[#c9a57b] flex items-center justify-center font-bold text-sm">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 block leading-none">
                    Active Meesho Store
                  </span>
                  <h2 className="text-sm font-semibold text-white truncate mt-1">
                    {activeAccount.accountName}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => onOpenAccountModal(true)}
                className="p-1.5 text-white/40 hover:text-[#c9a57b] hover:bg-white/5 rounded-lg transition-colors"
                title="Edit Store Info"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Store Link & QR Code Preview */}
            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  Store URL (One-Time Setup):
                </span>
                <div className="flex items-center justify-between bg-[#0d0d0d] border border-white/10 px-3 py-2 rounded-xl text-xs font-mono text-white/80">
                  <span className="truncate pr-2">{activeAccount.storeLink || 'Not configured'}</span>
                  {activeAccount.storeLink && (
                    <a
                      href={activeAccount.storeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#c9a57b] hover:text-[#d9b58b] flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Auto-Generated QR Preview */}
              <div className="bg-[#0d0d0d] border border-white/5 rounded-xl p-3.5 flex items-center space-x-3.5">
                <div className="w-16 h-16 bg-white rounded-lg p-1 flex-shrink-0 flex items-center justify-center shadow-xs">
                  {activeAccount.generatedQRCode ? (
                    <img
                      src={activeAccount.generatedQRCode}
                      alt="Account Store QR"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <QrCode className="w-8 h-8 text-black/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center space-x-1 text-emerald-400 font-semibold mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Auto QR Active</span>
                  </div>
                  <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                    Level-H error correction, thermal-optimized & scannable.
                  </p>
                </div>
              </div>
            </div>

            {/* Active Promotional Message Preview */}
            {tmpl && (
              <div className="mt-4 pt-3.5 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 flex items-center space-x-1">
                    <FileText className="w-3 h-3 text-white/40" />
                    <span>Promotional Message</span>
                  </span>
                  <button
                    onClick={onOpenTemplateModal}
                    className="text-[11px] font-medium text-[#c9a57b] hover:text-[#d9b58b] transition-colors"
                  >
                    Customize
                  </button>
                </div>
                <div className="bg-[#0d0d0d] rounded-xl p-3 text-[11px] text-white/70 border border-white/5 space-y-1">
                  <p className="font-semibold text-white">{tmpl.heading}</p>
                  <p className="text-white/60 text-[10px] leading-tight line-clamp-2">
                    {tmpl.reviewMessage}
                  </p>
                  <p className="font-semibold text-[#c9a57b] text-[10px]">{tmpl.storeCTA}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty state when all accounts are deleted */
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">No Active Meesho Account</h3>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">
                Add your Meesho store to generate dynamic promotional QR codes and custom footer inserts on thermal labels.
              </p>
            </div>
            <button
              onClick={() => onOpenAccountModal(false)}
              className="w-full py-2.5 px-4 bg-[#c9a57b] hover:bg-[#d9b58b] text-black font-bold rounded-xl text-xs shadow-md shadow-[#c9a57b]/10 flex items-center justify-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Meesho Account</span>
            </button>
          </div>
        )}
      </div>

      {/* Safety & Offline Guarantee Badge */}
      <div className="bg-[#141414] rounded-2xl border border-white/5 p-4.5">
        <div className="flex items-start space-x-3">
          <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-white">
            <span className="font-semibold block mb-0.5 text-emerald-400">100% Client-Side & Safe</span>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Zero customer PII leaves your browser. Original Meesho barcodes and GST tables are
              guaranteed 100% untouched.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

