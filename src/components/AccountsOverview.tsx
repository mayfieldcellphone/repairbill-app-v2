import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PAYABLES, RECEIVABLES } from '@/src/lib/mockData';
import { PayableReceivable } from '@/src/lib/types';
import { cn } from '@/lib/utils';

export function AccountsOverview({ settings }: { settings: any }) {
  const theme = settings?.appTheme || 'modern';
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: settings?.currency || 'AUD',
    }).format(amount);
  };

  const getStatusBadge = (status: PayableReceivable['status']) => {
    switch (status) {
      case 'overdue':
        return <Badge className={cn("border-none", theme === 'cyber' ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600 hover:bg-red-100")}>Overdue</Badge>;
      case 'upcoming':
        return <Badge className={cn("border-none", theme === 'cyber' ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600 hover:bg-blue-100")}>Upcoming</Badge>;
      case 'paid':
        return <Badge className={cn("border-none", theme === 'cyber' ? "bg-emerald-500/10 text-emerald-400" : "bg-green-50 text-green-600 hover:bg-green-100")}>Paid</Badge>;
    }
  };

  const AccountSection = ({ title, data, type }: { title: string, data: PayableReceivable[], type: 'payable' | 'receivable' }) => (
    <Card className={cn(
      "border shadow-sm flex-1 overflow-hidden",
      theme === 'cyber' ? "bg-slate-900 border-slate-800 rounded-[2rem]" : 
      theme === 'minimalist' ? "bg-white border-zinc-200 rounded-none shadow-none" :
      "rounded-xl border-slate-200"
    )}>
      <CardHeader className={cn(
        "pb-3 border-b",
        theme === 'cyber' ? "bg-slate-800/50 border-slate-800" : theme === 'minimalist' ? "bg-zinc-50 border-zinc-200" : "bg-white border-slate-50"
      )}>
        <CardTitle className={cn(
          "text-[10px] font-black uppercase tracking-[2px]",
          theme === 'cyber' ? "text-cyan-400 italic" : "text-slate-500"
        )}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className={cn(theme === 'cyber' ? "bg-slate-800/20" : "bg-slate-50/50")}>
            <TableRow className={cn(theme === 'cyber' ? "border-slate-800" : "border-slate-100")}>
              <TableHead className="text-[10px] uppercase font-bold text-slate-400 py-3 px-6 italic">Entity</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-slate-400 py-3 text-center italic">Due Date</TableHead>
              <TableHead className="text-right text-[10px] uppercase font-bold text-slate-400 py-3 px-6 italic">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id} className={cn(
                "transition-colors",
                theme === 'cyber' ? "border-slate-800 hover:bg-slate-800/30" : "border-slate-50 hover:bg-slate-50/50"
              )}>
                <TableCell className={cn(
                  "font-bold px-6 text-sm",
                  theme === 'cyber' ? "text-slate-300" : "text-slate-900"
                )}>{item.partner}</TableCell>
                <TableCell className="text-slate-500 text-xs text-center font-mono">{item.dueDate}</TableCell>
                <TableCell className={cn(
                  "text-right font-black px-6",
                  type === 'receivable' ? (theme === 'cyber' ? "text-cyan-400" : "text-blue-600") : (theme === 'cyber' ? "text-slate-100" : "text-slate-900")
                )}>
                  {formatCurrency(item.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn(
      "grid grid-cols-1 lg:grid-cols-2 gap-6",
      theme === 'cyber' && "text-slate-100",
      theme === 'minimalist' && "font-serif"
    )}>
      <AccountSection title="Accounts Receivable" data={RECEIVABLES} type="receivable" />
      <AccountSection title="Accounts Payable" data={PAYABLES} type="payable" />
    </div>
  );
}
