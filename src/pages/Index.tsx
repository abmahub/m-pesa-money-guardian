import { useState, useEffect, useCallback } from 'react';
import { TabType } from '@/types';
import BottomNav from '@/components/BottomNav';
import HomeScreen from '@/screens/HomeScreen';
import TransactionsScreen from '@/screens/TransactionsScreen';
import BudgetScreen from '@/screens/BudgetScreen';
import InsightsScreen from '@/screens/InsightsScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import SplashScreen from '@/screens/SplashScreen';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');

  useEffect(() => {
    const done = localStorage.getItem('pesaguard_onboarded');
    if (done === 'true') setOnboarded(true);
  }, []);

  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('pesaguard_onboarded', 'true');
    setOnboarded(true);
  };

  if (!onboarded) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen />;
      case 'transactions': return <TransactionsScreen />;
      case 'budget': return <BudgetScreen />;
      case 'insights': return <InsightsScreen />;
      case 'settings': return <SettingsScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="overflow-y-auto">
        {renderScreen()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
