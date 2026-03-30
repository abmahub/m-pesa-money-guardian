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

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [smsTransaction, setSmsTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const done = localStorage.getItem('pesaguard_onboarded');
    if (done === 'true') setOnboarded(true);
  }, []);

  const handleSmsReceived = useCallback((tx: Transaction) => {
    setSmsTransaction(tx);
    setRefreshKey(k => k + 1);
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
      const granted = await smsService.requestPermission();
      if (!granted) {
        console.log('[PesaGuard] SMS permission denied');
        return;
      }
      const imported = await smsService.importExistingMessages();
      if (imported > 0) {
        setRefreshKey(k => k + 1);
        console.log(`[PesaGuard] Imported ${imported} M-Pesa transactions`);
      }
      cleanup = await smsService.startListening(handleSmsReceived);
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
      case 'budget': return <BudgetScreen />;
      case 'insights': return <InsightsScreen key={refreshKey} />;
      case 'settings': return <SettingsScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="overflow-y-auto">
        {renderScreen()}
      </div>

      {/* Real M-Pesa SMS Received Popup — only from real device SMS */}
      <SmsReceivedPopup
        transaction={smsTransaction}
        onDismiss={() => setSmsTransaction(null)}
        onView={() => setActiveTab('transactions')}
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
