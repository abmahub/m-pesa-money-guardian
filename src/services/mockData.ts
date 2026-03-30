import { Transaction, Budget } from '@/types';

export const mockTransactions: Transaction[] = [
  { id: '1', amount: 1200, type: 'sent', category: 'Food', name: 'Naivas Supermarket', date: '2026-03-30T12:30:00', reference: 'SH12345' },
  { id: '2', amount: 450, type: 'sent', category: 'Transport', name: 'Bolt', date: '2026-03-30T08:15:00', reference: 'SH12346' },
  { id: '3', amount: 3500, type: 'received', category: 'Transfer', name: 'Sarah Mwangi', date: '2026-03-29T17:45:00', reference: 'SH12347' },
  { id: '4', amount: 10000, type: 'withdraw', category: 'Cash', name: 'ATM Withdrawal', date: '2026-03-29T10:00:00', reference: 'SH12348' },
  { id: '5', amount: 800, type: 'sent', category: 'Food', name: 'Mama Mboga', date: '2026-03-30T10:24:00', reference: 'SH12349' },
  { id: '6', amount: 100, type: 'sent', category: 'Transport', name: 'Matatu Fare', date: '2026-03-30T07:00:00', reference: 'SH12350' },
  { id: '7', amount: 85000, type: 'received', category: 'Income', name: 'Salary Deposit', date: '2026-03-28T18:00:00', reference: 'SH12351' },
  { id: '8', amount: 2500, type: 'paybill', category: 'Bills', name: 'KPLC Electricity', date: '2026-03-28T14:30:00', reference: 'SH12352' },
  { id: '9', amount: 750, type: 'sent', category: 'Shopping', name: 'Jumia', date: '2026-03-27T16:20:00', reference: 'SH12353' },
  { id: '10', amount: 300, type: 'sent', category: 'Food', name: 'Java House', date: '2026-03-27T13:00:00', reference: 'SH12354' },
  { id: '11', amount: 5000, type: 'sent', category: 'Bills', name: 'Safaricom Airtime', date: '2026-03-26T09:00:00', reference: 'SH12355' },
  { id: '12', amount: 1500, type: 'sent', category: 'Shopping', name: 'Carrefour', date: '2026-03-26T15:45:00', reference: 'SH12356' },
];

export const mockBudgets: Budget[] = [
  { id: '1', category: 'Food', limit: 20000, used: 12500, icon: '🍴' },
  { id: '2', category: 'Transport', limit: 8000, used: 4200, icon: '🚌' },
  { id: '3', category: 'Shopping', limit: 15000, used: 8000, icon: '🛍️' },
  { id: '4', category: 'Bills', limit: 10000, used: 7500, icon: '📄' },
];

export const categoryIcons: Record<string, string> = {
  Food: '🍴',
  Transport: '🚌',
  Shopping: '🛍️',
  Bills: '📄',
  Cash: '🏧',
  Transfer: '👤',
  Income: '💰',
};

export const categoryColors: Record<string, string> = {
  Food: 'hsl(152, 69%, 22%)',
  Transport: 'hsl(210, 70%, 50%)',
  Shopping: 'hsl(340, 65%, 50%)',
  Bills: 'hsl(38, 92%, 50%)',
  Cash: 'hsl(260, 50%, 50%)',
  Transfer: 'hsl(180, 50%, 40%)',
  Income: 'hsl(152, 60%, 35%)',
};
