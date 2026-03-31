// Capacitor SMS Reader Service — uses capacitor-sms-inbox plugin
// Reads real M-Pesa SMS from Android device inbox

import { Capacitor } from '@capacitor/core';
import { Transaction } from '@/types';
import { parseMpesaSms, isMpesaMessage } from './smsReader';

// capacitor-sms-inbox plugin — only works on native Android
let SmsInbox: any = null;

async function loadPlugin() {
  if (SmsInbox) return SmsInbox;
  if (Capacitor.getPlatform() !== 'android') return null;
  try {
    const mod = await import('capacitor-sms-inbox');
    SmsInbox = mod.SmsInbox || mod.default || mod;
    return SmsInbox;
  } catch (err) {
    console.warn('[SMS] capacitor-sms-inbox plugin not available:', err);
    return null;
  }
}

export const smsService = {
  /** Check if running on native Android */
  isAvailable(): boolean {
    return Capacitor.getPlatform() === 'android';
  },

  /** Check current SMS permission status */
  async checkPermission(): Promise<boolean> {
    const plugin = await loadPlugin();
    if (!plugin?.checkPermissions) return false;
    try {
      const status = await plugin.checkPermissions();
      return status?.sms === 'granted' || status?.receive === 'granted';
    } catch (err) {
      console.error('[SMS] Permission check failed:', err);
      return false;
    }
  },

  /** Request Android READ_SMS + RECEIVE_SMS permission */
  async requestPermission(): Promise<boolean> {
    const plugin = await loadPlugin();
    if (!plugin) {
      console.log('[SMS] Not on native Android — SMS unavailable');
      return false;
    }

    try {
      // Check if already granted
      if (plugin.checkPermissions) {
        const current = await plugin.checkPermissions();
        if (current?.sms === 'granted') return true;
      }

      // Request permission — triggers Android system dialog
      const result = await plugin.requestPermissions();
      console.log('[SMS] Permission result:', result);
      return result?.sms === 'granted' || result?.receive === 'granted';
    } catch (err) {
      console.error('[SMS] Permission request failed:', err);
      return false;
    }
  },

  /** Read existing M-Pesa messages from device inbox and auto-save with parsed category */
  async importExistingMessages(limit = 500): Promise<number> {
    const plugin = await loadPlugin();
    if (!plugin) return 0;

    try {
      // Use getSMSList from capacitor-sms-inbox
      const result = await plugin.getSMSList({
        filter: {
          address: 'MPESA',
          maxCount: limit,
        },
      });

      const messages = result?.smsList || result?.messages || [];
      let imported = 0;

      for (const msg of messages) {
        const address = msg.address || msg.creator || '';
        const body = msg.body || '';
        if (!body || !isMpesaMessage(address, body)) continue;

        const parsed = parseMpesaSms(body);
        if (!parsed) continue;

        const msgDate = msg.date ? new Date(Number(msg.date)) : new Date();
        const txId = `sms_${msg.date || Date.now()}_${imported}`;

        const tx: Transaction = {
          id: txId,
          amount: parsed.amount ?? 0,
          type: parsed.type ?? 'sent',
          category: parsed.category ?? 'Other',
          name: parsed.name ?? 'Unknown',
          date: msgDate.toISOString(),
          reference: parsed.reference,
        };

        // Check if already imported
        const existing = localStorage.getItem('pesaguard_transactions');
        const txns: Transaction[] = existing ? JSON.parse(existing) : [];
        const isDuplicate = txns.some(t =>
          t.id === tx.id ||
          (t.amount === tx.amount && t.name === tx.name && t.date === tx.date)
        );

        if (!isDuplicate) {
          txns.unshift(tx);
          localStorage.setItem('pesaguard_transactions', JSON.stringify(txns));
          imported++;
        }
      }

      console.log(`[SMS] Imported ${imported} M-Pesa transactions from inbox`);
      return imported;
    } catch (err) {
      console.error('[SMS] Import failed:', err);
      return 0;
    }
  },

  /** Poll for new SMS periodically (since capacitor-sms-inbox doesn't have a listener).
   *  Returns cleanup function. Shows popup for user to categorize. */
  startPolling(onTransaction: (tx: Omit<Transaction, 'category'>) => void, intervalMs = 15000): (() => void) | null {
    if (!this.isAvailable()) return null;

    let lastCheckedTimestamp = Date.now();

    const poll = async () => {
      const plugin = await loadPlugin();
      if (!plugin) return;

      try {
        const result = await plugin.getSMSList({
          filter: {
            address: 'MPESA',
            minDate: lastCheckedTimestamp.toString(),
            maxCount: 10,
          },
        });

        const messages = result?.smsList || result?.messages || [];

        for (const msg of messages) {
          const body = msg.body || '';
          const address = msg.address || '';
          const msgTime = msg.date ? Number(msg.date) : Date.now();

          if (msgTime <= lastCheckedTimestamp) continue;
          if (!isMpesaMessage(address, body)) continue;

          const parsed = parseMpesaSms(body);
          if (!parsed) continue;

          const tx: Omit<Transaction, 'category'> = {
            id: `sms_${msgTime}`,
            amount: parsed.amount ?? 0,
            type: parsed.type ?? 'sent',
            name: parsed.name ?? 'Unknown',
            date: new Date(msgTime).toISOString(),
            reference: parsed.reference,
          };

          console.log('[SMS] New M-Pesa transaction:', tx.name, tx.amount);
          onTransaction(tx);
        }

        if (messages.length > 0) {
          const maxTime = Math.max(...messages.map((m: any) => Number(m.date) || 0));
          if (maxTime > lastCheckedTimestamp) lastCheckedTimestamp = maxTime;
        }
      } catch (err) {
        console.error('[SMS] Poll failed:', err);
      }
    };

    const timer = setInterval(poll, intervalMs);
    // Run first poll immediately
    poll();

    return () => clearInterval(timer);
  },
};
