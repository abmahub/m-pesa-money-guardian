// SMS Reader service — parses M-Pesa SMS messages
import { Transaction } from '@/types';

/**
 * Parse a real M-Pesa SMS message and extract transaction details.
 * Supports: sent, received, withdraw, deposit, paybill, till/buy goods,
 *           Fuliza, airtime purchase, and balance inquiry.
 */
export function parseMpesaSms(message: string): Partial<Transaction> | null {
  if (!message) return null;

  // Extract transaction reference (10-char alphanumeric)
  const refMatch = message.match(/\b([A-Z0-9]{10})\b/);
  const reference = refMatch ? refMatch[1] : undefined;

  // --- Balance inquiry (no amount to track, but useful info) ---
  // "Your M-PESA balance is Ksh1,234.00"
  if (/\bbalance\s+(?:is|was)\b/i.test(message)) {
    const balMatch = message.match(/balance\s+(?:is|was)\s+Ksh\s?([\d,]+(?:\.\d{1,2})?)/i);
    if (balMatch) {
      return {
        amount: parseFloat(balMatch[1].replace(/,/g, '')),
        type: 'balance',
        name: 'M-Pesa Balance',
        category: 'Balance',
        date: extractDate(message),
        reference,
      };
    }
  }

  // Extract amount — after "Ksh"
  const amountMatch = message.match(/Ksh\s?([\d,]+(?:\.\d{1,2})?)/i);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) return null;

  // Determine transaction type
  let type: Transaction['type'] = 'sent';
  let name = 'Unknown';

  // --- Fuliza ---
  // "You have been given a Fuliza of Ksh500.00..." or "Fuliza M-PESA Ksh1,000.00..."
  // "You have repaid Fuliza M-PESA Ksh200.00..."
  if (/\bFULIZA\b/i.test(message)) {
    type = 'fuliza';
    if (/\brepaid\b/i.test(message)) {
      name = 'Fuliza Repayment';
    } else {
      name = 'Fuliza Loan';
    }
    return {
      amount, type, name,
      category: 'Fuliza',
      date: extractDate(message),
      reference,
    };
  }

  // --- Airtime ---
  // "You bought Ksh100.00 of airtime on 31/3/26..."
  // "Ksh50.00 airtime for 0712345678..."
  if (/\bairtime\b/i.test(message)) {
    type = 'airtime';
    // Check if buying for someone else
    const forMatch = message.match(/airtime\s+for\s+(0[17]\d{8})/i);
    name = forMatch ? `Airtime for ${forMatch[1]}` : 'Airtime Purchase';
    return {
      amount, type, name,
      category: 'Airtime',
      date: extractDate(message),
      reference,
    };
  }

  // --- Withdraw ---
  if (/\bWITHDRAW\b|WITHDRAWN/i.test(message)) {
    type = 'withdraw';
    const nameMatch = message.match(/from\s+\d+\s*-\s*(.+?)(?:\s+on\s|\.\s|$)/i);
    name = nameMatch ? nameMatch[1].replace(/\s+/g, ' ').trim() : 'ATM/Agent';
  }
  // --- Deposit ---
  else if (/\bDEPOSIT/i.test(message)) {
    type = 'deposit';
    name = 'M-Pesa Deposit';
  }
  // --- Received ---
  else if (/\bRECEIVED\b/i.test(message)) {
    type = 'received';
    const nameMatch = message.match(/from\s+(.+?)(?:\s+0[17]\d{8}|\s+on\s|\.\s|$)/i);
    if (nameMatch) name = nameMatch[1].replace(/\s+/g, ' ').trim();
  }
  // --- Buy Goods / Till ---
  else if (/\bBUY\s*GOODS\b/i.test(message) || /\bTILL\b/i.test(message)) {
    type = 'till';
    const nameMatch = message.match(/(?:sent to|paid to|to)\s+(.+?)(?:\s+0[17]\d{8}|\s+on\s|\s+New\s|\.\s|$)/i);
    if (nameMatch) name = nameMatch[1].replace(/\s+/g, ' ').trim();
  }
  // --- Paybill ---
  else if (/\bPAYBILL\b|BUSINESS\s*NUMBER/i.test(message)) {
    type = 'paybill';
    const nameMatch = message.match(/(?:sent to|paid to)\s+(.+?)(?:\s+0[17]\d{8}|\s+on\s|\s+New\s|\.\s|$)/i);
    if (nameMatch) name = nameMatch[1].replace(/\s+/g, ' ').trim();
  }
  // --- Sent / Paid ---
  else if (/\bSENT\b|\bPAID\b/i.test(message)) {
    type = 'sent';
    const nameMatch = message.match(/(?:sent to|paid to)\s+(.+?)(?:\s+0[17]\d{8}|\s+on\s|\s+New\s|\.\s|$)/i);
    if (nameMatch) name = nameMatch[1].replace(/\s+/g, ' ').trim();
  }

  // Clean up name
  name = name.replace(/\.+$/, '').trim() || 'Unknown';

  return {
    amount, type, name,
    category: categorize(name, type),
    date: extractDate(message),
    reference,
  };
}

/** Extract date/time from SMS text */
function extractDate(message: string): string {
  const dateMatch = message.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!dateMatch) return new Date().toISOString();

  const day = parseInt(dateMatch[1]);
  const month = parseInt(dateMatch[2]) - 1;
  let year = parseInt(dateMatch[3]);
  if (year < 100) year += 2000;

  const timeMatch = message.match(/at\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  let hours = 0, minutes = 0;
  if (timeMatch) {
    hours = parseInt(timeMatch[1]);
    minutes = parseInt(timeMatch[2]);
    if (timeMatch[3]?.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (timeMatch[3]?.toUpperCase() === 'AM' && hours === 12) hours = 0;
  }

  const d = new Date(year, month, day, hours, minutes);
  return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
}

function categorize(name: string, type: string): string {
  const lower = name.toLowerCase();
  if (['naivas', 'carrefour', 'quickmart', 'tuskys', 'mama mboga', 'java', 'kfc', 'chicken', 'food'].some(k => lower.includes(k))) return 'Food';
  if (['bolt', 'uber', 'matatu', 'bus', 'fare', 'little'].some(k => lower.includes(k))) return 'Transport';
  if (['jumia', 'kilimall', 'shop'].some(k => lower.includes(k))) return 'Shopping';
  if (['kplc', 'safaricom', 'airtel', 'zuku', 'rent', 'dstv', 'gotv'].some(k => lower.includes(k))) return 'Bills';
  if (type === 'withdraw') return 'Cash';
  if (type === 'deposit') return 'Deposit';
  if (type === 'received') return 'Transfer';
  if (type === 'fuliza') return 'Fuliza';
  if (type === 'airtime') return 'Airtime';
  if (type === 'balance') return 'Balance';
  return 'Other';
}

/** Check if message is from M-Pesa */
export function isMpesaMessage(sender: string, _body: string): boolean {
  const s = sender.toUpperCase().replace(/[\s-]/g, '');
  return s === 'MPESA' || s.includes('MPESA');
}
