import AppHeader from '@/components/AppHeader';
import { ChevronRight, Download, Shield, Share2, Bell, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { checkNotificationPermission, requestNotificationPermission } from '@/services/localNotifications';
import { shareIntentService } from '@/services/capacitorSms';
import { parseMpesaSms } from '@/services/smsReader';
import { Transaction } from '@/types';

interface SettingsScreenProps {
  onManualTransaction?: (tx: Omit<Transaction, 'category'>) => void;
}

const SettingsScreen = ({ onManualTransaction }: SettingsScreenProps) => {
  const [notificationStatus, setNotificationStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      const granted = await checkNotificationPermission();
      setNotificationStatus(granted ? 'granted' : 'unknown');
    };
    check();
  }, []);

  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationStatus(granted ? 'granted' : 'denied');
  };

  const handleParseMessage = () => {
    const text = messageText.trim();
    if (!text) {
      setError('Please paste an M-Pesa message first.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const parsed = parseMpesaSms(text);
    if (!parsed || !parsed.amount) {
      setError('Unsupported message format. Please paste a valid M-Pesa message.');
      setTimeout(() => setError(null), 4000);
      return;
    }

    const tx: Omit<Transaction, 'category'> = {
      id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      amount: parsed.amount,
      type: parsed.type ?? 'sent',
      name: parsed.name ?? 'Unknown',
      date: parsed.date || new Date().toISOString(),
      reference: parsed.reference,
    };

    // Check for duplicates
    if (shareIntentService.isDuplicate(tx)) {
      setError('This transaction has already been added.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Trigger the category picker popup
    if (onManualTransaction) {
      onManualTransaction(tx);
    }

    setMessageText('');
    setError(null);
  };

  const handleClearData = () => {
    if (confirm('This will delete all saved transactions and budgets. Continue?')) {
      localStorage.removeItem('pesaguard_transactions');
      localStorage.removeItem('pesaguard_budgets');
      window.location.reload();
    }
  };

  return (
    <div className="pb-20 animate-fade-in">
      <AppHeader />
      <div className="px-5 pt-2">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage preferences and add transactions</p>
      </div>

      {/* Manual Message Input */}
      <div className="px-5 mt-6">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">Paste M-Pesa Message</p>
        <div className="rounded-2xl bg-card shadow-card overflow-hidden p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">Add Transaction Manually</span>
          </div>
          <textarea
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            placeholder={"Paste your M-Pesa message here...\n\nExample: SJ12ABC456 Confirmed. Ksh1,500.00 sent to JOHN DOE 0712345678 on 31/3/26..."}
            className="w-full min-h-[120px] rounded-xl bg-muted/50 border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          {error && (
            <p className="text-xs text-destructive font-semibold mt-2">{error}</p>
          )}
          <button
            onClick={handleParseMessage}
            disabled={!messageText.trim()}
            className="w-full mt-3 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 transition-opacity"
          >
            Process Message
          </button>
        </div>
      </div>

      {/* How to Share */}
      <div className="px-5 mt-6">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">Other Options</p>
        <div className="rounded-2xl bg-card shadow-card overflow-hidden divide-y divide-border">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Share from SMS App</p>
              <p className="text-xs text-muted-foreground">
                Open SMS → long-press M-Pesa message → Share → PesaGuard
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="px-5 mt-6">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">Permissions</p>
        <div className="rounded-2xl bg-card shadow-card overflow-hidden divide-y divide-border">
          <button onClick={handleRequestNotifications} className="flex items-center gap-3 w-full px-4 py-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Bell className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {notificationStatus === 'granted' ? 'Access granted ✓' : notificationStatus === 'denied' ? 'Access denied' : 'Tap to request notification access'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Privacy */}
      <div className="px-5 mt-6">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">Privacy & Data</p>
        <div className="rounded-2xl bg-card shadow-card overflow-hidden divide-y divide-border">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Your Data is Private</p>
              <p className="text-xs text-muted-foreground">No SMS permissions. No server uploads. All data stays on your device.</p>
            </div>
          </div>
          <button className="flex items-center gap-3 w-full px-4 py-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Download className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Export Data</p>
              <p className="text-xs text-muted-foreground">Download your transaction history</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="px-5 mt-8 mb-4">
        <button onClick={handleClearData} className="flex items-center justify-center gap-2 w-full text-destructive font-semibold text-sm">
          Clear All Data
        </button>
      </div>
    </div>
  );
};

export default SettingsScreen;
