// Capacitor SMS Reader Service — PRODUCTION ONLY
// No simulated/fake messages. Reads real device SMS only.

import { Capacitor } from '@capacitor/core';
import { Transaction } from '@/types';
import { parseMpesaSms, isMpesaMessage } from './smsReader';

interface SmsMessage {
  address: string;
  body: string;
  date: number;
  type: number;
}

interface SmsInboxPlugin {
  requestPermission(): Promise<{ granted: boolean }>;
  getMessages(options: { limit: number; offset?: number }): Promise<{ messages: SmsMessage[] }>;
  addListener(event: 'smsReceived', callback: (data: { address: string; body: string }) => void): Promise<{ remove: () => void }>;
}

function getSmsPlugin(): SmsInboxPlugin | null {
  if (Capacitor.isNativePlatform()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (Capacitor as any).Plugins?.SmsInbox as SmsInboxPlugin;
    } catch {
      return null;
    }
  }
  return null;
}

export const smsService = {
  /** Check if running on native Android */
  isAvailable(): boolean {
    return Capacitor.getPlatform() === 'android';
  },

  /** Request real Android READ_SMS permission */
  async requestPermission(): Promise<boolean> {
    const plugin = getSmsPlugin();
    if (!plugin) {
      console.log('[SMS] Not on native platform — SMS features unavailable');
      return false;
    }
    try {
      const result = await plugin.requestPermission();
      return result.granted;
    } catch (err) {
      console.error('[SMS] Permission request failed:', err);
      return false;
    }
  },

  /** Read existing M-Pesa messages from device inbox — auto-saves with default category */
  async importExistingMessages(limit = 500): Promise<number> {
    const plugin = getSmsPlugin();
    if (!plugin) return 0;

    try {
      const { messages } = await plugin.getMessages({ limit });
      let imported = 0;

      for (const msg of messages) {
        if (!isMpesaMessage(msg.address, msg.body)) continue;

        const parsed = parseMpesaSms(msg.body);
        if (!parsed) continue;

        const tx: Transaction = {
          id: `sms_${msg.date}`,
          amount: parsed.amount ?? 0,
          type: parsed.type ?? 'sent',
          category: parsed.category ?? 'Other',
          name: parsed.name ?? 'Unknown',
          date: new Date(msg.date).toISOString(),
          reference: parsed.reference,
        };

        // Check if already imported
        const existing = localStorage.getItem('pesaguard_transactions');
        const txns: Transaction[] = existing ? JSON.parse(existing) : [];
        if (!txns.some(t => t.id === tx.id)) {
          txns.unshift(tx);
          localStorage.setItem('pesaguard_transactions', JSON.stringify(txns));
          imported++;
        }
      }

      return imported;
    } catch (err) {
      console.error('[SMS] Import failed:', err);
      return 0;
    }
  },

  /** Listen for new incoming M-Pesa SMS in real-time.
   *  Does NOT auto-save — returns partial tx for user to categorize via popup. */
  async startListening(onTransaction?: (tx: Omit<Transaction, 'category'>) => void): Promise<(() => void) | null> {
    const plugin = getSmsPlugin();
    if (!plugin) return null;

    try {
      const listener = await plugin.addListener('smsReceived', ({ address, body }) => {
        if (!isMpesaMessage(address, body)) return;

        const parsed = parseMpesaSms(body);
        if (!parsed) return;

        // Build partial transaction — no category, user will choose
        const tx: Omit<Transaction, 'category'> = {
          id: `sms_${Date.now()}`,
          amount: parsed.amount ?? 0,
          type: parsed.type ?? 'sent',
          name: parsed.name ?? 'Unknown',
          date: new Date().toISOString(),
          reference: parsed.reference,
        };

        console.log('[SMS] New M-Pesa transaction detected:', tx.name, tx.amount);
        onTransaction?.(tx);
      });

      return () => listener.remove();
    } catch (err) {
      console.error('[SMS] Listener setup failed:', err);
      return null;
    }
  },
};
