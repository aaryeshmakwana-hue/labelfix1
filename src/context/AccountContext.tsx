import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MeeshoAccount, MessageTemplate } from '../types';
import { DEFAULT_ACCOUNTS, DEFAULT_TEMPLATE } from '../data/defaultAccounts';
import { generateQRCodeDataUrl } from '../utils/qrGenerator';
import {
  STORAGE_KEY,
  LEGACY_ACCOUNTS_KEY,
  LEGACY_ACTIVE_KEY,
  loadStorageData,
  saveAccounts,
  saveActiveAccountId,
  downloadBackupFile,
  validateBackupFile,
  applyBackupImport,
  BackupValidationResult,
} from '../utils/accountStorage';

interface DeleteAccountResult {
  success: boolean;
  newActiveAccount: MeeshoAccount | null;
  message: string;
}

interface AccountContextType {
  accounts: MeeshoAccount[];
  activeAccount: MeeshoAccount | null;
  activeAccountId: string | null;
  selectAccount: (id: string) => void;
  createAccount: (data: Partial<MeeshoAccount>) => Promise<MeeshoAccount>;
  updateAccount: (id: string, data: Partial<MeeshoAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<DeleteAccountResult>;
  updateActiveTemplate: (template: Partial<MessageTemplate>) => void;
  resetActiveTemplate: () => void;
  updateActiveLabelSettings: (settings: Partial<MeeshoAccount['labelSettings']>) => void;
  exportBackup: () => void;
  importBackup: (
    fileContent: string,
    mode: 'merge' | 'replace'
  ) => Promise<{ success: boolean; message: string; count?: number }>;
  loadDemoAccounts: () => void;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info';
  setToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const LOCAL_STORAGE_KEY = STORAGE_KEY;
export const ACTIVE_ACCOUNT_KEY = LEGACY_ACTIVE_KEY;

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved accounts and activeAccountId from versioned local storage (with automatic migration)
  const [accounts, setAccounts] = useState<MeeshoAccount[]>(() => {
    const data = loadStorageData();
    return data.accounts;
  });

  const [activeAccountId, setActiveAccountId] = useState<string | null>(() => {
    const data = loadStorageData();
    return data.activeAccountId;
  });

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const setToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  }, []);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Pre-generate QR preview data URLs for accounts that don't have them
  useEffect(() => {
    let isMounted = true;
    const generateMissingQRs = async () => {
      let changed = false;
      const updatedAccounts = await Promise.all(
        accounts.map(async (acc) => {
          if (!acc.generatedQRCode && acc.storeLink) {
            try {
              const qrUrl = await generateQRCodeDataUrl(acc.storeLink, {
                errorCorrectionLevel: acc.qrSettings?.errorCorrection || 'H',
                margin: 1,
              });
              changed = true;
              return { ...acc, generatedQRCode: qrUrl };
            } catch (err) {
              console.error('Failed to generate QR for account', acc.accountName, err);
            }
          }
          return acc;
        })
      );

      if (changed && isMounted) {
        setAccounts(updatedAccounts);
        saveAccounts(updatedAccounts, activeAccountId);
      }
    };

    if (accounts.length > 0) {
      generateMissingQRs();
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state to versioned local storage whenever accounts or activeAccountId changes
  useEffect(() => {
    saveAccounts(accounts, activeAccountId);
  }, [accounts, activeAccountId]);

  // Active account resolution
  const activeAccount =
    accounts.find((a) => a.id === activeAccountId) ||
    (accounts.length > 0 ? accounts[0] : null);

  // If activeAccountId became invalid or out of sync, reconcile it
  useEffect(() => {
    if (accounts.length === 0) {
      if (activeAccountId !== null) {
        setActiveAccountId(null);
      }
    } else if (activeAccountId === null || !accounts.some((a) => a.id === activeAccountId)) {
      setActiveAccountId(accounts[0].id);
    }
  }, [accounts, activeAccountId]);

  const selectAccount = (id: string) => {
    if (accounts.some((a) => a.id === id)) {
      setActiveAccountId(id);
      saveActiveAccountId(id);
    }
  };

  const createAccount = async (data: Partial<MeeshoAccount>): Promise<MeeshoAccount> => {
    const storeLink = data.storeLink || 'https://meesho.com';
    let qrUrl = '';
    try {
      qrUrl = await generateQRCodeDataUrl(storeLink, {
        errorCorrectionLevel: 'H',
        margin: 1,
      });
    } catch (e) {
      console.warn('Error generating QR for new account:', e);
    }

    const newAccount: MeeshoAccount = {
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      accountName: data.accountName || 'New Meesho Account',
      storeLink,
      generatedQRCode: qrUrl,
      qrSettings: {
        size: 256,
        errorCorrection: 'H',
        margin: 1,
        ...data.qrSettings,
      },
      messageTemplate: {
        ...DEFAULT_TEMPLATE,
        ...data.messageTemplate,
        id: `tmpl-${Date.now()}`,
      },
      labelSettings: {
        outputWidth: 288,
        outputHeight: 432,
        bottomMargin: 8,
        maxQRSize: 72,
        minimumFontSize: 5.5,
        thermalOptimization: true,
        enableEmojis: true,
        ...data.labelSettings,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newAccounts = [...accounts, newAccount];
    saveAccounts(newAccounts, newAccount.id);

    setAccounts(newAccounts);
    setActiveAccountId(newAccount.id);
    setToast(`Account "${newAccount.accountName}" saved to local storage.`, 'success');
    return newAccount;
  };

  const updateAccount = async (id: string, data: Partial<MeeshoAccount>) => {
    let newQR = data.generatedQRCode;
    if (data.storeLink && !data.generatedQRCode) {
      try {
        newQR = await generateQRCodeDataUrl(data.storeLink, {
          errorCorrectionLevel: data.qrSettings?.errorCorrection || 'H',
          margin: 1,
        });
      } catch (e) {
        console.warn('Error regenerating QR for updated link:', e);
      }
    }

    const updated = accounts.map((acc) => {
      if (acc.id === id) {
        return {
          ...acc,
          ...data,
          generatedQRCode: newQR !== undefined ? newQR : acc.generatedQRCode,
          updatedAt: new Date().toISOString(),
        };
      }
      return acc;
    });

    saveAccounts(updated, activeAccountId);
    setAccounts(updated);
    setToast('Account settings updated successfully in local storage.', 'success');
  };

  /**
   * Authoritative Account Deletion Implementation
   * Removes exclusively by unique Account ID (never by index, name, or URL)
   * Handles persistent storage, active-account reassignment, and empty states immediately.
   */
  const deleteAccount = async (id: string): Promise<DeleteAccountResult> => {
    try {
      const targetAccount = accounts.find((a) => a.id === id);
      if (!targetAccount) {
        const notFoundMsg = 'Account not found or already deleted.';
        setToast(notFoundMsg, 'error');
        return {
          success: false,
          newActiveAccount: activeAccount,
          message: notFoundMsg,
        };
      }

      const targetIndex = accounts.findIndex((a) => a.id === id);
      const remainingAccounts = accounts.filter((a) => a.id !== id);

      let newActiveId: string | null = null;
      let newActive: MeeshoAccount | null = null;

      if (remainingAccounts.length > 0) {
        if (activeAccountId === id) {
          // Select neighboring account (or fallback to first available)
          const nextIndex = Math.min(targetIndex, remainingAccounts.length - 1);
          newActive = remainingAccounts[nextIndex] || remainingAccounts[0];
          newActiveId = newActive.id;
        } else {
          newActiveId = activeAccountId;
          newActive = remainingAccounts.find((a) => a.id === activeAccountId) || remainingAccounts[0];
        }
      } else {
        newActiveId = null;
        newActive = null;
      }

      // Atomically persist to versioned local storage
      saveAccounts(remainingAccounts, newActiveId);

      // Update application state
      setAccounts(remainingAccounts);
      setActiveAccountId(newActiveId);

      const successMsg = newActive
        ? `Account deleted. Switched to ${newActive.accountName}.`
        : 'Account deleted successfully from local storage.';

      setToast(successMsg, 'success');

      return {
        success: true,
        newActiveAccount: newActive,
        message: successMsg,
      };
    } catch (err: any) {
      console.error('Error during account deletion execution:', err);
      const errMsg = 'Unable to delete account. Please try again.';
      setToast(errMsg, 'error');
      return {
        success: false,
        newActiveAccount: activeAccount,
        message: errMsg,
      };
    }
  };

  const updateActiveTemplate = (template: Partial<MessageTemplate>) => {
    if (!activeAccountId) return;
    const updated = accounts.map((acc) => {
      if (acc.id === activeAccountId) {
        return {
          ...acc,
          messageTemplate: {
            ...acc.messageTemplate,
            ...template,
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return acc;
    });

    saveAccounts(updated, activeAccountId);
    setAccounts(updated);
  };

  const resetActiveTemplate = () => {
    updateActiveTemplate(DEFAULT_TEMPLATE);
  };

  const updateActiveLabelSettings = (settings: Partial<MeeshoAccount['labelSettings']>) => {
    if (!activeAccountId) return;
    const updated = accounts.map((acc) => {
      if (acc.id === activeAccountId) {
        return {
          ...acc,
          labelSettings: {
            ...acc.labelSettings,
            ...settings,
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return acc;
    });

    saveAccounts(updated, activeAccountId);
    setAccounts(updated);
  };

  /**
   * Export all non-sensitive account configurations as JSON
   */
  const exportBackup = () => {
    downloadBackupFile(accounts, activeAccountId);
    setToast('Accounts backup file exported successfully.', 'success');
  };

  /**
   * Import and restore accounts from JSON backup file
   */
  const importBackup = async (
    fileContent: string,
    mode: 'merge' | 'replace'
  ): Promise<{ success: boolean; message: string; count?: number }> => {
    const validation = validateBackupFile(fileContent);
    if (!validation.valid || !validation.accounts) {
      const errorMsg = validation.error || 'Invalid backup file.';
      setToast(errorMsg, 'error');
      return { success: false, message: errorMsg };
    }

    const result = applyBackupImport(
      validation.accounts,
      validation.activeAccountId || null,
      accounts,
      mode
    );

    setAccounts(result.accounts);
    setActiveAccountId(result.activeAccountId);

    const successMsg =
      mode === 'replace'
        ? `Successfully restored ${result.accounts.length} account(s) from backup.`
        : `Successfully merged backup (Total: ${result.accounts.length} accounts).`;

    setToast(successMsg, 'success');
    return { success: true, message: successMsg, count: result.accounts.length };
  };

  /**
   * Helper to load standard demo accounts (useful for quick start / testing)
   */
  const loadDemoAccounts = () => {
    saveAccounts(DEFAULT_ACCOUNTS, DEFAULT_ACCOUNTS[0].id);
    setAccounts(DEFAULT_ACCOUNTS);
    setActiveAccountId(DEFAULT_ACCOUNTS[0].id);
    setToast('Demo Meesho store accounts loaded into local storage.', 'info');
  };

  return (
    <AccountContext.Provider
      value={{
        accounts,
        activeAccount,
        activeAccountId,
        selectAccount,
        createAccount,
        updateAccount,
        deleteAccount,
        updateActiveTemplate,
        resetActiveTemplate,
        updateActiveLabelSettings,
        exportBackup,
        importBackup,
        loadDemoAccounts,
        toastMessage,
        toastType,
        setToast,
        clearToast,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccounts = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccounts must be used within an AccountProvider');
  }
  return context;
};

