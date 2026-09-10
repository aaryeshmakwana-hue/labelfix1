/**
 * Local Account Storage & Auto-Restore System for Meesho Label Pro
 * 
 * Provides versioned browser-local persistence for Meesho accounts without
 * any external database.
 * 
 * Storage Key: 'meeshoLabelPro'
 * Structure: { version: 1, accounts: [...], activeAccountId: string | null }
 */

import { MeeshoAccount } from '../types';
import { DEFAULT_TEMPLATE } from '../data/defaultAccounts';

export const STORAGE_KEY = 'meeshoLabelPro';
export const STORAGE_VERSION = 1;

// Legacy keys for seamless zero-data-loss migration
export const LEGACY_ACCOUNTS_KEY = 'meesho_label_pro_accounts_v1';
export const LEGACY_ACTIVE_KEY = 'meesho_label_pro_active_acc_v1';

export interface StoredStorageData {
  version: number;
  accounts: MeeshoAccount[];
  activeAccountId: string | null;
}

export interface AccountBackupFile {
  app: 'meesho-label-pro';
  version: number;
  exportedAt: string;
  activeAccountId: string | null;
  accounts: MeeshoAccount[];
}

export interface BackupValidationResult {
  valid: boolean;
  error?: string;
  accounts?: MeeshoAccount[];
  activeAccountId?: string | null;
}

/**
 * Validates and sanitizes an account object to guarantee required fields exist
 * and strips any sensitive secrets, passwords, or invalid properties.
 */
