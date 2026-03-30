import AppHeader from '@/components/AppHeader';
import { ChevronRight, Download, Shield, MessageSquare, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { smsService } from '@/services/capacitorSms';
import { checkNotificationPermission, requestNotificationPermission } from '@/services/localNotifications';

const SettingsScreen = () => {
  const [smsStatus, setSmsStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [notificationStatus, setNotificationStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  useEffect(() => {
    const checkPermissions = async () => {
      const smsGranted = await smsService.checkPermission();
      setSmsStatus(smsGranted ? 'granted' : 'unknown');

      const notificationsGranted = await checkNotificationPermission();
      setNotificationStatus(notificationsGranted ? 'granted' : 'unknown');
    };

    checkPermissions();
  }, []);

  const handleRequestSms = async () => {
    if (smsService.isAvailable()) {
      const granted = await smsService.requestPermission();
      setSmsStatus(granted ? 'granted' : 'denied');
    } else {
      setSmsStatus('denied');
    }
  };

  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationStatus(granted ? 'granted' : 'denied');
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
        <p className="text-sm text-muted-foreground mt-1">Manage permissions and preferences</p>
      </div>

      {/* Permissions */}
      <div className="px-5 mt-6">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">Permissions</p>
        <div className="rounded-2xl bg-card shadow-card overflow-hidden divide-y divide-border">
          <button onClick={handleRequestSms} className="flex items-center gap-3 w-full px-4 py-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">SMS Permission</p>
              <p className="text-xs text-muted-foreground">
                {smsStatus === 'granted' ? 'Access granted ✓' : smsStatus === 'denied' ? 'Access denied' : 'Tap to request SMS access'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
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
              <p className="text-xs text-muted-foreground">All data stays on your device. Nothing is uploaded to any server.</p>
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
