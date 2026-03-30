import { Transaction } from '@/types';
import { categoryIcons } from '@/services/mockData';
import { cn } from '@/lib/utils';

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem = ({ transaction }: TransactionItemProps) => {
  const isIncome = transaction.type === 'received' || transaction.type === 'deposit';
  const time = new Date(transaction.date).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center gap-3 py-3 px-1">
      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
        {categoryIcons[transaction.category] || '💸'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{transaction.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
            {transaction.category}
          </span>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
      </div>
      <span className={cn(
        "font-bold text-sm tabular-nums",
        isIncome ? "text-income" : "text-expense"
      )}>
        {isIncome ? '+' : '-'}{transaction.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
};

export default TransactionItem;
