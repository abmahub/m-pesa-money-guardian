import { useState, useEffect } from 'react';
import { db } from '@/services/database';
import { Transaction } from '@/types';
import TransactionItem from '@/components/TransactionItem';
import AppHeader from '@/components/AppHeader';
import { Search, TrendingDown, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'sent', label: 'Sent' },
  { id: 'received', label: 'Received' },
  { id: 'paybill', label: 'Paid' },
];

const TransactionsScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [monthlyOutflow, setMonthlyOutflow] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [txns, outflow] = await Promise.all([
        db.getTransactions({ type: activeFilter, search }),
        db.getMonthlyOutflow(),
      ]);
      setTransactions(txns);
      setMonthlyOutflow(outflow);
    };
    load();
  }, [activeFilter, search]);

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  transactions.forEach(t => {
    const d = new Date(t.date);
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    let label: string;
    if (d.toDateString() === today.toDateString()) label = `TODAY, ${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase()}`;
    else if (d.toDateString() === yesterday.toDateString()) label = `YESTERDAY, ${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase()}`;
    else label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(t);
  });

  return (
    <div className="pb-20 animate-fade-in">
      <AppHeader />

      {/* Search */}
      <div className="mx-5 mt-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card shadow-card">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search M-Pesa transactions..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-5 mt-4 overflow-x-auto">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
              activeFilter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground border border-border"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Monthly Outflow Card */}
      <div className="mx-5 mt-4 p-5 rounded-2xl text-primary-foreground" style={{ background: 'var(--gradient-dark)' }}>
        <p className="text-xs font-semibold tracking-widest opacity-80 uppercase">Total Outflow (Monthly)</p>
        <p className="text-3xl font-bold mt-2">KES {monthlyOutflow.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</p>
        <div className="flex items-center gap-1 mt-2 opacity-80">
          <TrendingDown className="w-4 h-4" />
          <span className="text-sm">12% lower than last month</span>
        </div>
      </div>

      {/* Activity Header */}
      <div className="flex justify-between items-baseline px-5 mt-6 mb-2">
        <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
        <button className="flex items-center gap-1 text-xs font-bold text-primary uppercase tracking-wide">
          <Download className="w-3 h-3" />
          Download Statement
        </button>
      </div>

      {/* Grouped Transactions */}
      <div className="px-5">
        {Object.entries(grouped).map(([date, txns]) => (
          <div key={date} className="mb-4">
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase mb-1">{date}</p>
            <div className="rounded-2xl bg-card shadow-card divide-y divide-border px-3">
              {txns.map(t => (
                <TransactionItem key={t.id} transaction={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionsScreen;
