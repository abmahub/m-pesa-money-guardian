import { useState, useEffect } from 'react';
import { db } from '@/services/database';
import { Transaction } from '@/types';
import { categoryIcons, categoryColors } from '@/services/mockData';
import TransactionItem from '@/components/TransactionItem';
import AppHeader from '@/components/AppHeader';
import { TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

const HomeScreen = () => {
  const [todaySpending, setTodaySpending] = useState(0);
  const [yesterdaySpending, setYesterdaySpending] = useState(0);
  const [categories, setCategories] = useState<{ category: string; amount: number }[]>([]);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [topMerchant, setTopMerchant] = useState<{ name: string; amount: number; percentage: number } | null>(null);
  const [budgets, setBudgets] = useState<{ category: string; limit: number; used: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const [today, yesterday, cats, txns, top, b] = await Promise.all([
        db.getTodaySpending(),
        db.getYesterdaySpending(),
        db.getCategoryBreakdown(),
        db.getTransactions(),
        db.getTopMerchant(),
        db.getBudgets(),
      ]);
      setTodaySpending(today);
      setYesterdaySpending(yesterday);
      setCategories(cats);
      setRecentTxns(txns.slice(0, 4));
      setTopMerchant(top);
      setBudgets(b);
    };
    load();
  }, []);

  const diff = yesterdaySpending > 0
    ? Math.round(((todaySpending - yesterdaySpending) / yesterdaySpending) * 100)
    : 0;
  const isDown = diff <= 0;
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const warningBudgets = budgets.filter(b => (b.used / b.limit) >= 0.8);

  return (
    <div className="pb-20 animate-fade-in">
      <AppHeader />

      <div className="px-5 pt-2">
        {/* Greeting */}
        <p className="text-muted-foreground text-sm">👋 Hello, User</p>
        <p className="text-xs text-muted-foreground">{dayName}</p>
      </div>

      {/* Today's Spending Card */}
      <div className="mx-5 mt-4 p-5 rounded-2xl bg-card shadow-card">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Today's Spending</p>
        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-4xl font-bold text-foreground">
            KES {todaySpending.toLocaleString()}
          </span>
          {diff !== 0 && (
            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isDown ? 'bg-accent text-accent-foreground' : 'bg-destructive/10 text-expense'}`}>
              {isDown ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {Math.abs(diff)}%
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {isDown ? "You've spent less than yesterday. Keep it up!" : "Spending is up from yesterday."}
        </p>
        <div className="flex gap-2 mt-4">
          <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground">
            View Trends
          </button>
          <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-secondary text-secondary-foreground">
            Details
          </button>
        </div>
      </div>

      {/* Budget Status */}
      {warningBudgets.length > 0 && (
        <div className="mx-5 mt-4 p-4 rounded-2xl bg-card shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-foreground">Budget Status</h3>
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          {warningBudgets.map(b => {
            const pct = Math.round((b.used / b.limit) * 100);
            return (
              <div key={b.category} className="mb-3 last:mb-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground font-medium">{b.category}</span>
                  <span className={pct >= 80 ? 'text-expense font-bold' : 'text-muted-foreground'}>{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: pct >= 80 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                    }}
                  />
                </div>
                {pct >= 80 && (
                  <p className="text-[10px] font-semibold text-expense mt-1 uppercase tracking-wide">
                    Warning: Near Limit
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Category Breakdown */}
      <div className="mx-5 mt-4">
        <div className="flex justify-between items-baseline mb-3">
          <h3 className="font-bold text-lg text-foreground">Category Breakdown</h3>
          <button className="text-xs font-semibold text-muted-foreground">See all categories</button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {categories.slice(0, 3).map(c => (
            <div key={c.category} className="p-4 rounded-2xl bg-card shadow-card">
              <span className="text-2xl">{categoryIcons[c.category] || '💸'}</span>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">{c.category}</p>
              <p className="text-xl font-bold text-foreground mt-1">KES {c.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Merchant */}
      {topMerchant && (
        <div className="mx-5 mt-4 p-4 rounded-2xl bg-card shadow-card">
          <p className="text-xs text-muted-foreground">Top Merchant</p>
          <p className="font-bold text-lg text-foreground">{topMerchant.name}</p>
          <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
            <div className="h-full rounded-full bg-primary" style={{ width: `${topMerchant.percentage}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{topMerchant.percentage}% of spending</p>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="mx-5 mt-6">
        <h3 className="font-bold text-lg text-foreground mb-2">Recent Transactions</h3>
        <div className="divide-y divide-border">
          {recentTxns.map(t => (
            <TransactionItem key={t.id} transaction={t} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
