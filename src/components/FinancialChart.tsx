import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { CHART_DATA } from '../lib/mockData';

export function FinancialChart() {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col min-h-0 min-w-0">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-semibold text-slate-800">Cash Flow Trend</h3>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] uppercase font-bold text-slate-500">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="text-[10px] uppercase font-bold text-slate-500">Expenses</span>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full min-h-0 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#64748b' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(value) => `$${value/1000}k`}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                fontSize: '11px'
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Area 
              type="monotone" 
              dataKey="income" 
              stroke="#2563eb" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorIncome)" 
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stroke="#cbd5e1" 
              strokeWidth={2}
              fill="transparent" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
