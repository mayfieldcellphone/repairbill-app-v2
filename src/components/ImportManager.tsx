import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Database, Upload, CheckCircle2, AlertCircle, Trash2, ArrowRight, Save, Filter } from 'lucide-react';
import { Invoice, InvoiceSettings, InvoiceItem } from '../lib/types';
import { v4 as uuidv4 } from 'uuid';

interface RawInvoice {
  ID: string;
  Number: string;
  Date: string;
  Customer: string;
  Phone: string | null;
  Email: string | null;
  Device: string | null;
  Status: string;
  Total: number;
  'Invoice #': string;
}

interface ImportManagerProps {
  settings: InvoiceSettings;
  onImport: (invoices: Invoice[]) => Promise<void>;
}

export function ImportManager({ settings, onImport }: ImportManagerProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [analyzedData, setAnalyzedData] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [duplicates, setDuplicates] = useState<RawInvoice[]>([]);
  const [showDups, setShowDups] = useState(false);

  const [ignoreCheck, setIgnoreCheck] = useState(false);

  const handleAnalyze = () => {
    try {
      setError(null);
      const raw: RawInvoice[] = JSON.parse(jsonInput);
      if (!Array.isArray(raw)) throw new Error('Input must be a JSON array');

      // 1. Sort by Date, then by Numeric part of original Number
      const sorted = [...raw].sort((a, b) => {
        const dateA = new Date(a.Date).getTime();
        const dateB = new Date(b.Date).getTime();
        
        if (dateA !== dateB) return dateA - dateB;

        // Try to extract numeric part of the allocated number (e.g., INV-009996 -> 9996)
        const getNum = (s: string) => {
          const m = s.match(/\d+/);
          return m ? parseInt(m[0], 10) : 0;
        };

        const numA = getNum(a.Number || '');
        const numB = getNum(b.Number || '');

        if (numA !== numB) return numA - numB;
        
        return (a.Number || '').localeCompare(b.Number || '');
      });

      // 2. Detect Duplicates
      const seenKeys = new Set<string>();
      const processed: Invoice[] = [];
      const dups: RawInvoice[] = [];

      sorted.forEach((item) => {
        // Compound key for safety, but check if we should ignore it
        const uniqueKey = item.ID || `${item.Date}-${item.Total}-${item.Customer}-${item.Number}`;
        
        if (!ignoreCheck && seenKeys.has(uniqueKey)) {
          dups.push(item);
        } else {
          seenKeys.add(uniqueKey);

          const taxRate = settings.taxRate / 100;
          let subtotal = 0;
          let taxAmount = 0;
          
          if (settings.taxInclusive) {
             subtotal = Math.round(item.Total / (1 + taxRate));
             taxAmount = item.Total - subtotal;
          } else {
             // In legacy imports, if not tax inclusive we typically just assume Total provided was subtotal + tax.
             // We'll calculate subtotal as total / (1 + GST) even if not inclusive, cause 'Total' usually implies the final amount paid.
             subtotal = Math.round(item.Total / (1 + taxRate));
             taxAmount = item.Total - subtotal;
          }

          processed.push({
            id: uuidv4(), // Generate fresh ID to avoid collisions in our DB
            invoiceNumber: item['Invoice #'] || item.Number || `${settings.invoicePrefix}${String(processed.length + 1).padStart(5, '0')}`,
            customerName: item.Customer || 'Walk-in',
            customerEmail: item.Email || '',
            customerPhone: item.Phone || '',
            date: item.Date,
            dueDate: item.Date,
            items: item.Device ? [{
              id: uuidv4(),
              serviceId: 'imported',
              brandName: 'Other',
              modelName: item.Device,
              serviceName: 'Repair Service',
              price: item.Total,
              quantity: 1
            }] : [{
              id: uuidv4(),
              serviceId: 'imported',
              brandName: 'Service',
              modelName: 'Legacy Import',
              serviceName: 'Repair Service',
              price: item.Total,
              quantity: 1
            }],
            subtotal: subtotal,
            taxAmount: taxAmount,
            total: item.Total,
            status: (item.Status?.toLowerCase() === 'paid') ? 'paid' : 'sent',
            type: 'invoice',
            customerNotes: `Legacy Order: ${item.Number || 'N/A'}`
          });
        }
      });

      setDuplicates(dups);
      setAnalyzedData(processed);
    } catch (e: any) {
      setError('JSON Error: ' + e.message);
      setAnalyzedData(null);
    }
  };

  const handleConfirmImport = async () => {
    if (!analyzedData) return;
    setIsImporting(true);
    try {
      await onImport(analyzedData);
      setAnalyzedData(null);
      setJsonInput('');
      setDuplicates([]);
      alert(`Successfully imported ${analyzedData.length} invoices!`);
    } catch (e: any) {
      setError('Import failed: ' + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Database size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">Legacy Data Import</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Migrate your old records</p>
            </div>
          </div>
          {analyzedData && (
            <button 
              onClick={() => { setAnalyzedData(null); setDuplicates([]); }}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Reset Import
            </button>
          )}
        </div>

        {!analyzedData ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Paste JSON Invoices Array (all 2000+ records)</label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="[ { 'ID': '...', 'Number': 'INV-001', ... }, ... ]"
                className="w-full h-96 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-[10px] focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100 animate-shake">
                <AlertCircle size={18} />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <input 
                  type="checkbox" 
                  id="ignoreCheck"
                  checked={ignoreCheck}
                  onChange={(e) => setIgnoreCheck(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="ignoreCheck" className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer">
                  Include potential duplicates (Import all records exactly as provided)
                </label>
              </div>
              
              <button
                onClick={handleAnalyze}
                disabled={!jsonInput}
                className="w-full bg-slate-900 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                Analyze Records <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Found</p>
                <p className="text-2xl font-black text-blue-600">{analyzedData.length + duplicates.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Ready to Import</p>
                <p className="text-2xl font-black text-green-600">{analyzedData.length}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Duplicates Skipped</p>
                <p className="text-2xl font-black text-amber-600">{duplicates.length}</p>
                {duplicates.length > 0 && (
                  <button 
                    onClick={() => setShowDups(!showDups)}
                    className="text-[9px] font-black text-amber-600 underline uppercase mt-2"
                  >
                    {showDups ? 'Hide Details' : 'View Skipped Records'}
                  </button>
                )}
              </div>
            </div>

            {showDups && duplicates.length > 0 && (
               <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 space-y-3">
                 <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Potential Duplicates (Skipped)</h4>
                 <div className="max-h-40 overflow-auto space-y-2">
                   {duplicates.map((d, i) => (
                     <div key={i} className="text-[9px] text-amber-600 flex justify-between bg-white/50 p-2 rounded-lg">
                       <span>{d.Number} - {d.Customer} - {d.Date}</span>
                       <span className="font-bold">${d.Total}</span>
                     </div>
                   ))}
                 </div>
               </div>
            )}

            <div className="max-h-96 overflow-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">New Sequence</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Original Ref</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {analyzedData.slice(0, 100).map((inv) => (
                    <tr key={inv.id} className="text-xs hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-black text-blue-600">{inv.invoiceNumber}</td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">{inv.date}</td>
                      <td className="p-3 font-bold text-slate-700">{inv.customerName}</td>
                      <td className="p-3 text-slate-400">{inv.customerNotes}</td>
                      <td className="p-3 font-black text-slate-900">${inv.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analyzedData.length > 100 && (
                <div className="p-4 text-center bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-t border-slate-100">
                  Showing first 100 records of {analyzedData.length}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => { setAnalyzedData(null); setDuplicates([]); }}
                className="flex-1 bg-white border border-slate-200 text-slate-400 rounded-2xl h-14 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isImporting}
                className="flex-[2] bg-blue-600 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>Importing {analyzedData.length} Records...</>
                ) : (
                  <>Confirm & Import {analyzedData.length} Records <CheckCircle2 size={16} /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
