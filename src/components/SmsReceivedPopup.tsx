import { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, CreditCard, Banknote, Wallet, Store } from 'lucide-react';
import { Transaction } from '@/types';
import { db } from '@/services/database';

interface SmsReceivedPopupProps {
  /** Partial transaction from SMS parse — no category yet */
  transaction: Omit<Transaction, 'category'> & { category?: string } | null;
  onDismiss: () => void;
  onSaved: () => void;
}

const typeConfig: Record<string, { icon: typeof ArrowDownLeft; label: string; color: string }> = {
  received: { icon: ArrowDownLeft, label: 'Received', color: 'text-income' },
  sent: { icon: ArrowUpRight, label: 'Sent', color: 'text-expense' },
  paybill: { icon: CreditCard, label: 'Paybill', color: 'text-expense' },
  withdraw: { icon: Banknote, label: 'Withdraw', color: 'text-expense' },
  deposit: { icon: Wallet, label: 'Deposit', color: 'text-income' },
  till: { icon: Store, label: 'Buy Goods', color: 'text-expense' },
};

const CATEGORIES = [
  { id: 'Food', icon: '🍴', label: 'Food' },
  { id: 'Transport', icon: '🚌', label: 'Transport' },
  { id: 'Shopping', icon: '🛍️', label: 'Shopping' },
  { id: 'Bills', icon: '📄', label: 'Bills' },
  { id: 'Cash', icon: '🏧', label: 'Cash' },
  { id: 'Entertainment', icon: '🎬', label: 'Entertainment' },
  { id: 'Health', icon: '💊', label: 'Health' },
  { id: 'Transfer', icon: '👤', label: 'Transfer' },
  { id: 'Savings', icon: '🏦', label: 'Savings' },
  { id: 'Other', icon: '📦', label: 'Other' },
];

const SmsReceivedPopup = ({ transaction, onDismiss, onSaved }: SmsReceivedPopupProps) => {
  const [visible, setVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setVisible(true);
      setSelectedCategory(null);
      setSaving(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const config = typeConfig[transaction.type] || typeConfig.sent;
  const Icon = config.icon;

  const handleSave = async () => {
    if (!selectedCategory || saving) return;
    setSaving(true);

    const fullTx: Transaction = {
      ...transaction,
      category: selectedCategory,
    };

    await db.addTransaction(fullTx);

    setVisible(false);
    setTimeout(() => {
      onSaved();
      onDismiss();
    }, 300);
  };

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  const formattedTime = new Date(transaction.date).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedDate = new Date(transaction.date).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
      {/* Backdrop — no dismiss on tap, user must choose */}
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />

      <div
        className={`relative w-full max-w-lg bg-card rounded-t-3xl transition-all duration-300 safe-bottom ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <span className="text-xs font-bold text-primary uppercase tracking-wide">M-Pesa {config.label}</span>
          </div>
          <button onClick={handleDismiss} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Transaction Details */}
        <div className="px-6 pb-4">
          <div className="p-4 rounded-2xl bg-muted/50">
            <p className="text-sm font-semibold text-foreground">{transaction.name}</p>
            <p className={`text-3xl font-bold mt-1 tabular-nums ${config.color}`}>
              {transaction.type === 'received' || transaction.type === 'deposit' ? '+' : '-'}KES {transaction.amount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{formattedDate} at {formattedTime}</p>
          </div>
        </div>

        {/* Category Picker */}
        <div className="px-6 pb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">What was this for?</p>
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary/15 ring-2 ring-primary'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-[10px] font-semibold text-foreground leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="px-6 pb-8">
          <button
            onClick={handleSave}
            disabled={!selectedCategory || saving}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
          >
            {saving ? 'Saving...' : 'Save Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmsReceivedPopup;
