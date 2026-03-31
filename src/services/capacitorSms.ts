// Capacitor SMS Reader Service — uses capacitor-sms-inbox plugin
// Reads real M-Pesa SMS from Android device inbox

import { Capacitor } from '@capacitor/core';
import { Transaction } from '@/types';
import { parseMpesaSms, isMpesaMessage } from './smsReader';
import { SMSInboxReader, type SMSFilter, MessageType } from 'capacitor-sms-inbox';

export const smsService = {
  /** Check if running on native Android */
  isAvailable(): boolean {
    return Capacitor.getPlatform() === 'android';
  },

  /** Check current SMS permission status */
  async checkPermission(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const status = await SMSInboxReader.checkPermissions();
      return status.sms === 'granted';
    } catch (err) {
      console.error('[SMS] Permission check failed:', err);
      return false;
    }
  },

  /** Request Android READ_SMS permission — triggers system dialog */
  async requestPermission(): Promise<boolean> {
    if (!this.isAvailable()) {
      console.log('[SMS] Not on native Android — SMS unavailable');
      return false;
    }

    try {
      const current = await SMSInboxReader.checkPermissions();
      if (current.sms === 'granted') return true;

      const result = await SMSInboxReader.requestPermissions();
      console.log('[SMS] Permission result:', result);
      return result.sms === 'granted';
    } catch (err) {
      console.error('[SMS] Permission request failed:', err);
      return false;
    }
  },

  /** Read existing M-Pesa messages from device inbox and auto-save with parsed category */
  async importExistingMessages(limit = 500): Promise<number> {
    if (!this.isAvailable()) return 0;

    try {
      const filter: SMSFilter = {
        type: MessageType.INBOX,
        address: 'MPESA',
        maxCount: limit,
      };

      const result = await SMSInboxReader.getSMSList({ filter });
      const messages = result.smsList || [];
      let imported = 0;

      for (const msg of messages) {
        const body = msg.body || '';
        const address = msg.address || '';
        if (!body || !isMpesaMessage(address, body)) continue;

        const parsed = parseMpesaSms(body);
        if (!parsed) continue;

        const msgDate = msg.date ? new Date(msg.date) : new Date();
        const txId = `sms_${msg.date || Date.now()}_${msg.id || imported}`;

        const tx: Transaction = {
          id: txId,
          amount: parsed.amount ?? 0,
          type: parsed.type ?? 'sent',
          category: parsed.category ?? 'Other',
          name: parsed.name ?? 'Unknown',
          date: msgDate.toISOString(),
          reference: parsed.reference,
        };

        // Check for duplicates
        const existing = localStorage.getItem('pesaguard_transactions');
        const txns: Transaction[] = existing ? JSON.parse(existing) : [];
        const isDuplicate = txns.some(t =>
          t.id === tx.id ||
          (t.amount === tx.amount && t.name === tx.name && Math.abs(new Date(t.date).getTime() - msgDate.getTime()) < 60000)
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

  /** Poll for new SMS periodically. Returns cleanup function. */
  startPolling(onTransaction: (tx: Omit<Transaction, 'category'>) => void, intervalMs = 15000): (() => void) | null {
    if (!this.isAvailable()) return null;

    let lastCheckedTimestamp = Date.now();

    const poll = async () => {
      try {
        const filter: SMSFilter = {
          type: MessageType.INBOX,
          address: 'MPESA',
          minDate: lastCheckedTimestamp,
          maxCount: 10,
        };

        const result = await SMSInboxReader.getSMSList({ filter });
        const messages = result.smsList || [];

        for (const msg of messages) {
          const body = msg.body || '';
          const address = msg.address || '';
          const msgTime = msg.date || Date.now();

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
          const maxTime = Math.max(...messages.map(m => m.date || 0));
          if (maxTime > lastCheckedTimestamp) lastCheckedTimestamp = maxTime;
        }
      } catch (err) {
        console.error('[SMS] Poll failed:', err);
      }
    };

    const timer = setInterval(poll, intervalMs);
    poll(); // First poll immediately

    return () => clearInterval(timer);
  },
};
