// SMS Reader service for Capacitor Android
// Uses native SMS permission via Capacitor plugin bridge
// In production, pair with a Capacitor plugin like @nicklucas/capacitor-sms-reader

import { Transaction } from '@/types';

// M-Pesa SMS patterns
const MPESA_PATTERNS = {
  sent: /(?:sent|paid)\s+Ksh([\d,.]+)\s+to\s+(.+?)(?:\s+on|\.)/i,
  received: /(?:received|You have received)\s+Ksh([\d,.]+)\s+from\s+(.+?)(?:\s+on|\.)/i,
  withdraw: /(?:withdraw|Withdraw)\s+Ksh([\d,.]+)\s+from\s+(.+?)(?:\s+on|\.)/i,
  paybill: /(?:paid|sent)\s+Ksh([\d,.]+)\s+to\s+(.+?)(?:\s+for|\.)/i,
};

export function parseMpesaSms(message: string): Partial<Transaction> | null {
  for (const [type, pattern] of Object.entries(MPESA_PATTERNS)) {
    const match = message.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      const name = match[2].trim();
      return {
        amount,
        type: type as Transaction['type'],
        name,
        category: categorize(name, type),
        date: new Date().toISOString(),
      };
    }
  }
  return null;
}

function categorize(name: string, type: string): string {
  const lower = name.toLowerCase();
  if (['naivas', 'carrefour', 'quickmart', 'tuskys', 'mama mboga', 'java', 'kfc', 'chicken'].some(k => lower.includes(k))) return 'Food';
  if (['bolt', 'uber', 'matatu', 'bus', 'fare'].some(k => lower.includes(k))) return 'Transport';
  if (['jumia', 'kilimall', 'shop'].some(k => lower.includes(k))) return 'Shopping';
  if (['kplc', 'safaricom', 'airtel', 'zuku', 'rent'].some(k => lower.includes(k))) return 'Bills';
  if (type === 'withdraw') return 'Cash';
  if (type === 'received') return 'Transfer';
  return 'Other';
}

export function isMpesaMessage(sender: string, body: string): boolean {
  return sender.toUpperCase().includes('MPESA') || body.toUpperCase().includes('M-PESA');
}
