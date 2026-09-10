import React, { useState, useRef } from 'react';
import { useAccounts } from '../context/AccountContext';
import { validateBackupFile } from '../utils/accountStorage';
import {
  X,
  Settings,
  Printer,
  Shield,
  CheckCircle2,
  Lock,
  Download,
  Upload,
  Database,
  AlertCircle,
  HardDrive,
  RefreshCw,
  FolderSync,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    accounts,
    activeAccount,
    updateActiveLabelSettings,
    exportBackup,
    importBackup,
    loadDemoAccounts,
  } = useAccounts();

  const [activeTab, setActiveTab] = useState<'print' | 'backup'>('print');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import state
  const [importPendingFile, setImportPendingFile] = useState<{
    content: string;
    accountCount: number;
    fileName: string;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  const settings = activeAccount?.labelSettings;

  if (!isOpen) return null;

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const validation = validateBackupFile(text);
        if (!validation.valid || !validation.accounts) {
          setImportError(validation.error || 'Invalid backup file.');
          setImportPendingFile(null);
        } else {
          setImportPendingFile({
            content: text,
            accountCount: validation.accounts.length,
            fileName: file.name,
          });
          setImportError(null);
        }
      } catch (err) {
        setImportError('Invalid backup file.');
        setImportPendingFile(null);
      }
    };
    reader.onerror = () => {
      setImportError('Invalid backup file: Unable to read file.');
      setImportPendingFile(null);
    };
    reader.readAsText(file);

    // Reset input value so same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecuteImport = async (mode: 'merge' | 'replace') => {
    if (!importPendingFile || isProcessingImport) return;
    setIsProcessingImport(true);
    try {
      const res = await importBackup(importPendingFile.content, mode);
      if (res.success) {
        setImportPendingFile(null);
        setImportError(null);
      } else {
        setImportError(res.message);
      }
    } catch (err) {
      setImportError('Failed to import backup file.');
    } finally {
      setIsProcessingImport(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#141414] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#d1d1d1]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d0d0d] border-b border-white/5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#c9a57b]/15 text-[#c9a57b] flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Settings & Local Storage</h3>
              <p className="text-xs text-white/40">
                {activeAccount ? (
                  <>
                    Active for: <strong className="text-[#c9a57b]">{activeAccount.accountName}</strong>
                  </>
                ) : (
                  <span className="text-amber-400/80">No active account loaded</span>
                )}
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

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 bg-[#0a0a0a] px-6 pt-2">
          <button
            onClick={() => setActiveTab('print')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'print'
                ? 'border-[#c9a57b] text-[#c9a57b]'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print & Thermal</span>
          </button>

          <button
            id="tab-backup-restore"
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'backup'
                ? 'border-[#c9a57b] text-[#c9a57b]'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Backup & Restore</span>
          </button>
        </div>

        {/* Tab 1: Print & Thermal Settings */}
        {activeTab === 'print' && (
          <div className="p-6 space-y-5 text-xs text-[#d1d1d1]">
            {settings ? (
              <>
                {/* Output Size */}
                <div className="bg-[#0d0d0d] border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block text-sm">
                      Output Page Format
                    </span>
                    <p className="text-white/40 mt-0.5">
                      Standard 4 × 6 inches (288 × 432 PostScript points)
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-[#c9a57b]/15 text-[#c9a57b] border border-[#c9a57b]/20 rounded-lg font-bold">
                    4×6" Thermal Standard
                  </span>
                </div>

                {/* Thermal Optimization */}
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <span className="font-semibold text-white block">
                      Thermal Print High Contrast Optimization
                    </span>
                    <p className="text-white/40 mt-0.5">
                      Enforces sharp black vector rendering, clean edges, and zero blurry antialiasing.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.thermalOptimization}
                      onChange={(e) =>
                        updateActiveLabelSettings({ thermalOptimization: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c9a57b]"></div>
                  </label>
                </div>

                {/* Bottom Margin & Placement Offset */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-white block mb-1">
                      Bottom Margin (pt)
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="24"
                      value={settings.bottomMargin}
                      onChange={(e) =>
                        updateActiveLabelSettings({ bottomMargin: Number(e.target.value) || 8 })
                      }
                      className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:border-[#c9a57b]"
                    />
                    <p className="text-[10px] text-white/40 mt-1">Standard: 8 pt</p>
                  </div>

                  <div>
                    <label className="font-bold text-white block mb-1">
                      Lower Position Offset (pt)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={settings.overlayOffsetTop ?? 0}
                      onChange={(e) =>
                        updateActiveLabelSettings({ overlayOffsetTop: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:border-[#c9a57b]"
                    />
                    <p className="text-[10px] text-emerald-400/80 mt-1">Fine-tune lower zone</p>
                  </div>

                  <div>
                    <label className="font-bold text-white block mb-1">
                      Max QR Size (pt)
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="90"
                      value={settings.maxQRSize}
                      onChange={(e) =>
                        updateActiveLabelSettings({ maxQRSize: Number(e.target.value) || 72 })
                      }
                      className="w-full px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-xl text-white font-semibold focus:outline-none focus:border-[#c9a57b]"
                    />
                    <p className="text-[10px] text-white/40 mt-1">Auto-scales if compact</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-white/40 space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400/80 mx-auto" />
                <p className="text-sm text-white/80 font-medium">No active Meesho account selected.</p>
                <p className="text-xs text-white/40">
                  Switch to the "Backup & Restore" tab to import your accounts or add a new account.
                </p>
              </div>
            )}

            {/* Privacy & Offline Mode */}
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start space-x-2.5 text-emerald-400">
              <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-white/80">
                <strong className="text-emerald-400">100% Local & Offline Processing:</strong> All PDF parsing, invoice detection,
                white space calculation, and output generation run locally in your browser memory.
                No customer names, addresses, or order details are ever sent to any server.
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-white/5">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-[#c9a57b] hover:bg-[#d9b58b] text-black rounded-xl font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Backup & Restore (Local Account Storage) */}
        {activeTab === 'backup' && (
          <div className="p-6 space-y-5 text-xs text-[#d1d1d1]">
            {/* Storage Status Card */}
            <div className="bg-[#0d0d0d] border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white">
                  <Database className="w-4 h-4 text-[#c9a57b]" />
                  <span className="font-semibold text-sm">Browser Local Storage</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-[10px]">
                  Version 1.0 (No Database)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
                <div>
                  <span className="text-white/40 block">Saved Stores:</span>
                  <span className="text-white font-medium">{accounts.length} Account{accounts.length === 1 ? '' : 's'}</span>
                </div>
                <div>
                  <span className="text-white/40 block">Active Store:</span>
                  <span className="text-[#c9a57b] font-medium truncate block">
                    {activeAccount ? activeAccount.accountName : 'None'}
                  </span>
                </div>
              </div>
            </div>

            {/* Error banner if invalid backup */}
            {importError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Import Error:</strong>
                  <span>{importError}</span>
                </div>
              </div>
            )}

            {/* Pending Import Confirmation Dialog */}
            {importPendingFile && (
              <div className="p-4 bg-[#c9a57b]/10 border border-[#c9a57b]/30 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 text-[#c9a57b]">
                  <FolderSync className="w-4 h-4" />
                  <span className="font-bold text-sm">Restore Accounts from Backup</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Verified file: <strong>{importPendingFile.fileName}</strong> ({importPendingFile.accountCount} store account{importPendingFile.accountCount === 1 ? '' : 's'} found).
                  How would you like to restore?
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleExecuteImport('merge')}
                    disabled={isProcessingImport}
                    className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#262626] border border-white/10 rounded-xl text-white font-semibold text-xs text-center transition-all cursor-pointer"
                  >
                    Merge with Existing
                    <span className="block text-[10px] text-white/40 font-normal">Keep current stores</span>
                  </button>

                  <button
                    onClick={() => handleExecuteImport('replace')}
                    disabled={isProcessingImport}
                    className="px-3 py-2 bg-[#c9a57b] hover:bg-[#d9b58b] text-black font-bold rounded-xl text-xs text-center transition-all cursor-pointer"
                  >
                    Replace All
                    <span className="block text-[10px] text-black/60 font-medium">Overwrite list</span>
                  </button>
                </div>

                <div className="text-right">
                  <button
                    onClick={() => {
                      setImportPendingFile(null);
                      setImportError(null);
                    }}
                    className="text-[11px] text-white/40 hover:text-white underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Backup & Restore Action Buttons */}
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-white block mb-1">Export Accounts (Backup)</span>
                <p className="text-white/40 text-[11px] mb-2 leading-relaxed">
                  Download all your Meesho store accounts, promotional templates, and QR configurations as a clean JSON backup file. No passwords or sensitive secrets are stored.
                </p>
                <button
                  id="export-accounts-btn"
                  onClick={exportBackup}
                  disabled={accounts.length === 0}
                  className="w-full py-2.5 px-4 bg-[#0d0d0d] hover:bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#c9a57b]" />
                  <span>Export Accounts (meesho-label-pro-backup.json)</span>
                </button>
              </div>

              <div className="pt-2 border-t border-white/5">
                <span className="font-semibold text-white block mb-1">Import Backup</span>
                <p className="text-white/40 text-[11px] mb-2 leading-relaxed">
                  Restore previously saved accounts from a backup JSON file on another device or browser.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelected}
                  className="hidden"
                  id="import-backup-file-input"
                />
                <button
                  id="import-backup-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-[#c9a57b]/15 hover:bg-[#c9a57b]/25 border border-[#c9a57b]/30 rounded-xl text-[#c9a57b] font-semibold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Select Backup File to Restore</span>
                </button>
              </div>

              {accounts.length === 0 && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[11px] text-white/40 block mb-1.5">First-time testing?</span>
                  <button
                    onClick={loadDemoAccounts}
                    className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#c9a57b]" />
                    <span>Load Sample Store Account</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-white/5">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-[#c9a57b] hover:bg-[#d9b58b] text-black rounded-xl font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
