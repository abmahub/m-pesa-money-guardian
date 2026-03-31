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
import { smsService } from '@/services/capacitorSms';
import { requestNotificationPermission } from '@/services/localNotifications';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingSmsTransaction, setPendingSmsTransaction] = useState<Omit<Transaction, 'category'> | null>(null);

  useEffect(() => {
    const done = localStorage.getItem('pesaguard_onboarded');
    if (done === 'true') setOnboarded(true);
  }, []);

  /** Called when a new M-Pesa SMS is detected — shows category picker popup */
  const handleSmsReceived = useCallback((tx: Omit<Transaction, 'category'>) => {
    setPendingSmsTransaction(tx);
  }, []);

  // Initialize real SMS listener on native Android only
  useEffect(() => {
    if (!onboarded) return;
    if (!smsService.isAvailable()) {
      console.log('[PesaGuard] Running in web preview — SMS features disabled');
      return;
    }

    let cleanup: (() => void) | null = null;

    const init = async () => {
      // Ask Android notification permission for budget alerts
      const notificationGranted = await requestNotificationPermission();
      if (!notificationGranted) {
        console.log('[PesaGuard] Notification permission denied');
      }

      // Request REAL Android system permissions
      const granted = await smsService.requestPermission();
      if (!granted) {
        console.log('[PesaGuard] SMS permission denied');
        return;
      }

      // Import existing M-Pesa messages from inbox
      const imported = await smsService.importExistingMessages();
      if (imported > 0) {
        setRefreshKey(k => k + 1);
        console.log(`[PesaGuard] Imported ${imported} M-Pesa transactions`);
      }

      // Poll for new incoming SMS — passes to category picker popup
      cleanup = smsService.startPolling((tx) => {
        handleSmsReceived(tx);
      });
    };

    init();
    return () => { cleanup?.(); };
  }, [onboarded, handleSmsReceived]);

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

      {/* M-Pesa SMS Category Picker Popup — only from real device SMS */}
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