export function sanitizeAccount(raw: any): MeeshoAccount | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const accountName = typeof raw.accountName === 'string' && raw.accountName.trim() ? raw.accountName.trim() : 'Meesho Store';
  const storeLink = typeof raw.storeLink === 'string' && raw.storeLink.trim() ? raw.storeLink.trim() : 'https://meesho.com';

  const qrSettings = {
    size: typeof raw.qrSettings?.size === 'number' ? raw.qrSettings.size : 256,
    errorCorrection: ['L', 'M', 'Q', 'H'].includes(raw.qrSettings?.errorCorrection)
      ? raw.qrSettings.errorCorrection
      : ('H' as const),
    margin: typeof raw.qrSettings?.margin === 'number' ? raw.qrSettings.margin : 1,
  };

  const messageTemplate = {
    ...DEFAULT_TEMPLATE,
    ...(typeof raw.messageTemplate === 'object' ? raw.messageTemplate : {}),
    id: typeof raw.messageTemplate?.id === 'string' ? raw.messageTemplate.id : `tmpl-${Date.now()}`,
    heading: typeof raw.messageTemplate?.heading === 'string' ? raw.messageTemplate.heading : DEFAULT_TEMPLATE.heading,
    reviewMessage: typeof raw.messageTemplate?.reviewMessage === 'string' ? raw.messageTemplate.reviewMessage : DEFAULT_TEMPLATE.reviewMessage,
    storeCTA: typeof raw.messageTemplate?.storeCTA === 'string' ? raw.messageTemplate.storeCTA : DEFAULT_TEMPLATE.storeCTA,
    subCTA: typeof raw.messageTemplate?.subCTA === 'string' ? raw.messageTemplate.subCTA : DEFAULT_TEMPLATE.subCTA,
    footer: typeof raw.messageTemplate?.footer === 'string' ? raw.messageTemplate.footer : DEFAULT_TEMPLATE.footer,
    enableEmojis: typeof raw.messageTemplate?.enableEmojis === 'boolean' ? raw.messageTemplate.enableEmojis : true,
  };

  const labelSettings = {
    outputWidth: 288,
    outputHeight: 432,
    bottomMargin: typeof raw.labelSettings?.bottomMargin === 'number' ? raw.labelSettings.bottomMargin : 8,
    overlayOffsetTop: typeof raw.labelSettings?.overlayOffsetTop === 'number' ? raw.labelSettings.overlayOffsetTop : 0,
    maxQRSize: typeof raw.labelSettings?.maxQRSize === 'number' ? raw.labelSettings.maxQRSize : 72,
    minimumFontSize: typeof raw.labelSettings?.minimumFontSize === 'number' ? raw.labelSettings.minimumFontSize : 5.5,
    thermalOptimization: typeof raw.labelSettings?.thermalOptimization === 'boolean' ? raw.labelSettings.thermalOptimization : true,
    enableEmojis: typeof raw.labelSettings?.enableEmojis === 'boolean' ? raw.labelSettings.enableEmojis : true,
  };

  return {
    id,
    accountName,
    storeLink,
    generatedQRCode: typeof raw.generatedQRCode === 'string' ? raw.generatedQRCode : undefined,
    qrSettings,
    messageTemplate,
    labelSettings,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

/**
 * Loads and validates account state from browser localStorage.
 * Handles migration from legacy keys if primary versioned key is absent.
 */
export function loadStorageData(): StoredStorageData {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { version: STORAGE_VERSION, accounts: [], activeAccountId: null };
  }

  try {
    // 1. Try loading primary versioned storage key
    const rawData = window.localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (parsed && typeof parsed === 'object') {
        const rawAccounts = Array.isArray(parsed.accounts) ? parsed.accounts : [];
        const accounts: MeeshoAccount[] = [];

        for (const item of rawAccounts) {
          const sanitized = sanitizeAccount(item);
          if (sanitized) accounts.push(sanitized);
        }

        let activeAccountId: string | null = null;
        if (
          typeof parsed.activeAccountId === 'string' &&
          accounts.some((a) => a.id === parsed.activeAccountId)
        ) {
          activeAccountId = parsed.activeAccountId;
        } else if (accounts.length > 0) {
          activeAccountId = accounts[0].id;
        }

        return {
          version: typeof parsed.version === 'number' ? parsed.version : STORAGE_VERSION,
          accounts,
          activeAccountId,
        };
      }
    }

    // 2. Migration fallback: check legacy keys
    const legacyAccountsRaw = window.localStorage.getItem(LEGACY_ACCOUNTS_KEY);
    if (legacyAccountsRaw) {
      const legacyList = JSON.parse(legacyAccountsRaw);
      if (Array.isArray(legacyList) && legacyList.length > 0) {
        const accounts: MeeshoAccount[] = [];
        for (const item of legacyList) {
          const sanitized = sanitizeAccount(item);
          if (sanitized) accounts.push(sanitized);
        }

        const legacyActive = window.localStorage.getItem(LEGACY_ACTIVE_KEY);
        let activeAccountId: string | null = null;
        if (legacyActive && accounts.some((a) => a.id === legacyActive)) {
          activeAccountId = legacyActive;
        } else if (accounts.length > 0) {
          activeAccountId = accounts[0].id;
        }

        const migratedData: StoredStorageData = {
          version: STORAGE_VERSION,
          accounts,
          activeAccountId,
        };

        // Persist to new versioned key immediately
        saveStorageData(migratedData);
        return migratedData;
      }
    }
  } catch (err) {
    console.warn('[accountStorage] Failed to read or parse storage, falling back gracefully:', err);
  }

  // First visit / clean state
  return {
    version: STORAGE_VERSION,
    accounts: [],
    activeAccountId: null,
  };
}

/**
 * Persists the entire account storage state to localStorage atomically under 'meeshoLabelPro'
 */
export function saveStorageData(data: StoredStorageData): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const payload: StoredStorageData = {
      version: STORAGE_VERSION,
      accounts: data.accounts,
      activeAccountId: data.activeAccountId,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('[accountStorage] Failed to save storage data:', err);
  }
}

/**
 * Updates accounts and reconciles activeAccountId
 */
export function saveAccounts(accounts: MeeshoAccount[], activeAccountId: string | null): void {
  let reconciledActive = activeAccountId;
  if (accounts.length === 0) {
    reconciledActive = null;
  } else if (!reconciledActive || !accounts.some((a) => a.id === reconciledActive)) {
    reconciledActive = accounts[0].id;
  }

  saveStorageData({
    version: STORAGE_VERSION,
    accounts,
    activeAccountId: reconciledActive,
  });
}

