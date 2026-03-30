import { Transaction, Budget } from '@/types';

const STORAGE_KEYS = {
  transactions: 'pesaguard_transactions',
  budgets: 'pesaguard_budgets',
};

const DEFAULT_BUDGETS: Budget[] = [
  { id: '1', category: 'Food', limit: 20000, used: 0, icon: '🍴' },
  { id: '2', category: 'Transport', limit: 8000, used: 0, icon: '🚌' },
  { id: '3', category: 'Shopping', limit: 15000, used: 0, icon: '🛍️' },
  { id: '4', category: 'Bills', limit: 10000, used: 0, icon: '📄' },
];

function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.transactions);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTransactions(txns: Transaction[]) {
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(txns));
}

function loadBudgets(): Budget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.budgets);
    return raw ? JSON.parse(raw) : [...DEFAULT_BUDGETS];
  } catch {
    return [...DEFAULT_BUDGETS];
  }
}

function saveBudgets(budgets: Budget[]) {
  localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(budgets));
}

export const db = {
  async getTransactions(filter?: { type?: string; search?: string }): Promise<Transaction[]> {
    let result = loadTransactions();
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
    return loadTransactions()
      .filter(t => t.date.startsWith(today) && (t.type === 'sent' || t.type === 'paybill' || t.type === 'withdraw'))
      .reduce((sum, t) => sum + t.amount, 0);
  },

  async getYesterdaySpending(): Promise<number> {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    return loadTransactions()
      .filter(t => t.date.startsWith(yesterday) && (t.type === 'sent' || t.type === 'paybill' || t.type === 'withdraw'))
      .reduce((sum, t) => sum + t.amount, 0);
  },

  async getMonthlyOutflow(): Promise<number> {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return loadTransactions()
      .filter(t => t.date.startsWith(monthStart) && t.type !== 'received' && t.type !== 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  async getCategoryBreakdown(): Promise<{ category: string; amount: number }[]> {
    const map: Record<string, number> = {};
    loadTransactions()
      .filter(t => t.type === 'sent' || t.type === 'paybill')
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map).map(([category, amount]) => ({ category, amount }));
  },

  async getBudgets(): Promise<Budget[]> {
    return loadBudgets();
  },

  async updateBudget(id: string, updates: Partial<Budget>): Promise<void> {
    const budgets = loadBudgets().map(b => b.id === id ? { ...b, ...updates } : b);
    saveBudgets(budgets);
  },

  async addTransaction(tx: Transaction): Promise<void> {
    const txns = loadTransactions();
    txns.unshift(tx);
    saveTransactions(txns);
  },

  async getWeeklySpending(): Promise<{ day: string; amount: number }[]> {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const transactions = loadTransactions();
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
    const transactions = loadTransactions();
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
