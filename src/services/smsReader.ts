// SMS Reader service — parses M-Pesa SMS messages
import { Transaction } from '@/types';

/**
 * Parse a real M-Pesa SMS message and extract transaction details.
 * Handles formats like:
 *   "SJ12ABC456 Confirmed. Ksh1,500.00 sent to JOHN DOE 0712345678 on 31/3/26..."
 *   "SJ12ABC456 Confirmed. You have received Ksh500.00 from JANE DOE 0798..."
 *   "SJ12ABC456 Confirmed.on 31/3/26 at 10:00 AM Withdraw Ksh2,000.00 from 12345 - AGENT..."
 */
export function parseMpesaSms(message: string): Partial<Transaction> | null {
  if (!message) return null;

  // Extract transaction reference (10-char alphanumeric at start)
  const refMatch = message.match(/\b([A-Z0-9]{10})\b/);
  const reference = refMatch ? refMatch[1] : undefined;

  // Extract amount — always after "Ksh" (with optional space)
  const amountMatch = message.match(/Ksh\s?([\d,]+(?:\.\d{1,2})?)/i);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) return null;

  // Determine transaction type
  const upperMsg = message.toUpperCase();
  let type: Transaction['type'] = 'sent';

  if (/\bWITHDRAW\b|WITHDRAWN/i.test(message)) {
    type = 'withdraw';
  } else if (/\bDEPOSIT/i.test(message)) {
    type = 'deposit';
  } else if (/\bRECEIVED\b/i.test(message)) {
    type = 'received';
  } else if (/\bBUY\s*GOODS\b/i.test(message) || /\bTILL\b/i.test(message)) {
    type = 'till';
  } else if (/\bPAYBILL\b|BUSINESS\s*NUMBER/i.test(message)) {
    type = 'paybill';
  } else if (/\bSENT\b|PAID\b/i.test(message)) {
    type = 'sent';
  }

  // Extract name/merchant
  let name = 'Unknown';

  if (type === 'sent' || type === 'paybill' || type === 'till') {
    // Pattern: "sent to NAME 07XXXXXXXX" or "paid to NAME"
    // Name is between "sent to"/"paid to" and the phone number or "on" or end
    const nameMatch = message.match(/(?:sent to|paid to)\s+(.+?)(?:\s+0[17]\d{8}|\s+on\s|\s+New\s|\.\s|$)/i);
    if (nameMatch) {
      name = nameMatch[1].replace(/\s+/g, ' ').trim();
    }
  } else if (type === 'received') {
    // Pattern: "received Ksh... from NAME 07XXXXXXXX"
    const nameMatch = message.match(/from\s+(.+?)(?:\s+0[17]\d{8}|\s+on\s|\.\s|$)/i);
    if (nameMatch) {
      name = nameMatch[1].replace(/\s+/g, ' ').trim();
    }
  } else if (type === 'withdraw') {
    // Pattern: "Withdraw Ksh... from 12345 - AGENT NAME"
    const nameMatch = message.match(/from\s+\d+\s*-\s*(.+?)(?:\s+on\s|\.\s|$)/i);
    if (nameMatch) {
      name = nameMatch[1].replace(/\s+/g, ' ').trim();
    } else {
      name = 'ATM/Agent';
    }
  } else if (type === 'deposit') {
    name = 'M-Pesa Deposit';
  }

  // Clean up name — remove trailing dots or extra spaces
  name = name.replace(/\.+$/, '').trim() || 'Unknown';

  // Extract date if present (d/m/yy or d/m/yyyy)
  let date = new Date().toISOString();
  const dateMatch = message.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (dateMatch) {
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
    if (!isNaN(d.getTime())) date = d.toISOString();
  }

  return {
    amount,
    type,
    name,
    category: categorize(name, type),
    date,
    reference,
  };
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
  return 'Other';
}

/** Check if message is from M-Pesa */
export function isMpesaMessage(sender: string, _body: string): boolean {
  const s = sender.toUpperCase().replace(/[\s-]/g, '');
  return s === 'MPESA' || s.includes('MPESA');
}
