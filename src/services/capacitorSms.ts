// Capacitor SMS Reader Service — PRODUCTION ONLY
// No simulated/fake messages. Reads real device SMS only.

import { Capacitor } from '@capacitor/core';
import { Transaction } from '@/types';
import { parseMpesaSms, isMpesaMessage } from './smsReader';
import { db } from './database';

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

  /** Read existing M-Pesa messages from device inbox */
  async importExistingMessages(limit = 500): Promise<number> {
    const plugin = getSmsPlugin();
    if (!plugin) return 0;

    try {
      const { messages } = await plugin.getMessages({ limit });
      let imported = 0;

      for (const msg of messages) {
        // ONLY process messages from M-Pesa sender
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

        await db.addTransaction(tx);
        imported++;
      }

      return imported;
    } catch (err) {
      console.error('[SMS] Import failed:', err);
      return 0;
    }
  },

  /** Listen for new incoming M-Pesa SMS in real-time */
  async startListening(onTransaction?: (tx: Transaction) => void): Promise<(() => void) | null> {
    const plugin = getSmsPlugin();
    if (!plugin) return null;

    try {
      const listener = await plugin.addListener('smsReceived', async ({ address, body }) => {
        // ONLY process messages from M-Pesa sender
        if (!isMpesaMessage(address, body)) return;

        const parsed = parseMpesaSms(body);
        if (!parsed) return;

        const tx: Transaction = {
          id: `sms_${Date.now()}`,
          amount: parsed.amount ?? 0,
          type: parsed.type ?? 'sent',
          category: parsed.category ?? 'Other',
          name: parsed.name ?? 'Unknown',
          date: new Date().toISOString(),
          reference: parsed.reference,
        };

        await db.addTransaction(tx);
        console.log('[SMS] Imported real transaction:', tx.name, tx.amount);
        onTransaction?.(tx);
      });

      return () => listener.remove();
    } catch (err) {
      console.error('[SMS] Listener setup failed:', err);
      return null;
    }
  },
};
