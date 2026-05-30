import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  TrendingDown, 
  Minus 
} from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
}

export function StatCard({ label, value, change, trend, icon, theme }: StatCardProps & { theme?: string }) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  return (
    <div className={cn(
      "p-3 sm:p-4 rounded-2xl border shadow-sm flex flex-col justify-between h-28 sm:h-32 relative overflow-hidden group transition-all duration-300",
      "bg-card border-border shadow-sm",
      theme === 'minimalist' && "rounded-none shadow-none"
    )}>
      <div className={cn(
        "absolute top-0 right-0 p-3 transition-opacity",
        "opacity-10 group-hover:opacity-20 text-primary"
      )}>
        {icon}
      </div>
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="text-2xl font-black mt-1 tracking-tight text-foreground">{value}</div>
      </div>
      {trend !== 'neutral' && change !== 0 && (
        <div className={cn(
          "flex items-center text-[10px] font-semibold",
          isPositive && "text-emerald-500",
          isNegative && "text-destructive"
        )}>
          {isPositive && <TrendingUp size={12} className="mr-1" />}
          {isNegative && <TrendingDown size={12} className="mr-1" />}
          {Math.abs(change)}% vs last month
        </div>
      )}
    </div>
  );
}
