import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { TabType, Transaction } from '@/types';
import BottomNav from '@/components/BottomNav';
import HomeScreen from '@/screens/HomeScreen';
import TransactionsScreen from '@/screens/TransactionsScreen';
import BudgetScreen from '@/screens/BudgetScreen';
import InsightsScreen from '@/screens/InsightsScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import SplashScreen from '@/screens/SplashScreen';
import AddTransactionModal from '@/components/AddTransactionModal';
import SmsReceivedPopup from '@/components/SmsReceivedPopup';
import { shareIntentService } from '@/services/capacitorSms';
import { requestNotificationPermission } from '@/services/localNotifications';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingSmsTransaction, setPendingSmsTransaction] = useState<Omit<Transaction, 'category'> | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    const done = localStorage.getItem('pesaguard_onboarded');
    if (done === 'true') setOnboarded(true);
  }, []);

  /** Process shared text from another app */
  const processSharedText = useCallback((text: string) => {
    const tx = shareIntentService.parseSharedMessage(text);
    if (!tx) {
      setShareError('Unsupported message format. Please share an M-Pesa message.');
      setTimeout(() => setShareError(null), 4000);
      return;
    }

    if (shareIntentService.isDuplicate(tx)) {
      setShareError('This transaction has already been added.');
      setTimeout(() => setShareError(null), 3000);
      return;
    }

    setPendingSmsTransaction(tx);
  }, []);

  /** Check for shared intent on startup and when app resumes */
  useEffect(() => {
    if (!onboarded) return;

    const checkSharedContent = async () => {
      const text = await shareIntentService.checkForSharedText();
      if (text) {
        processSharedText(text);
      }
    };

    // Check on mount (app opened via share)
    checkSharedContent();

    // Check when app resumes from background
    if (shareIntentService.isNative()) {
      const listener = CapApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) checkSharedContent();
      });

      return () => { listener.then(l => l.remove()); };
    }
  }, [onboarded, processSharedText]);

  // Request notification permission on native
  useEffect(() => {
    if (!onboarded || !shareIntentService.isNative()) return;
    requestNotificationPermission().catch(() => {});
  }, [onboarded]);

  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('pesaguard_onboarded', 'true');
    setOnboarded(true);
  };

  const handleTransactionAdded = () => setRefreshKey(k => k + 1);

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (!onboarded) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen key={refreshKey} />;
      case 'transactions': return <TransactionsScreen key={refreshKey} />;
      case 'budget': return <BudgetScreen key={refreshKey} />;
      case 'insights': return <InsightsScreen key={refreshKey} />;
      case 'settings': return <SettingsScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="overflow-y-auto">
        {renderScreen()}
      </div>

      {/* Share error toast */}
      {shareError && (
        <div className="fixed top-4 left-4 right-4 z-[90] max-w-lg mx-auto animate-fade-in">
          <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-2xl text-sm font-semibold text-center shadow-elevated">
            {shareError}
          </div>
        </div>
      )}

      {/* M-Pesa Shared Message Category Picker */}
      <SmsReceivedPopup
        transaction={pendingSmsTransaction}
        onDismiss={() => setPendingSmsTransaction(null)}
        onSaved={() => {
          setRefreshKey(k => k + 1);
          setPendingSmsTransaction(null);
        }}
      />

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center active:scale-95 transition-transform"
        style={{ maxWidth: 'calc(50% + 224px - 16px)', marginLeft: 'auto' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      <AddTransactionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={handleTransactionAdded}
      />

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
