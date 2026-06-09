import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PieChart,
  CreditCard, 
  Users, 
  FileText, 
  Settings, 
  HelpCircle,
  LogOut,
  Bell,
  Activity,
  Menu,
  X,
  Smartphone,
  BookOpen,
  TrendingDown,
  Sparkles,
  Upload,
  Mail,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '@/lib/utils';
import { subscribeToDocuments } from '../lib/firestore';
import { AppUser } from '../lib/types';

const navItems = [
  { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { id: 'invoices', icon: <CreditCard size={20} />, label: 'Invoices' },
  { id: 'estimates', icon: <FileText size={20} />, label: 'Estimates' },
  { id: 'expenses', icon: <TrendingDown size={20} />, label: 'Expenses' },
  { id: 'reports', icon: <PieChart size={20} />, label: 'Reports' },
  { id: 'bas', icon: <Activity size={20} />, label: 'Tax / BAS' },
  { id: 'ai-agent', icon: <Sparkles size={20} />, label: 'AI Assistant' },
  { id: 'customers', icon: <Users size={20} />, label: 'Customers' },
  { id: 'catalog', icon: <Smartphone size={20} />, label: 'Catalog' },
  { id: 'import', icon: <Upload size={20} />, label: 'Import' },
];

export function Sidebar({ activeTab, setActiveTab, settings }: { 
  activeTab: string,
  setActiveTab: (val: string) => void,
  settings: any
}) {
  const { user, profile, logout } = useAuth();
  const theme = settings?.appTheme || 'modern';
  const isAdmin = profile?.role === 'admin';
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    try {
      const unsubscribe = subscribeToDocuments<AppUser>('users', (data) => {
        const pending = data.filter(u => u.status === 'pending');
        setPendingCount(pending.length);
      });
      return unsubscribe;
    } catch (err) {
      console.warn('[Sidebar] Error fetching pending users:', err);
    }
  }, [isAdmin]);

  return (
    <aside className={cn(
      "hidden sm:flex flex-col w-56 bg-white border-r border-slate-200 sticky top-0 h-screen flex-shrink-0 overflow-y-auto custom-scrollbar transition-all duration-300",
      theme === 'cyber' && "bg-slate-950 border-slate-800",
      theme === 'minimalist' && "bg-[#fdfcfa] border-zinc-100 w-64"
    )}>
      <div 
        className="p-4 md:p-5 flex items-center justify-center md:justify-start gap-3 cursor-pointer"
        onClick={() => setActiveTab('dashboard')}
      >
        <div className={cn(
          "w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 overflow-hidden bg-white",
          theme === 'modern' ? "bg-blue-600 shadow-blue-200" : 
          theme === 'cyber' ? "bg-cyan-500 shadow-cyan-900/50" : 
          "bg-zinc-900 rounded-none shadow-none"
        )}>
          {settings?.logo && settings?.showLogo ? (
            <img src={settings.logo} alt="Logo" className="w-full h-full object-contain p-1" />
          ) : (
            <LayoutDashboard size={20} className={theme === 'minimalist' ? 'text-white' : ''} />
          )}
        </div>
        <span className={cn(
          "hidden md:block text-lg font-black tracking-tight truncate",
          theme === 'modern' ? "text-slate-800" : 
          theme === 'cyber' ? "text-white uppercase italic tracking-widest text-sm" : 
          "text-zinc-900 font-serif lowercase"
        )}>
          {settings?.logo && settings?.showLogo && !settings?.hideCompanyName ? settings.companyName : (theme === 'minimalist' ? 'studio.' : 'RepairBill')}
        </span>
      </div>

      <nav className="flex-1 mt-4 space-y-1.5 px-2 md:px-3">
        {navItems.map((item) => {
          const isActive = activeTab === item.id || (item.id === 'ai-agent' && activeTab === 'ai-agent-voice');
          return (
            <button 
              key={item.id}
              onClick={() => {
                if (isActive && item.id === 'ai-agent') {
                  setActiveTab('dashboard');
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={cn(
                "w-full flex items-center justify-center md:justify-start gap-3 p-3 md:px-3 md:py-2.5 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl",
                isActive 
                  ? (theme === 'modern' ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105" : 
                     theme === 'cyber' ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : 
                     "bg-zinc-100 text-zinc-900 rounded-none border-l-2 border-zinc-900 scale-100") 
                  : (theme === 'cyber' ? "text-slate-500 hover:text-white hover:bg-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
              )}
              title={item.label}
            >
              <span className={cn(
                "flex items-center justify-center shrink-0",
                isActive 
                  ? (theme === 'cyber' ? "text-cyan-400" : "text-white") 
                  : "text-slate-400"
              )}>
                {item.icon}
              </span>
              <span className="hidden md:block truncate">{item.label}</span>
            </button>
          )
        })}

        {isAdmin && (
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "w-full flex items-center justify-center md:justify-start gap-3 p-3 md:px-3 md:py-2.5 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl",
              activeTab === 'users' 
                ? (theme === 'modern' ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105" : 
                   theme === 'cyber' ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : 
                   "bg-zinc-100 text-zinc-900 rounded-none border-l-2 border-zinc-900 scale-100") 
                : (theme === 'cyber' ? "text-slate-500 hover:text-white hover:bg-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
            )}
            title="User Management"
          >
            <span className={cn(
              "flex items-center justify-center shrink-0",
              activeTab === 'users' 
                ? (theme === 'cyber' ? "text-cyan-400" : "text-white") 
                : "text-slate-400"
            )}>
              <Shield size={20} />
            </span>
            <span className="hidden md:block truncate">User Access</span>
            {pendingCount > 0 && (
              <span className="hidden md:inline-flex items-center justify-center ml-auto bg-amber-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full min-w-5 h-5 select-none animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
        )}
      </nav>

      <div className="p-2 md:p-3 mt-auto space-y-1.5">
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "w-full flex items-center justify-center md:justify-start gap-3 p-3 md:px-3 md:py-2.5 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl",
            activeTab === 'settings' 
              ? (theme === 'modern' ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : 
                 theme === 'cyber' ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : 
                 "bg-zinc-100 text-zinc-900 rounded-none border-l-2 border-zinc-900 shadow-none")
              : (theme === 'cyber' ? "text-slate-500 hover:text-white hover:bg-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
          )}
          title="Settings"
        >
          <Settings size={20} className={activeTab === 'settings' 
            ? (theme === 'cyber' ? "text-cyan-400" : "text-white") 
            : "text-slate-400 shrink-0"} />
          <span className="hidden md:block">Settings</span>
        </button>

        <div className={cn("pt-4 border-t", theme === 'cyber' ? "border-slate-800" : "border-slate-100")}>
          <div className={cn(
            "flex items-center justify-center md:justify-start gap-3 p-1.5 md:p-2 rounded-xl relative group",
            theme === 'modern' ? "bg-slate-50" : theme === 'cyber' ? "bg-slate-900 border border-slate-800" : "bg-zinc-50 rounded-none border border-zinc-100"
          )}>
            <div className={cn(
              "w-8 h-8 md:w-9 md:h-9 overflow-hidden shrink-0 shadow-sm flex items-center justify-center",
              theme === 'modern' ? "rounded-lg bg-white border border-slate-200" : 
              theme === 'cyber' ? "rounded-lg bg-slate-800 border border-slate-700" : 
              "rounded-none bg-white border border-zinc-200"
            )}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
              ) : (
                <span className={cn("text-xs font-bold", theme === 'cyber' ? "text-cyan-400" : "text-blue-600")}>
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="hidden md:flex flex-col flex-1 min-w-0">
              <p className={cn(
                "text-[10px] font-black truncate leading-tight uppercase tracking-wider",
                theme === 'cyber' ? "text-white" : "text-slate-800"
              )}>
                {user?.displayName || 'Technician'}
              </p>
              <button 
                onClick={() => logout()}
                className="text-[9px] text-slate-400 font-bold uppercase truncate tracking-tighter text-left hover:text-red-500 transition-colors"
              >
                Sign Out
              </button>
            </div>
            <Bell size={14} className="hidden lg:block text-slate-300 hover:text-slate-900 cursor-pointer shrink-0" />
          </div>
        </div>
      </div>
    </aside>
  );
}
