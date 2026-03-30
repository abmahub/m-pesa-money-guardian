// Capacitor SMS Reader Service
// Bridges native Android SMS reading into the PesaGuard app
// Requires: capacitor-sms-inbox-reader plugin + Android permissions

import { Capacitor } from '@capacitor/core';
import { Transaction } from '@/types';
import { parseMpesaSms, isMpesaMessage } from './smsReader';
import { db } from './database';

// Register a Capacitor plugin for SMS inbox reading
// This wraps the native Android ContentResolver for SMS
interface SmsMessage {
  address: string;
  body: string;
  date: number;
  type: number; // 1 = inbox
}

interface SmsInboxPlugin {
  requestPermission(): Promise<{ granted: boolean }>;
  getMessages(options: { limit: number; offset?: number }): Promise<{ messages: SmsMessage[] }>;
  addListener(event: 'smsReceived', callback: (data: { address: string; body: string }) => void): Promise<{ remove: () => void }>;
}

// Access the native plugin (registered on native side)
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

  /** Request READ_SMS permission from the user */
  async requestPermission(): Promise<boolean> {
    const plugin = getSmsPlugin();
    if (!plugin) {
      console.log('[SMS] Not on native platform, skipping permission request');
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

  /** Read existing M-Pesa messages from inbox and import them */
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
        console.log('[SMS] Auto-imported transaction:', tx.name, tx.amount);
        onTransaction?.(tx);
      });

      return () => listener.remove();
    } catch (err) {
      console.error('[SMS] Listener setup failed:', err);
      return null;
    }
  },

  /** Simulate an incoming M-Pesa SMS (for web preview/testing) */
  simulateIncoming(onTransaction?: (tx: Transaction) => void): void {
    const samples = [
      { amount: 1500, type: 'received' as const, name: 'John Kamau', category: 'Transfer' },
      { amount: 250, type: 'sent' as const, name: 'Naivas Supermarket', category: 'Food' },
      { amount: 100, type: 'paybill' as const, name: 'Safaricom', category: 'Bills' },
      { amount: 2000, type: 'withdraw' as const, name: 'ATM Westlands', category: 'Cash' },
    ];
    const sample = samples[Math.floor(Math.random() * samples.length)];
    const tx: Transaction = {
      id: `sim_${Date.now()}`,
      ...sample,
      date: new Date().toISOString(),
    };
    db.addTransaction(tx);
    onTransaction?.(tx);
  },
};
