import AppHeader from '@/components/AppHeader';
import { ChevronRight, Download, LogOut, Shield, MessageSquare, CreditCard } from 'lucide-react';
import { useState } from 'react';

const SettingsScreen = () => {
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);

  return (
    <div className="pb-20 animate-fade-in">
      <AppHeader />
      <div className="px-5 pt-2">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your secure financial vault and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="mx-5 mt-6 p-5 rounded-2xl bg-card shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <span className="text-[10px] font-semibold tracking-wide px-2 py-1 rounded-full bg-accent text-accent-foreground uppercase">Verified Member</span>
            <h2 className="text-2xl font-bold text-foreground mt-2">Alex Thompson</h2>
            <p className="text-sm text-muted-foreground">alex.t@pesaguard.premium</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-2xl">👤</div>
        </div>
        <button className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
          Edit Profile
        </button>
      </div>

      {/* Account & Billing */}
      <div className="px-5 mt-6">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">Account & Billing</p>
        <div className="rounded-2xl bg-card shadow-card overflow-hidden divide-y divide-border">
          <button className="flex items-center gap-3 w-full px-4 py-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Subscription</p>
              <p className="text-xs text-muted-foreground">PesaGuard Gold • $14.99/mo</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">SMS Permissions</p>
              <p className="text-xs text-muted-foreground">Transaction auto-read {smsEnabled ? 'active' : 'disabled'}</p>
            </div>
            <button
              onClick={() => setSmsEnabled(!smsEnabled)}
              className={`w-12 h-7 rounded-full p-0.5 transition-colors ${smsEnabled ? 'bg-primary' : 'bg-muted'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-card shadow transition-transform ${smsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="px-5 mt-6">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">Security</p>
        <div className="rounded-2xl bg-card shadow-card overflow-hidden divide-y divide-border">
          <button className="flex items-center gap-3 w-full px-4 py-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Privacy</p>
              <p className="text-xs text-muted-foreground">Biometric lock & data encryption</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="flex items-center gap-3 w-full px-4 py-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Download className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Export Data</p>
              <p className="text-xs text-muted-foreground">Request CSV or PDF history</p>
            </div>
            <Download className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <div className="px-5 mt-8 mb-4">
        <button className="flex items-center justify-center gap-2 w-full text-expense font-semibold text-sm">
          <LogOut className="w-4 h-4" />
          Sign Out from All Devices
        </button>
      </div>
    </div>
  );
};

export default SettingsScreen;
