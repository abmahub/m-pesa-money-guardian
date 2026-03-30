import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Transaction } from '@/types';
import { db } from '@/services/database';

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Cash', 'Transfer', 'Other'];
const types: { id: Transaction['type']; label: string }[] = [
  { id: 'sent', label: 'Sent' },
  { id: 'received', label: 'Received' },
  { id: 'paybill', label: 'Paybill' },
  { id: 'withdraw', label: 'Withdraw' },
];

const AddTransactionModal = ({ open, onClose, onAdded }: AddTransactionModalProps) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<Transaction['type']>('sent');
  const [category, setCategory] = useState('Food');

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name.trim() || !amount) return;
    const tx: Transaction = {
      id: Date.now().toString(),
      name: name.trim(),
      amount: parseFloat(amount),
      type,
      category,
      date: new Date().toISOString(),
    };
    await db.addTransaction(tx);
    setName('');
    setAmount('');
    setType('sent');
    setCategory('Food');
    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 animate-slide-up safe-bottom">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Add Transaction</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name / Merchant</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Naivas Supermarket"
            className="w-full mt-1.5 px-4 py-3 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount (KES)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full mt-1.5 px-4 py-3 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 tabular-nums"
          />
        </div>

        {/* Type */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</label>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {types.map(t => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  type === t.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  category === c
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !amount}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Plus className="w-5 h-5" />
          Add Transaction
        </button>
      </div>
    </div>
  );
};

export default AddTransactionModal;
