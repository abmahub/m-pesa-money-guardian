import { useState, useEffect } from 'react';
import { db } from '@/services/database';
import { Budget } from '@/types';
import AppHeader from '@/components/AppHeader';
import { Plus, X, Check, Pencil } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { id: 'Food', icon: '🍴' },
  { id: 'Transport', icon: '🚌' },
  { id: 'Shopping', icon: '🛍️' },
  { id: 'Bills', icon: '📄' },
  { id: 'Cash', icon: '🏧' },
  { id: 'Entertainment', icon: '🎬' },
  { id: 'Health', icon: '💊' },
  { id: 'Transfer', icon: '👤' },
  { id: 'Savings', icon: '🏦' },
  { id: 'Other', icon: '📦' },
];

const BudgetScreen = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');

  const loadBudgets = async () => {
    const b = await db.getBudgets();
    // Compute used from real transactions
    const txns = await db.getTransactions();
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const categorySpend: Record<string, number> = {};
    txns
      .filter(t => t.date.startsWith(monthPrefix) && t.type !== 'received' && t.type !== 'deposit')
      .forEach(t => {
        categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount;
      });

    const updated = b.map(budget => ({
      ...budget,
      used: categorySpend[budget.category] || 0,
    }));

    setBudgets(updated);
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleAddBudget = async () => {
    if (!newCategory || !newLimit) return;
    const existing = budgets.find(b => b.category === newCategory);
    if (existing) return; // Already exists

    const budget: Budget = {
      id: Date.now().toString(),
      category: newCategory,
      limit: parseFloat(newLimit),
      used: 0,
      icon: CATEGORY_OPTIONS.find(c => c.id === newCategory)?.icon || '📦',
    };

    const allBudgets = [...budgets, budget];
    // Save all budgets
    localStorage.setItem('pesaguard_budgets', JSON.stringify(allBudgets));
    setNewCategory('');
    setNewLimit('');
    setShowAdd(false);
    loadBudgets();
  };

  const handleUpdateLimit = async (id: string) => {
    if (!editLimit) return;
    await db.updateBudget(id, { limit: parseFloat(editLimit) });
    setEditingId(null);
    setEditLimit('');
    loadBudgets();
  };

  const handleDeleteBudget = (id: string) => {
    const updated = budgets.filter(b => b.id !== id);
    localStorage.setItem('pesaguard_budgets', JSON.stringify(updated));
    loadBudgets();
  };

  const availableCategories = CATEGORY_OPTIONS.filter(
    c => !budgets.some(b => b.category === c.id)
  );

  return (
    <div className="pb-20 animate-fade-in">
      <AppHeader />
      <div className="px-5 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Budgets</h1>
            <p className="text-sm text-muted-foreground mt-1">Set monthly limits per category</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
          >
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Budget Cards */}
      <div className="px-5 mt-6 space-y-4">
        {budgets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-foreground font-semibold">No budgets set</p>
            <p className="text-sm text-muted-foreground mt-1">Tap + to add your first budget</p>
          </div>
        )}

        {budgets.map(b => {
          const pct = b.limit > 0 ? Math.round((b.used / b.limit) * 100) : 0;
          const isOver = pct >= 100;
          const isWarning = pct >= 80 && !isOver;
          const remaining = Math.max(b.limit - b.used, 0);

          return (
            <div key={b.id} className="p-5 rounded-2xl bg-card shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <p className="font-bold text-foreground">{b.category}</p>
                    <p className="text-xs text-muted-foreground">
                      KES {b.used.toLocaleString()} of {b.limit.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingId === b.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={editLimit}
                        onChange={e => setEditLimit(e.target.value)}
                        placeholder={b.limit.toString()}
                        className="w-20 px-2 py-1 rounded-lg bg-muted text-foreground text-sm outline-none"
                        autoFocus
                      />
                      <button onClick={() => handleUpdateLimit(b.id)} className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(b.id);
                          setEditLimit(b.limit.toString());
                        }}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <span className={`text-sm font-bold ${isOver ? 'text-expense' : isWarning ? 'text-warning' : 'text-primary'}`}>
                        {pct}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: isOver
                        ? 'hsl(var(--destructive))'
                        : isWarning
                        ? 'hsl(var(--warning, 38 92% 50%))'
                        : 'hsl(var(--primary))',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">Spent</span>
                  <span className={`text-[10px] font-semibold ${isOver ? 'text-expense' : 'text-muted-foreground'}`}>
                    {isOver ? `Over by KES ${(b.used - b.limit).toLocaleString()}` : `KES ${remaining.toLocaleString()} left`}
                  </span>
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDeleteBudget(b.id)}
                className="text-xs text-expense font-semibold mt-3"
              >
                Remove budget
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Budget Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setShowAdd(false)} />
          <div className="relative w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 safe-bottom">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Add Budget</h2>
              <button onClick={() => setShowAdd(false)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Category selection */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {availableCategories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setNewCategory(c.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                      newCategory === c.id
                        ? 'bg-primary/15 ring-2 ring-primary'
                        : 'bg-muted'
                    }`}
                  >
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-[10px] font-semibold text-foreground">{c.id}</span>
                  </button>
                ))}
              </div>
              {availableCategories.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">All categories have budgets</p>
              )}
            </div>

            {/* Limit */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Monthly Limit (KES)</label>
              <input
                type="number"
                value={newLimit}
                onChange={e => setNewLimit(e.target.value)}
                placeholder="e.g. 10000"
                className="w-full mt-1.5 px-4 py-3 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              onClick={handleAddBudget}
              disabled={!newCategory || !newLimit}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base disabled:opacity-40"
            >
              Add Budget
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetScreen;
