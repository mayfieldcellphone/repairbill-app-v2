import { Invoice, InvoiceSettings, Brand } from "../lib/types";

export async function processInvoiceRequest(
  prompt: string, 
  settings: InvoiceSettings,
  brands: Brand[],
  recentInvoices: Invoice[] = [],
  expenses: any[] = [],
  leads: any[] = []
) {
  try {
        // Verified stats: computed here, in code, over the FULL invoice/expense
    // lists using the exact same logic as the dashboard (RepairDashboard.tsx).
    // The AI is sent these numbers directly and is told never to add up the
    // invoice list itself -- that's what caused wrong monthly totals before.
    const today = (() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();
    const currentMonthStr = today.substring(0, 7); // YYYY-MM

    const allInvoicesForStats = (recentInvoices || []).filter(inv => inv.type === 'invoice');
    const monthlyInvoicesForStats = allInvoicesForStats.filter(inv => (inv.date || '').startsWith(currentMonthStr));
    const monthlySales = monthlyInvoicesForStats.reduce((acc, inv) => acc + (inv.total || 0), 0);
    const todaySales = allInvoicesForStats.filter(inv => inv.date === today).reduce((acc, inv) => acc + (inv.total || 0), 0);
    const monthlyExpensesListForStats = (expenses || []).filter((exp: any) => (exp.date || '').startsWith(currentMonthStr));
    const monthlyExpenses = monthlyExpensesListForStats.reduce((acc: number, exp: any) => acc + (exp.amount || 0), 0);
    const pendingInvoicesForStats = (recentInvoices || []).filter(inv => inv.type === 'invoice' && ['sent', 'draft', 'overdue'].includes(inv.status));
    const totalPending = pendingInvoicesForStats.reduce((acc, inv) => acc + (inv.total || 0), 0);

    const verifiedStats = {
      today,
      currentMonth: currentMonthStr,
      monthlySales,
      monthlyInvoiceCount: monthlyInvoicesForStats.length,
      todaySales,
      monthlyExpenses,
      totalPending,
      pendingInvoiceCount: pendingInvoicesForStats.length,
      totalInvoiceCountAllTime: allInvoicesForStats.length
    };

    // Slice to top 20 items and map to only necessary properties to minimize payload size
    const topInvoices = (recentInvoices || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 20).map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      total: inv.total,
      status: inv.status,
      date: inv.date,
      paymentMethod: inv.paymentMethod || "Cash"
    }));

    const topExpenses = (expenses || []).slice(0, 20).map(exp => ({
      description: exp.description,
      amount: exp.amount,
      category: exp.category,
      date: exp.date,
      paymentMethod: exp.paymentMethod || "Cash"
    }));

    const topLeads = (leads || []).slice(0, 20).map(lead => ({
      customerName: lead.customerName,
      type: lead.type,
      status: lead.status,
      createdAt: lead.createdAt || lead.date,
      brand: lead.metadata?.brand,
      model: lead.metadata?.model,
      company: lead.metadata?.companyName
    }));

    const response = await fetch("/api/ai/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        settings,
        brands,
        recentInvoices: topInvoices,
        expenses: topExpenses,
        leads: topLeads,
        verifiedStats
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.details || errData.error || `Server responded with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "AI Assistant server returned success: false");
    }

    return data.response;
  } catch (error) {
    console.error("AI Assistant service client error:", error);
    throw error;
  }
}
