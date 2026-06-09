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
    // Slice to top 20 items and map to only necessary properties to minimize payload size
    const topInvoices = (recentInvoices || []).slice(0, 20).map(inv => ({
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
        leads: topLeads
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
