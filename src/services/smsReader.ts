// SMS Reader service for Capacitor Android
// Parses real M-Pesa SMS messages only

import { Transaction } from '@/types';

// M-Pesa SMS patterns for all transaction types
const MPESA_PATTERNS: { type: Transaction['type']; pattern: RegExp }[] = [
  // Sent money
  { type: 'sent', pattern: /(?:sent|paid)\s+Ksh([\d,.]+)\s+to\s+(.+?)(?:\s+on|\.)/i },
  // Received money
  { type: 'received', pattern: /(?:received|You have received)\s+Ksh([\d,.]+)\s+from\s+(.+?)(?:\s+on|\.)/i },
  // Withdraw
  { type: 'withdraw', pattern: /(?:withdraw|withdrawn)\s+Ksh([\d,.]+)\s+from\s+(.+?)(?:\s+on|\.)/i },
  // Deposit
  { type: 'deposit', pattern: /(?:deposit|deposited)\s+Ksh([\d,.]+)\s+(?:to|at|in)\s+(.+?)(?:\s+on|\.)/i },
  // Paybill
  { type: 'paybill', pattern: /(?:paid|sent)\s+Ksh([\d,.]+)\s+to\s+(.+?)(?:\s+for|\.)/i },
  // Till (Buy Goods)
  { type: 'till', pattern: /(?:paid|bought|buy goods)\s+Ksh([\d,.]+)\s+(?:to|at|from)\s+(.+?)(?:\s+on|\.)/i },
];

export function parseMpesaSms(message: string): Partial<Transaction> | null {
  for (const { type, pattern } of MPESA_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      const name = match[2].trim();
      return {
        amount,
        type,
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
  if (type === 'deposit') return 'Deposit';
  if (type === 'received') return 'Transfer';
  return 'Other';
}

/** Check if message is from M-Pesa sender */
export function isMpesaMessage(sender: string, _body: string): boolean {
  const s = sender.toUpperCase().replace(/[\s-]/g, '');
  return s === 'MPESA' || s.includes('MPESA');
}
