import { Bell } from 'lucide-react';

const AppHeader = () => {
  return (
    <header className="flex items-center justify-between px-5 py-3 safe-top">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">PG</span>
        </div>
        <span className="font-bold text-lg text-foreground">PesaGuard</span>
      </div>
      <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
        <Bell className="w-5 h-5 text-foreground" />
      </button>
    </header>
  );
};

export default AppHeader;
