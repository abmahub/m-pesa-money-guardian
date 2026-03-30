import { useState, useEffect } from 'react';
import { CheckCircle, X, ArrowDownLeft, ArrowUpRight, CreditCard, Banknote } from 'lucide-react';
import { Transaction } from '@/types';

interface SmsReceivedPopupProps {
  transaction: Transaction | null;
  onDismiss: () => void;
  onView: () => void;
}

const typeConfig: Record<string, { icon: typeof ArrowDownLeft; label: string; color: string }> = {
  received: { icon: ArrowDownLeft, label: 'Received', color: 'text-income' },
  sent: { icon: ArrowUpRight, label: 'Sent', color: 'text-expense' },
  paybill: { icon: CreditCard, label: 'Paybill', color: 'text-expense' },
  withdraw: { icon: Banknote, label: 'Withdraw', color: 'text-expense' },
};

const SmsReceivedPopup = ({ transaction, onDismiss, onView }: SmsReceivedPopupProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (transaction) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [transaction, onDismiss]);

  if (!transaction) return null;

  const config = typeConfig[transaction.type] || typeConfig.sent;
  const Icon = config.icon;

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-[70] max-w-lg mx-auto transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="bg-card border border-border rounded-2xl shadow-elevated p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-bold text-primary uppercase tracking-wide">M-Pesa Transaction</span>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Transaction details */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{transaction.name}</p>
            <p className="text-xs text-muted-foreground">{config.label} • {transaction.category}</p>
          </div>
          <p className={`text-lg font-bold tabular-nums ${config.color}`}>
            {transaction.type === 'received' ? '+' : '-'}KES {transaction.amount.toLocaleString()}
          </p>
        </div>

        {/* Action */}
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => {
              onDismiss();
              onView();
            }, 300);
          }}
          className="w-full mt-3 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold text-center"
        >
          View Transaction
        </button>
      </div>
    </div>
  );
};

export default SmsReceivedPopup;