/**
 * Updates activeAccountId only
 */
export function saveActiveAccountId(activeAccountId: string | null): void {
  const current = loadStorageData();
  current.activeAccountId = activeAccountId;
  saveStorageData(current);
}

/**
 * Generates an exportable, non-sensitive JSON backup string
 */
export function generateBackupJson(accounts: MeeshoAccount[], activeAccountId: string | null): string {
  const backup: AccountBackupFile = {
    app: 'meesho-label-pro',
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    activeAccountId,
    accounts: accounts.map((acc) => ({
      id: acc.id,
      accountName: acc.accountName,
      storeLink: acc.storeLink,
      generatedQRCode: acc.generatedQRCode,
      qrSettings: acc.qrSettings,
      messageTemplate: acc.messageTemplate,
      labelSettings: acc.labelSettings,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt,
    })),
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Triggers browser download of meesho-label-pro-backup.json
 */
export function downloadBackupFile(accounts: MeeshoAccount[], activeAccountId: string | null): void {
  const jsonString = generateBackupJson(accounts, activeAccountId);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `meesho-label-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates uploaded backup JSON file content
 */
export function validateBackupFile(fileContent: string): BackupValidationResult {
  if (!fileContent || typeof fileContent !== 'string') {
    return { valid: false, error: 'Invalid backup file: Empty file content.' };
  }

  try {
    const parsed = JSON.parse(fileContent);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Invalid backup file: Root must be an object.' };
    }

    const rawAccounts = Array.isArray(parsed.accounts) ? parsed.accounts : null;
    if (!rawAccounts || rawAccounts.length === 0) {
      return { valid: false, error: 'Invalid backup file: No accounts found in file.' };
    }

    const validAccounts: MeeshoAccount[] = [];
    for (const item of rawAccounts) {
      const sanitized = sanitizeAccount(item);
      if (sanitized) validAccounts.push(sanitized);
    }

    if (validAccounts.length === 0) {
      return { valid: false, error: 'Invalid backup file: Contains no valid Meesho account records.' };
    }

    const activeAccountId =
      typeof parsed.activeAccountId === 'string' &&
      validAccounts.some((a) => a.id === parsed.activeAccountId)
        ? parsed.activeAccountId
        : validAccounts[0].id;

    return {
      valid: true,
      accounts: validAccounts,
      activeAccountId,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Invalid backup file: Malformed JSON syntax (${err?.message || 'parse error'}).`,
    };
  }
}

/**
 * Applies imported backup accounts either by merging or replacing
 */
export function applyBackupImport(
  importedAccounts: MeeshoAccount[],
  importedActiveId: string | null,
  currentAccounts: MeeshoAccount[],
  mode: 'merge' | 'replace'
): { accounts: MeeshoAccount[]; activeAccountId: string | null } {
  let finalAccounts: MeeshoAccount[] = [];
  let finalActiveId: string | null = null;

  if (mode === 'replace') {
    finalAccounts = [...importedAccounts];
    finalActiveId = importedActiveId || (finalAccounts.length > 0 ? finalAccounts[0].id : null);
  } else {
    // Merge mode: retain current, update matching ID or append new accounts
    const accountMap = new Map<string, MeeshoAccount>();
    for (const cur of currentAccounts) {
      accountMap.set(cur.id, cur);
    }
    for (const imp of importedAccounts) {
      accountMap.set(imp.id, imp);
    }
    finalAccounts = Array.from(accountMap.values());
    finalActiveId = importedActiveId && finalAccounts.some((a) => a.id === importedActiveId)
      ? importedActiveId
      : currentAccounts[0]?.id || finalAccounts[0]?.id || null;
  }

  saveAccounts(finalAccounts, finalActiveId);
  return { accounts: finalAccounts, activeAccountId: finalActiveId };
}
