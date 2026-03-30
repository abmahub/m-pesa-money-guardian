import { useState, useEffect } from 'react';
import { db } from '@/services/database';
import { Budget } from '@/types';
import AppHeader from '@/components/AppHeader';
import { Lock, Bell, BellOff } from 'lucide-react';

const BudgetScreen = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [warnAt80, setWarnAt80] = useState(true);
  const [blockAlerts, setBlockAlerts] = useState(false);

  useEffect(() => {
    db.getBudgets().then(setBudgets);
  }, []);

  return (
    <div className="pb-20 animate-fade-in">
      <AppHeader />
      <div className="px-5 pt-2">
        <h1 className="text-3xl font-bold text-foreground">Set Your Budget Limits</h1>
        <p className="text-sm text-muted-foreground mt-1">Take control of your spending with precise locks and real-time alerts.</p>
      </div>

      <div className="px-5 mt-6 space-y-4">
        {budgets.map(b => {
          const pct = Math.round((b.used / b.limit) * 100);
          return (
            <div key={b.id} className="p-5 rounded-2xl bg-card shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{b.icon}</span>
                  <div>
                    <p className="font-bold text-foreground">{b.category}</p>
                    {b.category === 'Food' && <p className="text-xs text-muted-foreground">Daily allowance</p>}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-foreground">{b.used.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground ml-1">KES</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: pct >= 80 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                    }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-card"
                    style={{ left: `calc(${Math.min(pct, 100)}% - 6px)` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">0 KES</span>
                  <span className="text-[10px] text-muted-foreground">{b.limit.toLocaleString()} KES</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert Settings */}
      <div className="px-5 mt-8">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">Alert Settings</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card shadow-card">
            <div>
              <p className="font-semibold text-sm text-foreground">Warn me at 80%</p>
              <p className="text-xs text-muted-foreground">Get notified before you hit your limit</p>
            </div>
            <button
              onClick={() => setWarnAt80(!warnAt80)}
              className={`w-12 h-7 rounded-full p-0.5 transition-colors ${warnAt80 ? 'bg-primary' : 'bg-muted'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-card shadow transition-transform ${warnAt80 ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card shadow-card">
            <div>
              <p className="font-semibold text-sm text-foreground">Block spending alerts</p>
              <p className="text-xs text-muted-foreground">Prevent transactions once limit is reached</p>
            </div>
            <button
              onClick={() => setBlockAlerts(!blockAlerts)}
              className={`w-12 h-7 rounded-full p-0.5 transition-colors ${blockAlerts ? 'bg-primary' : 'bg-muted'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-card shadow transition-transform ${blockAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Activate Button */}
      <div className="px-5 mt-8 mb-4">
        <button className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2">
          <Lock className="w-5 h-5" />
          Activate Budget Protection
        </button>
      </div>
    </div>
  );
};

export default BudgetScreen;
