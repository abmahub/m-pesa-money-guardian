import AppHeader from '@/components/AppHeader';
import { ChevronRight, Download, Shield, Share2, Bell, Clipboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { shareIntentService } from '@/services/capacitorSms';
import { checkNotificationPermission, requestNotificationPermission } from '@/services/localNotifications';
import { parseMpesaSms } from '@/services/smsReader';
import { db } from '@/services/database';
import { Transaction } from '@/types';

const SettingsScreen = () => {
  const [notificationStatus, setNotificationStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [pasteResult, setPasteResult] = useState<string | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      const notificationsGranted = await checkNotificationPermission();
      setNotificationStatus(notificationsGranted ? 'granted' : 'unknown');
    };
    checkPermissions();
  }, []);

  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationStatus(granted ? 'granted' : 'denied');
  };

  /** Manual paste: user copies an M-Pesa message and taps this button */
  const handlePasteMessage = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setPasteResult('Clipboard is empty. Copy an M-Pesa message first.');
        setTimeout(() => setPasteResult(null), 3000);
        return;
      }

      const parsed = parseMpesaSms(text);
      if (!parsed || !parsed.amount) {
        setPasteResult('Not a valid M-Pesa message. Please copy the full message.');
        setTimeout(() => setPasteResult(null), 4000);
        return;
      }

      const tx: Transaction = {
        id: `paste_${Date.now()}`,
        amount: parsed.amount,
        type: parsed.type ?? 'sent',
        category: parsed.category ?? 'Other',
        name: parsed.name ?? 'Unknown',
        date: parsed.date || new Date().toISOString(),
        reference: parsed.reference,
      };

      await db.addTransaction(tx);
      setPasteResult('✓ Transaction added!');
      setTimeout(() => setPasteResult(null), 3000);
    } catch {
      setPasteResult('Could not read clipboard. Please allow clipboard access.');
      setTimeout(() => setPasteResult(null), 3000);
    }
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

      {/* How to Share */}
      <div className="px-5 mt-6">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">Add Transactions</p>
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
          <button onClick={handlePasteMessage} className="flex items-center gap-3 w-full px-4 py-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Clipboard className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Paste M-Pesa Message</p>
              <p className="text-xs text-muted-foreground">
                {pasteResult || 'Copy a message, then tap here to add it'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
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
        <button onClick={handleClearData} className="flex items-center justify-center gap-2 w-full text-expense font-semibold text-sm">
          Clear All Data
        </button>
      </div>
    </div>
  );
};

export default SettingsScreen;
