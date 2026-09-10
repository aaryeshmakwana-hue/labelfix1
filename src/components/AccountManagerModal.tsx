import React, { useState, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { generateQRCodeDataUrl } from '../utils/qrGenerator';
import {
  X,
  Store,
  QrCode,
  Check,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editMode?: boolean;
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  isOpen,
  onClose,
  editMode = false,
}) => {
  const { activeAccount, createAccount, updateAccount, deleteAccount } = useAccounts();

  const [accountName, setAccountName] = useState('');
  const [storeLink, setStoreLink] = useState('');
  const [qrErrorCorrection, setQrErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [qrPreviewUrl, setQrPreviewUrl] = useState('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dedicated Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetAccountId, setDeleteTargetAccountId] = useState<string | null>(null);
  const [deleteTargetAccountName, setDeleteTargetAccountName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editMode && activeAccount) {
        setAccountName(activeAccount.accountName);
        setStoreLink(activeAccount.storeLink);
        setQrErrorCorrection(activeAccount.qrSettings?.errorCorrection || 'H');
        setQrPreviewUrl(activeAccount.generatedQRCode || '');
      } else {
        setAccountName('');
        setStoreLink('https://meesho.com/');
        setQrErrorCorrection('H');
        setQrPreviewUrl('');
      }
      setErrorMsg(null);
      setDeleteConfirmOpen(false);
      setDeleteTargetAccountId(null);
      setDeleteTargetAccountName('');
      setIsDeleting(false);
    }
  }, [isOpen, editMode, activeAccount]);

  // Real-time automatic QR generator on store link change
  useEffect(() => {
    let isCurrent = true;
    const generate = async () => {
      if (!storeLink || !storeLink.startsWith('http')) {
        setQrPreviewUrl('');
        return;
      }
      setIsGeneratingQR(true);
      try {
        const url = await generateQRCodeDataUrl(storeLink, {
          errorCorrectionLevel: qrErrorCorrection,
          margin: 1,
        });
        if (isCurrent) {
          setQrPreviewUrl(url);
        }
      } catch (err) {
        console.warn('QR generation error:', err);
      } finally {
        if (isCurrent) setIsGeneratingQR(false);
      }
    };

    const timer = setTimeout(generate, 250);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [storeLink, qrErrorCorrection]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      setErrorMsg('Please enter an account name (e.g. Your Account or My Store).');
      return;
    }
    if (!storeLink.trim() || !storeLink.startsWith('http')) {
      setErrorMsg('Please enter a valid Meesho store URL (e.g. https://meesho.com/yourstore).');
      return;
    }

    try {
      if (editMode && activeAccount) {
        await updateAccount(activeAccount.id, {
          accountName: accountName.trim(),
          storeLink: storeLink.trim(),
          generatedQRCode: qrPreviewUrl,
          qrSettings: {
            ...activeAccount.qrSettings,
            errorCorrection: qrErrorCorrection,
          },
        });
      } else {
        await createAccount({
          accountName: accountName.trim(),
          storeLink: storeLink.trim(),
          generatedQRCode: qrPreviewUrl,
          qrSettings: {
            size: 256,
            errorCorrection: qrErrorCorrection,
            margin: 1,
          },
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg('Failed to save account configuration.');
    }
  };

  const handleInitiateDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeAccount) return;
    setDeleteTargetAccountId(activeAccount.id);
    setDeleteTargetAccountName(activeAccount.accountName);
    setDeleteConfirmOpen(true);
  };

  const handleCancelDelete = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDeleteConfirmOpen(false);
    setDeleteTargetAccountId(null);
    setDeleteTargetAccountName('');
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!deleteTargetAccountId || isDeleting) return;

    setIsDeleting(true);
    try {
      const result = await deleteAccount(deleteTargetAccountId);
      if (result.success) {
        setDeleteConfirmOpen(false);
        setDeleteTargetAccountId(null);
        onClose();
      } else {
        setErrorMsg(result.message || 'Unable to delete account. Please try again.');
        setDeleteConfirmOpen(false);
      }
    } catch (err) {
      console.error('Account deletion execution failed:', err);
      setErrorMsg('Unable to delete account. Please try again.');
      setDeleteConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-[#141414] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#d1d1d1]">
          {/* Header */}
          <div className="px-6 py-4 bg-[#0d0d0d] border-b border-white/5 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#c9a57b]/15 text-[#c9a57b] flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-white">
                {editMode ? 'Edit Meesho Account' : 'Add New Meesho Account'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="p-6 space-y-4">
            {/* Account Name */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
                Meesho Account Name
              </label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Your Account or My Store"
                className="w-full px-3.5 py-2.5 bg-[#0d0d0d] border border-white/10 rounded-xl text-sm font-medium text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#c9a57b]/40 focus:border-[#c9a57b]"
              />
            </div>

            {/* Store Link Setup */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  Meesho Store Link (One-Time Setup)
                </label>
                <span className="text-[11px] text-[#c9a57b] font-medium">Auto-Generates QR</span>
              </div>
              <input
                type="url"
                required
                value={storeLink}
                onChange={(e) => setStoreLink(e.target.value)}
                placeholder="https://meesho.com/yourstore?_ms=2"
                className="w-full px-3.5 py-2.5 bg-[#0d0d0d] border border-white/10 rounded-xl text-sm font-mono text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#c9a57b]/40 focus:border-[#c9a57b]"
              />
              <p className="text-[11px] text-white/40 mt-1">
                Enter your store URL once. The QR code is generated automatically and applied to every future label PDF processed under this account.
              </p>
            </div>

            {/* Automatic QR Code Preview Box */}
            <div className="p-4 bg-[#0d0d0d] border border-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <QrCode className="w-4 h-4 text-[#c9a57b]" />
                  <span>Automatic QR Preview</span>
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-white/40">Error Correction:</span>
                  <select
                    value={qrErrorCorrection}
                    onChange={(e) => setQrErrorCorrection(e.target.value as any)}
                    className="bg-[#141414] border border-white/10 text-xs rounded-lg px-2 py-1 font-medium text-white focus:outline-none focus:border-[#c9a57b]"
                  >
                    <option value="H">High (Level H - 30%)</option>
                    <option value="Q">Quartile (Level Q - 25%)</option>
                    <option value="M">Medium (Level M - 15%)</option>
                    <option value="L">Low (Level L - 7%)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 bg-white border border-white/10 rounded-xl p-1.5 flex items-center justify-center flex-shrink-0 shadow-xs">
                  {isGeneratingQR ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-black" />
                  ) : qrPreviewUrl ? (
                    <img
                      src={qrPreviewUrl}
                      alt="Generated Store QR"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-black/40 text-center">
                      Enter valid URL to preview
                    </span>
                  )}
                </div>

                <div className="text-xs text-white/70 space-y-1">
                  <div className="flex items-center space-x-1 text-emerald-400 font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Thermal-Printer Ready</span>
                  </div>
                  <p className="text-[11px] text-white/40 leading-snug">
                    High contrast monochrome pixels with quiet zone margins. Scans smoothly on mobile camera & scanners after thermal roll printing.
                  </p>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-white/5">
              {editMode && activeAccount && (
                <button
                  type="button"
                  id="delete-account-btn"
                  onClick={handleInitiateDelete}
                  className="px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Account</span>
                </button>
              )}

              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  id="cancel-account-edit-btn"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#0d0d0d] hover:bg-[#1a1a1a] text-white/80 border border-white/10 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-account-btn"
                  className="px-5 py-2 bg-[#c9a57b] hover:bg-[#d9b58b] text-black font-bold rounded-xl text-xs shadow-md shadow-[#c9a57b]/10 transition-all"
                >
                  {editMode ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Standalone Confirmation Dialog Overlay */}
      {deleteConfirmOpen && (
        <div
          id="delete-confirmation-dialog"
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl text-[#d1d1d1] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Delete Meesho Account?
                </h3>
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                  Confirmation Required
                </span>
              </div>
            </div>

            <p className="text-xs text-white/80 leading-relaxed mt-2">
              Are you sure you want to delete <strong className="text-white">"{deleteTargetAccountName}"</strong>?
            </p>

            <p className="text-xs text-white/50 mt-1.5 leading-relaxed">
              This will remove this account and its saved store-link configuration and account-specific settings from this application.
            </p>

            <p className="text-xs text-rose-400/90 font-medium mt-2.5 flex items-center space-x-1">
              <span>⚠️ This action cannot be undone.</span>
            </p>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                id="cancel-delete-account-btn"
                disabled={isDeleting}
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-[#0d0d0d] hover:bg-[#222222] border border-white/10 rounded-xl text-xs font-semibold text-white/80 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-account-btn"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Account</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

