import { Home, Receipt, PieChart, BarChart3, Settings } from 'lucide-react';
import { TabType } from '@/types';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'HOME', icon: Home },
  { id: 'transactions', label: 'TRANSACTIONS', icon: Receipt },
  { id: 'budget', label: 'BUDGET', icon: PieChart },
  { id: 'insights', label: 'INSIGHTS', icon: BarChart3 },
  { id: 'settings', label: 'SETTINGS', icon: Settings },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-[56px]",
              activeTab === id
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon className={cn("w-5 h-5", activeTab === id && "stroke-[2.5]")} />
            <span className="text-[10px] font-semibold tracking-wider">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
