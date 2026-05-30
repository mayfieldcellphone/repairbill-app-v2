import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  ArrowUpRight,
  Receipt,
  Plus,
  CreditCard,
  Banknote,
  Users,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { StatCard } from './StatCard';
import { Invoice, InvoiceSettings, Expense, RepairService } from '../lib/types';
import { REPAIR_SERVICES, getSavedServices } from '../lib/serviceData';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface RepairDashboardProps {
  invoices: Invoice[];
  expenses: Expense[];
  settings: InvoiceSettings;
  onCreateInvoice: () => void;
  onCreateEstimate: () => void;
  onFilterInvoices: (filter: { paymentMethod?: string; status?: string }) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onQuickService?: (service: RepairService) => void;
}

export function RepairDashboard({ invoices, expenses, settings, onCreateInvoice, onCreateEstimate, onFilterInvoices, onEditInvoice, onQuickService }: RepairDashboardProps) {
  const theme = settings.appTheme || 'modern';
  const [chartMode, setChartMode] = useState<'weekly' | 'monthly'>('weekly');

  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Statistics Calculation
  const stats = useMemo(() => {
    const currentMonthStr = today.substring(0, 7); // YYYY-MM
    
    // Invoices Created (Volume tracking based on customer request)
    const allInvoices = invoices.filter(inv => inv.type === 'invoice');
    const monthlyInvoices = allInvoices.filter(inv => inv.date.startsWith(currentMonthStr));
    const monthlySales = monthlyInvoices.reduce((acc, inv) => acc + inv.total, 0);
    
    // Expenses
    const monthlyExpensesList = expenses.filter(exp => exp.date.startsWith(currentMonthStr));
    const monthlyExpenses = monthlyExpensesList.reduce((acc, exp) => acc + exp.amount, 0);
    
    // Today's Sales (All Invoices Created Today)
    const todaySales = allInvoices.filter(inv => inv.date === today).reduce((acc, inv) => acc + inv.total, 0);
    
    // Pending Revenue (UNPAID INVOICES EXCLUDING ESTIMATES)
    const pendingInvoices = invoices.filter(inv => inv.type === 'invoice' && (inv.status === 'sent' || inv.status === 'draft' || inv.status === 'overdue'));
    const totalPending = pendingInvoices.reduce((acc, inv) => acc + inv.total, 0);

    // Repairs count
    const paidInvoices = allInvoices.filter(inv => inv.status === 'paid');
    const paidToday = paidInvoices.filter(inv => inv.date === today).length;

    return {
      monthlySales,
      monthlyExpenses,
      todaySales,
      totalPending,
      paidToday,
      countToday: allInvoices.filter(inv => inv.date === today).length
    };
  }, [invoices, expenses, today]);

  const weeklySalesData = useMemo(() => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = dayNames.map(day => ({ day, sales: 0 }));

    const d = new Date();
    const offset = d.getTimezoneOffset();
    const now = new Date(d.getTime() - (offset * 60 * 1000));
    
    const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.getFullYear(), now.getMonth(), diff);
    
    const allInvoices = invoices.filter(inv => inv.type === 'invoice');

    for (let i = 0; i < 7; i++) {
      const tempDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      // Format as YYYY-MM-DD in local time to match inv.date format manually to avoid timezone shift
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, '0');
      const day = String(tempDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayTotal = allInvoices
        .filter(inv => inv.date === dateStr)
        .reduce((sum, inv) => sum + inv.total, 0);
      
      data[i].sales = dayTotal;
    }
    return data;
  }, [invoices]);

  const yearlyTrendData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const monthStr = `${year}-${month}`; // Local YYYY-MM without UTC shifting
      const label = d.toLocaleString('default', { month: 'short' });
      
      const monthlyTotal = invoices
        .filter(inv => inv.type === 'invoice' && inv.date.startsWith(monthStr))
        .reduce((sum, inv) => sum + inv.total, 0);
        
      data.push({ name: label, sales: monthlyTotal });
    }
    return data;
  }, [invoices]);

  // Payment method split (Today - All Invoices Created)
  const paymentSplit = useMemo(() => {
    const todayInvoices = invoices.filter(inv => inv.date === today && inv.type === 'invoice');
    const methods = {
      'Cash': 0,
      'Card': 0,
      'Bank Transfer': 0,
    };
    
    todayInvoices.forEach(inv => {
      if (inv.paymentMethod && inv.paymentMethod in methods) {
        methods[inv.paymentMethod as keyof typeof methods] += inv.total;
      }
    });

    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [invoices, today]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.currency,
    }).format(amount);
  };

  const recentInvoices = useMemo(() => {
    // Show 5 most recent overall, or specific to today if preferred.
    // Let's show most recent overall so the user never sees an empty table if they have history.
    return [...invoices].sort((a, b) => b.date.localeCompare(a.date) || b.invoiceNumber.localeCompare(a.invoiceNumber)).slice(0, 5);
  }, [invoices]);

  return (
    <div className={cn(
      "space-y-6",
      theme === 'minimalist' && "font-serif"
    )}>
      {/* Dashboard Header with Action */}
      <div className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border shadow-sm gap-4",
        "bg-card border-border rounded-3xl",
        theme === 'minimalist' && "rounded-none shadow-none"
      )}>
        <div className="flex items-center gap-4">
          {settings.logo && settings.showLogo && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-14 h-14 bg-white rounded-2xl border border-border/50 p-1.5 overflow-hidden flex items-center justify-center shadow-sm"
            >
              <img src={settings.logo} alt="Business Logo" className="w-full h-full object-contain" />
            </motion.div>
          )}
          <div>
            <h2 className="text-lg font-black text-foreground">Operational Overview</h2>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button 
            onClick={() => {
              const sidebarItems = document.querySelectorAll('aside nav button');
              const aiItem = Array.from(sidebarItems).find(btn => btn.textContent?.toLowerCase().includes('ai')) as HTMLButtonElement;
              if (aiItem) aiItem.click();
            }}
            className="hidden lg:flex bg-indigo-50 text-indigo-700 px-4 py-3 rounded-2xl font-bold items-center justify-center gap-2 border border-indigo-100 hover:bg-indigo-100 transition-all text-xs"
          >
            <Sparkles size={16} /> AI Mode
          </button>
          <button 
            onClick={() => onFilterInvoices({ status: 'sent' })}
            className="flex-1 sm:flex-none bg-blue-50 text-blue-700 px-4 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 border border-blue-100 hover:bg-blue-100 transition-all text-xs"
          >
            <Clock size={16} /> Job Queue
          </button>
          <button 
            onClick={onCreateInvoice}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all text-sm"
          >
            <Plus size={20} /> <span className="sm:inline">New Invoice</span>
          </button>
        </div>
      </div>

      {/* Mobile-Only Action Shortcuts */}
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        <button 
          onClick={() => {
            const sidebarItems = document.querySelectorAll('nav button');
            const aiItem = Array.from(sidebarItems).find(btn => btn.textContent?.includes('AI Assistant')) as HTMLButtonElement;
            if (aiItem) aiItem.click();
          }}
          className="bg-indigo-600 text-white p-4 rounded-3xl font-bold flex flex-col items-center justify-center gap-2 shadow-lg shadow-indigo-200"
        >
          <Sparkles size={24} />
          <span className="text-[10px] uppercase tracking-widest">AI Agent</span>
        </button>
        <button 
          onClick={onCreateEstimate}
          className="bg-white border-2 border-slate-100 text-slate-700 p-4 rounded-3xl font-bold flex flex-col items-center justify-center gap-2 shadow-sm"
        >
          <Receipt size={24} className="text-blue-500" />
          <span className="text-[10px] uppercase tracking-widest">New Quote</span>
        </button>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          label="MTD Revenue"
          value={formatCurrency(stats.monthlySales)}
          change={0}
          trend="neutral"
          icon={<DollarSign size={16} />}
          theme={theme}
        />
        <StatCard 
          label="MTD Expenses"
          value={formatCurrency(stats.monthlyExpenses)}
          change={0}
          trend="neutral"
          icon={<ArrowUpRight size={16} className={cn("rotate-90", theme === 'cyber' ? "text-rose-400" : "text-red-500")} />}
          theme={theme}
        />
        <StatCard 
          label="Pending Payment"
          value={formatCurrency(stats.totalPending)}
          change={0}
          trend="neutral"
          icon={<Clock size={16} />}
          theme={theme}
        />
        <StatCard 
          label="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          change={0}
          trend="neutral"
          icon={<TrendingUp size={16} />}
          theme={theme}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repair Shop Special: Payment Breakdown */}
        <div className={cn(
          "shadow-sm overflow-hidden flex flex-col border",
          "bg-card border-border rounded-2xl",
          theme === 'minimalist' && "rounded-none shadow-none"
        )}>
          <div className={cn(
            "px-6 py-4 border-b flex items-center justify-between",
            "border-border"
          )}>
            <h3 className="text-sm font-bold text-foreground">Today's Revenue Split</h3>
          </div>
          <div className="p-6 flex-1 space-y-4">
            {paymentSplit.map((item) => {
              const percentage = stats.todaySales > 0 ? (item.value / stats.todaySales) * 100 : 0;
              return (
                <button 
                  key={item.name} 
                  onClick={() => onFilterInvoices({ paymentMethod: item.name })}
                  className="w-full text-left space-y-1.5 group outline-none"
                >
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="flex items-center gap-2 group-hover:text-primary transition-colors text-muted-foreground">
                       {item.name === 'Cash' && <Banknote size={14} className="text-success" />}
                       {item.name === 'Card' && <CreditCard size={14} className="text-info" />}
                       {item.name === 'Bank Transfer' && <Smartphone size={14} className="text-info" />}
                       {item.name}
                    </span>
                    <span className="transition-colors text-foreground">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden border border-border bg-muted transition-colors">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={cn(
                        "h-full rounded-full",
                        item.name === 'Cash' ? "bg-success" : 
                        item.name === 'Card' ? "bg-info" : 
                        item.name === 'Bank Transfer' ? "bg-info" : "bg-muted-foreground"
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Sales Chart */}
        <div className={cn(
          "lg:col-span-2 shadow-sm overflow-hidden flex flex-col border",
          "bg-card border-border rounded-2xl",
          theme === 'minimalist' && "rounded-none shadow-none"
        )}>
          <div className={cn(
            "px-6 py-4 border-b flex items-center justify-between",
            "border-border"
          )}>
            <div className="flex bg-muted p-0.5 rounded-lg border border-border">
              <button 
                onClick={() => setChartMode('weekly')}
                className={cn(
                  "px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all rounded-md",
                  chartMode === 'weekly' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Weekly
              </button>
              <button 
                onClick={() => setChartMode('monthly')}
                className={cn(
                  "px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all rounded-md",
                  chartMode === 'monthly' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Yearly Trend
              </button>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border italic bg-muted border-border text-muted-foreground">
              {chartMode === 'weekly' ? 'Mon - Sun Comparison' : 'Last 12 Months'}
            </span>
          </div>
          
          <div className="p-6 h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartMode === 'weekly' ? weeklySalesData : yearlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'cyber' ? '#334155' : '#f1f5f9'} />
                <XAxis 
                  dataKey={chartMode === 'weekly' ? "day" : "name"} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: theme === 'cyber' ? '#94a3b8' : '#64748b' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: theme === 'cyber' ? '#94a3b8' : '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                            {chartMode === 'weekly' ? payload[0].payload.day : payload[0].payload.name}
                          </p>
                          <p className="text-sm font-black">{formatCurrency(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="sales" 
                  radius={[6, 6, 0, 0]}
                  barSize={chartMode === 'weekly' ? 32 : 16}
                >
                  {(chartMode === 'weekly' ? weeklySalesData : yearlyTrendData).map((entry, index) => {
                    let isCurrent = false;
                    if (chartMode === 'weekly') {
                      const d = new Date();
                      const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
                      isCurrent = index === dayIndex;
                    } else {
                      isCurrent = index === (yearlyTrendData.length - 1);
                    }
                    
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isCurrent ? (theme === 'cyber' ? '#22d3ee' : '#2563eb') : (theme === 'cyber' ? '#1e293b' : '#e2e8f0')} 
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="px-6 pb-6">
             <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between gap-4 border border-slate-100">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <TrendingUp size={20} />
                   </div>
                   <div>
                      <p className="text-xs font-bold text-slate-800">Daily Target Progress</p>
                      <p className="text-[10px] text-slate-500 font-medium">Goal: $1,500 today</p>
                   </div>
                </div>
                <div className="flex-1 max-w-[200px]">
                   <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-blue-600">{Math.round((stats.todaySales / 1500) * 100)}%</span>
                      <span className="text-slate-400">$1,500</span>
                   </div>
                   <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((stats.todaySales / 1500) * 100, 100)}%` }} />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table (Small) */}
      <div className={cn(
        "shadow-sm overflow-hidden border",
        "bg-card border-border rounded-2xl",
        theme === 'minimalist' && "rounded-none shadow-none"
      )}>
        <div className={cn(
          "px-6 py-4 border-b flex items-center justify-between",
          "border-border"
        )}>
          <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
          <button 
            onClick={() => onFilterInvoices({})}
            className="text-[10px] font-black uppercase tracking-widest hover:underline transition-all text-primary"
          >
            View All Sales
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] font-black uppercase tracking-widest bg-muted/30 text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3 hidden sm:table-cell">Device / Service</th>
                <th className="px-6 py-3 text-center hidden xs:table-cell">Payment</th>
                <th className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentInvoices.map(inv => (
                <tr 
                  key={inv.id} 
                  className="transition-colors cursor-pointer group hover:bg-muted/30"
                  onClick={() => onEditInvoice(inv)}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold transition-colors text-foreground group-hover:text-primary">{inv.customerName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-muted-foreground font-bold sm:hidden">{inv.items[0]?.modelName || 'N/A'}</span>
                        <span className={cn(
                          "text-[9px] font-black px-1.5 py-0.5 rounded italic",
                          inv.type === 'estimate' 
                            ? "bg-warning/10 text-warning border border-warning/20" 
                            : "text-muted-foreground"
                        )}>
                          {inv.type === 'estimate' ? 'Quote' : inv.date}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{inv.items[0]?.modelName || 'N/A'}</span>
                      <span className="text-[9px] text-muted-foreground/60 uppercase font-black tracking-widest">{inv.items[0]?.serviceName || 'No Item'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center hidden xs:table-cell">
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider",
                      inv.paymentMethod === 'Cash' ? "bg-success/10 text-success border-success/20" :
                      inv.paymentMethod === 'Card' ? "bg-info/10 text-info border-info/20" :
                      "bg-muted text-muted-foreground border-border"
                    )}>
                      {inv.paymentMethod || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-foreground">{formatCurrency(inv.total)}</span>
                  </td>
                </tr>
              ))}
              {recentInvoices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-muted-foreground italic text-sm">No invoices found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
