import React from 'react';
import { Invoice, InvoiceSettings } from '../lib/types';
import { cn } from '@/lib/utils';

interface InvoiceTemplateProps {
  invoice: Invoice;
  settings: InvoiceSettings;
  id?: string;
  className?: string;
}

export function InvoiceTemplate({ invoice, settings, id, className }: InvoiceTemplateProps) {
  const formatPrice = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: settings.currency && settings.currency.length === 3 ? settings.currency : 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.round(amount));
    } catch (e) {
      return `$${amount.toLocaleString()}`;
    }
  };

  const template = settings.template || 'modern';
  const isQuote = invoice.type === 'estimate';
  const DocumentType = isQuote ? 'QUOTE' : 'TAX INVOICE';

  const companyNameClass = cn(
    "font-bold",
    settings.companyNameSize === 'sm' ? "text-sm" :
    settings.companyNameSize === 'md' ? "text-lg" :
    settings.companyNameSize === 'lg' ? "text-xl" :
    settings.companyNameSize === 'xl' ? "text-2xl" : "text-xl",
    template === 'modern' ? "tracking-tight font-black" : ""
  );

  if (template === 'classic') {
    return (
      <div 
        id={id} 
        className={cn(
          "bg-white p-12 max-w-[800px] mx-auto text-slate-900 font-serif border-4 border-slate-900 shadow-sm print:shadow-none",
          className
        )}
      >
        <div className="flex justify-between items-center border-b-4 border-slate-900 pb-8 mb-8">
          <div className="flex items-center gap-4">
             {settings.logo && <img src={settings.logo} alt="Logo" className="w-12 h-12 object-contain" />}
             <h1 className="text-5xl font-serif font-black tracking-tighter text-slate-900">{DocumentType}</h1>
          </div>
          <div className="text-right font-serif text-slate-900">
            {!settings.hideCompanyName && (
              <p className={companyNameClass}>{settings.companyName}</p>
            )}
            <p className="text-xs text-slate-500">{settings.address}</p>
            <p className="text-[10px] text-slate-500/70">{settings.website}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12 text-xs font-serif text-slate-900">
          <div>
            <h4 className="font-bold border-b border-slate-200 mb-2 uppercase tracking-tighter">Bill To</h4>
            <p className="font-bold text-sm">{invoice.customerName}</p>
            {invoice.customerCompany && <p className="font-medium text-slate-600">{invoice.customerCompany}</p>}
            <p className="font-medium">{invoice.customerEmail}</p>
            <p>{invoice.customerPhone || 'Walk-in Customer'}</p>
          </div>
          <div className="text-right">
            <h4 className="font-bold border-b border-slate-200 mb-2 uppercase tracking-tighter">Order Info</h4>
            <p>No: {invoice.invoiceNumber}</p>
            <p>Date: {invoice.date}</p>
            <p>Due: {invoice.dueDate}</p>
            {invoice.paymentMethod && <p>Method: {invoice.paymentMethod}</p>}
          </div>
        </div>

        <table className="w-full text-left border-collapse font-serif flex-1 mb-12">
          <thead className="bg-slate-900 text-white text-[10px] uppercase">
            <tr>
              <th className="p-2">Description</th>
              <th className="p-2 text-center">Qty</th>
              <th className="p-2 text-right">Price</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-900">
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="p-2">
                  <p className="font-bold italic">{item.serviceName}</p>
                  <p className="text-xs text-slate-500">{item.brandName} {item.modelName}</p>
                </td>
                <td className="p-2 text-center bg-slate-50">{item.quantity}</td>
                <td className="p-2 text-right">{formatPrice(item.price)}</td>
                <td className="p-2 text-right font-bold">{formatPrice(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 flex justify-end font-serif text-slate-900 mb-12">
          <div className="w-64 space-y-1">
            {!settings.taxInclusive && (
               <>
                 <div className="flex justify-between text-sm py-1">
                   <span>Subtotal:</span>
                   <span>{formatPrice(invoice.subtotal)}</span>
                 </div>
                 <div className="flex justify-between text-sm py-1">
                   <span>GST ({settings.taxRate}%):</span>
                   <span>{formatPrice(invoice.taxAmount)}</span>
                 </div>
               </>
            )}
            <div className="flex justify-between border-t-2 border-slate-900 pt-2 font-bold text-lg">
              <span>{settings.taxInclusive ? 'Total (Inc. GST):' : 'Total:'}</span>
              <span>{formatPrice(invoice.total)}</span>
            </div>
          </div>
        </div>
        
        <div className="pt-16 mt-auto">
          <p className="text-[10px] text-slate-500 italic mb-8 border-l-2 border-slate-300 pl-4 py-1">
            {settings.footerMessage || `Warranty: All screen repairs include ${settings.warrantyPeriod}.`}
            {settings.notes && <><br/>{settings.notes}</>}
          </p>
        </div>
      </div>
    );
  }

  if (template === 'minimalist') {
    return (
      <div 
        id={id} 
        className={cn(
          "bg-white p-12 max-w-[800px] mx-auto text-slate-900 font-sans tracking-tight border border-slate-100 shadow-sm rounded-xl print:shadow-none print:border-none",
          className
        )}
      >
        <div className="flex justify-between items-start mb-20">
          {settings.logo ? (
            <img src={settings.logo} alt="Logo" className="w-16 h-16 object-contain grayscale" />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm ring-1 ring-slate-200" style={{ backgroundColor: settings.primaryColor }}>
              <span className="font-bold text-xl">{settings.companyName[0]}</span>
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">REF NO</p>
            <p className="text-lg font-medium">#{invoice.invoiceNumber}</p>
            <div className={cn(
              "inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2",
              invoice.status === 'paid' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
              invoice.status === 'sent' ? "bg-blue-50 text-blue-600 border border-blue-100" :
              "bg-slate-100 text-slate-500 border border-slate-200"
            )}>
              {invoice.status}
            </div>
          </div>
        </div>

        <div className="mb-20">
          <h1 className="text-6xl font-thin text-slate-200 -ml-1 mb-8 italic">{DocumentType}</h1>
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="font-black text-slate-900 mb-4 uppercase tracking-widest text-[9px] border-b border-slate-200 pb-1">Provider</p>
              {!settings.hideCompanyName && (
                <p className={companyNameClass}>{settings.companyName}</p>
              )}
              <p className="text-slate-500 mt-1">{settings.address}</p>
              <p className="text-slate-500">{settings.phone}</p>
              <p className="text-slate-500">{settings.website}</p>
              <p className="text-slate-500">{settings.email}</p>
            </div>
            <div>
              <p className="font-black text-slate-900 mb-4 uppercase tracking-widest text-[9px] border-b border-slate-200 pb-1">Recipient</p>
              <p className="text-slate-900 font-bold">{invoice.customerName}</p>
              {invoice.customerCompany && <p className="text-slate-600">{invoice.customerCompany}</p>}
              <p className="text-slate-500">{invoice.customerEmail}</p>
              <p className="text-slate-500">{invoice.customerPhone || 'Walk-in Customer'}</p>
              <p className="text-slate-500 mt-2 font-medium">Date: {invoice.date}</p>
              <p className="text-slate-500 font-medium">Due: {invoice.dueDate}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6 mb-20">
          {invoice.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-end border-b border-slate-200 pb-4">
              <div>
                <span className="text-sm font-medium block">{item.serviceName}</span>
                <span className="text-xs text-slate-500">{item.brandName} {item.modelName} (Qty: {item.quantity})</span>
              </div>
              <span className="text-sm font-bold">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col items-end">
          {!settings.taxInclusive && (
            <div className="w-64 space-y-2 mb-4 text-sm text-right">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="text-slate-900 font-medium">{formatPrice(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST ({settings.taxRate}%)</span>
                <span className="text-slate-900 font-medium">{formatPrice(invoice.taxAmount)}</span>
              </div>
            </div>
          )}
          <div className="w-full flex justify-between items-baseline border-t border-slate-200 pt-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{settings.taxInclusive ? 'Total Amount (Inc. GST)' : 'Total Amount'}</span>
            <span className="text-4xl font-black italic">{formatPrice(invoice.total)}</span>
          </div>
        </div>

        <div className="mt-24 pt-8">
          <p className="text-[10px] text-slate-500 italic mb-4 border-l-2 border-slate-200 pl-4 py-1">
            {settings.footerMessage || `Warranty: All screen repairs include ${settings.warrantyPeriod}.`}
            {settings.notes && <><br/>{settings.notes}</>}
          </p>
        </div>
      </div>
    );
  }

  // Modern Template (Default)
  return (
    <div 
      id={id} 
      className={cn(
        "bg-white p-12 max-w-[800px] mx-auto text-slate-900 font-sans border border-slate-100 shadow-sm rounded-xl print:shadow-none print:border-none",
        className
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
           {settings.logo ? (
             <img src={settings.logo} alt="Company Logo" className="w-auto h-20 mb-4 object-contain" />
           ) : (
             <div 
               className="w-16 h-16 mb-4 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg"
               style={{ backgroundColor: settings.primaryColor }}
             >
               {settings.companyName[0]}
             </div>
           )}
           {!settings.hideCompanyName && (
             <h3 className={companyNameClass}>{settings.companyName}</h3>
           )}
           <div className="text-xs text-slate-500 space-y-1 mt-2">
             <p>{settings.address}</p>
             <p>{settings.phone} • {settings.email}</p>
             {settings.website && <p>{settings.website}</p>}
           </div>
        </div>
        <div className="text-right space-y-1">
          <h1 className="text-4xl font-black text-slate-200 tracking-tighter mb-2 italic">
            {DocumentType}
          </h1>
          <p className="text-sm font-bold text-slate-800">#{invoice.invoiceNumber}</p>
          <div className="mt-4 text-xs text-slate-500">
            <p className="font-bold uppercase tracking-wider mb-1">Date: {invoice.date}</p>
            <p className="font-bold uppercase tracking-wider mb-2">Due: {invoice.dueDate}</p>
          </div>
          <div className={cn(
            "inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2",
            invoice.status === 'paid' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
            invoice.status === 'sent' ? "bg-blue-50 text-blue-600 border border-blue-100" :
            "bg-slate-100 text-slate-500 border border-slate-200"
          )}>
            {invoice.status}
          </div>
        </div>
      </div>

      <div className="mb-12">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Bill To</p>
        <div className="text-sm">
          <p className="font-bold text-slate-900">{invoice.customerName}</p>
          {invoice.customerCompany && <p className="text-slate-600">{invoice.customerCompany}</p>}
          <p className="text-slate-500">{invoice.customerEmail}</p>
          <p className="text-slate-500">{invoice.customerPhone || 'Walk-in Customer'}</p>
          {invoice.paymentMethod && <p className="text-slate-500 mt-2 text-xs">Payment Method: <span className="font-bold">{invoice.paymentMethod}</span></p>}
        </div>
      </div>

      <div className="flex-1 mb-12">
        <div className="grid grid-cols-12 border-b-2 border-slate-900 pb-3 mb-4 text-[10px] font-bold text-slate-900 uppercase">
          <div className="col-span-7 px-1">Description</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-3 text-right">Amount</div>
        </div>
        <div className="space-y-4">
          {invoice.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 items-center text-sm border-b border-slate-100 pb-4">
              <div className="col-span-7 px-1">
                <p className="font-bold text-slate-900">{item.serviceName}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{item.brandName} {item.modelName}</p>
              </div>
              <div className="col-span-2 text-center font-medium bg-slate-50 py-2 rounded-lg">{item.quantity}</div>
              <div className="col-span-3 text-right font-black">{formatPrice(item.price * item.quantity)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end mb-12">
        <div className="w-64 space-y-3">
          {!settings.taxInclusive && (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold uppercase tracking-tighter">Subtotal</span>
                <span className="font-bold text-slate-800">{formatPrice(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold uppercase tracking-tighter">GST ({settings.taxRate}%)</span>
                <span className="font-bold text-slate-800">{formatPrice(invoice.taxAmount)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900">
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
              {settings.taxInclusive ? 'Total (Inc. GST)' : 'Total'}
            </span>
            <span className="text-2xl font-black" style={{ color: settings.primaryColor }}>{formatPrice(invoice.total)}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-8 text-center space-y-4 mt-auto">
        <p className="text-sm font-bold text-slate-800 italic">Thank you for choosing {settings.companyName}!</p>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
          {settings.footerMessage || `Warranty: All screen repairs include ${settings.warrantyPeriod}. Liquid damage or physical abuse voids warranty.`}
        </div>
        {settings.notes && (
           <p className="text-[9px] text-slate-400 mt-4 border-t border-slate-50 pt-4 italic">{settings.notes}</p>
        )}
      </div>
    </div>
  );
}
