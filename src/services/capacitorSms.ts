// Share Intent Service — receives M-Pesa SMS shared from the SMS app
// NO SMS permissions required — uses Android Share Intent

import { Capacitor } from '@capacitor/core';
import { SendIntent } from '@supernotes/capacitor-send-intent';
import { Transaction } from '@/types';
import { parseMpesaSms } from './smsReader';

export const shareIntentService = {
  isNative(): boolean {
    return Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios';
  },

  /**
   * Check if the app was opened via a share intent and return the shared text.
   * Call this on app startup and when app resumes.
   */
  async checkForSharedText(): Promise<string | null> {
    if (!this.isNative()) return null;

    try {
      const result = await SendIntent.checkSendIntentReceived();
      if (result && result.title) {
        return result.title;
      }
      if (result && result.description) {
        return result.description;
      }
      if (result && result.url) {
        return result.url;
      }
      return null;
    } catch (err) {
      console.log('[ShareIntent] No shared content:', err);
      return null;
    }
  },

  /**
   * Parse shared text as an M-Pesa message.
   * Returns a partial transaction (without category) or null if not M-Pesa.
   */
  parseSharedMessage(text: string): Omit<Transaction, 'category'> | null {
    // Check if it contains M-Pesa keywords
    const mpesaKeywords = ['M-PESA', 'MPESA', 'Ksh', 'sent', 'received', 'paid', 'withdrawn', 'deposited'];
    const hasKeyword = mpesaKeywords.some(kw => text.toUpperCase().includes(kw.toUpperCase()));

    if (!hasKeyword) return null;

    const parsed = parseMpesaSms(text);
    if (!parsed || !parsed.amount) return null;

    // Try to extract M-Pesa transaction ID (e.g., "SJ12ABC456")
    const refMatch = text.match(/\b([A-Z0-9]{10})\b/);
    const reference = parsed.reference || (refMatch ? refMatch[1] : undefined);

    // Try to extract date from SMS
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
    let date = parsed.date || new Date().toISOString();
    if (dateMatch) {
      try {
        const parsedDate = new Date(dateMatch[1]);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString();
        }
      } catch { /* use default */ }
    }

    return {
      id: `share_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      amount: parsed.amount,
      type: parsed.type ?? 'sent',
      name: parsed.name ?? 'Unknown',
      date,
      reference,
    };
  },

  /**
   * Check if a transaction is a duplicate of an existing one.
   */
  isDuplicate(tx: Omit<Transaction, 'category'>): boolean {
    const existing = localStorage.getItem('pesaguard_transactions');
    if (!existing) return false;

    const txns: Transaction[] = JSON.parse(existing);
    return txns.some(t =>
      t.reference === tx.reference ||
      (t.amount === tx.amount && t.name === tx.name && Math.abs(new Date(t.date).getTime() - new Date(tx.date).getTime()) < 60000)
    );
  },
};

// Keep backward-compatible export name for existing imports
export const smsService = {
  isAvailable: () => shareIntentService.isNative(),
  checkPermission: async () => true, // No permissions needed
  requestPermission: async () => true, // No permissions needed
  openSettings: async () => {},
  importExistingMessages: async () => 0, // Not applicable
  startPolling: () => null, // Not applicable
};
