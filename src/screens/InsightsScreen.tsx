import { useState, useEffect } from 'react';
import { db } from '@/services/database';
import { categoryIcons, categoryColors } from '@/services/mockData';
import AppHeader from '@/components/AppHeader';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

const InsightsScreen = () => {
  const [weeklyData, setWeeklyData] = useState<{ day: string; amount: number }[]>([]);
  const [categories, setCategories] = useState<{ category: string; amount: number }[]>([]);

  useEffect(() => {
    Promise.all([db.getWeeklySpending(), db.getCategoryBreakdown()]).then(([w, c]) => {
      setWeeklyData(w);
      setCategories(c.sort((a, b) => b.amount - a.amount));
    });
  }, []);

  const totalSpend = categories.reduce((s, c) => s + c.amount, 0);
  const topCategory = categories[0];

  return (
    <div className="pb-20 animate-fade-in">
      <AppHeader />
      <div className="px-5 pt-2">
        <h1 className="text-3xl font-bold text-foreground">Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">Understand your spending patterns</p>
      </div>

      {/* Weekly Chart */}
      <div className="mx-5 mt-6 p-5 rounded-2xl bg-card shadow-card">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">Weekly Spending</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(160,5%,50%)' }} />
              <YAxis hide />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {weeklyData.map((_, i) => (
                  <Cell key={i} fill={i === weeklyData.length - 1 ? 'hsl(152,69%,22%)' : 'hsl(140,10%,90%)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Smart Insight */}
      {topCategory && (
        <div className="mx-5 mt-4 p-5 rounded-2xl" style={{ background: 'var(--gradient-dark)' }}>
          <p className="text-primary-foreground/80 text-sm">💡 Smart Insight</p>
          <p className="text-primary-foreground font-bold text-lg mt-1">
            You spent most on {topCategory.category.toLowerCase()} this week.
          </p>
          <p className="text-primary-foreground/70 text-sm mt-2">
            KES {topCategory.amount.toLocaleString()} — {Math.round((topCategory.amount / totalSpend) * 100)}% of total spending
          </p>
        </div>
      )}

      {/* Category Distribution */}
      <div className="px-5 mt-6">
        <h3 className="font-bold text-lg text-foreground mb-3">Category Distribution</h3>
        <div className="space-y-3">
          {categories.map(c => {
            const pct = Math.round((c.amount / totalSpend) * 100);
            return (
              <div key={c.category} className="p-4 rounded-2xl bg-card shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryIcons[c.category] || '💸'}</span>
                    <span className="font-semibold text-sm text-foreground">{c.category}</span>
                  </div>
                  <span className="font-bold text-sm text-foreground">KES {c.amount.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: categoryColors[c.category] || 'hsl(var(--primary))',
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{pct}% of total</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Growth Card */}
      <div className="mx-5 mt-6 mb-4 p-5 rounded-2xl" style={{ background: 'var(--gradient-dark)' }}>
        <p className="text-2xl">📈</p>
        <h3 className="text-primary-foreground font-bold text-lg mt-2">
          Your savings are growing 15% faster this month.
        </h3>
        <p className="text-primary-foreground/70 text-sm mt-2">
          Based on your current spending, you can reach your goal of KES 50k by October.
        </p>
        <button className="mt-4 px-5 py-2.5 rounded-xl bg-card text-foreground font-semibold text-sm">
          Explore Forecast
        </button>
      </div>
    </div>
  );
};

export default InsightsScreen;
