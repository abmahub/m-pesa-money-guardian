import { Transaction, Budget } from '@/types';
import { mockTransactions, mockBudgets } from './mockData';

// In-memory store (simulates SQLite for web preview; real app uses @capacitor-community/sqlite)
let transactions: Transaction[] = [...mockTransactions];
let budgets: Budget[] = [...mockBudgets];

export const db = {
  async getTransactions(filter?: { type?: string; search?: string }): Promise<Transaction[]> {
    let result = [...transactions];
    if (filter?.type && filter.type !== 'all') {
      result = result.filter(t => t.type === filter.type);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q));
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getTodaySpending(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    return transactions
      .filter(t => t.date.startsWith(today) && (t.type === 'sent' || t.type === 'paybill' || t.type === 'withdraw'))
      .reduce((sum, t) => sum + t.amount, 0);
  },

  async getYesterdaySpending(): Promise<number> {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    return transactions
      .filter(t => t.date.startsWith(yesterday) && (t.type === 'sent' || t.type === 'paybill' || t.type === 'withdraw'))
      .reduce((sum, t) => sum + t.amount, 0);
  },

  async getMonthlyOutflow(): Promise<number> {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return transactions
      .filter(t => t.date.startsWith(monthStart) && t.type !== 'received' && t.type !== 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  async getCategoryBreakdown(): Promise<{ category: string; amount: number }[]> {
    const map: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'sent' || t.type === 'paybill')
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map).map(([category, amount]) => ({ category, amount }));
  },

  async getBudgets(): Promise<Budget[]> {
    return [...budgets];
  },

  async updateBudget(id: string, updates: Partial<Budget>): Promise<void> {
    budgets = budgets.map(b => b.id === id ? { ...b, ...updates } : b);
  },

  async addTransaction(tx: Transaction): Promise<void> {
    transactions.unshift(tx);
  },

  async getWeeklySpending(): Promise<{ day: string; amount: number }[]> {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: { day: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const amount = transactions
        .filter(t => t.date.startsWith(dateStr) && t.type !== 'received' && t.type !== 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);
      result.push({ day: days[d.getDay()], amount });
    }
    return result;
  },

  async getTopMerchant(): Promise<{ name: string; amount: number; percentage: number } | null> {
    const map: Record<string, number> = {};
    const spendTxns = transactions.filter(t => t.type === 'sent' || t.type === 'paybill');
    spendTxns.forEach(t => { map[t.name] = (map[t.name] || 0) + t.amount; });
    const total = spendTxns.reduce((s, t) => s + t.amount, 0);
    const entries = Object.entries(map);
    if (!entries.length) return null;
    entries.sort((a, b) => b[1] - a[1]);
    const [name, amount] = entries[0];
    return { name, amount, percentage: total ? Math.round((amount / total) * 100) : 0 };
  },
};
