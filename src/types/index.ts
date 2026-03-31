export interface Transaction {
  id: string;
  amount: number;
  type: 'sent' | 'received' | 'paybill' | 'withdraw' | 'deposit' | 'till' | 'fuliza' | 'airtime' | 'balance';
  category: string;
  name: string;
  date: string;
  reference?: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  used: number;
  icon: string;
}

export interface DailySummary {
  date: string;
  totalSpent: number;
  totalReceived: number;
  transactionCount: number;
}

export type TabType = 'home' | 'transactions' | 'budget' | 'insights' | 'settings';

export interface CategoryBreakdown {
  category: string;
  amount: number;
  icon: string;
  color: string;
}
